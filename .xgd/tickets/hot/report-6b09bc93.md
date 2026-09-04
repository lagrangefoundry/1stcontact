---
uid: report-6b09bc93
id: REPORT-3328
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T19:21:50.699755+00:00'
updated_at: '2026-09-02T19:21:50.699755+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — **UU**, intent/bookkeeping ticket
  (`bug-*`), so **rule 2e**. Incoming commit `6ffb45e6e6a1946f9fbf1eabc76afb39aa31c025`
  ("xgd(ticket): update bug bug-db356ff8", 2026-08-23), kind unknown on both
  sides per the enrichment note. Two hunks, resolved per-fact rather than by
  picking a winning file:

  - **Hunk 1 (frontmatter, `updated_at` / `completed_at` /
    `last_field_updated` / `status`)** — same fields changed differently on
    each side: a genuine per-fact conflict. HEAD carries
    `updated_at: 2026-08-31T19:19:38`, `completed_at: 2026-08-31T19:19:38`,
    `last_field_updated: status`, `status: free_and_reconciled`; the incoming
    side carries `updated_at: 2026-08-23T23:42:40`, `completed_at: null`,
    `last_field_updated: body`, `status: draft`. HEAD is the later-positioned
    side by a week, and the incoming values are the pre-reconcile bookkeeping
    state — taking them would have reverted an operator-owned status
    (`free_and_reconciled` → `draft`) and unset `completed_at`. **Kept HEAD.**
    The incoming side's only substantive frontmatter edit was its own
    `updated_at` bump, which HEAD's later timestamp already supersedes.

  - **Hunk 2 (tail of body)** — non-overlapping, not competing. The incoming
    side of this hunk is **empty**; HEAD appends a section the incoming commit
    never had (`# Implementation — the tenant fix`, ~107 lines: the
    `storeFor` / `UnknownTenantError.reason` writeup, the
    `test_UAT_FC_BUG-36_tenant_bootstrap.workers.test.ts` inventory, the
    REQ-149/AC-10 supersession note, and the still-open Error 1102 note).
    **Kept HEAD's addition; nothing from the incoming side was dropped**, as
    there was nothing on that side of the hunk to drop.

## Incoming changes preserved

Confirmed. The incoming commit's substantive content change is a single
42-line body append — `## Implementation — landed and verified end to end
(2026-08-23)` — and **all of it is present in the resolved file**, outside the
conflict region: it merged as common content because a prior merge-back had
already landed it on the bundle branch. Verified line by line against
`git show 6ffb45e6e6 -- .xgd/tickets/hot/bug-db356ff8.md`; spot-checks in the
resolved file:

- L234 `## Implementation — landed and verified end to end (2026-08-23)`
- L241 `Token       created '1stcontact-publish'`
- L249 `Production D1 afterwards: tenants=1, sites=1, pages=2, assets=9`
- L253 `### A third finding, met while running it`
- L258 `NODE_USE_ENV_PROXY=1 the same command reached the edge and completed.`
- L266 `### The client secret was never printed into the session`
- L273 the closing client-id line

No hunk was dropped under the BUG-1301 precedence exception; it did not apply
here.

## Note on the net staged diff

Because HEAD already carried the incoming body section and HEAD won the
frontmatter per-fact, the staged result differs from HEAD by exactly one
thing: the file now ends with a trailing newline where HEAD's copy had none
(`\ No newline at end of file`). That terminator comes from the incoming
side's blob, so it is kept. This is the redundant-commit case of
BUG-1109/BUG-1122, not a discard — STEP 3's check passes, since the incoming
commit's key changes are demonstrably present in HEAD rather than absent.
`--skip` was not called; staging is left for
`cherry_pick_finalize_resolution` to handle.

## Staging state

`git status --porcelain` shows no conflict classes remaining — the file is
`M ` (staged, modified). `CHERRY_PICK_HEAD` is intact; no
`cherry-pick --continue/--skip/--quit/--abort`, `reset`, or `checkout <branch>`
was run.
