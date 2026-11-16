# BUILD118 mobile stability follow-up

User reports: iPhone 14 Pro restarted during preparation; standard quality and distance 1–2 barely playable. The persisted unfinished-boot checkpoint is confirmed, not the OS termination cause.

- Mobile completed VertexData uses safe 16/32-bit indices and exact terrain attribute indexing. Expanded triangles, normals, UVs and walking/collision data are preserved.
- Mobile standard: DPR1, 30fps, shadow512. High: DPR1.5, 60fps, shadow1024. Both retain 2 cascades and FXAA. Desktop quality resources remain unchanged, max60fps.
- Map/settings background15fps; hidden-tab rendering disabled. Movement remains dt-based. Network is not explicitly disconnected; OS tab suspension is outside this guarantee.
- Common mobile ground textures256. Distance default3 and saved preferences retained. Whole-scene creation/residency remains: this is not lazy loading or GPU resource eviction.
- Boot checkpoint key/stages retain117 for compatibility with previously interrupted sessions, not a stale build number.

Tests: node --test scripts/mobile-boot117.test.cjs scripts/mobile-memory118.test.cjs
Report: ../../03-history/build-reports/BUILD118/REPORT.html
Physical iPhone temperatures, sustained play and startup restart resolution remain unverified. Published to Vercel and DigitalOcean on 2026-11-17 (KST). Public macOS WebKit mobile-profile checks passed: initial load, WebSocket connection, portrait/landscape, map, photo capture, quality switching and explicit interrupted-boot retry. Server tests: 29 passed, 0 failed. These checks do not substitute for physical-device testing.
