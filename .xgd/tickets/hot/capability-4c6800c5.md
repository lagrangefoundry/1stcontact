---
uid: capability-4c6800c5
id: CAP-55
type: capability
title: 'Framework: Render-Path Content Safety'
created_by: xgd
created_at: '2026-07-10T00:32:43.719117+00:00'
updated_at: '2026-07-10T00:32:43.719117+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: render_path_content_safety
---

# Framework: Render-Path Content Safety

The framework treats each module as the **sanitization boundary** for untrusted
(AI-/customer-supplied) content. The render/validate path rejects dangerous
content — unsafe URL schemes and injectable HTML — **loudly** at render time
rather than silently emitting or stripping it, so a build fails with an
actionable error that the generating author can see and correct.

Sibling to the Module Conformance Harness (CAP-54): the harness is the *detector*
of injection vectors; this capability is the *enforcer* in the production render
path. The two share a single definition of "unsafe".
