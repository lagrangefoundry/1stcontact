---
uid: report-0f378dfb
id: REPORT-4083
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T22:58:34.279731+00:00'
updated_at: '2026-09-11T22:58:34.279731+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` (BUG-36) — class **UU**, sparse-cone
  (index-only conflict, no working-tree markers until materialized).
  Rule **2e** (intent/bookkeeping ticket, `bug-*`). The auto-enriched metadata
  reported intent unknown on both sides ("take the more recent commit by
  timestamp and flag for post-merge review"); both subjects are the identical
  `xgd(ticket): update bug bug-db356ff8`.

  Two conflict hunks, resolved per-fact:

  1. **Frontmatter lifecycle block** — resolved toward **HEAD**. HEAD carries
     `status: free_and_reconciled`, `updated_at`/`completed_at`
     `2026-08-31T19:19:38`, `last_field_updated: status`, plus the fields
     `story_points: 3`, `commits` (working_sha `ea48502d0d`), `version: 0.2.10`
     and `bundled_in: bundle-78f4e2fe`. The incoming side is the older
     `2026-08-24T01:48:23` snapshot with `status: draft`, `completed_at: null`
     and none of those fields. HEAD is both the later timestamp (the enrichment
     rule) and a strict superset of the incoming frontmatter (2e's superset
     clause). Taking incoming would have regressed an already-reconciled ticket
     to `draft` and dropped its commit/version/bundle bookkeeping.

  2. **Final body line** — byte-identical text on both sides; the sole
     difference is a trailing newline. Kept HEAD's form.

  Materialized with `git cat-file blob :2:<path> > <path>` (the `checkout --ours`
  verb is denied under this session's don't-ask mode) and staged with
  `git add --sparse`, each as the sole content of its own call.

## Incoming changes preserved

Confirmed present. The incoming commit `5af1ff949d` is a +112/-2 edit whose
substance is body content: the `## Status` paragraph and the whole
`# Implementation — the tenant fix` section (What changed table, the `storeFor`
code block, "Why `reason` had to be exposed", Scope of what the bootstrap may
create, Tests, Supersession — one REQ-149 assertion, Verified, Still open).

Verification method: `diff -u <incoming blob> <resolved file>`. The only two
differing regions are the frontmatter lifecycle block (hunk 1 above) and the
trailing newline (hunk 2). Every body line the incoming commit adds appears
verbatim in the resolved file — HEAD already carried them, landed ahead of this
replay by a post-watermark sync.

No hunk was dropped under the BUG-1301 precedence exception; no test file was
touched by this commit.

**Net effect:** the staged tree is byte-identical to HEAD, so this cherry-pick
is a genuine no-op. Per STEP 4 this is NOT a failure and `--skip` was not
called: STEP 3's check distinguishes redundant from discarded, and this is
redundant — the incoming commit's key changes ARE present in HEAD, via a
different route. `cherry_pick_finalize_resolution` will detect the clean staged
diff and skip the commit.

`CHERRY_PICK_HEAD` left intact at `5af1ff949d`. No `--continue`, `--skip`,
`--quit`, `--abort`, `reset` or branch checkout was run; no test suite was
invoked.

## Flagged for post-merge review

Per the enrichment rule's "flag this file for post-merge review" clause: the
intent could not be determined on either side, so the choice of HEAD's
frontmatter rests on timestamp and superset reasoning rather than on a declared
operation narrative. The facts at stake are lifecycle bookkeeping only
(`status`, `completed_at`, `version`, `bundled_in`, `commits`), not ticket
content — and the ticket's body is identical on both sides.
