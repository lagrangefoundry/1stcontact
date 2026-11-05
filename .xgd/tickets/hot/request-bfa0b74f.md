---
uid: request-bfa0b74f
id: REQ-473
type: request
title: 'Site consultant: replace the priming with the v2 instructions (DOC-73)'
created_by: EPIC-19
created_at: '2026-10-27T15:28:17.739820+00:00'
updated_at: '2026-10-27T16:46:49.346514+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-bc06c619
  commits:
  - working_sha: 13e281fb4cd142de13bc63d356bd42343572ceb6
    reconcile_sha: null
    main_sha: null
  - working_sha: 5499a90ea93e2e65e9c248f0a84563c31b3eaae2
    reconcile_sha: null
    main_sha: null
  version: 0.2.676
  story_points: 8
---

## What

Replace the Site consultant's priming with [[DOC-73]] (Site consultant instructions v2), the
operator-approved rewrite built from [[DOC-71]]:
- **Part A** becomes the consultant's always-on priming entries in
  `tools/generate/src/cli/ai/priming.json`, replacing consultant-role, product-system, plan-panel,
  conduct, client-vocabulary, going-live, comps, looks, showing, focus-tasks and purpose.
- **Part B** (the ten stage guides) goes into the Site consultant's knowledge base (`kb/system/`)
  as a searchable reference, until the stage-guide lookup exists.
- **Part D**'s reminder and cue changes are applied.

## Why

The current instructions repeat most rules in 3–5 places and contradict themselves in nine places
(DOC-70). They were also written for one kind of client. DOC-73 puts the routing model (who leads,
how settled the brief is, stage stances, request-first, neutral profile) at the centre and moves
stage detail out of the always-on prompt.

## Interim adaptations (infrastructure not built yet)

DOC-73 Part E lists tools that don't exist yet. Until they do, the priming must not refer to them
as if they did:
- **The client profile** (A3): keep it with the existing tools. That's `set_readiness` for how
  settled each area is, and the standing note / `record_decision` for preferences and route
  decisions, with the neutral-wording rule and evidence.
- **The stage-guide lookup** (A4, `stage_guide`): "read its guide" becomes "search your knowledge
  base for the stage's guide". The consultant judges the stance itself, using A4's rules.
- **The readiness check** (B10): use what exists today (the plan entry's address check, the layout
  look, placeholders on the questions panel) until the shared Publish-button check is built.
- **Tools named in DOC-73 must match today's tool names**: `show_client`, `set_ask`,
  `offer_headlines`, `pin_notes`, `set_design`, `read_design`, `offer_looks`, `approve_detail`,
  `make_favicon` (still missing from the consultant's grant, DOC-70 C1, so don't promise it),
  ReportBug. No invented names.

## Carry over verbatim (DOC-73 marks these as gaps)

- **The copy-writing rules for builder briefs** (from plan-panel): introduce before relying, anchor
  the voice, order for the visitor, name things plainly, keep the voice, related lines in one
  paragraph.
- **The show_client guidance** (from showing), with REQ-467's rule that link labels name the
  destination.

## Part D changes

- **announce-long-work** becomes "Busy for more than about 20 seconds? Say what you're doing and
  how long, first." No "never silence".
- **The method reminder** becomes "At a stage, read its guide".
- **The home-structure, critique and speak-first cues** follow BUG-297, BUG-298 and A5 rule 2 where
  those are already in code. Any not yet in code are left for their tickets.

## Character budget

Measured before and after, and recorded in the ticket:
- the consultant's priming text (42.9K today);
- its authored total against `prompt_budget.roles.consultant` (235,000; measured 229,242 on
  2026-10-26).

The expectation is about 31K lower: Part A (~9.3K) plus the two carried-over sections (~3K)
replace ~42.9K. Part B is in the knowledge base, which isn't counted in the authored total. Lower
`prompt_budget.roles.consultant` to the new measured size plus the usual margin.

## Tests

About 22 test files pin consultant priming wording (for example via `primingConfig().priming`).
Each is retargeted to the behaviour or rule it protects, which DOC-73 still states (DOC-70
cause 2), or retired where DOC-73 deliberately removed the rule (e.g. "build sooner, story later",
"move on if nothing lands"). Not deleted wholesale. Baseline the red-on-clean tests first (DOC-70
lists two).

UATs named `test_UAT_FC_REQ-473_*`:
- the consultant's priming entries are exactly Part A's sections, with the interim adaptations; no
  removed section remains;
- the stage guides are in the Site consultant's knowledge base, and a search for each stage's name
  returns its guide;
- priming text no longer contains any of DOC-70's nine contradictory instructions
  ("build sooner, story later", "move on if nothing lands", "End it with one story question, never
  silence", and so on);
- every tool named in the priming exists in the consultant's grant;
- the consultant's authored size is at or below the lowered budget.

Related: [[DOC-73]], [[DOC-71]], [[DOC-70]], [[REQ-472]], [[REQ-466]], [[EPIC-20]], [[EPIC-19]].


## As landed (2026-10-27)

**Part A → `priming.json`.** Both consultant orders (`priming`, `priming_without_corpus`) now hold, in
order: `who-you-are` (A1), `changing-the-site` (A2), the `delegation` and `group-room` providers,
`client-profile` (A3), `route` (A4), `rules` (A5), `material-track` (A6), `builder-copy` (the
carried-over copy rules), `showing` (carried over verbatim, with REQ-467's link rule), `bc` (A7).
The with-corpus order then has `km-landscape`, a short `knowledge` entry (the knowledge-base
pointer DOC-73 C puts where `purpose` was), `km-mechanism`. The no-corpus order has `manual`. None
of the eleven replaced entries remains.

**Interim adaptations, as written:**
- A3: `set_readiness` for how settled messaging, look and functions are; the standing note
  (`set_standing_note`) for how they like to be guided, their words, and the other parts;
  `record_decision` for route and other decisions. Neutral wording with evidence. "As if your
  client will read it" (not "because they can": the client can't read the standing note today).
- A4: "search your knowledge base for its guide ("stage guide: the comparison board")"; the stance
  is the consultant's judgement. The banner stages (`set_stage`) are named once, since
  plan-panel's stage text went.
- A6 keeps the panel rules that tests protect: questions open with what they're about (the panel
  folds them), announced in one line with set_ask's link, after answering.
- No `stage_guide`, `make_favicon` or readiness-check tool is named in the priming.

**Kept although DOC-73's wording dropped them**, because nothing retired them and a UAT protects
them:
- BUG-118: unsure where a tool's target lives, or two similar-sounding tools → read the full entry.
- BUG-240: after a build, don't repeat what the client was told while it ran.
- REQ-410: never say work runs in parallel unless you started it that way.
- REQ-415 (in the comparison-board guide): work from a comp's description, look at its picture only
  when discussing how it looks; BUG-245: a comp note gets a reply of two or three sentences.
- REQ-389 (rule 7): never ask in a metaphor they'd have to translate.
- REQ-424: the focus-task method is a "Focus tasks" section of DOC-75 (DOC-73 C sends focus-tasks to
  the material-track guide).

**Part B → DOC-75** ("Stage guides: the Site consultant's route through the work",
`doc_kind: system_kb`), ten sections titled `Stage guide: <stage>` (the opening, the comparison
board, the story board, the design, the site plan, the first draft, checking your work (B7),
refinement, finishing touches, publishing). Adaptations: B10 uses today's checks (plan entry's
address line, the host's look, open questions/stand-ins) and says there's no single readiness
check yet; B9 names the `favicon`/`shareCard` settings, not `make_favicon`; B10's Settings hand-off
is "send them to the web address section with show_client"; B3 puts `write_positioning` before
`offer_headlines` (it refuses without a card); B2 records the direction as the `visual_concept`
decision, proposed; B5 records `pages_navigation`. It's built into `kb/system/` by
`1c kb build`/`bin/kb-release` like every other system_kb doc.

**Part D.**
- `announce-long-work` → "Busy for more than about 20 seconds? Say what you're doing and how long,
  first."
- `method` → "At a stage, read its guide: search your knowledge base for it."
- `client-vocabulary` reminder now points at "Who you are" (its section went).
- D-1 also lived in the commissioning template ("end your message with a story question"); it now
  says "the wait is time for the material track".
- Cues: BUG-297 (home structure) and BUG-298 (speak-first) are already in code, so nothing to
  change. The critique cue's "after hand-over, findings follow A5 rule 2" needs a code change to
  when the review is owed, so it's left for its own ticket.

**Character budget** (measured with REQ-466's route, 2026-10-27):

| | before | after |
|---|---|---|
| Consultant priming text (static entries) | 42,929 | 13,215 (no corpus: 12,797) |
| Consultant system text | 105,249 | 75,520 |
| Authored total (REQ-466 grant) | 229,242 | 199,513 |
| Authored total (with the defect-filing tools) | n/a | 203,649 |

`prompt_budget.roles.consultant` is lowered from 235,000 to 205,000. The `prompt_budget.about`
note no longer names a DOC id.

**Tests.**
- New UATs: `tests/test_UAT_FC_REQ-473_v2_priming.test.ts` (entries are Part A, no removed
  section, interim adaptations, no DOC-70 contradiction including the commissioning line, Part D
  reminders, the guides doc is in the system KB, each stage's guide is found by search and is the
  top section when searching inside it) and
  `tests/test_UAT_FC_REQ-473_priming_against_the_grant.workers.test.ts` (every tool named in the
  priming is in the consultant's real grant, ReportBug included; authored size ≤ the lowered
  target, which is < 210,000).
- `tests/support/stage-guides.ts` reads the guides doc by title for node suites.
- About 35 suites that pinned old wording are retargeted to the rule's new home (a Part A entry,
  the guides, or a tool description), or that one assertion is retired where DOC-73 removed the
  rule (build sooner/story later, move on if nothing lands, options that differ in kind, three-line
  hand-back, end with a story question, two or three exchanges then name the direction, the "Lead"
  paragraph, "confusion is silent", "the story is proof and character"). `roles.ts`'s test-only
  entry-name constants follow the renames (`knowledge`, `who-you-are`, `changing-the-site`).
- Red on clean before this change, and unrelated to it: REQ-342 ×3, REQ-295 ×2, REQ-416 ×2 (talker
  behaviour), REQ-436, REQ-458, REQ-122, AC1058, REQ-408 weakest_point, REQ-358 (fixed here: it was
  the DOC id in the budget note). BUG-245, REQ-376 and REQ-416's priming test were also red on clean
  over wording; they're retargeted.