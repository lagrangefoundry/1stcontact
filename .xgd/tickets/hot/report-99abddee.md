---
uid: report-99abddee
id: REPORT-3320
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T19:03:11.921034+00:00'
updated_at: '2026-09-02T19:03:11.921034+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — **UU**, intent/bookkeeping ticket (STEP 2 rule **2e**;
  `request-*`, user-authored bookkeeping, not matrix-defining spec state). Resolved **per-fact**, not
  by whole-file winner. Both conflict regions resolved to HEAD; staged with `git add --sparse`
  (`.xgd/tickets/` is outside the reconcile branch's sparse-checkout cone, DOC-986 §2/§4.1).

Incoming commit: `c9f82a85cdfd4211ae075ce9306b7c276ec8fb00` (2026-08-23 15:01 -0700), 4+/4− in this
file only. HEAD-side commit: `5e6f3a68c65de745a528ba9cb929236465d892f5` (2026-09-01 15:04 -0700).
The conflict-intent enrichment reported intent unknown on both sides, with the rule "take the more
recent commit by timestamp" — HEAD is 9 days later, which agrees with the per-fact outcome below.

### Per-fact resolution — region 1 (frontmatter, lines 8–18)

| Fact | HEAD (ours) | Incoming (theirs) | Resolution |
|---|---|---|---|
| `updated_at` | `2026-08-31T14:22:34` | `2026-08-23T22:01:13` | same field, differs → later intent → **ours** |
| `completed_at` | `2026-08-31T14:22:34` | `null` (unchanged from base) | only ours moved off base → **ours** |
| `last_field_updated` | `status` | `status` | identical on both sides → no conflict |
| `status` | `free_and_reconciled` | `free_coding` | same field, differs → later intent → **ours** |

The status fact is the substance of the incoming commit: it advanced the ticket `free_coded →
free_coding`. HEAD has since carried the same ticket through that state and out the other side to
`free_and_reconciled`. The incoming transition is superseded by a later position on the same
lifecycle, not competing with it.

### Per-fact resolution — region 2 (body tail, lines 458–546)

HEAD is a **strict superset**: its region opens with the incoming side's entire text
(`changes. Ticket version is now 0.2.7.`) verbatim, then adds the "Follow-up: the deploy secret guard
asked the wrong question" section (ACs 13–16, version bookkeeping to 0.2.9). Superset rule (2e) →
**ours**. The only byte the incoming side uniquely carries is the dropped trailing newline at EOF;
the HEAD blob is also `\ No newline at end of file`, so that is preserved too.

No fields were invented, and `fields.intent_uid` / `story_uid` / `capability_uid` were not touched.

## Incoming changes preserved

No code/implementation files were in this conflict — the sole conflicted path is a bookkeeping
ticket, so STEP 3's code-file verification does not apply and no BUG-1301 precedence exception was
invoked.

Verified against `git show c9f82a85cd -- .xgd/tickets/hot/request-554ac441.md`, which contains
exactly two hunks. Both fell inside conflict markers, so nothing from the incoming side was
auto-merged elsewhere in the file and silently dropped by restoring the ours blob; that was checked
before resolving, not assumed. Accounting for both hunks:

- **Body hunk** — the incoming text is present verbatim in the resolved file (line 459).
- **Frontmatter hunk** — the incoming `status: free_coding` is absent by design. This is the
  redundant case of STEP 4, not the discarded case of STEP 3: the incoming commit's intent was a
  lifecycle advance that HEAD already made and then moved past, 9 days later. Its effect reached
  HEAD by a different route.

## Net result

`git diff --cached HEAD` is **empty** — the resolution nets to no change from HEAD, the expected
outcome when a post-watermark sync already delivered this bookkeeping in refined form
(BUG-1109 / BUG-1122). Per STEP 4 this is not a @fail, and `--skip` was **not** called: staged and
exited @done for `cherry_pick_finalize_resolution` to detect the clean staged diff and skip the
commit. `CHERRY_PICK_HEAD` was confirmed still present after staging.

## Post-merge review flag

The enrichment asked that this file be flagged for post-merge review (intent unknown on both sides).
Flagging here: `request-554ac441` (REQ-149) reaches main as `free_and_reconciled` @ version 0.2.9,
and the bundle's replay of its `free_coding` transition is intentionally not applied.
