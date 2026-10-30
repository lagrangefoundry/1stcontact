---
uid: report-cb0a28ab
id: REPORT-5530
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T10:08:17.969719+00:00'
updated_at: '2026-09-29T10:08:17.969719+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `package.json` — UU, class 2g (config file). Single conflicting hunk: the
  `"version"` scalar. HEAD carries `0.2.49`; incoming commit `b1cafc80b7`
  (REQ-178, *an account operates several businesses, not one*) bumps
  `0.2.47 -> 0.2.48`. Both `0.2.48` and `0.2.49` are already consumed on this
  branch (`42a2d9f9fa` and `85b747cbb0` respectively), so the incoming literal
  cannot be taken. Resolved to `0.2.50`.

  Deviation from the auto-enrichment rule, stated explicitly: the enrichment
  said "intent unknown on one or both sides, take the more recent commit by
  timestamp" — that would be HEAD (`2026-09-29`) over incoming
  (`2026-09-02`), i.e. keep `0.2.49`. Taking `0.2.49` verbatim would silently
  discard the incoming side's only change to this file (its version bump),
  leaving the resynced commit with no bump at all — which
  `bin/project/xgd_version_bump --check <sha> --version X.Y.Z` (invoked by
  `xgd ticket move-to-free-coded`) is designed to catch. `0.2.50` is the next
  free patch above the more-recent side and preserves the incoming commit's
  intent (this commit carries a bump) without reusing a number already in this
  branch's history. Per the enrichment's own instruction, flagging this file
  for post-merge review.

  The version is convention-only: per `bin/project/xgd_version_bump`'s module
  docstring, the Cloudflare Workers runtime never reads it, so no behaviour
  depends on the literal chosen.

- `apps/control-app/src/identity.ts` — applied cleanly, no conflict. Staged.
- `tests/test_UAT_FC_REQ-167_identity.workers.test.ts` — applied cleanly, no
  conflict. Staged.
- `tests/test_UAT_FC_REQ-178_businesses.workers.test.ts` — new file, applied
  cleanly, no conflict. Staged.

No DU/UD/AA conflicts. No ticket-file conflicts. No UAT test function was
deleted on either side; the BUG-1301 precedence exception was not invoked and
no incoming hunk was dropped.

## Incoming changes preserved

Verified by diffing the staged index blob against the incoming commit blob for
every file the cherry-pick touched:

- `apps/control-app/src/identity.ts` —
  `git diff b1cafc80b7:<path> :<path>` is **empty**: the staged content is
  byte-identical to the incoming commit. `admit` returning the set of
  `AdmittedBusiness` (each with its own grant and `tenants.name`), the deleted
  singular `accountId`/`entitlement`, the lapsed-grant-marks-unselectable
  denial change, and the extracted `provisionBusiness` sibling are all present.
- `tests/test_UAT_FC_REQ-167_identity.workers.test.ts` — diff against incoming
  is **empty**. Both REQ-167 UATs updated for the new admission shape are
  present.
- `tests/test_UAT_FC_REQ-178_businesses.workers.test.ts` — diff against
  incoming is **empty**. All 10 REQ-178 UATs present, unmodified.
- `package.json` — the incoming side's only change to this file is its version
  bump; that intent is preserved as `0.2.50` (see rationale above). The
  literal `0.2.48` is not present because it is already occupied on this
  branch by `42a2d9f9fa`.

Staging verified clean: `git status --porcelain` shows no UU/AA/DU/UD lines —
three `M` and one `A`, all staged. `CHERRY_PICK_HEAD` left in place; no
`--continue`/`--skip`/`--quit`/`--abort` was issued.
