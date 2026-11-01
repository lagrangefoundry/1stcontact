---
uid: request-f52d99b8
id: REQ-629
type: request
title: 'Consultant prompt: trim the authored prompt back under budget, starting with
  rules the host now enforces'
created_by: EPIC-19
created_at: '2026-11-01T22:31:11.770071+00:00'
updated_at: '2026-11-01T23:21:01.459647+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-cd187ff9
---

## Why

REQ-466's budget for the consultant's authored prompt (system text plus tool definitions, less the client's knowledge landscape) is 205,000 characters (`priming.json` → `prompt_budget.roles.consultant`). It measured 203,649 on 2026-10-27; REQ-628's session measured about 217,000 on 2026-11-01. About 30 commits since 10-27 have each added a little: new tools (e.g. REQ-626's `notify_client`), new priming lines (REQ-628's ~1 KB). Each session found `test_UAT_FC_REQ-466_the_authored_prompt_budget` already red on clean `xgd-working`, baselined it as pre-existing, and added more, so the gate no longer constrains anything.

Where the characters are (2026-11-01): `plan-surface.json` ~69k, `l1-surface.json` ~67k (mostly the builder's), `library-surface.json` ~27k, `fidelity-surface.json` ~27k; `priming.json` templates ~34k, consultant priming ~11k, plus `consultantRules()`.

## What

1. **Bring the consultant's authored prompt to about 190,000 characters** (below the 205,000 target, with room for the next few features), measured by the REQ-466 UAT, and keep the builder and critic within theirs.
2. **Cut, in this order:**
   - **Rules the host now enforces:** reduce the explanation to the rule in one line. The host refuses or does the thing anyway: one place / one action at a time (REQ-621), binding client decisions (BUG-326), pre-publish suggestions (REQ-628), self-ticking and auto-started stages (BUG-322), no reviews during refinement (REQ-623), the menu-button default (BUG-323), and the REQ-622 layout checks.
   - **Duplicates** between priming, stage guides and tool descriptions: say it once, in the place it's needed.
   - **Stale and contradictory text** listed by the prompt audit, DOC-70.
   - **Rarely needed reference material** moved to the system knowledge base (searched on demand), not to another always-sent place. Moving text between priming and tool descriptions saves nothing, since both are counted.
3. **Behaviour must not change.** The trim is checked against the consultant's behaviour UATs (priming-content tests updated only where a rule moved or was shortened, never deleted while its behaviour is still required).
4. **Lower `prompt_budget.roles.consultant` to the new measured size plus a small margin,** and update its `about` note with the measurement and date.

## Test plan

- `test_UAT_FC_REQ-466_the_authored_prompt_budget` passes, with the consultant at or under about 190,000 and the lowered target recorded.
- The consultant behaviour suites touched by the cut rules (REQ-621, BUG-326, REQ-628, BUG-322, REQ-623, BUG-323, REQ-622) pass unchanged.
- Each rule cut down to one line still appears in the consultant's priming (a content assertion per rule).

## How this review is run (operator, 2026-11-01)

This is a deliberate, informed review, not a mechanical cut. Operator: "I would much rather we hit the limit, take a step back and do a proper informed review." No rule makes other sessions trim the prompt when they add to it; when a session finds the budget over, it reports the overrun and what it added, and leaves the trim to this ticket.

- **Inventory first, cuts second.** Before changing any text, list every section of the consultant's authored prompt (priming, `consultantRules()`, stage guides sent each turn, each tool description) with its size, what behaviour it drives, whether the host now enforces that behaviour, and whether a test pins it. Record the inventory on this ticket.
- **Proposed cuts go to the operator before they're made.** The inventory and the proposed cuts (what goes, what is shortened, what moves to the knowledge base, with sizes) are reviewed with the operator, and only agreed cuts are made.
- **Then measure:** the REQ-466 UAT before and after, and the behaviour suites listed in the Test plan.


## Inventory (measured 2026-11-01, before any cut)

Measured on clean `xgd-working` (`064b68fe2a`) by replaying the REQ-466 UAT's consultant request in workerd and capturing what the model was sent. **Authored: 219,329** = system 80,349 + tools 139,239 − landscape 259. The target is 205,000, so getting to ~190,000 means cutting about 29,000.

**System text, by owner (80.3k):**

| Part | Chars | Owner | Pinned by tests |
|---|---|---|---|
| Consultant priming (`priming.json`): Reaching…, Who you are, How you change the site, **Commissioning construction 7.0k**, Who you're talking to, Route, **Rules 4.1k**, Material track, Writing copy, Bring the right view 1.5k, bc | 22.8k | here | heavily (REQ-389, REQ-473, BUG-225/233/236/245/265, REQ-408, REQ-467, …) |
| Plan manual (`plan-surface.json` overview + groups) | 10.1k | here | BUG-235, BUG-302, REQ-364, REQ-408, REQ-424 |
| L1 manual (`l1-surface.json`), shared with the builder | 8.7k | here | REQ-130, REQ-160, REQ-131 |
| Fidelity manual (`fidelity-surface.json`) | 8.6k | here | REQ-157, REQ-218, REQ-219, REQ-284 |
| Library manual (`library-surface.json`) | 6.6k | here | BUG-118, BUG-272, BUG-72, BUG-97 … |
| Delegation manual | 5.7k | framework | REQ-342 |
| Knowledge + KB landscape boilerplate | 4.3k | framework | BUG-65 |
| Ledger manual | 3.1k | here | — |
| Own context (Agent*) manual | 2.7k | framework | — |
| Tickets manual | 2.5k | framework | — |
| Image generation and clips | 1.9k | here/framework | REQ-208 |
| Development tickets | 1.7k | framework | REQ-273 |
| Own tools, provenance, memory, business name | 1.6k | framework/here | BUG-210 |

**Tools (95, 139.2k):** plan 52.3k (39 tools), framework 31.8k (24: Delegate 6.1k, AnimateImage 5.0k, Knowledge* 5.5k, Ticket* 5.3k, Agent* 4.9k …), fidelity 23.6k (5: **compare 10.4k, screenshot 10.0k**), library 15.3k (8: draw_image 3.9k, place_on_site 2.9k), l1 13.8k (14 read tools), ledger 4.8k, settings 1.7k. Largest of ours: set_decision 4.3k, set_ask 4.2k, show_client 3.5k, set_design 3.4k, set_stage 2.4k, capture_site 2.3k, notify_client 2.2k, write_positioning 2.2k.

**Where the host-enforced rules are written:**
- REQ-621 (Input one place at a time): Rules §5 (~430). The host refuses with `PLACE_HIDDEN`.
- BUG-326 (binding client decisions): Rules §3 (~700), record_decision `client_said`/`applies_to`. The host adds the decision to every brief.
- REQ-628 / REQ-623 (pre-publish suggestions only; no reviews in refinement): the critique description (~600) and answer_finding (~250); Rules §2.
- BUG-322 (self-ticking and auto-started stages): the set_stage description (2.4k, mostly host behaviour) and two plan-manual paragraphs (~1.5k).
- BUG-323 (menu button) and REQ-622 (layout checks): **nothing in the consultant's prompt.** Their text is in the builder's priming, so nothing can be cut here for them.
- Also host-enforced: builders run one at a time, scope refusals (Commissioning ~1.3k); show_client converting a switch to a link (~350); the first build refused without `pages_navigation`.

**Repeated in several places:** show_client and the priming's "Bring the right view" section; screenshot, the fidelity manual, how-these-fit and absences (the `after` rules are written five times); set_ask, the material-track bullet and the plan manual's "Asks are…"; the story-board paragraph and the pin_notes/reword_note/write_positioning/offer_headlines tools; Commissioning's "Two things come back", Rules §12, the fidelity manual and the delegation manual; Rules §11 and the dev-tickets manual.

**The shared picture schema** (`fidelity-surface.json` `param_types`) is written out three times, as compare `a`, compare `b` and screenshot `of`, at about 4.6k each. Its `after` description is 1.9k each time.

**DOC-70 status:** its priming findings (A–C) predate REQ-473's v2 priming and mostly no longer apply. These still apply: compare `b` duplication (E1-01), capture_site private-address paragraph (E1-06a), record_check_answer still naming the consultant "alice" (E2-9, against DOC-66), and builder-only text projected to the consultant (Cut 3, framework). D-7 is resolved: both texts now say to file on your own initiative.

## Proposed cuts (awaiting operator agreement; estimated consultant savings)

- **P1 — host-enforced rules down to one line each (~4.9k).** set_stage becomes "start it when work begins, tick it when the client agrees; the host ticks the first three and refuses an early or unchecked mark, naming what is missing" (−1.4k). The plan manual's stage and milestone paragraphs (−1.1k). Rules §5 Input order (−0.3k). Rules §3 keeps "record a rejection in their words, that turn, before any brief" and drops the worked example (−0.35k). critique and answer_finding for REQ-628/623 (−0.65k). Commissioning: one-at-a-time and scope refusals (−0.9k). show_client switch-to-link (−0.35k).
- **P2 — say each thing once, where it is used (~8.3k).** Bring the right view goes to show_client (−1.1k). Commissioning's record/verdict prose overlaps Rules §12 and the fidelity manual (−1.8k). Check forms kept, narrative cut (−0.7k). set_ask how-to removed from the material track and the plan manual (−0.8k). Story-board paragraph goes to its tools (−0.8k). `after` and stored-picture rules said once, in screenshot (−2.5k). Rules §11 against dev tickets (−0.15k). The rest is small.
- **P3 — the shared picture schema (~6.5k).** `after` cut to one sentence in the param type, with its rules said once in screenshot (−4.8k across the three copies). `image`, `original` and `viewport` text tightened (−1.7k). This also shrinks the builder.
- **P4 — stale (~1.5k).** "alice" in record_check_answer, the capture_site private-address paragraph, and the "Reproduce a site you were shown" sequence and gates absence, which are builder-only.
- **P5 — reference moved to the system KB (~4.5k).** Drawing craft from draw_image, the composition catalogue detail from set_design/set_decision, and capture_site/place_on_site detail. Each tool keeps a one-line pointer: "search the knowledge base for …".
- **P1–P5 total: about 25.7k, bringing the consultant to ~193.6k.**
- **P6 — grant changes (operator decision; ~15k).** Take out of the consultant's (and talker's) grant: compare (10.4k, called once ever per DOC-70; the builder keeps it), AgentContext/AgentPriming/AgentReminder (0 calls), TicketComments/TicketBacklinks/TicketHistory (0 calls). REQ-283 AC3 and REQ-228 tests need revising. With P6: **~178k**.
- **Not this ticket (framework, lagrange-framework):** the delegation manual (3.2k, duplicated by Commissioning) and projecting manuals by grant, so the consultant stops reading builder-only L1 text (~4–5k, DOC-70 Cut 3). These would be a ticket in that repo.

**Then:** lower `prompt_budget.roles.consultant` to the measured size + ~2,000, update `about` with the date and the figures, re-measure the builder and critic, and run the behaviour suites in the Test plan. Priming-content tests are retargeted to wherever a rule now lives, never deleted.

## Operator agreement (2026-11-01, via EPIC-19)

- **Agreed: P1, P2, P3, P4 and P6** as proposed.
  - **P1 condition:** before a rule is cut to one line, check its host refusal message names what's missing and how to fix it, since the consultant then learns the rule from the refusal. Improve the message where it doesn't.
  - **P6:** remove compare, AgentContext/AgentPriming/AgentReminder and TicketComments/TicketBacklinks/TicketHistory from the consultant's and the talker's grant; the builder keeps compare; the ticket-filing tools the consultant uses stay. Revise REQ-283 AC3 and the REQ-228 tests to the new grant, don't delete them.
- **P5, limited:** move to the system KB only rarely needed reference: drawing craft from draw_image (DOC-74 now says not to offer drawn effects) and edge-case detail from capture_site/place_on_site. **Keep the composition catalogue detail in set_design/set_decision**, since it's used on every first draft.
- **Order:** P6, P4, P3 first (mechanical, low behaviour risk, ~23k); then P1 and P2, re-measuring and running the behaviour suites after each; P5 last.
- **Expected:** about 175–180k. Then lower `prompt_budget.roles.consultant` to the measured size plus ~2,000 and record the figures and date in its `about` note.
- **Framework part filed:** lagrange-framework **REQ-236** (`request-160619f9`), project tool manuals by grant and slim the delegation manual (both peers). Not a blocker for this ticket.


## Test plan additions (from the agreement)

- **Grant (P6):** the consultant's and the talker's tool lists no longer offer compare, AgentContext, AgentPriming, AgentReminder, TicketComments, TicketBacklinks or TicketHistory. The builder still offers compare. ReportBug and RequestCapability are still offered to the consultant. REQ-283 AC3 and the REQ-228 tests are revised to this grant, not deleted.
- **Refusals carry the rule (P1 condition):** for each rule cut to one line, a test drives the host refusal and asserts that its message names what is missing and how to fix it. Messages are improved where they did not.
- **Each phase is measured:** after each phase (P6/P4/P3, then P1, then P2, then P5), the REQ-466 UAT figure is recorded here and the behaviour suites in the Test plan are run.
- **Moved reference (P5):** the drawing craft and the capture_site/place_on_site edge-case detail are findable by searching the system knowledge base, and each tool keeps a one-line pointer to it.


## Progress

- **P6 landed on `free-REQ-629` (9e83300604): 219,329 → 203,588.** The consultant and talker are no longer offered compare, AgentPriming/AgentReminder/AgentContext, or TicketBacklinks/TicketHistory. The builder keeps compare. ReportBug and RequestCapability stay. REQ-157, REQ-206, REQ-228, REQ-283 AC3, REQ-343, REQ-453 and AC1058 are revised to this grant.
  - **TicketComments was kept, against the agreement, pending the operator.** `sessionTicketSurface` (REQ-228) records the 2026-09-11 operator decision that reading past conversations is the point of this grant, and those transcripts live in `chat_transcript` comments, which only TicketComments reads. Withholding it would cost that reach for ~760 characters. One line (`CONSULTANT_WITHHELD_TICKET_OPS` in `apps/control-app/src/ai.ts`) adds it if the operator confirms.
  - **Pre-existing on clean xgd-working, not caused here:** REQ-416 (×3: `rename_business` is in neither talker list, plus two 5s timeouts) and AC1058 (`web_search` offered but not expected).

- **P4 + P3 landed (0fe0254c02): 203,588 → 195,304.** The shared picture type is cut to a sentence or two per field, with the `after` rules said once. The fidelity overview, screenshot and capture_site are de-duplicated, and the consultant's manual no longer names compare. Removed: the gates absence, the `after` sequence, the duplicate Changing-a-picture absence, and "alice" in record_check_answer. REQ-284 retargeted: the manual says *what landed?* is read, and no longer names `compare`. The REQ-466 UAT is green again, with builder and critic inside their targets. Also pre-existing on clean working: AC931, REQ-290 (push script), REQ-361 (restructured box).