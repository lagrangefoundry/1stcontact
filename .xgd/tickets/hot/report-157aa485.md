---
uid: report-157aa485
id: REPORT-3243
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T22:39:19.977199+00:00'
updated_at: '2026-09-01T22:39:19.977199+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/doc-786b4b9e.md` — **AA** (both added; hot-tier doc ticket,
  sparse-excluded so the conflict lived in the index and the worktree copy carried
  markers). Rule applied: §2e (intent/bookkeeping ticket, per-fact judgment) with
  the enrichment note's timestamp tiebreak. Resolved to the incoming side in full.

  Why the whole-file take is per-fact-correct here: the two stages differ **only**
  in frontmatter. The 281-line markdown body is byte-identical between
  `:2:` (8eacf3f) and `:3:` (a06b57a) — verified by `git diff` between the two
  blobs, which reports exactly two hunks, both inside the YAML header:

      -updated_at: '2026-08-16T01:19:25.198274+00:00'
      +updated_at: '2026-08-31T19:43:08.762677+00:00'
      ...
       fields:
         doc_kind: architecture
      -  system_kb: true

  So there is exactly one contested fact — `fields.system_kb` — plus the derived
  `updated_at`. There is no disjoint HEAD-side edit to compose in (BUG-1030's
  failure mode does not arise): HEAD contributes no field the incoming side lacks
  other than the one the incoming side deliberately retires.

  Timeline / narrative on that fact:
  - HEAD side: commit `198ee9e8` (2026-08-15 18:19 PDT), `xgd(ticket): update doc
    doc-786b4b9e`, no message body; it set `fields.system_kb: true`
    (`last_field_updated: system_kb`).
  - Incoming side: commit `7db6c9d6` (2026-08-31 12:43 PDT), free_coded, message
    body: *"field: retire system_kb boolean; membership moves to doc_kind
    (DOC-39 3.3)"*.

  The incoming narrative is an explicit, later retirement of the exact field HEAD
  set — a genuine same-fact conflict resolved by the later working-timeline
  position, which is also the free_coded/authoritative side. Removing
  `system_kb` is the commit's entire intent, not collateral loss.

## Incoming changes preserved

- `.xgd/tickets/hot/doc-786b4b9e.md`: resolved content matches blob `a06b57a0`
  (the incoming stage) exactly. Post-resolution grep confirms no conflict markers,
  `updated_at: '2026-08-31T19:43:08.762677+00:00'`, and no `fields.system_kb`
  key. Staged diff vs HEAD is `1 insertion(+), 2 deletions(-)` — precisely the
  incoming commit's frontmatter change and nothing else.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code,
test, or config files were in conflict. Cherry-pick sequencer state
(CHERRY_PICK_HEAD = 7db6c9d6) left untouched for cherry_pick_finalize_resolution.
