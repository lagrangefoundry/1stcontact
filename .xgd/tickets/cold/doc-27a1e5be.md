---
uid: doc-27a1e5be
id: DOC-21
type: doc
title: 'Process: Reproduction-Driven Framework Growth Loop'
created_by: xgd
created_at: '2026-07-08T17:34:34.188088+00:00'
updated_at: '2026-07-08T18:51:04.440822+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  doc_kind: architecture
---

# Process: Reproduction-Driven Framework Growth Loop

**Status: DRAFT v0.1** — to be refined by its first worked example (joyfulculinarycreations.com, [[REQ-36]]). This is a *process* doc (doc_kind architecture for lack of a "process" kind), the design-side counterpart to the **Free-Coding** process.

## 1. Purpose & where this sits

This is the **operational procedure** for one turn of the design flywheel: take an exemplar site, reproduce it, and — where the current framework can't — grow the framework, with evidence, without fragmenting it. It is the connective tissue between docs that already exist:

- **[[DOC-13]]** — capture model (produces the reference bundle).
- **[[DOC-19]]** — faithful-reproduction transcription runbook (*how to build the config from the capture*). This process **invokes** DOC-19 as its step 2.
- **[[DOC-14]]** — module lifecycle / two-tier composition (config-gap vs capability-gap trigger; site-local vs library promotion). This process **refines** DOC-14's binary trigger into a graded ladder (§5).
- **[[DOC-20]]** — module conformance harness (the universal-contract UATs). This process **consumes** it as step 6 "compliance."
- **[[DOC-15]]** — crawler & coverage program (the *batch, offline* form of this same loop over a corpus). This process is the **single-exemplar unit** DOC-15 runs at scale.
- **[[DOC-16]]/[[DOC-17]]** — design-intelligence prompt layer / lessons log (taste and craft that inform steps 2 and 4).

### Where the requirements live, and how they are built (the operating model)

**One reproduction ticket per site — REQ-X — is the single home for the whole job.**

1. **Every framework change the reproduction forces is a requirement recorded in REQ-X itself** — *not* a separate REQ, and *never* a hand-authored capability or story. The reproduction ticket accumulates the list of framework changes as it discovers them (steps 4–7), alongside the reproduction goal.
2. **Each such change is free-coded per the Free-Coding process:** described in REQ-X → code + `test_UAT_FC_REQ-X_*` UATs → `[FREE-CODED]` commit → the commit sha added to REQ-X (`fields.commits`) → the ticket kept current.

The capability-matrix artifacts (capabilities, stories, acceptance criteria, UAT-coverage) are **derived later by reconciliation / the automated development process from those free-coded commits** — this interactive loop **does not author them**. Capabilities are groupings of stories, not specifications; nothing here creates or edits them.

### Two edit regimes (why this isn't ordinary XGD)

The loop straddles two kinds of change and must keep them distinct:

- **Site authoring (config/theme).** Reproducing *this* site. Correctness is **perceptual fidelity to a reference**; evidence is the `1c diff` artifact. Config/theme edits are **exempt from free-coding ceremony** — they are site data, never framework code.
- **Framework code (module/dial/variant/token/renderer).** A framework change the reproduction forced. Correctness is **behavioural**; evidence is the UATs written with it. These take **full free-coding ceremony** (requirement described in REQ-X + `test_UAT_FC_REQ-X_*` + `[FREE-CODED]` + version bump), per the model above.

The site config is the disposable prototype; the framework changes it forces are the durable output. This is **Interaction Mode 1 (Prototype → Teardown → Rebuild)**: the config is throwaway; the framework — and, downstream via reconciliation, the Capability Matrix — grows regardless.

## 2. The loop

```
1. CAPTURE          1c capture page <url>  →  reference bundle (DOC-13)
2. REPRODUCE        build/refine config+theme (DOC-19); drive with
                    1c diff + values-diff, worst-region-first, until
                    CONFIG-EXHAUSTION (metric plateaus on config edits)
3. GOOD-ENOUGH?     evaluate the gate (§4)
                       pass            → STOP (success)
                       terminal-residual → STOP (documented residual)
                       fail            → 4
4. ATTRIBUTE+DESIGN for each residual gap, take the first rung of the
                    ladder (§5) that fits; each proposed change clears
                    the mechanical gates (§6)
5. IMPLEMENT        framework change + hand-authored effect assertions
                    + composability cross-fixtures  (free-coded into REQ-X, §1)
6. VERIFY           conformance (DOC-20, inherited) AND custom effect
                    assertions pass across the variant×dial matrix
7. GOTO 2           re-reproduce with the richer framework; diff should drop
```

Three distinct stop conditions — do not collapse them:
- **Config-exhaustion** (ends step 2): improvement per config edit < ε over the last K edits. "Config can do no more" — *not* a pass.
- **Good-Enough** (ends the loop at 3): the gate passes.
- **Terminal-residual** (also ends the loop at 3): config exhausted **and** every remaining gap is either declared acceptable-residual or below the bar to mint a capability (§6). Stop with the residual documented, so the loop can't spin forever on a gap that isn't worth a capability.

## 3. Read the overlay, not the average (carried from DOC-19)

Steps 2 and 3 are driven by **per-region overlays**, never the downscaled full screenshot or the aggregate mean alone. Read the `1c diff` region triptychs worst-region-first; measure computed geometry on both sides. The hero is the front door — reproduce it exactly; tolerate sub-visual drift lower down. Gates test one viewport — evaluate at ≥3 widths.

## 4. Step 3 — "Good Enough," defined

A scalar `1c diff` mean under a threshold is **not** the gate (averaging hides local breakage; one viewport lies; text-loss barely moves pixels). Good-Enough is a **vector gate, evaluated at 3 viewports** (desktop/tablet/mobile):

1. **Structural floor (hard precondition).** `values-diff` `missing` / `text` / `fontFamily` deltas = **0**. Discrete correctness — no averaging. Missing text or wrong typeface is never good enough.
2. **Global mean** < `T_global`.
3. **Worst-region bound** < `T_region` — no single band broken even if the average is fine. This is the check that catches an averaged-out hero.
4. **Saliency weighting** — hero / above-the-fold held to a stricter `T` than footer / whitespace.
5. **Minus declared acceptable-residual** — per-region `except` entries *with reasons* (font AA, photo re-encode, carousel current-slide). Without this, the loop chases irreducible noise and mints capabilities for un-closeable gaps.

**Thresholds are calibrated, not guessed.** `T_global` / `T_region` are set **once** against a small **human-labeled anchor set** of (reference, render) pairs tagged "indistinguishable / not." The max mean and max worst-region among the "indistinguishable" pairs set the thresholds. After calibration the gate is automatic and objective. *(This anchor set does not yet exist — see §8.)*

## 5. Step 4 — the attribution ladder (reuse-first)

For each residual gap, take the **first** rung that fits. Each rung down costs more and demands more justification:

1. **Acceptable residual?** → `except` it; design nothing. *(stops noise-chasing)*
2. **Config error?** → fix the dial value, not the framework. *(stops framework changes config already covers)*
3. **Existing dial/variant expresses it?** → reuse. *(reuse-first)*
4. **Orthogonal treatment of an existing module's job?** → **dial**.
5. **Discrete structural preset of an existing module?** → **variant**.
6. **Cross-cutting composition several modules share?** → **shared primitive / role-driven token** (e.g. make `surface` reference a palette *role* rather than adding a colour-named value — don't bake a brand hue into the enum).
7. **Genuinely different content job, nothing above fits?** → **new module** (last resort, highest bar; DOC-14 Tier B).

This is DOC-14's config-gap/capability-gap trigger and DOC-15's Covered/Generalizable/New-module buckets, graded finer with the two cheap escapes (except, config-fix) on top.

## 6. Step 4/6 — the mechanical gates (anti-god-module, anti-explosion)

These make "is this a dial or a module?" a **counting rule**, not a vibe:

- **Composability invariant** — a new **dial** must be legal with *every* variant × *every* other dial value, verified by conformance cross-fixtures. A dial that only works "in one mode" fails this, and that failure *is* the signal it's really a variant or a second module. **The anti-god-module gate.**
- **Dial budget** — soft cap per module; crossing it triggers a "is this two modules?" review. Detects accretion early.
- **Corpus threshold (k)** — a new **module** requires **≥ k exemplars** demanding it; a variant fewer; a dial fewest. One site cannot spawn a module — it must reuse, get a dial, or take an acceptable-residual exception. **The anti-explosion gate — and it only exists because of the corpus** (DOC-15). This is DOC-14 §6's gap-frequency promotion, made a hard threshold.
- **Fragmentation metric** — capabilities-per-covered-site and reuse-rate. If new capabilities aren't lifting held-out coverage (they only serve their originating site), the design process is fragmenting → halt and alarm.

## 7. Tests & provenance (steps 5–6)

Every framework change ships, free-coded into REQ-X:
- **Inherited conformance** (DOC-20): safety / security / responsive / x-browser across the variant×dial matrix, including the new combinations.
- **Hand-authored effect assertions** — a computed-style probe proving the change produces its *intended* rendered effect (`getComputedStyle(heading).color === accent token` for `headingTreatment: gold`) **and** a default-vs-set pair proving the dial has an effect (guards the silent-no-op failure mode).
- **Composability cross-fixtures** — the new dial crossed with existing variants/dials.

**Hand-authored tests are authoritative here.** Unlike ordinary XGD (happy-path in, reconciliation fills the suite), a visual effect assertion encodes design judgment that cannot be derived from a spec. Reconciliation validates their presence/coverage but must not regenerate or override them. *(This requires an XGD story-type that does not yet exist — §8.)*

## 8. What must exist to automate this (XGD gaps)

The manual process above is runnable today. Automating it needs XGD changes we have identified but not built:

1. **Capability archetypes / inherited AC contracts** — declare "module"; every module inherits the universal conformance ACs and proves them.
2. **Hand-authored-authoritative story type** — canonical UATs; reconciliation validates but never regenerates.
3. **Reference-as-spec + perceptual AC kind** — intent = a captured artifact; AC = `similarity(render, reference) ≥ threshold` on a named dimension.
4. **Gradient/threshold loop primitive** — exit on `metric < threshold` OR diminishing returns; progress-without-pass is not failure.
5. **Corpus-driven backlog + attribution step** — residual gaps across a corpus generate capability stories, deduped, generalize-first-gated.
6. **Corpus coverage KPI** — held-out config-only reproduction coverage curve (the product moat metric).

Also required as *data*, not code: the **calibration anchor set** (§4), a **mini-corpus** (even 5–10 sites) to exercise the corpus-k gate (§6), and the **coverage/fragmentation metrics**.

## 9. Human-in-the-loop stance during the ramp

XGD's "no human in the coding loop" is deliberately **inverted for the framework-design step 4**. Automate capture → config → diff → gap-detection first (cheap, safe); keep **attribution + generalize-first (steps 4–6) human-signed-off longest**, because that is where god-modules and explosion are decided. DOC-14's "operator approves the look in draft" is the eyes half of this; the ladder + mechanical gates are the structure half.

## 10. Worked example

First run: **joyfulculinarycreations.com** under [[REQ-36]]. Findings from that run refine this draft (thresholds in §4, k in §6, the ladder in §5). Record numbers, not adjectives.
