---
uid: comment-0386ff02
id: COMMENT-1475
type: comment
title: Comment on chat CHAT-30
created_by: xgd
created_at: '2026-08-24T23:08:41.235599+00:00'
updated_at: '2026-08-24T23:11:38.927112+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-9a83484f
  kind: chat_transcript
---

<!-- xgd-turn id="62f33f71-888e-46bb-b3da-ba04a816add2-user" -->

<!-- xgd-chat role="user" ts="2026-08-24T23:08:36.391115+00:00" -->
#### You
I want to discuss the overall backend data model for a first contact site. We need to organize the following:
1) Public rendered site
2) Draft site and versions
3) Downloaded materials
     a) Users previous site - they own this content
     b) Reference sites - they do not own this content
     c) General positioning materials, industry reports, news articles etc - the do not own this content
4) Uploaded materials:
     a) photos, images, fonts other site assets - they need to own or license these
     b) positioning papers, reports, background on the brand, business, industry context - they may own some of this and not others

Ok so I want your help to first of all help me categorise this content the key axies are:
 - Is it publicly viewable?
 - Is it owned or licensed by the user?
 - What type of content is it?

In this thread I want to get to a design for how all this content should be organised and made accessible to the AI tools. 

Some thoughts:
I believe we already have 1 and 2 nailed - I'm not sure where we are with the others
A key question is: what goes into the project knowledge base? (see KMS in this project and in lagrange-framework) Should the site itself be included (I actually think it needs to be)? I am also thinking that all the background materials should be too? What about the reference sites? Do we even keep those?

<!-- xgd-turn id="62f33f71-888e-46bb-b3da-ba04a816add2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-24T23:11:38.905143+00:00" -->
#### Claude
I read the existing model before answering — DOC-12 (storage/versioning), DOC-13 (capture), DOC-10 (chat + memory + the system KB), DOC-9 (Design Brief), DOC-36/37 (collection/deletion), the `kb/knowledge_bases.json` config, and `db/migrations/0001_site_store.sql`.

You're right that 1 and 2 are settled (DOC-12 + REQ-143's D1 store). 3 and 4 are genuinely unbuilt, and 3c/4b have **no home at all** today — no store, no type, no corpus.

## Two findings that change the axes

**1. "Is it publicly viewable?" is two different questions, and they come apart.**

A reference site is publicly viewable — on someone else's domain. That fact tells you nothing about whether *we* may serve it. What you actually need is **exposure** (which serving path it's on: published / link-private / tenant-private) as a *consequence* of **rights**, not as an independent axis.

**2. "Is it owned by the user?" is under-specified — ownership gives two independent permission bits, and they point opposite ways.**

| | may bytes/copy enter a **published site**? | may it cross the **tenant boundary** into cross-customer learning (DOC-36 §8)? |
|---|---|---|
| User's own previous site (3a) | **yes** | **no** — this is their business, and DOC-36 §6 flags exactly this material as confidential |
| Third-party reference site (3b) | **never** | **yes** — public marketing pages, structure only, feeding DOC-15's coverage corpus |

So ownership is not a single ordering. Two bits: `republishable` and `exportable`. 3a and 3b are *the same technical artifact* (a DOC-13 capture bundle) that differ only in these two bits, inverted. That is the whole design problem in one line.

## The categorisation

Replacing your three axes with four that actually carry decisions:

- **Role** — site source / AI context / derived artifact → *whether it's versioned, and where it's stored*
- **Modality** — structured / media / prose → *how the AI reaches it: control surface vs asset picker vs KB search*
- **Rights** — the two bits above → *what it may become*
- **Exposure** — derived from rights, never set independently

| # | Item | Role | Modality | republish | export | Exposure | Store | In a KB? |
|---|---|---|---|---|---|---|---|---|
| 1 | Rendered public site | derived | rendered | — | — | published | R2 `out/` | no (derived) |
| 2 | Draft + revisions | site source | structured | ✓ | ✗ | link-private → published | D1 + R2 | **yes — a derived text projection** |
| 3a | Their previous site | AI context | capture bundle | ✓ | **✗** | tenant-private | ReferenceStore | yes |
| 3b | Reference sites | AI context | capture bundle | **✗** | ✓ | tenant-private, never served | ReferenceStore | yes, **quarantined** |
| 3c | Industry reports, articles | AI context | prose | ✗ | ✓ | tenant-private | *no home yet* | yes |
| 4a | Photos, fonts, assets | site source | media | ✓ | ✗ | published when used | R2 + `site_assets` | no — but **metadata** yes |
| 4b | Positioning/brand papers | AI context | prose | partial | ✗ | tenant-private | *no home yet* | yes |

The invariant that falls out: **capture-sourced assets may never be promoted into the asset library unless the bundle is marked user-owned.** Promoting a hero image out of a competitor's capture publishes third-party copyright under the customer's domain — it's the single most dangerous move in the system, and it's currently one plausible AI tool call away. DOC-13 §10 parks IP "until the technical model is proven"; that park expires here, because the risk was never *storage*, it's *leakage into output*.

## The design

### Not one KB — six, because the KB is the unit of scoping *and* of provenance

The knowledge component already gives you `{corpus predicate, landscape, source, weight, prompt}` per KB, and search spans the set the session is scoped to. Use that:

| KB | Corpus | Landscape | Notes |
|---|---|---|---|
| `system` | shipped design docs | authored | exists; above tenancy (DOC-10 §6.2.1) |
| `transcripts` | chat tickets' transcripts | derived | DOC-10 §4.3 |
| `brief` | the Design Brief | authored | tiny, always relevant, high weight |
| `business` | 4b + 3c | authored | **the gap** |
| `site` | text projection of the draft | derived | **the gap** |
| `references` | capture bundles' prose | derived | **quarantined** |

### Yes, the site goes in — but as a projection, not as the definition

You're right that it needs to be there ("what does the pricing page say?" is a retrieval question, and copy consistency across pages is unreachable by tree-walking). But index the **words, not the document**:

- Project each page to its ordered visible text runs + page metadata. No geometry, no colours, no module config.
- `landscape: derived`, and the KB's prompt names the L1 control surface (DOC-30) as the authority — so the awareness map tells the AI *"this is a searchable copy of the site's words; to read or change structure, use the control surface."*
- Reproject on write, not at release build. `sites.counter` in `0001_site_store.sql` is already a monotone journal counter — that's your invalidation token, for free.

Without the projection discipline you get a read-only, lossy, *stale* second path to a thing that already has an authoritative writable one — precisely the parallel-copy failure DOC-10 §6.1 argues distillation into.

### The actual gap is a tenant document library

3c and 4b have no store. They don't need a new one: the ticket store is already a typed, tenant-scoped, versioned document store on D1. So a `document` type in the tenant's store — body = markdown, `fields.rights`, `fields.source`, original PDF bytes in R2 — and the `business` KB is a corpus predicate over it. Same shape as the shipped system KB, sourced from the tenant's store instead of a shipped directory, which the component already supports.

That single addition covers 3c, 4b, and the Design Brief.

### Do we keep reference sites? Yes — in two places, with different lifetimes

Splitting this resolves it cleanly:

- **In the tenant: short-lived.** The bundle is working material during the build. What's durable is the *distillate* — DOC-9 §4.1's Brief entry ("kept the emergency-callout framing from B, rejected A's pricing grid"). Keep the Brief entry forever; GC the bundle on a bounded window.
- **Internally: permanent.** DOC-15's coverage program wants captures as a module-backlog corpus. That's not tenant data, is never served, and survives tenant deletion because it crossed the boundary as aggregate (DOC-36 §8).

This also gives DOC-37 a clean answer: a third-party capture registers as `no-identity`, the tenant copy deletes without touching internal learning.

### Quarantine — the one mechanism worth building

Prompt-level labelling (the `references` KB's awareness-map prompt says *form, never content*) is the v1 answer, and it's weak. The strong version is at the **write** path, not the read path: the L1 control surface accepts text, so verbatim third-party copy appearing in a `set-text` call is a mechanically detectable event — an n-gram check against the quarantined corpus at write time. Same flavour as the tenant-scoped store handle: structural rather than disciplinary. Expensive enough that I'd flag it as a follow-up, but the seam belongs in the design now.

---

Two things I'd want your call on before this becomes a DOC:

1. **Where the rights bits get set.** Capture-time prompt ("do you own this site?") is the only honest place, but it puts a legal question in front of a novice user (DOC-35 §5.2's register problem). The alternative is inferring from whether the URL matches their declared domain, and asking only when it doesn't.
2. **Whether `business` and `references` are really two KBs or one with a rights facet.** I've argued two because the quarantine boundary should be a scope you can *exclude*, not a field you must remember to filter — but it does mean a client's own prior-site capture (3a) sits awkwardly between them.

Want me to write this up as a DOC (Content Model & Rights) once those two are settled?

<!-- xgd-chat-end -->