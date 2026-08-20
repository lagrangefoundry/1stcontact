---
uid: report-0bb29893
id: REPORT-2310
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-20T02:20:43.882521+00:00'
updated_at: '2026-08-20T02:20:43.882521+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-4300366a
---

All 12 pass.

## Summary

**One UAT per AC, all 12 ACs covered, all passing.**

| AC | Test |
|---|---|
| AC-1242 | swatch = name + colour-as-colour + count, unreferenced at zero |
| AC-1243 | empty palette → invitation + working add control |
| AC-1244 | continuous position control, preview = renderer's arithmetic |
| AC-1245 | position control in manage mode writes nothing |
| AC-1246 | pick → palette reference, position key absent at centre |
| AC-1247 | three close routes, answered once, no state change |
| AC-1248 | opens on the held reference; unknown entry → nothing selected |
| AC-1249 | native/text mirror both ways; displayed page repaints |
| AC-1250 | redraw from the returned census; selection lands where the edit left it |
| AC-1251 | refusal in the store's own message + hint, verbatim |
| AC-1252 | removal/rename cost stated from the counts shown |
| AC-1241 | toolbar colour control in both channels |

**One structural decision worth flagging.** The sibling suites drive the origin over a bound port, and this sandbox denies `listen` (`EPERM 0.0.0.0`) — the first run timed out with zero criteria reported. I switched to `handleBuilderRequest`, which the CLI exports for exactly this ("so a test can drive the routing table without binding a port"), wrapped in a `fetch`-shaped adapter. The routing table, guards, envelopes and request-time rendering are the same code; only the socket is gone. The suite now runs in ~1.7s instead of failing to start, and the shipped `api.js` client still composes the real root-relative addresses. Worth knowing: `reconciliation-palette-management.test.ts` and `test_UAT_FC_REQ-133_palette_popup.test.ts` still use `startBuilder` and will not report here.

**Two ACs reach the workspace,** as the story's evidence-gap note predicted. AC-1249's automatic refresh and AC-1241's both-channel registration mount the real `mountBuilder` with the real `webui-*` components; both executed (no `NOT VERIFIED` warnings). Each also has an unconditional half that runs without the components. jsdom's `location.reload` is non-configurable, so the refresh is observed at the iframe's `contentWindow` seam, paired with a real fetch of the displayed address proving what that refresh gets.

**On AC-1242's "in the palette's own order":** the criterion body claims only "every entry, one swatch each, three things per swatch" — no ordering. The census answers alphabetically while declaration order differs, so I asserted the surface lists exactly what the store handed it, in that order, dropping and re-ordering nothing. If the intent was genuinely *declaration* order, that is a code/AC conflict I have not encoded — flagging rather than silently deciding.

Verification: mutation check confirmed the assertions bite; `git status` shows only the new file — no runtime code and no existing tests touched. Typecheck under `tsconfig.base.json` leaves no non-baseline errors from this file (that config yields 1406 pre-existing errors repo-wide, 27 in the sibling FC palette file, so it is not the build gate). ESLint is not installed in this checkout, so lint is unverified here.

```
UATs generated for story story-4300366a (plan item 2 of 9)

Story: story-4300366a
Test file(s) created:
  - tests/reconciliation-palette-popup-surface.test.ts

Tests written: 12
Tests passed: 12
Tests failed: 0

test_files_created:
  - "tests/reconciliation-palette-popup-surface.test.ts"
```
