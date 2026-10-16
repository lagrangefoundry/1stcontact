---
uid: request-46d65625
id: REQ-399
type: request
title: 'Features question: functional capabilities only, tailored and raised by the
  consultant, who opens the conversation'
created_by: EPIC-19
created_at: '2026-10-15T16:48:49.453288+00:00'
updated_at: '2026-10-16T18:43:10.573716+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-03638c10
  commits:
  - working_sha: 36ee3c3e22b2c61a9aa060d3a792e4524fbf47b5
    reconcile_sha: null
    main_sha: null
  - working_sha: 1c51c9816e656023edbeee68901c00496678a010
    reconcile_sha: null
    main_sha: null
  version: 0.2.507
---

## What changes

Three changes to how the consultant learns what the site has to *do*, decided with the operator on 2026-10-15 after Charlie 3.

1. **The consultant opens the conversation.** Today the client has to speak first.
2. **The features question comes from her, in context.** Today it's seeded onto the panel the moment the plan is created, with no explanation.
3. **The list itself is disciplined.** It lists only things the site *does*, one capability per option, tailored to the business, laid out readably, and honest about what isn't built yet.

## Why

The current `feature_catalogue` in `plan-seed.json` mixes three kinds of thing:
- **Functional capabilities** that we build and operate: contact form, quote requests, booking, newsletter signup, payments, blog.
- **Content sections**: reviews, photos of past work, areas covered, prices, hours, FAQ. These are page structure, settled by the consultant from the comps and the trade, not a client checklist.
- **Non-choices**: click-to-call is always yes when there's a phone number.

It's also plumber-flavoured. And it appears before anyone has said anything, as a wall of options in one wrapping line. "News or blog posts" conflates three different things: an email newsletter, lasting articles, and short-lived announcements.

Only functional capabilities answer "what do we have to build" and "is the site finished", so only they belong in this question.

## Requirements

### 1. The capability catalogue

`feature_catalogue` in `plan-seed.json` is replaced by a list of **functional capabilities only**. Each entry has an id, a client-facing label, and an `available` flag. The starting list:

| id | label | available |
|---|---|---|
| `contact_message` | Visitors can send you a message | yes (contact-form module) |
| `quote_request` | Visitors can ask for a quote, with job details and photos | not yet |
| `booking` | Visitors can book or request an appointment | not yet |
| `online_payment` | Visitors can pay online | not yet |
| `newsletter_signup` | Visitors can sign up to your email newsletter | not yet |
| `blog` | You publish articles over time (a blog) | not yet |
| `notices` | You post short notices that expire, e.g. "Closed 24–26 Dec" | not yet |

The implementer confirms each `available` value against what the framework can actually build at the time of writing. The values above are a starting point, not a claim.

- **Content sections and click-to-call are removed** from the question. They're the consultant's to decide in the page structure.
- **An unavailable capability is still offered**, with **`[not yet available]`** after its label. Wanting it is recorded like any other answer, because that's the signal for what to build next. The consultant must never promise or build an unavailable capability. She says plainly that it isn't offered yet.
- **A free-text "Something else?" line** sits under the options. Anything written there is recorded on the answer and is never treated as a promise.
- **`available` is set in one place**, the catalogue. Shipping a module is a one-line flip there.

### 2. Tailored by the consultant, from a fixed list

The consultant doesn't invent options. When she posts the question she may:
- **leave out** capabilities that plainly don't apply;
- **tick in advance** the ones she expects, which the client can untick;
- **reword** a label for the business, e.g. "Patients can book an appointment". The underlying id is unchanged, so answers stay mappable to capabilities.

The plan operation she uses to post the question takes these three things. It refuses any option id that isn't in the catalogue.

### 3. Raised by the consultant, not seeded

- The `features` ask is **removed from the seeded `asks`** in `plan-seed.json`. A new plan has no features question.
- The consultant raises it **after she has some context**, typically after the opening "tell me about the business" and before the comps. She explains it in one line of chat, e.g. *"Before I build anything — a few things the site might need to do. I've ticked the ones I'd expect for a plumber; change anything that's wrong."* Then she posts the tailored question to the panel.
- Her priming and DOC-64 state this ordering. The `features` decision in the plan still exists and is settled from the answer.

### 4. The consultant speaks first

When a business's builder conversation is opened and the conversation is **empty**, the host starts an **opening turn with no client message**. The consultant introduces herself in one or two lines (DOC-66: no personal name, "I"), says how the session will run, and asks her first question about the business.

- It runs **once**: never on a conversation that already has turns, and never again on reload.
- A reload during the opening turn must not start a second one. The existing one-turn-at-a-time guard covers this and is relied on, not duplicated.
- It's recorded in the transcript like any assistant turn.
- It goes through the normal turn path, so spend tracking and the pending-turn record apply as usual.

### 5. Layout of a multi-choice question

A multi-choice question on the plan panel lists **one option per line**. Where the panel is wide enough for every label to fit unbroken, it uses **columns**. It never runs the options together in one wrapping line.

- The `[not yet available]` marker is visibly secondary: smaller and muted, but legible.
- The "Something else?" field sits under the list.
- This applies to every multi-choice question, not only this one. It keeps BUG-200's tick-then-Done behaviour.

## Out of scope

- Building any of the unavailable capabilities.
- The progress banner (REQ-398).
- The rest of the opening conversation's content beyond the introduction, which is a priming matter.

## Test plan

UATs `test_UAT_FC_<this ticket>_*`:

- **A new plan has no `features` ask.** The catalogue contains only the functional capabilities, each with an `available` flag, and none of the removed content items.
- **The consultant's question operation:**
  - accepts a subset, pre-ticks and relabels;
  - refuses an unknown option id;
  - stores answers by capability id, with relabelled options still mapping back.
- **On the panel:**
  - unavailable options render with `[not yet available]`;
  - the "Something else?" text is stored on the answer;
  - options render one per line or in columns, never as one inline run.
- **Opening a builder conversation with an empty transcript** produces exactly one assistant turn with no client message before it. Opening it again, or a conversation that already has turns, produces none.



## As built (2026-10-16)

- **Catalogue** (`plan-seed.json` `feature_catalogue`): the seven capabilities in the table above, each `{id, label, available}`. Only `contact_message` is `available: true`, because `contact-form` is the only functional module the framework builds today. A new plan has no `features` ask. Content sections and click-to-call are gone.
- **`ask_features`** (plan op, on the consultant's plan surface beside `set_ask`): takes `options` (catalogue ids, any subset), optional `ticked` (pre-ticks) and `labels` (id → business-specific wording), plus prompt/why. It refuses an id not in the catalogue. Answers are stored by capability id, so a relabelled option still maps back. The `features` decision is still settled from the answer.
- **"Something else?"**: a free-text field under every multi-choice question on the panel. What the client writes is sent as `other` with the answer and stored on it. It is never treated as a promise.
- **Panel layout** (`plan-panel.js`, `builder.css`): multi-choice options are listed one per line, in CSS columns when the panel is wide enough, and never as one inline run. An unavailable option has a smaller, muted `[not yet available]` marker. BUG-200's tick-then-Done behaviour is unchanged.
- **The consultant speaks first**: the session read returns `opening: true` only when the site's conversation has no turns, no live turn and no pending turn. The chat pane then calls `/api/ai/prompt` with `opening: true` and no text. The router asks the host for `openingText()`, which returns `null` (→ 409) once the conversation has started. Otherwise the host supplies the instruction (`priming.json` `opening-turn`) and the normal turn path runs: ledger, pending record, spend. The instruction is recorded as the turn's user message but filtered from the displayed transcript, so the client sees only her reply. A pending opening is never given back as the client's words. There is no opening in group-chat mode or on a conversation that isn't a site's own.
- **Priming and DOC-64** say she raises the features question herself, after the opening and before the comps, with a one-line explanation first. They also say she never promises or builds an unavailable capability.
- **Existing tests updated to the new intent**: REQ-364 asks-in-the-plan and the-panel-answers, REQ-379 consultant cadence, and REQ-386 (its question count relied on the seeded features ask, so the test now adds two asks of its own).

UATs: `test_UAT_FC_REQ-399_features_question` (catalogue, `ask_features` subset/pre-tick/relabel/refusal, answers by id), `_features_panel` (marker, Something-else stored, one per line/columns), `_consultant_speaks_first.workers` (one opening turn on an empty conversation, none on reopen or on a conversation with turns), `_pane_opens_the_conversation` (the pane starts the opening only when told to).