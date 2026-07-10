---
uid: capability-5d657ee3
id: CAP-54
type: capability
title: Module Conformance Harness
created_by: xgd
created_at: '2026-07-10T00:14:05.805187+00:00'
updated_at: '2026-07-10T00:14:05.805187+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: module_conformance
---

The shared discriminator every module leaf delegates to (DOC-20 — "Who tests the harness"). A single conformance check renders each module in isolation through the *real* catalog renderer, serves it over the same loopback seam as reference capture / values-diff, drives a headless browser, and fails on any non-excepted violation against a universal module contract.

Two dimensions of one seam:
- **safety** (default): the render is not broken — no console/page errors, no failed requests, no horizontal overflow, no collapsed expected-content container, no clipped text; checked at desktop + mobile.
- **security**: the module is the sanitization boundary for untrusted content — schema-derived injection payloads render inert (no unsafe URL schemes, no live handlers/scripts, no CSS-context breakout) and the render makes no off-allowlist network egress.

The harness's *own* correctness is the gated deliverable: deliberately-broken fixtures prove it flags each failure category red while a clean fixture passes, so module leaves delegate to a proven discriminator rather than a rubber-stamp. Consumed by every thin module conformance UAT.
