---
uid: report-8e3dd57d
id: REPORT-4052
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T21:59:42.100365+00:00'
updated_at: '2026-09-11T21:59:42.100365+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-0cdfdc5b.md` — class **AA** (both added), intent/bookkeeping
  ticket (`request-*`), rule **2e**: "one side is a strict superset of the other — keep
  the superset." Resolved to **ours (HEAD)** via `git checkout --ours` + `git add --sparse`.

### Why AA rather than UU

The two sides share a real common ancestor, `99aca985` (2026-08-19 20:27:40). Git saw no
merge base for the path because the incoming branch's resync commit `0d11a014`
("xgd(resync): strip .xgd/tickets, .xgd/config.yaml, .xgd/permissions.yaml,
.xgd/quality.yaml from main snapshot (BUG-904)") removed the file, and the incoming commit
`458b7fc9` re-created it as a 370-line add. Hence add/add.

### Per-fact composition against ancestor `99aca985`

Incoming (`458b7fc9`, 2026-08-23) changed, relative to the ancestor:
  - `fields.commits` — rotated 4 `working_sha` values, appending each prior sha to its
    `working_sha_history`
  - `fields.chat_comment: comment-419ac5a2` — added

Ours (HEAD, last touched by `99812762`, 2026-08-31 07:22:38) changed, relative to the
same ancestor:
  - `fields.commits` — **the identical rotation**, byte-for-byte
  - `fields.chat_comment: comment-419ac5a2` — **identical**
  - plus, beyond incoming: `status: ready_to_reconcile -> free_and_reconciled`,
    `updated_at`/`completed_at` -> `2026-08-31T14:22:38.684806+00:00`,
    `fields.bundled_in: bundle-b3b7c399`

So the only two conflict regions git reported were exactly the facts HEAD advanced past
incoming (the status/timestamp block, and `bundled_in`). Both sides' substantive edits —
the commits rotation and `chat_comment` — auto-merged cleanly because they are the same
edit. The 370-line body is identical on both sides; no body hunks appear in any diff.

Taking theirs would have regressed the operator-owned lifecycle field
`free_and_reconciled` -> `ready_to_reconcile`, nulled `completed_at`, and dropped
`bundled_in: bundle-b3b7c399` — i.e. discarded the later intent's bookkeeping to restore a
strictly older snapshot. Under 2e's superset clause, ours wins on every contested fact and
loses nothing from incoming.

## Incoming changes preserved

Verified present in the resolved file:
  - `working_sha: b37c95a60decbe971f2960396a30ec1a6878b5a2` (history += `ed0fc920...`)
  - `working_sha: 1d10effc8449b8c81c2c8a36c3d8c5e4ae112ebb` (history += `c5088a8e...`)
  - `working_sha: b8b01ebf26bcef0627c936c68fbc813b7c20240e` (history += `07c6ba43...`)
  - `working_sha: 0f7795003980bc25abe96ab164aea316df7061b0` (history += `45868742...`)
  - `chat_comment: comment-419ac5a2`

That is the complete set of changes `458b7fc9` introduces over the common ancestor. None
were dropped; no BUG-1301 precedence exception was needed, and no test files were involved.

## Net staged diff

`git diff --cached HEAD` is **empty** — the incoming commit is genuinely *redundant*, not
discarded: its key changes already reached HEAD by a different route (the 2026-08-31
ticket update `99812762`, which carried the same commits rotation and `chat_comment` and
then advanced the status). Per STEP 4 / BUG-1109 / BUG-1122 this is not a failure and
`--skip` was NOT called; `cherry_pick_finalize_resolution` will detect the clean staged
diff and skip the commit itself.

`git ls-files -u` is empty; `git status --porcelain` is empty; `CHERRY_PICK_HEAD` is
intact at `458b7fc9c239c9e76eb9bc17687c05f0906bcc91`.
