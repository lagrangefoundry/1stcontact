---
uid: report-8d087baf
id: REPORT-3563
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T23:02:34.419300+00:00'
updated_at: '2026-09-09T23:02:34.419300+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-18a48d63.md` — **UU**, intent/bookkeeping ticket (rule **2e**, `request-*`).
  Out-of-cone under `.xgd/tickets/` (DOC-986), resolved with
  `git checkout --ours` + `git add --sparse`.
  **Rule applied: HEAD is a strict superset.** The ours↔theirs delta is confined to
  five frontmatter facts; the substantive payload is identical on both sides.

  Per-fact resolution (2e, per-fact not whole-file):

  | fact | ours (HEAD) | theirs (incoming) | kept | why |
  |---|---|---|---|---|
  | `fields.commits[].working_sha_history` | `7ebc721b` merged into surviving entry, orphan entry dropped | *identical* | ours (== theirs) | no conflict — both sides carry the same fix |
  | `status` | `free_and_reconciled` | `ready_to_reconcile` | ours | later operation; lifecycle state must not regress |
  | `completed_at` | `2026-08-31T14:22:42` | `null` | ours | set by the same later status advancement |
  | `updated_at` | `2026-08-31T14:22:42` | `2026-08-24T01:14:03` | ours | later timestamp |
  | `last_field_updated` | `status` | `commits` | ours | follows ours' later operation |
  | `fields.bundled_in` | `bundle-b3b7c399` | *absent* | ours | HEAD-only addition, nothing to conflict with |

  Timeline basis: enrichment reported intent unknown on one/both sides, so its stated
  fallback applies — "take the more recent commit by timestamp." HEAD-side commit
  `ecd40fbc` is 2026-08-31 07:22:42 -0700; incoming `6788b084` is 2026-08-23 18:14:03 -0700.
  HEAD is later on every differing fact, and those facts are exactly the ones a
  whole-file take-theirs would have silently regressed (status back to
  `ready_to_reconcile`, `completed_at` back to null, `bundled_in` dropped).

  No `fields.intent_uid` / `story_uid` / `capability_uid` were touched, and no content
  absent from both sides was introduced.

## Incoming changes preserved

Incoming commit `6788b084` — "Data fix (BUG-1265): merge orphaned working_sha 7ebc721b
(version-bump-only chore, dropped as empty by a later resync rebase, never reachable
from xgd-working) into the surviving entry's working_sha_history … no code change."

**Preserved in full.** That data fix is its entire substance, and it is present verbatim
in the resolved file — `7ebc721b83ab6202fdec600cd0493b69964bac39` sits inside the
surviving `working_sha: 96118c32` entry's `working_sha_history`, positioned between
`b71a8641` and `761b7fbd` exactly as the incoming commit authored it, and the orphan
`working_sha: 7ebc721b` stub entry (with its empty history) is gone:

```yaml
  commits:
  - working_sha: 96118c32cfc8495b6f7f2eff7046b518e267d84c
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - b71a8641182d62dd46b5fa6d0cf78a582cff4eb7
    - 7ebc721b83ab6202fdec600cd0493b69964bac39   # <- the BUG-1265 merge
    - 761b7fbd0efa55515fdea9a8ddc5f9a38be91c4d
```

Verified mechanically: `git diff <stage2> <stage3>` shows **zero** difference inside the
`commits:` block — the two sides are byte-identical there. HEAD acquired the same fix
independently via the 2026-08-30 `seed_local_overlay` (`209bea11`) / 2026-08-31 update
(`ecd40fbc`) route, i.e. post-watermark sync had already landed it.

No code/implementation files were involved, so no BUG-1301 precedence exception was
invoked and no hunk was dropped as obsolete.

### Note on the empty staged diff (BUG-1109/BUG-1122)

`git diff --cached HEAD` is empty — this resolution nets to no change against HEAD.
This is the *redundant* case, not the *discarded* case, and STEP 3's discriminator
confirms which: the incoming commit's key change is **present** in HEAD (shown above),
not merely absent. The commit is genuinely a no-op on this branch because its effect
already arrived by another route. Per STEP 4 the file is staged and this step exits
`@done`; `--skip` was not called. `CHERRY_PICK_HEAD` is intact for
`cherry_pick_finalize_resolution`, which will detect the clean staged diff and skip the
commit itself.
