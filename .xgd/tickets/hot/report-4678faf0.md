---
uid: report-4678faf0
id: REPORT-5533
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T10:14:49.578800+00:00'
updated_at: '2026-09-29T10:14:49.578800+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `package.json` — UU (both modified), config file → rule 2g (scalar conflict: incoming wins).
  Sole conflicting hunk was the `version` scalar: HEAD `0.2.50` vs incoming `0.2.51`.
  Resolved to `0.2.51`. This agrees with the incoming commit's own stated intent
  (68db393777: "Resolved to 0.2.51, above both sides ... because the two bumps are
  independent and the higher of the two is not a superset of the other") and is
  monotonic against HEAD. No other hunks in the file.

## Incoming changes preserved

- `package.json`: the staged blob is `cc520a65479f0ddc14cbd43032ca4361979228cd`, which is
  byte-identical to `68db393777:package.json`. Every incoming change is therefore present
  verbatim; nothing from the incoming side was dropped.

No hunks were dropped under the BUG-1301 precedence exception. No UAT test files were
touched by this conflict.

## Note for post-merge review

The defect that incoming commit 68db393777 was written to fix — conflict markers committed
into `package.json` by a raced merge — is **not** present on this resync branch: HEAD's
`package.json` (`d5d6174308`) is already well-formed JSON at `0.2.50`. The net effect of
this cherry-pick on the resync branch is therefore only the version bump `0.2.50` → `0.2.51`,
not the marker cleanup. That is the correct and intended outcome, but flagging it because
the commit message describes a repair that was already unnecessary here.
