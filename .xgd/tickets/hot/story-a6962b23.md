---
uid: story-a6962b23
id: STORY-65
type: story
title: 'Module conformance harness: isolated per-module render with proven safety
  + security discrimination'
created_by: xgd
created_at: '2026-07-10T00:14:31.656797+00:00'
updated_at: '2026-07-10T00:14:31.656797+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-df065afc
  capability_uid: capability-5d657ee3
  story_kind: feature
  story_points: 3
---

## Story
**As a** framework/module author, **I want** a single conformance check that renders any module in isolation through the real catalog renderer and fails on any safety or security violation — with its own discrimination proven by deliberately-broken fixtures — **so that** every module leaf can delegate to one trustworthy contract check instead of hand-rolling (and rubber-stamping) its own.

## Description
Provides the shared conformance discriminator (DOC-20) that a module's conformance test invokes on a module id plus a set of rendered fixtures. Each fixture is assembled into a one-module page, rendered through the *same* catalog renderer shipping sites use, and served over the loopback seam (shared with reference capture / values-diff), then driven with a headless browser. The check throws, enumerating every non-excepted violation, or completes cleanly.

Two dimensions of one seam:
- **safety** (default) — the render is not broken: no console/page errors or unhandled rejections, no failed requests, no horizontal overflow, no expected-content container collapsed to zero height, no clipped text; run at a desktop and a mobile viewport.
- **security** — the module is the sanitization boundary for untrusted content: schema-derived hostile payloads render inert (no unsafe URL scheme, no live inline handler / executed payload, no CSS-context breakout) and the render issues no network request outside the same-origin-assets + declared-allowlist set.

A declared exemption list lets a fixture legitimately opt out of a specific check. Isolation is structural: each fixture renders and serves under its own throwaway store root — never real site storage — removed on a clean pass and preserved (path logged) on failure. The harness's own correctness is the gated deliverable: deliberately-broken fixture modules must be flagged red while a clean module passes, so leaves delegate to a proven discriminator.

**In scope:** the conformance check surface, the safety + security dimensions, the isolation/no-pollution model, the exemption mechanism, schema-derived injection payloads, the graceful no-browser skip, and treating a fail-loud content-safety refusal as conformant.
**Out of scope:** dependency/supply-chain scanning, auth, cross-engine/responsive dimensions, and the render-path content-safety *enforcement* itself (a separate capability the security dimension merely detects/consumes).

## Technical Context
- Reuses the existing loopback render+serve seam (CAP-52 reference capture / values-diff) and the headless-browser driver; enabling seams added by this work — a viewport-aware `navigate`, page diagnostics (console/page errors, failed + requested URLs), and an injectable module resolver + extra CSS on the renderer — let deliberately-broken test-only fixtures render through the SAME renderer without touching the shipping catalog (CAP-51).
- Security-dimension payloads are derived generically from each module's declared content schema (CAP-49/50), so a new content field is fuzzed the moment it is declared — not hand-listed per module.
- **REQ-46 coupling / divergence note:** the security dimension counts a thrown framework content-safety error (a module refusing to emit dangerous content) as a *conformant safe-rejection*. When REQ-40 shipped, real catalog modules did not yet enforce this at render time — the dimension's gap-demonstration was migrated to REQ-46's RED acceptance spec (a separate story: render-path content safety). This story documents the harness's detection/refusal-counting behaviour, not the render-path enforcement.

## Dependencies
None (item 1 of the BUNDLE-4 reconciliation plan; no plan-item dependencies).

## Story Points
3
