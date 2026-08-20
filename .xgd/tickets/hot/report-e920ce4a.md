---
uid: report-e920ce4a
id: REPORT-2400
type: report
title: Claude fix_review_free_coded report
created_by: xgd
created_at: '2026-08-20T07:39:22.764848+00:00'
updated_at: '2026-08-20T07:39:22.764848+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_review_free_coded
  subject_uid: bundle-77b28def
---

All changes are test-side only — no production code touched, exactly as the fix-it prompt directed.

## Issues fixed

**C1 — `tests/reconciliation-colour-retrofit-shade-model.test.ts`** (2 failures → pass)
Both `harbor-cafe` seeds replaced with synthesised bare sites, following the pattern `dd12a1f4b` established in the two suites it did update:
- `:314` — `seedSandbox('harbor-cafe', …)` → `paintedSandboxSite('shade939-bare', [])` (the file's own existing helper)
- `:1038` — `seedTemp(cwd, 'harbor-cafe', …)` → `paintedSite(cwd, 'small-bare', [])`

Deleted sites were **not** restored; the `xgd` seed and every assertion are unchanged. The only live `harbor-cafe` reference left in the repo is `test_UAT_FC_REQ-140_segment_colour.test.ts:393`, which asserts the sites stay gone.

**C2 — `tests/test_UAT_FC_REQ-122_tool_surface.test.ts`** (5 failures → pass)
Harness converted to async at `:101` (`=> Promise<string>`), `:105-111` (`call`), `:114-121` (`callJson`), and every call site awaited with `it()` bodies made `async`. `Toolbox.run` left async.

**C2-class defects the review's scoped run never reached** — the same conversion, three more untouched files, 24 more reproducible failures:
- `tests/reconciliation-assistant-control-surface.test.ts:111` — 7 failed → 13/13 pass
- `tests/test_UAT_FC_REQ-126_l1_surface.test.ts:114` — 7 failed → 14/14 pass
- `tests/test_UAT_FC_REQ-129_l1_authoring.test.ts:127` — 10 failed → 11/11 pass
- `tests/reconciliation-page-composition-surface.test.ts:141` — 10 failed → 10/10 pass

`git log -S` confirms the cause: `77537a726` ("an async SiteStore port", in this bundle) is the commit that made these async. I also fixed a floating promise from the same conversion at `tests/shot.test.ts:85` (`editAssetAdd` un-awaited) — latent, not yet failing.

**W3 — `tests/test_UAT_FC_REQ-122_chat_panel.test.ts:179`** — provenance established, then loosened deliberately, not deleted. `meta.ts` is written by the **installed** `webui-chat`: `appendMessage('user', text, { ts: nowIso() })` at `webui-chat/src/index.js:343`, surfaced by `getMessages()` at `:451-456` (which omits `meta` when null). Nothing in this repo passes a `meta` — `chat.js:105` replays with two arguments, which is why the sibling assertion at `:156` compares whole records and still passes. The assertion now projects to `{role, markdown}`: exact order, roles, copy and count still assert; only the component's clock reading is dropped, with the reasoning recorded in-file. Upstream drift, confirmed, not this bundle.

**W1/W2** — not attempted, per the report's instruction that they are systemic and outside this diff.

## Test output

```
Test Files  8 passed (8)
     Tests  65 passed | 1 skipped (66)
```
(shade-model, tool_surface, chat_panel, control-surface, REQ-126 surface, shot, census-and-retrofit, palette-overlay)

Verified individually: control-surface 13/13, REQ-126 14/14, REQ-129 11/11, page-composition 10/10.

## Not verifiable here

`REQ-129:495` and `page-composition:676` each retain one `describe` block that fails on `Error: listen EPERM: operation not permitted 0.0.0.0` from `startBuilder` (`builder.ts:727`) — the same sandbox restriction the review documented. Every non-port test in both files passes. `reconciliation-assistant-conversation.test.ts` times out in its `beforeAll` at `:184` for the identical reason. These need an environment that permits `listen`; I could not exercise them and am not claiming they pass.

## Confidence

High for C1/C2 and the four additional files — all reproduced failing, then reproduced passing. Moderate overall: the port-bound suites (including the REQ-140/REQ-135 browser UATs flagged as W4) remain unobserved here, so if the re-review runs in an environment that permits `listen`, it will exercise code paths neither the attached quality reports nor this fix loop has seen.
