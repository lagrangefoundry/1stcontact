---
uid: request-b2e34a71
id: REQ-628
type: request
title: 'Pre-publish review: the critic''s findings are suggestions for the client
  to choose, never automatic changes'
created_by: EPIC-19
created_at: '2026-11-01T17:48:35.232260+00:00'
updated_at: '2026-11-01T18:22:13.140005+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-90c69806
  commits:
  - working_sha: 61ab35737bfaf968259bff539ebb6347b3cba303
    reconcile_sha: null
    main_sha: null
  - working_sha: 7a7f767aedcf57c450956ce69ef2992e244f2862
    reconcile_sha: null
    main_sha: null
  version: 0.2.731
  story_points: 3
---

## Why

Operator, 2026-11-01: "I would find it very frustrating to feel like the site was finished and have the critic trigger minutes of changes that I had not agreed to."

REQ-623 (queued for reconcile, body frozen) moves the AI's own review to before the first draft is handed over, removes reviews during refinement, and keeps the pre-publish review (`before_publish`, REQ-379/REQ-427). It doesn't say what happens to the pre-publish findings. Today a critique's findings are answered with `answer_finding` as `fixed`/`decision`/`dismissed`, and the consultant fixes and briefs builders on its own, so a client who considers the site finished can get minutes of unrequested changes when they press Publish.

## What

1. **Pre-publish findings are suggestions.** When the pre-publish review runs, the consultant doesn't brief or make any change from it on its own. It tells the client, in one short message, the few findings worth raising (at most three, most important first, each in a sentence with why it matters), and asks which, if any, they want done. Nothing changes until the client says so.
2. **Real faults are the exception, and are still asked about.** A finding that would break the published site for visitors (a broken link, a form that doesn't send, text that can't be read, something cut off on a phone) is raised first and labelled as a fault, with a recommendation to fix it before publishing. The client still decides; publishing isn't blocked.
3. **Recording.** Findings the client declines are answered `dismissed` with the client's words; ones they accept are fixed and answered `fixed`. Findings that contradict a recorded client decision (BUG-326) aren't raised at all.
4. **The host enforces it.** While a `before_publish` review's findings are open, a Delegate or site write that the client hasn't asked for in a message since the review is refused with "ask your client which of the review's suggestions they want first".
5. **Publish isn't held hostage.** The client can publish with findings unanswered; they're kept for later as suggestions.

## Test plan

- `test_UAT_FC_REQ-628_prepublish_findings_not_auto_fixed`: after a `before_publish` critique with three findings, a scripted consultant that delegates a fix without a client message is refused; its message lists the findings and asks.
- `test_UAT_FC_REQ-628_accepted_finding_fixed`: the client says "do the first one"; the Delegate for it runs and the finding is answered `fixed`; the others stay open.
- `test_UAT_FC_REQ-628_publish_with_open_findings`: publishing with findings unanswered succeeds.
- `test_UAT_FC_REQ-628_priming_says_prepublish_findings_are_the_clients_to_choose`: the consultant's priming says pre-publish findings are suggestions the client chooses, with faults flagged first, and that they can publish without answering.

All four live in `tests/test_UAT_FC_REQ-628_prepublish_suggestions.workers.test.ts` (real route in workerd, scripted model and fake browser at the edge).

## As implemented

- **The hold** (`critic-core.ts`): `suggestionsUnanswered(fields)` is the latest critique run when it is a review before publishing (or its re-check), has a finding unanswered, and has no `client_replied_at`. The host's `toolSet` refuses every call in `SITE_CHANGES` while it holds, answering `SUGGESTIONS_FIRST` ("Not run: ask your client which of the review's suggestions they want first…", with how to put them). `SITE_CHANGES` is `Delegate`, every operation in an `l1-surface.json` group with `effect: write` except `publish`, plus `set_design`, `choose_look` and `edit_image`. Reads, `answer_finding` and `publish` are never refused. Only the consultant's tool set is gated.
- **"Asked for in a message since the review"** is durable on the plan: `clientMessaged` (each client message, never a host cue) calls `clientRepliedToReview`, which stamps `client_replied_at` on a waiting pre-publish run. The client's first message after the review ends the hold. The host can't tell which finding a message asks for, so it doesn't try. The priming tells the consultant to fix only what the client takes up.
- **Nothing owed, publish not held:** `critiqueOwed` no longer lists a pre-publish run's findings, so the hand-back isn't held for them and the consultant hands back after asking. `publishCritiqued` now needs only that the review before publishing ran, so Ready to publish can be marked with findings open. The NOT_CRITIQUED refusal now says "call critique, put its suggestions to your client, and then set the stage again". The client's `POST /api/publish` never consulted findings and still doesn't.
- **No re-check of the client's choice:** fixing a high-severity finding of a pre-publish review no longer makes a re-check due.
- **Spend hold ([[REQ-438]]):** a pre-publish review's `held_until` ends when the client replies (`holdingReview` is null once `client_replied_at` is set). Spend on fixes the client chose afterwards is not tagged with the review.
- **What the consultant is told:** the `critique` tool's result for a pre-publish run is `PUBLISH_SUGGESTIONS` (`plan-core.ts`): at most three findings, most important first, each in a sentence with why it matters; a fault that would break the published site for visitors goes first, called a fault, with a recommendation to fix it before publishing; leave out anything that would undo a client decision; they can publish without answering; then `fixed` for what they take up and `dismissed` with their words for what they decline. The `critique` / `answer_finding` declarations in `plan-surface.json` and the `critique-continuation-cue` in `priming.json` say the same.