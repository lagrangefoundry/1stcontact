---
uid: request-d41fd017
id: REQ-95
type: request
title: 'gendevlabs.ai: first site AUTHORED in L1 (authoring-face probe)'
created_by: xgd
created_at: '2026-07-25T22:03:36.283650+00:00'
updated_at: '2026-07-29T19:20:17.913669+00:00'
completed_at: null
last_field_updated: status
status: legacy_done
fields:
  priority: high
  story_points: 8
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-f6f1c1b0
---

## Scope

Build **gendevlabs.ai** — the marketing site for GenDev Labs (the company behind XGD) — as the **first site authored directly in L1**, with no capture bundle and no reference target.

Every L1 page that exists today (`gigabytealchemy`, `joyful`) is a _fold_ of a capture. This is the first one written by hand.

## Why this is a probe, not just a build

L1 has two faces, and only one of them has ever been exercised.

`packages/site-schema/src/l1/schema.ts:252` says it outright:

```
// ── Structure primitives (capture leaves empty; the AI recovers) ─────────────

```

- **Transcription face** — keyframed absolute geometry (`render.ts:420`, `position: absolute`). This is what `fold` emits, and it is what every reproduction to date has hardened (BUG-11 … BUG-24, REQ-88).

- **Authoring face** — `sizing` (`fixed | fluid | hug` + min/max), `distribution`, `align`, `visibility` (`fromPx`/`untilPx`), flow containers. Present in the schema, honoured by the renderer (`render.ts:696` emits `display: flex` / `justify-content` / `align-items`; `render.ts:257` maps fluid → `100%`, hug → `fit-content`) — and **never populated by capture**.

The only things that write structure primitives are the demand-driven recovery paths, and they correctly abstain when a page does not need them: `fitColumn`**declined joyfulculinarycreations outright** (no centred column). So further reproductions do not mature the authoring face — nothing in that loop writes to it. It matures only when someone authors into it.

This is the same play that produced the reproduction pipeline. gigabytealchemy was run against an L1 that could not paint surfaces, bind fonts, or carry padding, and that one unready probe produced BUG-11 → BUG-20 in a single pass. The probe is not run _because_ L1 is ready; the probe is how L1 gets ready.

## Deliverables

1. **The site** — gendevlabs.ai, authored in L1, rendering through the standard `1c` pipeline (`1c new` → author → `1c render` / `serve` / `shot`), correct at 320 / 768 / 1440.

2. **The authoring-face gap list** — every point where the L1 vocabulary could not express the intended design, or expressed it but broke under a viewport or content change. Each gap filed as its own BUG/REQ (the BUG-11…20 pattern), **not** fixed inline under this ticket.

Deliverable 2 is the strategically load-bearing one. A gap list is a successful outcome, not a failure.

## Acceptance criteria

- **AC1** — `storage/sites/gendevlabs/draft` renders a complete home page from a hand-authored `l1` document; no capture bundle involved anywhere in the chain.

- **AC2** — The page is built on the **authoring face**: flow containers with `sizing` / `distribution` / `align`, not a hand-written keyframe track. Any place that had to fall back to absolute keyframes is recorded as a gap (AC5) with the reason.

- **AC3** — Correct at 320 / 768 / 1440 under `1c shot`, judged by eye. No overlap, no overflow, no unintended wrap.

- **AC4** — Content-robust: swapping a heading or body string for one ~50% longer does not break the layout. This is the property absolute-base output does not have, and the reason the authoring face exists.

- **AC5** — The gap list exists as filed tickets, each naming the design intent, the L1 axis that was missing or insufficient, and the workaround used (if any).

## Design / content input needed from the operator

Not retrievable from the system — a business decision:

- What GenDev Labs says about itself (positioning, the XGD story, audience).

- Design direction and ambition level. Per CHAT-4, gendev carries **no coverage obligation** — it is the free one. That makes it a good place to push, but the target needs naming: "clearly bespoke" is a different gap list from "sycamore-class" (the latter needs motion / layer primitives that L1 does not have at all — see REQ-19).

- Any brand assets (logo, type, palette) or a from-scratch brand.

Authoring can start on structure with placeholder copy; the ambition level should be settled before the design is committed, because it determines whether the gaps found are "a short list of axes" or "a different programme."

## Dependencies / notes

- **REQ-93** (L1 pages hosting behavior modules in slots) is `ready_to_reconcile` — so a `contact-form` on an authored L1 page is available. Before REQ-93 the page schema enforced a strict L1-XOR-modules.

- `1c new` scaffolds `{ modules: [] }`, not an `l1` block — the L1 document is authored by hand into `pages/home.json`. Whether `1c new` should scaffold a starter L1 skeleton is itself a candidate gap.

- Site definitions under `storage/sites/**` are config and exempt from the free-coding ceremony. Any **framework** change this probe forces is code and gets its own scope ticket — that is deliverable 2, and it must not be short-circuited by editing framework source under this ticket.

- Relationship to REQ-19 (1stcontact.io ceiling proof): that milestone is gated on motion/layer primitives that do not exist. gendevlabs is deliberately the cheaper, lower-stakes first authoring probe — it de-risks REQ-19 by finding the authoring-face gaps before the flagship depends on them.

---

## Update (2026-07-25): target is xgd.dev, ambition is Tier-1

Operator session settled the open questions in "Design / content input needed".

### Brand / domain decision

The site is **xgd.dev**, not gendevlabs.ai. House-of-brands:

- **xgd.dev** — the XGD product site, and the home of the blog + whitepapers (the one place content authority compounds). `xgd.dev` confirmed available and now owned.

- **1st Contact** — its own brand and domain when it is real. Decisive reason is audience, not SEO: XGD sells to technical builders who make architecture decisions (DOC-9 §5); 1st Contact sells to small-business owners. Zero overlap in keywords, backlink sources, or register.

- **GenDev Labs** — kept as legal entity + whitepaper byline ("Martin Westhead · GenDev Labs" is the right register for research; "· XGD" reads as vendor content). `gendevlabs.ai` (owned, Cloudflare, created 2026-03-03) redirects to xgd.dev. No design investment.

SEO was investigated and found **not** to be a driver for this decision: "XGD" collides with an actively-traded gold-ETF ticker, and "generative development" collides with the saturated "Generative AI for Software Development" category. Neither is winnable; the coined terms that _are_ ownable ("Extreme Generative Development", "the Software Artificer") have ~zero volume by construction. Discovery is referral/social/direct per DOC-7 cluster A, so the domain is for recall and credibility, not findability.

**Consequence:** `storage/sites/gendevlabs` → `storage/sites/xgd`.

### Ambition level: Tier-1 / sycamore-class

Settled — this is the "sycamore-class" target, not "clearly bespoke". This makes xgd.dev **flagship site #1 per DOC-16 §4**, taking the slot that doc assigns to "Gen Dev Labs" (which §4 notes "may flex hardest — Tier-1 with an optional Tier-2 flourish"). sycamore.so is a named Tier-1 comp in DOC-16 §3.

Page scope for the first pass: home page only. Mailing list / contact / whitepaper email-capture are **stubbed** (`mailto:` or a throwaway endpoint) — the 1st Contact backend (Cloudflare D1) is separate work in flight and explicitly out of scope here. NOTE: gigabytealchemy is not a usable template for this — its `form-0` posts to an external API and its `form-1` capture has `action: ""` (wired to nothing).

Later growth (out of scope for this ticket): blog, customer portal (subscriptions + support tickets), events calendar.

### Motion: L1 axes, not a behavior module

Resolved in session. DOC-25 §1 lists "scroll-animation" among future behavior modules, but that is a throwaway enumeration; DOC-16 §4's considered build order lists **REQ-16 motion as a framework primitive** alongside REQ-14 background and REQ-15 layer. The primitive reading wins on three structural grounds:

1. **Modules are nouns; motion is an adjective.** A behavior module wraps L1 subtrees in _named slots_ (DOC-25 §1). Reveal does not wrap anything — it modifies a node already in the tree. Staggering five hero elements would need five module instances, or one repeated slot that flattens the hero's real structure into a list.

2. **Capture cannot reach a module.** Fold maps captured node axes → L1 node axes; modules are authored, never folded. If motion lives in modules, animated content is unfoldable by construction — which is already biting us (animated text / lazy images come back blank in captures).

3. **Smaller attack surface.** Motion-as-L1-axis compiles to a CSS transition plus one renderer-owned IntersectionObserver, vetted once, zero per-site JS. Motion-as-module ships style-mutating JS per module per site (cf. DOC-24, DOC-2).

**The split:** node-level motion (reveal / stagger / hover) → **L1 axes**; scene/stateful motion (parallax, scroll-scrub, marquee) → **behavior module** (DOC-25's entry, correctly scoped); choreography defaults → **prompt layer** (DOC-16).

**Sequencing** follows DOC-21, not DOC-16 §4: author the static page to L1-exhaustion _first_ and let the page prove which axes it needs, rather than adding three speculatively. Candidate minimum set, to be confirmed by evidence: `reveal {yPx, fromOpacity, durationMs, delayMs, easing}`, container `staggerMs`, `hover {yPx?, scale?, color?, opacity?, durationMs, easing}`.

## Tools to build (authoring-loop instrumentation)

DOC-21's growth loop is **reproduction-driven**: its Good-Enough gate (§4) is a vector diff against a reference bundle, and every instrument we own — capture, `1c diff`, values-diff, the 3-probe gate — measures _distance from a reference_. **Authoring has no reference, so none of it applies.** The honest default gate becomes operator eyeballing, which is exactly the subjectivity DOC-16 §7 admits and §6 wants disciplined. Three instruments to close that, each its own scope ticket (not fixed inline under REQ-95):

1. **Mechanical page-oddity linter** (operator request, 2026-07-25). A "dumb" structural checker over rendered geometry that flags pathological layout without reference to any design intent. Reproductions already produce these and they are caught only by eye. Candidate checks: text-on-text overlap of non-transparent runs; content overflowing its container or the viewport; zero/negative computed boxes; text clipped by an ancestor; unintended line wrap (orphan single-word lines); baseline/edge misalignment of siblings that are nominally aligned; elements rendered off-canvas; illegible contrast ratios; images at extreme aspect distortion. **Design constraint:** overlap is sometimes deliberate art direction, so this must be an _advisory_ report with per-node suppression, never a hard gate. Value is that it is mechanical, reference-free, and works for both authoring and reproduction.

2. **Blind comparative ranking.** Render the page and 3–4 Tier-1 comps at identical viewports, strip identifying marks, have a fresh agent rank them on the rubric without knowing which is ours. Adversarial, repeatable, and the closest thing to an objective premium-ness signal available without a reference bundle. The rank is the metric across iterations.

3. **Promote the DOC-16 §3 design rubric to the authoring gate.** Already specified there as "one artifact, two uses" (prompt guidance AND eyes-loop acceptance criteria) — currently underdeveloped. This build is what develops it, per §5's standing lessons-capture practice into DOC-17.

## Hero tagline — DECIDED (2026-07-25)

Closes the open item in [[DOC-9]] §Open ("the founder-facing tagline is OPEN and needs a dedicated generation pass"). Register is §7's right-hand column (founder value message), not the category narrative.

**Tagline: **`AI writes it. XGD keeps it working.`

### Rejected directions, and why (the reasoning is the reusable part)

- **Fear of your own codebase** ("Never be afraid of your own codebase") — REJECTED. Everyone is afraid of their codebase; it is a generic developer pain, not the problem XGD solves, and the line says nothing about generative development.

- **Foregrounding the absence of review** ("Ship code you'll never read") — REJECTED as sounding _negligent_. **General principle: leading with an absence reads as carelessness.** Lead with what is present (the guarantee) and the absence becomes a consequence rather than a caveat.

- **The built-with-itself proof as hero** ("We haven't read our own source in nine months") — REJECTED as sounding _reckless_ in hero position: if the vendor has not read it, why would a buyer trust it? The proof only reads as evidence _after_ the mechanism is understood. Demoted to section 3.

- **"...you can trust but never have to read"** — REJECTED. The concessive "but" frames not-reading as a liability being excused, making the line apologetic; "have to" is obligation-framing that concedes reading is the proper default.

- **"proves"** — REJECTED. Collides with _formal_ verification (a term of art); a technical audience reads it as a claim about model checking and calls BS. Credibility risk with precisely the §5 target audience.

- **"verifies"** — REJECTED, same semantic field ("formal verification").

- **"ensures"** — REJECTED. Clears the formal baggage but is the verb of compliance decks: a promise with no mechanism, the verb-equivalent of "trust". The second beat is where differentiation must live.

### Why "keeps it working"

1. **Carries the time dimension, which is the actual value proposition.** Per [[DOC-4]], AI code works _at the task level_; the failure is cumulative and silent as the codebase grows. A present-tense verb ("proves it works") understates the product. "Keeps" is the scaling wall answered in one word, and it is the steam governor of [[DOC-5]] §2 in founder register.

2. **No formal-methods baggage** — plain English, nothing to call BS on.

3. **Modest, and modesty is credibility** with engineers oversold by every AI coding tool this year. Underclaims slightly — the right direction of error.

4. **Plants the category in three words** — "AI writes it" makes it unmistakably about generative development.

5. **Cannot read as negligent** — no absence anywhere in the sentence.

Runners-up, retained: `XGD won't let it break` (punchier, names the pain, but leans the second beat on a negative); `XGD holds it to spec` (qualifies in hardest per §5). `Never be afraid of your own codebase` retained as a candidate **SEM/ad** line only — it leads with felt pain, which converts cold better than a claim, but it is wrong for the hero.

### Page opening structure (from the same pass)

1. **Hero** — the tagline above.

2. **Altitude section** — "Review what it does, not how it's written." Disarms the negligence objection ([[DOC-9]] §4: the review did not vanish, it moved up a level).

3. **Proof section** — the nine-months / built-with-itself proof ([[DOC-9]] §8), which lands as evidence here rather than recklessness.

4. **The wall** — the problem section ("Your AI didn't slow down. Your codebase did.").

5. Mechanism → beta CTA.

### Hero block — FINAL

```
H1:   AI writes it. XGD keeps it working.

Sub:  XGD maintains a living spec of your software's intended behavior and
      tests the running system against it on every change. You own that
      intent and the architecture; XGD owns the implementation.

CTA:  [Join the beta waitlist]  [Read the whitepaper]

```

**Subhead reasoning (the reusable copy lessons):**

- **No wh-word may open the subhead.** The first draft opened "What your software is supposed to do, written down and tested…" — a free relative clause that makes readers expect a finite verb ("What your software is supposed to do _is_…"). Hitting a participle instead forces a re-parse: "a question that doesn't arrive." Open on a plain noun phrase or a finite subject-verb.

- **"Written down" implied homework.** Agentless passive made the reader assume _they_ write the spec — landing as another document to maintain, which is the exact negative [[DOC-5]] §2.1 defines XGD against ("not maintained by discipline"). Fixed by making XGD the grammatical subject: if XGD _maintains_ it, the reader knows they do not. Automaticity conveyed by agency, not adverb.

- **"Living spec"** carries constant-currency in one word and pre-empts the "more documentation" reaction.

- **"You own that intent and the architecture; XGD owns the implementation"** does [[DOC-9]] §5's qualify-in _and_ qualify-out in one turn, by attraction rather than exclusion: architecture-vs-implementation is a distinction engineers parse instantly and non-technical readers do not. Also encodes §6 (what the human still owns). "Implementation" not "code" — "XGD owns the code" carries an unwanted IP/licensing reading next to a signup button.

- **"That intent"** (not "the intent") deliberately chains back to "intended behavior" in the previous sentence, converting a word collision into a link.

- **Consistency constraint:** never use "proves" / "verifies" / "verified" anywhere in hero copy — they were rejected from the H1 for formal-methods baggage and reintroducing them downstream would undo that. Use _tests_, _checks_, _maintains_.

**Held for use below the fold:**

- The stale-spec contrast ("a spec that can't go stale") — too strong to spend as a subordinate clause; it is the natural lead for the mechanism section.

- "…so regressions surface the moment they appear, not six months later" — the most vivid line generated; lead for the wall section (§4 of the page structure).

- An explicit "who this is for" section — §5's repulsion mandate done bluntly, which is wrong for a hero but right below the fold.

## Authoring-face findings — pass 1 (hero only, 2026-07-25)

Site scaffolded as `storage/sites/xgd` (`1c new xgd`); logo assets moved to `storage/sites/xgd/import/`. Hero authored and rendering at 320/375/768/1440.

### What WORKED — the authoring face is real

AC2 is satisfied for this section: **zero geometry keyframes were needed.** The whole hero is flow containers.

- `sizing: {width: {mode: 'fluid', maxPx: N}}` + parent `align: 'center'` gives a centred max-width column correctly.

- `distribution: 'between'` / `align` / `gapPx` / `layout: stack|row` all render as expected.

- `responsive` scalar tracks (`fontSizePx` / `lineHeightPx` / `letterSpacingPx`) produce fluid type scaling across the ladder with no hand-authored media queries — this is the single best part of the authoring face.

- `responsivePadding` tracks work the same way for section rhythm.

- `visibility: {fromPx: 768}` correctly drops the nav links on mobile.

### GAPS FOUND (candidates for filing as separate tickets — AC5)

1. `l1TextSchema`** has no **`sizing`**.** Box, image and container all carry `sizing`; text does not. So a text leaf cannot declare its own _measure_ (max-width) — the most fundamental typographic control there is. Workaround: wrap every constrained paragraph in a container that exists only to cap line length (`sub-measure` in the hero). Costs a wrapper node per paragraph and pollutes the tree with non-semantic nodes.

2. **No font-acquisition path for authored sites.** `l1FontFaceSchema` binds a family handle to a served `.woff2` under `draft/assets/`. Every font in the repo arrived via a _capture bundle_; authoring has no library, no `1c` verb to add a face, and no bundled default. Fell back to a system stack (`Helvetica Neue, Arial, sans-serif`), which is the main reason the page still reads generic rather than premium. **This is the hard blocker on Tier-1 typography** — type is ~80% of a text-driven premium site.

3. **No motion** (confirmed, as predicted). No reveal, no stagger, no hover. The CTAs are visually inert on pointer.

4. `1c new`** scaffolds **`{modules: []}`**, no **`l1`** skeleton.** Anticipated in this ticket as a candidate gap; confirmed. The entire document — `widths`, `background`, `root` — is hand-written from nothing.

5. **No "never wrap" control on a text leaf.** `nowrapFromPx` forces nowrap _above_ a width; there is no always-nowrap, and no way to substitute shorter copy at narrow widths. Result: both CTA labels wrap to two lines at 375px — a real AC3 defect visible in the mobile shot.

6. **Containers cannot paint; boxes cannot lay out.** `l1ContainerNode` has no `axes` (no `surfaceFill` / `border` / `borderRadiusPx`), and `L1BoxNode` has no `layout` / `gapPx` / `distribution` / `align`. Any element that is both painted _and_ internally laid out therefore needs two nested nodes. Survivable for a single-child button; a compounding tax on cards, panels, and bordered sections — which is most of a marketing page below the hero.

### Design observations (→ [[DOC-17]])

- **Contrast hierarchy must follow the argument, not the reading order.** First draft set line 1 bright and line 2 dim, which made the _payoff_ the most recessive thing on the page. Inverting it (commodity half dim, differentiator bright) is both better typography and better rhetoric — the two-tone split makes the two-beat H1 structure visible.

- The page is currently **very empty**: flat black, no texture, no layer, no imagery. The logo's wireframe/warped-grid motif is an obvious unused asset and the natural candidate for hero visual interest.

- The raster logos (1024², baked backgrounds, soft linework) are unusable at hero scale. Wordmark set in live type in the nav sidesteps this — but a real SVG redraw is still wanted.

## Typography + font licensing (2026-07-25) — gap 2 resolved for xgd.dev

**Chosen:** Satoshi (display/UI, weights 400/500/700/900) + JetBrains Mono (accent). Both self-hosted under `storage/sites/xgd/draft/assets/` and bound via `l1.resources.fonts`. Satoshi is distinctly _not_ Inter, which matters when the positioning is "not like the others"; the mono is already in the brand (the logo's subtitle) so it does real work. Geist/Geist Mono was the runner-up — better-matched as a system, but strongly associated with Vercel.

Licences: Satoshi is ITF Free Font Licence (Fontshare); JetBrains Mono is OFL (Google Fonts, latin subset). Both permit commercial use and self-hosting.

### Licensing findings — these constrain the 1st Contact PRODUCT, not just this site

Researched because it determines what a website _builder_ can offer. Probably wants promoting to its own doc.

1. **1st Contact can NEVER buy one commercial licence and serve it across customer sites.** Commercial webfont licences are granted per-licensee, typically per-domain or by pageview, and agencies / hosting providers are explicitly barred from sharing one licence across client sites. Adobe Fonts additionally forbids self-hosting _and_ uploading to a website design platform, closing that route twice over.

2. **Three legitimate models**, in order of increasing cost:

- _Free-only default_ — ship a curated OFL/FFL library. **V1.** Zero exposure, self-hostable, no renewal.

- _Customer brings own licence_ — customer uploads their licensed `.woff2` and attests they hold a licence for their domain; 1st Contact is a conduit and liability sits with the customer. The long-tail answer.

- _Platform / OEM licence_ — negotiated per foundry, priced per-site or rev-share (what Wix/Squarespace/Canva do). Real, but bespoke and slow. Not V1.

3. **Architectural constraint:** serving fonts from a public CDN _without access controls_ counts as redistribution beyond licensed scope — a commercially licensed font needs an origin-scoped endpoint. Free self-hosted fonts sidestep this entirely, which also keeps them inside the [[DOC-24]] / [[DOC-2]] safety envelope as static assets rather than third-party runtime dependencies.

4. **A curated free-font menu is a genuine product feature**, and per [[DOC-16]] the curation _is_ design intelligence. A paid-font marketplace is a business, not a feature — there is no standard "licence through us" pipe.

5. **Premium does not require paid type.** The libre corpus (Satoshi, Geist, Inter, IBM Plex, JetBrains Mono, Space Grotesk, Instrument, Fraunces …) is first-rate. Paid foundry faces buy _distinctiveness_, not quality. Using a free face on the flagship is therefore also a dogfooding result: if xgd.dev reads premium on OFL type, that is direct evidence 1st Contact's free-only default is sufficient for customers.

**Caveat to revisit:** the ITF Free Font Licence is non-transferrable and terminable. Fine for xgd.dev. If Satoshi later ships inside 1st Contact's font menu (redistribution to thousands of customer sites), that needs a lawyer's read even though the Fontshare FAQ lists OEM use as permitted.

### Remaining gap

Gap 2 is closed _for this site_ by hand-downloading files. The underlying authoring-face gap stands: **there is still no font-acquisition path in the product** — no library, no `1c` verb to add a face, no bundled default. Every authored site would otherwise fall back to a system stack.

## Gap tickets FILED (2026-07-25) — AC5 satisfied for pass 1

Ticket

Gap

Status / dependency

[[request-6c2b1cf4]] REQ-97

text leaves cannot declare a measure (`sizing`)

independent, small

[[request-7e70b1db]] REQ-98

paint axes arbitrary across node kinds

**collides with REQ-96 in **`schema.ts`** — land with/after it, not in parallel**

[[request-c0435b4c]] REQ-99

no interaction-state vocabulary (hover / focus)

REQ-96 quality story

[[request-f522d726]] REQ-100

no motion (scroll-reveal / stagger)

**evidence-gated — hold until §2–5 authored**

[[request-b63bbed5]] REQ-101

no font-acquisition path or licence provenance

independent, high priority

[[request-56cb1897]] REQ-102

`1c new` scaffolds no L1 document

independent, low

### Gap 5 WITHDRAWN — not a gap

The earlier finding "no always-nowrap, and no way to substitute shorter copy at narrow widths" was **wrong on both halves**. Both are already expressible:

- **Always-nowrap:** `nowrapFromPx: 0`. `render.ts:599` emits `white-space: nowrap` unconditionally when `nowrapFromPx <= state.minWidth`, rather than wrapping it in a media query.

- **Responsive copy:** two text leaves with `visibility.fromPx` / `visibility.untilPx` — the renderer emits `display: none` outside the band (`render.ts:558-567`).

The wrapping CTA labels at 375px are therefore an **authoring defect in this site**, not a framework gap. Fixed by setting `nowrapFromPx: 0` on both labels.

Lesson (→ [[doc-…]] DOC-17): check for an existing mechanism before minting an axis. A missing _usage_ looks identical to a missing _capability_ from the outside.

### Impact of REQ-96 on this probe's findings

[[request-3a064234]] (REQ-96) makes L1 the sole owner of appearance — modules ship zero CSS. That **promotes REQ-97 and REQ-98 from ergonomics to contract holes**: whatever L1 cannot express, a module must paint, which is the exact outcome REQ-96 exists to prevent.

It also relocates motion _choreography_ from the prompt layer to **L2 presets**. L2 presets are parameterised L1 subtrees (`packages/framework/src/l2/contact-form.ts`), so once motion is an L1 axis, motion presets compose for free; the prompt layer then _chooses among presets_ rather than emitting axis values directly.

### Stale project instruction — needs fixing

`CLAUDE.md` ("Close capability gaps in L1, not with new modules") advises closing a capability gap by _"adding a dial / variant to that behavior module (e.g. a new _`carousel`_ view mode)"_. REQ-96 names `config.view` as **the** worked example of the violation to be deleted — an aesthetic dial wearing behavioural clothes. The instructions and the design have drifted apart on that sentence, and it will keep misdirecting future sessions until corrected.

### GAP 7 (new, found closing the CTA defect) — a row container cannot wrap

Fixing the CTA labels with `nowrapFromPx: 0` removed the wrap and immediately produced **horizontal overflow** at 375px instead: the two buttons need ~488px and the viewport gives 375.

The natural fix is `flex-wrap: wrap`. `L1ContainerNode`** has no such field** — it carries `layout` (`stack|row|grid`), `gapPx`, `columns`, `distribution`, `align`, `sizing`, but nothing for wrapping. A row is unconditionally single-line.

Nor is `layout` responsive: a container cannot be a `row` at one width and a `stack` at another.

**Workaround used** (and the reason this is worth a ticket): author the CTA block **twice** — a `row` with `visibility.fromPx: 520` and a full-width `stack` with `visibility.untilPx: 520`, holding duplicate copies of both buttons. It renders correctly (and full-width stacked buttons are better mobile design anyway), but the same content now exists twice in the tree, so every future copy edit must be made in both places or they silently diverge.

This is the same class of defect as GAP 6 (containers cannot paint / boxes cannot lay out): the axis set is _almost_ sufficient, and the cost of the missing axis is paid in duplicated tree structure.

Candidate resolutions, in order of preference:

1. `wrap: boolean` on a row container (maps to `flex-wrap: wrap`) — smallest, closes the common case, purely additive.

2. A responsive `layout` track (row→stack across the ladder), mirroring how `responsive` already keyframes scalar axes. Strictly more powerful; more work.

Not yet filed — flagged for the operator alongside REQ-97…REQ-102.

- 

- 

- 

- 

- 

- 

- 

- 

- 

- 

-