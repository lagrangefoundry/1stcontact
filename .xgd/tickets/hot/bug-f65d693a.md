---
uid: bug-f65d693a
id: BUG-137
type: bug
title: copied conversations keep the source side's session ids and are unreachable
created_by: EPIC-16
created_at: '2026-09-22T17:55:18.978851+00:00'
updated_at: '2026-09-22T18:11:28.544894+00:00'
completed_at: null
last_field_updated: body
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


---

## Decisions taken at implementation (BUG-137)

**The rewrite is the destination's, in `POST /api/chats/import`.** Not the CLI's
and not the export's: the destination is the only side that knows its own ids,
and it already resolves its own business from the authorised scope — this is the
same rule applied to one more value. It also leaves a `--backup` file
source-faithful, so one file can be imported into any destination.

**Addressing is RE-DERIVED, never patched.** `fields.session_id` and
`fields.backend` are both derived from a site key or a business id — `site-<k>`,
`claude+site:<k>` — by four functions in `host-core.ts` (`sessionIdFor`,
`businessSessionIdFor`, `siteBackendName`, `businessBackendName`). The import
reads which of the two a conversation is off its session id and then calls those
same four functions with the DESTINATION's id. Nothing is spelled twice, so the
mapping cannot drift from the minting — which is the class of bug this ticket is.

**`fields.backend` and the session-file header are re-addressed too.** This goes
past "rewrite `session_id`" above, and "done looks like" needs it. The carried
record embeds the source's ids in three more places: `fields.backend`
(`claude+site:<source site key>`), and inside the `chat_transcript` comment's
`<!-- xgd-session -->` header — `id` (the session id again), `backend` (the same
registry name) and `chat_ticket_uid` (the SOURCE's chat ticket uid). The manager
resolves `session.backendName` against its backend registry when it attaches and
throws on a name nobody registered, so fixing `session_id` alone would have moved
the failure rather than removed it: the conversation would appear in the right
pane with its composer frozen on *"Unknown backend
claude+site:site_936dd7c9…"*. `backend_ref` is cleared for
`NOT_PORTABLE_FIELDS`' own reason one layer down — it names a conversation on a
host that was running, and the destination was running nothing. The TURNS are not
touched: the header addresses, the turns are the record.

**A session id in no form this product mints is REFUSED — 409, nothing written,
every unreadable id named.** Chosen over "carry it with a stated rule" because a
conversation addressed to nothing reports success and reads as data loss months
later.

**Ambiguity is refused rather than guessed**, in the words `/api/export` already
refuses it. Three cases, all 409 with nothing written: the destination holds more
than one site; the payload names more than one source site (or more than one
source business); the payload carries a `site-…` conversation and the destination
holds no site at all.

**A destination conversation with nothing in it is treated as ABSENT.** This is
the answer to "decide what happens when the destination already holds the target
session". Empty means a blank engagement ledger and no comment carrying any
bytes, which is exactly the session the deployed builder auto-creates the first
time it is opened. Such a conversation is written whole WITHOUT `--force` and
counted `created` — the destination did not hold the conversation, only a
placeholder for it. A conversation carrying real content is still KEPT, because
the deployed builder is where the client actually talks and REQ-294's reason for
keeping it is unchanged.

**A row stranded by a pre-fix copy is archived.** A destination chat ticket
carrying the SOURCE-side session id this very import has just re-addressed is a
stray from a copy made before this fix; its content is being re-imported in the
same breath, so it is archived — the store's own removal, and every read above
storage is built over `archived: false`. Bounded to exactly the ids this import
re-addresses, so nothing else is ever touched. Counted as `strays` in the import's
answer and printed by `bin/copy-to-cloud` when it is not zero. A re-run is
therefore idempotent over what a pre-fix copy left behind.

**REQ-294's own UATs are updated rather than worked around.** They seeded session
ids (`sess-a`, `sess-shape`) in a form this product never mints, which is why its
round trip could pass while the ids it carried addressed nothing. They now seed
real derived ids and assert the re-addressing. BUG-137 supersedes REQ-294's
*"one the far side already holds is KEPT and counted"* for the empty case only;
the rule is otherwise unchanged.

## Test plan

`tests/test_UAT_FC_BUG-137_chat_readdress.workers.test.ts` — in workerd, over a
real D1, through `route()`:

- a site conversation and a business conversation exported from one business and
  imported into another land under the DESTINATION's derived ids, with
  `fields.backend` and the session-file header re-derived and `backend_ref`
  cleared, and the turns byte-identical;
- an auto-created empty session at the target id is written over without
  `--force` and counted `created`, while one carrying turns is still kept;
- a row left under a source-side id by a pre-fix copy is archived, so the
  business ends up holding the history once and reachable;
- a session id in no recognised form is refused 409 with nothing written;
- a destination holding two sites, a payload naming two source sites, and a
  `site-…` conversation arriving at a business with no site are each refused 409
  with nothing written.

`tests/test_UAT_FC_REQ-294_chats_copy.workers.test.ts` and
`tests/test_UAT_FC_REQ-294_chats_command.test.ts` — updated for the derived ids
and the `strays` count.
