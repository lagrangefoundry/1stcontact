---
uid: doc-75d67bfc
id: DOC-70
type: doc
title: 'Consultant prompt audit: duplicated, host-enforced, stale and contradictory
  text (REQ-465)'
created_by: REQ-465
created_at: '2026-10-26T16:14:33.014019+00:00'
updated_at: '2026-10-26T16:14:33.014019+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  doc_kind: architecture
  parent_uid: request-9f48b7ff
---

# Consultant prompt audit: duplicated, host-enforced, stale and contradictory text (REQ-465)

*Audit for REQ-465, 2026-10-26. It covers everything the consultant's model reads on a live request: priming, projected manuals, 91 tool definitions and the per-turn tail. Working files are in `.xgd/tmp/req465/` (gitignored): `captured-request.json`, `system.txt`, `tools.json`, `tail.txt`, `README.md`.*

## Summary

- **The captured request is a live one.**
  - **What it is:** the consultant's request for *First-Draft-Test Dina's Diner 5* (`site_7fe9bea6…`, tenant `biz_aedda7b5…`), on the dev snapshot `1f70f43828` deployed 2026-10-26 03:32Z.
  - **How it was captured:** the snapshot's own `worker.js` was replayed against a copy of the dev store, with model requests pointed at a local capture server.
  - **Proof it matches:** its system and tools fingerprints are `7d665817ab10ea78` / `4dcad336e385a6c3`. Those are identical to all 50 live requests in that session (03:33–04:06Z), so the text below is byte-for-byte what the model read.
  - **Still current:** nothing under `tools/generate/src/cli/ai/` that feeds it (`priming.json` and the surface JSON files) has changed between the snapshot and xgd-working.
- **Size:**

  | Part | Chars |
  |---|---|
  | System text | 118,698 |
  | Tool definitions (91 tools) | 127,833 |
  | — of which descriptions | 69,518 |
  | — of which schemas and parameter text | 52,422 |
  | Per-turn tail on the latest user message | 14,086 |

- **Findings:** 169 in total.
  - **High confidence:** about 21K of system text and about 6K of tool text can go with no behaviour expected to change.
  - **Medium confidence:** roughly a further 17K of system text and 19K of tool text.
  - **Grant changes:** taking unused tools out of the consultant's grant saves about 9K more. This is a product decision, not a text edit.
- **Most of the text is not wrong; it is repeated.** A typical rule appears in 3–5 places:
  - a priming section;
  - the projected surface manual;
  - the tool description (sometimes in a parameter as well);
  - a per-turn tail line;
  - the `say` in a tool result, or a host cue.

  The audit keeps one copy. It is the copy at the **point of use** (the tool description, tool result or cue the host shows when the rule is due), except for judgement the model needs *before* it chooses a tool.
- **Systemic causes, ranked by how much text each produces:**
  1. **Manuals are projected regardless of grant.**
     - lagrange-framework `toolbox/manual.js:surfaceBlock` renders every surface's overview whole and every `absences` entry unconditionally.
     - So the consultant, which holds no L1 writes (`host-core.ts` `readOnlyGrant`; `delegation.json` `primary_writes: false`), reads builder instructions: `decompose_page`, set_l1 advice, `use_font`, undo-by-writing. It also reads ticket write-absences, and a "summary" frame it is deliberately not given.
     - About 5K of system text depends on this.
  2. **Rules were added in three places at once.** Many tests assert the rule's wording *in the priming list* (`primingConfig().priming`), so the duplicate in the tool description could never be removed. Most high-confidence cuts break a text-pinning test whose AC only needs the behaviour, so retargeting those tests is part of each cut.
  3. **The per-turn plan entry is truncated.**
     - `plan-core.ts` caps it at `MAX_PLAN_REMINDER_CHARS = 2,000`. In this capture it was cut after a bare `Due:`, so the readiness, story-board, story-settled and stage-missing lines never arrived.
     - Several system-text rules look duplicated by a per-turn line, but that line doesn't reliably arrive. Those findings are marked medium, not high.
- **Contradictions that need an operator decision, not a deletion:** 9. They are listed under *Decisions needed* below.

## How this was done

1. **Capture.**
   - `wrangler dev --no-bundle` was run on a copy of `apps/control-app/.dev-snapshot/`, with `--persist-to` pointing at a copy of `.wrangler/state`.
   - It used the same `.dev.vars` and secret key names, with fake values, so the grant is unchanged: `OPENAI_API_KEY` and `FAL_KEY` decide the image and clip surfaces.
   - Two overrides were added: `TENANT_ID` = the site's business, and `ANTHROPIC_BASE_URL` = a local server that records the body and answers "Hello.".
   - One `POST /api/ai/prompt` produced the request. The framework's fingerprints (`requestProfile`: SHA-256 of the serialised system and tools) were compared with the live `request_spend` rows.
2. **Partition.** The request was split six ways:
   - system lines 1–258 plus the tail;
   - `plan-panel` + `conduct`;
   - the smaller priming sections plus the knowledge providers;
   - the projected manuals (953–1630);
   - the 25 largest tools;
   - the other 66 tools.

   Each part was reviewed against the whole request for duplicates. Host enforcement and staleness were checked in code at `1f70f43828`.
3. **Pinning tests.** Each passage's distinctive 5–8-word fragments were searched for with `grep -rla` over `tests/`. Pins are marked **TEXT** when the assertion needs the wording, and **BEH** when it asserts what the host does. A test named `test_UAT_FC_<TICKET>_*` serves that ticket's (not yet reconciled) AC, so "AC" below names the ticket.
4. **Usage.** Calls per tool were counted from the consultant's `tool_transcript` comments in the dev store: 21–23 consultant chats, 3,858 calls, 2026-09-08 to 10-26.
5. **Spot check.** I re-checked a sample of the reviewers' claims myself against the capture and the code: compare `a` ≡ `b`, `COMP_ADDED_SAY`, `NO_POSITIONING`, `reopens: on_purpose`, the `summary` withholding, and the stale story-board and delegation passages.

Line numbers below refer to `system.txt`. "Tail" means the per-turn text on the latest user message.

## Where the text is

| Part | Lines | Chars | Source |
|---|---|---|---|
| Transcript pointer and work-log note | 1–12 | 1,213 | `product_priming` memory providers |
| `consultant-role` | 23–64 | 2,323 | priming.json |
| `product-system` | 65–134 | 3,724 | priming.json |
| Commissioning construction | 135–258 | ~5,700 | `delegation.method` provider (delegation templates) |
| `plan-panel` | 259–479 | 13,554 | priming.json |
| `conduct` | 480–678 | 11,388 | priming.json |
| `client-vocabulary`, `going-live`, `comps`, `looks`, `showing`, `focus-tasks` | 679–869 | ~11,200 | priming.json |
| Knowledge map | 870–933 | ~3,900 | `km.landscape` (framework, built from the client's KB) |
| `purpose` | 934–950 | 783 | priming.json |
| "# How to search" + all surface manuals | 951–1630 | ~59,300 | `km.mechanism` wraps `box.manual({level:'summary'})` (C17) |
| Memory charter | 1631– | 459 | memory provider |

Only the summary-level manual text and the priming count toward BUG-129's figure. The tool text does not, but it is in every request's cached prefix and in every cache rebuild.

## Findings

Ids are kept from the review: **A** = lines 1–258 + tail, **B** = plan-panel/conduct, **C** = smaller sections, **D** = manuals, **E1/E2** = tools.

Classes: dup = duplicated; host = host-enforced; stale; contra = contradictory; role = text for another role (builder, coordinator, operator).

Chars are what deleting or replacing the passage saves.

### A — memory blocks, consultant-role, product-system, Commissioning construction, tail

| id | passage | class | conf. | chars | pinning tests (AC) |
|---|---|---|---|---|---|
| A1 | 9–11 work-log note "re-reading a page you read eight turns ago…". Keep the `read_work_log` description, which says all of it (see D36, E2-5). | dup | **high** | 763 | none on the text. `BUG-210_no_registerdefaults` pins the provider name only (BEH); the provider can return null. |
| A2 | 1–5 transcript pointer "Each exchange has a turn id…". Copies: AgentHistory, the "Your own context" manual, and the framework's recent-window text. | dup | medium | 443 | none |
| A3 | 19 fork paragraph "The worker builds… you are one AI" (framework `fork.js` FORK_PRIMING) | contra / dup | low | ~100 | REQ-416 pins 'the talker' (BEH) |
| A4 | 59–61 "Go and read [your method]". Copies: `purpose` and the tail `method` line. | dup | med-high | 200 | none on this copy |
| A5 | role "not one proposal you then refine" vs conduct "Propose first… carry it out instead of offering alternatives" | contra | — | 0 | REQ-171 `a_real_decision_gets_options_not_iterations` (TEXT). **Decision D-2.** |
| A6 | 67–74, 78–80, 93–94, 129–131: product-system repeats the L1 manual (closed vocabulary, typed tree, "read before you write", private draft) | dup / role | medium | ~1,134 | REQ-171 `the_product_text_names_no_role`, REQ-174 `the_preamble…` (TEXT) |
| A7 | 82–89 "Never expose that vocabulary" + the IMAGE-5 exception. Copies: client-vocabulary, the Library manual. | dup | medium | ~620 | REQ-280 `the_priming_names_the_label_as_the_exception_to_its_own_rule` (TEXT) |
| A8 | 96–98 tool-guide sentences (same as the "Your own tools" manual) | dup | med-high | ~200 | BUG-118 `the_priming_says_to_ask…` (TEXT; kept by the shorter line) |
| A9 | 118–122 client-width rule | dup (partial) | low | ~150 | REQ-388 (TEXT) |
| A10 | 178–179 "Never commission a builder without a scope… a file another session holds". Enforced by `lease-core.ts` `draftClaims().claim` → `NO_SCOPE` / `scopeHeld()`, whose refusal explains itself and costs nothing. Keep the out-of-scope-write clause. | host | **high** | ~130 | REQ-410 refusal (BEH) |
| A11 | 195–197 "Plan the work as one builder per file…". Repeats the next paragraph, the tail and Delegate. **Note:** "`site.json` always alone" is *not* enforced (leases compare names exactly), so the next paragraph's copy stays. | dup | **high** | 156 | none |
| A12 | 208–211 overlap-timing rule (also conduct "Saying what is running"). Superseded by B24, which keeps this copy. | dup | — | — | — |
| A13 | 165–167 the `note` paragraph: "do not say it again… end your message with a story question" | contra / dup | — | 233 | **Decision D-1** |
| A14 | 159–160 "Brief each section's intent…" (the Delegate `goal` parameter says more) | dup | medium | 137 | REQ-457 (TEXT) |
| A15 | 172–175 "the site's shared reveal setting". No such setting exists; reveal is per element (`l1RevealSchema`). "Text styles" are called type roles. | stale | medium | ~60–190 | none |
| A16 | 218–235 check-wording paragraphs. `UNSETTLED_CHECK` refuses only recognisable wordings; the prose is what makes the consultant use the forms (BUG-225). | host (keep) | low | 0 | REQ-354, BUG-225, REQ-446 (TEXT) |
| A17 | 213–256 "Two things come back" (four copies). This is the product-specific copy, so keep it and trim the framework copies (D20). | dup (keep) | low | 0 | ~12 REQ-342 tests (TEXT) |
| T1 | tail digest says "snapshot… list_changes" twice; delete the header sentence | dup | **high** | ~150 per turn | BUG-128 `the_digest_cannot_lag` (TEXT; kept by the state line) |
| T2 | tail memory trigger (4 copies). Replace with "Keep your record current as you work: rewrite your standing note when the shape of the work changes, and record each decision, with what lost, the moment it is settled." | dup | med-high | ~290 per turn | REQ-283 `the_per_turn_reminder_nudges…` (TEXT; prefix kept) |
| T3 | tail site plan: "Other questions wait until they have [seen the draft]", then two "Due: ask…" lines; plus truncation at 2,000 | contra (host text) | medium | ~163 per turn | BUG-269, REQ-444, REQ-445 (TEXT). **Decision D-9.** |
| T4 | tail "Prefer making the change over describing how you would make it." beside "Construction is commissioned, not performed" | contra (mild) | med-low | 63 per turn | BUG-63 uses it only as a delivery canary (BEH) |

Clean: the rest of consultant-role and Commissioning construction (the builder ops it names exist); the memory charter; the context budget; the site line; the record wrapper. **Tail budget:** `standingReminder` measures 599 against REQ-171's `< 600`.

### B — `plan-panel` (13,554) and `conduct` (11,388)

| id | passage | class | conf. | chars | pinning tests (AC) |
|---|---|---|---|---|---|
| B1 | 259–261 opener (asks and stages). Kept, because D39/D40 remove the manual copies. | dup | — | 0 | none |
| B2 | 263–265 "tick it done when the client agrees… any can reopen". It is wrong for the three self-ticking stages (`settleStages`, plan-seed `done_when`). Hand-ticking one is refused with `TICKS_ITSELF`; Getting to know you is `reopens: on_purpose`. Keep set_stage's copy. | dup + stale | **high** | 216 | none |
| B3 | 267–273 panel-or-chat rule. Kept, because the manual copy goes in D40. | dup | — | 0 | REQ-364 (/Put a question on the panel…/; BEH need) |
| B4 | 275–277 "the panel folds each one to its first few words" (verbatim in set_ask and its `prompt` param) | dup | **high** | 201 | REQ-401 `questions_lead_with_their_subject_and_every_added_question_is_announced` (TEXT). Retarget: its sibling `REQ-401_the_ask_operation_says_the_same` already pins set_ask. |
| B5 | 279–284 "Announce the questions you add in one line in total…" (verbatim in set_ask; also `ASK_ADDED_SAY` in the result) | dup | **high** | 433 | REQ-401 (as B4); BUG-236 `the_consultant_is_primed_to_pace_one_thing_at_a_time` (TEXT); BUG-265 `priming_and_set_ask_announce…` (drop its priming half); BUG-245 (already red, see Other defects) |
| B6 | 290–292 build-start message: "invite them to answer a few of the panel's questions" vs 582–588 and the tail | contra | medium | 191 | REQ-364, REQ-416 (TEXT). **Decision D-1.** |
| B7 | 294–297 "keep the result short… about three lines" vs 599–605 and the per-turn `FIRST_DRAFT_LEAD` | contra | medium | ~342 | BUG-236, REQ-416 (TEXT). **Decision D-3.** |
| B8 | 588–590 talker mechanics, third copy | dup | medium | 193 | none on this copy |
| B9 | 307–316 ask_features paragraph: the same example line word for word as the tool ("I've ticked the ones I'd expect for a plumber") | dup | **high** | 729 | none |
| B10 | 328–333 finish lines of the self-ticking stages (`settleStages`, `TICKS_ITSELF`, `storySettledGuard`) | host | med-high | ~400 | REQ-408 `the_consultants_priming_and_manual_describe_the_board_reactions_and_headline` (TEXT; AC needs BEH) |
| B11 | 324–327 fallback "record that as a decision" (`write_positioning fallback:true` records it) | dup | medium | ~90 | none |
| B12 | 345 Finishing touches check (plan checks `ready_to_publish`, `motion_offer`) | dup | low-med | 69 | none |
| B13 | 444–446 story areas listed a second time (also the pin_notes `area` enum) | dup | **high** | 151 | none |
| B14 | 394 "Never ask a question twice" | dup | low (keep) | 0 | — |
| B15 | 405–407 "Getting to know you ticks itself, and reopens when new notes come. Reopen… only if the… checks say the story is too thin". Never auto-reopens (`on_purpose`); pin_notes is refused once it is done (`STORY_SETTLED`); set_stage requires a client-said reason. Replace with "Getting to know you ticks itself once its finish line is met." | stale + contra | **high** | ~110 | none |
| B16 | 432–436 story-board intro. Kept, because the manual copy goes in D41. | dup | — | 0 | REQ-408 heading (TEXT) |
| B17 | 438–446 pinning rules: the reword/quote/emoji/theme text (in pin_notes) and "Keep to about six themes" (refused in `story-core.ts:addTheme`). Keep "Fill it during Getting to know you… pin it with pin_notes". | dup + host | **high** | ~390 | REQ-408 (TEXT "never add a claim, a fact or an adjective"). Retarget to the pin_notes description. |
| B18 | 448–454 "You never reword or remove it" (refused `CLIENTS_WORDS`); "announce board changes in one line" (pin_notes, `boardReminderLine`); "Moving notes… when they ask you" contradicts move_note and focus-tasks. Keep "Ask about every 👎…". | host + dup + contra | **high** (refused, announce, contradiction) | ~200 | REQ-408 "Ask about every 👎" (kept) |
| B19 | 456–462 "offer two or three with offer_headlines, written from the hearted notes… If nothing lands after one round, move on". `offerHeadlines` refuses `NO_POSITIONING` (card first; sources are card lines), and "move on" leaves the stage open (`headline_chosen`). Keep "answers one question… never a workshop", naming offer_headlines. | stale + contra | **high** (stale part) | ~317 | REQ-408 needs "offer_headlines" (kept). **Decision D-6** for "move on". |
| B20 | 464–476 copy rules | dup (partial) | low (keep) | 0 | REQ-446, REQ-457, BUG-233 (TEXT) |
| B21 | 493–502 "check it at desktop, tablet and phone". `hostLook` runs 1280/900/375 after every page-writing build and holds the reply on a fault, but only for home and only mechanical faults. | host (partial) | medium | 326 | REQ-389 `finish_and_check_every_width_before_handing_back` (TEXT) |
| B22 | 504–513 shared header/menu ("never tell your client a page is in the menu…"). `siteStructureFindings` → `unreachable` / `dead_end` holds the reply. `set_navigation`/`add_page` are builder ops. | host + dup + role | medium | ~322 | REQ-422 `priming_carries_the_navigation_rules` (TEXT) |
| B23 | 517–524 contact details; only email is enforced (`refuseUnapprovedEmail`, costs a build) | dup + host | low / medium | ~100 | REQ-389 `no_contact_detail_without_the_clients_yes` (TEXT) |
| B24 | 532–536 "Saying what is running". The `delegation-parallel` / `delegation-serial` templates carry the right rule for each configuration at the point of use. | dup | **high** | 238 | REQ-389 `questions_in_the_clients_terms_and_no_parallel_claims`, REQ-410 `both_consultant_primings_say_what_is_running_and_never_forbid_overlap` (TEXT). Retarget to the templates. |
| B25 | 553–555 "Say what you did with it" (`asksFinishedLine` covers only "all answered") | dup (partial) | low-med | 134 | none |
| B26 | 557–566 "## A logo" ≈ draw_image's description | dup | medium | ~420 | REQ-423 `the_consultant_is_primed_wordmark_first…` reads `primingText('conduct')` (TEXT, 8 fragments) |
| B27 | 570–578 "After a short opening… start the first draft" vs comps-first (749), design-first (809) and the host's first-build gates (`designUnwritten`/`structureUnwritten`) | contra | — | 0 | REQ-416 (TEXT). **Decision D-4.** |
| B28 | 590–593 "New story goes into the next pass" | dup + host | low-med (keep) | 0 | REQ-416 (TEXT) |
| B29 | 615–616 set_readiness sentence | dup | med-high | 78 | none |
| B30 | 620–622 positioning card (write_positioning) | dup (partial) | medium | ~200 | REQ-457 (keep its sentence) |
| B31 | 635–639 "Working on a page together" ≈ talker-discovery template + `gearChangeLine` | dup | med-low | ~330 | none on this copy |
| B32 | 653–656 weakest_point: says to name your own worst-failing test, while the critique description says to name its top finding | dup + host + contra | medium | ~203 | REQ-408 "weakest_point" (TEXT) |
| B33 | 666–674 "Does it look right?" checklist (`NOT_LOOKED`, layout-check kinds) | host + dup | medium | ~440 | REQ-418 `builder_priming_names_the_table…` (TEXT) |

Clean: 286–290, 318–319, 321–324, 334–345, 348–371, 380–392, 398–405, 409–428, 456–458, 480–484, 526–530, 538–552, 595–597, 607–615, 643–653.

### C — client-vocabulary, going-live, comps, looks, showing, focus-tasks, purpose, knowledge providers

| id | passage | class | conf. | chars | pinning tests (AC) |
|---|---|---|---|---|---|
| C1 | 731–735 favicon: "with `make_favicon`, so nothing needs uploading". The consultant holds neither `make_favicon` nor `set_config`. Replace with a line that briefs a builder with `site.json` in scope and keeps "make_favicon" and "Settings tab". | role / stale | med-high | ~100 | REQ-400 `consultant_priming_states_the_going_live_facts` (TEXT; kept) |
| C2 | 723–730 web-address bullet (show_client `web_address`, `NO_ADDRESS_LINE`); keep the pre-Publish check | dup | medium | ~300 | BUG-230 ×3 (BEH) |
| C3 | Knowledge map 896–900 and DOC-47 contradict going-live. DOC-47 says no custom domains and that the contact form doesn't work; the code has both. The map tells the consultant to trust DOC-47. | contra (KB) | **high** | 0 | none. **Fix DOC-47.** |
| C4 | 764–774 "announce the board once, in at most three sentences…". `COMP_ADDED_SAY` (plan-core.ts) is returned by every add_comp and carries the whole rule. | dup | **high** | 828 | BUG-245 `…primed_for_one_voice_and_the_comp_cards`, BUG-263 `…priming_example_says_why_and_what_to_do` (TEXT). Move them to `COMP_ADDED_SAY`; BUG-263's tool-result case already pins it. |
| C5 | 775–781 comp note replies. Replace with the 2-sentence line in the review notes. | dup | med-high | ~300 | BUG-245 (TEXT; partly kept) |
| C6 | 782–793 "two or three exchanges, then name the direction. Then record… visual_concept" vs host cue `CLIENT_COMPS_FINISHED_LINE` "Without waiting to be asked… record them… proposed" | contra | medium | ~250 | REQ-378 (TEXT, `visual_concept`). **Decision D-5.** |
| C7 | 749–753 "Who do you lose jobs to?" vs ask_comps' opener | contra (mild) | low-med | 0 (~110 tool) | REQ-378 (TEXT) |
| C8 | 809–816 "before the first build, which is refused until you have" (`design_first`); "Never put a logo size in a brief" (`logo_sized`, `briefLogoSize`); "more air" (verbatim in set_design) | host + dup | **high** (logo) / med-high | ~360 | none (BUG-276, REQ-448 are BEH) |
| C9 | 818–823 offer_looks / choose_look paragraph (both tool descriptions). Replace with "When the client should choose how the site looks, offer two or three looks with offer_looks." | dup | **high** | ~375 | none |
| C10 | 829–833 first paragraph of showing, verbatim in show_client | dup | **high** | 344 | none |
| C11 | 842–847 "Never switch twice in a row… paste the line show_client answers exactly". `present()` returns a link + `not_switched` (`SWITCHED_ALREADY`), with no round lost. Keep "Never bury the first draft…". | host + dup | **high** | ~330 | REQ-444 needs "Never bury the first draft" (kept) |
| C12 | 835–840 "Each message tells you what the client is looking at" | dup | low | ~100 | BUG-246 (TEXT) |
| C13 | 849–851 naming the parts | dup | low (keep) | 0 | REQ-467, BUG-246 (TEXT) |
| C14 | 857–866 focus-tasks. Mostly enforced (`MAX_FOCUS_INTRO_CHARS`, `focusGuard` → `FOCUS_OPEN`, `unreactedGuard`) or in `FOCUS_SAY` / `focusFinishedLine`, but the per-turn focus line was truncated in this capture. | host + dup | medium | ~480 | REQ-424 `priming_describes_gather_focus_resume…`, REQ-434 (TEXT) |
| C15 | 878–880 "Derived landscape over 14 documents… Descriptions written by: claude… do not hand-edit" (framework `landscape.js:assembleLandscape`) | role (maintainer) | **high** | ~155 | none here. **Framework ticket.** |
| C16 | 59–61 role copy of "your method is written down" (the third copy; `purpose` keeps it) | dup | **high** | ~230 | none on this copy (BUG-65 pins purpose and the tail) |
| C17 | 951 "# How to search" is not empty: `mechanismText` wraps the entire manual under it | cosmetic | — | 0 | REQ-160 (TEXT, heading order) |
| C18 | 741–743 "never say it is missing" | dup (partial) | low (keep) | 0 | REQ-400 (TEXT) |

Clean: client-vocabulary's table (BUG-241), `bc`, going-live's intro/domain/contact form (REQ-400), comps' judgement paragraphs, design judgement, territory descriptions, the rest of purpose.

### D — projected surface manuals (953–1630). All of this counts toward BUG-129.

**Rendering:** `manual.js:surfaceBlock` renders overviews whole and absences unconditionally. That is why the role-mismatch findings below are systemic.

| id | passage | class | conf. | chars | pinning tests (AC) |
|---|---|---|---|---|---|
| D1 | 963 L1 ¶5 "A page can be stored in sections… (`decompose_page`)" | role (builder) | **high** | 813 | none. *Shared with the builder → per-role projection.* |
| D2 | 967 L1 ¶7 "A change is all-or-nothing…" (product-system covers it) | role + dup | **high** | 284 | none. *Per-role.* |
| D3 | 965 L1 ¶6 "Your user can change the site themselves" (list_changes, tail, 1002) | dup | medium | 673 | none |
| D4 | 993, 995 MeasureDrawings group ¶2–3 (in the measure_drawing description) | dup | **high** | 350 | none |
| D5 | 1007 absence "Replacing a whole page in one call" (set_l1 advice) | role | **high** | 247 | AC1080, REQ-126 loop over absences (BEH). *Per-role.* |
| D6 | 1011 absence "Undoing a change" | role + dup | medium | 367 | none |
| D7 | 1006 HTML/CSS/JS absence vs product-system 67–75. Keep the manual copy (pinned). | dup | low | 0 here | AC1080, REQ-126 (TEXT) |
| D8 | 1008 absence "Fetching a picture… `use_font`… write it onto the element". Replace with the line in the review notes, which keeps every pinned token. | role + dup | medium | 977 | BUG-44 ×2, REQ-313 (TEXT; the replacement passes) |
| D9 | 1009–1010 component absences | dup | low | 719 | loop (BEH) |
| D10–D13 | KB: bolded-terms sentence; "three narrower instruments"; the KB list stated three times; the "# How to search" label | dup / stale | medium / low | 197 / 474 / 50 / 17 | REQ-160 (TEXT on D13) |
| D14 | 1062 KB absence "Writing, editing or deleting" (the overview's 1038 says it) | dup | **high** | 177 | none. *Upstream text.* |
| D15 | 1080–1083 "Hand the id [of the ticket holding it] to whoever asked" vs client-vocabulary and Library "Say the number" | contra / stale | medium | 215 | none. *Upstream.* |
| D16 | 1130–1132, 1159–1168 Tickets: cross-project ¶, four write-absences, "limited to: nothing". The consultant holds only the read group (REQ-228). | role (other grant) | **high** | 954 | none. *Per-role / upstream.* |
| D17 | 1134–1138 Tickets pagination ¶ | dup | medium | 333 | none |
| D18 | 1185 "Filing is not something to do on your own initiative" vs client-vocabulary "you report it with ReportBug" | contra | low | 41 | REQ-273 (TEXT), BUG-241 (weak). **Decision D-7.** |
| D19 | 1179–1183 Development tickets ¶3 (ReportBug description) | dup | medium | 378 | none |
| D20 | 1204–1256 Delegation overview ¶2–8. "If you re-inspect everything the worker did, the tokens have been moved rather than saved" contradicts priming 249–254 and fidelity 1338. "Paying your rate for that majority is the waste…" frames delegation as optional, against "Construction is commissioned here". The rest repeats Commissioning construction and Delegate. Keep the first line. | dup + contra | **high** | 3,152 | none in 1stcontact. *Upstream (override as `videogen.ts:guidedDeclaration` does).* |
| D21a | 1273–1276 absences "Deriving the account…", "Choosing the worker's model" (this host supplies both) | stale | **high** | 871 | none. *Upstream.* |
| D21b | the same block: "Granting the worker something extra", "Reading the worker's conversation" | dup | medium | 613 | none |
| D22 | 1266–1269 one-step delegation "sequence" | dup | **high** | 295 | none. *Upstream.* |
| D23 | 1280 "Unset is a configuration mistake rather than a safe default" (operator-facing). Replace with "- You may delegate to: builder." | role (operator) | **high** | 283 | none. *Upstream.* |
| D24 | 1301–1307 "maintain your own **summary** — a standing frame… and a log", plus "say so in the summary log" and the "Deleting a log entry" absence. `host-core.ts:sessionContextSurface` withholds `summary` and the whole MaintainSummary group on purpose; the real mechanism is `set_standing_note`. | contra | **high** | 913 | none (REQ-283 asserts AgentSummary* is not offered, BEH). *Per-role / upstream.* |
| D25 | 1294–1299, 1325 diagnostic ¶ and "Changing your own priming" | role (operator) | low | 649 | none |
| D26 | 1338 fidelity ¶5 "Looking costs context… before you tell your client a page is ready you have looked…". Repeats screenshot, priming 659–666 and 248–254; enforced by `NOT_LOOKED` and `unlookedFor`. | dup + host | **high** | 1,125 | none (REQ-218 pins ¶3, which stays) |
| D27 | 1346 SeeSite group description. Replace with "Nothing here changes anything." | dup | medium | 546 | none |
| D28 | 1336 "You can drive the page…" | dup | medium | 544 | none (REQ-216 pins the absences, which stay) |
| D29 | 1356–1357 sequence "Reproduce a site you were shown" (needs site-editing tools) | role | medium | 615 | none |
| D30 | 1367, 1370, 1373 fidelity absences "Changing anything", "Running the reproduction gates", "Changing a picture" | dup + role | **high** | 798 | none. *Per-role (the builder shares fidelity).* |
| D31 | 1340 "a stranger's website" vs Result provenance (injection defence) | dup | low (keep) | 337 | none |
| D32 | 1402 "Naming a picture is the same everywhere" (five other copies) | dup | **high** | 326 | none |
| D33–D35 | Changing a picture: "Refusing is normal"; "framed on its own"; "You send the whole recipe" | dup | medium / medium / low | 337 / 360 / 343 | REQ-219 `the_manual_says_a_call_replaces_the_whole_list` (TEXT, D35) |
| D36 | 1430–1435 ledger work-log ¶ (near-verbatim with 9–11 and read_work_log) | dup | **high** | 449 | none |
| D37 | 1428 ledger standing-note ¶. Replace with "**Beside the ledger you keep one standing note** (`set_standing_note`): short, rewritten whole, and shown to you every turn." | dup | medium | 470 | none |
| D38 | 1424 ledger "how the next session knows" | dup | low | 331 | none |
| D39 | 1469 "The stages are the client's progress bar…": stale ("a stage is done only when you tick it"), and the copies disagree on where the bar is | dup + stale | **high** | 667 | none |
| D40 | 1465 "Asks are the questions waiting…" (≈ plan-panel 268–273, set_ask) | dup | **high** | 581 | none |
| D41 | 1471 story-board ¶: "It is a third view of the preview, beside View and Edit" is stale (it is under Input). The rest ≈ plan-panel 432–465 and pin_notes. | dup + stale | **high** | 1,394 | REQ-408 `the_consultants_priming_and_manual_describe…` asserts the bold heading in the overview (TEXT). Drop that assertion; its priming half carries the AC. |
| D42 | 1461 "The coordinator asks and records" | role (coordinator) | **high** | 134 | none. *Per-role (the coordinator shares the plan surface).* |
| D43 | 1467 "Milestones fall due" | dup | low | 447 | none |
| D44 | 1559 Library "Say the number". Replace with the short line in the review notes. | dup | medium | 546 | REQ-280 `…say_the_number_to_the_client` (TEXT; the replacement passes) |
| D45 | 1594, 1602 "write the src handle… into a picture element" | role + dup | medium | 379 | none |
| D46, D47 | Library "not the same list as `list_assets`"; absence "pasting the line" | dup | low (keep) | 467 / 489 | BUG-118, REQ-217 (TEXT, deliberate) |
| D48 | 1607–1614 "Your own tools": "That is enough to choose with and not always enough to call with". Stale (tools.json sends full descriptions and schemas) and identical to product-system 98–100. | dup + stale | **high** | 431 | none. *Upstream.* |
| D49 | 959 L1 ¶3 "A page is a tree of typed elements" (≈ product-system 78–80) | dup | medium | 227 | none (AC1080/REQ-126 pin 961, which stays) |
| D50 | 957 L1 ¶2 "The site has two halves" | dup | low | 330 | none |

Clean, or pinned and worth keeping: the L1 opening and addresses paragraph; Knowledge ¶1, ¶3, ¶5; Image generation ¶1–2, ¶4–5; Clips (already trimmed by `videogen.ts`); Tickets ¶1–2; Development tickets ¶1–2 and `CONFIDENTIALITY_NOTE` (REQ-273); Delegation's group line; Context ¶1 and tool lines; fidelity ¶1–3 (REQ-218) and its driving/selector absences (REQ-216); Changing a picture's vocabulary and sizes (REQ-219); the ledger core; the plan's structure, states and groups; Library ¶1–2, ¶5 and the rights absences (REQ-281); Result provenance.

### E1 — the 25 largest tools (~70K chars)

Usage (consultant calls, 2026-09-08 to 10-26): compare **1**, AnimateImage **2**, write_positioning 3, measure_drawing 7, ask_features 6, choose_look 6, draw_image 13. The busiest are Delegate 461, screenshot 362, get_l1 325 (mostly from before writes were withdrawn), list_changes 259, record_decision 148.

| id | passage | class | conf. | chars (tool) | pinning tests (AC) |
|---|---|---|---|---|---|
| E1-01 | compare `b` repeats `a`'s eight property descriptions (4,293 chars, identical; also in `screenshot.of`). Replace with "Same shape as `a`" via `$defs`/`$ref` in the projection (fidelity-surface.json's picture type). This also shrinks the builder's copy. | dup | **high** | ~4,400 | none (REQ-216 pins the `after` text in the source type, untouched) |
| E1-02 | compare in the consultant's grant: 1 call in 3,858 | grant | medium | +5,800 tool, ~600 manual | REQ-157 (BEH) |
| E1-03 | `after` step list ×3 (2 uses); `drivableSteps()` refuses with its own explanation | dup + host | medium | ~720 | REQ-216 `the_declaration_offers_the_steps_and_still_validates` (TEXT) |
| E1-04 | screenshot description restates the fidelity manual (keep tiles and detail) | dup | medium | ~1,300 | REQ-284 (first line only, kept) |
| E1-05 | "list_changes is the cheap answer; a picture costs two turns" ×5 | dup | med-high | ~550 | REQ-284 first lines (kept) |
| E1-06 | capture_site private-address ¶ (`egress-guard.ts:isPrivateIpv4` refuses) / stranger's-website line | host / dup | **high** / low | 280 / 110 | none |
| E1-07 | Delegate framework paragraphs ("Several can run at once", "when the host asks you to" vs "never without a scope", `exhausted` without REQ-409 `replaced`). Override in `account-core.ts` `withBriefRefusal`, or file a framework ticket. | dup + stale | medium | ~1,350 | none (REQ-410/411/397 BEH) |
| E1-08 | Delegate.goal "Never a logo size in px" (`LOGO_SIZED` refusal) | host | medium | ~100 | BUG-276 (TEXT on the tool) |
| E1-09 | Delegate.goal "leave its composition… to the builder" vs set_decision "Every brief that may build home carries this list", which the host appends itself (`structureBrief`, REQ-463) | contra | medium | ~40 | REQ-457 (TEXT), REQ-463 (BEH) |
| E1-10 | AnimateImage: two first lines, "creates a new ticket… last frame" twice, "never returned here as data" twice (`videogen.ts` joins summary + description + overview) | dup | **high** | ~425 | REQ-461 ×2 (TEXT, kept) |
| E1-11 | CreateImage/EditImage "new ticket… never returned here as data" (framework) | dup | medium | ~330 | none |
| E1-12 | set_ask ¶2–3 (three copies; `ASK_SHOWN`/`ASK_WITHDRAWN` refusals). Kept, because B4/B5 delete the priming copy. | dup + host | — | — | REQ-401 `the_ask_operation_says_the_same` (TEXT) |
| E1-13 | show_client restates "Bring the right view". Kept, because C10/C11 delete the priming copy. | dup + host | — | — | REQ-467 (TEXT) |
| E1-14 | set_design ¶1 ≈ priming 803–813 + `DESIGN_FIRST` | dup + host | med-high | ~330 | none |
| E1-15 | set_design completeness list (`editDesignSet` → `l1DesignMissing` names every missing part) | host | medium | ~1,200 | REQ-456 (BEH) |
| E1-16 | set_decision home-structure ¶ (`STRUCTURE_FIRST_ERROR`, `STRUCTURE_SAY`) | dup + host | medium | ~600 | REQ-460 (BEH) |
| E1-17 | set_stage (refusals: `TICKS_ITSELF`, order, draft-not-seen, reason, `NOT_LOOKED`) | dup + host | medium | ~1,050 | none |
| E1-18 | draw_image logo/look-first/display ¶ (≈ "## A logo"); SVG rules enforced by `validateSvg()` | dup + host | med-high | ~1,400 | none |
| E1-19 | alt-text / element-writing ×4 (place_on_site, get_library_item, draw_image, Library manual) | role | medium | ~800 | none (BUG-282 is other text) |
| E1-20 | get_l1 / describe_page write-back advice. Consultant-only noise, but builders call these thousands of times. | role | high (consultant) | ~550 | none. *Per-role.* |
| E1-21 | measure_drawing ≈ the manual group (kept; D4 removes the manual copy) | dup | — | — | — |
| E1-22 | ask_features ¶2, ¶4. Kept, because B9 removes the priming copy. | dup | — | — | — |
| E1-23 | choose_look ¶2. Kept, because C9 removes the priming copy. | dup | — | — | — |
| E1-24 | write_positioning "a rewrite is refused" (`CLIENTS_WORDS`) | host | medium | ~60 | none |

Clean: list_library, update_brief, record_decision; get_library_item, list_changes, describe_page and capture_site apart from the findings above.

### E2 — the other 66 tools (~58K chars)

Usage: never called by the consultant are **AgentContext, AgentPriming, AgentReminder, TicketComments, TicketBacklinks, TicketHistory, set_readiness** (shipped 10-21), plus client-driven tools that are kept: delete_library_item, remove_comp, move_note, and offer_looks (shipped 10-24).

| id | passage | class | conf. | chars (tool / system) | pinning tests (AC) |
|---|---|---|---|---|---|
| E2-1 | AgentContext/AgentPriming/AgentReminder: never called. They return text already in the request. AgentReminder's "re-delivered on every turn through the system channel… the only way to see it" is false here (the reminder rides the user message). | grant + stale | **high** | 2,194 / ~900 | REQ-283 `it_is_offered_the_reads_on_its_own_conversation` (BEH; AC3 would need revising) |
| E2-2 | AgentHistory "those ids are what a summary entry cites" (no summary on this host; see D24) | stale | **high** | 152 / ~1,000 | none. *Upstream.* |
| E2-3 | Ticket* family: TicketGet failed `not_found` 3/3 (product BUG ids); TicketQuery returned empty 5/8; three tools never called. TicketGet says "Read before you update…" to a read-only grant. | grant / stale | medium / **high** (sentence) | 3,628 or 108 / ~2,600 | REQ-228 ×5 (BEH) |
| E2-4 | DescribeTools returns what tools.json already carries (4 calls, for set_design). The premise is stated three times. | dup + stale | medium | 721 / ~1,050 | REQ-171 (BEH) |
| E2-5 | read_work_log explained three times (see A1, D36) | dup | medium | 0 / ~1,070 | none |
| E2-6 | set_standing_note: "It is bounded" but never says 4,000 bytes. 38 of 287 calls were refused as too long. Replace with "It is bounded at 4,000 bytes; over that it is refused whole, never trimmed." | dup + host | med-high | ~60 net / ~560 | REQ-283 (tail text, kept) |
| E2-7 | Builder-only lines in L1 reads (get_page_style "Read this before you paint…", get_design "The design is the consultant's…", list_behaviors, get_asset alt ¶, list_assets) | role | medium | 1,036 | none. *Per-role.* |
| E2-8 | get_design vs read_design (same design) | dup | med-low | 1,447 | REQ-449 (TEXT "get_design lists them") |
| E2-9 | record_check_answer: "Only the consultant (`alice`) and the client (`user`)… the coordinator never answers". All 23 calls used `by: user`, and answer_check already covers the consultant. Replace with "Record the client's answer to a check, in their words." | dup + role + host | **high** | 220 / ~130 | REQ-356 (BEH) |
| E2-10 | Story-board rules in three places; several refused (`story-core.ts`) | dup + host | medium | ~520 / ~1,560 | REQ-408 (fixture only) |
| E2-11 | Comp-board mechanics in three places (add_comp's result carries `say`) | dup | medium | 524 / ~280 | none |
| E2-12 | approve_detail restates conduct | dup | medium | 321 | none |
| E2-13 | critique / answer_finding review schedule is incomplete (misses three `DUE_BECAUSE` reasons); per-turn entry and hold cover it | host + stale | med-high | 318 | none |
| E2-14 | set_readiness "your plan entry shows them every turn" is false (truncation) | stale | **high** (clause) | 39 (744 with the tool) | REQ-425 ×2 (BEH) |
| E2-15 | start_focus "never start one as the answer to a yes" (also in priming) | dup | medium | 0 / ~70 | REQ-434 (TEXT on the priming) |
| E2-16 | Library "only on the client's say-so" repeats | dup | medium | 69 / ~190 | none |
| E2-17 | "Send the whole list" ×3, while the `{op:"crop",…}` shape is stated nowhere (2 refused calls) | dup | med-high | 335 | REQ-219 (manual copy kept) |
| E2-18 | list_assets vs Library; the manual says list_assets includes "drawings you made yourself" (they stay in the Library until `place_on_site`) | dup + contra | med-low | 149 | BUG-118 (TEXT, kept) |
| E2-19 | ReportBug and RequestCapability both end "The ticket is filed as a draft…" | dup | **high** | 238 | none. *Upstream.* See D-7. |
| E2-20 | Knowledge tools repeat the narrow-read guidance (8 `not_in_corpus` failures anyway) | dup | low-med | ~560 | none |
| E2-21 | describe_site "The opening move…" (the tail carries the site); status last called 09-19 | stale / grant | medium / low-med | 66 or 314 | none |
| E2-22 | describe_reference framed for reproduction | dup + role | low | 305 | none |
| E2-23 | add_note writes a plan note while the other "note" tools act on the board | naming | low | 0 | none |

Clean: AddTicketDetail, answer_check, ask_check, end_focus, get_config, KnowledgeSearch, list_references, name_engagement, read_design, read_plan, set_feature, set_task, AgentHistorySearch, get_palette, fill_ask, withdraw_ask, offer_looks (too new to judge), web_search (no text, but 17 of 33 results were empty).

## Where reviewers disagreed, and how I settled it

Several duplicates were proposed for deletion from both ends. The rule I applied: **keep the copy at the point of use; keep the priming copy only for judgement needed before a tool is chosen, or when only the priming copy is pinned for an AC that needs the text.**

| Rule | Removed | Kept, and why |
|---|---|---|
| Asks / stages / story board | the manual copies (D39, D40, D41) | the priming. The manual copies are stale ("third view", "only when you tick it"); the priming copies are pinned (REQ-364, REQ-408) and are judgement. B1, B3 and B16 are dropped. |
| set_ask, ask_features, choose_look, show_client | the priming copies (B4, B5, B9, C9, C10, C11) | the tool copies. E1-12, E1-13, E1-22 and E1-23 are dropped. |
| Work log | both system copies (A1, D36) | read_work_log |
| Running in parallel | the conduct copy (B24) | the delegation template copy. A12 is dropped. |

## Proposed cuts, in the shape of BUG-272

Totals are system chars (S, counts toward BUG-129) and tool chars (T).

### Cut 1 — consultant priming and in-repo manuals, high confidence (S ≈ 11.4K)

**What changes:**
- **`priming.json`:**
  - A1: the `tool-transcript-note` template / provider returns nothing.
  - A10, A11.
  - B2, B4, B5, B9, B13, B15 (replace), B17, B18 (the three high parts), B19 (stale part), B24.
  - C4, C8 (logo + design-first clauses), C9 (replace), C10, C11, C16.
- **`fidelity-surface.json`:** D26 (overview ¶5).
- **`image-surface.json`:** D32.
- **`ledger-surface.json`:** D36.
- **`plan-surface.json` overview:** D39, D40, D41.
- **`l1-surface.json`:** D4 (MeasureDrawings group ¶2–3).
- **Total:** 763 + 130 + 156 + 216 + 201 + 433 + 729 + 151 + 110 + 390 + 200 + 317 + 238 + 828 + 360 + 375 + 344 + 330 + 230 + 350 + 1,125 + 326 + 449 + 667 + 581 + 1,394 ≈ **11.4K system chars**, about 10% of the system text. That is real BUG-129 headroom; today there is about 100 chars.

**Tests to retarget in the same change.** Every one keeps its AC; only the place the wording is asserted moves.
- **REQ-401** `questions_lead_with_their_subject_and_every_added_question_is_announced`: assert on set_ask, as its sibling already does.
- **BUG-236** `the_consultant_is_primed_to_pace_one_thing_at_a_time`: drop the one-line-announcement and fold fragments.
- **BUG-265** `priming_and_set_ask_announce_questions_with_the_link_inside_the_line`: drop the priming half.
- **BUG-245** `the_consultant_is_primed_for_one_voice_and_the_comp_cards` and **BUG-263** `priming_example_says_why_and_what_to_do`: move the assertions to `COMP_ADDED_SAY`.
- **REQ-408** `the_consultants_priming_and_manual_describe_the_board_reactions_and_headline`:
  - "never add a claim, a fact or an adjective" moves to the pin_notes description;
  - the manual-heading assertion goes;
  - "Ask about every 👎", "offer_headlines" and "weakest_point" stay in the priming.
- **REQ-389** `questions_in_the_clients_terms_and_no_parallel_claims` and **REQ-410** `both_consultant_primings_say_what_is_running_and_never_forbid_overlap`: assert on the delegation templates.
- **BUG-210** `no_registerdefaults`: unchanged if the provider stays registered and returns empty.
- **Still pinned and kept:**
  - REQ-444 ("Never bury the first draft");
  - REQ-397 (scope paragraph);
  - BUG-65 (purpose and tail);
  - REQ-280;
  - BUG-129 itself, which should go comfortably green.

### Cut 2 — in-repo tool text, high confidence (T ≈ 5.4K)

- **E1-01:** compare `b` → "Same shape as `a`" (`$ref` in the projection; 4.4K). This also shrinks the builder's copy of compare and its prompt.
- **E1-06a:** capture_site private-address ¶ (280).
- **E1-10:** AnimateImage double statements (`videogen.ts:guidedDeclaration`, 425).
- **E2-9:** record_check_answer ¶ (220).
- **E2-14:** set_readiness "every turn" clause (39).
- **Tail:** T1 (~150 per turn). T2 (~290 per turn) is medium-high; fold it in if the operator accepts it.
- **Tests:** none on this text. REQ-216, REQ-461 and BUG-128 assert passages that are kept.

### Cut 3 — per-role projection (framework; S ≈ 4.1K high, ~6K with medium)

Text the consultant can't act on but the builder (or coordinator) needs. Deleting it would hurt the builder, so the fix is projection.

- **The fix:** lagrange-framework `manual.js:surfaceBlock` renders an absence or overview paragraph only when its subject group is (or is not) granted. Overview paragraphs need group tags in the declarations.
- **Items:**
  - high: D1, D2, D5, D16, D24, D30, D42, E1-20;
  - medium: D6, D8, D29, D45, E1-19, E2-7.
- **Tests:** AC1080 / REQ-126 (`the_manual_is_a_projection_of_the_declaration_and_the_grant`) state the rule this changes, so they need updating with it. BUG-44 and REQ-313 still pass on the builder's manual.

### Cut 4 — upstream text (framework, or a local override like `videogen.ts:guidedDeclaration`; S ≈ 5.4K high)

- **Items:**
  - high: D20 (delegation overview, 3.2K), D21a, D22, D23, D14, D48, C15 (landscape boilerplate), E2-2, E2-19;
  - medium: D15, E1-07, E1-11, E2-3 (sentence).
- **Tests:** no 1stcontact tests pin this text. Framework conformance fixtures may.

### Cut 5 — grant changes (an operator decision; T ≈ 9K + S ≈ 1.5K)

- **Remove from the consultant's grant:**
  - **compare:** 1 call ever. The builder keeps it.
  - **AgentContext, AgentPriming, AgentReminder:** 0 calls, and they return text already in the request.
  - **TicketComments, TicketBacklinks, TicketHistory:** 0 calls.
- **Consider:** DescribeTools, status.
- **Also:** every removal edits `talker.json`. REQ-283 AC3 and REQ-228 assert these tools are offered, so they need revising.
- **Why it is in scope:** DOC-68's rule applies: a tool kept only because the instructions mention it is code debt.

### Second wave (medium confidence)

Roughly 17K system and 19K tool chars across A2, A4, A6–A8, A14–A15, B3, B8, B10–B11, B21–B22, B26, B29–B33, C1–C2, C5, C14, D3, D8, D10–D11, D17, D19, D21b, D27–D28, D33–D34, D37, D44, D49, E1-03–E1-05, E1-08, E1-14–E1-19, E1-24, E2-4–E2-8, E2-10–E2-13, E2-15–E2-17.

Several of these lean on a per-turn line that currently gets truncated (see Other defects), so they should follow the plan-entry fix. Per DOC-68's condition, anything in this wave that changes what the consultant reads at a decision point should be evaluated on replayed turns before landing.

## Decisions needed (contradictions, not deletions)

| | Question | The passages |
|---|---|---|
| D-1 | Build-start message: say it in chat or not, and what does it end with? | Commissioning `note` (165–167) says "do not say it again… end with a story question". plan-panel 290–292 says "invite them to answer a few of the panel's questions". conduct 582–588 says "say what is being built… end with a question that changes the build, or with nothing". The tail says "End it with one story question, never silence". |
| D-2 | Options vs one proposal at a real decision | consultant-role 53–58 + the tail `method` line vs conduct "Propose first, then ask" (607–615) |
| D-3 | Hand-back length | "about three lines" (294–297) vs the four-part hand-over (599–605) vs the first draft's `FIRST_DRAFT_LEAD` |
| D-4 | "Build sooner, story later" | 570–578 vs comps-first (749), design-first (809) and the host's first-build gates |
| D-5 | Comps: talk then record, or record proposed then talk | comps 782–793 vs the host cue `CLIENT_COMPS_FINISHED_LINE` |
| D-6 | Headline: "move on" if nothing lands | 461 vs the `headline_chosen` finish line, which keeps Getting to know you open |
| D-7 | ReportBug on the consultant's own initiative? | the Development tickets manual ("not on your own initiative", REQ-273-pinned) vs client-vocabulary ("you report it with ReportBug") |
| D-8 | Re-inspecting builder output | Delegation overview vs priming 249–254 / fidelity 1338. Resolved by deleting D20 if Cut 4 lands. |
| D-9 | Plan entry while the draft is unseen | "Other questions wait until they have" followed by "Due: ask… layout_happy / quality_bar_met" |

## Other defects found (not prompt text)

1. **The plan entry is truncated.**
   - The per-turn site plan hits `MAX_PLAN_REMINDER_CHARS` (2,000) at 1,963 chars and ends at a dangling "Due:".
   - The readiness, story-board, story-settled, stage-missing and focus lines are lost every turn once the agenda is long.
   - Several tools (set_readiness, focus) tell the consultant those lines appear every turn.
   - Code: `plan-core.ts` `agendaLines` / `planReminder`.
2. **DOC-47 is stale** (C3).
   - It says there are no custom domains, the address is `1stcontact.io/site/…`, and (in the map's summary) the contact form doesn't work. Code has custom domains, `.1stc.site` and lead capture.
   - The knowledge map tells the consultant to trust DOC-47 over other claims.
3. **going-live points at `make_favicon`**, which the consultant lacks (C1).
4. **set_standing_note is refused 13% of the time** (38 of 287) because the bound isn't stated (E2-6).
5. **TicketGet fails 3 of 3 times** on product BUG ids, which aren't in the client's store (E2-3).
6. **The consultant is called "alice"** in `record_check_answer`'s description, against DOC-66 (E2-9).
7. **web_search came back empty 17 of 33 times.**
8. **Two tests are red on clean working**, according to the reviewers who ran them:
   - `test_UAT_FC_REQ-376_the_consultant_priming_names_the_control_in_both_orders` expects `/same email/`, which the priming doesn't contain;
   - `test_UAT_FC_BUG-245_the_consultant_is_primed_for_one_voice_and_the_comp_cards` uses a case-sensitive regex against "The line…".
9. **The REQ-171 tail budget** is at 599 of < 600.

## Not covered

- **Turn history:** 35 messages, 19.5K chars in this capture. It is not fixed prompt.
- **The knowledge map's territory text:** generated from the client's knowledge base and differs per tenant; only checked for contradictions (C3, C15).
- **Behaviour evaluation:** none was run. The confidence levels are the reviewers' judgement from code and usage, not measurement.
