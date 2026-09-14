---
uid: comment-d842395c
id: COMMENT-2965
type: comment
title: Comment on request REQ-238
created_by: xgd
created_at: '2026-09-14T03:05:51.392464+00:00'
updated_at: '2026-09-14T04:14:51.341368+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-2ac88003
  kind: chat_transcript
---

<!-- xgd-turn id="3d0437ba-9f2d-4d5e-9634-8e27b29815a0-user" -->

<!-- xgd-chat role="user" ts="2026-09-14T03:05:06.044996+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="3d0437ba-9f2d-4d5e-9634-8e27b29815a0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-14T03:10:47.162545+00:00" -->
#### Claude
I've read the ticket, [[DOC-45]] §§3–7, [[TODO-6]], and the code it lands in (`business.ts` / `settings-core.ts` / `settings-surface.json` from REQ-237, `publish.ts`'s `templateRefusal` seam, `0007_business_name_unique.sql`, `routes.ts`). The shape is clear and I'm ready to build. Four questions where different readings would produce materially different work — each with what I'll do if you just say "your call".

**1. Is serving-by-host in scope, or only the record?**

[[DOC-45]]'s order of work says §4 (deleting the `/site/<key>/` grammar) is *"an acceptance criterion of (2), not a separate ticket"* — and (2) is this ticket. But REQ-238's own Behaviour list doesn't mention it, `public-site` has no D1 binding, and wildcard DNS + the `*.1stc.site` certificate are still open operator items in [[TODO-6]] §5.

**Recommendation: out of scope here.** This ticket ships the mapping table, `check`/`claim`, and the publish gate. Host→site resolution and the deletion of the path grammar become their own ticket, blocked on TODO-6's DNS/cert items — otherwise we'd delete the only address that resolves and replace it with one that doesn't.

**The consequence to be aware of either way:** the publish gate lands now, so from that commit a site cannot be published until a hostname is claimed, and a claimed hostname won't resolve until the DNS work lands. That's what the ticket asks for and nothing is published today, but it is a real "publish stops working" moment and I'd rather name it than have you find it.

**2. Revocation — day one, or not yet?**

[[TODO-6]] §2 says *"Revocation must exist from day one"*; REQ-238 says a hostname we want gone *"can only be revoked by us — an operator action, not self-service"*, and §5's table carries `status`. Finality is exactly what creates the need.

**Recommendation: include it, minimally** — the `status` column, every read filtered to `active`, and a platform-operator-only route that flips one row to `revoked`. It is not an update to `host` (the falsifier), it's the safety valve the finality rule makes necessary, and a revoked host is never re-issued. If you'd rather keep this ticket to what its Behaviour section literally lists, I'll ship the column and the filter and leave the flip unbuilt.

**3. The row names the site; the "one at a time" rule is per business — confirming.**

§3 says a host names a site, §7 says a business holds at most one `1stc.site` label at a time. Today those coincide (one site per business). I'll implement §5 literally — `site_domains.site_id` — and enforce "one platform label" by refusing a second `platform`-kind claim anywhere in the business. The publish gate then asks *does the site being published have at least one active address*, over `kind`, so the day custom domains land the check needs no edit. No answer needed unless you disagree.

**4. No UI in this ticket — confirming.**

The Settings pane is REQ-239's. So this ticket ships: the record module, two HTTP routes (`check` and `claim`, owners-only, business-scoped like `/api/business/name`) so the falsifier *"a route to claiming a hostname that exists only inside a conversation"* is closed without waiting on the pane, and the two operations plus their refusals in `settings-surface.json` — where the "this is the whole host `alice.1stc.site`, and it cannot be changed" prose lives as the declaration's own words. The pane renders it in REQ-239.

One thing I'll do without asking, flagging because it's a technical consequence rather than a request: the gate goes in `publishSite` itself via an injected seam (exactly `templateRefusal`'s shape — absent means unchecked, so `1c publish` against a directory is untouched), and I'll thread it to the assistant's own `publish` tool as well. Gating only the `/api/publish` route would leave the assistant able to publish a site with no address, which is the falsifier.

<!-- xgd-turn id="04af978c-e7a9-4ce9-baf5-8e5829a8f57a-user" -->

<!-- xgd-chat role="user" ts="2026-09-14T03:44:45.897492+00:00" -->
#### You
Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="04af978c-e7a9-4ce9-baf5-8e5829a8f57a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-14T04:14:50.271517+00:00" -->
#### Claude
Good — I have what I need. Cutting the branch.

Now the migration.

Now the publish gate itself.

Now `host-core.ts` and `ai.ts`.

Now the router: chatHost wiring, the publish route gate, and the three hostname routes.

Now the path constants and the routes.

Good placement. Now the publish route gate.

Now the settings surface: declaration + deps + operations.

Now `settings-core.ts` — deps, operations, grant.

Now the operations themselves in `settings-core.ts`.

Now wire `businessSettings` in `business.ts` to supply the three new deps.

Now the REQ-194 role-literal scan.

Now the workers suite.

Now the REQ-238 UATs themselves.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-chat-end -->