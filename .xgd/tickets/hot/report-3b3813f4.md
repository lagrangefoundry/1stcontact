---
uid: report-3b3813f4
id: REPORT-4879
type: report
title: 'Resync resolve conflicts: 47116ed717337769dcd15931d012acf6050e6d0a'
created_by: xgd
created_at: '2026-09-23T22:52:35.622427+00:00'
updated_at: '2026-09-23T22:52:35.622427+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e** (later-positioned intent, **per fact**).

  The complete ours-vs-theirs delta was exactly two frontmatter facts
  (`git diff :2:<path> :3:<path>` → 2 insertions, 2 deletions); the bodies are
  byte-identical on both sides, so no body composition was required. Resolved
  per fact:

  - `updated_at` — ours `2026-09-09T21:32:50` vs incoming `2026-09-02T17:48:27`.
    **Ours** (later).
  - `bundled_in` — ours `bundle-87be4669` vs incoming `bundle-203b1dc2`.
    **Ours**, on evidence rather than timestamp alone (see below).

  Both facts resolved to ours, so the staged tree carries no net change from
  HEAD. Left staged and un-skipped per instruction; finalize owns the skip.

## Why `bundled_in` took ours rather than the incoming value

The two bundles carry the **same title** — `REQ-164 + REQ-159 + REQ-165 +
REQ-163 + REQ-161 + 2 more` — so this is a re-bundle of one ticket set, not two
competing memberships:

| | `bundle-203b1dc2` (incoming) | `bundle-87be4669` (ours) |
|---|---|---|
| id | BUNDLE-23 | BUNDLE-26 |
| created_at | 2026-09-02T17:48:26 | 2026-09-09T21:32:49 |
| status | `ready_to_reconcile` | `free_and_reconciled` |
| completed_at | null | 2026-09-11T10:28:16 |
| `main_sha` | null | `66e172dd4c0dc0ac26775c9b8aacf520bb5e7505` |

REQ-158 is a member of **both** (`## REQ-158:` section present in each), so no
membership is lost either way. BUNDLE-26 is the later re-bundle and the one that
actually reconciled to main; BUNDLE-23 never did. Taking the incoming value
would have repointed a reconciled request at a superseded bundle.

Corroborating the ordering independently of the frontmatter: ours was written by
`c94654a355` (`seed_local_overlay`, 2026-09-09 14:35), whose `bundled_in` was
set one second after BUNDLE-26's `created_at` — and BUNDLE-26 itself carries an
`orphan_commits` list, i.e. it has already been through a resync.

## Incoming changes preserved

The incoming commit `2902e1daf1` touched **frontmatter only** — no body hunks,
no code. Its three changes:

- `status: ready_to_reconcile` → `bundled` — **already present on HEAD**
  (`status: bundled`). The incoming intent "this request is now bundled" is
  preserved in the resolved file.
- `updated_at` bump to `2026-09-02T17:48:27` — superseded by HEAD's strictly
  later `2026-09-09T21:32:50`.
- `bundled_in: bundle-203b1dc2` added — superseded by HEAD's
  `bundle-87be4669`, per the evidence above.

No code or implementation file was in this conflict, so no BUG-1301 precedence
exception was invoked and no UAT function was touched. No developer code was
discarded: the only incoming value not carried forward is a bundle pointer whose
target was superseded by a later bundle that reached main.
