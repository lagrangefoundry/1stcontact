---
uid: goal-8b5423fd
id: GOAL-20
type: goal
title: Deployment
created_by: xgd
created_at: '2026-08-06T00:53:43.010427+00:00'
updated_at: '2026-08-06T00:53:43.010427+00:00'
completed_at: null
last_field_updated: created_at
status: in_progress
fields:
  provenance: planned
---

Getting a built site in front of real visitors, and getting the builder itself
running where customers can reach it.

**Landed:** the R2 artifact store and `1c deploy` (REQ-110), the `public-site`
Worker serving both draft previews and published sites from R2 (REQ-111),
extensionless URL resolution, and root-namespaced R2 keys so a sandbox deploy
can never overwrite a real site.

**Open:** REQ-119 — request-time draft and edit renders inside `control-app` via
the Astro Cloudflare adapter. DOC-28 §12 makes this T5, deliberately last: it
changes *where* the render runs, not *what* it produces.

Blocks XGD website Phase 1 "Finalize copy" — the copy cannot be finalised in the
editor until the editor is deployed.
