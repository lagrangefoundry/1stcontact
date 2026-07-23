---
uid: capability-ce902be4
id: CAP-72
type: capability
title: Capability Module Contract & Catalog
created_by: xgd
created_at: '2026-07-22T19:53:07.405647+00:00'
updated_at: '2026-07-23T06:57:14.706155+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  name: capability-modules
  uat_coverage: pass
---

# Capability Module Contract & Catalog

Since the framework pivot (REQ-79/REQ-84) layout is owned by the L1 substrate,
so a **module is no longer a bundle of aesthetic dials — it is a capability**: a
vetted behavioural core (framework code the AI never writes) exposing typed
behavioural **config**, named **L1 presentation slots**, and **conformance**
obligations (including runtime **isolation**). This capability covers the
contract itself, its instance validation (the slot-as-L1 security line), the two
reframed survivor capabilities (carousel, contact-form), the shipped-client-JS
asset mechanism, and the isolation conformance dimension. See DOC-25 (Capability
Modules — Contract & Catalog) and DOC-26 (Authoring & Vetting).