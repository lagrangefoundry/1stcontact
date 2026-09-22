---
uid: bug-f65d693a
id: BUG-137
type: bug
title: copied conversations keep the source side's session ids and are unreachable
created_by: EPIC-16
created_at: '2026-09-22T17:55:18.978851+00:00'
updated_at: '2026-09-22T18:11:28.326972+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  epic_parent: epic-96d8aca6
  chat_comment: comment-f0f472ad
---

`bin/copy-to-cloud --chats` ([[REQ-294]]) moves the conversations and leaves them
unreachable. The rows land in the right tenant, with their transcripts intact, and the
builder cannot show them because they are addressed to the **source** side's ids.

## Evidence

After copying Lagrange Foundry's history from the local builder to production, the
deployed business holds four `chat` tickets:

```
site-site_23c1afb3739dadf62347a5008e8a7dea      ← production site id   (native, empty)
business-biz_33086a94838ac8ad14cecbb919b525c2   ← production business id (native, empty)
site-site_936dd7c92e5e14df694dd9a80433aa4f      ← LOCAL site id        (imported)
business-biz_5b101742d436573a04a2512fb7ecdbb5   ← LOCAL business id    (imported)
```

A session id is derived from the thing it is about — `site-<site_id>` or
`business-<business_id>` — and `fields.session_id` is how `TicketSessionArchive` finds
a conversation ([[REQ-160]], [[DOC-10]] §8). Neither id survives the crossing:

- **the business id is minted independently on each side.** `bin/copy-to-cloud` matches
  businesses **by name** precisely because of this — its header says so — so the
  destination's business id is known to differ by construction.
- **the site id is minted fresh by the import.** Local Lagrange Foundry is
  `site_936dd7c9…`; the imported copy in production is `site_23c1afb3…`.

So every imported conversation names a site and a business that do not exist on the
destination. The builder asks for the destination's own ids, finds the empty sessions
it auto-created, and shows those. The operator sees no history and has no way to tell
that any arrived.

## Why the original ticket did not catch it

[[REQ-294]] required that *"tenancy is rewritten, not carried — `tickets.tenant_id`
names the source business and the destination resolves its own from the authorised
scope"*. That obligation was met: the rows are in the correct tenant. What it did not
say is that **`fields.session_id` carries the same two ids inside a string** and needs
the same treatment. A `tenant_id` column looks like an identifier and got rewritten; an
id embedded in a derived key did not.

## What the fix has to do

**Rewrite `session_id` on import**, mapping each derived form onto the destination's
own ids:

- `business-<source_business_id>` → `business-<destination_business_id>`. The import
  already resolves the destination business from the authorised scope, so this is
  known.
- `site-<source_site_id>` → `site-<destination_site_id>`. The destination site is
  knowable for the case that matters: `/api/export` already **refuses a business
  holding more than one site as ambiguity** rather than guessing, so within the shape
  this tooling supports the mapping is unambiguous. If that refusal is ever relaxed,
  this mapping needs an explicit answer rather than a first match.

**A session id whose form is not recognised must not be silently passed through.** A
conversation that arrives addressed to nothing is worse than one refused, because it
reports success and looks like data loss later. Refuse it, or carry it with a stated
rule, but do not let the current behaviour be the fallback.

**Decide what happens when the destination already holds the target session.** It will,
routinely: the deployed builder auto-creates an empty `site-…` and `business-…` session
the first time it is opened, which is exactly what happened here. REQ-294's merge rule
— *"one the far side already holds is KEPT and counted"* — is right for protecting real
turns and wrong against an auto-created empty one, which it would preserve in place of
the history being imported. Either treat a session with no turns as absent, or say
plainly in the output that `--force` is required and why. Silently keeping the empty
one reproduces this bug with a success message.

## Already-copied data

The conversations copied before this fix are present, in the right tenant, with intact
transcripts, under source-side session ids. Whatever the fix does, a re-run of
`--chats` should bring them into reach — and the stranded rows should not be left
behind as a second, invisible copy. Either the rewrite is idempotent over what is
already there, or the ticket says how an operator clears the strays.

## Done looks like

`bin/copy-to-cloud --chats "<business>"` followed by opening that business in the
destination builder shows the conversations that were copied, in the site and business
panes they belong to, with no orphaned rows left in `tickets`.