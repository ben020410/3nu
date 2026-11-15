"""Check all rendered terrain vertices against canonical runtime heights."""
import pathlib
src=(pathlib.Path(__file__).parent/'verify-ground29.py').read_text()
src=src.replace("N['precinct29']['renderCuts']", "N['precinct29']['renderCuts']+N.get('landmarkCuts30',[])")
src=src.replace("pathlib.Path('BUILD29-GROUND.json')", "pathlib.Path('reports/build31/ground-check.json')")
exec(compile(src,__file__,'exec'))
