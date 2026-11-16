# BUILD122 initial mobile shell

The initial mobile title must not fetch/parse Babylon or campus runtime scripts. `index.html` explicitly keeps only title105, player-state, drafts113, community107, bulletin112 and startup122 eager. Production also loads the lightweight hosting116 configuration before startup122. No heavy module may be added to this list just to resolve a dependency.

Other scripts are inert `application/x-3nu-runtime` records with `data-runtime-src`, preserving original dependency order. startup122 uses one cached load promise, at most four ordered async=false script elements per batch, and loads app.js alone after every dependency succeeds. The first valid mobile Start intent triggers loading. Module-load failures show the existing retry UI and must never reach app.js. Reload is explicit via the existing retry button, never automatic.

Title105.mount shows the shell without invoking app.begin. Title105.begin later consumes the already validated nickname/character intent; ready auto-enters once. Desktop/review mode starts runtime immediately. Return-to-title reuses the current scene, never loads scripts again. The BUILD121 watchdog guards for deferredStart/startIntent remain necessary.

Mobile title artwork is unchanged: four original photos rotate every ten seconds, but only the current image retains src after a switch. Continuous transform and opacity animations are disabled on coarse pointers. Desktop motion remains. This does not prove immediate decoded-image cache eviction or reduced total process/GPU memory.

Checks: scripts/startup122.test.cjs; external BUILD122/runtime lifecycle, module failure/manual retry, previous pending boot, script/heap/slide sampling. Preserve the lightweight hosting116 injection before startup122 in deployment builds. Static source manifest recorded after this change; baked geometry is unchanged.

Physical iPhone14 Pro reload root cause remains unconfirmed. Local mobile browser profiles cannot establish iOS WebContent/GPU-process safety. Initial JS savings do not reduce full-game scene memory after Start; check the real device before claiming the recurrence fixed.
