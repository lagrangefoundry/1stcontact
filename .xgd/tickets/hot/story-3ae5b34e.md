---
uid: story-3ae5b34e
id: STORY-58
type: story
title: Page screenshot primitive (1c shot) — AI eyes over own output or any URL
created_by: xgd
created_at: '2026-07-09T20:19:30.608022+00:00'
updated_at: '2026-07-09T20:19:30.608022+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-f39884d2
  capability_uid: capability-4dd2cf78
  story_kind: feature
  story_points: 1
---

## Story
**As an** operator of the AI-assisted site builder, **I want** a command that screenshots my own rendered draft or published site output — or any arbitrary URL — to a PNG at a chosen, deterministic viewport, **so that** I (and the AI) have reliable "eyes" on the fully rendered page, with its own assets loaded, for visual inspection and comparison.

## Description
Provides a page screenshot primitive exposed as `1c shot`.

In scope:
- **Slug mode** — `1c shot <slug> [--source draft|published] [--viewport mobile|tablet|desktop] [--out <file>] [--sandbox]`: renders the chosen source channel, serves it over a local loopback server, and screenshots the *served* page so the site's own `/assets/` references resolve over HTTP. This is the fix for the blank-screenshot bug where screenshotting a page that could not reach its own assets produced an empty PNG.
- **URL mode** — `1c shot --url <url> [--viewport ...] [--out <file>]`: screenshots any given URL through the same browser seam.
- Deterministic named viewport presets (`mobile`, `tablet`, `desktop`; default `desktop`) with stable widths.
- PNG output; a default output location per mode, overridable with `--out`.

Out of scope:
- Multimodal AI comparison of screenshot vs capture (the later AI mapping / closed-loop step).
- A Cloudflare Browser-Rendering driver (the local browser driver is used).

## Technical Context
- Built on the same headless-**BrowserDriver seam** introduced by the reference-capture story ([[story-8f33f14c]] / CAP-52); the driver factory is injectable so tests supply a fake. Slug mode reuses the generate CLI's render + serve pipeline (REQ-9).
- Slug and URL targets are mutually exclusive; supplying both, or neither, is an error.
- The browser drives a full-page screenshot; only the viewport **width** is the fixed deterministic dimension (full-page height grows with content).
- **Intent/code divergence (flag for regression):** REQ-13 deliverables mention "optional per-section crops when a capture/segmentation is available." The current implementation does **not** emit per-section crops — it writes a single full-page PNG. This is captured here as a known gap, not as an AC asserting implemented behavior.

## Dependencies
- Plan item 1 — Reference capture / BrowserDriver seam ([[story-8f33f14c]]).

## Story Points
1
