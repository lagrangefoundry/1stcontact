---
uid: comment-808ab9c9
id: COMMENT-3030
type: comment
title: Comment on epic EPIC-17
created_by: xgd
created_at: '2026-09-17T19:55:56.755356+00:00'
updated_at: '2026-10-29T17:55:18.466169+00:00'
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

<!-- xgd-turn id="1715dafc-1d71-4b37-a350-cf4f31f0885c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T21:35:00.660576+00:00" -->
#### Claude
Let me check one implementation detail the REQ depends on — whether the stored digest is recomputable from what `readRevision` returns.

Verification is genuinely a one-liner — `snapshotSha` takes exactly what `readRevision` returns, canonical JSON plus a byte key. Now the four epic amendments.

Note: EPIC-13 grew from 1074 to 1229 lines since I first read it — someone else edited it mid-session. I composed from the current content, so their edit is preserved. Applying:

Four epics amended. Now the immutability REQ.

Done — four epics amended and **REQ-266** drafted under EPIC-17 (`status: draft`, priority high, linked as an epic child).

## Security notes added

**EPIC-13 (Email)** — six clauses. The load-bearing one: *inbound mail is untrusted input and `From` proves nothing*, from which follows that inbound mail may never write consent state, that attribution is a claim recorded with its DMARC/DKIM/SPF alignment evidence, and that an unaligned message is captured as **unverified** rather than threaded onto the contact as their words. Then: bodies reach an assistant only inside a proven untrusted-content envelope (and a "summarise correspondence" tool is an injection sink, not a read-only capability); forwarding destinations come from configuration and never from the message; DKIM/send-as credential custody; and per-business quotas plus a complaint-rate breaker as **beta-time**, because reputation is established once.

**EPIC-5 (DNS)** — opens by answering open question 2 directly: *read freely, propose anything, perform no privileged mutation.* MX/SPF/DMARC/DKIM/NS go through a human on a rendered diff, enforced as a declared effect on the operation rather than prose — citing REQ-126's own reasoning that "the publishing rule went with the grant". Plus: no mutation without a snapshot (including non-privileged ones), zone-scoped credentials with no write credential on a read path, every zone write attributed to human/assistant/automation, and the SPF-merge rule recorded as the security control it also is.

**EPIC-16 (Staging/deploy)** — staging holds no production data, *and if it ever does it **is** production*; no credential shared across environments (the staging-binding-writes-production failure named explicitly); one non-human identity per environment; the F7 digest pinning with "refuse a deploy whose digest differs from the one the tests ran against"; secrets only via the hook; and a deploy that can answer version/digest/actor/when.

**EPIC-12 (Duplication)** — framed as a **drop list**, because a naive copy takes everything: no business-boundary crossing, revision 0 (copying `site_revisions` would break `published_by` attribution *and* the immutability guarantee REQ-266 establishes), no grants/sessions/chat transcripts/BFM markers — each with why a copy would plausibly take it — no contacts or correspondence, and a carry list so the drop list is testable.

## REQ-266, and one design decision worth your eye

The four gaps are: no trigger on `site_revisions`; bytes written before the PK that would refuse them; the digest stored and never verified; two publishes able to claim one id.

The non-obvious part is **how to claim the id before writing bytes without breaking the property that the log never names a 404**. My answer: reserve the id in a *separate* `site_revision_claims` table first, write bytes, and still insert the revision row last. A completion flag on the revision row itself would have forced `site_revisions` to accept an `UPDATE` — a hole in the trigger exactly the size of the thing it guards. `nextRevisionOf` then reads the union, so an abandoned claim is never reissued.

That also **resolves the corruption half of the publish race in the store**: the loser of the claim fails before writing a byte. So the Durable Object (§5c) stays worth building for ordering and stops being urgent — I've said so in the ticket rather than silently dropping it.

I deliberately left `DELETE` out: `UPDATE` rewrites history, `DELETE` removes it, and removal is something DOC-37 erasure will legitimately need. Instead there's a source-level assertion that nothing but `forget()` deletes a revision row — same idiom as the existing `TENANT_ID`-has-no-third-reader UAT. Flagging it in case you'd rather have the trigger and take the erasure problem on later.

Seven UATs are specified, each traced to a numbered clause, with the whole-ticket falsifier stated: *alter a published revision's bytes in the bucket and have anything in the product serve, check out, or report them as sound.*

Ready to cut the branch and implement REQ-266 when you want it.

<!-- xgd-turn id="173ff2bc-fe4b-41a1-a717-04e4a7cbe416-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T20:08:10.720937+00:00" -->
#### You
Can you validate that the PHP2Shell issue is not relevant to us? (you will need to do a web search on that term. I assume since we don't use PHP that it is irrelevant, yes? Are there any lessons for us in it?

<!-- xgd-turn id="173ff2bc-fe4b-41a1-a717-04e4a7cbe416-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T20:10:55.716656+00:00" -->
#### Claude
The repo has no PHP. Now I'm checking whether our Workers code holds state that carries over between requests, since that's one of the two PHP2Shell bugs.

The PHP side is settled. I found four caches at module scope in the control app; checking what each one is keyed by.

I have what I need. Adding a short note to the EPIC-17 threat model so the finding isn't lost.

Yes, PHP2Shell doesn't affect us. I checked the code rather than assuming. Of the lessons, one applies to our code directly, and our own codebase has already been bitten by that kind of bug once.

## Why it doesn't apply

PHP2Shell is two bugs in the PHP runtime itself (CVE-2026-109618 and -109619). Both are rated critical (CVSS 9.2). They let an attacker run code on the server with no login, on any server running PHP. The fixed releases are 8.2.35, 8.3.36, 8.4.27 and 8.5.12.

There's no PHP anywhere in our repo: no `.php` files, no `composer.json`, nothing that runs PHP. Every "php" string in the tree is either the Philippine peso currency code or a `facebook.com/profile.php` link. We run on Cloudflare Workers and static files, and patching that runtime is Cloudflare's job. Cloudflare had protective firewall rules out before the patch shipped.

**There is one indirect exposure.** Most of the customer sites we import or replace are WordPress, which runs on PHP, so many of them will be vulnerable. A compromised source site can serve hostile pages and images to our capture/import. The threat model already treats that path as untrusted input, and this advisory backs that up.

## Lessons for us

**1. State left over from one request and read by the next one. This is the main lesson.** The -109619 bug is leftover global state from one request being read by the next request in a long-lived PHP process. Workers have the same property: anything stored at module level survives from one request to the next. I listed the control app's long-lived caches. There are four, and three are clearly safe. The fourth is the chat-host cache, `CHATS`. Before REQ-168 fixed it, this exact leak happened here: a single module-level variable held the first caller's store, transcripts and knowledge base, and served them to every later caller. Even one operator switching between two of their own businesses could trigger it. It's now partitioned by business, and every request re-checks that the business is still active.

The gap is that nothing stops someone adding a fifth cache that isn't partitioned. The fix is cheap: a source-level test that lists every piece of module-level mutable state and fails unless each entry is on an allowlist with a stated reason it's safe. It's the same pattern as F5/F6.

**2. A feature that's on by default but unused is attack surface.** The -109619 trigger was `session.upload_progress`, a PHP setting that's on by default and that almost nobody uses. Our equivalent is F8's `workers_dev=true` on public-site.

**3. Running out of memory mid-operation left exploitable partial state.** That's the -109618 bug. It's the same kind of problem REQ-266 closes for publishing, by reserving the revision id before writing any bytes.

**4. Exploit code was public before the patch, and only supported versions got fixed.** That's the argument for F7: pin `@lagrangefoundry/*` to exact digests. We can't patch quickly if we can't tell which version we're running.

I've added this as §6 of the EPIC-17 threat model (ticket text only, no code). I put the guard test under Next, not as a beta blocker, because today's caches are all correct. Do you want it filed as a REQ?

Sources:
- [Help Net Security: PHP2Shell patched](https://www.helpnetsecurity.com/2026/10/21/php2shell-php-vulnerabilities-patched-cve-2026-109618-cve-2026-109619/)
- [The Hacker News: two critical PHP RCE flaws](https://thehackernews.com/2026/10/php2shell-two-unpatched-critical-php.html)
- [BleepingComputer: emergency patches](https://www.bleepingcomputer.com/news/security/php-ships-emergency-patches-for-critical-php2shell-flaws/)
- [Imperva: when PHP runs out of memory](https://www.imperva.com/blog/php2shell-vulnerability-updates/)
- [Cloudflare: WAF protections](https://blog.cloudflare.com/php-vulnerabilities-waf-protection/)
- [SecurityWeek: mass exploitation looms](https://www.securityweek.com/php2shell-mass-exploitation-looms-for-leaked-critical-php-flaws/)
- [Wikipedia: PHP2Shell](https://en.wikipedia.org/wiki/PHP2Shell)
- [Brandefense: CVE analysis](https://brandefense.io/blog/php2shell-php-rce-cve-2026-109618-109619/)
- [Cybersecurity News: public PoC](https://cybersecuritynews.com/php2shell-vulnerability/)

<!-- xgd-turn id="89d16836-81df-411d-9736-7c48a879eb5b-user" -->

<!-- xgd-chat role="user" ts="2026-10-29T16:53:06.396639+00:00" -->
#### You
I just removed the Cloudflare login protection from the main site and app so we are relying on our own cookies and login for security. Can you do a quick review to ensure that we didn't open any holes in that change?

<!-- xgd-turn id="89d16836-81df-411d-9736-7c48a879eb5b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-29T16:59:22.736865+00:00" -->
#### Claude
I'll start by finding the change itself, then work through what Access was covering.

I didn't find any holes. The narrowed Access setup is doing what REQ-475 intended, and I checked that against the live site as well as the code.

## Live checks against app.1stcontact.io

| Request | Result |
|---|---|
| `/`, `/api/businesses`, `/api/material/file` with no session | `401` from our app, not Cloudflare |
| `/sign-in` | `200`, our own page |
| `/api/admin/sites`, `/sign-in/access`, `/api/export`, `/api/chats/export`, `/b/x/api/admin/sites`, `/b/x/api/export` | Cloudflare challenge (`302` to the Access login) |
| Path tricks on the admin routes: uppercase, `//`, trailing `/`, a query string | All still get the Cloudflare challenge |
| `/api/admin%2Fsites` | Slips past Cloudflare, but our app answers `401` with no session. The app also re-checks platform ownership on every admin route. |
| `1stcontact-control-app…workers.dev` | Doesn't respond (`workers_dev = false`) |
| Sign-in preflight from a foreign origin | No CORS headers come back |

## What holds in the code

- **Access isn't trusted on public paths.** Without a session they return 401 or redirect to sign-in. A `cf-access-jwt-assertion` header there is never read, so a forged one gets nothing (`src/index.ts:508`).
- **Operator paths check the token themselves.** The Worker verifies the Access token's signature, audience, issuer and expiry, and fails closed if anything is missing.
- **No open-dev switch in production.** `ACCESS_DEV_OPEN` isn't set under `[env.production]`. Even in dev it does nothing while the Access settings are filled in.
- **The parts now open to the internet are the ones built for it.** Sign-in gives the same reply whether or not an email is known, is rate-limited per address, and only uses up a link on a POST. The email webhook requires a valid signature. Only invited people can get a session. The session cookie is `Secure; HttpOnly; SameSite=Lax`.

## Things worth knowing (none are new holes)

1. **Your inbox gets into every customer's builder.** As platform operator, a magic-link session alone lets you enter any business at delegate level through `/b/<id>/…`, and those aren't operator paths. That sounds like a downgrade, but your Access policy used One-time PIN, which also went to your email. The inbox was already the only thing guarding this, so nothing changed. If you want a stronger guard for operator access later, it would need a factor that isn't email.
2. **No per-IP limit or Turnstile on `POST /sign-in`.** Mail volume per address is capped, but someone could still script requests at the endpoint. Low priority for the beta.
3. **No security headers on the app** (HSTS, `frame-ancestors`). These were missing before as well. The `Lax` cookie blocks the main clickjacking risk, but HSTS is worth adding now that the app is public. It fits with the CSP and headers work already planned.
4. **Same-origin uploads (F1 in the threat model) are unchanged.** Only invited people can get a session, so this change doesn't widen who can upload.

One thing to confirm on your side: the old Access application's destination should now list only the operator paths. Any leftover bypass rules for `/sign-in`, `/sign-out` or the webhook can be deleted. The live checks above suggest that's already the case.

I haven't changed any code or tickets. Do you want the first three items added to the EPIC-17 threat model?

<!-- xgd-turn id="af7568d0-2bcf-4600-b03f-4b13ba3c5005-user" -->

<!-- xgd-chat role="user" ts="2026-10-29T17:42:29.728579+00:00" -->
#### You
Are our webforms protected from abuse? How?

<!-- xgd-turn id="af7568d0-2bcf-4600-b03f-4b13ba3c5005-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-29T17:43:52.008332+00:00" -->
#### Claude
Checking the public-site form handler and the sign-in form.

Turnstile's site key is empty in the production config, so I'm checking whether the live forms render the widget at all. I'm also checking the builder-preview path that skips Turnstile.

Yes. The public contact form has layered defences, and they fail closed: if any one is missing or can't be checked, the submission is refused rather than let through. The catch is that one of them isn't configured in production, so **the form on 1stcontact.io isn't taking any messages right now.**

## How the contact form is protected

The handler is `apps/public-site/src/lead.ts`. It runs these checks in order, cheapest first:

1. **Shape.** Only form or JSON posts are accepted; anything else gets `415`.
2. **Size.** The whole body is capped at 8 KB, checked against the declared length and again after reading. Each field is capped at 4,000 bytes, and the number of fields is capped too.
3. **Rate limit.** Cloudflare's limiter allows 20 submissions per minute, keyed on the site and the sender's IP. Nothing in the form body can change that key. It's set high on purpose, because a tight per-site cap would let a spammer block a business's real enquiries. When the limit is hit, the sender gets the normal "thanks" reply but nothing is stored, so bots can't tell they've been limited.
4. **Honeypot.** A hidden field that people never fill in. If it has a value, the sender gets the normal "thanks" reply and nothing is stored.
5. **Turnstile.** The token is checked server-side with Cloudflare. A missing secret, missing token or failed check is refused. So is a network error, so a Cloudflare outage doesn't open the form.
6. **Tenant.** Which business the lead belongs to comes from the URL, never from the form body, so a spammer can't send leads into another business's contacts.
7. **After capture.** Addresses that have bounced or reported us as spam are suppressed before we send anything to them.

The builder's draft-preview form skips the rate limit and Turnstile, because whoever uses it is already signed in. I checked that this is still sound now that the builder sits behind our own sign-in rather than Cloudflare Access. The skip is only on a route behind the app's sign-in. It's also limited to the signed-in person's own business, so the site in the URL can't reach anyone else's draft.

## What's wrong in production

- `TURNSTILE_SITEKEY = ""` under `[env.production.vars]` in `apps/public-site/wrangler.toml`. The live page has the Turnstile slot, but with no key in it and no Turnstile script loaded, so no visitor can ever produce a token.
- I sent one test post with no token to `https://1stcontact.io/api/lead`, and it returned `503 "This site cannot take messages at the moment."` That means either the `TURNSTILE_SECRET` secret or the lead-intake binding is missing too. Nothing was written.

So spam can't get in, but neither can real enquiries. To fix it, create a Turnstile widget for `1stcontact.io` and the customer domains, put its site key in the production vars, then run `wrangler secret put TURNSTILE_SECRET --env production` in `apps/public-site`. That's configuration, not code.

## Gaps worth knowing

- **The Turnstile hostname isn't checked** (item F8 in the EPIC-17 threat model). We read `success` but not the `hostname` Cloudflare sends back. The widget's domain allowlist in Cloudflare mostly covers this; adding the check is a few lines.
- **Nothing reads the message content.** The architecture policy lists AI spam detection and reputation checks, but neither exists. A person who solves Turnstile, or a paid solving service, gets through at 20 per minute per IP. That's acceptable for the beta.
- **The sign-in form on the main page** posts to `app.1stcontact.io/sign-in`. It has no Turnstile and no per-IP limit, only the limit on links per email address and the same reply for known and unknown addresses. Sign-in links are only ever emailed to invited people, so the realistic abuse is a modest number of unwanted sign-in emails to them.

Other forms I didn't trace in detail: the gated download goes through the same lead pipeline; the email webhook requires a signature; everything in the builder (feedback, invites, settings) needs a signed-in session.

I haven't changed anything. Do you want the Turnstile hostname check and the sign-in IP limit added to EPIC-17 as beta items, next to the configuration fix?

<!-- xgd-turn id="799b45cc-b27e-45cf-a9b4-6a015cadec90-user" -->

<!-- xgd-chat role="user" ts="2026-10-29T17:52:36.385194+00:00" -->
#### You
Can you create a ticket for adding security headers to the app (I assume this is straightforward)?

Can you also please add a ticket for the Turnstile hostname check and the sign-in IP limit?

Can you give me detailed specific instructions on fixing turnstyle

<!-- xgd-turn id="799b45cc-b27e-45cf-a9b4-6a015cadec90-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-29T17:55:17.045869+00:00" -->
#### Claude
I'll check how REQ-266 was linked to EPIC-17 so the new tickets match, and look at the ticket-CLI notes in memory.

Before writing the headers ticket I'm checking what a CSP would have to allow: inline scripts, iframes, and outside origins.

Both tickets are going in as drafts under EPIC-17, linked the way REQ-266 is.

Neither ticket shows up in the epic's children list automatically, so I'm adding them.

Both tickets are filed. Before writing the Turnstile steps I'm checking how public-site gets deployed, so the commands match your scripts.

I've filed both tickets as drafts under EPIC-17. Below are the Turnstile steps.

## Tickets

**REQ-485 — Control app: security headers on every response** (high priority, 3 points). It's mostly straightforward, with one part that isn't:
- **Straightforward:** HSTS, `nosniff`, `Referrer-Policy`, framing limited to our own pages (`frame-ancestors 'self'`), and a `Permissions-Policy`. All of these get set in one place on the way out of the Worker, so routes added later get them automatically.
- **Not quite straightforward: the Content-Security-Policy.** The builder has inline scripts in `chrome.ts`, `terms.ts` and `builder/people.js`, and those need hashes or moving into files. The builder also serves customer and captured pages on its own origin: previews, and material files via `/api/material/file`. Those can't inherit the builder's CSP, so the ticket gives them their own policy. The material-file policy is the sandbox CSP the threat model calls for (F1). The CSP ships in report-only mode first and is enforced after a clean beta session.

**REQ-486 — Forms: Turnstile hostname check and per-IP sign-in limit** (medium priority, 3 points).
- **Hostname check:** a token is only accepted if it was solved on the site the form was served from. A wrong host is refused exactly like a bad token.
- **Sign-in limit:** a per-IP rate limit on requesting a sign-in link. Someone over the limit gets the same "check your email" reply but no email is sent. If the limit isn't configured, the route refuses rather than running unlimited. Redeeming a link isn't limited, and neither is `/sign-in/access`.

## Fixing Turnstile

**What I found:** `wrangler secret list --env production` on the public-site Worker returns `[]`, so no secrets are set at all. `TURNSTILE_SITEKEY` is `""` under `[env.production.vars]`. Both halves are missing, which is why the form answers 503.

### 1. Create the widget (Cloudflare dashboard)
1. Go to **Turnstile → Add widget**.
2. **Name:** `1st Contact forms`.
3. **Hostnames:** add `1stcontact.io` and `1stc.site`. A listed hostname should also cover its subdomains, which would include every customer site on `*.1stc.site`. Confirm that in step 5 with a `*.1stc.site` page. Each customer's own domain has to be added as it comes on. The free plan allows 10 hostnames per widget, so you'll hit that ceiling after a handful of customer domains.
4. **Widget mode:** Managed.
5. **Pre-clearance:** No.
6. Click **Create**, then copy the **Site Key** (public) and the **Secret Key**.

### 2. Put the site key in config
In `apps/public-site/wrangler.toml`, under `[env.production.vars]`, replace `TURNSTILE_SITEKEY = ""` with:
```toml
TURNSTILE_SITEKEY = "0x4AAAA…your-site-key"
```
The site key is public and is meant to be committed. This is a config change, so it doesn't need a ticket. Send me the key and I'll make the edit if you like.

### 3. Set the secret
Run this from `apps/public-site`. Paste the value at the prompt rather than putting it on the command line:
```sh
cd apps/public-site
../../node_modules/.bin/wrangler secret put TURNSTILE_SECRET --env production
```
Setting a secret takes effect on the live Worker straight away, but the site key in step 2 only takes effect after a deploy.

### 4. Deploy
```sh
bin/deploy public-site
```

### 5. Check it works
- `../../node_modules/.bin/wrangler secret list --env production` (in `apps/public-site`) should list `TURNSTILE_SECRET`.
- `curl -s https://1stcontact.io/ | grep -o 'data-sitekey="[^"]*"'` should print your site key.
- Open `https://1stcontact.io/` in a browser. The widget should appear, and a real submission should show up as a lead.
- Do the same on one `*.1stc.site` customer page. That confirms the subdomain coverage from step 1.
- `curl -s -X POST -d 'message=x' https://1stcontact.io/api/lead` should now return 400 ("Please complete the verification") instead of 503.

If the browser submission still returns 503 once the secret is set, the lead-intake link from public-site to the control app is the next suspect, and I can trace it.

### 6. Optional
- **Dev:** Cloudflare publishes test keys that always pass: site key `1x00000000000000000000AA` and secret `1x0000000000000000000000000000000AA`. Using them lets local forms work without real challenges.
- **Make it hard to lose again:** the control app's secrets each have a script in `bin/deploy.d/secrets/` that runs at deploy, but nothing like that exists for public-site's `TURNSTILE_SECRET`. That's why its absence went unnoticed. A small script there would make a missing secret fail the deploy loudly. I can add it to REQ-486 if you want.
- **Also unset on public-site:** `GUTTER_SECRET`, which marks test submissions from synthetic checks. It's designed so that, when missing, those submissions are stored as real leads rather than refused. That's harmless, but it would matter once synthetic runs hit production.

<!-- xgd-chat-end -->