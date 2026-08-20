---
uid: comment-9985be63
id: COMMENT-1300
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T12:23:19.249841+00:00'
updated_at: '2026-08-20T12:23:19.249841+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-3baffe05
  kind: note
---

Schema verified. **REPORT-2431** (`report-3baffe05`) — **FAIL**: 2 violations, 3 warnings, 0 needs_review.

## What I did

First verified all five of attempt 11's mutations actually landed (they did — story bodies re-read live, not inherited from the fix report). Then ran four sweeps, including both angles the prior cycle flagged as never-run:

- **Archived CAP-73 body** — clean. The 2026-08-05 consolidation lost nothing; the gap found last cycle post-dated CAP-73.
- **Input/options surface** of the owned verbs (prior cycles only ever enumerated *output* fields) — clean.
- **Every round-pass section of BUNDLE-10**, not just Round-9 — this produced all five findings.
- **Term-scan of all 31 story bodies** to prove each candidate is unowned matrix-wide.

Ran the evidence file: `tests/req88-viewport-relative-and-nowrap.test.ts` → **21/21 passing**. Every behaviour below is live and pinned by a named UAT; the gap is that the matrix doesn't describe it.

## Findings

All five land in STORY-84, concentrated in REQ-88's Round-5→8 **geometry-derivation** work — the one region no prior cycle reached.

**Violations**
1. **A column anchor has two independently-fitted terms; STORY-84 describes it as one undivided thing.** Round-8's title is literally "anchoring is per axis, and it must be" — coupling them caused a measured 31px split in text the reference keeps flush. Pinned by `test_UAT_FC_REQ-88_x_anchors_even_when_width_is_not_a_column_function`, whose own comment says "the axes are fitted independently, and that is the whole point."
2. **The accent-bearer rect rule is entirely absent.** Which box paints an asymmetric accent rule is a fold decision with precedence rules; three UATs pin it, no story body mentions it.

**Warnings**: the `pxTrack` inset fallback + full-bleed anchor refusal; "two constants" where the extent needs a third (the content cap — `{containerPx, insetPx, maxWidthPx}`); the card path's viewport-width guard and grouping identity.

## One thing worth your attention beyond the report

`fold.ts:451-458` — `fitAnchor`'s doc comment still asserts the **pre-Round-8 coupled** behaviour ("Both, because the renderer takes `x` and `width` from the anchor together"). The code 80 lines below does the opposite, and the UAT pins the opposite. The behaviour is correct, so this isn't a `code-issue` and no verdict depends on it — but it's very likely *why* finding 1 survived eleven cycles: anyone auditing the fold from its own comments would conclude the anchor is all-or-nothing, which is exactly what STORY-84 says. That wants a separate free-coded fix, not this workflow.

I also recorded two candidates I considered and deliberately **didn't** raise (the text-leaf ceil rule, superseded by `nowrapFromPx`; `fitColumn`'s modal left edge, a fitting technique rather than an asserted behaviour), so the next cycle doesn't re-mine them.
