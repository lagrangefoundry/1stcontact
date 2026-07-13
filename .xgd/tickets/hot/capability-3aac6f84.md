---
uid: capability-3aac6f84
id: CAP-57
type: capability
title: Fidelity Capture Extraction & Verification Correctness
created_by: xgd
created_at: '2026-07-13T20:12:33.346892+00:00'
updated_at: '2026-07-13T20:12:33.346892+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: fidelity-extraction-correctness
---

## Capability: Fidelity Capture Extraction & Verification Correctness

What the fidelity comparison can actually *see* — the correctness of the values
extracted from a captured page and the integrity of the comparison against a
reference. Governs *whether a real difference is observable at all*, as distinct
from how differences are surfaced to a reader (CAP-56 Fidelity Value-Diff
Reporting) and from the tolerance policy that decides how close counts as a
match.

Two concerns live here:
- **Capture extraction correctness** — resolving computed CSS values (notably
  colour) into the comparison vocabulary faithfully, across the colour formats
  modern sites emit, so a genuine value is never lost to a parse failure and
  replaced by a low-confidence sentinel.
- **Comparison verification integrity** — refusing to report a "match" for data
  that was never actually compared (e.g. geometry present on only one side of a
  pairing), so a stale or incomplete reference cannot silently pass checks it
  never ran.

Established during reconciliation of BUNDLE-5 (REQ-52 free-coded blind-spot
fixes). Home for modern-CSS colour resolution and stale-reference geometry
flagging.
