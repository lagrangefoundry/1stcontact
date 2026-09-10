---
uid: comment-d4b3dfd0
id: COMMENT-2405
type: comment
title: Comment on request REQ-213
created_by: xgd
created_at: '2026-09-10T00:27:16.623825+00:00'
updated_at: '2026-09-10T00:59:43.653533+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-577ae72f
  kind: chat_transcript
---

<!-- xgd-turn id="c49f2330-8441-4016-bcce-39787dd8db4f-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T00:27:04.406951+00:00" -->
#### You
I'd like to be able to Edit the What its for label on a piece of content to change from Background to Asset

<!-- xgd-turn id="c49f2330-8441-4016-bcce-39787dd8db4f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T00:31:53.581117+00:00" -->
#### Claude
Scoped as **REQ-213 — "Library: the client can correct what a material is for"**. Ticket body is populated with the full design.

**What I found.** The label lives in the Library detail's rights block (`apps/control-app/src/builder/library.js:141`), rendered by `mountFields` with `editable: false`. The two values are `site` → *Site asset* and `reference` → *Background information*, chosen at upload time from the drop-area overlay. It isn't just a label: `classify` writes `republishable: role !== 'reference'`, and `promoteToSiteAsset` refuses anything not republishable — so today a file dropped on the wrong area can never reach the site.

**The design**, briefly:

- The field becomes an enum select over the same two labels. `mountFields` already takes `editable: ['role']` plus `type: 'enum'`, so it's configuration of the existing block, not a second editing vocabulary.
- **Only for uploads.** For anything we fetched on the client's behalf (`origin: 'fetched'`, third-party rights) it stays read-only. That role was inferred from provenance, and DOC-38 §5 calls promoting capture-sourced bytes the most damaging action in the system. An upload's role *was* the client's assertion, so correcting a mis-drop asserts nothing new — which keeps §10.1 intact.
- `republishable` is recomputed server-side from the role, never accepted from the client — `promoteToSiteAsset` reads that bit off the ticket.
- **Background → Asset also places the bytes**, via the same `promoteToSiteAsset` path the upload takes. Otherwise the row flips straight to REQ-181's *"Not on the site"* warning, which would be true and useless.

**Three calls I'd like you to confirm before I code:**

1. **The reverse direction.** I've specified Asset → Background as included, but **refused when the bytes are already on the site** — `placed_on` is a record of where bytes went and there's no removal path, so allowing it would leave a row saying "just for you to read" about a file that's live on their domain. Alternative: allow it and leave the bytes. I'd keep the refusal.

2. **The slug.** The Library deliberately doesn't know which site is open (REQ-181), so the route resolves it from the tenant store's `slugs()` — one site per business in v1. Zero or several sites means the role change still lands and placement is skipped, fail-soft like the upload path. Alternative is to thread the slug through the panel, which breaks that invariant.

3. **Fetched material.** Read-only field, and the route refuses even when called directly. Confirming you want that gate held rather than a warn-and-allow.

Say go (or amend) and I'll cut the branch and build it.

<!-- xgd-turn id="d99638a5-e6be-4110-bd5f-4c235bc51064-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T00:37:37.883171+00:00" -->
#### You
ok - please proceed

<!-- xgd-turn id="d99638a5-e6be-4110-bd5f-4c235bc51064-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T00:59:43.559726+00:00" -->
#### Claude
Design confirmed. Cutting into the implementation — starting with the domain layer.

Now the router — refactoring `placeOnSite` so both callers read the same, then adding the route.

Now the site resolver and the upload call site:

Now the route itself, next to the description correction it sits beside:

Now the imports and the error mapping:

Now the panel itself:

Now `roleIsTheirs`, the values helper, and the commit path:

Implementation is in. Now updating the ticket body so every UAT I'm about to write traces to language in it.

Now the UATs — the route contract first:

Now the route-contract UATs:

The unknown-uid case: a nonexistent uid throws from the store itself (500) — pre-existing on the sibling description route, not something this ticket introduces. The claim that actually matters here is the one REQ-161 already holds: the surface reaches material and nothing else.

All 11 route claims pass. Now the surface half:

Now the surface UAT:

All 9 surface claims pass. Now checking fallout on the existing Library and material suites:

Exactly the one I expected: REQ-213 supersedes REQ-161's "every row is read-only" claim for that single row.

Those failures are the known fresh-checkout artefact (missing `dist-assets`). Building them:

Stash list intact, my changes restored. Adding the probe for the new route:

My route is covered now; the remaining failure is exactly the pre-existing `/api/material/changes` gap I reproduced without my change. Running a wider sweep:

Diff reads clean. Running the full suite to check for anything I haven't anticipated:

Let me confirm those 12 are pre-existing rather than assume it:

Free-coded step 5 needs a version bump on the branch tip. Following the promotion sequence:

Done. **REQ-213 is `free_coded` at 0.2.144**, merged to `xgd-working`, branch cleaned.

## What you can now do

Open a piece of content in the Library. **What it is for** is a select — pick *Site asset* or *Background information*. Changing Background → Asset also copies the bytes into your site's asset library, so the file is immediately usable, not just relabelled.

## The design calls, as built

**Only for files you uploaded.** The gate is `origin === 'uploaded'`. Fetched material's role came from provenance alone; a capture's came from the captured host. Both stay locked, and the route refuses them 403 even if called directly. The capture case is the one that mattered — a capture of the client's *own* old site is `owned` and republishable, so a gate written on `republishable` would have let it through, and `promoteToSiteAsset` would then have had 11–99 attachment records and no filename to work with.

**`republishable` is derived server-side**, by `classify`'s rule verbatim, never taken from the caller — it's the bit the DOC-38 §5 gate reads.

**Asset → Background is refused 409 once the bytes have landed**, as we agreed. 409 rather than 403 because it's a state conflict: the same client can make the change the moment the file is off their site.

**The slug is resolved from the tenant store**, so REQ-181's "the Library doesn't know which site is open" survives. Zero or several sites means *don't place*, not *fail*.

## Tests

11 route claims in workerd against real D1/R2, 9 surface claims against the real components — all pass, plus 221 tests across the 30 related material/library/capture suites.

I amended one existing UAT: REQ-161 asserted *every* row of the rights block is read-only. It now skips `role` with a comment explaining that the claim narrows rather than weakens — what §10.1 infers is the rights, and every inferred field is still locked.

## Two things to flag

**One pre-existing failure I did not fix.** `reconciliation-builder-workspace-origin.test.ts` has a completeness check that every declared route is probed for `no-store`. It was already failing on `/api/material/changes` (REQ-201's SSE route, added without a probe) — I reproduced that with my changes stashed. I added the probe for my own route; I left that one alone because deciding the right probe shape for a streaming route is REQ-201's question, not this ticket's. Say the word and I'll do it.

**The wider suite has 15 other failing tests** across priming/KB/chat/copy-edit files. I verified these are identical on a clean tree — same 15, unrelated to this work.

<!-- xgd-chat-end -->