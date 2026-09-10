---
uid: comment-6ae90ba4
id: COMMENT-2542
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T14:23:48.545098+00:00'
updated_at: '2026-09-10T14:23:48.545098+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f7b844c5
  kind: note
---

All three findings of REPORT-72cbe69f are resolved. Completion report: **REPORT-3743** (`report-f7b844c5`) — `progress_made: true`, `needs_more_work: false`, `violations_remaining: 0`.

**What changed**

| Finding | Action |
|---|---|
| 1 (violation) — BUG-24's fold half unexpressed | STORY-84 body edit in four places + new **AC-1629** (`acceptance_criterion-e8bcef98`) |
| 2 (warning) — `nowrapFromPx` ownership silent | Named in STORY-84 as a ladder-derived fact; renderer half ceded to STORY-83 / AC-1010 |
| 3 (warning) — materialization verb unnamed | `1c repro <slug> --ref <bundle>` named in the paragraph and In-scope |

Finding 1 is the substantive one. BUG-24 states the fold gap outright — `foldSectionBackgrounds` read only `backgroundImageUrl`, so a correctly captured scrim couldn't round-trip — and the story never mentioned a scrim. STORY-84 now says the section-background box carries the band's photograph **and** its translucent veil (a colour with its own alpha, not element opacity) as two axes of one box, each read independently from the widest width carrying it, with the section folding on image **OR** scrim. This matches `fold.ts:1260` and `:1281-1288`. The backdrop bullet's "opaque" is now an explicit boundary — a full-bleed *translucent* fill is the band's scrim, not a backdrop — which is STORY-75's exclusion stated from the fold side, and Out-of-scope cedes the capture-side scrim probe to CAP-63/STORY-75. Per BUG-24 ("The renderer needed no change"), nothing was assigned upward to CAP-70.

For finding 2 I chose assignment over cession: the *derivation* is fold work (`fold.ts:222-240`, applied `:1843-1844`), only the *spending* is the renderer's. No AC was added there — AC-1009/AC-1010 already own it under STORY-83, and a second home would be the duplication the matrix forbids.

**Verified**: `npm test -- tests/bug24-scrim-alpha.test.ts` → 6 passed / 6, including the four fold/render UATs that exercise exactly what AC-1629 states (the wrangler EPERM line in the output is a sandbox artifact, not a failure). No tests were modified. I left `uat_coverage` unset on AC-1629 — that field belongs to the UAT-level cycle, and those four green UATs are its natural binding.
