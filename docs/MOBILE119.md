# BUILD119 mobile startup

The iPhone 14 Pro report is an actual device failure. Desktop Chrome/WebKit checks do not establish that the phone is fixed. The Korean notice “준비 중 화면이 다시 열렸어요” means a recent pending startup checkpoint survived another navigation. It can follow a WebKit process restart, manual reload, or closing/reopening during preparation; it is not an out-of-memory diagnostic.

## Changes

Mobile/coarse-pointer browsers with DecompressionStream load precomputed building and terrain vertex buffers instead of repeating polygon partitioning, façade generation, large JavaScript arrays, and exact-attribute welding during each visit. All original procedural builders remain the authoring source and desktop fallback. `?bake119=1` explicitly selects the procedural path. Assets preserve float32 positions, normals, UVs, triangle order, transforms, material values, picking, collision flags and metadata. This is NOT geometry simplification, lazy residency, or an iOS memory guarantee.

284 building groups (1,208 meshes) and 612 terrain meshes are cached. Two unsuitable building groups remain procedural. Materials are explicitly bound after Mesh.Parse; do not rely on asynchronous material lookup. Geometry is registered before Mesh.Parse. Scene image processing remains shared. Binary files contain gzip payloads under `.bin`; the application decompresses them. Do not add HTTP Content-Encoding:gzip for these payloads unless the server actually adds a second transport encoding.

Shuttle stop labels use 512px instead of 1024px width on coarse pointers, and the route canvas uses 700×280 instead of 1400×560. Bus/stop counts, routes, simulation and boarding remain unchanged. Initialization yields between route sample batches, stops and vehicles. Asset requests time out after 30s and report actual chunk/building progress to the startup watchdog.

## Reproduce

Start the local server normally (`npm start`), then with a locally installed Playwright and browser:

    BAKE_URL=http://127.0.0.1:8766 node scripts/bake-buildings119.cjs
    BAKE_URL=http://127.0.0.1:8766 node scripts/bake-ground119.cjs

Optional environment variables: PLAYWRIGHT_MODULE (absolute module location), CHROME_PATH (browser executable). Both generators use this checkout, not a historical snapshot. Compare procedural/cached geometry, material values and representative actual views before accepting regenerated assets. Then run:

    node scripts/check-static119.cjs --record
    node scripts/check-static119.cjs
    node scripts/check-repository-layout.cjs

The source manifest conservatively hashes all runtime JS and map data, excluding the loader itself. `npm test` fails on source drift so stale baked scenery is not silently shipped. After an unrelated JS edit, first establish that generated geometry/materials did not change before updating that record. A fresh bake is required for building/terrain/material input changes.

## Limits

These assets add approximately 53.6MB compressed across 350 files (plus the small source manifest). Mobile skips the original ground binary downloads, but total initial transfer can still increase. This is a CPU/transient-allocation tradeoff, not a download optimization. CPU collision geometry remains resident. No vertex/triangle reduction or GPU geometry memory improvement is claimed. Do not ship the rejected box-instancing experiment: flight planning and picking require separate work before supporting it.

Chrome same-condition samples are in the external BUILD119 report. GC timing changes peaks, and JS heap omits GPU/browser process memory. Physical iPhone cold/repeated start, thermal throttling and cellular download behavior remain unverified until retested on the device. Keep the existing low mobile render defaults from BUILD118.

BUILD119 also gives coarse-pointer startup a 300s total deadline (desktop 120s unchanged). The 45s no-progress watchdog and 30s per-request timeout remain. Progress reflects finished chunks/requested buildings, not a fabricated timer.

## Deployment

Published to https://3nu.vercel.app/ and the DigitalOcean backend on 2026-11-17 (KST). Server tests: 29 passed, 0 failed; static asset integrity/source checks passed. Independent comparison covered all 1,820 cached meshes, including material values and collision flags. Local macOS WebKit mobile-profile checks passed two fresh starts, WebSocket, orientation, map, photo, quality and interrupted-start retry. Physical iPhone results remain pending.
