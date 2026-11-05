---
uid: bug-c8e64e08
id: BUG-306
type: bug
title: 'First draft: the host holds the first build until the hero''s signature effect
  is decided'
created_by: EPIC-19
created_at: '2026-10-28T01:29:51.118316+00:00'
updated_at: '2026-10-28T01:50:38.350461+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-7de137b7
  commits:
  - working_sha: ec2b643a9f705fa5d90d6a44ae0bd234fa1dbca9
    reconcile_sha: null
    main_sha: null
  - working_sha: 0aff7675a355dd77c950de95d7a6dbbf0df477ac
    reconcile_sha: null
    main_sha: null
  version: 0.2.690
  story_points: 5
---

## Why

Over three First-Draft-Test runs (Dina's Diner 6, 7 and 8, 2026-10-27/28), the consultant started the first draft without talking the hero's signature effect through with the client:
- **REQ-477** handed it the first-draft guide; it ignored it.
- **BUG-304** moved the conversation into the build and put an agenda item on the plan. On Dina 8, the talker never picked that item up.

The operator decided on 2026-10-28 that the host should enforce it. That reverses the 2026-10-27 decision recorded in REQ-477 ("no host check").

## What

**1. A host hold on the first build: no first draft until `signature_effect` is decided.**
- The first-draft `Delegate` is refused while the plan has no `signature_effect` decision that is **chosen** (with the option) or **declined** (parked), recorded in the client's words.
- "The first-draft `Delegate`" is the one REQ-448 and REQ-460 already hold: no first pass has landed yet.
- It slots into the existing ordered holds (design → structure → effect), with its own refusal text.
- **The refusal tells the consultant what to do:**
  - ask the client, in a message of its own, before building;
  - offer two or three effects suited to the hero photo, with its pick (DOC-75's first-draft guide has the patterns);
  - say how they'll see it once built;
  - record the answer with `set_decision signature_effect` and the client's words, then delegate.
- **A decline is final** for the first draft: the build goes ahead with no effect, and nothing asks again.
- **Only the first draft is held.** Later builds, revisions and the site's existing effect decisions are untouched.
- Under `bc`, the operator can answer for the client. The hold doesn't care who answered, only that a decision exists.

**2. The effect is built with the draft, not after it.**
- The first-draft brief includes the chosen effect and BUG-304's text-over-motion rules: the moving region kept clear of text and scrim, local contrast only, and checks at computer and phone widths.
- **Remove BUG-304's machinery for the first draft:**
  - the during-the-build agenda item;
  - the "hero pass before the hand-over" agenda line;
  - the hand-over's "still to come" sentence.
  Remove them, don't keep them alongside (replace, don't extend). The hand-over still names the effect and how to see it.
- **Rewrite DOC-75's first-draft guide** to match: ask before the build, record it, brief it with the draft.

**3. One guide per hand-over, still broken.**
- On Dina 8, the operator's `bc` turn at 2026-10-28T01:16:26Z still carried three guides (focus tasks, comparison board, design), with BUG-304's rule deployed (snapshot `b7e4a15516`). The plan's `guides_sent` shows `focus_tasks` and `design` at that instant.
- Find which path delivered them together. Suspects: a guide carried over from an earlier `in_call`, or the turn-start path not applying the rule. Make every path deliver at most one.

**4. The talker didn't carry the plan agenda.**
- On Dina 8 the operator reports that the talker never raised BUG-304's agenda item during the build.
- With point 2 the item goes away, but the talker is meant to read the same agenda as the consultant (REQ-428). Check whether it reads the agenda at all during a build.
- If it doesn't, fix it, or record here why not. Other agenda items (due checks, questions) depend on the same path.

## Test plan

- `test_UAT_FC_BUG-306_first_build_held_until_effect_decided`: with design and pages written and no `signature_effect`, the first-draft `Delegate` is refused, and the refusal names the effect conversation and `set_decision signature_effect`. After a chosen or declined decision is recorded in the client's words, the same `Delegate` goes through.
- `test_UAT_FC_BUG-306_hold_is_first_draft_only`: once a first pass exists, `Delegate` isn't held for `signature_effect`.
- `test_UAT_FC_BUG-306_no_during_build_effect_machinery`: with the first build running and no `signature_effect`, the agenda carries no effect item and no hero-pass line. The hand-over lead names the chosen effect.
- `test_UAT_FC_BUG-306_guide_asks_before_the_build`: DOC-75's first-draft guide says to ask before the build and brief the effect with the draft.
- `test_UAT_FC_BUG-306_one_guide_on_every_path`: replaying the Dina 8 01:16 plan state, the turn carries exactly one guide.
- `test_UAT_FC_BUG-306_talker_reads_the_agenda`: during a build, the talker's request carries the plan agenda the consultant's would (or this ticket records why not).
- Retarget BUG-304's tests that pin the removed agenda lines.

## What landed

**1. The hold** (`account-core.ts`, `plan-core.ts`, `host-core.ts`). New refusal `effect_first`, checked after `design_first` and `structure_first` in `reportingDelegationToolbox.delegate`, with the host's `effectUndecided` limit. `effectUndecided(fields)` is true while there's no `milestones.first_pass_at` and `signatureEffect(fields)` is neither chosen nor declined. `set_decision` already refuses `chosen`/`parked` on `signature_effect` without `client_said`, so a decision always carries the answerer's words, whether the client's or the operator's under `bc`. The refusal text says:
- ask the client in a message of its own;
- offer two or three effects suited to the hero photo, with a pick (the first-draft guide has the patterns);
- say how to see it ("Open in new tab" / "View on your phone");
- a no to one kind of motion isn't a no to this;
- record it with `set_decision` as `signature_effect` with `client_said`, then commission;
- a chosen effect is added to the brief by the host.

Once a first pass exists, nothing is held.

**2. Built with the draft.**
- REQ-463's `structureBrief` limit became `hostBrief`. It returns the structure line plus the new `effectBriefLine(fields)` for a brief that may build home.
- `effectBriefLine` is non-null only for a chosen effect before any first pass. It names the effect, says to build it on the hero with this draft, keeps the headline, other text and any scrim clear of the moving part, rules out a full-photo overlay (contrast local to the text), and lists `EFFECT_CHECKS` (BUG-304's four checks, renamed from `HERO_PASS_CHECKS`).
- **Removed:** `EFFECT_TALK_LINE`, `EFFECT_STILL_TO_COME`, `HERO_PASS`, `heroPassLine`, `effectAgenda` and the `hero_pass` task flow.
- The hand-over lead is `FIRST_DRAFT_LEAD + EFFECT_HAND_OVER` when the effect was chosen and the draft is unreviewed. Otherwise it is the plain lead.
- **DOC-75's first-draft guide is rewritten:** decide before you build, in a message of its own; record `signature_effect` with their words; the host holds the draft and adds a chosen effect to its brief; name it at the hand-over. "Use the wait" no longer mentions the effect, and "In the hero pass's brief" became "In the draft's brief". (The ticket first said BUG-305's rules. They are BUG-304's: BUG-305 covers the video join, padding and the logo.)
- **Replays:** `eval-builder.ts` `structureStamped` also stamps a case recorded before this rule with `signature_effect` parked, so replays aren't refused and gain no effect.

**3. Three guides at 01:16 — what happened.** The plan's change record (local D1 `ticket_changes`, plan v5 at 2026-10-28T01:16:26.767Z) shows `guides_sent` gaining `focus_tasks`, `comparison_board` and `design` in one write, with **no `passed` mark** on any of them. BUG-304's `settleGuides` always marks the guides it doesn't hand over as `passed: true`, and nothing strips that field on write. So that write came from the **pre-BUG-304** `settleGuides`, even though `.dev-snapshot` (b7e4a15516, deployed 01:11:52Z) contains the new one.
- The `dev-worker` wrangler process had been running since 23:59:26Z on an earlier snapshot. It printed "Reloading local server" at the deploy, but the turn ran the old code.
- The same explains point 4: the agenda item didn't exist in the code that ran.
- No delivery path hands over more than one guide in today's code. The turn start, a tool's result and the carried `in_call` guide all go through the one `settleGuides`. `test_UAT_FC_BUG-306_one_guide_on_every_path` replays Dina 8's 01:16 plan through the real host and pins it.
- **Operational fix:** after `bin/deploy --env dev`, run `bin/dev restart dev-worker access-sim public-site`.

**4. The talker and the agenda.** The talker reads it. A talker round is assembled with the consultant's reminder providers, `SITE_PLAN_PROVIDER` (`planReminder` → `agendaLines`) among them, plus `talker.discovery`. `test_UAT_FC_BUG-306_talker_reads_the_agenda` shows a real talker round beside a running round carries every `agendaLines` entry and the `### The site plan` entry. On Dina 8 the item was missing because the running code predated BUG-304 (point 3), not because the talker skips the agenda.

## Tests (as landed)

- `tests/test_UAT_FC_BUG-306_effect_before_the_first_draft.test.ts`: `no_during_build_effect_machinery`, `guide_asks_before_the_build`, `one_guide_on_every_path`.
- `tests/test_UAT_FC_BUG-306_effect_before_the_first_draft.workers.test.ts`, over the real routes in workerd:
  - `first_build_held_until_effect_decided`: refused `effect_first` with the guidance. Then chosen in the client's words, commissioned, with the effect line and checks in the builder's brief. Declined under `bc`: commissioned with no effect, and no effect on the agenda.
  - `hold_is_first_draft_only`: with a first pass, not held and no effect line, even with a chosen effect.
  - `talker_reads_the_agenda`.
- **Retargeted:**
  - BUG-304's suite: the talk-line, hero-pass and during-the-build guide tests are removed. It now covers the answer recorded in the client's words, `effect_brief_keeps_the_moving_region_clear` and `guide_keeps_the_movement_in_view`; `one_guide_per_turn` is unchanged.
  - REQ-448 and REQ-460 workers script the client's effect answer before the second Delegate.
  - REQ-452 and REQ-454 plan fixtures carry a declined effect.
  - `designWritten()` (d1-site-factory) also records the effect as declined.
- **Failing before and after** (same figures on clean xgd-working): REQ-295 (two), REQ-416 worker_and_talker (two), REQ-436 (one), REQ-458 (one), REQ-466 and REQ-473 (prompt budget 205136 / 209404), AC1058 (reconciliation-assistant-conversation), BUG-252 (one).