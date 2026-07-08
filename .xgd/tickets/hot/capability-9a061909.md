---
uid: capability-9a061909
id: CAP-49
type: capability
title: Site Definition Schema & Validation
created_by: xgd
created_at: '2026-07-08T19:12:12.512529+00:00'
updated_at: '2026-07-08T19:12:12.512529+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: site-definition-schema
---

The site-definition data contract for the 1st Contact platform: the typed shape of a site (business config, theme tokens, navigation, pages, module instances, assets) plus a runtime validator that determines whether an arbitrary input is a structurally valid site definition. This contract is the shared foundation imported by the framework, the generator tooling, the control app, and the persistence layer. It governs structural correctness only — field shapes, primitive types, universal enums, theme-token slot completeness, and structural uniqueness — and deliberately excludes catalog-membership correctness (whether a referenced module type/variant actually exists), which is validated at render time.
