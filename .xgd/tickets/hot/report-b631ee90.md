---
uid: report-b631ee90
id: REPORT-4877
type: report
title: 'Resync resolve conflicts: 47116ed717337769dcd15931d012acf6050e6d0a'
created_by: xgd
created_at: '2026-09-23T22:45:18.806746+00:00'
updated_at: '2026-09-23T22:45:18.806746+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-439cd0c8.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e**. Outside the sparse-checkout cone, so the conflict
  existed only in the index with no working-tree markers; resolved with
  `git checkout --ours` + `git add --sparse` (DOC-986 §2/§4.1).

  Three facts differed between the sides:

  | fact | ours (HEAD) | theirs (0e90542c) | taken |
  |---|---|---|---|
  | `status` | `bundled` | `bundled` | no conflict — identical |
  | `updated_at` | `2026-09-09T21:32:49Z` | `2026-09-02T17:48:27Z` | **ours** (later) |
  | `bundled_in` | `bundle-87be4669` | `bundle-203b1dc2` | **ours** (later, superseding) |
  | trailing newline | present | absent | **ours** |

  Per 2e, the later-positioned intent wins *per fact*. Ours is later on every
  contested fact:

  - **`bundled_in`.** Both bundles exist on HEAD and carry the *identical*
    title — `REQ-164 + REQ-159 + REQ-165 + REQ-163 + REQ-161 + 2 more` — i.e.
    they cover the same request set. `bundle-203b1dc2` (BUNDLE-23, created
    2026-09-02) is still `ready_to_reconcile` with every `reconcile_sha`/
    `main_sha` null: it never reconciled. `bundle-87be4669` (BUNDLE-26, created
    2026-09-09, completed 2026-09-11) is `free_and_reconciled` with
    `main_sha: 66e172dd4c0dc0ac26775c9b8aacf520bb5e7505`, and its body carries a
    `## REQ-163: Ingestion: from a dropped file to an indexed material ticket`
    section — this very request. 87be4669 is the successor bundle that actually
    landed on main. Incoming-wins here would reassign the request from its
    completed, main-landed bundle back to the superseded attempt.
  - **`updated_at`.** Incoming-wins would regress the timestamp by a week.
  - **trailing newline.** HEAD's own commit `dc3a031572` deliberately *added*
    the terminating newline; theirs lacks it. Keeping ours preserves that fix.

## Incoming changes preserved

The incoming commit `0e90542c748f41566276b4260f9aa46c45a41454`
("xgd(ticket): update request request-439cd0c8", 2026-09-02) does exactly three
things: advance `status` `ready_to_reconcile` → `bundled`, add
`fields.bundled_in`, and bump `updated_at`.

Its substantive intent — **this request is bundled, and records which bundle** —
is fully present in the resolved version:

- `status: bundled` — already on HEAD, identical to incoming. The incoming
  transition is satisfied, not discarded.
- `fields.bundled_in` — present on HEAD, pointing at the *later* bundle that
  superseded the incoming one for the same request set.

No incoming hunk was dropped under the BUG-1301 precedence exception; none was
needed. The one incoming fact not carried forward (`bundled_in: bundle-203b1dc2`)
lost on the 2e later-positioned-intent rule, not by omission — the overlay
seeded from main (`d58e8e3fd3 seed_local_overlay`) has already advanced this
ticket past the incoming state.

This resolution leaves no net change from HEAD (staged blob
`a8c14c1e9b0a39ba3b2218d64a4515bd38a951a9` == `HEAD:` blob). Staged as-is per
STEP 4; `--skip` not invoked, `CHERRY_PICK_HEAD` left intact for finalize.
