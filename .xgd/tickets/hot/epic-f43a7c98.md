---
uid: epic-f43a7c98
id: EPIC-24
type: epic
title: 'Builder sessions: what may run in parallel — scopes, a draft-edit guard, and
  concurrent delegation'
created_by: EPIC-19
created_at: '2026-10-04T00:43:37.633034+00:00'
updated_at: '2026-10-04T00:54:19.175599+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  epic_parent: epic-95bc3b15
---

## Intent

Let the consultant run builder sessions **in parallel** where that's safe, and **never** where it isn't, so long turns get shorter without builders ever overwriting each other's work. The rules about what may run concurrently are explicit, enforced by the system, and visible to the consultant. They are never left to the model's judgement on the day.

## Why

Charlie's Plumbing 2 had consultant turns of 17, 28 and 10 minutes, mostly builder sessions queued end to end. The consultant told the client *"I'll start with the first services section to set the pattern, and redo the page's opening in parallel"*, and that wasn't true. (EPIC-19, 2026-10-03.)

## Where we are today, verified

- **Nothing runs in parallel.** The framework's tool loop runs a response's tool calls strictly in order: `await executor.run(...)` inside the loop over parsed calls (`lagrange-framework/components/ai/js/src/backends/api_tools.js` ~L1149). Charlie 2's builder sessions in turn `fb07ba94` finished at 23:21, 23:22, 23:26, 23:28 and 23:29, one at a time.
- **The consultant doesn't know that.** Neither the builder-session (`Delegate`) tool's description nor the priming says whether builder sessions run in sequence or in parallel, so it assumed.
- **Draft edits have no concurrency guard at all.** `set_l1` replaces a whole element subtree from a copy the caller read earlier ("read the element first… send the whole thing back — anything you leave out is gone"). No expected version is sent, so the last write silently wins. Two builders editing overlapping subtrees would lose work with no error.
- **Every address is regenerated on each write.** `set_l1`'s own contract says *"every address on the page is regenerated. Never carry an address across your own edit."* A second builder writing the same page therefore invalidates the first builder's addresses mid-session, even when their sections don't overlap.
- **`site_revision_claims` doesn't help.** It reserves *publish* revision ids (REQ-266) and isn't involved in draft edits.

So "different sections of one page" is **not** safe today, even in principle. The only units that are plausibly independent now are **different pages**, and even they share site-level state: palette, text styles, fonts, assets, navigation, header and footer.

## What this epic has to decide and build

1. **A model of scopes.** Name what a builder session is allowed to touch: one page, one section of a page, site-level style (palette, text styles, fonts), shared components (header, footer, navigation), and assets. State which pairs of scopes can run concurrently. The starting point, to be challenged: different pages may overlap with each other, while anything site-level or shared runs alone.
2. **Each builder session declares its scope, and the system enforces it.** A session is given a scope when it starts and its write tools refuse anything outside it, with a clear refusal. This is enforced by the tools, not asked for in the brief. That also makes scope a useful guard on builders even when nothing runs in parallel.
3. **A draft-edit concurrency guard.** Writes carry the version they were read at, and a stale write is refused rather than silently winning. This is worth having even without parallelism, because the client editing in the builder and a builder session can already collide.
4. **Stable addressing, or per-section isolation,** if parallel work within one page is ever to be allowed. Addresses that get regenerated across a page make same-page concurrency unsafe by construction. This needs either addresses that survive other writes, or one owner per page at a time.
5. **Concurrent execution in the framework.** Tools declared safe to overlap (the builder-session tool) run concurrently when the model requests several in one response, up to a cap on how many at once. Overlapping scopes are refused before the work starts, not discovered afterwards. This is lagrange-framework work, filed there as a child.
6. **The consultant's manual tells the truth.** Until parallel work exists, the builder-session description says sessions run one at a time. Once it exists, it says what may overlap and why. The consultant must never again promise parallel work the system can't do.
7. **Visibility.** The client and the operator can see what is running: which builder sessions, on which scope, and how long each has been going. This ties in with the cadence work (status before a build, milestones).
8. **Spend and limits.** Running in parallel moves the same cost into a shorter window. Cap how many sessions run at once with API rate limits and turn spend in mind, and record each session's cost as before.

## Order of work

The guard (3) and the scope model with enforcement (1–2) come first. They make sequential work safer immediately and are the precondition for everything else. Then concurrent execution limited to **different pages** (5). Same-page sections (4) come last, and only if the scope model says they can be made safe.

## Children

To be filed as the design settles. The immediate stop-gap, telling the consultant that builder sessions run one at a time, is a description and prompt change and needs no ticket.


## Proposed direction for item 4: a page is a frame plus an ordered list of sections, concatenated at render (2026-10-03)

The operator's suggestion, checked against real data. **Charlie's Plumbing 2's home page already has this shape.** Its L1 root is a `stack` whose 12 direct children are the page's sections, each with a meaningful node `id`: `emergency-bar` (sticky), `header`, `hero-section-outer`, `services-glance`, `kitchens-bathrooms`, `process`, `story`, `emergencies`, `reviews`, `trust-strip`, `quote-form-section`, `footer`. Rendering the root's children in order **is** concatenation, so the change is mostly in storage and addressing, not in what L1 can express.

**The shape:**
- **The page frame** holds the document-level keys (`widths`, `background`, `textColor`, `resources`/fonts, `column`), the page's `modules` list, SEO metadata, and the **ordered list of section ids**. Exactly one owner at a time. Adding, removing or reordering sections is a frame operation.
- **Sections** are stored and versioned separately, keyed by the stable section `id`, **never by index**. Addresses inside a section are relative to that section, so writing one section can't renumber another. This removes the "every address on the page is regenerated" hazard.
- **Render** assembles the frame plus its sections in order into today's single L1 document. The renderer and the validator are unchanged and still run on the assembled document, so caps such as node count and depth, and the rule that keyframe widths are a subset of the declared widths, still hold across the page.
- **Reads get cheaper too.** A builder working on one section reads just that section, not the whole 29–41KB page. That saves context even when nothing runs in parallel.

**What has to be settled for sections to be truly independent:**
1. **Root must be a flow stack.** Sections may not position or overlap relative to each other (negative margins into a neighbour, absolute geometry across sections). That's checked when a section is written, not assumed. Capture-derived reproduction pages may not meet this, and they stay single-owner.
2. **Frame keys are read-only to section owners.** A builder needing a new font or viewport width asks for a frame change, and that change is serialised.
3. **Modules belong to the section that hosts their slot.** Today `modules` sits at page level, for example `quote_form` in slot `form`. Each module instance needs an owning section, or it stays with the frame.
4. **Ids that must be unique across sections** (in-page anchors like `#quote-form-section`, node ids) are validated on the assembled page, and a write that creates a collision is refused.
5. **Shared sections.** `header`, `footer` and `emergency-bar` repeat on every page, so they're natural candidates for site-level shared sections with their own scope (EPIC-24 item 1), rather than per-page copies kept in sync by hand.
6. **The version guard (item 3) applies per section**, so two builders on two sections never conflict, and two on the same section get a refusal instead of a lost write.
7. **Migration:** existing pages are split mechanically by root child, and an existing page that isn't a flow stack stays whole.

This makes "different sections of one page" a safe parallel unit, and it should probably replace item 4's "stable addressing" option outright.


## Simplified plan, from the operator, 2026-10-03. Supersedes items 1–8 and the order of work above

Three pieces, and nothing more until they're proven:

1. **Pages can be decomposed.** A page is stored as a frame (page-wide settings, modules, SEO metadata, and the ordered list of sections) plus one file per section, assembled by concatenation at render. See "Proposed direction" above for the shape and the conditions a section must meet. A page that isn't decomposed keeps working exactly as today, as one file.
2. **Locks: one agent per file at a time.** A builder session takes a lock on each file it will write (a section, or a page's frame, or a whole undecomposed page) before it starts, and releases it when it ends. A write to a file the session doesn't hold is refused. Locks are leased, so a session that dies or aborts silently (BUG-191) can't hold a file forever. The lock is the whole concurrency story: no scope algebra and no version merging. The client's own hand edits in the builder respect the same locks, so a section a builder is working on can't be edited underneath it, and the reverse.
3. **The principal (the consultant) is taught all of it.** Its manual and priming explain decomposition and locks. It decides how to decompose an existing page, splits it, builds new pages already decomposed, and plans parallel work as one builder session per file. It must never promise parallel work it hasn't set up this way.

Concurrent execution of builder sessions in the framework (lagrange-framework) is still needed underneath piece 3, and is filed there as a child once 1 and 2 have a shape.