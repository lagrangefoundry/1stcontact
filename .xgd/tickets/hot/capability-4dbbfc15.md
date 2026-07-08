---
uid: capability-4dbbfc15
id: CAP-51
type: capability
title: 'Website Framework: Theming & Module Catalog'
created_by: xgd
created_at: '2026-07-08T19:19:29.995372+00:00'
updated_at: '2026-07-08T19:19:29.995372+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: framework-theming-module-catalog
---

The 1st Contact website framework's rendering foundation: the theme-token system, the deterministic CSS generator that turns a site's tokens into published stylesheet variables, and the versioned module catalog from which a site's sections are resolved and rendered. Modules are token-styled, contract-conforming building blocks (chrome: header/hero/footer; content: text-block/services-grid/contact-form) discovered through a single registry keyed by id + version. This capability governs how a site's visual system and section catalog are expressed and rendered; it is consumed by the static generator and the control app. The site-definition schema (CAP-49/50) owns the theme-token shape; this capability supplies defaults for every slot and the generation/rendering behavior layered on top.
