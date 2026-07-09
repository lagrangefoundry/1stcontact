---
uid: capability-4dd2cf78
id: CAP-52
type: capability
title: 'Reference Capture: Headless-Browser Vision'
created_by: xgd
created_at: '2026-07-09T20:10:52.387737+00:00'
updated_at: '2026-07-09T20:10:52.387737+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: reference_capture
---

Rendered-only reference capture of live web pages (DOC-13 — Reference Capture Model). A real headless browser navigates a live URL, lets JS hydrate, intercept-caches every response, queries the browser for computed styling signals, and writes a self-contained, gitignored capture bundle (structured essence + screenshot + rendered/raw HTML + mirrored assets) that is fully re-extractable offline. The browser is reached through a CF-Browser-Rendering-shaped driver seam so the local Playwright implementation can later be swapped for a Cloudflare driver with no change above the seam.

This capability is the AI's "eyes and structured input" for reproducing existing sites; it is catalog-agnostic (independent of the module catalog) and supersedes any static-first extraction approach.
