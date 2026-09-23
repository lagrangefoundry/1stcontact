---
uid: comment-526b326e
id: COMMENT-3675
type: comment
title: Comment on request REQ-313
created_by: xgd
created_at: '2026-09-23T18:03:41.076903+00:00'
updated_at: '2026-09-23T20:20:37.282279+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3d37dbdf
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "1aa44bce-7b8a-4cba-9b77-6a57a2edecc2",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="dc0a0f10-b68f-4314-b0b0-356042f659b8-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T18:02:22.937217+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="dc0a0f10-b68f-4314-b0b0-356042f659b8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T18:09:31.188836+00:00" -->
#### Claude
Now let me look at the fonts CLI (`1c fonts check`) and the registry.

I've read the ticket, EPIC-21, REQ-311/312/314, DOC-56, the L1 surface declaration (`l1-surface.json`), `toolbox-core.ts`, `edit.ts`'s document write path, `validate.ts`'s font rules, and `1c fonts check`. Nothing is committed yet — one thing blocks me, and it's the dependency the ticket itself names.

## REQ-312 is not implemented

Concretely, today:

- **No mirror, no serving origin.** `fonts/catalogue.json` and `fonts/CATALOGUE.md` are on disk but **untracked**, and nothing produces them (that's REQ-311, also draft). No R2 prefix, no route.
- **No platform tier.** `fonts/registry.yaml` holds 10 hand-written site entries.
- **`1c fonts check` cannot resolve a platform `src`.** `assetBasename(src)` → match against `files[].path`, so a platform-origin URL reports `unregistered-family`/`unregistered-file` (`tools/generate/src/cli/fonts.ts:174`).

So two of REQ-313's own stated behaviours cannot hold yet — "the page renders in that face rather than a fallback" (no bytes) and "a page whose fonts were bound by `use_font` passes `1c fonts check`". Built now, `use_font` would confidently bind a URL that 404s, which is worse than today's visible fallback: the failure moves from obvious to silent.

## How do you want to sequence it?

**(a) REQ-312 first**, in its own session, then this. The epic's own ordering.
**(b) Build `use_font` now** against a URL *contract*, catalogue as availability oracle — complete, but inert until REQ-312 lands.
**(c) Fold REQ-312's minimum** (mirror + generated platform tier + the check change) into this ticket.

**I recommend (a).** REQ-312 is the ticket that decides the origin, the key layout and the file naming — and `use_font`'s whole job is composing a `src` out of exactly those three. Done in that order, REQ-313 is a small honest ticket that reads a manifest the mirror produced. Done in this order, it invents a URL shape REQ-312 then has to honour.

## If you'd rather keep moving on 313 now

Say (b) or (c) and I'll start immediately — but I'd be deciding the origin here, so I want your veto on it:

- **Origin.** `apps/public-site` gains `/fonts/<slug>/<file>`, served from the existing `1stcontact-sites` bucket under a `platform/fonts/` prefix, `LICENSES.txt` beside it. The real alternative is a separate `fonts.1stcontact.io` zone and/or its own bucket — a cleaner cache/purge boundary, which EPIC-21 area 3 (takedown) will care about.

These I'll decide myself unless you object:

- **Availability oracle** is a generated manifest (family → slug, weights, italic, variable axes), not `catalogue.json` — 970KB of designer/subset/popularity metadata is bundle-resident weight the Worker has no use for.
- **What a call binds.** Variable family → one face per requested style, no `weight` (the axis range covers it); static family → one face per requested weight × style. `l1FontFaceSchema` carries a single optional `weight`/`style` per entry, so the shipped range comes back in the *result* rather than the binding. An unmirrored family is a `NOT_FOUND` refusal naming it; an unshipped weight returns the weights that do ship.
- **Group.** `use_font` joins `AuthorPages` rather than getting its own — it is a page write in the same sense `set_page_style` is, and both production instances already carry it. `ManageAssets` stays ungranted.
- **Knowledge corrections** land at source: the `"or a font"` clause in `l1-surface.json`'s "Fetching a picture, or any file, yourself" absence, and the `servedFontFamily` doc comment in `packages/site-schema/src/l1/validate.ts:148` that REF-l1.md:604 is projected from.

<!-- xgd-turn id="62d26545-5a61-4b4d-b6b6-108b5e2223cb-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T20:20:36.459894+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-chat-end -->