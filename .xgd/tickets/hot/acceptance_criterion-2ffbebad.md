---
uid: acceptance_criterion-2ffbebad
id: AC-1349
type: acceptance_criterion
title: A folded bundle materializes into a servable site with its seams mounted and
  every media handle localized
created_by: xgd
created_at: '2026-08-20T12:48:46.262574+00:00'
updated_at: '2026-08-20T13:54:56.201238+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The fold produces a document; a second verb — `1c repro <slug> --ref <bundle>` —
**materializes** it into a servable site, so the ordinary render / serve / shot / compare
loop runs against the reproduction unchanged.

- The site's page document **is** the bundle's folded L1 document, with one behavior-module
  instance mounted per recovered seam, each bound by name to the `slot` the fold emitted
  and carrying that seam's capture-derived config and its L1 subtree. A bundle whose L1
  seams and behaviour bindings disagree is part-stale and fails the run with a re-capture
  instruction, rather than rendering its behaviours as inert placeholders.
- The assembled definition is validated before anything touches disk, so a fold that does
  not satisfy the page schema surfaces here rather than at render time.

**Materialization is where the reproduction is made self-contained.** Every media handle
the folded document names — an image `src` and any node's background-image handle alike,
plus the font resource table — is rewritten from the captured origin to the bundle's own
mirrored asset, and the bundle's assets are copied into the site:

- A handle with **no** mirrored asset **fails the run outright**, naming the handles and
  instructing a re-capture. It is never allowed to fall back to the origin: a reproduction
  that reaches over the network is neither reproducible offline nor honestly gate-able,
  because the perceptual gate would then be comparing the target against a page serving
  the target's own bytes and would be blind to image regressions.
- The **opposite channel** is reported too: a mirrored `image` or `font` asset the folded
  document references **nowhere** — the bundle carries the bytes but the fold emitted no
  leaf and no `@font-face` for them — is surfaced as a **fold gap**, not silently dropped,
  because it names folder power the reproduction is missing rather than a broken
  reproduction. It is a different measure from the gate's reference-coverage media proxy,
  which asks the same question of the retained *reference manifest* on the gate verb, so
  the two numbers are not one.
- Rewriting handles is a **materialization** concern, not a fold concern: the folded
  document in the bundle keeps the handles the capture recorded.

The verb is **idempotent**: a re-run wipes the target site and rebuilds it, so
re-materializing after a fold change never leaves half of a previous reproduction behind.

## Verification
Materialize a retained bundle with `1c repro <slug> --ref <bundle>` and assert the written
page carries the bundle's folded L1 document as its page body with one module instance per
recovered seam, bound to the seam's slot name; assert the site definition validates and
the bundle's assets are mirrored into the site.

Asset localization: assert every absolute media handle in the written page — an image
`src`, a node's background-image handle, and a font resource — resolves to a site-local
`/assets/…` path and none names the captured origin. Remove one asset from the bundle so a
handle has no mirror and assert the run fails, naming that handle and instructing a
re-capture, rather than writing a site that hotlinks it. Add a mirrored image the folded
document references nowhere and assert the run reports it as a fold gap while still
succeeding.

Idempotence: run the verb twice against the same bundle, with a stray file left in the
target site between runs, and assert the second run's output is identical to the first's
and the stray file is gone.