---
uid: epic-bf282b3d
id: EPIC-12
type: epic
title: Site duplication
created_by: martin-github@westhead.me
created_at: '2026-09-16T00:31:15.651389+00:00'
updated_at: '2026-09-16T01:06:18.403987+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  chat_comment: comment-91b0ef0c
---

# Site duplication

## 1. Why this exists

Settled in [[CHAT-21]] (2026-08-20/21), sharpening [[CHAT-20]] and [[CHAT-5]].

There is a cohort of customers who **already have a site they are broadly happy
with** and who want 1st Contact for the rest of the front office — funnel,
capture, lists, scheduling, payments. They are not shopping for a website. They
are shopping for an outcome, and most of the fixes we would recommend to get
that outcome (a lower rung on the CTA ladder, a capture surface, a qualifying
section, changed mix and pricing) **are site edits**.

So the question "does she have to migrate?" answers itself: yes, because
handing a client a list of recommendations to implement on Squarespace is the
"we'll get back to you" failure the consultation is designed to avoid. We
cannot fix a funnel we cannot edit.

[[CHAT-21]] also argued this cohort may be the **better first market**, not the
deferred one: higher intent, diagnosable in fifteen minutes from real data,
better willing-to-pay, and they are the ones who actually need the other limbs
(CRM, capture, campaigns) that carry the recurring revenue.

### The reframe that makes this tractable

> **Duplication's job is not fidelity. It is consent.**

It is how we show someone a change to *their own site* before they have agreed
to move anything. We bring the site across as a preview they have not committed
to, put the specific fix in place on it, and show them. The ask becomes
instrumental ("to put that download in front of your consultation button I need
to be able to change your site") rather than aspirational ("come and rebuild
your website with us").

That lowers the bar enormously, and the bar is the most important decision in
this epic:

> **The target is recognisable-and-improvable, not pixel-perfect.**

A reproduction the client looks at and says "yes, that's my site" — and which we
can then edit — has done its whole job. Pixel fidelity is a *different*
programme with a different purpose (§2).

## 2. What this is NOT

This epic is **not** [[DOC-15]] / [[DOC-21]] (the crawler and reproduction-driven
framework-growth flywheel). Keep the two firmly separate — they differ on every
axis that matters:

| | Flywheel ([[DOC-15]]/[[DOC-21]]) | This epic |
|---|---|---|
| Corpus | sites we admire / template galleries | **sites our customers actually have** |
| Output | L1 capability, framework growth | **customers** |
| Bar | perceptual similarity thresholds, ceiling proof | **recognisable and improvable** |
| Metric | fraction of the design space covered | **% of a builder's widget vocabulary handled** |
| Driver | research | commercial |

They share infrastructure (capture, fold, the gates, the fidelity surface) and
nothing else. Where a residual here exposes a genuine L1 gap, file it into the
flywheel's backlog rather than patching per-site — but this epic is not blocked
on the flywheel and must not acquire its acceptance standards.

This epic is also **not** the deferred "a site *like* X" customer-facing surface
([[DOC-15]] §7). We are duplicating **the client's own site, for the client, with
their authorisation** — which sidesteps the IP question that surface carries.
Provenance and authorisation still need to be recorded (§6 Q4).

## 3. Scope — two workstreams

**A. Builder-aware import.** Cover the top 5–10 site tools to a reasonable
degree, so that duplication is a *transform* rather than an inference problem
for most of the market.

**B. Autonomous convergence.** The AI runs its own compare → fix → re-compare
rounds (2–3) and only brings a human in when it believes it has converged, or
when it can say precisely why it cannot.

They are independent and can proceed in parallel. B makes A cheaper to develop;
A makes B converge faster.

## 4. Workstream A — builder-aware import

### The insight

Generic "reproduce arbitrary CSS" is hard. **Reproducing a named page builder is
not** — it is a bounded set of deterministic per-widget mappings.

Evidence from the joyfulculinarycreations.com capture ([[CHAT-21]]): the whole
page is eleven distinct Elementor widget types. Elementor's per-page stylesheet
is *entirely* keyed by element ID (53 element-keyed selectors on that one page),
and every one of those IDs appears in the markup as `data-id`. The
style-to-element mapping is not deduced from geometry and hoped for — it is
handed to us exactly. Combined with a closed widget vocabulary with documented,
stable internal structure, Elementor → L1 is roughly fifteen or twenty
deterministic per-widget mappings plus a section/column geometry rule.

Three properties fall out of this that the generic approach does not have:

- **Detection is free.** `<meta name="generator" content="Elementor">`. So the
  free consultation can tell us, in the first minute, whether this site comes
  across cheaply. That is a qualification signal *and* a legitimate market
  boundary — "we're excellent at WordPress sites" is a fine thing to be for now.
- **Coverage becomes countable.** Not "perceptual similarity across a corpus"
  but "% of Elementor widget types handled", enumerable from the builder's own
  documentation rather than discovered by crawling.
- **The market is concentrated.** WordPress is roughly 40% of the web and
  Elementor is one of its two dominant builders; add Divi, WPBakery and Beaver
  Builder and you have most of the WordPress SMB long tail. Wix and Squarespace
  are similarly bounded. We are not trying to reproduce the web — we are trying
  to reproduce about six page builders.

### Candidate tool list

To be **evidence-ranked before committing**, from what the beta cohort's sites
actually run rather than from global market share (§6 Q1). Starting list:

1. WordPress + **Elementor** — first, on the [[CHAT-21]] evidence
2. WordPress + **Divi**
3. WordPress + **WPBakery**
4. WordPress + **Beaver Builder**
5. **Wix**
6. **Squarespace**
7. **GoDaddy Website Builder**
8. **Shopify** (theme-based, for the retail tail)
9. **Weebly**
10. **Webflow / Framer** (fluent-owner tail; lowest priority, these owners are
    least likely to be in the cohort)

The three hand-built / unrecognised cases are not a failure — they fall back to
the generic fold we already have, at generic quality, and the diagnostic says so
honestly.

### What exists today

- `1c capture page <url>` → bundle with `capture.json`, per-viewport screenshots,
  raw + rendered HTML, mirrored assets, `multistate.json` (the oracle), `l1.json`,
  `forms.json`, `hints.json`
- `foldToL1` → absolute-base L1 with per-width geometry keyframes
- `promoteToFlow` → demand-driven structure recovery
- `threeProbeGate` → sample-fidelity · off-sample · content-robustness
- `1c repro` / `refold` / `l1-gate` / `gate` / `values-diff` / `diff` /
  `aligned-crops` / `responsive-diff` / `adopt-gaps`
- Assistant-facing fidelity surface: `capture_site`, `screenshot`, `compare`,
  `check_fidelity`, `list_references`, `describe_reference` ([[REQ-206]] mounts it
  on the Worker)

### Known gaps

- **No generator detection anywhere.** Nothing in the capture pipeline reads
  `<meta name="generator">` or fingerprints a builder. This is the cheapest
  ticket in the epic and it gates everything else in workstream A.
- **No builder-aware transform layer.** The fold is generic; there is no seam
  where a per-builder mapping can run ahead of or instead of it.
- **No coverage metric.** Nothing counts which widget types we handle.
- Capture completeness: [[BUG-27]] (CSS background images / lazy media) has
  landed. The `theme-site-logo` case from the same capture needs re-checking
  against current capture before assuming it is fixed.

## 5. Workstream B — autonomous convergence

### The problem

Today reproduction is: attempt → **human looks and finds errors** → fix → loop.
The human is in every round, including the rounds that find obvious, mechanically
detectable faults. That does not scale to a per-customer import, and it is not
what the human is good at.

### The proposal

The AI runs **2–3 rounds on its own** before a human sees anything, and arrives
with a verdict rather than an artifact.

The building blocks exist. `check_fidelity` already runs the structural gate, the
value gates and the pixel comparison **together** and reports what it means when
they disagree — `pass`, `reproduction-wrong`, `capture-incomplete`,
`unexplained-disagreement`, `structural-failure` — plus a `nextStep`. `compare`
already returns ranked regions, largest difference first, which is what makes a
round actionable rather than a vibe.

What is missing is the **harness**: something that drives the loop, bounds it,
decides when to stop, and produces the handoff.

### Required properties

- **Bounded.** A round budget (2–3) and a token/wall-clock budget. Browser
  sessions are metered; an unbounded self-correcting loop is a cost incident.
- **Monotonic or it stops.** If a round does not reduce the residual, stop —
  do not spend the remaining budget thrashing. Non-convergence is a *result*.
- **Three honest outcomes**, not one:
  1. **Converged** — "I believe this is right; here is what I checked and the
     two places I am least sure about."
  2. **Stalled** — "I cannot close this; here is the specific residual and my
     hypothesis for why (missing L1 axis / missing capture hint / region needing
     promotion)." This is a framework-gap report, and it is valuable output.
  3. **Capture-incomplete** — "the reference itself is wrong, working the deltas
     would waste your time." `check_fidelity` already distinguishes this case;
     the loop must honour it and **not** try to fix a reproduction against an
     invalid oracle.
- **Directs the human's attention rather than consuming it.** The handoff names
  the regions it is least confident about and what it already ruled out. The
  human's job becomes adjudication, not discovery.
- **Residuals feed the framework, not the site.** A residual that is a genuine
  L1 gap is filed, not patched per-site ([[DOC-19]] one-rule, [[DOC-21]]).

### The one rule that must survive automation

> **Transcribe from the captured DOM. Do NOT reconstruct from memory + screenshot.**

This is [[DOC-19]]'s single most-violated rule and the failure mode of every
reproduction pass to date ([[DOC-17]] §D). A self-correcting loop driven by a
*screenshot comparison* is exactly the shape that tempts reconstruction. The loop
must re-read values, not re-guess them — `compare` says *where*, `values-diff`
says *what*, and the fix is authored from the second.

## 6. Open questions

1. **Which builders, on what evidence?** Rank the list in §4 from the beta
   cohort's actual sites, not global share. Needs a small survey — capture the
   sites of everyone in the beta and histogram the generators. Cheap, and it
   should happen before any transform is written.
2. **What is the acceptance bar, operationally?** "Recognisable and improvable"
   is the right *intent* but it is not yet a number or a checklist. Candidate:
   the client is shown both and asked one question. That is a UAT we can write.
3. **Where does the import run?** Capture already has two driver backends
   (Playwright locally, Browser Rendering in the cloud, one leased session per
   run). Does the convergence loop run in the builder session in front of the
   client, or as background work before the consultation? [[CHAT-20]] §"Step 0"
   assumed background ingestion.
4. **Authorisation and provenance.** We are duplicating a site the client says is
   theirs. We should record who authorised it and when, and have an answer for
   the case where it was built by an agency that owns some of the material
   ([[DOC-51]]). Not a blocker, but it should not be discovered late.
5. **What happens to the original?** After a client moves, their old site exists.
   Redirects, DNS cutover and the "what do I do with my Squarespace subscription"
   conversation are part of the migration and are not currently anywhere.
6. **Does duplication ever become the pitch?** [[CHAT-5]] framed "bring any
   design, get it editable, for less than Wix" as the wedge. [[CHAT-21]] argued
   the opposite — migration must never be the ask. These are reconcilable (the
   diagnostic is the pitch, duplication is the mechanism) but it should be
   stated explicitly before marketing copy is written.

## 7. Proposed child tickets

Not yet filed — for confirmation before creating.

**Workstream A**
- **A1.** Generator detection in capture — read `<meta name="generator">` plus a
  small fingerprint table; record it in the bundle; surface it on
  `describe_reference`. Gates everything else; smallest ticket in the epic.
- **A2.** Beta-cohort generator survey — capture the beta cohort's sites, report
  the histogram. Answers Q1.
- **A3.** The builder-transform seam — where a per-builder mapping runs relative
  to the generic fold, and how it falls back when detection finds nothing.
- **A4.** Elementor transform — the widget vocabulary, the `data-id` ↔ per-page
  CSS join, the section/column geometry rule.
- **A5.** Coverage metric — count handled widget types per builder; report it.
- **A6.** Second builder (Wix or Divi, per A2) — the ticket that proves A3's seam
  was the right shape.

**Workstream B**
- **B1.** The convergence harness — round budget, monotonicity check, stop
  conditions, the three outcomes.
- **B2.** The handoff report — what the human is shown, ranked by the AI's own
  uncertainty, with what was ruled out.
- **B3.** Residual → framework-gap filing — the path from a stalled round to a
  ticket in the flywheel backlog.

## 8. Related

- [[CHAT-21]] — the design conversation; personas, the cohort argument, the
  consent reframe, the Elementor evidence. **The source for this epic.**
- [[CHAT-20]] — 1c coverage; where reproduction-as-deliverable was previously
  ruled out, and which this epic revises for the existing-site cohort.
- [[CHAT-5]] — pricing; conversion vs development cost, the template-vocabulary
  moat argument.
- [[CHAT-29]] — the future of reproduction (referenced in CHAT-21; the ticket
  itself carries no transcript).
- [[DOC-15]] — Crawler & Framework Coverage Program. **Explicitly not this.**
- [[DOC-21]] — Reproduction-Driven Framework Growth Loop.
- [[DOC-19]] — the reproduction runbook; the 3-probe gate and the one rule.
- [[DOC-13]] — reference capture model.
- [[DOC-35]] — personas, modes and registers.
- [[REQ-206]] — the fidelity surface on the Worker (the assistant's eyes).
- [[REQ-34]] — abandoned 18-site flexibility probe; the manual precursor.
