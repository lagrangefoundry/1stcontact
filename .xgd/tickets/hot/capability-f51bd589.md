---
uid: capability-f51bd589
id: CAP-48
type: capability
title: Platform Scaffold & Cloudflare Deployment
created_by: xgd
created_at: '2026-07-08T19:03:28.705915+00:00'
updated_at: '2026-07-08T19:03:28.705915+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: platform-scaffold-deploy
---

Foundational platform capability: the pnpm monorepo skeleton, the two multi-tenant Cloudflare Worker applications (public-site marketing/customer-site server and control-app builder/portal), their production routing model, the CI and auto-deploy pipelines, and the project version-bump tool. Everything higher in the stack (site-schema, framework modules, generator, builder) is layered onto this scaffold.
