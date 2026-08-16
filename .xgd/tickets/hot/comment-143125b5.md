---
uid: comment-143125b5
id: COMMENT-1091
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T08:14:20.053145+00:00'
updated_at: '2026-08-16T08:14:20.053145+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-6b02087e
  kind: note
---

**REPORT-2092** (`report-6b02087e`) — **FAIL**: 4 violations, 3 warnings, 0 needs_review.

## What drove the failure

**REQ-93 ("L1 pages must host behavior modules in their slots", free_and_reconciled 2026-07-25) is the root of three of the four violations.** Its five clauses got split across capabilities and only the fold clause found a story home (CAP-71/STORY-84). The rest are orphaned:

1. **STORY-83 asserts the negation of REQ-93's renderer clause.** Its out-of-scope note says a slot "renders as an inert labelled placeholder… with no module code and no behaviour attached." The sole emitter now takes a `mounts` map and inserts a bound module's fragment **verbatim, unescaped** (`packages/framework/src/l1/render.ts:2105-2123`, opts at `1816`/`2347`/`2380`). That's a carve-out in the story's own load-bearing claim — "the single safe renderer neutralises every value at emit time" — with the reasoning for it recorded nowhere.
2. **STORY-85 doesn't express the page-level binding rule** (modules may accompany `l1` when each binds by name to an existing slot; unbound/dangling/double-bound/orphan/slot-without-l1 all rejected) or the `mountInL1` conformance mode.
3. **STORY-82 denies `labelMode`** — it says `fieldLabels=placeholder` "is gone", but REQ-93 restored it as a captured a11y fact (`contact-form/meta.ts:47`). The story's own title promises "placeholder-labelled contact forms."

**STORY-82 is the stalest element by a wide margin** — body untouched since the pivot bundle (2026-07-22). It also still describes contact-form's `intro`/`submit` slots, which REQ-96 deleted in favour of one required `form` slot (confirmed at `meta.ts:58-62`), and uses REQ-87's retired "capability module" vocabulary throughout.

## Deliberately not a violation

**REQ-137** (palette `steps` → Oklab `shade` on the reference) is `bundled` in BUNDLE-18, which was `reconciling` as of today. `steps` is still live on this branch (`palette.ts:72`), so STORY-80 correctly describes the enforced state. Filed as a warning with an explicit trigger: it becomes a violation if BUNDLE-18 reaches `free_and_reconciled` without repointing STORY-80's entry shape, retrofit counts, and REQ-114 AC3's superseded byte-identity guarantee.

Report body is also at `.xgd/tmp/cap-ae9d65d6-story-alignment.md`. Read-only throughout — no tickets, tests, or code modified.
