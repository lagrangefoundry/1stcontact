---
uid: comment-ea34dad3
id: COMMENT-3363
type: comment
title: Comment on bug BUG-130
created_by: xgd
created_at: '2026-09-20T22:07:43.319606+00:00'
updated_at: '2026-09-20T22:07:43.530669+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-05898428
  kind: chat_transcript
---

<!-- xgd-cli-session ts="2026-09-20T22:07:40Z" model="claude-opus-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-09-20T22:07:40Z" -->
#### You
I see a warning at the bottom of the page: ⚠ this bundle was taken by an older capture (schema 1, unstamped vs 4 today) — this is telling me I should use the recapture button, right? The trouble is both buttons, run again and recapture, are both grayed out and beachball?

<!-- xgd-chat role="assistant" ts="2026-09-20T22:07:40Z" -->
#### Claude
Two separate things, and the second is the defect.

On the warning: yes, recapture. All three references are unstamped (schema 1) against CAPTURE_SCHEMA = 4. [run again] re-folds from the bundle you already have, so an extractor-side fix cannot appear however many times you press it — the axes it added were never written to that bundle.

On the buttons: that is not a hang. `inert = state.running || state.held` in page.ts, and it is the second one. iteration-3/ai/outcome.json is status=filed, ticketId=REQ-271, and there is no implemented.json beside it, so heldBy() holds the loop. REQ-271 has in fact landed (ready_to_reconcile, v0.2.256) — you just never told the console. The ⏸ line immediately above 'continue this chain' has the [the implementation has landed] button; press that and both continuations come back.

The beachball is CSS, not work: page.ts:326 is `button[disabled] { cursor: progress }` — the same cursor whether a round is running or you have not released a hold. One state means wait, the other means your turn, and they look identical. That is why it read as a hang, and it is a real defect.

Second, smaller one: the hold text says '[run again] is held', but [recapture] carries data-held="1" too and is equally held. That wording predates BUG-120 grouping them — and it is worst in exactly this state, where [recapture] is the button that can help and the sentence is about the one that cannot.

One correction to what I said earlier about the rail: I had advised recording the baseline first. Having checked what recapture writes — bundleDir for all three iterations is storage/references/gigabytealchemy.ai/index — recapture overwrites one of the rail's own three references, so a bar recorded now would be stale for that reference the moment you press it. Release the hold, recapture, then record.

Want me to file a child bug for the two UX defects — disabled-means-two-things, and the hold naming only [run again]?

<!-- xgd-chat role="user" ts="2026-09-20T22:07:40Z" -->
#### You
yes please

<!-- xgd-chat role="assistant" ts="2026-09-20T22:07:40Z" -->
#### Claude
Filed as BUG-130 under EPIC-12, scoped to exactly those two defects.

Design decisions taken while scoping:

- The reason a control is inert goes into the MARKUP (data-inert="running" | "held"), not only into the stylesheet. Two reasons for one `disabled` attribute is what made the state unreadable; putting the reason on the element is what lets a test distinguish them instead of a human distinguishing cursors.
- The poller has to re-compute the reason, not just `disabled`. It re-enables buttons every second between reloads, so a reason set only at render time goes stale the instant a round ends — the same failure mode REQ-272 hit when the poller keyed on `running` alone.
- No tooltip. BUG-120 stripped title= from the continuation group on the grounds that a fact deciding whether a $7 round measures anything cannot live in a hover, and its UAT asserts the absence. The reason a control is inert is that same class of fact, so it stays in visible text plus the cursor idiom.
- Attribute ORDER matters: BUG-120's UAT matches /data-held="1" disabled/ as contiguous text, so data-inert is emitted after disabled rather than between them. Deliberate — the existing evidence stays valid.
- Scope held to the two defects offered. A third candidate — moving the ⏸ release block inside the continuation group so the explanation and the greyed buttons are one visual block — was considered and left out: it changes DOM placement that BUG-120 just settled, and was not what was agreed.

<!-- xgd-chat-end -->