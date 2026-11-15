#!/usr/bin/env python3
"""Regression checks for exclusive terrain replacement; uses temporary fixtures only."""
import importlib.util
import json
import pathlib
import subprocess
import sys
import tempfile
import numpy as np
import shapely as S

HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('mesh34', HERE/'mesh-internal34.py')
mesh = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mesh)


def read_mesh(folder):
    m = json.loads((folder/'ground.json').read_text())
    v = np.fromfile(folder/'ground.bin', '<f4').reshape(-1, 3)
    i = np.fromfile(folder/'ground-indices.bin', '<u4')
    return m, v, i


with tempfile.TemporaryDirectory(prefix='3nu-mesh34-test-') as td:
    td = pathlib.Path(td)
    source, output, report = td/'source', td/'output', td/'report'
    source.mkdir()
    vertices, indices, chunks = [], [], []
    for x in [0, 20]:
        xz = np.array([[x, 0], [x+10, 0], [x+10, 10], [x, 10]], dtype=float)
        v = np.column_stack([xz[:, 0], 1+.2*xz[:, 0]+.3*xz[:, 1], xz[:, 1]]).astype('<f4')
        vertices.append(v)
        indices.append(np.array([0, 1, 2, 0, 2, 3], dtype='<u4'))
        chunks.append(dict(kind='grass', offset=(len(vertices)-1)*12, count=4,
                           indexOffset=(len(vertices)-1)*6, indexCount=6, x=x, z=0))
    np.concatenate(vertices).tofile(source/'ground.bin')
    np.concatenate(indices).tofile(source/'ground-indices.bin')
    (source/'ground.json').write_text(json.dumps(dict(chunks=chunks, vertices=8, triangles=4)))
    regions = td/'regions.json'
    regions.write_text(json.dumps(dict(
        coverage=[dict(outer=[[2, 2], [8, 2], [8, 8], [2, 8]])],
        regions=[dict(id='plaza', kind='plaza', outer=[[1, 1], [9, 1], [9, 9], [1, 9]],
                      holes=[[[4, 4], [6, 4], [6, 6], [4, 6]]])],
        gradeAreas=[])))
    cmd = [sys.executable, str(HERE/'mesh-internal34.py'), '--source', str(source),
           '--output', str(output), '--regions', str(regions), '--report-dir', str(report), '--write']
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL)
    m, v, ix = read_mesh(output)
    polygons, plaza = [], []
    for c in m['chunks']:
        vv = v[c['offset']//3:c['offset']//3+c['count']]
        ii = ix[c['indexOffset']:c['indexOffset']+c['indexCount']].reshape(-1, 3)
        p = S.polygons(vv[ii][:, :, [0, 2]])
        polygons.extend(p)
        if c['kind'] == 'plaza':
            plaza.extend(p)
        if c['x'] == 20:
            assert vv.tobytes() == vertices[1].tobytes(), 'Unchanged vertex bytes changed'
            assert ii.tobytes() == indices[1].tobytes(), 'Unchanged index bytes changed'
    assert abs(sum(p.area for p in polygons)-200) < 1e-5, 'Area lost or repeated'
    assert abs(S.union_all(polygons).area-200) < 1e-5, 'Coverage gap or overlap'
    assert abs(S.union_all(plaza).area-32) < 1e-5, 'Coverage clipping or hole was lost'
    assert np.max(np.abs(v[:, 1]-(1+.2*v[:, 0]+.3*v[:, 2]))) < 2e-6, 'Height plane changed'
    first = [(output/n).read_bytes() for n in ['ground.bin', 'ground-indices.bin']]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL)
    assert first == [(output/n).read_bytes() for n in ['ground.bin', 'ground-indices.bin']], 'Non-idempotent rebuild'
    # Shared-edge local refinement must retain the same height plane and area.
    t = vertices[0][indices[0].reshape(-1, 3)]
    vv, ii, _, _ = mesh.pack(t)
    local = [(dict(kind='grass'), vv, ii)]
    mesh.refine(local, S.box(0, 0, 4, 4), 5, 2)
    vv, ii = local[0][1:]
    assert np.max(np.abs(vv[:, 1]-(1+.2*vv[:, 0]+.3*vv[:, 2]))) < 2e-6
    assert abs(sum(S.area(S.polygons(vv[ii][:, :, [0, 2]])))-100) < 1e-5
    # Retired render cuts restore only absent terrain, respecting surviving cuts.
    local = [(dict(kind='grass'), vertices[0], indices[0].reshape(-1, 3))]
    fill = dict(id='retired-cut', kind='plaza', outer=[[8, 0], [12, 0], [12, 10], [8, 10]], groundY=7)
    fills = mesh.restore_retired_cuts(local, [fill, dict(fill, id='repeat')], S.box(11, 4, 12, 6))
    assert abs(fills[0]['filledAreaM2']-18) < 1e-6, fills
    assert fills[0]['overlapWithExistingM2'] < 1e-8
    assert fills[1]['filledAreaM2'] < 1e-8, 'Repeated cut created duplicate faces'
    pp = [p for _, vv, ii in local for p in S.polygons(vv[ii][:, :, [0, 2]])]
    assert abs(sum(p.area for p in pp)-118) < 1e-5
    assert abs(S.union_all(pp).area-118) < 1e-5
    assert np.all(local[-1][1][:, 1] == 7), 'Fallback fill height ignored'
    profile = mesh.profile_lift(np.array([[[2, 3], [8, 3], [5, 7]]]),
                               dict(id='slope', heightProfile=[[0, 0, 1], [20, 0, 5]]))
    assert np.max(np.abs(profile[:, :, 1]-(1+.2*profile[:, :, 0]))) < 1e-6
print('PASS: coverage/hole ownership, unchanged bytes, preserved heights, no area loss, deterministic rebuild, local refinement, exclusive retired-cut fill and height profiles.')
