---
uid: epic-bf282b3d
id: EPIC-12
type: epic
title: Site duplication
created_by: martin-github@westhead.me
created_at: '2026-09-16T00:31:15.651389+00:00'
updated_at: '2026-09-16T01:13:04.475779+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  chat_comment: comment-91b0ef0c
---

# Site duplication

## 1. Why this exists

Settled across [[CHAT-29]] (2026-08-20, the origin) and [[CHAT-21]] (same night,
building on it), revising [[CHAT-20]] and [[CHAT-5]].

[[CHAT-29]] posed the cohort directly:

> "Imagine I am the user who has a site, I like it, but I am tempted by all the
> features of First Contact and I want to move. I am open to the idea of
> upgrading my site but I am nervous about a wholesale change."

These customers are not shopping for a website. They are shopping for an
outcome, and most of the fixes that produce that outcome — a lower rung on the
CTA ladder, a capture surface, a qualifying section, changed mix and pricing —
**are site edits**. Handing a client a list of recommendations to implement on
Squarespace is the "we'll get back to you" failure the consultation exists to
avoid. **We cannot fix a funnel we cannot edit.** So they have to move, and
duplication is how moving stops being frightening.

[[CHAT-21]] went further and argued this cohort may be the **better first
market**, not the deferred one: higher intent (already shopping for a vendor),
diagnosable in fifteen minutes from real data, better willing-to-pay, less
crowded, and they are the ones who actually need the other limbs (CRM, capture,
campaigns) that carry the recurring revenue.

## 2. The doctrine — settled, and load-bearing

Most of this epic's risk is in *how* duplication is offered, not in how well it
works. [[CHAT-29]] settled five points that should constrain every ticket below.

### 2.1 An 80%-faithful copy is worse than no copy

> "You've handed the customer a diff against something they already like. Their
> eye goes straight to the 20% that's wrong and the conclusion is *this thing
> can't do what my current site does*. That's the worst possible framing at the
> exact moment of conversion."

This is the single most important constraint in the epic, and it cuts against
the obvious engineering instinct (ship the best copy you can, iterate). Partial
fidelity is not partial credit — on this surface it is negative.

### 2.2 The first output is a read-back, not a site

Invert the order. Before anything is built, the capture produces a statement of
comprehension:

> "Here's what I see. Your promise is *Holistic In-Home Personal Chef Services
> for the busy family*. Three offerings — Personal Chef, Postpartum, Cooking
> Classes — each with a photo. A six-step *How it works*. Testimonials are
> carrying a lot of your credibility. Your look is deliberately quiet: very
> light heading weights, a lot of white, generous spacing.
> What's working? What's been bugging you? What must not change?"

This proves comprehension before risking execution; converts the
imperfect-copy problem into collaboration (every deviation from that point is
one they *asked for*, not one we failed at); and **extracts the fidelity
contract** — if they say "the photos and the calm feel," we know exactly where
to spend and where we are free to improve.

[[CHAT-21]] then adds the second move: once the read-back has earned permission,
**bring the site across as a preview they have not committed to, put the
specific fix on it, and show them.** The ask becomes instrumental ("to put that
download in front of your consultation button I need to be able to change your
site") rather than aspirational.

Read-back → fidelity contract → preview-with-the-fix-on-it → the ask. The
sequence is the product.

### 2.3 "Bring across", never "reproduce"

Hard-code the vocabulary in the prompt layer. *Reproduce* / *copy* sets a
**fidelity** bar we will fail. *Bring across* / *carry over* sets a
**continuity** bar we will beat. The deliverable is "your content and your look,
rebuilt properly" — never "a copy of your site."

This epic's own title is the exception that proves it: internal name, never
customer-facing.

### 2.4 Never silently drop content

> "The one thing that will genuinely lose this customer is discovering a missing
> offering or testimonial themselves."

*"Here's everything I carried over; here are three images I couldn't place —
where do these go?"* is far better than quiet loss. And critically this is
**mechanically checkable** — the capture holds the full verbatim copy inventory,
so completeness is a computable property, not a judgement. See §6: this is the
convergence loop's best primary metric.

### 2.5 Build top-down and show it live

Build the hero first and show it while the conversation is still running. If the
hero lands they will forgive the footer. Present the whole thing at the end and
every flaw arrives at once.

### 2.6 The bar

Following from all of the above — and stated as such in [[CHAT-21]]:

> **The target is recognisable-and-improvable, not pixel-perfect.**

Pixel fidelity is a *different* programme with a different purpose (§3).

## 3. What this is NOT

Not [[DOC-15]] / [[DOC-21]] — the crawler and reproduction-driven
framework-growth flywheel. Keep them firmly separate; they differ on every axis
that matters:

| | Flywheel ([[DOC-15]]/[[DOC-21]]) | This epic |
|---|---|---|
| Corpus | sites we admire / template galleries | **sites our customers actually have** |
| Output | L1 capability, framework growth | **customers** |
| Bar | perceptual similarity thresholds, ceiling proof | **recognisable and improvable** |
| Metric | fraction of the design space covered | **content completeness; % of a builder's widget vocabulary** |
| Driver | research | commercial |

They share infrastructure (capture, fold, the gates, the fidelity surface) and
nothing else. Where a residual here exposes a genuine L1 gap, file it into the
flywheel's backlog rather than patching per-site — but this epic is not blocked
on the flywheel and must not acquire its acceptance standards.

Also not the deferred "a site *like* X" surface ([[DOC-15]] §7). We duplicate
**the client's own site, for the client, with their authorisation** — which
sidesteps the IP question that surface carries. Provenance still needs recording
(§8 Q4).

## 4. Scope — three workstreams

**A. Understanding** — can the AI state what the site *means* (semantic
relationships, not pixels)? This is what the read-back (§2.2) is made of, and
[[CHAT-29]] showed it is the genuinely under-built piece.

**B. Bringing across** — cover the top 5–10 site tools, so carrying a site over
is a *transform* rather than an inference problem for most of the market.

**C. Autonomous convergence** — the AI runs its own 2–3 rounds and only brings a
human in when it believes it has converged, or can say precisely why it cannot.

A gates the customer conversation. B and C are independent of A and of each
other; C makes B cheaper to develop, B makes C converge faster.

## 5. Workstream A — understanding (content) and aesthetic (layout)

[[CHAT-29]] split the problem this way and tested it against the real
joyfulculinarycreations.com capture rather than against the type definitions.
The findings are specific and still current.

### 5.1 Content — relationships are *recoverable* but not *stated*

What is genuinely there today: all copy verbatim in document order, each run
tagged `heading`/`subheading`/`body`/`link`/`action`/`listitem`, with full box
geometry and its own type/colour values. Column structure falls out of
coordinates — the three offerings at `x=494/675/857`, their images at the same
x's, subheadings and bodies below; "How it works" is an unmistakable 3×2 grid.

**The under-used asset is `hints.json`** ([[REQ-83]]). Per visible element it
carries `parentId` ancestry, `repeatCount` (sibling repetition), and the
parent's computed `display`/`flexDirection`/`gap`/`gridTemplateColumns` —
verified present in `capture/hints.ts`. That *is* containment: "three siblings
in a flex row under a common parent" is directly readable, not inferred. It is
currently framed as advisory input to the L1 fold, but it is precisely the
semantic-grouping data the read-back needs. `rendered.html` is retained as the
escape hatch, so any grouping question is definitively answerable.

**Three gaps, and only one has been closed:**

1. **`sections[]` gives nothing semantically.** That entire 4,744px page
   collapsed to **one section**, because it is uniformly white. Style-scope
   segmentation is a reproduction concept — it does not carve a page into
   hero / services / testimonials. **Do not plan on it.**
2. **Images were second-class and the most important one was orphaned** — the
   hero lived only as a CSS `background-image` and appeared solely in the flat
   asset inventory: no box, no role, no owning element. ✅ **Closed by
   [[BUG-27]]** (free_and_reconciled). The `theme-site-logo` case from the same
   capture should be re-verified against current capture before assuming it went
   with it.
3. **`alt` text is worthless as semantics** — two of the three offering images
   were `alt="Joyful Culinary Creations"`. So "which one is the child with the
   birthday cake" is not answerable from the JSON. ❌ **Still open.**

Two artifacts remain unbuilt, and both are cheap relative to the L1 fold:

- **A vision captioning pass over `assets/`** — one line per image, attached to
  its owning element. The bytes are already mirrored locally and the model is
  multimodal; the missing capability is not intelligence, it is a pass. *(An
  image-describer tool surface exists, but nothing runs it over a capture
  bundle's assets — verified.)*
- **A semantic outline artifact** — a derived, advisory tree built from
  `hints.json` ancestry + `repeatCount` + geometry:
  *"Our Offerings → 3 sibling cards, each `{image, heading, body×3}`"*.
  **Verified not to exist.** This is a fundamentally cheaper thing than the L1
  fold because it only has to be *right about relationships*, never
  pixel-faithful — and it is **inspectable by the customer**, which is what makes
  the read-back possible at all.

### 5.2 Aesthetic — already sufficient; spend on prompts, not extraction

Token extraction is strong: palette with `usage` *and* `freq`, fonts with role
and real weight sets plus the font files, type scale, spacing scale, container
width, per-run letter-spacing / line-height / gradient / border / shadow /
radius. The marketing communication reads clearly in the data — headings at 65px
weight 500 and 44px weight **200**, body 17–19px weight 300–500, which *is*
restrained-wellness-unhurried.

The decisive asset is the six screenshots at 320/375/768/1024/1280/1440. Gestalt
— rhythm, density, imagery style, how hard the whitespace is working — is the
hard thing to serialise, and showing a multimodal model the actual rendering
beats any token list. The tokens then make that impression precise and
re-applicable.

**Conclusion: aesthetic capture needs no more extraction work.** The leverage is
the prompt layer ([[DOC-16]]).

One caveat to encode: **`freq` ranks by repetition, not importance.** A single
hero accent used once carries enormous brand weight and near-zero frequency.
Have the AI read salience off the screenshot rather than trusting frequency
ordering.

## 6. Workstream B — bringing across (top 5–10 site tools)

### The insight

Generic "reproduce arbitrary CSS" is hard. **Carrying across a named page
builder is not** — it is a bounded set of deterministic per-widget mappings.

From the same capture ([[CHAT-21]]): the whole page is eleven distinct Elementor
widget types. Elementor's per-page stylesheet is *entirely* keyed by element ID
(53 element-keyed selectors on one page), and every one of those IDs appears in
the markup as `data-id`. The style-to-element mapping is not deduced from
geometry and hoped for — it is handed to us exactly. With a closed widget
vocabulary that has documented, stable internal structure, Elementor → L1 is
roughly fifteen or twenty per-widget mappings plus a section/column geometry
rule.

Three properties the generic approach does not have:

- **Detection is free.** `<meta name="generator" content="Elementor">`. The free
  consultation can tell us in the first minute whether this site comes across
  cheaply — a qualification signal *and* a legitimate market boundary. "We're
  excellent at WordPress sites" is a fine thing to be for now.
- **Coverage becomes countable.** "% of Elementor widget types handled",
  enumerable from the builder's own documentation, not discovered by crawling.
- **The market is concentrated.** WordPress is ~40% of the web and Elementor is
  one of its two dominant builders; add Divi, WPBakery and Beaver Builder and
  you have most of the WordPress SMB long tail. Wix and Squarespace are
  similarly bounded. We are not reproducing the web — we are reproducing about
  six page builders.

### Candidate list — to be evidence-ranked before committing (§8 Q1)

Rank from what the beta cohort's sites actually run, not global share. Starting
list: WordPress + **Elementor** (first, on the evidence above) · **Divi** ·
**WPBakery** · **Beaver Builder** · **Wix** · **Squarespace** · **GoDaddy
Website Builder** · **Shopify** · **Weebly** · **Webflow/Framer** (lowest — these
owners are least likely to be in the cohort).

Unrecognised and hand-built sites are not a failure: they fall back to the
generic fold at generic quality, and §2.2's read-back says so honestly.

### What exists today

`1c capture page <url>` → bundle (`capture.json`, six screenshots, raw +
rendered HTML, mirrored assets, `multistate.json` oracle, `l1.json`,
`forms.json`, `hints.json`) · `foldToL1` → absolute-base L1 with per-width
keyframes · `promoteToFlow` → demand-driven structure recovery · `threeProbeGate`
(sample-fidelity · off-sample · content-robustness) · `1c repro` / `refold` /
`l1-gate` / `gate` / `values-diff` / `diff` / `aligned-crops` /
`responsive-diff` / `adopt-gaps` · assistant fidelity surface (`capture_site`,
`screenshot`, `compare`, `check_fidelity`, `list_references`,
`describe_reference`), mounted on the Worker by [[REQ-206]].

### Known gaps

- **No generator detection anywhere** — nothing reads `<meta name="generator">`
  or fingerprints a builder. Verified. Cheapest ticket in the epic, and it gates
  everything else in this workstream.
- **No builder-aware transform seam** — the fold is generic; there is no place a
  per-builder mapping can run ahead of or instead of it.
- **No coverage metric** — nothing counts handled widget types.

## 7. Workstream C — autonomous convergence

### The problem

Today: attempt → **human looks and finds errors** → fix → loop. The human is in
every round, including the rounds that find mechanically detectable faults. That
does not scale to a per-customer import, and it is not what the human is good at.

### The proposal

The AI runs **2–3 rounds on its own** and arrives with a *verdict*, not an
artifact.

The building blocks exist. `check_fidelity` already runs the structural gate,
the value gates and the pixel comparison **together** and reports what it means
when they disagree — `pass`, `reproduction-wrong`, `capture-incomplete`,
`unexplained-disagreement`, `structural-failure` — plus a `nextStep`. `compare`
returns regions ranked by difference, which is what makes a round actionable
rather than a vibe. What is missing is the **harness**.

### The primary metric is content completeness, not pixel difference

This follows from §2.4 and it matters more than it looks. The capture holds the
full verbatim copy inventory and (post-[[BUG-27]]) every painted image attached
to a box. So *"did anything get silently dropped"* is **computable**, and it is
the failure that actually loses the customer. Pixel difference is the secondary
signal — it tells us where to look, not whether we succeeded.

Ordering for each round: **content completeness → semantic structure (does the
outline still say what the read-back said) → value deltas → pixel regions.**

### Required properties

- **Bounded.** Round budget (2–3) plus a token/wall-clock budget. Browser
  sessions are metered and rate-limited; an unbounded self-correcting loop is a
  cost incident.
- **Monotonic or it stops.** If a round does not reduce the residual, stop. Do
  not spend the remaining budget thrashing. Non-convergence is a *result*.
- **Three honest outcomes**, not one:
  1. **Converged** — "I believe this is right; here is what I checked, and the
     two places I am least sure about."
  2. **Stalled** — "I cannot close this; here is the residual and my hypothesis
     (missing L1 axis / missing capture hint / region needing promotion)." This
     is a framework-gap report and it is valuable output.
  3. **Capture-incomplete** — "the reference itself is wrong; working the deltas
     would waste your time." `check_fidelity` already distinguishes this; the
     loop must honour it and **not** iterate against an invalid oracle.
- **Directs the human's attention rather than consuming it.** The handoff names
  the regions it is least confident about and what it already ruled out. The
  human adjudicates; they no longer discover.
- **Residuals feed the framework, not the site** — filed, not patched per-site
  ([[DOC-19]], [[DOC-21]]).

### The one rule that must survive automation

> **Transcribe from the captured DOM. Do NOT reconstruct from memory + screenshot.**

[[DOC-19]]'s single most-violated rule and the failure mode of every reproduction
pass to date ([[DOC-17]] §D). A self-correcting loop driven by *screenshot
comparison* is exactly the shape that tempts reconstruction. The loop must
re-read values, not re-guess them: `compare` says *where*, `values-diff` says
*what*, and the fix is authored from the second.

## 8. Open questions

1. **Which builders, on what evidence?** Rank §6's list from the beta cohort's
   actual sites. Capture everyone's current site and histogram the generators.
   Cheap, and it should precede any transform work.
2. **What is the acceptance bar, operationally?** §2.6 is the right intent but
   is not yet a checklist. Content completeness (§7) gives a hard floor.
   Candidate ceiling: the client is shown the read-back and asked *"what did I
   get wrong?"* — that is a UAT we can write.
3. **Where does this run?** Capture has two driver backends (Playwright locally,
   Browser Rendering in the cloud, one leased session per run). Does the loop run
   in the builder session in front of the client, or as background work before
   the consultation? [[CHAT-20]] §"Step 0" assumed background ingestion, which
   also fits §2.2's read-back-first sequence.
4. **Authorisation and provenance.** Record who authorised the duplication and
   when, and have an answer for the site built by an agency that owns some of the
   material ([[DOC-51]]). Not a blocker; should not be discovered late.
5. **What happens to the original?** Redirects, DNS cutover, and the "what do I
   do with my Squarespace subscription" conversation are part of migration and
   are currently nowhere.
6. **Does duplication ever become the pitch?** [[CHAT-5]] framed "bring any
   design, get it editable, for less than Wix" as the wedge. [[CHAT-29]] said
   *don't offer reproduction at all* and [[CHAT-21]] said migration must never be
   the ask. Reconcilable — the diagnostic is the pitch, duplication is the
   mechanism — but state it explicitly before any marketing copy is written.

## 9. Proposed child tickets

Not yet filed — for confirmation.

**Workstream A — understanding**
- **A1.** Vision captioning pass over a capture bundle's `assets/`, attached to
  owning elements. Closes [[CHAT-29]] gap 3 (`alt` text is worthless).
- **A2.** The **semantic outline** artifact — advisory relationship tree from
  `hints.json` ancestry + `repeatCount` + geometry. The read-back is built from
  this. Cheapest high-leverage item in the epic.
- **A3.** The read-back itself — prompt layer + presentation, per §2.2/§2.3.
- **A4.** Re-verify `theme-site-logo` capture post-[[BUG-27]].

**Workstream B — bringing across**
- **B1.** Generator detection in capture (`<meta name="generator">` + fingerprint
  table); record in bundle; surface on `describe_reference`. Gates B2–B5.
- **B2.** Beta-cohort generator survey → histogram. Answers Q1.
- **B3.** The builder-transform seam — where a per-builder mapping runs relative
  to the generic fold, and how it falls back on no detection.
- **B4.** Elementor transform — widget vocabulary, `data-id` ↔ per-page-CSS join,
  section/column geometry rule.
- **B5.** Coverage metric — handled widget types per builder.
- **B6.** Second builder (Wix or Divi, per B2) — proves B3's seam.

**Workstream C — convergence**
- **C1.** The harness — round budget, monotonicity check, stop conditions, the
  three outcomes.
- **C2.** Content-completeness check as the loop's primary gate (§7).
- **C3.** The handoff report — ranked by the AI's own uncertainty, with what was
  ruled out.
- **C4.** Residual → framework-gap filing.

## 10. Related

- [[CHAT-29]] — *the future of reproduction*. **The origin of this epic**: the
  cohort question, the content/layout split, the read-back, the "80% is worse
  than nothing" argument, the language doctrine, the three capture gaps.
- [[CHAT-21]] — *the design conversation*. Personas, the "better first market"
  argument, migration-as-consent, the Elementor evidence.
- [[CHAT-20]] — 1c coverage; where reproduction-as-deliverable was previously
  ruled out, and which this epic revises for the existing-site cohort.
- [[CHAT-5]] — pricing; conversion vs development cost, the template-vocabulary
  moat.
- [[DOC-15]] — Crawler & Framework Coverage Program. **Explicitly not this.**
- [[DOC-21]] — Reproduction-Driven Framework Growth Loop.
- [[DOC-19]] — the reproduction runbook; 3-probe gate and the one rule.
- [[DOC-13]] — reference capture model. [[DOC-16]] — prompt layer.
- [[DOC-35]] — personas, modes and registers.
- [[REQ-83]] — capture hints. [[REQ-206]] — fidelity surface on the Worker.
- [[BUG-27]] — CSS background images / lazy media (closed; [[CHAT-29]] gap 2).
- [[REQ-34]] — abandoned 18-site flexibility probe; the manual precursor.
