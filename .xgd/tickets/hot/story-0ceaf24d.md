---
uid: story-0ceaf24d
id: STORY-53
type: story
title: Multi-tenant platform scaffold with auto-deploy pipeline
created_by: xgd
created_at: '2026-07-08T19:03:53.904032+00:00'
updated_at: '2026-07-08T19:03:53.904032+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-6a071846
  capability_uid: capability-f51bd589
  story_kind: feature
  story_points: 3
---

## Story
**As a** GenDev Labs platform operator, **I want** the 1stcontact platform to stand up as a monorepo of two multi-tenant Cloudflare Worker apps that auto-deploy on every promotion to the production branch, **so that** the marketing site, customer sites, and the builder/portal all have a live, reproducibly-built home before any feature work begins.

## Description
This story documents the foundational platform scaffold and its build/deploy machinery:

- **Two Worker apps.** `public-site` is the generic multi-tenant site server (apex `1stcontact.io` = the 1st Contact marketing site; slug subdomains = customer sites). `control-app` is the builder/portal application at `app.1stcontact.io`. In this scaffold each Worker returns a text/plain placeholder response; real rendering is layered on later.
- **Production routing model.** `public-site` claims both the apex route and the `*.1stcontact.io` wildcard on the zone; `control-app` claims the more-specific `app.1stcontact.io` route, so `app` is effectively a reserved slug whose route takes precedence over the wildcard.
- **CI + deploy pipelines.** A CI workflow validates every pull request (build, test, dry-run deploys). A deploy workflow deploys both Workers to the production environment on every push to `xgd-stable`, serialized so two deploys never overlap and exposing the Cloudflare credentials the deploy needs.
- **Version-bump tool.** `bin/project/xgd_version_bump` maintains the project version in the root `package.json`, satisfying the XGD free-coding version-bump gate.
- **Identifier naming.** All code identifiers are normalized to the `1stcontact` name (worker names, site definition directory).

In scope: the scaffold shape, placeholder Worker responses, routing config, CI/deploy workflows, version-bump tool, and 1stcontact naming.

Out of scope (per intent, later tickets): D1/R2/KV bindings, framework/renderer code, builder SPA, real homepage content, PR preview deploys. Operator prerequisites (Cloudflare secrets in repo settings, a `*.1stcontact.io` DNS record) are noted but are not code deliverables.

## Technical Context
- Cloudflare-first architecture (Architecture Policy §1–3): Workers are the API/site-serving layer; `public-site` is the single multi-tenant static/site server, `control-app` is the control application.
- The wildcard route requires a `*.1stcontact.io` DNS record on the zone before it resolves; that is an operator provisioning step outside this code.
- The deploy workflow's Cloudflare secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) must be set in GitHub repo settings before the first real deploy succeeds; the workflow definition exposes them but does not create them.
- This capability is the base of the build stack: CAP for site-schema (plan item 2) and the framework module capabilities (items 3–4) layer on top of this scaffold.
- Note on divergence: the intent describes the toolchain at wrangler 3 / compatibility_date 2025-07-01; a later bundled change (REQ-10, deliberately story-less) upgraded to wrangler 4. The routing/response/pipeline behaviors documented here are unchanged by that upgrade.

## Dependencies
None (foundational).

## Story Points
3
