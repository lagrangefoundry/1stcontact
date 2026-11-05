---
uid: bug-a11a5d92
id: BUG-269
type: bug
title: 'Stages: the consultant''s own fix builds count as revision rounds, so Refining
  starts before the client has seen the first draft — and nothing makes the draft
  review the next step'
created_by: EPIC-19
created_at: '2026-10-24T03:01:34.392434+00:00'
updated_at: '2026-10-24T19:01:51.961526+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-95bc3b15
  story_points: 5
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-e9ed2513
  commits:
  - working_sha: b4ef9f7253520130a117f2c8608d99b25ed4c984
    reconcile_sha: null
    main_sha: null
  - working_sha: e43bf96065ddc419d47bbc61ae1692acd8640e3d
    reconcile_sha: null
    main_sha: null
  version: 0.2.616
---

## Symptom (Dina's Diner, 2026-10-24)

The operator:
- "It has advanced Refining but hasn't closed comps even though that's all done."
- "More importantly I have not been invited to look at or comment on the first
  draft."
- "The AI is pounding me for stories on the catering page."

What the plan shows (`plan-b85a4a40`):
- **Stages:** Getting to know you is done (REQ-432). **Looking at other sites,
  First draft and Refining are all `in_progress`.**
- **Refining was set by the consultant** at 01:24:59 (`set_stage refining
  in_progress`), during the critic's hold turn, before the client had seen the
  draft.
- `milestones.revision_rounds` is **4**, but the client gave no feedback on the
  draft. All four "rounds" were the consultant's own builds (two of them refused
  by BUG-266).
- **All four sites are sent**, but `visual_concept` is still `proposed`. The
  direction card was never hearted. The only prompt for it was one clause at the
  end of a long message ("heart it or correct it: [See the card…]"), so to the
  client the comparison board looks finished.
- After the draft, the consultant's replies asked for catering stories (the rally,
  the year), and none invited the client to look at the draft and say what they
  think.

## Causes

1. **Any builder run counts as a revision round.** `builderSessionCompleted`
   (`plan-core.ts` ~654) counts every builder session after the first as a
   revision round ("the host cannot tell a revision from any other piece of
   work"). `stageBehind` (~825) then reports Refining as expected ("revisions
   have started"), and the consultant obeys by ticking Refining. The fix builds
   for the critic's findings were treated as the client's revision rounds.
2. **Nothing makes the client's review of the first draft the next step.** The
   First draft stage's rule ("a real first version is in the preview and they
   have looked at it") is advice to the consultant, not a fact the host checks.
   Nothing on the agenda says "the client has not seen the draft yet", so the
   consultant carries on with content questions.
3. **The direction card is easy to miss.** It is the only thing keeping "Looking at
   other sites" open, yet nothing outside that one buried clause points to it.

## Fix

1. **A revision round starts with the client.** It counts only when the client
   has given feedback on the site (a message or Input action about the draft after
   having viewed it) and a build then changes the site in answer. The
   consultant's own fix rounds (critic findings, layout faults) are not revision
   rounds. `stageBehind`'s Refining expectation follows the new count.
2. **"First draft" ticks itself (REQ-432's mechanism):** it is done when the draft
   exists, **the client has opened View after it** (BUG-246's `opened-views`),
   and **the client has responded to it**. Until then:
   - **Refining cannot be started**: `set_stage refining` is refused with a reason
     ("the client has not seen and responded to the first draft yet"), like
     REQ-415's `NOT_LOOKED`.
   - **The consultant's agenda leads with it**: a Due line, "the client has not
     seen the first draft — show it (link) and ask what they think", sits at the
     top of REQ-428's agenda for the consultant and the talker until it is met.
     Other questions wait. The REQ-426 rule about one question at a time, by
     value, puts the draft first.
   - This pairs with REQ-444 (the switch to View and the "first draft is ready"
     line).
3. **The direction card is visible until agreed.**
   - While the direction is proposed and not hearted, the Comparison sites
     section's state reads "Agree the look" (not Complete), and "How you can
     help" carries its line (REQ-432 already specifies the line; make sure it
     shows).
   - The consultant asks for it in its own short message, with the link, not as a
     clause in a longer one.

## Test plan

`tests/test_UAT_FC_BUG-269_first_draft_review_comes_first.*`:

- Builder sessions after the first pass with no client feedback leave
  `revision_rounds` at 0, and `stageBehind` does not expect Refining. After the
  client's feedback and an answering build, the count is 1.
- First draft is not done until View has been opened after the draft and the
  client has responded. Then it ticks itself.
- `set_stage refining in_progress` is refused before First draft is done.
- The agenda (consultant and talker) carries the "show the first draft" Due line
  until it is met.
- With all sites sent and the direction proposed: the Comparison sites header
  reads "Agree the look", and How you can help shows its line. Hearting it closes
  "Looking at other sites" (REQ-432).
- Re-run the REQ-379/390 stage, REQ-432, REQ-428 agenda and REQ-427 critic UATs.
## Also observed: the Input board says "Comparison sites (Complete)"

With all four sites sent and the direction only proposed, the Input board's
section header read **"Comparison sites (Complete)"**, while the progress bar kept
"Looking at other sites" open. The board and the stage disagree because they are
computed from different facts. The header counts sites settled. REQ-432's stage
rule also needs `direction_agreed`.

**Rule:** a section is shown Complete only when everything the client owes in it
is done, using the **same facts** the stage rules use (`STAGE_FACTS`:
`sites_settled` *and* `direction_agreed` for Comparison sites; `notes_reacted`,
`position_confirmed` and `headline_chosen` for Stories). One computation feeds
the section header, "How you can help" and the stage tick, so they can never
disagree again.

Added test:
- All sites sent and the direction proposed: the header reads "Agree the look"
  (not Complete), and it reads Complete once the direction is hearted, at the same
  moment the stage ticks. The same agreement holds for Stories: one note
  unreacted keeps both the header and the stage open.

-