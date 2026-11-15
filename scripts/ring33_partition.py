"""Remove millimetre-grid boolean slivers with an exact, ordered partition.

Carriageway has first ownership. Do not round the resulting shared boundaries:
independently rounding the difference of two polygons creates overlapping wedges.
"""
import shapely as S
from shapely.geometry import Polygon
from shapely.strtree import STRtree

def parts(g):
    if g.geom_type == 'Polygon':
        if g.area > 1e-9: yield g
    else:
        for p in getattr(g, 'geoms', []): yield from parts(p)

def normalize_regions(items):
    polys = [S.make_valid(Polygon(q['outer'], q.get('holes', []))) for q in items]
    tree = STRtree(polys)
    accepted, out = [], []
    for i, (q, p) in enumerate(zip(items, polys)):
        neighbours = [j for j in tree.query(p, predicate='intersects') if j < i]
        if neighbours:
            p = p.difference(S.union_all([accepted[j] for j in neighbours]))
        accepted.append(p)
        for j, g in enumerate(parts(p)):
            out.append({**q, 'id': q['id'] if j == 0 else q['id'] + '-part-' + str(j),
                        'outer': list(g.exterior.coords)[:-1],
                        'holes': [list(r.coords)[:-1] for r in g.interiors]})
    return out
