---
uid: comment-086afdc0
id: COMMENT-2845
type: comment
title: Comment on bug BUG-86
created_by: xgd
created_at: '2026-09-12T00:45:10.184557+00:00'
updated_at: '2026-09-12T19:48:59.894118+00:00'
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

<!-- xgd-turn id="7806f4bd-ab56-47c0-855f-4b6fb6bdd75c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T00:56:39.659547+00:00" -->
#### Claude
You're right to push on this, and the answer to your question is yes — that's exactly what the current model requires. Let me verify how these values actually get authored before I propose the fix.

This changes the picture. Let me check one more thing — whether page slugs can nest, since that decides whether a relative action is always correct.

You're right, and it's worse than I framed it. Let me record what I found.

You're right — I mis-framed it as data. It's three defects, and the model is broken in the way you suspected.

**1. There's a real renderer bug, and it's the actual cause of your 404.**

`l1/render.ts` has `relativizeUrl` (line 157), which turns `/x` into `./x`. It exists for REQ-109 relocatability and carries BUG-30's RFC-3986 edge cases. Every URL sink in the renderer goes through it — link `href`, image `src`, CSS `url()`, `srcset` — **except the form action**, which `component.ts:110` emits verbatim through `assertSafeUrl` alone.

So the action is the one reference on a rendered page that doesn't survive being served under a channel prefix. Every asset in the preview resolves fine; the form alone posts to the origin root. That's code, not data — and fixing it also closes BUG-78's cross-tenant leak, since `./api/lead` under `/site/<key>/` names that site instead of the apex.

**2. To your question — yes, the AI has to get it right every time.** The entire guidance it gets is `- action — url; required` (`REF-behaviors.md:27`). No default, no hint the product has a lead endpoint, nothing saying the value must be relative.

**3. And it's currently being told to get it wrong.** DOC-47 — live system knowledge — still says *"the published site is read-only… there is no 1st Contact inbox behind the form yet… that's an address you already have."* REQ-223 built that inbox and never updated DOC-47.

The store reads exactly as that instruction predicts:

| Value | Origin |
|---|---|
| `https://app.1stcontact.io/beta-apply` | AI-authored, never existed (BUG-78) |
| `https://api.gigabytefoundry.ai/contact` | AI-authored external address, as DOC-47 directs |
| `https://example.com/enquiry` | AI-authored placeholder |
| `/api/lead` | **only ever typed by a human** — BUG-78's manual edit, and the xgd seed |

A third-party action also silently loses everything REQ-223 built: no contact record, no asset delivery, no server-side honeypot, no Turnstile (the secret is ours). It looks like lead capture and isn't.

**On your "parameters associated with the specific site" instinct** — it needs no parameter at all. Document-relative `api/lead` is correct for every site in every channel, because page slugs are one flat segment, so a document's directory is always its channel root. That's the same invariant `routes.ts` protects via `htmlFallbackFor`'s trailing-slash refusal and REQ-109 relies on for `theme.css`. Nailing it in place is strictly better than parameterising it.

So the fix I'd propose, all under BUG-86:

1. Route the action through `relativizeUrl` (needs exporting; currently module-private). Fixes the 404 and the leak.
2. Make `action` optional, defaulting to the lead endpoint the component resolves itself — keeping an explicit escape hatch for a genuine third-party endpoint rather than making it the thing you fall into.
3. Update DOC-47 to say the inbox exists, and rebuild the KB.
4. Correct the four stored values.

One judgment call I'd like your steer on before I cut the branch: **should the third-party escape hatch survive at all?** Keeping it means the failure mode that produced `https://example.com/enquiry` stays reachable, just no longer the default. Removing it makes the form always the product's lead capture, and a client needing an external endpoint becomes a new ticket with a real design. I lean toward keeping it — DOC-47's "a form that silently posts nowhere is the worst possible outcome" is still true, and an explicit opt-out is honest — but it's your product call.

<!-- xgd-turn id="5574f085-8387-445b-b7d2-be0d8d4c9b6b-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T19:13:10.985413+00:00" -->
#### You
So in my mind the module should be self-contained, it should be automatically provisioned by the system with the correct URLs etc. etc. The AI has freedom to style and arrange it with any look but it should not need to set up its functionality.

I don't know what the third-party escape hatch is? Are you suggesting we allow the form to post to other locations? Why would we do that? This is an email capture module, it is to capture emails into your site, this is not a general web form module

<!-- xgd-turn id="5574f085-8387-445b-b7d2-be0d8d4c9b6b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T19:43:12.775195+00:00" -->
#### Claude
Agreed — I'll drop the escape hatch. I raised it because DOC-47 describes that case, but DOC-47 describes it as a workaround for an inbox that didn't exist yet. It exists now, so the field is vestigial. An email-capture module that can be pointed at someone else's server is just a hole.

Let me check what removing the config key implies for stored instances.

The machinery for this already exists (BUG-85's migrations). Let me scope the decision onto the ticket.

node_modules is present. Now the implementation — starting with the endpoint constant.

Now the meta — removing `action`, bumping to v5 with a migration.

Now the component — it emits the endpoint itself.

Now point `public-site` at the single definition.

Let me typecheck before going further.

Pre-existing lib/types noise, nothing from my change. Let me see the blast radius on existing tests.

145 failed files needs a baseline before I trust it. Let me get one and classify my failures at the same time.

Baseline is 9 failed files; mine is 145. The version bump orphaned every `v4` fixture in the suite — the exact BUG-85 failure. That churn is real, so let me see its shape before deciding how to absorb it.

The JSON reporter is too slow. Let me fix the known fixtures and re-measure.

Storage files only — my grep missed the test files' unquoted form. Let me redo those.

More fixtures reference `action` without a version pin. Let me look at the semantics before bulk-editing.

These assertions encode the contract being removed, so they have to move. Let me sweep the configs first.

Configs are clean. Now the assertions — let me re-run and see what's left.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="4ba2bb71-881f-4a2a-bb00-7c6fc0deddf8-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T19:48:59.560435+00:00" -->
#### You
Please continue. Can you also update DOC-47 so we don't confuse ourselves going forward, please.

<!-- xgd-chat-end -->