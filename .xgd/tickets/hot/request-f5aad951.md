---
uid: request-f5aad951
id: REQ-17
type: request
title: 'Bespoke-module lifecycle: draft-module rendering + publish-gate-on-hardening'
created_by: xgd
created_at: '2026-07-02T00:20:05.021809+00:00'
updated_at: '2026-08-20T21:38:29.620768+00:00'
completed_at: null
last_field_updated: status
status: abandoned
fields:
  story_points: 5
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-7cfc457d
---

## Scope

The [[DOC-14]] plumbing that makes Tier-B (bespoke modules) real: `1c render` resolves **site-local / draft** modules (not just the shared library), and **publishing gates on module hardening** — a site cannot publish while it depends on an unhardened bespoke module.

## Dependencies
REQ-9 (`1c` CLI / render), [[DOC-14]], [[DOC-12]] (publish gate).

## Deliverables
- **Module resolution:** `1c render` loads a site-local module dir in addition to `packages/framework`; a draft module renders in the **draft** channel.
- **Hardened marker:** a module carries a `hardened` state (set by the XGD harden pass).
- **Publish gate:** `1c publish` refuses when any depended-on module is unhardened, with a clear, structured error.
- **Capability spec:** a gap emits a structured capability request (target screenshot + description) — the [[DOC-13]] gap-log entry.

## UATs (`test_UAT_FC_REQ-17_*`)
- `test_UAT_FC_REQ-17_render_resolves_site_local_module` — a draft renders using a site-local module.
- `test_UAT_FC_REQ-17_publish_blocked_unhardened` — publish is blocked (clear error) with an unhardened dependency.
- `test_UAT_FC_REQ-17_publish_allowed_after_harden` — publish succeeds once the module is marked hardened.
- `test_UAT_FC_REQ-17_capability_spec_emitted` — a gap produces a capability spec.

## Out of scope
The XGD harden pass itself (its own workflow); the in-session drafting UX (builder).


---

## ABANDONED — superseded by the framework pivot (2026-08-20)

This ticket was written against the [[DOC-14]] two-tier *layout*-module model, which
the framework pivot (REQ-79 / REQ-84 / REQ-85 / REQ-96) withdrew. Every deliverable
above has either moved or evaporated:

- **Module resolution for site-local modules.** There are no layout modules to author
  site-locally any more — layout is owned by the L1 substrate ([[DOC-23]]), and a
  composition gap is closed by **adding a typed L1 primitive**, never by a bespoke
  module dir. "Module" now means a *behavior* module, and the catalog is a
  compile-time registry of plain TS components bound in
  `packages/framework/src/modules/registry.ts` — deliberately so, because REQ-148
  requires behaviors to render in workerd. Per-site dynamic module loading at render
  time is now against the architecture, not a missing feature.
- **Hardened marker + publish gate.** The gate concept survives, but as *process*, not
  a `1c publish` flag: [[DOC-26]] §4 defines the vetting obligations a behavior must
  clear (contract, `validateBehavior*`, the five universal conformance ACs of
  [[DOC-20]] incl. isolation, vetted `client.js`, security review) before a site can
  go live on it. Nothing in the current architecture produces the "unhardened
  site-local module" state this ticket proposed to gate against.
- **Capability spec / gap-log.** Owned by [[DOC-21]] (reproduction-driven growth
  loop) — its attribution ladder, with the REQ-85 update rungs (L1 axis → configure
  an existing behavior → new behavior module). The extend-first framing this ticket's
  design discussion identified as missing is now the ladder's default.

No code was written against this ticket.