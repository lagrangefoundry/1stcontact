---
uid: acceptance_criterion-d52afcea
id: AC-852
type: acceptance_criterion
title: A single cross-gate verb reconciles geometry, reference coverage, the perceptual
  eye and the value eye, browser-free gates first
created_by: xgd
created_at: '2026-08-06T03:12:32.205816+00:00'
updated_at: '2026-08-07T23:54:19.863881+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
One verb — `1c gate <slug> --ref <captureBundleDir>` — runs all four signals against a
single reproduction and returns **one** report, rather than leaving three verdicts in
three terminal scrollbacks with nothing comparing them.

The report carries, side by side:
- the 3-probe geometry gate's pass/fail;
- reference coverage for the bundle;
- the perceptual eye's mean difference, percent of pixels over threshold, and region
  count;
- the value eye's delta, matched and unmatched counts;

and, on top of them, a verdict, an operator-facing diagnosis and a single next step.

Ordering is observable, not incidental: the two **browser-free** signals (the geometry
gate and reference coverage) are evaluated **first**, so a stale or half-captured bundle
fails before a headless browser is ever started — a bundle carrying no reference
manifest fails without a browser process being launched.

The verb is drivable without a browser at all: supplying a pre-shot actual image and a
pre-extracted actual manifest (`--actual-image` / `--actual-manifest`) uses the same
offline seams the perceptual and value verbs already expose, and in that mode no site
slug is required. Given a slug, the graded artifacts are the same ones the three
commands produce by hand (`--source draft|published`, `--size mobile|tablet|desktop`).
With an output directory the run leaves its machine-readable report alongside the
perceptual artifacts and the values report; `--json` prints the same report to stdout.

A failing verdict sets a non-zero exit status.

## Verification
Run the verb offline against a retained capture bundle with a supplied actual image and
manifest, and assert the single returned report carries all four signals plus verdict,
diagnosis and next step. Assert a bundle with no reference manifest fails without the
injected browser driver ever being asked for a page. Assert a failing verdict exits
non-zero and a passing one exits zero.