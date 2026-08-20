---
uid: comment-2c565430
id: COMMENT-1253
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-20T04:11:20.415862+00:00'
updated_at: '2026-08-20T04:11:20.415862+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-1e7986d2
  kind: note
---

Only new files; no runtime code and no existing test touched.

```
UATs generated for story story-3bf94bd4 (plan item 5 of 9)

Story: story-3bf94bd4
Test file(s) created:
  - tests/reconciliation-copy-edit-colour-row.test.ts
  - tests/reconciliation-copy-edit-control-availability.test.ts
  - tests/reconciliation-copy-edit-tracking.test.ts
  - tests/support/builder-origin.ts   (shared transport helper, not a suite)

Tests written: 6
Tests passed: 5
Tests failed: 1

test_files_created:
  - "tests/reconciliation-copy-edit-colour-row.test.ts"
  - "tests/reconciliation-copy-edit-control-availability.test.ts"
  - "tests/reconciliation-copy-edit-tracking.test.ts"
  - "tests/support/builder-origin.ts"
```

## Scope

The story has 40 ACs. 34 already carry a `test_UAT_AC<N>_*` function in existing suites, so writing more would break the 1:1 mapping. The six with **no** UAT at all are the ones this run covers — all created by this reconcile:

| AC | Test |
|---|---|
| AC-1279 colour row | `test_UAT_AC1279_a_colour_row_opens_the_palette_and_saves_in_the_same_change_as_the_words` |
| AC-1280 panel behind the words | `test_UAT_AC1280_the_run_shows_the_panel_behind_it_read_only_and_saves_before_it_navigates` |
| AC-1281 empty palette | `test_UAT_AC1281_an_empty_palette_still_offers_the_row_and_opens_its_add_the_first_one_state` |
| AC-1282 locked control | `test_UAT_AC1282_a_locked_control_is_drawn_unavailable_and_its_reason_is_body_text_under_the_row` |
| AC-1283 unlocked control | `test_UAT_AC1283_an_unlocked_control_carries_no_explanation_and_is_not_marked_unavailable` |
| AC-1284 tracking on the words | `test_UAT_AC1284_a_tracked_run_previews_its_tracking_on_the_words_and_the_sheet_stays_chrome` |

## ⚠️ AC-1280 fails on a real code/intent divergence — do not weaken it

**A panel painted from the palette stops being a painted panel.**

`l1PaintsSurface` (`packages/framework/src/l1/render.ts:1839`) asks `surfaceDecls`, whose `cssColor` (`render.ts:79`) returns `null` for anything that is not a hex string. A `surfaceFill` holding a palette reference `{ref, shade}` therefore emits no declaration, so the node reports as painting nothing. Two consequences:

- `panelBehind` (`tools/generate/src/cli/edit.ts:604`) returns `undefined`, so the run's dialog loses its escalation row entirely;
- the panel is not stamped as a region at all, so it can no longer be clicked either.

This bites on the *second lap of the criterion's own loop*: the route exists so the panel's colour can be set from the run that occludes it, and the only value this surface can write is a palette reference (AC-1279). Use the row once and it is gone. Verified directly against `1c copy get` — literal fill returns `panel: {path:'0.1', fill:'#101820'}`; the same panel with `{ref:'ink',shade:-0.25}` returns no `panel` key.

The other five pass.

## Two environment notes

- **This sandbox refuses `listen()` (EPERM on any address)**, so `startBuilder` cannot run here — it hangs rather than rejecting, which is why the pre-existing `test_UAT_FC_REQ-139_locked_controls.test.ts` reports 2 failed / 6 passed and takes 480s on this machine. `tests/support/builder-origin.ts` prefers the real HTTP origin and falls back to routing `/api/copy` and `/api/palette` through the real `1c` entry point in-process — the same `editCopyGet`/`editCopySet`/`editPalette*` functions `builder.ts` documents those routes as thin transports over. Only the HTTP hop is bypassed; derivation, validation, atomicity and refusal shape are the production ones. `origin.overHttp` records which transport a run got.
- **AC-1284 is browser-only by its own terms** and reports loudly-unverified here (no socket ⇒ no engine can reach the workspace). The warning is emitted but this repo's vitest config intercepts console output — it is visible with `--disable-console-intercept`, same as the existing `unverified()` idiom in the neighbouring suites.

AC-1138 and AC-1039 are marked `uat_coverage: fail` on their tickets. Their tests live in existing files this prompt forbids modifying, and both need the origin, so I could neither re-verify nor repair them here.
