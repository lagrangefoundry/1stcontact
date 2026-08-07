---
uid: capability-ce902be4
id: CAP-72
type: capability
title: Behavior Module Contract & Catalog
created_by: xgd
created_at: '2026-07-22T19:53:07.405647+00:00'
updated_at: '2026-08-07T15:27:46.593200+00:00'
completed_at: null
last_field_updated: status
status: deprecated
fields:
  name: capability-modules
  uat_coverage: pass
  merged_into: capability-ae9d65d6
---

# Behavior Module Contract & Catalog

Since the framework pivot (REQ-79/REQ-84) layout is owned by the L1 substrate,
so a **module is no longer a bundle of aesthetic dials — it is a behavior**: a
vetted behavioural core (framework code the AI never writes) exposing typed
behavioural **config**, named **L1 presentation slots**, and **conformance**
obligations (including runtime **isolation**). This capability covers the
contract itself, its instance validation (the slot-as-L1 security line), the two
reframed survivor behavior modules (carousel, contact-form), the shipped-client-JS
asset mechanism, and the isolation conformance dimension. See DOC-25 (Behavior
Modules — Contract & Catalog) and DOC-26 (Authoring & Vetting).

The runtime type was renamed `capability module` → **behavior module** by REQ-87
(a mechanical rename, no functional change) precisely so that "capability" names
only the XGD capability matrix — the bucket you are reading — and never the
framework runtime type.



---

**ABSORBED 2026-08-05 (structural rebalance).** All stories previously under this
capability were reassigned to **Framework Substrate: L1 Layout, Values & Behavior Modules** (`capability-ae9d65d6`).
This capability now holds zero stories and is retained only as a historical
pointer. It could not be set to `status: deprecated` in this run — see the
rebalance report for the blocking index defect.