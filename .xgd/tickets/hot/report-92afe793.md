---
uid: report-92afe793
id: REPORT-3366
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T21:23:01.438000+00:00'
updated_at: '2026-09-02T21:23:01.438000+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

Cherry-pick of `876811161c` (Merge branch 'free-BUG-39' into xgd-working) —
2 conflicted paths, both resolved. Cherry-pick state (CHERRY_PICK_HEAD) left
intact for the finalize step.

## Files resolved

- `package.json` — UU, config/bookkeeping scalar (rule 2g / version-scalar).
  HEAD `0.2.20` vs incoming `0.2.15`. Kept HEAD's `0.2.20`. The incoming value
  is a free-coded version bump from 2026-08-25 that main has since moved past;
  it is bookkeeping, not developer code intent, and taking it would walk the
  published version backwards.

- `.xgd/tickets/hot/bug-23d1ec27.md` (BUG-39) — UU, intent/bookkeeping ticket
  (rule 2e), staged with `git add --sparse` (path is outside the sparse cone).
  The conflict region is the frontmatter lifecycle block ONLY; the entire body
  merged cleanly. Per-fact resolution, later-positioned side wins:
    - HEAD:     `updated_at 2026-08-31T05:05:09Z`, `last_field_updated: status`,
                `status: bundled` (from `09291354` seed_local_overlay, 2026-08-31)
    - incoming: `updated_at 2026-08-25T23:27:28Z`, `last_field_updated: body`,
                `status: free_coding`
  Kept HEAD. The incoming side is the older free_coding state; the ticket has
  since advanced free_coding -> bundled, and restoring the incoming frontmatter
  would revert an operator/lifecycle status. No other field on either side was
  touched, so there was nothing disjoint to compose.

## Incoming changes preserved

No incoming developer code was discarded. Nothing was dropped under the
BUG-1301 precedence exception; no test function was deleted.

- BUG-39's ticket BODY — the incoming commit's substantial body rewrite (the
  "blast radius is wider" paragraph, the "Fix — as landed" section and its
  suite table, the two-case evidence section, the "Out of scope — a second,
  unrelated defect surfaced" section, the ticked acceptance criteria, and the
  `./bin/1c assets` reproduce note) merged cleanly and is present verbatim in
  the resolved file. Only the frontmatter conflicted.

- The 10 code files in the incoming commit never conflicted. Verified against
  the incoming tree: 8 of them are byte-identical to it, including both files
  the commit adds — `tests/support/scripted-model-client.ts` (the single shared
  streaming double) and `tests/test_UAT_FC_BUG-39_model_double_contract.test.ts`
  (both of its cases, including the drift guard). All 8 suites the commit
  de-duplicated import `tests/support/scripted-model-client`.

- The 2 files that differ from the incoming tree differ because HEAD is NEWER,
  not because the incoming change is missing:
    * `tests/reconciliation-assistant-conversation-knowledge.test.ts` — one KB
      fixture key, incoming `prompt:` vs HEAD `description:`. HEAD carries a
      later rename; the file's import of the shared double is present.
    * `tests/reconciliation-assistant-conversation.test.ts` — HEAD carries a
      later rewrite of the AC-1055 test, which is precisely the BUG-38 /
      REQ-127+AC1055 intent conflict this ticket's "Out of scope" section
      flagged for the operator. That decision was taken after this commit and
      is already integrated into HEAD. The incoming change to this file (the
      move onto the shared streaming double) IS present in HEAD's version.

## Net staged diff

The staged tree is identical to HEAD (`git diff --cached --stat HEAD` is empty):
this commit's effect had already reached the bundle branch by another route.
Per STEP 4 this is a redundant commit, not a discarded one — STEP 3's
discriminator is satisfied, since the incoming commit's key changes are
demonstrably PRESENT in HEAD (new files, shared-double imports, ticket body),
not absent. `--skip` was NOT called; staged and exiting @done as instructed, for
the finalize step to detect and handle.
