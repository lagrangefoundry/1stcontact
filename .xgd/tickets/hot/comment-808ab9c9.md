---
uid: comment-808ab9c9
id: COMMENT-3030
type: comment
title: Comment on epic EPIC-17
created_by: xgd
created_at: '2026-09-17T19:55:56.755356+00:00'
updated_at: '2026-09-17T20:08:56.810343+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-bed5a03b
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "2e81ac9f-fcb7-429e-b583-0f8f00dc7f5e",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="3ff2b1a0-12f9-45c6-a729-d41547623ebd-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T19:55:46.267112+00:00" -->
#### You
This Epic is ahead of its need so, more of a placeholder at this point. However, "security by design" and all that...what I would like you to do - and we will likely do this periodically - is to get familiar with the product - docs, epics, implementation and start the exercise of creating a threat matrix - I have never done this before myself but I understand the principle. This is a fairly conventional SaaS product plus deep and powerful AI (prompt injection is an important vector).

I think this is a good point to start the exercise. It if turns up any architectural issues we still have time to pivot and you can contribute REQs for threat mitigations as we go.

<!-- xgd-turn id="3ff2b1a0-12f9-45c6-a729-d41547623ebd-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T20:08:55.676226+00:00" -->
#### Claude
Now I have what I need. Writing the threat model into the ticket.

First pass is in the ticket (title untouched, body populated — no code touched, so no branch/commit needed).

## How I approached it

Threat modelling only stays tractable if you build it from **assets** rather than from a vulnerability checklist, then walk **trust boundaries**, then — for this product — split the AI surface in two. That split is the one non-obvious move: prompt injection isn't a single threat, it's *where untrusted text can reach the model's context* × *what a turn is allowed to do*. You can't reliably stop the first, so the mitigations all live in the second. §3.4 and §3.5 are those two tables.

## What the exercise found

The existing posture is unusually strong in the places it was designed for — `access.ts` (alg pinned from the JWKS, `aud`/`iss`, fail-closed, stated twice with `workers_dev=false`), `scope.ts` (one decision point, with a UAT that no sixth reader appears), `svg.ts` (closed grammar, refuse-whole), the lead endpoint (fail-closed Turnstile *and* rate limiter), `redact.ts`, both egress guards. Those rows are "Covered" with citations.

Two findings are architectural, and both are cheap now and expensive later:

**F1 — untrusted uploads become documents on the builder's own origin.** `/api/material/file` serves the uploaded content-type inline; `html → text/html` and `svg → image/svg+xml` are in the map; that route sets no `nosniff` and there's no CSP anywhere; the preview iframe is same-origin by construction. So a dropped file can run script as the signed-in user against every `/api/*` route. `svg.ts` predicted this precisely — *"a human vouched for the bytes and an extension check was the whole of the question"* — but `validateSvg` was only wired to the AI door, not the client door. It goes High → Critical the moment uploads are anonymous (form attachments, EPIC-13 inbound mail).

**F2 — the assistant holds an irreversible, global, unrecoverable action.** The settings role is granted `ClaimHostname`. A `1stc.site` label is one per business, final, never re-issued. The product already has the right pattern and says why: `Publish` is withheld *by grant, not by instruction*. Hostname claiming is strictly more irreversible. The fix — a declared-irreversible effect the toolbox enforces, model proposes / human performs — is also the mechanism EPIC-5's open question 2 needs for MX/SPF/DKIM/DMARC.

Then F3 (no CSP), F4 (absolute image `src` = an exfil beacon on next render), F5 (32 `requireScope()` across 50 route arms — nothing unguarded, but no structural guarantee, on a surface where Access explicitly *isn't* the authorization boundary), F6 (nothing asserts what the AI is granted), F7 (`@lagrangefoundry/*` appears zero times in the lockfile), F8 (`.dev.vars~` is committable; Turnstile `hostname` unchecked; `workers_dev=true` on public-site).

§3.7 holds the design-time rows for the unbuilt epics. The one I'd flag hardest: **the `1stc.site` PSL submission is a security control, not hygiene** — until it lands, every customer site shares an eTLD+1 — and TODO-6 §1's lead time puts it on the critical path.

## What I didn't do

§5 lists 10 proposed REQs, prioritised, but I haven't filed them — your session rules say tickets only on an explicit ask. Say the word and they go in at `draft`. I'd also suggest promoting this to a `doc` (`doc_kind: architecture`, so it stays out of the production KB) after one review cycle, with DOC-2 linking to it as the platform-scope companion.

<!-- xgd-chat-end -->