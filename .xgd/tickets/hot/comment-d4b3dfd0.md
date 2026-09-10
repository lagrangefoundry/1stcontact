---
uid: comment-d4b3dfd0
id: COMMENT-2405
type: comment
title: Comment on request REQ-213
created_by: xgd
created_at: '2026-09-10T00:27:16.623825+00:00'
updated_at: '2026-09-10T00:37:38.053981+00:00'
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

<!-- xgd-chat-end -->