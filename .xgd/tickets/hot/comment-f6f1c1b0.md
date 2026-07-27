---
uid: comment-f6f1c1b0
id: COMMENT-522
type: comment
title: Comment on request REQ-95
created_by: xgd
created_at: '2026-07-25T22:34:29.970587+00:00'
updated_at: '2026-07-27T19:25:14.133387+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-d41fd017
  kind: chat_transcript
---

<!-- xgd-turn id="7a314d56-8f1c-48a6-8132-6a711c671c7b-user" -->

<!-- xgd-chat role="user" ts="2026-07-25T22:34:27.631220+00:00" -->
#### You
OK so we are going to create a site for gendevlabs.ai featuring our flagship product XGD and later to add our follow on product 1st contact which will need its own site.

Please review the documents in ../xgd-biz for an overview of the product, positioning and go to market.

This exercise is a test of our L1 framework. Our goal is to create a site to the standard of sycamore.so and we want to figure out if Claude  + L1 is an effective tool for that. I have created an XGD logo and put some versions of it into sites/gendevlabs/import

A challenge here is that we have multiple brands we need to try to keep things simple. I think the gendevlabs site should primarily showcase xgd and its brand. Do you agree?

<!-- xgd-turn id="7a314d56-8f1c-48a6-8132-6a711c671c7b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-25T22:36:50.746317+00:00" -->
#### Claude
I'll read the business docs and look at what's already in place before answering.

The business content lives in xgd-biz's ticket store, not files. Let me pull it and look at the logos.

The `xgd` CLI redirected to the 1stcontact workspace. Let me find how to target xgd-biz, and view the other logos.

`XGD_PROJECT_ROOT` is pinning the workspace. Let me override it and view the remaining logos.

Now the positioning docs.

Let me ground the "sycamore.so standard" question in what L1 can actually express today.

I've read the xgd-biz positioning docs (DOC-9 keystone, DOC-7 biz plan, DOC-4/5 whitepapers), the six logo variants, and checked what L1 can actually express today.

## On the brand question — yes, agree

Three independent reasons, and they all point the same way:

**1. There is no GenDev Labs positioning to express.** DOC-9 is the messaging keystone and it is 100% about XGD — the category ("a governor for generative development"), the three-act spine, the compiler analogy, the audience, the proof. GenDev Labs appears in the corpus only as a byline: *"Martin Westhead · GenDev Labs"* on the whitepapers. Building a GenDev Labs brand layer now means inventing content that doesn't exist yet.

**2. Every traffic driver in DOC-7 is XGD content.** Whitepapers, blog, conference talks, the beta waitlist, the SEM plan, the showcase project. Nobody arrives at that site looking for a holding company — they arrive from a whitepaper or a talk, wanting XGD.

**3. Your logo set already made this decision.** One variant reads **"from GenDev Labs"** under the xgd mark. That's textbook endorsed-brand architecture: XGD is the hero, GenDev Labs is the parent signature. The assets encode the answer.

So: gendevlabs.ai leads with XGD, uses the XGD visual system (monochrome, mono-type, wireframe motif), and GenDev Labs appears as the company signature — footer, about, whitepaper bylines. That also serves DOC-9 §5's "qualify in the technical, qualify out the magic-wand seekers" — a dense monochrome typographic site self-selects your audience before a word is read.

## The one fork worth deciding now

Does XGD eventually get its own domain? Because the beta waitlist, whitepaper backlinks, and SEM spend all accumulate authority wherever they land. If XGD moves to `xgd.dev` in a year, that's wasted. Two clean structures:

- **(a)** gendevlabs.ai *is* the XGD site. When 1st Contact ships on its own domain, gendevlabs.ai gains a small "also from GenDev Labs" strip. Cheapest, and my default.
- **(b)** XGD takes its own domain from day one; gendevlabs.ai is a thin parent shell.

I'd go (a) unless you already intend an XGD domain. It's a five-minute decision that's expensive to reverse later.

## Honest read on the sycamore.so bar

This is the part you should hear before we design anything. I grepped the L1 schema and renderer:

- **L1 has a strong *static* vocabulary** — gradients, drop shadows, blur, backdrop-blur, feathered/circular masks, rotate/scale transforms, blend modes, borders, radius, opacity, per-viewport responsive type tracks. That's genuinely enough to make something that reads bespoke rather than templated.
- **L1 has no motion whatsoever.** Zero hits for transition, animation, hover, or scroll in both the schema and the renderer. Not a weak axis — an absent one.

Our own Design Lessons Log (DOC-17) says it plainly: *"Purposeful entrance / scroll-reveal / hover is the single biggest 'alive vs static-template' signal — on every polished site."* And REQ-95's own body anticipated exactly this fork: *"clearly bespoke" is a different gap list from "sycamore-class" (the latter needs motion / layer primitives that L1 does not have at all — see REQ-19).*

So the answer to "is Claude + L1 an effective tool for this?" will come back **"effective for static-bespoke; not yet for sycamore-class, and here is precisely the missing axis."** That's a successful outcome for this probe, not a failure — it's deliverable 2. But it means we should agree up front that the near-term target is *the best static page L1 can produce*, with motion filed as the headline gap, rather than discovering that at the end.

## Asset gap

All six logos are 1024×1024 Gemini rasters with baked backgrounds (white / grey / black) and heavy margins. The wireframe motif is soft raster linework — at hero scale it'll look fuzzy, which is the opposite of the "expensive" tell. For a serious site we want an SVG redraw of the mark, or at minimum tight transparent crops. Worth knowing that's real work sitting between here and a polished hero.

## What I need from you

1. **Domain fork** — (a) or (b) above?
2. **Ambition call** — confirm we target best-static-L1 now and file motion as the gap, rather than chasing sycamore-class with a vocabulary that can't reach it.
3. **Positioning content** — DOC-9 §Open says the founder-facing tagline is still open and explicitly needs a dedicated generation pass. The hero line is the single highest-leverage element on the page. Do you want to settle that first, or should I build with the internal line ("the guarantees without the reviewer") as placeholder and we replace it?
4. **Logo** — do you want an SVG redraw, or shall I work with a cleaned raster crop for this probe?

I haven't touched any files or created tickets — this is all still design discussion under REQ-95.

<!-- xgd-turn id="4d4a26cf-6843-4880-a7e3-d1183439d5a8-user" -->

<!-- xgd-chat role="user" ts="2026-07-25T23:08:20.952156+00:00" -->
#### You
It turns out the xgd.dev is available to my surprise. 1stcontact definitely needs it own site. I'm not sure xgd is our flagship seems like it should also have its own site...keep consideration are SEO and findability. Honestly the gendev labs brand I'm not super attached to...

<!-- xgd-turn id="4d4a26cf-6843-4880-a7e3-d1183439d5a8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-25T23:10:30.982374+00:00" -->
#### Claude
Two things I should check rather than assert — whether "XGD" has a search collision, and actual domain state.

My grep heuristic is unreliable for `.dev`/`.ai` — let me look at the actual records.

Both checks changed the picture. `whois xgd.dev` returns only the IANA record for the `.dev` TLD itself — no registration — so it's genuinely available. `gendevlabs.ai` is yours (Cloudflare, created 2026-03-03).

## The SEO consideration is a red herring — here's why

I checked both terms you'd need to own, and neither is winnable:

**"XGD" is a contested acronym.** It's the ticker for the iShares S&P/TSX Global Gold Index ETF, plus "eXtreme Game Development" and others. An actively-traded fund generates fresh financial pages daily — you will never outrank it for "XGD."

**"Generative development" is worse, and this is the non-obvious one.** DOC-4 claims to coin it, but Google already maps that phrase to "Generative AI for Software Development" — a category saturated by Coursera, DeepLearning.AI, Udemy, Springer, ScienceDirect. You're not coining into blank space; you're coining a near-collision with a very crowded one. That's the hardest possible term to own.

What's actually ownable — "Extreme Generative Development" (exact), "the Software Artificer", "Capability Matrix" — has essentially zero search volume by construction. Nobody searches for a term they haven't heard.

**So: organic search is not your acquisition channel at launch, and shouldn't drive this decision.** DOC-7 already knows this — its workstreams are content cross-posting, conference talks, the showcase project, and SEM. Those are referral, social, and direct channels. People will discover you from a whitepaper, a talk, or a link, then navigate directly. Organic compounds later as a byproduct.

That reframes the domain question entirely: **optimize for recall, credibility, and typeability — not findability.**

## Recommendation: house of brands

**1. Register xgd.dev today.** Independent of everything else. A three-letter `.dev` will not stay available, it's a few dollars, and `.dev` signals the technical audience precisely as DOC-9 §5 demands. The ETF collision is irrelevant once discovery isn't search-driven.

**2. XGD gets its own site at xgd.dev — and the blog and whitepapers live there.** This is the one place authority genuinely compounds, so don't split it across domains. Keep the whitepapers bylined "Martin Westhead · GenDev Labs" — a lab byline is the right register for research, where "Martin Westhead · XGD" reads as vendor content. You get credibility and compounding at once.

**3. 1st Contact gets its own brand and domain.** The decisive argument isn't SEO, it's audience: XGD sells to technical founders who make architecture decisions; 1st Contact sells to small business owners who want a website. Zero overlap in keywords, backlink sources, or register. A shared domain would give you no compounding and force one site to speak in two incompatible voices. Heads-up: `1stcontact.com` and `1stcontact.ai` are both already registered by others — naming work is needed there, but it's not urgent.

**4. GenDev Labs: keep it, demote it, don't build it.** Since you're not attached to it, the cheapest correct answer is to keep it as the legal entity and the whitepaper byline, and redirect gendevlabs.ai → xgd.dev. It costs nothing and preserves optionality. A parent brand earns its keep when you fundraise, hire at scale, or sell to enterprise — none of which is now. Don't spend design effort on it.

This also resolves your "multiple brands, keep it simple" worry in the strongest way: **you don't have multiple brands to manage right now.** You have one product to launch, with one identity and one site.

## What this changes for REQ-95

The probe target becomes **xgd.dev** — a single-brand XGD product site — rather than a corporate page. That's strictly better for testing L1: real positioning content (DOC-9), a real visual identity (your logo set), and a real conversion goal (beta waitlist, DOC-7 bucket 1). The storage dir should be renamed `storage/sites/gendevlabs` → `storage/sites/xgd`, which I'll fold into the ticket when we start building.

My earlier questions still stand — the static-vs-motion ambition call and the SVG logo redraw — but the tagline question just got sharper: with search irrelevant, the hero line carries the entire first impression. That's worth the dedicated generation pass DOC-9 §Open asks for, and I'd do it before building rather than after.

Want me to register-check any alternative names for 1st Contact while we're here, or shall we go straight at the XGD site?

Sources: [XGD - AcronymFinder](https://www.acronymfinder.com/XGD.html), [What does XGD stand for?](https://www.abbreviations.com/XGD), [Generative AI for Software Development - DeepLearning.AI](https://www.deeplearning.ai/specializations/generative-ai-for-software-development), [Generative AI for Software Development: A Survey - Springer](https://link.springer.com/chapter/10.1007/978-981-96-7238-7_17), [Future of software development with generative AI - Springer](https://link.springer.com/article/10.1007/s10515-024-00426-z)

<!-- xgd-turn id="e2eb5b71-77d4-420b-bdd0-3ef60c9c5ebd-user" -->

<!-- xgd-chat role="user" ts="2026-07-25T23:19:23.335842+00:00" -->
#### You
ok we own xgd.dev lets talk about the website.

I want a site like gigabyte alchemy to begin with. 

Join our mailing list, contact us and the whitepapers available behind an email capture that send out links to the pdfs.

This site will grow:
Blog
Customer portal - manage subscription payment - interface with support tickets
Events calendar?

The most important part is the landing page and hero segment - we need to find the words to tell the story of the tool - that doesn't have to be perfect today.

lets talk about motion for a second. My expectation is that motion would be acheived through one or more capability modules not that it would be part of the core language itself but we can absolutely talk about that?

<!-- xgd-turn id="4e42d1d2-ab67-4682-a3d5-3cdf6c479819-user" -->

<!-- xgd-chat role="user" ts="2026-07-25T23:19:53.067677+00:00" -->
#### You
ok we own xgd.dev lets talk about the website.

I want a site like gigabyte alchemy to begin with but as cool as sycamore

Join our mailing list, contact us and the whitepapers available behind an email capture that send out links to the pdfs.

This site will grow: Blog Customer portal - manage subscription payment - interface with support tickets Events calendar?

The most important part is the landing page and hero segment - we need to find the words to tell the story of the tool - that doesn't have to be perfect today.

lets talk about motion for a second. My expectation is that motion would be acheived through one or more capability modules not that it would be part of the core language itself but we can absolutely talk about that?

<!-- xgd-turn id="4e42d1d2-ab67-4682-a3d5-3cdf6c479819-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-25T23:22:04.311563+00:00" -->
#### Claude
Good — let me ground the motion question in the actual architecture before I answer it, and look at what gigabytealchemy gives us as a baseline.

Checked the ground truth. gigabytealchemy is a real 175KB L1 page — 55 text, 16 box, 2 slot nodes plus modules — so the baseline you're pointing at is proven. And `contact-form` takes an `endpoint` config, which matters for your asks (more below).

## Motion: your instinct is documented — and I think it's half right

Worth saying up front: DOC-25 §1 literally lists **"scroll-animation"** among future behavior modules ("later payments, auth, email-capture, scroll-animation"). So you're not freelancing; the architecture doc agrees with you. But that's a throwaway enumeration, not a worked example — the worked examples are `carousel` and `contact-form` — and I don't think it survives the structural test.

**The test, from DOC-25 §1:** a behavior module is a vetted core + typed config + **named L1 presentation slots**, and "the module *wraps* L1; it never paints it."

Apply that to scroll-reveal. Core: an IntersectionObserver, ~15 lines. Config: distance, duration, delay, easing. Slots: **this is where it breaks.** A module wraps a subtree in a named slot. Scroll-reveal doesn't wrap anything — it modifies a node already in the tree. To stagger five hero elements you'd need five module instances, or one module with a repeated slot that flattens your hero's real structure into a list. Either way you've destroyed the layout tree to express an adjective.

That's the crux: **modules are nouns, motion is an adjective.** DOC-25's slot model is a noun model. Nobody would propose an "opacity module" — and reveal is opacity plus transform, over time. L1 already carries `opacity` and `transform` as node axes today.

Three more reasons it belongs in L1:

**1. Capture can't reach a module.** The whole loop is capture → fold → L1 → diff. Capture sees computed styles on *nodes*; fold maps node axes to L1 node axes. There is no path from "captured node property" to "wrap this in a module instance" — modules are authored, never folded. This is already biting us: animated text and lazy images come back blank in captures. If motion lives in modules, that's unfixable by construction, because the fold target has no field to write into.

**2. L1 already has the exact construct.** Geometry keyframes against viewport width with `interpolate|snap` segments; BUG-18 added scalar tracks for font-size. Motion is the identical construct keyed to a different independent variable — scroll position or time-since-enter. The shape is already in the schema.

**3. The safety argument runs backwards from intuition.** Motion-as-L1-axis compiles to a CSS transition plus one IntersectionObserver *owned by the renderer* — vetted once, zero per-site JS. Motion-as-module means shipping JS that mutates styles at runtime, per module, per site. Against DOC-24/DOC-2, the L1 route is the strictly smaller attack surface.

**Where you're right, and it matters:** stateful and scene motion — parallax rigs, scroll-scrubbed sequences, marquees, canvas/WebGL — genuinely *is* module territory. Real behavioural core, real state, genuinely wraps content. DOC-25's "scroll-animation" entry is correct, just mis-scoped. And your instinct not to bloat the core language is right, which is why the L1 addition should be tiny.

**The resolution — a three-way split, refining DOC-25 rather than contradicting it:**

| Kind | Home | Why |
|---|---|---|
| Reveal, stagger, hover | **L1 axes** | Adjective on any node; capture-able; no JS per site |
| Parallax, scrub, marquee | **Behavior module** | Real state, wraps content |
| "Restrained editorial feel" | **Prompt layer** (DOC-16) | Choreography defaults that *set* L1 axes |

And the minimum viable set for sycamore-class is genuinely small — three axes:

- `reveal: { yPx, fromOpacity, durationMs, delayMs, easing }` on any node
- `staggerMs` on a container — offsets children by index
- `hover: { yPx?, scale?, color?, opacity?, durationMs, easing }`

Per DOC-17 that's the single biggest static→alive lever, and it's an afternoon of schema plus a renderer pass, not an animation DSL.

## The gap that blocks three of your four asks

Mailing list, contact us, and whitepaper-capture-that-emails-PDFs are all the same shape: a form that POSTs somewhere and triggers an email. `contact-form` already handles the client side and takes an `endpoint` — but **there is no backend in this repo to point it at.** That's not an L1 or module problem, it's an infrastructure decision, and it's the real dependency for your launch asks.

Cheapest path that covers all three: an email platform with a hosted form endpoint (ConvertKit/Buttondown for list + automated PDF delivery, or a Cloudflare Worker plus Resend if you want to own it). The whitepaper flow specifically needs double-opt-in and a delivery automation, which is a platform feature, not something to build. Worth deciding before we build the page, because it shapes what the capture UI promises.

The portal (subscriptions, support tickets) and events calendar are much further out — bucket 3 in DOC-7, gated on licensing. Not now.

## Hero words — I'd do this next, and separately

You're right that it's the most important part and right that it needn't be perfect today. But DOC-9 §Open explicitly flags the founder-facing tagline as open and needing a dedicated divergent pass, with "the guarantees without the reviewer" already rejected as vague. With search irrelevant, the hero carries the entire first impression.

I'd suggest: let me do that generation pass as its own focused piece of work — many candidates, tested against the four hooks DOC-9 names (speed/"team of one", trust/"never afraid to change your own code", the wall, human-safely-out-of-the-loop), plus your strongest asset, the built-with-itself proof from §8. Then we build the page around the winner rather than retrofitting.

**So, three decisions for you:**
1. Motion split as above — L1 gets reveal/stagger/hover, modules get scene motion? If yes, that's a REQ ticket separate from REQ-95.
2. Email backend — pick a platform, or shall I compare two or three properly?
3. Hero words first, or scaffold the page with placeholder copy and fill it in?

<!-- xgd-turn id="c6d0781b-5762-4c7a-bf5a-56d86efc57e0-user" -->

<!-- xgd-chat role="user" ts="2026-07-25T23:30:50.097313+00:00" -->
#### You
So let me complete your picture for what we're actually doing here. Maybe you should review some of the documents in this project too. First contact is a web application for building websites collecting contact information, marketing support, customer payments and monitoring and quality checking the whole thing. So people will come to first contact to build a website that will collect email addresses and ultimately be able to invoice customers or charge them on a subscription basis for services such as plumbing. First contact obviously will have a backend it's going to be built on Cloudflare D1 a lot of that architecture is already sketched out and we have some storage ideas that have been worked on and generalized from X Jd in yet another project. So, let's not get too hung up about the backend right now I think there's a lot of work already been done a lot of things in flight. What I suggest for right now is that the form just users proudly to send me an email which is what I believe we implemented in gigabyte alchemy and we punt on the black end for now. 

I'm less interested in email storage I know how to do that I am more interested in this question of can we make L1 + Claude an effective way to build premium sites. And we're going to explore that idea by playing with the construction of a premium site xgd.dev...

Make sense?

<!-- xgd-turn id="c6d0781b-5762-4c7a-bf5a-56d86efc57e0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-25T23:32:02.845279+00:00" -->
#### Claude
Makes sense — and that's a useful correction. I was solving for launch infrastructure when the actual object of study is the authoring loop. Let me read the project docs you pointed at.

Yes, makes sense. Scope is clear: **the object of study is the authoring loop, not the launch stack.** xgd.dev is the specimen; forms are a stub; backend is somebody else's ticket. Good.

Two corrections and one real gap.

## Small factual one first

gigabytealchemy doesn't email you. Its two forms are:

- `form-0` → `action: "https://api.gigabytefoundry.ai/contact"` — an external API endpoint
- `form-1` (the email capture) → `action: ""` — **not wired to anything**

So there's no mailto pattern to copy, and if we clone it we inherit a dead capture form. For a stub that genuinely reaches you, `action` wants either a `mailto:` or a throwaway Formspree URL — a one-line config decision, no backend work. Just flagging so it doesn't silently ship broken.

## Your plan is already the documented plan — including the motion answer

DOC-16 §4 specifies this exact experiment:

> **Build order:** 1. Framework — the primitives (REQ-14 background, REQ-15 layer, **REQ-16 motion**, …). 2. **The two flagship sites** — Gen Dev Labs and 1stcontact.io — targeting **Tier-1 "expensive, template-free."** 3. The builder — later, once the framework and the design intelligence are proven.
>
> The flagship sites are the **R&D vehicle** that *generates* the design intelligence.

And sycamore.so is named in §3 as a Tier-1 comp. So "gigabytealchemy-shaped but as cool as sycamore" is the documented bar, not a stretch goal. xgd.dev simply takes flagship-#1's slot from "Gen Dev Labs" — consistent with the branding call — and §4 says that one "may flex hardest."

More usefully: **DOC-16 independently settles the motion question.** REQ-16 motion is enumerated as a *framework primitive*, in the same breath as REQ-14 background and REQ-15 layer, at build-order step 1. Not as a behavior module. So the doc that plans this experiment already put motion where I argued it goes — I hadn't seen this when I made the case, which makes it corroboration rather than me marshalling evidence. Your module instinct matches DOC-25's throwaway list; DOC-16's considered build order matches the primitive reading.

## The real gap: authoring has no gate

This is the thing worth your attention.

DOC-21's growth loop is **reproduction-driven** end to end: capture → reproduce → `1c diff` → attribute residual → grow framework. Good-Enough is defined in §4 as a vector gate at three viewports **against a reference bundle**. Every instrument we own — capture, `1c diff`, values-diff, the 3-probe gate — measures *distance from a reference*.

**xgd.dev has no reference.** It's authoring, not reproduction. So the entire evidence apparatus is unavailable, and the honest default gate becomes "Martin looks at it and says hmm." That's exactly the subjectivity DOC-16 §7 admits to and §6 wants to discipline.

I'd propose two cheap instruments to close it:

1. **Blind comparative ranking.** Render xgd.dev and 3–4 Tier-1 comps at identical viewports, strip identifying marks, and have a fresh agent rank them on the rubric without knowing which is ours. It's adversarial, repeatable, and it's the closest thing to an objective premium-ness signal we can get without a reference bundle. Re-run it each iteration; the rank is the metric.
2. **The DOC-16 §3 rubric, promoted to the gate.** It's already specified as "one artifact, two uses" — prompt guidance *and* eyes-loop acceptance criteria. It's just underdeveloped. This build is what develops it, per §5's standing lessons-capture practice into DOC-17.

## What I'd do next, and the one sequencing call

DOC-16 §4 says primitives before flagship sites. DOC-21 says grow the framework *on evidence*, at config-exhaustion. Those pull opposite ways on motion, and I'd resolve it toward DOC-21:

**Build static xgd.dev to L1-exhaustion first, and let the page prove which motion axes it actually needs.** Adding reveal/stagger/hover speculatively is me guessing; authoring until the page visibly can't get further tells us exactly which axes earn their place, with a worked example attached. Same loop, authoring instead of reproduction.

So, concretely, in order:

1. **Hero words** — the divergent pass on the tagline. Everything else composes around it, and DOC-9 §Open wants it anyway.
2. **Author static xgd.dev** to L1-exhaustion — home page only, forms stubbed to `mailto:`.
3. **Run the blind ranking** against Tier-1 comps; capture lessons into DOC-17.
4. **Add the motion axes the page demanded**, free-coded, with the page as the worked example.

That also keeps REQ-95 honest: the durable output is the L1 gap list plus the design lessons, and the site config stays the disposable prototype per DOC-21 §1.

Want me to start with the hero words pass? And shall I update REQ-95's body to reflect the xgd.dev pivot — preserving the existing content — before we start cutting anything?

<!-- xgd-turn id="1f4a0563-59f9-4f8d-9651-afb0a887e6b3-user" -->

<!-- xgd-chat role="user" ts="2026-07-25T23:38:54.522733+00:00" -->
#### You
ok interesting can we add some basic tests to the repertoire too. Some of the site reproductions that we have been going through will produce things that look really nasty. Text overwriting of the text strange alignments. I'm not sure how much of this can be made into automated checks and there are artistic reasons why we might want to overlay some text on top of another in very special circumstances but having a "dumb" mechanical system that can identify when there are page oddities would be useful - so please add that to the list of "tools to build"

Let do it - start with words

<!-- xgd-turn id="1f4a0563-59f9-4f8d-9651-afb0a887e6b3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-25T23:41:12.483515+00:00" -->
#### Claude
`--append-body` preserves the existing body. Let me record the pivot and the tools list.

Recorded in REQ-95 — the xgd.dev pivot, the motion resolution, and a "Tools to build" section with your page-oddity linter as item 1 (scoped as *advisory with per-node suppression*, since you're right that deliberate overlay is legitimate art direction — a hard gate would be wrong).

Now, words.

## First, what territory is actually ownable

I generated across all four hooks DOC-9 §Open names, then killed on differentiation — and that test is brutal:

**Dead on arrival — speed/velocity.** "Team of one," "move fast without breaking things," "ship 10× faster." Cursor, Devin, Replit, Lovable all say versions of this. DOC-9 lists speed as a hook, but as a *hero* it's indistinguishable from the field. It belongs further down the page.

**Dead — the category line.** "A governor for generative development," "reconciles software to declared behavior." Correct and defensible, but that's §7's left-hand column — visionaries and press. Wrong register for a hero.

**Alive, and only we can say it:** the fear of your own codebase, and the built-with-itself proof. Nobody else can claim either, because nobody else is making the claim.

## The candidates

**Angle: the fear (trust hook)** — the sharpest emotional territory
1. Never be afraid of your own codebase.
2. Change anything. Break nothing.
3. Code you didn't write. Confidence you didn't lose.
4. You've never read this code. Change it anyway.

**Angle: out of the loop (the core message, direct)**
5. Ship code you'll never read.
6. Out of the loop. Still in control.
7. Stop reviewing diffs. Start shipping software.
8. The last diff you'll ever review.
9. You stopped reading the code. You never stopped being the engineer.

**Angle: the proof (§8)**
10. We haven't read our own source in nine months.
11. We've never read our own source code. Neither will you.
12. Built by XGD. Never read by us.

**Angle: the wall (problem-first)**
13. Every AI project hits the wall.
14. Your AI didn't slow down. Your codebase did.
15. The AI keeps writing. Your project keeps working.

#14 is the best of the wall group — it reframes the pain as *not your AI's fault*, which is both true per DOC-4 §3 and flattering to the reader.

## One structural point before the blocks

DOC-9 §5 requires the hero to do **two jobs at once: attract technical builders and repel magic-wand seekers.** Most heroes only do the first. "Ship code you'll never read" is the strongest line in the set and also the most dangerous — read alone, it's a no-code promise. So the qualifier can't be buried on an About page; it has to be *in the hero block*. That's a real design constraint, and it's why each block below carries an explicit ownership line.

## Three complete blocks

**Block A — the fear**

> **Never be afraid of your own codebase.**
>
> XGD keeps an explicit, verified record of what your software is supposed to do — and checks it on every change. Let AI write all of it. Know that nothing broke.
>
> `[Join the beta waitlist]` `[Read the whitepaper]`
>
> *You still own the architecture. You just stop reading the diffs.*

**Block B — the direct claim** *(sharpened from §7's own example line)*

> **Ship code you'll never read.**
> **Never wonder if it still works.**
>
> Vibe coding got you out of the loop and lost the guarantees. XGD automates the governance that puts them back — behavioral specs, regression detection, and a fix loop that runs without you.
>
> `[Join the beta waitlist]` `[Read the whitepaper]`
>
> *For engineers who'd rather own architecture than review diffs.*

**Block C — the proof**

> **We haven't read our own source code in nine months.**
>
> XGD wrote it. XGD verifies it. Every change is checked against an explicit record of intended behavior — so the human sets intent, owns architecture, and never reviews a diff.
>
> `[Join the beta waitlist]` `[Read the whitepaper]`
>
> *Nine months. Built entirely with itself.*

## My recommendation: B

It carries both halves of the core message in two beats — "never read" (out of the loop) and "never wonder" (safely) — which is precisely what "the guarantees without the reviewer" was trying to say before it died of vagueness. The parallel construction gives it the punch that line lacked, and the qualifier line does the repelling work §5 demands.

**A is the runner-up and the better *ad*** — it leads with felt pain rather than a claim, which converts better cold. Worth keeping for SEM later.

**C is the most arresting thing you can say**, but it's about us, not the reader. I'd use it as the section immediately below the hero, where it lands as proof rather than as a boast — which is exactly the job §8 gives it.

That gives a natural page opening: **B as hero → C as the proof section → the wall (#14) as the problem section → mechanism → beta CTA.**

Two things worth flagging: these are drafts against DOC-9's constraints, not a finished brand voice — the real test is seeing them set in the actual type at actual size, which is the next step anyway. And if you want, I can run a divergent pass on the *subheads* specifically once you pick an H1, since that's where the qualify-in/qualify-out work actually happens.

Which direction do you want to build the page around?

<!-- xgd-turn id="889394e1-3c7f-4ec6-91aa-8425bd6c893c-user" -->

<!-- xgd-chat role="user" ts="2026-07-25T23:48:20.302139+00:00" -->
#### You
OK so I don't like A - the tagline says nothing about generative development. Of course people are afraid of their own code bases no more codes are afraid of their own code bases. That's not really the problem we solve.

I think B is getting closer but there is a danger that it sounds negligent. The statement we're trying to make is that we can make it safe to ship code that nobody ever reads.

Ship software you can trust but never have to read <-- closer but not quite...

<!-- xgd-turn id="12a7a251-2228-478c-9bd5-eed594f3f5f2-user" -->

<!-- xgd-chat role="user" ts="2026-07-25T23:49:41.978246+00:00" -->
#### You
OK so I don't like A - the tagline says nothing about generative development. Of course people are afraid of their own code bases no more codes are afraid of their own code bases. That's not really the problem we solve.

I think B is getting closer but there is a danger that it sounds negligent. The statement we're trying to make is that we can make it safe to ship code that nobody ever reads.

Ship software you can trust but never have to read <-- closer but not quite...

Oh and C sounds a bit wreckless - if you haven't even read the code, how can I trust it enough to use it?

<!-- xgd-turn id="12a7a251-2228-478c-9bd5-eed594f3f5f2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-25T23:50:55.364678+00:00" -->
#### Claude
Your three critiques are all correct, and C's is the one I should have caught — the proof *undermines* itself in hero position. It only reads as evidence *after* the mechanism is understood; before that, it reads as "the vendor doesn't know what's in their own product."

## Why your line isn't quite there

> Ship software you can trust but never have to read.

It's the **"but."** That's a concessive — it frames not-reading as a liability being excused, so the sentence is quietly apologetic. It concedes that reading is the proper duty and asks for a pass. Same with "have to," which is obligation-framing: reading is the default, we're waiving it.

And that's the general diagnosis of why B sounded negligent too:

> **Foregrounding an absence always reads as carelessness.** "Never read," "no review," "without looking" — these lead with a thing that isn't there. Lead with the thing that *is* there — proof, evidence, verification — and the absence stops being a caveat and becomes a consequence.

That's the fix. The guarantee should be the subject of the sentence, not the exemption.

## Candidates built on the presence

**Family 1 — proof replaces review** *(names generative development explicitly)*

1. **AI writes it. XGD proves it works.**
2. AI writes it. XGD proves it.
3. Let the AI write it. XGD proves it works.
4. Written by AI. Proven by XGD.

**Family 2 — the review moved up, it didn't vanish** *(this is DOC-9 §4's own honesty, and it's the most direct answer to "negligent")*

5. **Review what it does, not how it's written.**
6. You still review everything. Just not the code.
7. Stop reviewing code. Start reviewing behavior.

**Family 3 — knowing, not trusting** *("know" defeats negligence; "trust" is vague and every vendor claims it)*

8. **Know what your software does — without reading a line.**
9. Know it works. Not because you read it.
10. Evidence, not faith.

**Family 4 — the compiler claim, made sharp**

11. Source code is the new assembly.

## Two full blocks

**Block D — mechanism-forward**

> **AI writes it. XGD proves it works.**
>
> A behavioral spec that can't drift, verified on every change, with regressions caught and fixed inside the loop. You set intent and own the architecture. You never read the diff.
>
> `[Join the beta waitlist]` `[Read the whitepaper]`

**Block E — altitude-forward**

> **Review what it does, not how it's written.**
>
> XGD keeps an explicit record of what your software is supposed to do and verifies it continuously against the running system. The review didn't disappear — it moved up a level. You still own intent, architecture, and quality.
>
> `[Join the beta waitlist]` `[Read the whitepaper]`

## My pick: D, with E's line as the section directly beneath it

**"AI writes it. XGD proves it works."** does the most work in the fewest words:

- **It's unmistakably about generative development** — your objection to A. "AI writes it" plants the category in three words.
- **It cannot sound negligent**, because the second beat is a positive claim about verification. There's no absence anywhere in the sentence.
- **Two beats, perfect parallel, six words.** It has the punch "the guarantees without the reviewer" was missing.
- **It names XGD as the actor** — the governor doing the proving. That's the category positioning arriving through the back door, in founder-facing register.
- The differentiation sits entirely in "proves," which is exactly right — every competitor has the first half.

One judgment call for you: **"proves" vs "verifies."** "Proves" is bolder and better rhythm; "verifies" is more literally defensible. DOC-5 §1 argues your whole differentiator is that the answer becomes *evidence* rather than "we believe it does" — which I think earns "proves." But it's your claim to make.

Then **E's line becomes the first section below the hero**, where it disarms the negligence objection for anyone who felt it, and **C's nine-months proof drops to third** — by which point the reader has the mechanism and it lands as evidence instead of recklessness.

Want me to run subheads against D properly? That's where the qualify-in/qualify-out work from §5 actually has to happen, and the one above is a first pass rather than a considered one.

<!-- xgd-turn id="d8ff8434-4cf9-4fe4-89ed-0ac3c2b928b5-user" -->

<!-- xgd-chat role="user" ts="2026-07-26T00:16:37.193552+00:00" -->
#### You
proves is a very strong claim - it can also invoke negative connotations - formal proofs are heavyweight, appropriate only for situations where high trust is required. verifies is better but doesn't completely back us out of that. What about "ensures"?

<!-- xgd-turn id="d8ff8434-4cf9-4fe4-89ed-0ac3c2b928b5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-26T00:17:32.424064+00:00" -->
#### Claude
You're right about "proves" — formal verification is a term of art, and a technical audience will read it as a claim about model checking and correctly call BS. "Verifies" sits in the same semantic field for exactly that reason.

## But "ensures" trades one problem for another

It clears the formal-methods baggage. What it doesn't do is *say anything*. "Ensures" is the verb of compliance decks — ensures quality, ensures uptime, ensures compliance. It's a promise with no mechanism behind it, which makes it the verb-equivalent of "trust" from your earlier line: unobjectionable and unmemorable. It also softens the rhythm — "en-SURES it works" is mushier than the hard stop of "proves."

So it's safe but bland, and the second beat is exactly where the differentiation has to live.

## The real problem is the tense, not the strength

Here's what I think we both missed. "Proves it works" is a **point-in-time** claim — and point-in-time is not the value proposition. DOC-4's entire thesis is that AI-generated code works *at the task level*; the failure is cumulative, over time, as the codebase grows. Behavioral integrity erodes silently.

So a present-tense verb is understating the product *and* overclaiming the rigour simultaneously. The verb we want carries **continuity**, because that's literally what a governor does — DOC-5 §2's steam governor "monitors, compares, and continuously adjusts."

## The candidates that carry time

1. **AI writes it. XGD keeps it working.**
2. AI writes it. XGD won't let it break.
3. AI writes it. XGD holds it to spec.
4. AI writes it. XGD keeps it honest.

## My recommendation: "keeps it working"

> **AI writes it. XGD keeps it working.**

- **No formal-methods baggage** — plain English, nothing to call BS on.
- **More accurate than "proves,"** not just safer. XGD's differentiator isn't that the code is right today; it's that it's *still* right after fifty more changes. "Keeps" is the scaling wall answered in one word.
- **It's modest, and modesty is credibility** with engineers who've been oversold by every AI coding tool this year. It underclaims slightly, which is the right direction of error.
- **Rhythm survives** — two beats, parallel structure, six words, hard consonants on the stresses.
- It's the governor, stated in founder-facing register — which is what §7 asks for.

"Won't let it break" is the punchier runner-up and names the pain more directly; its only flaw is that the second beat leans on a negative. "Holds it to spec" is the most technical and qualifies in hardest per §5 — worth considering if you want the site to filter more aggressively.

Updated block:

> **AI writes it. XGD keeps it working.**
>
> An explicit record of what your software is supposed to do, checked against the running system on every change — with regressions caught and fixed inside the loop. You set intent and own the architecture. You never read the diff.
>
> `[Join the beta waitlist]` `[Read the whitepaper]`

Say the word and I'll lock the tagline into REQ-95 with the reasoning, then run the subhead pass properly — that block's second paragraph is still a first draft, and it's carrying the qualify-in/qualify-out job from §5 that the H1 deliberately doesn't.

<!-- xgd-turn id="fbdb2a13-d24a-4d8d-afc2-bcab93b6cb1b-user" -->

<!-- xgd-chat role="user" ts="2026-07-26T00:20:45.059347+00:00" -->
#### You
ok lets run with that

<!-- xgd-turn id="fbdb2a13-d24a-4d8d-afc2-bcab93b6cb1b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-26T00:22:22.869685+00:00" -->
#### Claude
Locking the tagline into REQ-95.

Tagline and the full rejection reasoning are recorded. Now the subhead pass.

## What the subhead has to do

The H1 makes a claim it doesn't back — *how* does it keep working? That's deliberate, but it means the subhead's first job is to **cash that cheque immediately**, or the modesty advantage evaporates into another vague vendor promise.

Second job is §5's double-duty: qualify in, qualify out. The best device for that is a **division-of-labour statement**, because naming what *you* own implies what you must be capable of. It attracts people who have architecture opinions and quietly repels people who don't know what that means — without a defensive "not for beginners" note.

One consistency constraint we just created: **don't use "verified" or "proves" in the subhead either.** We killed them in the H1 for formal-methods baggage; reintroducing them two lines down would undo it. Use *tested* and *checked*.

## Candidates

**S1 — mechanism + division of labour**
> What your software is supposed to do, written down and tested against the running system on every change. You own the intent and the architecture. XGD owns the implementation.

**S2 — tight**
> An explicit record of intended behavior, tested against the real system on every change. You own architecture. XGD owns implementation.

**S3 — regression-forward, names the pain**
> Every behavior your software is supposed to have, tested on every change — so regressions surface the moment they appear, not six months later. You stay the engineer; you just stop reviewing diffs.

**S4 — role-forward**
> You're still the engineer: you set intent, choose the architecture, judge the result. You're just not the reviewer. XGD keeps an explicit record of what the system must do — and holds it there.

## Recommendation: S1

> # AI writes it. XGD keeps it working.
>
> What your software is supposed to do, written down and tested against the running system on every change. You own the intent and the architecture. XGD owns the implementation.
>
> `[Join the beta waitlist]` `[Read the whitepaper]`

Why it wins:

- **"Written down and tested against the running system"** cashes the cheque in nine words, in plain English, with zero jargon and nothing to call BS on. It's also DOC-5's own framing ("an explicit record of what the software is supposed to do").
- **"You own the intent and the architecture. XGD owns the implementation."** — architecture-vs-implementation is a distinction every engineer parses instantly and most non-technical readers don't. That's §5's qualify-in and qualify-out in eleven words, doing it by *attraction* rather than exclusion. It also encodes §6 (what the human still owns) directly.
- "Implementation" over "code" deliberately — "XGD owns the code" carries a faint IP/licensing reading you don't want near a signup button.

S3 is the strongest runner-up because "not six months later" is the most vivid thing in the set, and it names the scaling wall concretely. It's ~33 words, which is long for a hero — but it would make an excellent **section-4 lead** where the wall gets its own space.

**One thing I'd deliberately leave out:** a proof microline under the CTAs ("nine months, zero lines reviewed"). It's tempting now that the mechanism is stated, but the proof gets its own section, and premium heroes are almost always emptier than you expect. Keeping it clean.

**One thing I'd add elsewhere:** an explicit "who this is for" section further down. §5's repulsion mandate is real, but a hero is the wrong place to do it bluntly — implicit filtering there, explicit filtering below the fold.

If S1 works for you, I'll record it and start authoring the page — structure first on the authoring face, per AC2, with this hero as the first block. That's when we start learning what L1 actually can't do, which is deliverable 2.

<!-- xgd-turn id="5761c929-19c2-4df0-a1da-17598a21d4c7-user" -->

<!-- xgd-chat role="user" ts="2026-07-26T00:25:12.902292+00:00" -->
#### You
The first phrase that, what your software is supposed to do is a little clumsy though. You have to get past that to understand what we're trying to say it sounds like we're headed for a question that doesn't arrive

<!-- xgd-turn id="5761c929-19c2-4df0-a1da-17598a21d4c7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-26T00:25:56.637836+00:00" -->
#### Claude
Precise diagnosis. "What your software is supposed to do…" opens a free relative clause, and English readers expect a finite verb to close it — *"What your software is supposed to do **is** …"*. Instead they hit "written down," a participle, so the sentence has to be re-parsed. That's the garden path you're feeling.

Same trap with "How your software should behave…" — any wh-word opening does it. The fix is to open on a plain noun phrase.

## Fixed candidates

**T1** — minimal edit, keeps S1's rhythm
> Your software's intended behavior, written down and tested against the running system on every change.

**T2** — lead with the artifact
> An explicit record of how your software should behave, tested against the running system on every change.

**T3** — fully active, XGD as agent
> XGD writes down what your software must do, then tests it against the running system on every change.

**T4** — plainest, shortest
> Every behavior it's meant to have, written down and tested on every change.

## Recommendation: T1, with one adjustment below it

> # AI writes it. XGD keeps it working.
>
> Your software's intended behavior, written down and tested against the running system on every change. You own that intent and the architecture. XGD owns the implementation.
>
> `[Join the beta waitlist]` `[Read the whitepaper]`

Two things that changed:

- **"Your software's intended behavior"** is a plain noun-phrase subject, so the participles that follow read as a reduced relative — no re-parse. It's also DOC-4/DOC-5's own term of art, which keeps the site and the whitepapers speaking the same language.
- **"You own *that* intent"** — I'd originally written "the intent," which collided with "intended" in the preceding sentence. The demonstrative turns that collision into a deliberate link: sentence one introduces the intended behavior, sentence two hands ownership of it to the reader. It now reads as a chain rather than a repetition.

T3 is the runner-up and the most immediately legible — fully active, zero ambiguity. Its only cost is that it makes XGD the subject twice in three sentences, which slightly flattens the "You own… XGD owns…" turn that's doing the §5 work.

If T1 lands, I'll record the hero block in REQ-95 and start authoring — structure first on the authoring face per AC2, hero as the first block. That's where we start finding out what L1 genuinely can't express.

<!-- xgd-turn id="8d91f843-8c56-4766-b50c-98eeff9798e0-user" -->

<!-- xgd-chat role="user" ts="2026-07-26T00:29:32.258986+00:00" -->
#### You
It's good I want to make it a little more active. So "Your software's intended behavior, written down and tested against the running system on every change." <-- who does the writing? More importantly the key here is that this representation of intended behave is constantly maintained automatically that's the concept that we need to communicate

<!-- xgd-turn id="8d91f843-8c56-4766-b50c-98eeff9798e0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-26T00:30:27.673264+00:00" -->
#### Claude
That's the sharper point — and it exposes a real flaw in the current line. "Written down" makes the reader assume *they* write it, which lands as **homework**: another spec document to maintain. That's a negative, and it's precisely the thing DOC-5 §2.1 defines XGD against:

> A specification document diverges from the code silently over time. The Capability Matrix cannot diverge silently… The behavioral claims are operationally grounded, **not maintained by discipline**.

So the answer to "who does the writing?" isn't just "XGD" — it's **"nobody, and that's the point."** The record maintains itself.

## Candidates

**V1 — agent-forward** (most active, as you asked)
> XGD maintains a living spec of your software's intended behavior and tests the running system against it on every change.

**V2 — automaticity explicit**
> A living spec of your software's intended behavior — maintained automatically, tested against the running system on every change.

**V3 — the consequence, not the mechanism**
> XGD keeps a spec of your software's intended behavior that can't go stale, and tests the running system against it on every change.

**V4 — names the pain it removes**
> XGD maintains a living spec of your software's intended behavior — no document to keep current by hand — and tests the running system against it on every change.

## Recommendation: V1

> # AI writes it. XGD keeps it working.
>
> XGD maintains a living spec of your software's intended behavior and tests the running system against it on every change. You own that intent and the architecture; XGD owns the implementation.
>
> `[Join the beta waitlist]` `[Read the whitepaper]`

**"XGD maintains"** answers your question directly and does it by grammar rather than adverb — if XGD is the subject of *maintains*, the reader already knows they aren't. **"Living spec"** carries the constant-currency idea in one word, and it's doing real work: it pre-empts the "oh, more documentation" reaction that "written down" triggered.

I've also switched the last two sentences to a semicolon, so the §5 division-of-labour lands as one balanced turn rather than two clipped statements.

**The one trade worth your call:** V1 conveys automaticity *implicitly*, through agency. You said this is the concept that most needs communicating — if you want it unmissable, **V3** is the strongest way to do it, because "can't go stale" states the consequence engineers actually care about. Every engineer has watched a spec rot; "this one can't" is an immediately meaningful claim, and it's DOC-5's own argument compressed to four words.

My honest read: **V1 for the hero, and the stale-spec contrast gets its own section below** — it's too good an argument to spend as a subordinate clause, and it's the natural lead for the mechanism section. But if you'd rather it be unmissable at first contact, V3 is the right call and I'd take it.

<!-- xgd-turn id="022bf223-3ce6-4d9f-9f96-77067f6d4e21-user" -->

<!-- xgd-chat role="user" ts="2026-07-26T00:31:52.522252+00:00" -->
#### You
Its good lets keep going

<!-- xgd-turn id="022bf223-3ce6-4d9f-9f96-77067f6d4e21-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-26T00:37:40.728020+00:00" -->
#### Claude
Already seeing something notable: `l1TextSchema` has no `sizing` field, unlike box/image/container. Let me check the text axes and the document root.

Setting up the site and checking what fonts are actually available to serve.

Now authoring. Using the authoring face per AC2 — flow containers with `sizing`/`distribution`/`align`, no geometry keyframes.

Structure works. Let me check mobile before assessing.

Mobile works — type scaled via the responsive tracks, nav links hid, no overflow. One real defect though: the CTA labels wrap to two lines. And the contrast hierarchy is inverted — the *payoff* line is the dimmest thing on the page. Let me fix that.

Much stronger — and semantically right: the commodity half recedes, the differentiator carries the weight. Let me record the findings.

Hero is live and rendering at all four widths. Both screenshots are above.

## The headline result: the authoring face works

**AC2 is satisfied for this section — zero geometry keyframes.** The entire hero is flow containers. Specifically:

- `sizing: {mode: 'fluid', maxPx: 1200}` + parent `align: 'center'` gives a proper centred column
- `distribution: 'between'`, `align`, `gapPx`, `layout: stack|row` all behave
- **`responsive` scalar tracks are the standout** — type scales fluidly from 38px to 78px across the ladder with no hand-authored media queries. Mobile just works.
- `visibility.fromPx` correctly drops the nav links below 768

That's a genuinely positive answer to the probe's first question. The authoring face isn't vapour.

## Six gaps found, one of them serious

Recorded in REQ-95. The ones that matter:

**1. No font-acquisition path — this is the real blocker.** Every font in the repo arrived via a capture bundle. Authoring has no library, no `1c` verb to add a face, no bundled default. I fell back to `Helvetica Neue`, and that single fact is most of why the page reads *competent* rather than *premium*. On a text-driven site, type is ~80% of the impression. **We cannot hit Tier-1 without solving this**, and I didn't want to download a typeface unilaterally.

**2. Text leaves have no `sizing`.** Box, image, and container all have it; text doesn't. So a paragraph can't declare its own measure — I had to wrap the subhead in a container that exists purely to cap line length. Measure is the most basic typographic control there is.

**3. Containers can't paint; boxes can't lay out.** Containers have no `axes` (no fill/border/radius); boxes have no `layout`/`gap`/`distribution`/`align`. Anything both painted *and* internally laid out needs two nested nodes. Fine for a button — a compounding tax on the cards and panels that make up most of a marketing page below the hero.

**4. A real AC3 defect:** both CTA labels wrap to two lines at 375px. `nowrapFromPx` only forces nowrap *above* a width; there's no always-nowrap and no way to swap shorter copy at narrow widths.

Plus: no motion (as predicted), and `1c new` scaffolds no L1 skeleton.

## My read on where this leaves us

The page is structurally sound and empty. Flat black, no texture, no layer, no imagery — and the logo's warped-grid motif is sitting unused, which is the obvious candidate for hero visual interest. That emptiness plus a system font is the gap between here and sycamore-class, and neither is a *layout* problem. The authoring face handled layout fine.

**Three decisions:**

1. **Fonts.** Want me to propose two or three specific typefaces with licensing, for you to approve a download? Nothing else moves the needle as much.
2. **The gaps** — shall I file 1, 2, 3, 5 as separate tickets now? AC5 wants them filed separately, and I've held off since you asked me not to create tickets unsolicited.
3. **Next section or polish the hero?** I'd keep going down the page — sections 2–5 will stress the container/box composition tax much harder than the hero did, and that's exactly the evidence we want before deciding what L1 needs.

<!-- xgd-turn id="2c873577-167e-43b5-9b91-b4287d41241a-user" -->

<!-- xgd-chat role="user" ts="2026-07-26T00:49:03.324436+00:00" -->
#### You
Let's talk about font licensing for a second, I know very little about it. Can we incredibly create premium sites without paying for font licensing? If we were to pay for font licensing who would pay would it be first contact or would it be the customer building the site? Is all of this sufficiently standard that we could offer a menu of fonts for people to license if they choose.? Are there sufficient free fonts that this is unnecessary for a V1

<!-- xgd-turn id="2c873577-167e-43b5-9b91-b4287d41241a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-26T00:50:48.130576+00:00" -->
#### Claude
Good question to ask before spending money — and the answer for a *builder* product is structurally different from the answer for one site. Let me check the parts I shouldn't assert from memory.

Researched it. The answer splits cleanly: for **xgd.dev** it's easy, for **1st Contact as a builder** it's structurally different — and that difference is the important part.

## 1. Can you build premium without paying? Yes, decisively

The "premium = paid font" equation broke years ago. The libre corpus now includes genuinely first-rate faces, and several are purpose-built for exactly your technical-premium register:

- **Geist / Geist Mono** (OFL, Vercel) — designed for this exact tone, sans + mono as one system
- **Inter / Inter Display** (OFL) — the default of premium SaaS; extremely refined
- **Satoshi, General Sans, Switzer** (Fontshare) — geometric with humanist warmth
- **IBM Plex Sans/Mono/Serif**, **JetBrains Mono**, **Space Grotesk** (OFL) — technical registers
- **Instrument Serif, Fraunces, Newsreader** (OFL) — if you ever want a serif voice

What actually separates premium from template isn't the font's price — it's scale, measure, leading, and restraint. Which is precisely what L1's responsive tracks give us fine control over.

**The honest caveat:** paid foundry faces (Klim, Grilli Type, Dinamo, Pangram Pangram) buy *distinctiveness*, not quality. If everyone ships Inter, you look like everyone. That's a real cost for a brand — but it's a differentiation argument, not a "can we look good" argument.

## 2. Who pays? Neither — and it *can't* be 1st Contact

This is the structural finding. Commercial webfont licenses are granted per-licensee, typically **per-domain or by pageview**, and agencies and hosting providers are explicitly **not permitted to share one license across client sites**. So "1st Contact buys a license and serves it on 10,000 customer sites" is a breach of essentially every commercial EULA. Adobe Fonts additionally forbids self-hosting *and* uploading to a website design platform outright — so that whole route is closed to you twice over.

Three legitimate models:

| Model | Who pays | Verdict |
|---|---|---|
| **Free-only default** | Nobody | **V1.** Zero exposure, self-hostable |
| **Customer brings own license** | Customer | Long-tail answer; customer uploads and attests, liability sits with them |
| **Platform / OEM license** | 1st Contact | Real but bespoke — negotiated per foundry, priced per-site or rev-share. What Wix/Squarespace do. Not V1 |

One more architectural constraint worth knowing now: serving fonts from a **public CDN without access controls counts as redistribution beyond licensed scope** — a licensed font needs an origin-scoped endpoint. Free fonts sidestep that entirely, which matters for your Cloudflare architecture and for the DOC-24/DOC-2 security envelope: a self-hosted OFL file is a static asset you control, not a third-party runtime dependency.

## 3. A menu? Yes for free, no for paid

A curated library of ~20 OFL/FFL families is trivially shippable and is genuinely a *product* feature — curation is taste, which per DOC-16 is the moat. For paid fonts there's no standard "license through us" pipe; you'd be building a licensing marketplace, which is a business, not a feature.

## 4. Enough free fonts for V1? Comfortably

And there's a bonus argument: **using a free face on xgd.dev is itself an experiment result.** If the flagship looks premium on OFL type, that's direct evidence 1st Contact's free-only default is sufficient — dogfooding the exact constraint your customers will have.

## What I'd do for xgd.dev

xgd.dev is your own single site, so you could use anything — but I'd still go free, for the self-hosting and dogfooding reasons above.

**My pick: Satoshi (display) + JetBrains Mono (accent).** Satoshi is geometric with enough warmth to avoid coldness, and it's distinctly *not* Inter — which matters when your whole positioning is "not like the others." The mono is already in your brand (the logo's subtitle), so it should do real work, and JetBrains Mono has the typewriter character your logo uses.

**The alternative is Geist + Geist Mono** — better-matched as a system and bang-on the technical-premium tone, but strongly associated with Vercel, so you'd be borrowing someone's identity.

**Two asks:**
1. Which pairing — Satoshi/JetBrains, Geist/Geist Mono, or something else?
2. Confirm I can download the `.woff2` files into `storage/sites/xgd/draft/assets/`. Per your rules I won't fetch anything without the go-ahead.

One flag: for **xgd.dev** the Fontshare licence is a non-issue. If Satoshi later ships inside **1st Contact's** font menu, the ITF Free Font Licence is "non-transferrable and terminable" — worth a lawyer's read before you redistribute it to thousands of customer sites, even though their FAQ lists OEM use as permitted.

Sources: [Adobe Fonts webfont licensing](https://helpx.adobe.com/fonts/using/webfont-licensing.html), [Monotype webfont license](https://foundrysupport.monotype.com/hc/en-us/articles/10839926029588-Webfont-License), [Monotype font licensing guide](https://www.monotypefonts.com/pages/content/resources-font-licensing-guide), [Understanding webfont licensing — TypeTogether](https://www.type-together.com/understanding-webfont-licensing), [Fontshare FAQ](https://www.fontshare.com/faq), [ITF Free Font Licence](https://www.fontshare.com/licenses/itf-ffl)

<!-- xgd-turn id="93db12dc-0ebf-4262-8868-b1feaef69771-user" -->

<!-- xgd-chat role="user" ts="2026-07-26T00:56:57.378964+00:00" -->
#### You
Yes go ahead and download any free fonts you need

<!-- xgd-turn id="93db12dc-0ebf-4262-8868-b1feaef69771-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-26T00:59:08.528361+00:00" -->
#### Claude
All fonts down. Let me check the font-face schema fields before wiring them in.

Now wiring the fonts in.

Both faces are loading — Satoshi's geometric character and JetBrains Mono in the eyebrow. Recording the decision and the licensing findings.

Fonts are in and the difference is visible — the type has character now rather than reading as a system default.

**What I downloaded** (all self-hosted in `storage/sites/xgd/draft/assets/`):
- **Satoshi** 400/500/700/900 — Fontshare, ITF Free Font Licence
- **JetBrains Mono** 400 (latin subset) — OFL via Google Fonts

Both permit commercial use and self-hosting, and both are now bound through `l1.resources.fonts` rather than any external CDN — so the page has no third-party runtime dependency.

I went with Satoshi over Geist because Geist is strongly associated with Vercel, and borrowing a recognisable identity cuts against positioning built on not being like the others. The mono is doing real brand work since it's already in your logo's subtitle.

## The licensing answers, recorded

I put the full findings in REQ-95 because **they constrain the 1st Contact product, not just this site** — and flagged that they probably want promoting to their own doc. The three that matter:

1. **1st Contact can never buy one commercial licence and serve it across customer sites.** Licences are per-licensee, usually per-domain, and agencies/hosting providers are explicitly barred from sharing one across clients. That's not a pricing question — it's a structural bar on the whole model.
2. **V1 should be free-only**, with "customer brings their own licence" as the long-tail escape hatch and an OEM/platform deal only if a specific foundry ever justifies it.
3. **Curating the free menu is itself the product.** Per DOC-16, that curation *is* design intelligence — which makes it a moat rather than a stopgap.

And the dogfooding argument turns out to be real: if xgd.dev reads premium on OFL type, that's direct evidence the free-only default is sufficient for your customers. We're now testing 1st Contact's V1 constraint by living inside it.

## Where the gap list stands

Gap 2 is closed *for this site* — but only because I downloaded files by hand. **The product gap stands:** there's still no font-acquisition path, no library, no `1c` verb to add a face. Any other authored site falls straight back to a system stack.

Still open from pass 1: text leaves have no `sizing` (measure), containers can't paint / boxes can't lay out, CTA labels wrap at 375px, no motion, `1c new` scaffolds no L1 skeleton.

Next I'd build sections 2–5 (altitude → proof → the wall → mechanism), since that's what will really stress the container/box composition tax — the hero barely touched it. Want me to carry on down the page, or pause and file the gap tickets first?

<!-- xgd-turn id="2b563181-884b-411f-a3cd-bb3414a9662d-user" -->

<!-- xgd-chat role="user" ts="2026-07-26T01:04:43.296552+00:00" -->
#### You
lets take a moment on the gaps. I'd like to discuss to resolution and then have you create tickets against each.

I think I am comfortable with DEVELOPMENT TIME down loading of any free fonts, we need to track what we have and have a mechanism to ensure that licensing requirements are met. (E.g. Can we create a project YAML doc, for example that tracks the fonts, links to where we got them and captures any license actions we need to take)

Remind me about your other gaps?

<!-- xgd-turn id="2b563181-884b-411f-a3cd-bb3414a9662d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-26T01:06:25.993151+00:00" -->
#### Claude
Let me verify one of them before I propose a fix — I don't want to file a ticket for something already expressible.

Checked, and **gap 5 was my mistake — it isn't a gap.** Both halves are already expressible:

- `nowrapFromPx: 0` gives unconditional nowrap (`render.ts:599` — at or below the ladder floor the pin is emitted directly, not in a media query).
- Responsive copy already works via two text leaves with `visibility.fromPx` / `untilPx`.

So the wrapping CTA is an authoring bug of mine, not a framework hole. I'll just fix it. That leaves **five** real gaps.

## Gap 1 — text leaves can't declare a measure

`box`, `image`, and `container` all carry `sizing`; `text` doesn't. The asymmetry reads like an artefact of capture (folded text always got absolute geometry, so nobody needed it) rather than a decision.

**Resolution: add `sizing: l1AxisSizingSchema` to `l1TextSchema`.** It makes the leaf set uniform and the renderer already has `axisSizingCss` — it just isn't called for text. Roughly a two-line change. Keeps px units rather than introducing `ch`, consistent with L1 being px-faithful.

## Gap 2 — font acquisition + your registry idea

Your YAML instinct is right, and I'd push it one step further: make it **project-level, not per-site**, because licence obligations attach to the font, not the site — and because that file is literally the seed of 1st Contact's font menu.

```yaml
# fonts/registry.yaml
fonts:
  - family: Satoshi
    foundry: Indian Type Foundry
    source: https://www.fontshare.com/fonts/satoshi
    downloaded: 2026-07-25
    licence:
      name: ITF Free Font Licence
      url: https://www.fontshare.com/licenses/itf-ffl
      commercial_use: true
      self_host: true
      redistribute_in_product: REVIEW_REQUIRED   # ← the load-bearing field
    actions:
      - "Legal review before inclusion in the 1stcontact font menu —
         licence is non-transferrable and terminable."
    files:
      - { path: satoshi-700.woff2, weight: 700, style: normal }
```

The field that earns its keep is `redistribute_in_product`. "Can I use this on xgd.dev" and "can I ship this to 10,000 customer sites" are different questions with different answers, and the registry should force you to answer both at download time rather than discovering it later.

**The teeth:** a `1c fonts check` verb that scans every site's `l1.resources.fonts`, joins families against the registry, and fails on any family that's unregistered or has an unmet action. Without that it's documentation, and documentation drifts — which is the exact failure mode XGD exists to prevent. Files stay per-site under `draft/assets/` (sites need to be self-contained), with the registry as the provenance index.

## Gap 3 — motion

Already resolved in principle: reveal / stagger / hover as **L1 axes**; parallax and scroll-scrub as a **behavior module**. I'd file the ticket now with the candidate axis set but hold implementation until sections 2–5 are authored, per DOC-21 — let the page prove which axes it actually needs rather than guessing three.

## Gap 4 — `1c new` scaffolds no L1

It emits `{modules: []}`, so every authored site starts by hand-writing `widths`, `background`, and `root` from nothing.

**Resolution: scaffold a minimal valid L1 document by default** — not behind a flag, since L1 is now *the* way to author and a flag would be exactly the mode-detection CLAUDE.md forbids. One check needed: confirm `1c repro` overwrites rather than merges, so the skeleton can't contaminate a reproduction import.

## Gap 6 — containers can't paint, boxes can't lay out

The most interesting one. `l1ContainerNode` has no `axes`; `L1BoxNode` has no `layout`/`gapPx`/`distribution`/`align`. Anything both painted *and* internally laid out needs two nested nodes — survivable for a button, a compounding tax on the cards and panels that make up most of a page below the hero.

**Resolution: add the box paint axes to `container`.** It's purely additive, capture never populates them so fold is untouched, and it collapses the two-node tax for the common case.

**The honest caveat:** that makes `box` a strict subset of `container`, which by the project's own "ruthless refactoring" rule argues for eventually merging them into one node kind. I'm not recommending that now — it touches fold, the renderer, and both working reproductions, so the risk is real and the evidence isn't yet. Do the additive fix, and if `box` proves redundant after more authoring, the merge becomes a clean follow-up.

---

**Five tickets, then.** Shall I file them as separate REQs against the current session, or do you want any of these folded together — 2 and 4 are both "authoring ergonomics for a new site" and could reasonably be one?

<!-- xgd-turn id="2bfbe87d-a75c-49be-907e-d253726e62aa-user" -->

<!-- xgd-chat role="user" ts="2026-07-26T01:16:14.180801+00:00" -->
#### You
Yes please read REQ-96 first though it changes some aspects of modules so it might have impact on your proposals

<!-- xgd-turn id="2bfbe87d-a75c-49be-907e-d253726e62aa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-26T01:17:57.765011+00:00" -->
#### Claude
REQ-96 changes several of these materially. Let me check the L2 work that's in flight.

Read it — and it changes three of the five. It also corrects something I was about to tell you.

## REQ-96 turns two of my gaps from conveniences into contract holes

REQ-96's core move is *"L1 owns class, geometry, and every paint axis; the module ships zero CSS."* Under that rule, **any gap in L1's vocabulary stops being an authoring annoyance and becomes a hole in the contract** — because whatever L1 can't express, the module must paint, which is exactly what the ticket sets out to make impossible.

So Gap 1 and Gap 6 are now load-bearing for REQ-96, not just for my hero.

## Gap 6 needs reframing

I proposed "add paint axes to `container`." That's too narrow now. REQ-96 introduces a **sixth node kind** (`control`) that also needs class + geometry + paint axes. The current state is arbitrary: `box`/`image`/`text` have axes, `container`/`slot` don't, `control` will need them.

**Revised proposal: make surface/paint axes a shared, uniform capability across every node kind that renders a box** — rather than bolting them onto one kind at a time, which is precisely how today's asymmetry arose. That also means this work should be **sequenced with or folded into REQ-96**, since both restructure `l1/schema.ts` and would otherwise collide.

## A correction before you act on it

I was going to tell you REQ-96 breaks focus rings by deleting module CSS. **I checked, and that's wrong** — there's no `outline: none` anywhere in the framework, so the UA default focus ring survives. No accessibility regression.

The real finding is narrower but still worth a ticket: **L1 has no way to author a hover or focus state at all.** So once modules stop painting, a Tier-1 form gets the *browser default* focus ring and no hover feedback. That's a quality ceiling REQ-96's scope doesn't mention, and it's the same missing axis family as hover — so it folds into the motion work rather than standing alone.

## Motion: L2 is a better home than I said

I read `packages/framework/src/l2/contact-form.ts` — L2 presets are **parameterised L1 subtrees** you drop into a slot, with a few design constants as options. That's a better home for motion *choreography* than the prompt layer I proposed earlier: once motion is an L1 axis, a "restrained editorial reveal" preset composes for free, as ordinary L1. The prompt layer then chooses among presets rather than emitting axis values directly.

## One stale instruction to flag

`CLAUDE.md` tells us to close capability gaps by *"adding a dial / variant to that behavior module (e.g. a new `carousel` view mode)."* REQ-96 names `config.view` as **the** worked example of the violation to be deleted — an aesthetic dial wearing behavioural clothes. The project instructions and the design have drifted apart on exactly that sentence. Worth fixing, since it will keep misdirecting future sessions.

## Proposed ticket set — six, not five

| | Ticket | Depends on |
|---|---|---|
| **T1** | `l1TextSchema` gains `sizing` (measure) | — |
| **T2** | Uniform surface/paint axes across all node kinds | **REQ-96** (coordinate or fold in) |
| **T3a** | Interaction-state axes: `hover`, `focus` | REQ-96 (quality story) |
| **T3b** | Scroll-motion axes: `reveal`, `staggerMs` | Held for evidence from §2–5 |
| **T4** | Font registry YAML + `1c fonts check` | — |
| **T5** | `1c new` scaffolds a minimal L1 document | — |

On your folding question: I'd **keep T4 and T5 separate**. T4 is a compliance artifact with an enforcement command and real legal consequences; T5 is a one-function change to a scaffolder. Different risk, different review.

I'd also add a line to the page-oddity linter's eventual ticket: it must exclude **module-invariant elements** (honeypot, hidden labels, Turnstile mounts), for the same reason REQ-96 gives for `values-diff` — those 15 repro-only objects that slid the pairing and made all 26 deltas unreadable.

Shall I file all six? And do you want T2 filed standalone with a dependency note, or folded into REQ-96's scope directly?

<!-- xgd-turn id="6074671a-f047-4980-b3bf-3e34ffe6bd26-user" -->

<!-- xgd-chat role="user" ts="2026-07-26T01:24:47.538283+00:00" -->
#### You
Good - please create the tickets

<!-- xgd-turn id="6074671a-f047-4980-b3bf-3e34ffe6bd26-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-26T01:28:56.563898+00:00" -->
#### Claude
Filing all six.

All six filed. Cross-referencing them into REQ-95 (AC5) and fixing the CTA wrap, which was my authoring bug.

The nowrap fix worked but exposed a different defect — the row now **overflows** at 375px rather than wrapping. And that's a genuine gap: `L1ContainerNode` has `layout`/`gapPx`/`columns`/`distribution`/`align` but **no `wrap`**. A row container cannot wrap.

Mobile is clean now — full-width stacked buttons, no overflow. Recording the new finding.

All six tickets are filed and cross-referenced into REQ-95.

| Ticket | Gap | Note |
|---|---|---|
| **REQ-97** | text leaves can't declare a measure | independent, small |
| **REQ-98** | paint axes arbitrary across node kinds | ⚠️ collides with REQ-96 in `schema.ts` |
| **REQ-99** | no hover/focus vocabulary | REQ-96 quality story |
| **REQ-100** | no scroll-reveal/stagger | evidence-gated — held until §2–5 |
| **REQ-101** | no font provenance or acquisition path | high priority |
| **REQ-102** | `1c new` scaffolds no L1 | low |

I wrote REQ-98 with an explicit "land with or after REQ-96, do not run in parallel" warning rather than folding it into REQ-96's scope — that seemed safer than editing a ticket someone else may be working from. Say the word if you'd rather it merge.

## Two things to flag

**Gap 5 is withdrawn — it was my error.** `nowrapFromPx: 0` already gives unconditional nowrap, and `visibility.fromPx`/`untilPx` already allow responsive copy. I recorded the lesson in REQ-95: a missing *usage* is indistinguishable from a missing *capability* from the outside, so check for an existing mechanism before minting an axis.

**But fixing it surfaced a real Gap 7.** Applying `nowrapFromPx: 0` removed the wrap and produced horizontal *overflow* instead — and `L1ContainerNode` has no `wrap` field. A row is unconditionally single-line, and `layout` isn't responsive either, so a container can't be a row at one width and a stack at another.

I worked around it by authoring the CTA block **twice** — a row above 520px, a full-width stack below — which renders correctly and is honestly better mobile design. But the same content now lives in two places, so any copy edit must be made twice or they diverge silently. That's the same shape as Gap 6: the axis set is *almost* sufficient, and the cost is paid in duplicated tree structure.

Candidate fixes are a `wrap: boolean` on row containers (small, additive, covers the common case) or a responsive `layout` track (more powerful, more work). **Not filed** — you asked for tickets on the six we discussed, so I've recorded it in REQ-95 and left the call to you.

## Also worth your attention

`CLAUDE.md` still advises closing capability gaps by *"adding a dial to that behavior module (e.g. a new `carousel` view mode)"* — and REQ-96 names `config.view` as precisely the violation to delete. That instruction will keep misdirecting sessions until it's corrected.

Want me to file Gap 7, fix the CLAUDE.md drift, or carry on authoring sections 2–5? My preference is sections 2–5 — REQ-100 is explicitly gated on that evidence, and the composition tax from Gaps 6 and 7 will show its real cost in the cards and panels below the hero.

<!-- xgd-turn id="2a9c62b2-5e3c-4955-aae0-1d5c393ba3c1-user" -->

<!-- xgd-chat role="user" ts="2026-07-27T19:23:28.930121+00:00" -->
#### You
Please do ahead and just update the CLAUDE.md

<!-- xgd-turn id="2a9c62b2-5e3c-4955-aae0-1d5c393ba3c1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-27T19:25:14.098411+00:00" -->
#### Claude
I'll read the exact section before editing.

REQ-96 and REQ-97 both landed today (`6634c8ddb`, `094bf9265`) — `control` nodes exist and `carousel`'s `config.view` is deleted, so the stale instruction now names a dial that no longer exists. Updating accordingly.

Done — CLAUDE.md's capability-gap section now matches REQ-96.

**Two things I found while doing it that change the picture from last session:**

REQ-96 and REQ-97 both **landed today** on `xgd-working`:
- `6634c8ddb` — `control` nodes (REQ-96, `free_coded`, 13 points)
- `094bf9265` — text runs can declare their own measure (REQ-97)

So `carousel`'s `config.view` is already deleted, and the old instruction was worse than stale — it pointed at a dial that no longer exists and was removed as *the* named violation. My gap 1 (text measure) is closed in code.

**What the section now says:**

- Behaviour gaps → a **behavioural** `config` field (endpoint, field schema, autoplay). Appearance gaps are explicitly *not* module gaps — they go to an L1 axis, a slot subtree, a `control` node, or an L2 preset.
- Added the falsifiable test: **if a proposed `config` field bottoms out in a CSS value, it's an aesthetic dial wearing behavioural clothes.** That's the rule that would have caught `config.view`, and it's checkable rather than a matter of judgment.
- Added the zero-CSS rule with the invariant-elements carve-out (honeypot, Turnstile mount, hidden labels — pinned by obligation, not taste).
- Added the two composition directions, including *why* the slot model is structurally unreachable for a void element like `<input>` — that's the non-obvious part a future session would otherwise rediscover.
- Marked `modules/dials.ts` / `text-style.ts` as legacy being dismantled, with "do not extend them". They were previously recommended.

I left the heading alone since REQ-95's body quotes it verbatim.

**Not committed** — the working tree also has untracked `storage/sites/xgd/`, and I didn't want to sweep that in or guess at how you want the site config staged. It's a docs/prompt change so it's exempt from the ticket ceremony; say the word and I'll commit it on its own.

Where next — file gap 7 (row containers can't wrap), or carry on authoring sections 2–5? REQ-98's warning about colliding with REQ-96 in `schema.ts` may also want revisiting now that REQ-96 has actually landed.

<!-- xgd-chat-end -->