---
uid: doc-ca48ad08
id: DOC-24
type: doc
title: Framework Purpose / Positioning — safety envelope, not aesthetic rails
created_by: xgd
created_at: '2026-07-20T20:51:53.238994+00:00'
updated_at: '2026-07-20T20:51:53.238994+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  doc_kind: architecture
---

# Framework Purpose / Positioning

**Status:** Founded by REQ-82 alongside the framework pivot (REQ-79). States what
the framework is *for* after the pivot away from semantic layout modules.

## 1. The thesis

> The framework's value is a **safety envelope** — security, robustness (it will
> not crash or hang the browser), and cross-browser fidelity — delivered **by
> construction**. It is **not** a set of aesthetic rails (enums, palettes,
> presets that constrain taste).

Aesthetics come from **Claude authoring L1 directly** under the envelope, plus its
**eyes** (render → capture → compare → iterate, [[DOC-13]]) — not from a narrowed
editor. This inverts the "Bad Wix" failure mode ([[DOC-7]] §6.1): rather than
trapping a capable author in finite dials, we hand it an expressively-complete,
structured language and let it out. The only hard walls are **security** and
**reliability**.

## 2. Why this is the winning position

Template builders (Wix/Squarespace/Framer) have a hard, low expressive ceiling
and no code escape. Our architecture has **no expressive ceiling** ([[DOC-4]]):
L1 is a typed, CSS-faithful substrate that can express what a hand-coded site can,
and the vetted **capability-module** seam is a structured escape valve to
arbitrary code that never leaves the model. We are a **strict superset** of every
template builder — everything they can do, plus everything they cannot — driven by
an AI with eyes. That is the structural reason we can deliver agency-quality
output at builder economics.

## 3. What changed in the pivot

- **L1 replaces the 8 semantic layout modules** with one low-level substrate
  ([[DOC-23]]). "Module" now means **capability** (payments, auth, email-capture,
  carousel, scroll-animation) — a vetted behavioural core + typed config + named
  L1 presentation slots, where the AI *configures*, never writes code.
- **L2 (a design library of vetted L1 presets) is PARKED** — possibly never
  needed. Claude authors L1 directly and the envelope keeps it safe; revisit only
  if direct L1 authoring proves insufficient.
- **Acceptance = round-trip identity** `capture(render(L1)) ≈ L1` on the existing
  capture/values-diff spine, which *also* enforces the envelope. Reproduction of a
  real site becomes near-mechanical and each site hardens the language.
- **~92% of the codebase survives** (store/versioning; capture + values-diff;
  perceptual/aligned-crops; serve). The rebuild is the small render/authoring
  layer.

## 4. The envelope, concretely

Three guarantees, each proven by executable UATs (REQ-82):
- **Security** — structured-only + validated ([[DOC-2]]): typed axes, hex-only
  colours, strict objects, URL allowlist, one escaping emitter.
- **Robustness** — numeric ranges + depth/node caps in `validateL1`; malformed or
  oversize input is rejected before render.
- **Cross-browser** — feature allowlist + the 3-engine capture gate; the spike
  renders equivalently across chromium/webkit/firefox.

## 5. Consequence for how we build

Capability gaps are closed by **adding a typed L1 primitive**, never by opening a
raw-CSS hole ([[DOC-7]] §6.3). New *modules* are only for genuinely new
*capabilities* — layout capability lives in the one L1 primitive. The language
grows by real demand through the reproduction flywheel ([[DOC-21]]), and the
expressive ceiling rises without limit while the security/reliability wall stays
put.

## 6. Related

[[DOC-4]] (product thesis) · [[DOC-2]] (Security Policy) · [[DOC-23]] (L1 spec) ·
[[DOC-7]] (framework principles — being split in Phase C) · [[DOC-14]] (module
lifecycle — superseded by the capability-module contract in Phase D) · REQ-79
(pivot umbrella).
