---
uid: story-f826e5ca
id: STORY-62
type: story
title: Mechanical value-level fidelity diff (1c values-diff)
created_by: xgd
created_at: '2026-07-09T22:57:54.868394+00:00'
updated_at: '2026-07-09T23:07:47.512388+00:00'
completed_at: null
last_field_updated: status
status: reconciling
fields:
  intent_uid: bundle-adc60ee8
  capability_uid: capability-4dd2cf78
  story_kind: feature
  story_points: 3
---

## Story
**As a** developer reproducing an existing website against a captured reference, **I want** a command that mechanically diffs the value-level styling of my rendered draft against the captured reference — element by element and section by section — **so that** near-neighbour colours, off-by-one type scale, wrong gradient direction, missing left-bars, casing slips, and scrim/anchor drift are flagged automatically before human review, instead of being missed by eye.

## Description
Screenshots hide a whole class of fidelity delta: gold-vs-gold colours (`#f5e6a3` vs `#fbba72`), 72px-vs-48px type, a vertical-vs-horizontal gradient sweep, subtle left-bars, small-caps rendered as literal caps, and a hero scrim/overlay. These values are all explicit in a captured reference's computed styles, yet a screenshot-first reproduction ships them wrong. This story provides the mechanical safety net: a `1c values-diff` command that projects both the captured reference and our rendered draft to a flat value manifest keyed by verbatim text, aligns them, and diffs each styling field, emitting a **severity-ranked** delta report (element/section, property, expected, actual) before any human looks. Vision is then reserved for what a manifest cannot encode ("does the gradient read intentional"), not for reading a hex.

The command renders and serves the draft over loopback and reads its computed styles through the same headless-browser driver seam the eyes loop uses; a pre-extracted `--actual` manifest short-circuits the browser for offline / CI re-diffs. It compares per-run text/colour/font-size/weight/family/gradient/left-bar/line-height/letter-spacing/padding, the verbatim text (casing), and per-section scrim overlay and content vertical-anchor. Noise controls (per-metric jitter tolerances, perceptual colour distance, font-weight bucketing, a strict exact-match mode, and skipping inferred reference colours) keep a "clean" result meaningful. The command exits non-zero when any delta remains.

**In scope:** the `1c values-diff` command surface, manifest projection of both sides, field-level and section-level diffing, severity ranking, the casing delta, noise/tolerance controls (including strict mode and per-metric overrides), inferred-colour handling, offline `--actual` re-diff, and the report's human / JSON / file output forms plus its exit behavior.

**Out of scope:** capturing the per-element computed values and section scrim/anchor into the reference bundle (that is the capture upgrade this story consumes); pixel-level perceptual/screenshot diffing (a separate perceptual-diff eye); and any change to the framework modules being reproduced.

## Technical Context
- Consumes the enriched capture essence (per-element `lineHeightPx`, `letterSpacingPx`, text-fill gradient, left-border treatment, `paddingLeftPx`, section scrim overlay, content-anchor ratio, and the `colorInferred` low-confidence flag) that the capture story records; only fields present on the reference side are compared, so pre-enrichment bundles diff gracefully on the fields they do carry.
- The actual side is produced through the same headless-browser driver seam as the screenshot/eyes primitive (render → serve over loopback → read computed styles), keeping it swappable for a Cloudflare browser driver.
- Verbatim captured text is the join key for text runs (repeated texts pair FIFO in document order); sections join by ordinal index. Colour comparison uses a redmean ΔE approximation deliberately tight enough to preserve the flagship near-neighbour-gold guarantee; line-height tolerance is proportional to font size.
- Companion to CAP-52 capture (reference half of the fidelity loop) and complementary to the perceptual-diff eye, which sees composition/geometry deltas this value diff is structurally blind to.

## Dependencies
- Depends on the capture per-element computed values + section scrim/anchor upgrade (STORY-57, plan item 5): the diff compares exactly the per-element and section values capture must first record.

## Story Points
3