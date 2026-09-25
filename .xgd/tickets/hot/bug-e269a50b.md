---
uid: bug-e269a50b
id: BUG-140
type: bug
title: 'repro console / xgd: the round is told to append to an existing class ticket,
  and all five such tickets are frozen against appends'
created_by: repro-console:repro-gigabytealchemy-ai#5
created_at: '2026-09-23T02:35:21.574251+00:00'
updated_at: '2026-09-23T02:35:21.574251+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  defect_class:
  - harness
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-baa4f6c7
---

Found by loop 1, iteration **5** of `repro-gigabytealchemy-ai`.

**Residual class:** `append-to-an-existing-class-ticket-is-refused-for-every-class-ticket`

**`defect_class: harness`** — this is the round's own process and the ticket CLI, not the
reproduction engine. Nothing about the reproduction changes if it is fixed; what changes
is whether a round's re-measurement reaches the ticket it belongs to.

## What the round is told to do

The console's prompt (`/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-5/ai/prompt.md`, "Classes that already have a ticket") says:

> If your diagnosis is one of these, **append to that ticket** and report
> `"status": "appended"` naming it. Do not file a second one.

…and lists five: REQ-265, REQ-269, REQ-270, REQ-271, REQ-302.

## What actually happens

```
$ xgd ticket append REQ-302 --file /tmp/req302-append.md
Error: ticket is in the reconcile pipeline (queued at ready_to_reconcile or beyond);
       body/title are frozen
  field: body
  condition: status in [ready_to_reconcile, bundled, reconciling, free_and_reconciled]
  ticket_type: request
  status: ready_to_reconcile
```

And this is not one unlucky ticket — it is **all five**:

```
$ for t in REQ-265 REQ-269 REQ-270 REQ-271 REQ-302; do
    printf "%s " $t; xgd ticket get $t | grep -m1 "^Status:"; done
REQ-265 Status: ready_to_reconcile
REQ-269 Status: ready_to_reconcile
REQ-270 Status: ready_to_reconcile
REQ-271 Status: ready_to_reconcile
REQ-302 Status: ready_to_reconcile
```

The freeze is correct and deliberate — a ticket being worked must not have its body move
under the implementer. The defect is that the instruction and the store disagree, and the
disagreement is total: **every** ticket the round is told it may have to append to is in a
state that refuses an append. A round that follows the instruction literally gets an
error; a round that files instead is told it filed a duplicate.

## The second half: the round marker cannot ride on the fallback

The working route is a comment, and `add-comment` has no `--created-by`:

```
$ xgd ticket add-comment REQ-302 --kind note --created-by 'repro-console:…#5' --body-file …
xgd: error: unrecognized arguments: --created-by repro-console:repro-gigabytealchemy-ai#5

$ xgd ticket add-comment REQ-302 --kind note \
    --fields '{"created_by":"repro-console:repro-gigabytealchemy-ai#5"}' --body-file …
Created comment: COMMENT-3671 (comment-25c71903)

$ xgd ticket get COMMENT-3671 --json | …
frontmatter.created_by              = xgd
frontmatter.fields.payload.created_by = repro-console:repro-gigabytealchemy-ai#5
```

So the marker the console reads back (`created_by`) says `xgd`, and the round's identity
survives only inside the comment payload and in the body text where the round wrote it by
hand. The prompt is explicit that a missing `--created-by` is a reported defect
("the console reads it back and reports the ticket that does not carry it"); on the append
path there is no way to supply one.

## Right

Any one of these closes it; the first is the cheapest:

1. **Say so in the brief.** Name the comment as the append route —
   `xgd ticket add-comment <id> --kind note --body-file <f>` — and say that a ticket at
   `ready_to_reconcile` or beyond cannot take a body append, so a comment is the append.
   Then `"status": "appended"` is achievable by construction.
2. **Give `add-comment` a `--created-by`,** written to the comment's own frontmatter, so a
   round's identity survives on the only route it is allowed to take.
3. Or let `append` write into a dedicated, unfrozen section of a pipeline ticket.

## What this round did

Appended the iteration-5 re-measurement of REQ-302's issues 2 and 4 as **COMMENT-3671**
on REQ-302, with the round marker in the payload and named in the comment's own first
line, and reported the gap ticket it did file ([[REQ-308]]) separately. Both facts are in
the round's closing block rather than one being silently dropped.