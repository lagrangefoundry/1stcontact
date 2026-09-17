---
uid: comment-808ab9c9
id: COMMENT-3030
type: comment
title: Comment on epic EPIC-17
created_by: xgd
created_at: '2026-09-17T19:55:56.755356+00:00'
updated_at: '2026-09-17T21:30:12.127123+00:00'
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

<!-- xgd-turn id="226d8cd4-a8c5-4912-9a4d-650332c1a3e4-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T21:09:13.411318+00:00" -->
#### You
Key question: given your initial rough assessment - are there any changes or features that need to be built now to secure the product?

One thing that springs to mind about your prompt injection vectors - in principle, they should be constrained by tenant and should not be able to impact the back ups - in which case, a breach could take down a site, but it could be rapidly restored.

<!-- xgd-turn id="226d8cd4-a8c5-4912-9a4d-650332c1a3e4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T21:11:53.881678+00:00" -->
#### Claude
Good question to press on — that hypothesis is testable, so let me test it before answering.

Verified the hypothesis against the code — it holds for one half and breaks on the other. Let me record that in the ticket first.

Ticket updated with §4a. Now the answer.

## Your instinct is right, and it's already half-built

I checked it rather than assumed it. **Tenant confinement holds by construction**, and better than I expected:

- The store handle is `forTenant`-bound before the AI host is reached, and there is **no tenant argument anywhere on that path** — so there's no string to get wrong. `scope.ts` made the decision per request.
- The L1 surface declares one site and no operation takes a site argument.
- `Publish` isn't granted. Nor is `ManageAssets` — so a hijacked turn can't delete assets either.
- Published revisions are append-only, and live is *derived* as the highest id rather than stored, so there's no pointer to repoint.
- `forget()` — which deletes a site and all its revisions — has **no caller in the product**.

So the reachable blast radius of an injected turn is exactly one thing: **one business's draft**.

## Where it breaks — and it's the "rapidly restored" half

1. **The draft has no restore point.** The change journal is explicitly *not* a revision — clipped `before`/`after` strings for orientation. A draft holding weeks of unpublished work has nothing behind it.
2. **Restore is implemented but unreachable.** `checkoutRevision` exists and is correct, but it's wired only to the filesystem store via the CLI. No route, no button. Restoring a customer's site from a revision is something the product currently cannot do.
3. **No stated backup posture** — nothing names D1 Time Travel, R2 retention, or a restore runbook anywhere. "We can restore" is an assumption, not a tested property.
4. **The AI isn't the worst-case actor.** Tenant confinement is a property of the *assistant's grant*. F1 hands an attacker the **signed-in user's** authority — publish, hostname claim, every route — and if the viewer is a platform operator, it crosses businesses. Size recovery against F1, not against a hijacked turn.

The useful reframe your question produces, which I've written into the ticket as a reusable principle: **confine, then recover.** Every capability bounded to one business *by the handle rather than by a predicate*; every destructive or irreversible effect has either a restore point behind it or a human in front of it. That turns "stop prompt injection" (unwinnable) into two buildable things.

## What needs building now — five items

| | What | Why now |
|---|---|---|
| **1** | **Untrusted uploads off the builder's origin** — separate origin; interim `attachment` + `nosniff` + sandbox CSP, plus `validateSvg` on the upload path. Ships with the CSP/headers work. | The only finding where a *current, ordinary* user action leads to full account takeover. It's contained today and stops being contained the moment uploads are anonymous. |
| **2** | **A confirmation seam for irreversible operations** — declared effect, enforced by the toolbox; model proposes, human performs. | Pure architecture timing. Today it's one operation (`claim_hostname`) and the pattern is already proven by how `Publish` was withheld. After EPIC-5 and EPIC-13 it's a retrofit across three surfaces — and it's the mechanism EPIC-5's open question 2 is asking for. |
| **3** | **A draft restore point, and a restore control in the product.** | This is your hypothesis made true. It's the thing that licenses treating injection as survivable. |
| **4–5** | **Route-gate inventory guard** and **granted-capability pin** — both tests, not features. | Hours of work, and they're what stop 1–3 regressing. The second is what makes the confirmation seam durable rather than a one-off. |

## What can wait, and why that's now defensible

The **prompt-injection envelope** — the prompt-layer defence for untrusted retrieved content. Normally I'd push it hard. But your containment argument is what buys the deferral: with tenant confinement + no publish + no asset deletion + a real restore path, today's worst case is a recoverable draft. It becomes **mandatory** at AI-I6/AI-I7 — inbound mail, or contacts reaching a role's tools — because those change *who can reach the context* from "the client" to "anyone with an email address". I've marked it gated rather than deferred, so it can't quietly slip past that line.

Also next-not-now: backup posture (8), shared-store pinning (9), security-event review (11), the F8 hygiene items (12, minutes).

Want me to file these as REQs? I'd file 1–5 first and scope them properly; say the word and they go in.

<!-- xgd-turn id="64fc4924-1d23-47e9-b207-2a8ef509ec5f-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T21:13:40.487775+00:00" -->
#### You
**The draft has no restore point.** The change journal is explicitly *not* a revision — clipped `before`/`after` strings for orientation. A draft holding weeks of unpublished work has nothing behind it. <-- no I would not expect to restore the draft I think the draft is expendable. What we can restore is the published site that should be fixed in time and immutable. That is something that we should enforce

<!-- xgd-turn id="64fc4924-1d23-47e9-b207-2a8ef509ec5f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T21:15:45.485959+00:00" -->
#### Claude
Accepted — that's a cleaner line, and it changes what needs building. Let me check whether immutability is actually *enforced* today or just conventional.

That changes the answer materially. Three things to verify, and all three came back the same way:

Ticket updated; the draft-restore framing is withdrawn. Your line is better, and checking it produced a sharper finding than the one it replaced.

## Immutability is intended, respected, and enforced nowhere

Six layers, and the *only* thing actually enforced is that a revision id can't be re-used in the log:

| Layer | Enforced? |
|---|---|
| Revision numbering — `PRIMARY KEY (site_id, id)`, and the schema comment says *"Never reused, never renumbered"* | **Yes** |
| The revision **row** — nothing forbids `UPDATE` or `DELETE` | **No** |
| The frozen **bytes** in R2 | **No** |
| Byte integrity — the `sha` digest | **No** |
| Concurrent publishes | **No** |
| Write authority over the bucket | **No** |

Three of those are worth spelling out.

**The constraint protects the log, not the bytes.** `writeRevision` `put`s every object into `published/<site>/<id>/` *before* the `INSERT` whose primary key would have refused the id. `put` overwrites. So the one guard that exists is evaluated after the damage it would have prevented.

**The detector already exists and is unwired.** `sha` — a digest of the frozen definition, which the schema itself annotates *"AUDIT, NOT ADDRESSING… are these the same bytes?"* — is computed at publish, stored on the row, and **never read back anywhere**. `readRevision` checks the row for existence and reads the objects for content, and compares nothing. Wiring that comparison into checkout is the smallest item on the whole list and it converts "immutable by convention" into "tamper-evident by construction".

**Your own schema has the precedent.** There is exactly one immutability trigger in the entire database, and it's on `contact_events`: *"a correction is an appended event that supersedes, never an edit of the row that was wrong."* That is precisely the argument for `site_revisions`, and it's in the same file.

None of this is a live exploit path — the publish path is the only writer and it behaves. It's the gap between *a property the code respects* and *a property the store guarantees*, which is the same structural-vs-procedural line DOC-2 draws.

## What recovery becomes

Detect (sha mismatch or a report) → `checkoutRevision(site, N)` → publish forward. The schema already anticipated this: `based_on` exists *"so that a forward-only rollback is self-documenting."* `checkoutRevision` is implemented and correct — it even refuses a dirty draft unless forced, and forcing it is the right answer here, because the draft is expendable. What's missing is only that it's wired to the **filesystem** store via the CLI. It needs a route and a control.

## Revised "build now"

1. Untrusted uploads off the builder origin + CSP/headers *(F1, F3, F4)*
2. Confirmation seam for irreversible operations *(F2)*
3. **Enforce revision immutability** — trigger on `site_revisions`; claim the id **before** writing bytes; refuse a `put` into an existing revision prefix
4. **Verify the `sha` on checkout** — smallest item here, largest ratio
5. **A restore control over the D1/R2 store** — checkout + publish forward
6. Route-gate inventory guard and granted-capability pin *(tests)*

Serializing publish behind the Durable Object that DOC-1 §7 already specifies moves to Next — it's a correctness/concurrency fix that items 3 and 4 make *visible* rather than silent, which is the right order.

Ready to file 1–6 as REQs, or to start on 3 and 4 — they're small, self-contained, and 4 is close to free.

<!-- xgd-turn id="027e8ad7-1d5b-4e49-b45f-ee56ef24782b-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T21:20:54.036028+00:00" -->
#### You
ok so version immutability enforcement seems worth building now.

What else needs to be built now? The current focus is to get a beta product ready for testing - that does not face the same level of real-world security threats as the final product - but again I am interested in what needs to be changed - or added in terms of specifications to any of the EPICs built or in-flight

<!-- xgd-turn id="027e8ad7-1d5b-4e49-b45f-ee56ef24782b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T21:23:22.570501+00:00" -->
#### Claude
Two quick checks before I answer, because the beta lens turns on what data the beta actually holds.

Both checks came back clean-ish — and one of them changes the beta list. Writing the beta posture and the per-epic amendments into the ticket.

Both sections are in the ticket. Here's the substance.

## What the beta lens honestly relaxes

Everything whose severity was carried by *an attacker choosing to show up*: the prompt-layer injection envelope, the published-site CSP, component-store digest pinning, security-event review, and the two structural guards (F5/F6 — cheap, but not blocking). They stay on the list; none is a beta blocker.

## What it doesn't — four categories, none needing an attacker

1. **Irreversible and unrecoverable effects.** Beta *raises* the accident rate — testers poke at things, and the assistant is one of the testers. A burned hostname and a lost revision both happen by ordinary mistake. This is a reliability argument before a security one.
2. **Real personal data.** No beta exemption in law, and the most exposed people are third parties: the *contacts* of the test businesses, who never agreed to be anyone's test data. Erasure and export are explained by the portal and performed by nothing — which REQ-183 §4.2 deliberately keeps honest on the page, and which needs a human able to actually do it.
3. **Reputation establishable only once.** Sending-domain reputation and the global `1stc.site` namespace are both *set* during beta.
4. **Decisions that get expensive to reverse.** The confirmation seam costs one operation today and three surfaces after EPIC-5 and EPIC-13. The PSL submission has weeks of external lead time.

## Beta blockers

| | Build |
|---|---|
| 1 | Revision immutability + `sha` verification + restore control — agreed, and it's the backstop that makes everything else survivable |
| 2 | Confirmation seam for irreversible operations |
| 3 | **F1's interim half only** — `attachment` outside a render-safe allowlist, `nosniff`, sandbox CSP on `/api/material/file`, plus `validateSvg` on ingest. **The separate origin defers**: it's a URL change, and material URLs aren't baked into published pages, so it doesn't get much more expensive later |
| 4 | F8 hygiene (`.dev.vars*`, Turnstile `hostname`) — minutes, and beta means more hands on the repo |
| 5 | *Not code:* a manual erasure/export runbook + the retention decision recorded |
| 6 | *Not code:* start the PSL submission — lead time, not effort |

One thing I checked that's already right: consent evidence has integrity. `user_acceptances` holds current value with a `CHECK`, history lives in `contact_events` — the one table with an immutability trigger. Correct split, needs nothing.

## Spec amendments — the highest-value ones

Full table is §5b. The four that save the most:

**EPIC-13 (Email)** — *Inbound mail may not write a contact's consent state, and its trust is a function of DMARC alignment.* An SMTP `From` is unauthenticated, so without this a spoofed sender attributes words — possibly an opt-in — to a real contact. The epic covers open-relay and destination verification but never says inbound content is *untrusted input*, and every capture and threading decision depends on that. Plus DKIM key and send-as SMTP credential custody.

**EPIC-5 (DNS)** — *answer open question 2 with the confirmation seam*: the assistant reads everything and **proposes**; MX/SPF/DMARC/DKIM/NS mutations are performed by a human on a rendered diff, never an unattended tool call. Your epic already calls those records "privileged" and asks exactly this question — answering it in the spec is what makes the AI tools designable at all.

**EPIC-16 (Staging/deploy)** — *staging may not hold production data, nor a credential that can write production D1 or R2.* If it ever holds real contacts, it **is** production. Cheapest possible moment; after a shared secret exists, separating them is a migration. F7's digest pinning belongs here.

**EPIC-12 (Duplication)** — *a duplicate crosses no business boundary, starts at revision 0, and carries no grants, tokens, sessions or synthetic markers.* Copying revisions would import another site's history and muddy both attribution and the immutability guarantee you're about to enforce.

Then: EPIC-4 (irreversible actions human-performed; PSL as a security control; cookie `Domain` never a customer apex), EPIC-9 (a grant is minted only from a signature-verified idempotent Stripe event — the billing webhook writes to *authorization*), EPIC-7 (a monitor reads, never writes), EPIC-14 (per-recipient limits, scoped links), EPIC-10 (attachments inherit F1's rule), EPIC-11 (contact content in a granted tool = AI-I7), EPIC-6 (transfer-auth custody; renewal failure is the largest single loss in the product), EPIC-15 (least-privilege credentials for synthetic runs), EPIC-8 (no metric crosses a business boundary).

Immutability enforcement is the one you've greenlit. Want me to scope it as a REQ and start — trigger on `site_revisions`, claim the id before writing bytes, verify `sha` on checkout — or apply the epic amendments first while the analysis is fresh?

<!-- xgd-turn id="1715dafc-1d71-4b37-a350-cf4f31f0885c-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T21:30:11.949898+00:00" -->
#### You
ok can you add security spec notes to 13, 5 , 16 and 12 and draft the immutability req please

<!-- xgd-chat-end -->