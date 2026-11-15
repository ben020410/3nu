#!/usr/bin/env python3
"""Exclusive material replacement of the immutable BUILD33 terrain mesh.

Run with ``--write`` after preparing reports/build34/material-regions.json.
No surface overlays, height offsets, or broad terrain refinement are created.
Unchanged chunks retain their original packed vertices and triangle indices.
The optional local refinement is restricted to explicit gradeAreas; split edges
are propagated to neighbouring triangles to avoid T-junctions at material seams.
Use grade-internal34.cjs to apply the same terrain sampler as walking afterwards.
"""
import argparse
import collections
import json
import pathlib
import tempfile
import time

import mapbox_earcut
import numpy as np
import shapely as S
from shapely.geometry import Polygon
from shapely.strtree import STRtree


ROOT = pathlib.Path(__file__).resolve().parents[1]
LIMIT = 25 * 1024 * 1024


def polygon(q):
    return S.make_valid(Polygon(q['outer'], q.get('holes', [])))


def parts(g):
    if g.geom_type == 'Polygon':
        if g.area > 1e-9:
            yield g
    else:
        for p in getattr(g, 'geoms', []):
            yield from parts(p)


def triangulate(g):
    out = []
    for p in parts(g):
        rings = [list(p.exterior.coords)[:-1]] + [list(r.coords)[:-1] for r in p.interiors]
        coords = np.asarray([point for ring in rings for point in ring], dtype=np.float64)
        ends = np.cumsum([len(ring) for ring in rings], dtype=np.uint32)
        ix = mapbox_earcut.triangulate_float64(coords, ends)
        out.append(coords[ix].reshape(-1, 3, 2))
    return np.concatenate(out) if out else np.empty((0, 3, 2))


def lift(t, old):
    if not len(t):
        return np.empty((0, 3, 3), dtype='<f4')
    a, b, c = old[:, [0, 2]]
    cross = lambda u, v: u[..., 0] * v[..., 1] - u[..., 1] * v[..., 0]
    den = cross(b-a, c-a)
    u, v = cross(t-a, c-a)/den, cross(b-a, t-a)/den
    y = old[0, 1] + u*(old[1, 1]-old[0, 1]) + v*(old[2, 1]-old[0, 1])
    return np.stack([t[..., 0], y, t[..., 1]], axis=-1).astype('<f4')


def pack(t):
    """Canonical top-face winding after float32 packing, removing collapsed slivers."""
    t = np.asarray(t, dtype='<f4')
    a = t[:, 1, [0, 2]].astype(float) - t[:, 0, [0, 2]]
    b = t[:, 2, [0, 2]].astype(float) - t[:, 0, [0, 2]]
    area = a[:, 0]*b[:, 1]-a[:, 1]*b[:, 0]
    keep = np.abs(area) > 1e-10
    removed = int((~keep).sum())
    t, area = t[keep], area[keep]
    reverse = area < 0
    t[reverse] = t[reverse][:, [0, 2, 1]]
    vertices, inverse = np.unique(t.reshape(-1, 3), axis=0, return_inverse=True)
    return vertices.astype('<f4'), inverse.astype('<u4').reshape(-1, 3), removed, int(reverse.sum())


def profile_lift(t, q):
    """Initial height for retired cuts; runtime terrain sampling remains authoritative."""
    points = t.reshape(-1, 2)
    profile = np.asarray(q.get('heightProfile', []), dtype=float)
    if len(profile) >= 2:
        best = np.full(len(points), np.inf)
        y = np.zeros(len(points))
        # Profile coordinates are explicitly [world x, world z, world y].
        for a, b in zip(profile[:-1], profile[1:]):
            delta = b[:2]-a[:2]
            length2 = float(delta @ delta)
            if length2 < 1e-12:
                continue
            fraction = np.clip((points-a[:2]) @ delta/length2, 0, 1)
            nearest = a[:2]+fraction[:, None]*delta
            distance2 = np.sum((points-nearest)**2, axis=1)
            take = distance2 < best
            y[take] = (a[2]+fraction*(b[2]-a[2]))[take]
            best[take] = distance2[take]
        if not np.isfinite(best).all():
            raise ValueError(f"Fill {q['id']} has no nonzero height-profile segment")
    elif len(profile) == 1:
        y = np.full(len(points), profile[0, 2])
    elif 'groundY' in q:
        y = np.full(len(points), float(q['groundY']))
    else:
        raise ValueError(f"Fill {q['id']} requires heightProfile or groundY")
    return np.column_stack([points[:, 0], y, points[:, 1]]).reshape(-1, 3, 3).astype('<f4')


def restore_retired_cuts(chunks, fills, exclusions):
    """Fill only holes in the source surface, never cover a surviving triangle.

    A local triangle union per requested footprint avoids constructing a campus-
    wide geometry. Previously restored holes are also included in the subtraction,
    so overlapping requests cannot create duplicate faces.
    """
    reports = []
    for q in fills:
        requested = polygon(q)
        allowed = requested.difference(exclusions)
        if allowed.is_empty:
            reports.append({'id': q['id'], 'requestedAreaM2': requested.area, 'filledAreaM2': 0, 'triangles': 0})
            continue
        S.prepare(allowed)
        existing = []
        for _, vertices, indices in chunks:
            bound = S.box(float(vertices[:, 0].min()), float(vertices[:, 2].min()),
                          float(vertices[:, 0].max()), float(vertices[:, 2].max()))
            if not S.intersects(allowed, bound):
                continue
            t = vertices[indices][:, :, [0, 2]]
            p = S.polygons(t)
            hit = S.intersects(allowed, p)
            if hit.any():
                existing.extend(S.intersection(p[hit], allowed))
        occupied = S.union_all(existing)
        missing = allowed.difference(occupied)
        triangles = triangulate(missing)
        count = 0
        if len(triangles):
            vertices, indices, _, _ = pack(profile_lift(triangles, q))
            count = len(indices)
            if count:
                # Preserve numeric grid metadata; source34 identifies this restored
                # patch even if its grid cell already contains other material parts.
                chunks.append(({'x': int(missing.centroid.x//160), 'z': int(missing.centroid.y//160), 'kind': q['kind'],
                                'source34': q['id']}, vertices, indices))
        reports.append({'id': q['id'], 'requestedAreaM2': requested.area,
                        'excludedAreaM2': requested.area-allowed.area,
                        'existingAreaM2': occupied.area, 'filledAreaM2': missing.area,
                        'overlapWithExistingM2': missing.intersection(occupied).area,
                        'triangles': count})
    return reports


def edge_rows(t):
    """Canonical quantized XYZ endpoints as searchable structured records."""
    a = np.rint(t[:, [0, 1, 2]]*100000).astype(np.int64)
    b = np.rint(t[:, [1, 2, 0]]*100000).astype(np.int64)
    swap = ((a[..., 0] > b[..., 0]) |
            ((a[..., 0] == b[..., 0]) & (a[..., 1] > b[..., 1])) |
            ((a[..., 0] == b[..., 0]) & (a[..., 1] == b[..., 1]) & (a[..., 2] > b[..., 2])))
    rows = np.concatenate([np.where(swap[..., None], b, a), np.where(swap[..., None], a, b)], axis=-1)
    dtype = np.dtype([(f'n{i}', '<i8') for i in range(6)])
    return np.ascontiguousarray(rows).reshape(-1, 6).view(dtype).reshape(-1)


def refine(chunks, grade, edge_length, iterations):
    if grade.is_empty or not edge_length:
        return 0
    original = sum(len(c[2]) for c in chunks)
    S.prepare(grade)
    for iteration in range(iterations):
        keys, midpoints = [], []
        for meta, vertices, indices in chunks:
            t = vertices[indices]
            if not S.intersects(grade, S.box(*S.bounds(S.multipoints(vertices[:, [0, 2]])))):
                continue
            hit = S.intersects(grade, S.polygons(t[:, :, [0, 2]]))
            tt = t[hit]
            if not len(tt):
                continue
            lengths = np.linalg.norm(tt[:, [1, 2, 0]][:, :, [0, 2]] - tt[:, :, [0, 2]], axis=2)
            select = lengths.reshape(-1) > edge_length
            keys.append(edge_rows(tt)[select])
            midpoints.append(((tt+tt[:, [1, 2, 0]])*.5).reshape(-1, 3)[select])
        if not keys or not sum(map(len, keys)):
            break
        all_keys, all_midpoints = np.concatenate(keys), np.concatenate(midpoints)
        marked, unique = np.unique(all_keys, return_index=True)
        mids = all_midpoints[unique]
        replacement = []
        for meta, vertices, indices in chunks:
            t = vertices[indices]
            edges = edge_rows(t)
            where = np.searchsorted(marked, edges)
            exists = (where < len(marked)) & (marked[np.minimum(where, len(marked)-1)] == edges)
            exists = exists.reshape(-1, 3)
            hit = np.any(exists, axis=1)
            if not hit.any():
                replacement.append((meta, vertices, indices))
                continue
            blocks = [t[~hit]]
            split = []
            for tri, flags, loc in zip(t[hit], exists[hit], where.reshape(-1, 3)[hit]):
                present = np.flatnonzero(flags)
                if len(present) == 1:
                    j = present[0]
                    a, b, c, m = tri[j], tri[(j+1)%3], tri[(j+2)%3], mids[loc[j]]
                    split.extend([[a, m, c], [m, b, c]])
                elif len(present) == 2:
                    j = (int(np.flatnonzero(~flags)[0])+1)%3
                    a, b, c = tri[j], tri[(j+1)%3], tri[(j+2)%3]
                    m, n = mids[loc[j]], mids[loc[(j+1)%3]]
                    split.extend([[b, n, m], [a, m, c], [m, n, c]])
                else:
                    a, b, c = tri
                    m, n, p = mids[loc]
                    split.extend([[a, m, p], [m, b, n], [p, n, c], [m, n, p]])
            blocks.append(np.asarray(split, dtype='<f4'))
            v, ix, _, _ = pack(np.concatenate(blocks))
            replacement.append((meta, v, ix))
        chunks[:] = replacement
        count = sum(len(c[2]) for c in chunks)
        print('local refinement', iteration+1, 'edges', len(marked), 'triangles', count, flush=True)
        if count*12 > LIMIT:
            raise RuntimeError('Local refinement exceeds 25 MiB index budget; reduce gradeAreas or raise target edge length.')
    return sum(len(c[2]) for c in chunks)-original


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--source', type=pathlib.Path, default=ROOT/'../../work/baseline34/dist/data')
    ap.add_argument('--output', type=pathlib.Path, default=ROOT/'dist/data')
    ap.add_argument('--regions', type=pathlib.Path, default=ROOT/'reports/build34/material-regions.json')
    ap.add_argument('--report-dir', type=pathlib.Path, default=ROOT/'reports/build34')
    ap.add_argument('--refine-max-edge', type=float, default=0, help='Optional local gradeAreas edge length; default no refinement.')
    ap.add_argument('--refine-iterations', type=int, default=4)
    ap.add_argument('--write', action='store_true', help='Write packed terrain data; default only reports a dry run.')
    args = ap.parse_args()
    start = time.monotonic()
    meta = json.loads((args.source/'ground.json').read_text())
    vertices = np.memmap(args.source/'ground.bin', dtype='<f4', mode='r').reshape(-1, 3)
    indices = np.memmap(args.source/'ground-indices.bin', dtype='<u4', mode='r')
    material = json.loads(args.regions.read_text())
    coverage = S.union_all([polygon(q) for q in material['coverage']])
    grade = S.union_all([polygon(q) for q in material.get('gradeAreas', [])])
    # Regions are clipped to coverage, so a large region can never alter an
    # intersecting source triangle outside the explicitly requested footprint.
    regions = [polygon(q).intersection(coverage) for q in material['regions']]
    tree = STRtree(regions)
    S.prepare(coverage)
    fills = material.get('fillPolygons', [])
    fill_exclusions = S.union_all([polygon(q) for q in material.get('fillExclusions', [])])
    selected = S.union_all([coverage, grade] + [polygon(q) for q in fills])
    S.prepare(selected)
    chunks = []
    changed = unchanged = removed = flipped = 0
    max_error = 0
    replacement_area = collections.Counter()
    for ci, chunk in enumerate(meta['chunks']):
        v = vertices[chunk['offset']//3:chunk['offset']//3+chunk['count']]
        ix = indices[chunk['indexOffset']:chunk['indexOffset']+chunk['indexCount']].reshape(-1, 3)
        bound = S.box(float(v[:, 0].min()), float(v[:, 2].min()), float(v[:, 0].max()), float(v[:, 2].max()))
        cm = {key: value for key, value in chunk.items() if key not in ('offset', 'count', 'indexOffset', 'indexCount')}
        if not S.intersects(coverage, bound):
            chunks.append((cm, v, ix))
            unchanged += len(ix)
            continue
        t = v[ix]
        polys = S.polygons(t[:, :, [0, 2]])
        hits = S.intersects(coverage, polys)
        # Intersections on a shared boundary alone do not require replacement.
        hit_ids = np.flatnonzero(hits)
        if len(hit_ids):
            hit_ids = hit_ids[S.area(S.intersection(polys[hit_ids], coverage)) > 1e-9]
        hits[:] = False
        hits[hit_ids] = True
        unchanged += int((~hits).sum())
        if not len(hit_ids):
            chunks.append((cm, v, ix))
            continue
        blocks = collections.defaultdict(list)
        blocks[chunk['kind']].append(t[~hits])
        for ti in hit_ids:
            tri, p = t[ti].astype(float), polys[ti]
            if p.area < 1e-9:
                removed += 1
                continue
            left, total = p, 0.0
            # File order is explicit ownership order; stable despite STRtree order.
            for j in sorted(tree.query(p, predicate='intersects')):
                q = left.intersection(regions[j])
                if q.area < 1e-9:
                    continue
                left = left.difference(regions[j])
                total += q.area
                replacement_area[material['regions'][j]['id']] += q.area
                blocks[material['regions'][j]['kind']].append(lift(triangulate(q), tri))
            if left.area > 1e-9:
                blocks[chunk['kind']].append(lift(triangulate(left), tri))
            max_error = max(max_error, abs(total+left.area-p.area))
            changed += 1
        for kind, block in blocks.items():
            if not sum(map(len, block)):
                continue
            vv, ii, rr, ff = pack(np.concatenate(block))
            removed += rr
            flipped += ff
            chunks.append(({**cm, 'kind': kind}, vv, ii))
        if ci % 30 == 0:
            print('partition', ci, '/', len(meta['chunks']), 'replaced', changed, flush=True)
    fill_reports = restore_retired_cuts(chunks, fills, fill_exclusions)
    added = refine(chunks, grade, args.refine_max_edge, args.refine_iterations)
    count_v = sum(len(v) for _, v, _ in chunks)
    count_i = sum(ix.size for _, _, ix in chunks)
    report = {'source': str(args.source.resolve()), 'sourceTriangles': meta['triangles'],
              'sourceTrianglesReplaced': changed, 'sourceTrianglesUnchanged': unchanged,
              'partitionErrorM2': max_error, 'collapsedFacesRemoved': removed,
              'facesReoriented': flipped, 'refinementAdded': added,
              'refinementMaxEdge': args.refine_max_edge or None,
              'regionAreaM2': dict(replacement_area), 'vertices': count_v,
              'retiredCutFills': fill_reports,
              'triangles': count_i//3, 'vertexBytes': count_v*12, 'indexBytes': count_i*4,
              'perAssetLimitBytes': LIMIT, 'write': args.write,
              'method': 'exclusive material partition of immutable BUILD33 triangles; no overlays'}
    args.report_dir.mkdir(parents=True, exist_ok=True)
    if max(count_v*12, count_i*4) > LIMIT:
        (args.report_dir/'mesh-partition.json').write_text(json.dumps(report, indent=2))
        raise RuntimeError('Mesh exceeds 25 MiB per asset; no terrain files were written.')
    if args.write:
        args.output.mkdir(parents=True, exist_ok=True)
        output_meta, vo, io, selected_count = [], 0, 0, 0
        # Stage and validate all artifacts before replacing any live data.
        with tempfile.TemporaryDirectory(prefix='mesh34-', dir=args.output.parent) as td:
            temp = pathlib.Path(td)
            with (temp/'ground.bin').open('wb') as vf, (temp/'ground-indices.bin').open('wb') as inf, (temp/'mesh-changed-vertices.bin').open('wb') as sf:
                for cm, v, ix in chunks:
                    np.asarray(v, dtype='<f4').tofile(vf)
                    np.asarray(ix, dtype='<u4').tofile(inf)
                    take = S.intersects_xy(selected, v[:, 0].astype(float), v[:, 2].astype(float))
                    ids = (np.flatnonzero(take)+vo).astype('<u4')
                    ids.tofile(sf)
                    selected_count += len(ids)
                    output_meta.append({**cm, 'offset': vo*3, 'count': len(v), 'indexOffset': io, 'indexCount': ix.size})
                    vo += len(v)
                    io += ix.size
            report['selectedHeightVertices'] = selected_count
            meta.update(chunks=output_meta, vertices=vo, triangles=io//3, bytes=vo*12+io*4, internal34=report)
            (temp/'ground.json').write_text(json.dumps(meta, separators=(',', ':')))
            for name in ('ground.bin', 'ground-indices.bin', 'ground.json'):
                (temp/name).replace(args.output/name)
            (temp/'mesh-changed-vertices.bin').replace(args.report_dir/'mesh-changed-vertices.bin')
    report['seconds'] = round(time.monotonic()-start, 2)
    (args.report_dir/'mesh-partition.json').write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2), flush=True)


if __name__ == '__main__':
    main()
