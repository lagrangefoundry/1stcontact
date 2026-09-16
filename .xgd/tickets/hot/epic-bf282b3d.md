---
uid: epic-bf282b3d
id: EPIC-12
type: epic
title: Site duplication
created_by: martin-github@westhead.me
created_at: '2026-09-16T00:31:15.651389+00:00'
updated_at: '2026-09-16T02:55:40.783335+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  chat_comment: comment-91b0ef0c
  epic_children:
  - request-5b2763c8
  - request-f8712e87
  - request-c1c5261a
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

**C. The two feedback loops** — the AI runs its own 2–3 rounds instead of putting
a human in every one. This splits into **loop 1**, which improves the
reproduction *engine* (output: code), and **loop 2**, which smooths *a particular
customer's site* with L1 and the existing tools (output: a site they recognise).
Different corpora, different outputs, and opposite rules about per-site edits —
so they are designed separately and share only a harness. **Neither is
reinforcement learning** (§7).

A gates the customer conversation. B and C are independent of A and of each
other; loop 1 makes B cheaper to develop, B makes both loops converge faster, and
loop 2 is what makes §2.2's preview showable before either has finished.

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

### Candidate list — to be evidence-ranked before committing (§9 Q1)

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

## 7. Workstream C — the two feedback loops

Reproduction improves along **two separate loops**. They are easy to conflate
and expensive to conflate, because they differ in corpus, output, cadence, who
is watching, and — decisively — in whether a per-site edit counts as drift or as
the deliverable.

| | **Loop 1 — improve the engine** | **Loop 2 — smooth a site** |
|---|---|---|
| Purpose | build the reproduction engine | make *this* reproduction good enough to show |
| Corpus | our own reference set | one customer's site |
| Cadence | development time, batched, unattended | in-session, in front of the client |
| Durable output | **code** | **a site the customer recognises** |
| A per-site edit is… | **drift** — fix the engine or file it | **the deliverable** |
| Who adjudicates | us | the customer |

**Neither loop is reinforcement learning.** There is no reward model, no scoring
function being optimised, no training, no policy. Both are the ordinary shape: a
deterministic check produces a specific, named residual; an agent reads it and
acts. Loop 1's act is a code change; loop 2's act is a site edit. If a proposal
under this epic starts talking about rewards, learned objectives or training
signal, it has drifted — reject it.

### 7.1 Loop 1 — improve the reproduction engine

This is the loop that replaces today's process —

> attempt → **human looks and finds errors** → fix → loop

— in which the human is in *every* round, including the rounds that find
mechanically detectable faults. That does not scale, and it is not what the
human is good at. The proposal: the AI runs **2–3 rounds on its own** and arrives
with a *verdict* rather than an artifact, so the human adjudicates instead of
discovering.

**Here a per-site patch is drift.** A residual is a serializer bug, a missing L1
axis, a missing capture hint, or a region needing promotion — fixed in the
engine, for every site, or filed. [[DOC-19]]'s discipline applies unchanged: the
site config is disposable; the durable output is the framework growth each
residual forces.

### 7.2 Loop 2 — smooth a particular customer's site

The engine will never cover everything, and §2.1 says a visibly-80% result is
worse than none. So when a site comes across with rough edges, the AI closes them
itself, using the L1 control surface ([[DOC-30]]) and the fidelity tools it
already has: `compare` to find the worst regions, `values-diff` to read what is
actually wrong, the L1 write operations to fix it.

**Here a per-site edit is the deliverable, not drift.** That inversion is the
whole reason the loops must stay separate — the same action is correct in one and
forbidden in the other, so a single undifferentiated "self-correcting
reproduction loop" would be wrong half the time.

Loop 2 is also what makes §2.2's sequence possible: the preview we show the
client is a *smoothed* reproduction, not a raw one.

### 7.3 The bridge — loop 2 is loop 1's best evidence

The loops connect in exactly one direction, and the connection is not a training
signal. **Loop 2's hand-fixes are a histogram.** If the AI patches the same thing
on site after site, that is an engine gap with a frequency attached — precisely
the prioritisation input loop 1 needs and does not otherwise have.

So loop 2 must **log what it fixed**, in a form loop 1 can count: a named
residual class, the site, the fix applied. Nothing cleverer is required. Ranked
by frequency × cost, that list *is* the engine backlog — and it is sourced from
the sites our customers actually have rather than from sites we chose, which is
the §3 distinction made operational.

The reverse direction is just software: engine improvements land, and next
month's reproductions need less smoothing.

### 7.4 What both loops need — the harness

Shared, and unbuilt. The building blocks exist: `check_fidelity` already runs the
structural gate, the value gates and the pixel comparison **together** and
reports what it means when they disagree — `pass`, `reproduction-wrong`,
`capture-incomplete`, `unexplained-disagreement`, `structural-failure` — plus a
`nextStep`. `compare` returns regions ranked by difference, which is what makes a
round actionable rather than a vibe. What is missing is the thing that drives the
rounds, bounds them, decides when to stop, and produces the handoff.

**The primary metric is content completeness, not pixel difference.** This
follows from §2.4 and matters more than it looks. The capture holds the full
verbatim copy inventory and (post-[[BUG-27]]) every painted image attached to a
box, so *"did anything get silently dropped"* is **computable** — and it is the
failure that actually loses the customer. Pixel difference is the secondary
signal: it says where to look, not whether we succeeded.

Ordering within a round, both loops: **content completeness → semantic structure
(does the outline still say what the read-back said) → value deltas → pixel
regions.**

**Required properties, both loops:**

- **Bounded.** A round budget (2–3) plus a token/wall-clock budget. Browser
  sessions are metered and rate-limited; an unbounded self-correcting loop is a
  cost incident. In loop 2 the budget is also the client's patience.
- **Monotonic or it stops.** If a round does not reduce the residual, stop — do
  not spend the remaining budget thrashing. Non-convergence is a *result*.
- **Three honest outcomes**, not one:
  1. **Converged** — "I believe this is right; here is what I checked, and the
     two places I am least sure about."
  2. **Stalled** — "I cannot close this; here is the residual and my hypothesis."
     In loop 1 this is a framework-gap report and is valuable output. In loop 2
     it becomes a design conversation with the client ("shall we do this
     differently here?") rather than a silent compromise.
  3. **Capture-incomplete** — "the reference itself is wrong; working the deltas
     would waste your time." `check_fidelity` already distinguishes this; the
     loop must honour it and **not** iterate against an invalid oracle.
- **Directs the human's attention rather than consuming it.** The handoff names
  what it is least confident about and what it already ruled out.
- **Residual routing differs by loop** — loop 1 files it as an engine gap and
  changes no site; loop 2 fixes it in place *and* logs it per §7.3.

### 7.5 The one rule that must survive automation

> **Transcribe from the captured DOM. Do NOT reconstruct from memory + screenshot.**

[[DOC-19]]'s single most-violated rule and the failure mode of every reproduction
pass to date ([[DOC-17]] §D). A self-correcting loop driven by *screenshot
comparison* is exactly the shape that tempts reconstruction, and it applies to
both loops. The loop must re-read values, not re-guess them: `compare` says
*where*, `values-diff` says *what*, and the fix is authored from the second.

## 8. The reproduction console — how we sneak up on loop 1

Agreed shape for loop 1 (§7.1). The point is that **every round is
human-gated**: the AI does one iteration and stops, and a person presses the
button for the next one. We watch it work a few times before we let it run.

**Scope: home pages only.** One page per reference — which is exactly what the
stored reference bundles already hold (`storage/references/<host>/index`).

### 8.1 The UX

1. Blank page: a text box and a **[reproduce]** button. Enter a site, it
   captures and runs a reproduction.
2. Under a heading **"Iteration 1"**, a set of links, all opening in new tabs:
   **the original site** (for comparison) · **the iteration-1 reproduction** ·
   **the diff images**.
3. As soon as the links appear, an **AI process starts** with a prompt to review
   the diff and diagnose the gap. Its transcript streams onto the page.
4. **The AI does not change code.** It finishes by **filing a ticket** against
   the reproduction engine — the residual it found, the evidence, and the fix it
   proposes. The ticket is linked on the page next to the other artifacts.
5. The operator free-codes that ticket in the normal way. Once the change has
   landed, a **[run again]** button re-runs the reproduction *with it in place*
   and appends "Iteration 2".

### 8.2 Three changes to that shape — and the first one is the big one

#### The AI files a ticket. It does not edit code.

The original sketch had the AI change the engine and reinstall it. **Replaced by
the xgd model: a change to the code gets a ticket and is free-coded.** In v1 the
AI's deliverable *is* the ticket; the operator triggers the free coding of it as
a separate, ordinary session.

This is slower per round, and it is the better trade for four reasons:

- **Every engine fix acquires matrix coverage.** Free coding forces a UAT named
  for the behaviour, so each closed gap leaves behind a durable regression test.
  A scratch-branch commit leaves nothing — and §7.5's whole anxiety is drift that
  nothing catches.
- **The diagnosis and the fix are adjudicated by different agents.** An agent
  that both makes a change and judges it has no independent check (§8.4). Here
  the free-coding session is a genuinely separate reader of the claim.
- **It is the shape we already have.** No new commit convention, no scratch
  branch to reason about, no bespoke revert path. The console stops at the
  boundary the rest of the project already enforces.
- **The ticket is the fix log.** §7.3 wanted loop 2's hand-fixes recorded as a
  frequency-ranked engine backlog. A well-formed gap ticket per residual *is*
  that artifact, arriving for free and in the system that already ranks work.

**What a good gap ticket carries**, so it is checkable without re-deriving it:
the named residual class · which reference(s) exhibit it · the evidence
(`check_fidelity` verdict, the `regions` entry, the `values-diff` lines) · the
hypothesis about the engine · the proposed change. Nothing that could only be
read off a screenshot (§7.5).

**Two disciplines the AI must hold.** *One ticket per gap class, not per
iteration* — if a later round hits a class that already has a ticket, it appends
evidence to that ticket rather than filing a second ([[FREE-CODING.md]]'s
proliferation rule). And *file only for engine gaps* — a `capture-incomplete`
verdict means the reference is wrong, which is a different problem and must stop
the round rather than become a ticket against the engine.

**The residual risk, named.** A diagnose-only AI can write plausible tickets it
never has to prove; in the edit model the rail was the immediate falsifier. Here
the falsifier is retrospective and still real: if the ticket is free-coded and
the next iteration's numbers do not move, the diagnosis was wrong, and the
console shows that in the same place it showed the claim.

#### A fourth link per iteration: the ticket the AI filed.

The page as sketched shows only the AI's prose. Linking the filed ticket next to
the original / reproduction / diff-images is what makes each round inspectable —
and once the ticket is free-coded, its `fields.commits` is the code diff, so
"what changed" is reachable without the console tracking it separately.

#### Each iteration is a fresh `1c` invocation.

See §8.3 — a correctness requirement, not a preference.

### 8.3 "Reinstall" is free — but only if each run is a fresh process

There is no build or install step to engineer. `1c` is TypeScript compiled **on
the fly**: `bin/1c.mjs` boots a Vite SSR server and loads the CLI through
`ssrLoadModule` ([[REQ-150]]). So the AI edits a `.ts` file and the *next* `1c`
invocation already uses it.

The corollary is a real trap: a **long-lived** dev server would cache the module
graph and silently keep running the old code, so iteration N+1 would reproduce
iteration N's result and the loop would look stuck for reasons nothing on the
page could explain. The console must spawn a fresh `1c` per iteration.

### 8.4 The regression rail — the one genuinely new piece

Step 4's "smoke/regression suite the AI has to run before it finishes" is the
safety rail, and it has two halves. The first exists; the second does not.

**Half one — the test suite.** `pnpm test` (`vitest run`) over `tests/` — 517
UATs today, of which ~73 are reproduction-relevant by name (l1 / fold / repro /
gate / capture / values). Open question: is the per-iteration gate the fast
subset or the lot (§9 Q8)?

**Half two — the cross-site baseline. This does not exist and must.** The
characteristic failure of a code-editing loop is that **the AI fixes the site in
front of it and breaks the two it cannot see.** Nothing currently records what a
good gate result looks like per reference, so "no worse than before" is not
computable — verified: there is no baseline or recorded gate output anywhere in
`storage/`.

We can check this today, because three references are already stored:
`faelan.com`, `gigabytealchemy.ai`, `joyfulculinarycreations.com`. Record a gate
result per reference; the rail re-gates all of them and fails if any regressed,
naming which. Three sites is thin, and it is enough to catch the failure mode
that matters.

**The rail is why the AI's own verdict is not the gate.** An agent that both
makes the change and judges it has no independent check.

**Its consumer moves with §8.2.** Because the AI no longer edits code, the rail's
primary caller is the **free-coding session** that implements a gap ticket: a UAT
proves the one gap closed, and only the rail proves the other references did not
regress — a distinction a single-site UAT structurally cannot make. The console
runs it read-only as well, so each iteration displays the current cross-site
state rather than only this site's.

### 8.5 The prompt is a deliverable, not a detail

"Point the AI at the right things" is real work. The brief should be distilled
from [[DOC-19]] plus our accumulated reproduction transcripts, and at minimum it
must carry: the one rule (§7.5 — transcribe from the DOM, never reconstruct from
the screenshot); read `regions` before `meanDifference`; the `check_fidelity`
verdicts and what each implies, especially that `capture-incomplete` means stop
rather than iterate; fix the engine, never the site (§7.1); and content
completeness before pixels (§7.4).

It is a durable artifact — a doc — not a string buried in the console.

### 8.6 Isolation — this is a dev tool and must never be deployable

The constraint splits into **two different risks with two different answers**,
and conflating them would leave one of them uncovered.

#### Risk 1 — the console itself gets deployed. Fixed by construction.

- **Lives in `tools/repro-console/`. Never `apps/`.** The only two deployable
  units are `apps/public-site` and `apps/control-app`; they are the only two
  `wrangler.toml` files in the repo and both deploy scripts name their package
  explicitly via `--filter`. Staying out of `apps/` keeps all deploy paths
  structurally unable to reach the console.
- **No `wrangler` config of any kind** inside it.
- **No `build` script.** `pnpm-workspace.yaml` globs `tools/*`, so the console
  *will* be a workspace package and `pnpm -r build` *will* visit it. Having no
  build script is what makes that visit a no-op. `private: true` as well.
- **Dependency direction is one-way.** The console imports the reproduction
  engine (that is the thing under test). **Nothing under `apps/` or `packages/`
  may import the console**, directly or transitively.
- **Binds to localhost only.**

**This is asserted, not merely intended.** [[REQ-254]] ships a UAT that fails if the
console acquires a build script or a wrangler config, or if any package under
`apps/` gains a dependency on it. A convention nobody checks is precisely how a
dev tool ends up in production.

#### Risk 2 — the AI's *edits* reach production. Dissolved by §8.2.

Worth recording why it was a risk, because the coupling is real and permanent.
`apps/control-app` imports the engine **directly from `tools/generate/src/` by
relative path** — `store/d1r2-store`, `store/ids`, `publish/ladder`,
`cli/capture/cf-driver`. The reproduction engine's source tree **is deployed
code**. Directory layout cannot separate them, and should not: improving the
shared engine is the entire point of loop 1.

**§8.2 removes the risk at its source — the AI writes no code**, so there is
nothing of its authorship to reach anywhere. Engine changes arrive by free
coding, through the same review, UAT and reconciliation path as every other
change in the project. Operator position, recorded: we are pre-production, the
reproduction engine is poor, and production is deployed separately by an explicit
human act — so this was never the acute risk.

Two things stay, now as ordinary hygiene rather than as mitigations:

- **The rail includes a Worker build check** — the existing `dryrun:control`
  (`wrangler deploy --dry-run`). Because of the coupling above, an engine change
  can break the control app, and the free-coding session should learn that in the
  round that caused it rather than at the next deploy.
- **Deploy stays a separate, explicit, human act.** No part of the console
  invokes a deploy script.


## 9. Open questions

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
6. **Which loop first?** Loop 1 compounds — every engine fix helps every future
   site — but is slower to show value. Loop 2 makes the next demo work and does
   not accumulate. My read: build the shared harness (C1/C2) once, because it is
   most of both, point it at loop 1 first, and let loop 2 follow once the fix-log
   shape (C6) is known. Worth disagreeing with if a demo date says otherwise.
7. **Is the per-iteration gate the fast subset or the whole suite?** 517 UATs
   today, ~73 reproduction-relevant by name. The rail runs every iteration, so
   runtime is a design constraint; but a subset is exactly how a regression
   sneaks past. Measure before choosing (§8.4).
8. **When, if ever, does the AI get to edit code directly?** §8.2 is explicitly a
   *v1* decision. The v2 question is not "should it" but "what evidence would
   justify it" — candidate: N consecutive rounds where the free-coded fix matched
   the AI's proposed change and the next iteration's numbers moved as predicted.
   Until that is measured, the answer is no.
9. **Does duplication ever become the pitch?** [[CHAT-5]] framed "bring any
   design, get it editable, for less than Wix" as the wedge. [[CHAT-29]] said
   *don't offer reproduction at all* and [[CHAT-21]] said migration must never be
   the ask. Reconcilable — the diagnostic is the pitch, duplication is the
   mechanism — but state it explicitly before any marketing copy is written.

## 10. Proposed child tickets

Two principles, from the operator: **keep the count to a minimum**, and **every
ticket ends with testable content** — something a person can run and judge, not
just a green CI line.

### Near-term: build the console (§8). Three tickets, filed, in this order.

**[[REQ-254]] — The console, no AI in it yet.**
Text box + [reproduce] → capture → reproduce → diff. Renders the "Iteration N"
link block (original · reproduction · diff images · code diff), all new tabs.
[run again] re-runs manually. Home pages only.
*Testable:* enter `joyfulculinarycreations.com`, get the link block, click each
link and see the real site, the real reproduction, the real diff images. **This
is useful on its own** — with no AI attached it already collapses the setup cost
of today's manual loop, which is why it goes first.

**[[REQ-255]] — The regression rail (§8.4).**
Record a gate baseline per stored reference; one command that runs the UAT gate +
typecheck + **the Worker build check (§8.6 risk 2)** + re-gates all references
and reports "no worse than baseline".
*Testable:* green on `main`; deliberately break a serializer and it goes red
**naming which reference regressed**. Both directions must be demonstrated.

**[[REQ-256]] — The AI iteration (§8.1 steps 3–5, §8.2, §8.5).**
Wire the AI in: the distilled brief, it reads the diff, diagnoses the residual,
and **files a gap ticket** against the engine — it does not edit code (§8.2).
Transcript streams to the page; the ticket is linked as the fourth artifact;
[run again] re-runs with whatever has landed since. Fresh `1c` per iteration
(§8.3).
*Testable:* one full round on a known reference — transcript appears, a
well-formed gap ticket exists and is linked, and after the operator free-codes it
[run again] produces "Iteration 2" with moved numbers. Plus the negative case:
**a `capture-incomplete` verdict stops the round and files nothing.**

**Why three and not two.** [[REQ-255]] could fold into [[REQ-256]], but then the
rail and the loop it protects arrive in the same commit — the one ordering that
cannot be reviewed. The rail must exist, and be shown to fail correctly, before
the loop starts producing change proposals at all.

### Later — not part of the console build, not yet scoped

**Workstream A (understanding).** Vision captioning pass over a bundle's
`assets/` · the **semantic outline** artifact (§5.1 — the cheapest high-leverage
item in the epic) · the read-back itself · re-verify `theme-site-logo`
post-[[BUG-27]].

**Workstream B (bringing across).** Generator detection (gates the rest) ·
beta-cohort generator survey (answers Q1) · the builder-transform seam · the
Elementor transform · the coverage metric · a second builder.

**Workstream C loop 2 (§7.2–7.3).** In-session smoothing via the L1 control
surface, and the fix log that turns loop 2's hand-fixes into loop 1's backlog.
Deliberately after the console: the fix-log shape is easier to get right once we
have watched loop 1 run.

## 11. Related

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