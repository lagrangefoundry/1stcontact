---
uid: report-ad02129b
id: REPORT-1613
type: report
title: 'Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic
  Write Path (level=story)'
created_by: xgd
created_at: '2026-08-07T19:24:01.097566+00:00'
updated_at: '2026-08-07T19:24:01.097566+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-f753cecd
  level: story
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic Write Path
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 2
**Needs review**: 0

The capability (CAP-86, `capability-f753cecd`) holds exactly one story,
STORY-100 (`story-37a3921b`, `story_kind: upgrade`, 17 ACs). Its lineage is
`intent_uid: bundle-15c1f647` (BUNDLE-16) and `updated_by: request-66e4c630`
(REQ-118). No other ticket in the store references this capability or story;
the ACs carry no lineage fields of their own, so the story's chain is the whole
ledger.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-11 (`request-53c276dd`) | free_and_reconciled | created 2026-06-30, completed 2026-07-29 | The structured-edit surface `1c page/config/asset` — atomicity, whole-definition validation, `{ok,error{code,message,hint}}` envelope, exit-status contract. Background intent: the copy verbs join this surface and inherit its refusal shape. | YES (background — no matrix element of this capability is homed on it) |
| REQ-117 (`request-395b67e6`), via BUNDLE-16 (`bundle-15c1f647`, merged `1741ee5d`) | free_and_reconciled | created 2026-07-31, completed 2026-08-07 | T3: the edit-address contract in `site-schema` (strict form, one resolution rule, module/slot scoping), `copyFieldsOf` / `applyCopyFields`, `1c copy get\|set` on the AI's own surface, one change map = one diff, shared validator over the whole definition, no raw HTML/CSS, empty field list for a fieldless region, `/api/copy` as a thin origin transport carrying the validator's own code/path/hint, re-render after save. 10 ACs. | YES |
| REQ-115 (`request-a6740b4a`), same bundle | free_and_reconciled | created 2026-07-31, completed 2026-08-07 | T1 builder chrome, webui consumption, `site` tab, display panel. Homed on CAP-85 / STORY-99 — no obligation on this capability. | YES (not this capability's surface) |
| REQ-44 (`request-3b78151f`), same bundle | free_and_reconciled | — | `1c` dependency preflight. Explicitly states "the structured-edit verbs are offline and stay ungated" — no obligation on this capability. | YES (not this capability's surface) |
| REQ-118 (`request-66e4c630`) | free_and_reconciled | created 2026-07-31, completed 2026-08-07, merged `b2b9208` | T4: image selection as the *second half of the same surface* — no `image set` command, no `/api/image` route. Field vocabulary widened `'string'` → `'string' \| 'enum'`; `copyFieldsOf` returns `src` (enum, options = site images + the node's current handle) and `alt`; enum membership enforced server-side in `applyCopyFields` before the shared validator; a save re-renders both channels; asset listing reachable independently (CAP-88). 7 ACs. | YES |

Cumulative picture: nothing was retired. REQ-118 strictly *widened* REQ-117's
surface along one axis (the field vocabulary) and added image behaviour to the
same operations. Deliberate non-goals held across both: text properties, per-run
restyling, structural editing, undo beyond not-saving, image framing, asset
upload/processing.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-86 body | REQ-117, REQ-118 | aligned — the four contract clauses (address + single resolution rule; exposed fields are plain words only; one change map as one validated diff; structured refusal) map to REQ-117 §§1–3 and REQ-118 §§1–2; the out-of-scope list correctly disclaims the gesture, the chrome and the stamping render |
| STORY-100 (`story-37a3921b`) | REQ-117 (10/10 ACs accounted for), REQ-118 (7/7 ACs accounted for) | aligned, with 2 warnings (below) |

Per-AC accounting of asked intent against the story tree — no gaps:

| Intent AC | Where it lands |
|---|---|
| REQ-117 AC-1 (fields listed; fieldless region opens nothing) | AC-981 (write-path half: empty list succeeds); gesture half on STORY-101 |
| REQ-117 AC-2 (save updates draft, re-renders) | AC-982, AC-992 |
| REQ-117 AC-3 (one Save = one diff) | AC-983 |
| REQ-117 AC-4 (invalid never lands) | AC-984, AC-985 |
| REQ-117 AC-5 (same validator, by consequence) | AC-986 |
| REQ-117 AC-6 (no raw HTML/CSS) | AC-991 |
| REQ-117 AC-7 (copy in a module slot) | AC-989, AC-987 |
| REQ-117 AC-8 (long copy legible in full) | AC-990 — see finding 2 |
| REQ-117 AC-9 (innermost-wins) | STORY-101 / CAP-87 (gesture) — correctly disclaimed here |
| REQ-117 AC-10 (View mode unaffected) | STORY-101 / CAP-87 — correctly disclaimed here |
| REQ-118 AC-1 (picker of the site's assets) | AC-1024 |
| REQ-118 AC-2 (choice updates node + render) | AC-1026 |
| REQ-118 AC-3 (image edits share the validator) | AC-986 ("every edit through the surface, not only for copy") |
| REQ-118 AC-4 (alt text in the same diff) | AC-1026 |
| REQ-118 AC-5 (absent asset refused, nothing applied) | AC-988 |
| REQ-118 AC-6 (bakes nothing; other axes survive) | AC-1027 |
| REQ-118 AC-7 (listing callable independently) | CAP-88 / STORY-102 — correctly disclaimed here |
| REQ-118 §1 rationale (current handle always an option) | AC-1025 |

Exclusivity: the capability holds one story, so there is no intra-capability
overlap. The cross-capability cluster (one address vocabulary spanning STORY-98,
STORY-100, STORY-101) was resolved in REPORT-1583 ("Overlap resolution: cluster
9", 2026-08-07, result `pass`), which confirmed STORY-100 on CAP-86 as the
*parse-and-resolve* consumer with no AC duplicated across layers. Re-checked and
still true.

Post-merge free-coded commits attributed to REQ-117 (`69f06deb` stale-render
guard, `9fcba993` fieldless-modal dismiss, `f8c3e45b` nowrap width floor) all
land in `apps/control-app/src/builder/editor.js` or
`packages/framework/src/l1/render.ts` — the gesture and the L1 substrate, not
this capability's surface. `git log b2b9208..HEAD` over
`tools/generate/src/cli/edit.ts` and `packages/site-schema/src/l1/edit.ts` is
empty: no unreconciled behaviour change to this write path exists.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-100 | story-body-edit | Technical Context reads "The addresses this surface resolves are written by the edit render channel (**CAP-84** / STORY-98)". `capability-25f7e486` (CAP-84) is `status: superseded`, `superseded_by_uid: capability-12fee326` (CAP-87), and STORY-98 (`story-af36c2cb`) authoritatively carries `capability_uid: capability-12fee326`. Confirmed by REPORT-1583 (overlap resolution cluster 9, 2026-08-07). The cross-reference points at a retired capability. | Replace `CAP-84 / STORY-98` with `CAP-87 / STORY-98`. The neighbouring reference `CAP-85 / STORY-99` is correct and needs no change. |
| 2 | warning | coverage | STORY-100 | story-body-edit | REQ-117 §4 ("Copy that no longer fits — accepted, with one guard") and its AC-8 are live intent, and AC-990 asserts the write-path half: an overflowing string **saves successfully** and reads back **entire**, with a multi-line control requested. The story body's In-scope list never states either half — the nearest text ("the surface answers with the editable fields it offers and their current values in the draft") implies faithful read-back but says nothing about overflow being accepted or about the control shape. STORY-101 carries the operator-facing half in its body; this story's half is asserted only by its AC. | Add an In-scope bullet: copy longer than the box it renders into is accepted, not refused and not truncated; reading the region back returns the whole string, with a control able to display it in full. |
| 3 | info | consistency | STORY-100 | — | The recorded intent/implementation divergence ("the intent states that clicking a region with no editable fields 'opens nothing'; the shipped browser behaviour shows a dismissible 'nothing to edit here' message") is correctly attributed away from this capability — STORY-101's body owns it ("A region with nothing editable says so plainly and can be dismissed by every route a dialog is normally dismissed by"), and the free-coded fix `9fcba993` touches only `editor.js`. No action here. | none |
| 4 | info | coverage | STORY-100 | — | The refusal shape the story describes (code, path, hint, human + machine form, failing exit status) is not spelled out in REQ-117's own ACs; it is inherited from REQ-11's structured-edit envelope, which REQ-117 invokes by placing `1c copy get\|set` "beside `page`/`config`/`asset`" and REQ-44 restates ("the REQ-11 contract"). Supported intent, recorded here so a future check does not read it as unsourced. | none |

## Notes for the Editor

- Both warnings are one-line edits to STORY-100's body; neither implies an AC
  change and neither blocks the level.
- Do **not** treat finding 1 as evidence that STORY-98 is mis-homed. The
  consolidation CAP-84 → CAP-87 is settled and the story is already correctly
  filed; only STORY-100's prose lags it. A stale `main`-worktree index entry
  still maps `story-af36c2cb` to CAP-84 (noted in REPORT-1583, resolves on the
  next index rebuild) — it is not this story's problem and needs no ticket edit.
- The image half of this surface is unusually well-guarded against future drift:
  REQ-118's non-goal on framing is pinned by AC-1027 (every other parameter the
  region carries survives an image swap), so the fields DOC-28 §13 Q5 will
  eventually add have a protected place to land. Worth preserving verbatim in
  any later edit of the story's Out-of-scope list.
