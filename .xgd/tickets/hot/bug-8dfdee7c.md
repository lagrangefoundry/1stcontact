---
uid: bug-8dfdee7c
id: BUG-98
type: bug
title: A form promising several assets sends one identical message per asset
created_by: EPIC-10
created_at: '2026-09-16T00:46:39.704901+00:00'
updated_at: '2026-09-16T01:16:36.028127+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: high
  severity: medium
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-b3b262ab
  commits:
  - working_sha: f211f5f85221d37c2beadaf8749e1481eb0cf17f
    reconcile_sha: null
    main_sha: null
  version: 0.2.211
  story_points: 3
---

## Symptom

One submission of the XGD whitepapers form produced **two emails**, 386ms apart, to the same
address:

    00:12:25.463  xgd-whitepapers-5@westhead.me  subject "Your two XGD papers"  asset trust-the-code
    00:12:25.849  xgd-whitepapers-5@westhead.me  subject "Your two XGD papers"  asset xgd-experiment

The operator pressed the button once — the form is replaced by its success copy on submit, so
pressing twice is not available.

**The two messages are identical.** Same subject, same body, and the same link: the email page
declares only `cta_url` as a placeholder, and `gateUrl` memoises a single grant
(`gate ??= …`), so both carry the same URL. Nothing distinguishes them to the recipient.

## Root cause

`deliverForm` sends **one message per asset**:

    for (const asset of assets) {
      const state = deliveryState(history, delivered, asset.key)
      ...
      const rendered = renderCopy(template, { cta_url: await gateUrl(), asset_name: asset.name })

That was right when an asset *was* the message. [[REQ-241]] made assets a **set** and moved the
link from the artifact to a page listing them — its own words: *"With one asset the message
could link straight at the artifact; a form promising several wants to land the reader
somewhere that lists them."* [[REQ-247]] then made the message a page with its own declared
placeholders.

After both changes the unit of delivery and the unit of message have come apart, and the loop
still assumes they are the same. A form promising two artifacts through one set-style message
sends that message twice.

**The at-most-once ledger is not what is wrong.** It keys per asset and is satisfied: each
artifact was delivered exactly once. What is unguarded is the thing the recipient actually
experiences, which is a message.

## Fix

**Send one message per delivery, not one per asset.** A message naming `asset_name` is about a
single artifact and keeps a message each; a message that does not name it is about the set and
is sent once, carrying the one grant that opens all of it.

The template already declares which it is. `placeholders` containing `asset_name` is the
signal, and it is data the page already holds rather than a new setting.

The ledger records every asset the message delivered, so at-most-once per artifact survives:
a contact who received a set-style message for two assets has received both, and a later form
promising one of them does not send again.

## Test plan

`tests/test_UAT_FC_BUG-98_one_message.test.ts`:

- **The symptom**: a form promising two assets, whose message does not declare `asset_name`,
  sends **one** email on one submission. Today it sends two.
- A message that *does* declare `asset_name` still sends one per artifact, each naming its own
  — the case the loop was written for is not broken by the fix.
- The single message's link opens a gate granting **both** artifacts, not one.
- At-most-once survives: resubmitting sends nothing; a second form naming one of the two
  already-delivered assets sends nothing for it.
- A form promising one asset sends exactly one message under either template shape.
- A form promising none still sends its welcome once, keyed as it is today.
- The delivery events name every asset that went out, so `asset.sent` accounts for both
  artifacts even when one message carried them.

-