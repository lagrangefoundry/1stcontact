---
uid: request-9f48b7ff
id: REQ-465
type: request
title: 'Consultant prompt: audit the whole prompt (instructions and tool text) for
  duplicated, host-enforced, stale and contradictory text'
created_by: EPIC-20
created_at: '2026-10-26T01:49:41.771471+00:00'
updated_at: '2026-10-27T20:04:05.293730+00:00'
completed_at: null
last_field_updated: status
status: legacy_done
fields:
  priority: medium
  parent_uid: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-1600ab49
---

## Why

The consultant (Opus 5.5) reads about 242K characters of fixed prompt on every request: 119,372 of system text and 123,098 of tool definitions (First-Draft-Test Dina's Diner 4, `request_spend`, 2026-10-26). It has grown one bug at a time. Its largest authored sections are `plan-panel` (13.6K) and `conduct` (11.4K), out of about 43K across the consultant's own priming sections. Space has been found by trimming wording sentence by sentence (REQ-427, REQ-432, REQ-444, REQ-446, REQ-461) and by moving text into tool descriptions, which the BUG-129 count doesn't see.

Per-request cost isn't the driver. The fixed prefix is ~80K tokens, read from cache at ~$0.016 a request. The reasons to do this are:
- **quality:** contradictions and repetition dilute the rules that matter, and a stale rule can fight the host (as BUG-290's refusal text did);
- **cache rebuilds:** each full rewrite costs ~$0.64 at the 1-hour rate (BUG-291);
- **room:** new rules currently need someone else's text cut.

This mirrors DOC-68's second pass on the builder prompt, which produced BUG-272.

## What

A written audit, attached to this ticket as a doc, of everything the consultant's model sees on a captured live request: priming sections, projected surface manuals, tool descriptions, parameter text and per-turn tails. Each finding names:
- **the text** (section or tool, and a short quote);
- **the class:**
  - *duplicated*: the same rule in two or more places, saying which copy to keep;
  - *host-enforced*: a rule the host now enforces in code (a gate, a refusal or a validator), so the text only repeats it; name the code;
  - *stale*: describes behaviour or tools that changed or no longer exist;
  - *contradictory*: conflicts with another passage or with what the host does;
  - *builder/talker-only*: text the consultant can't act on;
- **confidence** (high, medium or low) that removing or merging it doesn't change the consultant's behaviour for the worse;
- **the pinning tests:** every UAT that asserts the text, found by grepping tests for distinctive fragments, and whether the AC behind it still needs the text or only its behaviour;
- **the size:** characters saved.

The output also proposes the cuts as one or more follow-up changes, high confidence first, in the shape of BUG-272: deletions and merges, leaving pinned behaviour intact.

## Out of scope

Making the cuts. They land in follow-up tickets once the audit is accepted. Changing the BUG-129 budget is the companion request filed beside this one.

## Acceptance

- The audit doc covers every priming section and every tool the deployment grants the consultant, using a captured request from a live build rather than a test session.
- Every high-confidence finding names its pinning tests and the AC each test serves.
- The proposed first cut lists exact passages, total characters saved, and the tests to retire or rewrite.


## Outcome (2026-10-26)

The audit is **DOC-70** (doc-75d67bfc). It was a written audit, so no code was committed and there is no free-coding commit.

- **Captured request:** the consultant's request for First-Draft-Test Dina's Diner 5, on dev snapshot 1f70f43828. It was replayed through the snapshot's own worker against a copy of the dev store. Its system and tools fingerprints (7d665817ab10ea78 / 4dcad336e385a6c3) match the live session's 50 requests, so it is byte-identical to a live build, not a test session.
- **Sizes:** 118,698 system chars, 127,833 tool chars (91 tools), and a 14,086-char per-turn tail.
- **Findings:** 169, each with its class, confidence, chars and pinning tests (TEXT or BEHAVIOUR, plus the AC/ticket the test serves).
- **Proposed first cut (Cut 1):** about 11.4K system chars from priming.json and in-repo manuals, all high confidence. The doc lists the exact passages and the tests to retarget.
- **Further high-confidence cuts:** about 5.4K of tool text in-repo (Cut 2); about 4.1K of system text needing per-role manual projection in the framework (Cut 3); about 5.4K of upstream text (Cut 4).
- **Grant changes for the operator to decide (Cut 5):** about 9K of tool text from tools the consultant doesn't call.
- **Contradictions:** nine need an operator decision, not a deletion.
- **Other defects found:** the 2,000-char plan-entry truncation and the stale DOC-47.
- **Working files** (gitignored): .xgd/tmp/req465/.


## Contradictions check (2026-10-27)

Checked DOC-70's nine contradictions against xgd-working after REQ-473 (`13e281fb4c`, DOC-73 v2 priming). `test_UAT_FC_REQ-473_no_contradictory_instruction_remains` passes (6/6 in that file).

- **Resolved in the priming / DOC-75 stage guides:** D-1 (build start: the material track; the commissioning line no longer ends with a story question), D-2 (options vs one proposal), D-3 (hand-over), D-4 (deleted), D-5 (the comparison board guide now records `visual_concept` proposed straight away, matching `CLIENT_COMPS_FINISHED_LINE`), D-6 (a headline must be agreed before the first draft, matching `headline_chosen`).
- **D-7 still open.** Priming rule 11 now says to file with ReportBug on your own initiative. The framework's Development tickets manual (`lagrange-framework/components/ai_ticketing/js/src/development_surface.json`) still says "Filing is not something to do on your own initiative". It is still projected to the consultant, unchanged and not overridden in 1stcontact. The REQ-473 test only scans priming and reminders, so it doesn't see it.
- **D-8 still open.** Rule 12 says checking delegated work isn't optional. The framework's Delegation overview (`delegation_surface.json`) still says re-inspecting moves tokens rather than saving them. Cut 4 / D20 didn't land.
- **D-9 still open.** `plan-core.ts` `agendaLines` is unchanged. While the draft is unseen it emits "Other questions wait until they have", then still emits `Due: ask the client …` lines for due checks. The 2,000-char `MAX_PLAN_REMINDER_CHARS` truncation is also unchanged. DOC-73 assigned this to a code fix (§E) that hasn't been made.