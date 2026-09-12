---
uid: comment-086afdc0
id: COMMENT-2845
type: comment
title: Comment on bug BUG-86
created_by: xgd
created_at: '2026-09-12T00:45:10.184557+00:00'
updated_at: '2026-09-12T00:53:54.476151+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-d763b461
  kind: chat_transcript
---

<!-- xgd-turn id="d4e79e76-70cd-458c-aca8-b7dc4217abf0-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T00:45:02.444077+00:00" -->
#### You
Hittin "Apply to join the early beta" in 1stcontact website produces "Something went wrong (404). Please try again."

<!-- xgd-turn id="d4e79e76-70cd-458c-aca8-b7dc4217abf0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T00:49:41.481114+00:00" -->
#### Claude
I've traced it. Let me record the diagnosis on the ticket.

Found it. Diagnosis is on BUG-86.

**The form's action is root-relative, so it lands on a route that doesn't exist.**

`beta-form.config.action` is `/api/lead`. `component.ts` emits that verbatim, and a root-relative action resolves against the *origin*, throwing away the document's directory. In the builder preview the page is served at `/b/<biz>/preview/1stcontact/draft/`, so the submit goes to `https://app.1stcontact.io/api/lead` — which `control-app` has no route for. It falls through the whole route table to `env.ASSETS.fetch()` (router.ts:3218), which answers 404. That's exactly the status `client.js` prints.

The preview endpoint BUG-78 built is at `/preview/<slug>/draft/api/lead` (router.ts:3178). A root-relative action can never reach it.

I confirmed this isn't production: `GET https://1stcontact.io/` is still 404 (nothing published) and `POST /api/lead` there answers 405, not 404. `handleLead` can't return 404 at all — its answer set is 200/400/403/413/415/503.

**BUG-78 wrote this value, and its own text says what it should have been** — its "Two findings" section already names `api/lead` (no leading slash) as correct. Document-relative resolves right in all three surfaces:

| Surface | `api/lead` → | |
|---|---|---|
| preview | `/b/<biz>/preview/<slug>/draft/api/lead` | route exists |
| published apex | `/api/lead` | apex resolves |
| published non-apex | `/site/<key>/api/lead` | **correct tenant** |

That last row matters: all three shipped forms (`1stcontact/home`, `xgd/home`, `xgd/whitepapers`) carry `/api/lead`, and for the two non-apex `xgd` ones that means their leads would land in the *apex* tenant's contact list once published. That's BUG-78's finding 2 — same root cause, same one-character fix.

**Which fix do you want?** I've written three on the ticket:

- **A — data only.** Rewrite the three action values to `api/lead` the way BUG-78 applied its edit. No repo code, no reconciliation. Closes the 404 and the cross-tenant leak. Doesn't stop it recurring.
- **B — data plus a guard.** A, plus either a `contact-form` validation refusing a root-relative `/api/lead`, or a UAT that renders each shipped site and asserts the emitted action resolves to a route that exists.
- **C — stop it being a dial.** `action` is free-text `{type: 'url', required: true}`, and the product's own endpoint isn't a URL an operator should type. A sentinel would let the renderer emit the right relative target itself, keeping free-text for the DOC-47 case (post to a mailbox the client already has). Schema change — bigger than a bug fix.

My recommendation is **B**: A alone leaves a trap that has now sprung twice, and C is a real design decision that deserves its own ticket rather than riding in on a 404.

<!-- xgd-turn id="7806f4bd-ab56-47c0-855f-4b6fb6bdd75c-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T00:53:54.191380+00:00" -->
#### You
OK, so I am confused. I don't understand why this is "data". This feels like it should be figured out written once correctly, perhaps with parameters associated with the specific site and nailed in place. Are you telling me that we have to get the production AI to get this right every time or the form breaks?

Maybe we need a guard, but I think the model for where these characters come from sounds broken

<!-- xgd-chat-end -->