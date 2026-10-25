---
uid: comment-526b326e
id: COMMENT-3675
type: comment
title: Comment on request REQ-313
created_by: xgd
created_at: '2026-09-23T18:03:41.076903+00:00'
updated_at: '2026-09-23T20:54:27.705248+00:00'
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

<!-- xgd-turn id="62d26545-5a61-4b4d-b6b6-108b5e2223cb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T20:50:39.914837+00:00" -->
#### Claude
REQ-312 landed while I was reading (`f62cf1b0f7` — mirror, platform tier, `/_fonts/` origin), so the dependency is satisfied. Proceeding.

Now let me scope the ticket before cutting the branch.

Now the committed (empty) index and the surface declaration.

Now the `use_font` implementation in `toolbox-core.ts`.

Now add the `fonts` parameter to `l1Operations` and the bound toolbox class.

Now the drift check in `1c fonts check`.

Now the knowledge correction at its source in `validate.ts`, then regenerate `REF-l1.md`.

Now the UAT suite.

Now let me run a broader regression across the areas this touches.

Now the workers project (the Worker-side bundle must still load the surface).

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="2c49b7d8-59c5-4376-a769-48c4f80fd7a3-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T20:51:15.958614+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="2c49b7d8-59c5-4376-a769-48c4f80fd7a3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T20:54:26.741932+00:00" -->
#### Claude
Now the ticket body gains the language the remaining UATs trace to.

Now the version bump and commit.

Done — REQ-313 is `free_coded` on `xgd-working` (`b89dfbcb0e`, merged as `d097673ee4`).

## What landed

**`use_font(family, weights?, styles?)`** — declared in `l1-surface.json` under **`AuthorPages`**, implemented in `toolbox-core.ts`, writing through `editDocumentSet` (the same single write path `set_page_style` uses). `ManageAssets` stays ungranted: the surface gains a source of content without gaining a way to fetch one — no parameter takes a URL, a path or a byte.

Decisions I made, all recorded on the ticket body:

- **`src` is site-relative `/_fonts/<slug>/<file>.woff2`.** REQ-312's `public-site` answers that prefix ahead of the site grammar on *every* host it serves, so one spelling reaches the mirror from a local preview, staging, `1stcontact.io` and a bound customer domain — nothing pins a hostname into a page, and same-origin removes CORS.
- **One resource entry per weight × style.** The renderer emits `font-weight` only when set, so a face bound without one matches 400 alone. A variable family binds its single file once per weight, each carrying its own `weight`; the `@font-face` descriptor pins the `wght` axis. No renderer change.
- **Every page by default**, `page` narrows it. Email pages are skipped and the result says which — a mail client has no web fonts, so the email target refuses `resources` outright.
- **Refusals**: `NOT_FOUND` names the family and lists near-named ones we do serve; `CONFLICT` when the page already serves that family from its own assets (the tenant's bytes on the tenant's attestation — not ours to swap); `ENVIRONMENT` when the mirror was never populated. An unshipped weight is *not* a refusal — the nearest is bound and both the substitution and the family's real weights come back.

**`1c fonts index`** projects `fonts/platform.json` (joined to the catalogue for category, named weights, axis ranges) into `platform-fonts.json`, which the toolbox imports as data — `use_font` runs in a Worker with no filesystem, the same reason `l1-surface.json` is a static import. `1c fonts mirror` now runs it too, so it is not a remembered step, and `1c fonts check` gained **`stale-font-index`**, because that drift is visible from nowhere else.

**Knowledge corrections** at source: the `"or a font"` clause is out of the fetching absence (and it now says a typeface is explicitly *not* one of these), and the `servedFontFamily` rule `REF-l1.md:604` is projected from gained its resolution — kept inside the projection's 240-char budget, which is what silently dropped the rule from the reference on my first attempt.

## Tests

12 UATs in `tests/test_UAT_FC_REQ-313_use_font.test.ts`, driving the real chain: `1c fonts mirror` over a fixture `google/fonts` checkout with real TrueType bytes → `1c fonts index` → `use_font` via `l1Operations` over a real fs store → `1c fonts check` passes. Assertions read the page JSON the store wrote.

I also added `use_font` to the two enumerated write-set gates (`REQ-126`, `reconciliation-assistant-control-surface`) with notes — those lists exist so a new write cannot appear as a diff nobody read.

Full node suite: **4234 passed, 16 failed**. I verified all 16 are pre-existing by stashing and re-running the same files on the unmodified tree — identical 9 files / 16 tests (filing-service ports, build-deploy smoke, webui scope, `Delegate` in the conversation grant, `tenant-cost.js` vocabulary). Workers suite: **1342 passed**, and `wrangler deploy --dry-run` bundles.

## One thing to know

`fonts/platform.json` does not exist yet — REQ-312 landed the mirror *code*, not the bytes. So the committed index is `{"mirror":null,"families":[]}` and `use_font` currently refuses every family with the `ENVIRONMENT` sentence. It becomes live the moment someone runs `1c fonts mirror --repo <google/fonts checkout>` and `1c fonts publish`; the index is written by the mirror, so nothing else needs doing.

<!-- xgd-chat-end -->