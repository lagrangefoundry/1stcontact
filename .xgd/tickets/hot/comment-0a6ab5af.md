---
uid: comment-0a6ab5af
id: COMMENT-156
type: comment
title: Comment on chat CHAT-9
created_by: xgd
created_at: '2026-07-18T23:46:58.613708+00:00'
updated_at: '2026-07-18T23:50:18.384134+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-91223415
  kind: chat_transcript
---

<!-- xgd-turn id="e05618a2-add8-448d-8e22-c0d710880972-user" -->

<!-- xgd-chat role="user" ts="2026-07-18T23:46:55.197244+00:00" -->
#### You
I want to describe the Weber design tool and drill in on a couple of features and then discuss starting to build it. I have in mind a tab framework much like XGD with top level tabs. The Weber builder would require two tabs a design tab and an asset tab. Let's explore these it may be possible for us to collapse both onto one screen eventually.

The design tab would be at the top level a two pane display. On the left would be the site under construction in an iFrame with a toolbar at the top. On the right would be a chat window - to talk to an AI which could make arbitrary changes to the website.

Let's drill in on the left pane since we already understand and have components for the right.

The toolbar needs the following functions (not necessarily in this order):
1. Publish - takes the current draft of the site makes a new version builds it and puts it in place (do we have versioning documented in this project)?
2. Edit/View mode toggle - in view mode the eye frame behaves exactly like a webpage would. In edit mode we have the opportunity for the user to make changes see below.
3. Open page in a new tab - IFrames can distort content this control makes it easy for the draft version of the site to be viewed in a separate browser tab --- in previous discussions we have decided that the iFrame view should be browser-side rendered for speed of turn around - I think this is worth discussing as I'm not sure it's the right call but in any case that would be another reason for possible differences between the iFrame and a dedicated tab.

Let's talk about edit mode for a second. My idea here is that as the mouse hovers over areas of the page they would be highlighted possibly with an overlay or maybe just a border outline but something to make it clear what could be edited. Clicking on a highlighted area will open up a modal that will allow editing of that content.

The most straightforward editing would be to open a markdown editor on a text block. I text blocks have become a little more complicated as we have developed our format in capabilities so this may need to be refined a little but the basic idea is that this is not really a tool for editing formatting it is a tool for editing copy. Basic formatting could be applied. The editor could also support text-block property setting (background color, font color, size, family, weight?) for in-text changes to these the AI would need to do the work but at the text block level these would be possible

I would also like to create a very simple image editor. It should allow for basic operations such as selecting alternative images for that location, cropping the selected image, setting scaling options, adding a translucent overlay (is it called a scrim?). For situations like the faelan.com site it would be good to have image rotation, edge effects and free positioning.

We will be pulling the App shell and the 2 pane component (as well as the chat technology) from ../xgd-framework please take a look at that.

What I would like to do first is to build the web editor that I am describing.

Thoughts?

<!-- xgd-turn id="e05618a2-add8-448d-8e22-c0d710880972-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-18T23:50:18.355664+00:00" -->
#### Claude
Great topic. Let me do a bit of legwork first — you asked me to look at `../xgd-framework`, and you asked whether we have versioning documented. I have the versioning answer already from the project docs, but let me look at the framework repo concretely so I'm grounding the "what we pull" part in reality rather than guessing.

Let me look at what's actually in the framework repo's components (the app shell / 2-pane / chat) and what already exists in 1stcontact's builder-ui and control-app.

The framework has exactly what you named: `components/webui/{shell,split,chat,markdown,list-detail}`. Let me look at their shapes and at what already exists in 1stcontact's `builder-ui` / `control-app`.

This is a great slice to start with. I looked at both repos so I'm grounding this in what actually exists rather than the docs alone. Let me answer your two direct questions, then flag three decisions that matter, then propose where to start.

## Your two questions

**1. Do we have versioning documented?** Yes — fully, in **DOC-12 (Site Storage, Versioning & Rendering Model)**. It's forward-only and already maps onto your Publish button:

- `draft/` (mutable working copy) → `revisions/NNNN/` (immutable complete snapshots) → `history.json` (append-only log, no head pointer — live = latest).
- `1c publish` already *is* your Publish button: it snapshots `draft/` into the next revision, diffs it, appends to history, **and renders** to `storage/dist/<slug>/published/`. `1c render` renders `draft/` → `storage/dist/<slug>/draft/` (the private preview your iframe shows).
- Rollback isn't a separate command — it's `1c checkout <old>` + `1c publish`.

So Publish is a thin call over machinery that already has a spec. Good.

**2. The framework components — confirmed, and they're better than I expected.** `../xgd-framework` gives us, as **vanilla ES modules, zero deps, no build step**:
- `@gendevlabs/webui-shell` — data-driven tab bar + theming + namespaced storage + about modal. This is your top-level tab framework (Design tab / Asset tab).
- `@gendevlabs/webui-split` — the exact 2-pane you described: draggable 6px divider, collapsible pane with rail+restore chevron, layout modes, persistence, **and it nests** (a pane can host another split). Ported straight from the XGD dashboard.
- `@gendevlabs/webui-chat` + `@gendevlabs/webui-markdown` — the right pane.

That last detail drives decision #3 below.

## Three decisions worth making now

### A. Browser-side rendering — you're right to doubt it; the docs already contradict themselves

There's an unresolved contradiction in our own architecture:
- **DOC-8 §3.1** says the preview renders *in the browser* by invoking `packages/framework` as a JS module.
- **DOC-7 §2.4** (the newer decision) **explicitly withdraws** that: *"There is no client-side/in-browser renderer. The earlier commitment that 'the in-browser preview IS the production renderer' is withdrawn."* Modules are **Astro components** (DOC-7 §9.1) — Astro is build-time; it doesn't cleanly render as an in-browser JS module without either a second React reimplementation of every module (two catalogs = exactly the drift we're avoiding) or an Astro-in-browser hack.

My recommendation: **server-side render, shown in the iframe** — debounced render on edit (sites are small and static; a render is tens of ms), iframe swaps to the fresh artifact. DOC-7 is right and DOC-8 is stale here; we should reconcile DOC-8.

The nice payoff for your toolbar worry: if the iframe shows the *same server-rendered artifact* that "Open in new tab" points at, the iframe-vs-tab divergence **mostly disappears** — both are byte-identical output. The only remaining difference is iframe width/viewport, which is exactly what your viewport switcher is for. Browser-side rendering would have *created* a divergence source; server-side rendering removes it.

### B. Your edit-mode is a direct-manipulation editor — which DOC-8 currently forbids

Heads up: **DOC-8 §9** lists "Click-to-edit inline in the preview" as *"Permanently out of scope; AI-mediated only,"* plus drag-to-reorder and direct token/dial pickers. What you're describing (hover-highlight → click → edit modal, image editor) is a deliberate **change of product direction**.

I think the change is right, and the invariant it was protecting can be **fully preserved** — but only if we hold one line: **every edit the visual editor makes is a structured, validated diff — the same edit vocabulary the AI emits.** The reason click-to-edit was banned was "it undermines the structured-edit guarantee." That rationale only bites if the editor writes raw CSS/HTML. If the copy editor edits a content field, the property setter sets dials/tokens, and the image editor sets `asset-ref` + structured crop/scale/overlay/rotate — then the visual editor is just **a second front-end onto the identical structured-edit pipeline**, sitting behind the same `validate(siteDefinition, catalog)` gate as the AI. No raw-code escape hatch, invariant intact.

So: green-light direct manipulation, but we update DOC-8 §9, and we make "produces validated structured diffs, never raw code" the hard rule of the editor. The chat AI and the click-to-edit modals become peers.

**The key enabler** (and the first real framework change): the renderer must **annotate its output** — `data-module-instance-id`, `data-field`, `data-module-type` on the rendered elements — so that when you click a region in the same-origin iframe, the parent frame can map that DOM node back to the exact structured target to edit. Without those attributes there's no bridge from "pixel the user clicked" to "field to change." That's the load-bearing piece.

### C. Stack: vanilla-JS chrome, not React/shadcn

DOC-8 §9.2 assumes Astro + React islands + shadcn for the control app. But everything you're pulling from `xgd-framework` is **vanilla ES modules**, and the XGD dashboard already proves this exact stack (shell + split + chat) works for exactly this kind of tool. I'd build Weber's chrome, edit-mode overlay, and editor modals in **vanilla JS on the webui components** — zero build, matches what we import — and reserve React only if a specific editor (e.g. a full WYSIWYG text editor) genuinely needs it, mounted as an island *inside* a modal. Another DOC-8 reconciliation.

## How the editors map to structured fields

- **Copy editor (text-block):** you're right that text-blocks got richer — DOC-11 (Styled Text Content Model) is now a block-tree with inline runs, and its *intended* editor is a semantic WYSIWYG (ProseMirror/TipTap/Lexical) where the user never sees notation. For a first cut I'd honor your own framing — *"a tool for editing copy, not formatting"*: edit the run text, preserve structure/styling, expose **block-level** props (bg color, font color, size, family, weight) as structured dials/tokens. Per-run in-text restyling stays with the AI for now. That's achievable without pulling in a full rich-text engine on day one.
- **Image editor:** "select alternative image" = asset-picker → `asset-ref` (this is where the **Asset tab** plugs in — same asset store, invoked as a modal from the image editor; that's also how the two tabs eventually collapse into one screen). Crop → I'd recommend **non-destructive structured crop params** (x/y/w/h) the renderer applies, not baking a new file — matches our "structured, round-trippable" philosophy and keeps R2 clean. Scale → structured fit/scale field. Translucent overlay → **yes, "scrim" is the right word**; our capture model already treats it as first-class (`overlay {color, opacity}`, DOC-13 §4). faelan-style rotation / edge effects (circle = radius, soft = radial mask, torn = pre-torn PNG) / free positioning → all structured layout fields DOC-7 §3.2 already permits.

## Proposed first vertical slice

Build the hard new thing end-to-end, skip the platform plumbing:

1. Weber app shell (webui-shell) with **Design** + **Asset** tabs.
2. Design tab = webui-split: **iframe (primary) + chat placeholder (secondary)** with your toolbar above the iframe.
3. Iframe shows a **locally server-rendered** seed site (`1c render` → served over localhost so assets load — DOC-13 §6 notes exactly this). We have real seeds (the gigabytealchemy / faelan repro work) to edit against.
4. **Renderer annotation** (`data-instance-id` / `data-field`) — the enabler.
5. **Edit/View toggle + hover-highlight overlay + click → first editor modal** (the copy editor), writing a validated structured diff → re-render → iframe refresh.
6. Toolbar Publish stubbed to `1c publish`; "Open in new tab" → the draft render URL.

That proves click-to-edit-over-server-render (the genuinely new capability) before we touch D1, AI wiring, or Cloudflare. The image editor and chat wiring come next.

Two things before I start:

- This is a real code build, so when we begin I'll open a **scope ticket** (a `request`) for it per free-coding — CHAT-9 is our discussion home, but the editor work needs its own intent ticket. I won't create it until you're ready.
- **Where do you want to start** — the shell+split+iframe scaffold with a live server-rendered seed (steps 1–3), or do you want to nail the edit-mode overlay + renderer annotation (steps 4–5) first as the riskier proof? My instinct is 1–3 first so we have something on screen to iterate against, but I can go either way.

Does this framing match what you have in your head — especially the "visual editor = second producer of structured edits" reconciliation and dropping browser-side render?

<!-- xgd-chat-end -->