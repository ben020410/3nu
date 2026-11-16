# Public version history

User decision (2026-11-17, KST): add **업데이트 내역** immediately to the right of **피드백** in the title board. Use **v1.0** for the initial public release and **v1.0.1** for the current follow-up. Label the top-right link and destination heading **프로젝트 소개**; preserve attribution content and source links.

Public version and internal build are separate: v1.0.1 = BUILD120 / package 0.0.120. `package.json.releaseVersion` records the public version; release packaging includes it in RELEASE-MANIFEST.json. Existing build-number checks retain their format.

For every future public deployment:

1. Add a version entry in `dist/index.html` / `titleUpdates120`, newest first. Keep all earlier entries. Use concise player-facing descriptions of changes actually in that release. Do not expose engineering build numbers, internal tasks, unverified claims or admin information.
2. Keep **업데이트 예정** while local-only. Upon explicit authorization to publish, replace it with the actual KST release date as the final release preparation step. Never invent a release date or mark a local candidate published.
3. Update `package.json.releaseVersion` and record the public version alongside the internal build in deployment records. Verify the update tab in the publicly deployed version.
4. Preserve notice, help and feedback features. Opening history must never submit feedback or discard a draft. Credits/source text remains in 프로젝트 소개.

Current local v1.0.1 notes cover first-load waiting, camera/flight processing, update history and the project introduction label. The user authorized GitHub synchronization and public deployment on 2026-11-17 (KST). v1.0.1 is dated 2026.11.17.


2026-11-17 hotfix: v1.0.2 = BUILD121. The title corner now carries `data-release-version` and an accessible version label; release packaging rejects a mismatch with `package.json.releaseVersion`. Preserve the v1.0 and v1.0.1 entries. On mobile, character/nickname selection precedes campus loading; successful preparation enters gameplay automatically. Physical iPhone verification remains separate from desktop WebKit tests.


2026-11-17: v1.0.3 = BUILD122. Initial mobile title separates 3D runtime downloads from title controls; mobile background uses one active image and no continuous scaling. The v1.0.2 physical iPhone retry failed despite desktop WebKit passing. Keep verification limits explicit.

2026-11-17 candidate: v1.0.4 = BUILD123. Mobile static building/terrain residency loads nearby units and releases distant geometry without changing the stored models. Validate arrivals, unload/re-entry, picking, labels, shadows, settings and retries. BUILD122 passed desktop WebKit but still restarted near loading completion on the physical iPhone; do not claim a resolved device fault before retest.
