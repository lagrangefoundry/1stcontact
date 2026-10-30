---
uid: report-e49a55df
id: REPORT-4884
type: report
title: 'Resync resolve conflicts: 47116ed717337769dcd15931d012acf6050e6d0a'
created_by: xgd
created_at: '2026-09-23T23:16:56.186480+00:00'
updated_at: '2026-09-23T23:16:56.186480+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/doc-58cf04a4.md` (DOC-33) — **UU**, `doc-` intent/bookkeeping ticket
  (STEP 2e + 2g scalar rule). Markers had materialized on disk despite the path being
  outside the sparse cone; staged with `git add --sparse`.

  Git auto-merged everything except a single frontmatter scalar. Fact-by-fact composition:

  | Fact | base | ours (HEAD) | theirs (incoming) | resolved | rule |
  |---|---|---|---|---|---|
  | body (caretaker→consultant ×4, leading blank line) | caretaker | *untouched* | consultant | **theirs** | one-sided change → apply it |
  | `last_field_updated` | `doc_kind` | *untouched* | `body` | **theirs** | one-sided change → apply it |
  | `fields.doc_kind` | `system_kb` | `system_kb` | `system_kb` | `system_kb` | identical, no conflict |
  | `updated_at` | `2026-08-31T21:59:34` | `2026-09-11T09:33:30` | `2026-09-02T22:58:37` | **ours** | same fact changed on both → later-positioned intent |

  The two sides were **disjoint operations**, not competing intent:
  - HEAD-side `61eb2db4c4` (2026-09-11) was a *field* edit — `doc_kind: architecture → system_kb`.
  - Incoming `3a9e9beed8` (2026-09-02) was a *body* edit — the caretaker→consultant rename.

  Both timelines had independently performed the same `doc_kind: architecture → system_kb`
  change (xgd-working at 2026-08-31T21:59:34, already in the cherry-pick base; main at
  2026-09-11T09:33:30), which is why only the `updated_at` bump collided. Nothing was
  discarded: the resolved file carries both sides' effects.

  `updated_at` takes HEAD's `2026-09-11T09:33:30` — the more recent of the two commits, per
  the enrichment rule for unknown-intent sides — which also keeps the field monotone. Taking
  the incoming `2026-09-02` would have made the ticket claim it was last touched *before* the
  `doc_kind` change it visibly contains, corrupting later `working-timeline` reasoning.

## Incoming changes preserved

Verified by diffing the staged blob against the incoming (stage-3) blob: they are
byte-identical except the single `updated_at` line resolved above.

- caretaker → consultant rename: all 4 incoming occurrences present (lines 407, 411, 442,
  699); zero occurrences of `caretaker` remain, matching the incoming version exactly.
- Leading blank line after the frontmatter fence: present.
- `last_field_updated: body`: present (incoming's value, superseding base/ours `doc_kind`).
- `fields.doc_kind: system_kb`: present.

No hunks were dropped. The BUG-1301 precedence exception was not invoked and no test
functions were involved.
