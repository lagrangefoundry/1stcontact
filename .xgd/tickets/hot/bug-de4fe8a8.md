---
uid: bug-de4fe8a8
id: BUG-301
type: bug
title: 'Consultant prompt: resolve DOC-70''s last three contradictions (filing bugs,
  checking builder work, the plan entry)'
created_by: EPIC-19
created_at: '2026-10-27T19:18:04.777958+00:00'
updated_at: '2026-10-27T20:01:56.361234+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-1330f086
  commits:
  - working_sha: 46c40cc5990cf5bd1e082184f4089eb40693d3f6
    reconcile_sha: null
    main_sha: null
  - working_sha: 12bc70d98e2c5cd799f97436bad2a93a815a7cbe
    reconcile_sha: null
    main_sha: null
  version: 0.2.679
  story_points: 3
---

## Why

REQ-465's audit (DOC-70) found nine contradictions in what the consultant's model sees. REQ-473's v2 priming (DOC-73) resolved D-1 to D-6. A re-check on 2026-10-27 found three still live. REQ-465 goes to `legacy_done` once this lands.

## What

**1. D-7, filing bugs: the consultant files on its own initiative, only where it can.**
- The operator's decision (2026-10-27): automatically filed bug tickets are wanted. The consultant reports a defect with ReportBug on its own initiative, without the client asking.
- **Caveat: in production that doesn't work today.** ReportBug only joins the consultant's grant where the deployment has a filing address (`DEVELOPMENT_TICKETS_URL` / `DEVELOPMENT_TICKETS_TOKEN`, BUG-124), and production has none. The v2 priming names ReportBug unconditionally. So in production the consultant is told to call a tool it doesn't have.
- **Fix:** the ReportBug clause of the priming rule ("something on our side isn't working yet; we're fixing it", and you report it with ReportBug, on your own initiative) is given only when ReportBug is in the consultant's grant. Without it, the consultant still says the client-facing line and promises nothing about filing.
- **The framework's Development tickets manual** (`lagrange-framework/components/ai_ticketing/js/src/development_surface.json`) still ends: "Filing is not something to do on your own initiative. Someone asks for a ticket". That contradicts rule 11 wherever ReportBug *is* granted.
  - If 1stcontact can override that manual's overview for the consultant, do it here.
  - If it can't, this ticket's D-7 work is the priming half only, and the manual sentence needs a lagrange-framework ticket, for example making it "…unless your instructions say otherwise". Name that ticket here.
  - `test_UAT_FC_REQ-273_report_a_defect` currently expects the manual to contain the phrase. Retarget it to whatever the consultant actually receives.

**2. D-8, checking builder work: one sentence reconciles the two.**
- The consultant's rules say "checking delegated work isn't optional".
- The Delegation overview says to put the checks you'd otherwise make in `accept` and let whoever can answer each one cheaply do so.
- These only conflict if the consultant reads the overview as "never look yourself". Add to the consultant's own instructions: ask for the checks in `accept`, then read the verdicts and look yourself at anything `unverified`, `unreported` or `failed`.
- This is the consultant's own text, and the framework manual stays as it is.

**3. D-9, the plan entry: "other questions wait" means they wait.**
- In `tools/generate/src/cli/ai/plan-core.ts`, `agendaLines` writes "Due first: … Other questions wait until they have" while the client hasn't seen the first draft. It then still pushes the "Due: ask the client "…"" lines for due checks.
- **Fix:** while the draft is unseen (`draftUnreviewed`), the due-check questions are held back from the agenda. They become due again once the client has responded to the draft.
- DOC-70 also flagged the 2,000-character cap on the plan reminder (`MAX_PLAN_REMINDER_CHARS`), which cuts off the entry part-way. Check whether, with the questions held back, the entry still exceeds the cap on a realistic plan. If it does, the cut must fall between lines, never mid-line.

## What landed

**D-7.**
- The consultant's `rules` priming entry is now a provider (`consultant.rules`, `consultantRules(filing)` in `roles.ts`), with its text in `priming.json`'s `rules` / `rules-filing` templates. The host passes `filing` from the grant it built: it is true when `ReportBug` is in the consultant Toolbox's schemas, which is the case only where `DEVELOPMENT_TICKETS_URL` is set.
- With the grant, rule 11 reads as before: "…we're fixing it", and you report it with ReportBug, on your own initiative. Nobody else will.
- Without it (production), rule 11 ends at the client-facing line and says nothing about filing.
- **The override is possible here, so no lagrange-framework ticket is needed.** 1stcontact already composed the Development tickets declaration with its own overview amendment (`developmentDeclaration()` in `apps/control-app/src/development.ts`). That function now drops upstream's "own initiative" paragraph and adds `INITIATIVE_NOTE`: "Filing does not wait to be asked: when something in this software is not working, report it here yourself, because nobody else will. Your part is writing the good version of it." The rest of upstream's overview and the confidentiality note are unchanged.
- Upstream's `report_bug` / `request_capability` descriptions still say the id is returned "so you can tell whoever asked for it". That is about the reply, not about who decides to file, so it was left as it is.

**D-8.** Rule 12 now reads: "Tokens are scarce, but checking delegated work isn't optional. Ask for the checks in `accept` so whoever can answer each one cheaply does, then read the verdicts, and look yourself at anything that came back `unverified`, `unreported` or `failed`." The framework's Delegation manual is unchanged.

**D-9.**
- `agendaChecks(fields)` in `plan-core.ts` returns no due checks while `draftUnreviewed`. `agendaLines` asks only those, and the plan entry's "Record that you asked a due check…" line follows the same set. The checks still fall due in the stored plan, and they come back on the agenda once the client has seen and responded to the draft.
- The REQ-444 hand-over lead ("The first draft is built. If your client has not been told…", about 1,000 characters) is now said only while the draft is unreviewed. Before this it stayed on every turn for as long as a first-pass check was due, and it pushed the due questions past the cap.
- **The cap answer is yes.** A freshly seeded plan with the first pass built already exceeds 2,000 characters, both before and after the client has reviewed the draft. The cut now falls between lines: whole lines are kept in order until the next one would overflow, then the entry ends with `(read_plan for the rest)` (`PLAN_REST`).

**Pre-existing, not caused here.** `test_UAT_FC_REQ-473_the_consultants_authored_size_is_inside_the_lowered_budget` already fails on clean xgd-working: 206,555 against the 205,000 budget. This change adds 245 characters, bringing it to 206,800. Whether to raise `prompt_budget` or trim the priming is a separate decision.

## Test plan

- `tests/test_UAT_FC_BUG-301_filing_and_checking.workers.test.ts`, run through the real Worker route:
  - `test_UAT_FC_BUG-301_reportbug_clause_only_with_the_grant`: with a filing address, ReportBug is in the tools and rule 11 names it "on your own initiative". With no address (production), there is no ReportBug and no "own initiative", and the client-facing line still ends rule 11.
  - `test_UAT_FC_BUG-301_no_filing_contradiction_where_granted`: the system text and tool descriptions carry `INITIATIVE_NOTE`. They contain neither "not something to do on your own initiative" nor "Someone asks for a ticket". Upstream's "the people who build this product" survives.
  - `test_UAT_FC_BUG-301_delegated_checks_are_read`: rule 12 asks for the checks in `accept` and to look at anything `unverified`, `unreported` or `failed`.
- `tests/test_UAT_FC_BUG-301_unseen_draft_holds_other_questions.test.ts`:
  - `test_UAT_FC_BUG-301_unseen_draft_holds_other_questions`: after the first pass, the entry has "Due first" and the hand-over lead, and no "Due: ask the client" or record line. After the client responds with the draft in view, the layout_happy question and the record line are back and the lead is gone.
  - `test_UAT_FC_BUG-301_an_entry_over_the_cap_is_cut_between_lines`: an entry over the cap ends with `PLAN_REST`, drops the long line whole, and keeps only lines the uncut entry says in full.
- Retargeted:
  - `test_UAT_FC_REQ-273_the_shipped_overview_is_amended_and_not_replaced` now expects `INITIATIVE_NOTE` and the absence of upstream's sentence.
  - `test_UAT_FC_REQ-473_*` (both files) read the rendered rules through `consultantRules`, and `rules` is now listed as a provider.
  - `test_UAT_FC_REQ-182_the_corpus_free_order_names_only_registered_providers` adds `consultant.rules`.
  - REQ-428, REQ-408 and REQ-379 now expect the due question after the client has reviewed the draft, and held back before that.
  - BUG-236, BUG-245, REQ-389 and REQ-410 (which read the static priming text) now also read `consultantRules(false)`.
  - `test_UAT_FC_BUG-241_the_consultant_is_told_what_its_client_hears_and_how_bc_works` runs with no filing address, so it now expects no ReportBug.
- **Already failing on clean xgd-working, and unchanged by this work:**
  - REQ-473's authored-size budget (see above).
  - REQ-295 delegation (2) and REQ-342 method-rides-every-turn (3).
  - REQ-416 (2), REQ-424 (2), REQ-426, REQ-428 workers (talker promise timeout), REQ-436 and REQ-458 workers.
  - Node: BUG-124 and REQ-273 filing service (both bind a listener), builder-workspace-origin, assistant-conversation AC1058, REQ-361 and REQ-398.