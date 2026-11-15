#!/bin/sh
# Run from the repository root. Requires Node 22 and Python numpy/shapely.
# Inputs are immutable BUILD31 data + reviewed BUILD32 corrections, never the
# previous generated output. Road surfaces therefore cannot accumulate.
set -eu
task_node="${NODE_BIN:-node}"
"$task_node" scripts/prepare-roads32.cjs
python3 scripts/sync-network32.py
"$task_node" scripts/finalize-network32.cjs
python3 scripts/compile-roads32.py
python3 scripts/build-ground.py
"$task_node" scripts/make-qa32.cjs
"$task_node" scripts/verify-roads32.cjs dist reports/build32/final-road-walks.json
"$task_node" scripts/verify-architecture32.cjs
"$task_node" scripts/sample-ground32.cjs
python3 scripts/verify-mesh32.py
# Browser screenshots, real-render walking and performance evidence are
# deliberately collected separately; rebuilding does not claim visual QA.
