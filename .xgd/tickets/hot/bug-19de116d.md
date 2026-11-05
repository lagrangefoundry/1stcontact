---
uid: bug-19de116d
id: BUG-326
type: bug
title: 'Client decisions: a rejection is recorded at once, binds every builder brief,
  and a fix that would undo it goes to the client'
created_by: EPIC-19
created_at: '2026-10-31T23:12:26.549156+00:00'
updated_at: '2026-11-04T19:01:13.806026+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-af9dba66
  commits:
  - working_sha: 70e49012387e0abf8e6c68c93062fdaf94e7e750
    reconcile_sha: null
    main_sha: null
  - working_sha: c5f9e81ccc634f9d8609282f5941d87ed24ef773
    reconcile_sha: null
    main_sha: null
  version: 0.2.723
  story_points: 5
---

## Symptom

Production, 2026-10-31, Ariel's Arc Welding home hero (`site_be615746320df3268946af454ff075e2`, plan `plan-ef108d8d`). The client rejected the translucent shaded box over the Old Scratch photo. The Site consultant removed it, then put a smaller one back. The client: "I'm very confused, we agreed you were going to remove the translucent shaded box, and you did and now you have put it back — what is going on?"

Sequence (consultant tool transcript):
- 22:35:30 Delegate: "Remove the solid/translucent box fill from `hero-text` entirely. No rectangle over the photo." Done.
- 22:40:58, 22:46:16, 22:46:35 Delegates: "Do NOT add any fill, box, scrim or tint behind the text — the client rejected shading over the photo."
- 22:49:26 Delegate: with no shading, the lead and small text read poorly over the lit shop doorway, and the consultant wanted the trust line inside the first screen. **It briefed "a dark, partly transparent panel … behind the text block only"**, reasoning that a local panel isn't the rejected box. Repeated at 22:49:44, 22:51:26, 22:51:55 and 22:59:59. The client wasn't asked.
- 23:07:22, after the complaint: first `record_decision`, "No box or panel of any kind behind the home hero text over Old Scratch, not even a local one", and a task to remove it.

## Root cause

1. **The rejection was never a recorded decision until it had been broken.** It lived only in the conversation and in the consultant's own briefs, so a competing goal (readability, fitting the first screen) could reason it away.
2. **A fix that conflicts with the client's choice is resolved by the consultant alone.** The readability problem was real; the move that respects the client is to bring it to them with the options.
3. **Nothing mechanical caught the result.** REQ-622's `covered_subject` check (not built yet) would have flagged the panel over the trident and arm.

## Fix

1. **A rejection is recorded at once, in the client's words.** When the client rejects or reverses something (a look, an element, an effect, wording), the consultant records it with `record_decision` (decision, the client's quote, what was rejected) in the same turn and before it briefs any change. The consultant's priming says so in one line. The host backs it: a Delegate in a turn whose client message is a rejection with no decision recorded that turn is refused with "record the client's decision first" (a classifier over the client message is acceptable, e.g. the talker's; it should err towards asking).
2. **Recorded decisions bind every builder brief.** Each Delegate brief gets the recorded client decisions that bear on the pages or sections in its scope, appended by the host under "The client has decided:", so they don't depend on the consultant remembering to restate them. The builder's priming says a brief that contradicts one of these is a brief to refuse and report, naming the decision.
3. **A fix that would undo a decision goes to the client.** If what the consultant is about to brief contradicts a recorded decision, it doesn't brief it: it tells the client the problem and the options in one short message (for the hero: move the text, enlarge it, or a faint panel), and waits for their choice. A smaller or partial version of what they rejected counts as what they rejected. The priming says this, with this case as the example.
4. **REQ-622** catches overlays covering a picture's subject mechanically; this ticket doesn't duplicate it.

## What changed

- **`record_decision` takes the client's words and the files they bear on.** Two new optional params: `client_said` (the client's words) and `applies_to` (draft file names as `Delegate`'s scope names them, e.g. `home.json#hero`). An entry with `client_said` is written with `**The client said:** "…"` and `**Applies to:** <files>`, or `every page` when no files are named. Only `record_decision` writes the `Applies to` line, so the plan's own decision entries (the look, the structure, the signature effect) are not affected.
- **The host holds builds after a rejection until it is recorded.** At the start of each client message (host cues are not client messages and leave the flag as it was), a lexical classifier (`rejectsSomething`, ledger-core) decides whether the message turns something down: removing, disliking, reversing, "put it back", "we agreed", "too dark", "no box", and so on. It errs towards yes. While the flag is set, `Delegate` is refused with `decision_first`: "Your client's message turns something down, so no builder was commissioned and nothing ran. Record the client's decision first, with record_decision …", which also says that a fix bringing back any of what they rejected, a smaller or partial version included, goes to the client with the options. A successful `record_decision` clears the flag. The next client message that turns nothing down clears it too.
- **Recorded client decisions are appended to every brief they bear on.** The host's brief lines (the existing `hostBrief`) now also get, for any brief and not only home briefs, the client decisions whose `Applies to` files meet the brief's scope (compared by file, so `home.json#hero` meets `home.json`), plus every `every page` decision. They go under "The client has decided:", newest 12 kept, one bullet each: the decision, "They said: …", "Rejected: …". The block ends with "These hold over this brief. Build nothing that contradicts one, a smaller or partial version of what was rejected included: leave that part unbuilt and say in your report which decision it contradicts." A brief whose scope is only other files gets none of them.
- **Builder priming** (both builder_priming variants, "What you are here for"): a brief may end with "The client has decided:". Those hold over the brief itself, and a brief asking for something one of them rules out (a smaller or partial version included) is a brief to refuse, not to follow: leave that part unbuilt, build the rest, and say in the report which decision it contradicts.
- **Consultant priming**, rule 3 ("Never undo something your client chose"): when they turn something down, record it with record_decision in their words that turn, before you brief any change. A fix that would undo the client's decision goes to the client: tell them the problem and the options in one short message, and wait for their choice. A smaller version is the same thing, with this incident as the example (a "faint panel behind the text only" after the shaded box was rejected; options: move the text, enlarge it, or a faint panel).

## Design decisions made during implementation

- **The classifier is lexical, not a model call.** The ticket allowed any classifier that errs towards asking. A false yes costs the consultant one `record_decision`; a false no is the incident. It runs only on client messages that start a consultant turn. A message answered by the talker beside a running build is not classified; the talker cannot Delegate.
- **Scope matching uses `applies_to`, not text matching.** A decision names its files explicitly. A decision with no files applies to every brief.
- **Any successful `record_decision` clears the hold**, not only one with `client_said`. The refusal tells the consultant what to put in it. A message that the classifier wrongly flags is cleared the same way.
- An existing suite (BUG-296) sent "Now take the Work page away again." and then Delegated. The new hold refuses that correctly, so the prompt was reworded to "Now finish the Work page.". That suite tests scope release, not the client's words.
- REQ-622's `covered_subject` check is unchanged, as the ticket says.

## Test plan

- `tests/test_UAT_FC_BUG-326_client_decisions_bind_every_brief.workers.test.ts` (real routes in workerd, scripted Anthropic client):
  - `test_UAT_FC_BUG-326_rejection_needs_a_decision`: the client's actual complaint from the incident; a Delegate before `record_decision` is refused `decision_first` naming the rule. After `record_decision` (decision, client_said, rejected, applies_to `home.json#hero`), the log holds the client's words and files, and the Delegate runs. A following message that rejects nothing Delegates unrefused.
  - `test_UAT_FC_BUG-326_decisions_appended_to_brief`: with the decision recorded, a brief scoped to `home.json` carries "The client has decided:", the decision, the client's words and what was rejected. One scoped only to `menu.json` carries none of it.
  - `test_UAT_FC_BUG-326_contradicting_brief_refused_by_builder`: a brief asking for "a dark, partly transparent panel behind the hero text block only" reaches a builder whose priming has the refuse rule and whose brief has the decision beside it. The builder's report naming the decision reaches the consultant with `wrote: false`. The builder is scripted, so this proves what it is given and what comes back, not what a live model would choose.
- `tests/test_UAT_FC_BUG-326_client_decisions_bind_every_brief.test.ts`:
  - `test_UAT_FC_BUG-326_consultant_priming_sends_the_fix_to_the_client`: the consultant priming (with and without corpus) contains the record-first rule, the "a fix that would undo the client's decision goes to the client" rule, "A smaller version is the same thing", and the hero example.
- Regression: every node and workers suite touching Delegate, the ledger, record_decision or priming. All pass except failures already present on clean xgd-working (REQ-295 ×2, REQ-342 ×3, REQ-416 ×3, REQ-436, REQ-458, REQ-466, REQ-473, AC1058, BUG-252, REQ-361, REQ-378, REQ-472 ×2). REQ-466/REQ-473 (consultant authored-prompt budget, cap 205,000) were 211,860 on clean xgd-working and are 212,726 with this change. The +866 is the rule-3 text.