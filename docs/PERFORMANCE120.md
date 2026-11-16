# BUILD120 local performance work

Public release v1.0.1 / BUILD120 authorized on 2026-11-17 (KST). Deployment outcome is recorded outside Git under 03-history/server-releases/BUILD120-20261117.

- `dist/static119.js`: up to four compressed building/terrain payloads are fetched ahead. The original building order is passed from app.js; decode/apply remains sequential. Slots are bounded, failures propagate at consumption, and scene disposal aborts outstanding fetches. No geometry, materials, packed mesh binaries or rendering quality were changed.
- `dist/ray-query120.js`: 64 scene-unit spatial buckets reduce candidates for the existing camera, flight and nickname-occlusion ray queries. Native triangle intersections and original predicates/tie order remain authoritative. Moving/updatable geometry and unsupported rays retain native picking. This is independent of rendering distance and does not replace walking collision or route planning.
- Frozen geometry edited at runtime must call `__campus.rayQuery120.invalidate(mesh)` after updating world/bounding information. New/removed meshes are tracked, including immediately appended meshes before deferred engine callbacks. Do not freeze moving actors into this index.

Local evidence: `03-history/build-reports/BUILD120/REPORT.html` (outside main). Network simulation reduced first title readiness from 84.89s to 56.17s. Short throttled ground/flight runs reduced ray-query CPU cost; FPS remained around the existing 30 cap. Ground tail latency was mixed. Sampled JS heap peak increased from 478.2MB to 622.6MB; memory reduction and physical iPhone safety are NOT established. Extra prefetched compressed bytes peaked at 4.40MB. Do not conflate this with total JS/GPU memory.

973 native/indexed ray comparisons passed, along with bounded queue tests, 320px title tabs/draft retention, and local Mac WebKit movement, route movement, flight, map and photo restoration. Mac browser mobile profiles are not physical iPhone verification; long-session thermal/GPU limits remain unverified.

Release-history policy: see RELEASE_HISTORY.md. v1.0.1 displays the authorized release date 2026.11.17.
