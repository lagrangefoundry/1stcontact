---
uid: report-0911f3ec
id: REPORT-1317
type: report
title: 'UAT Coverage: framework_substrate'
created_by: xgd
created_at: '2026-08-05T21:05:07.958548+00:00'
updated_at: '2026-08-05T21:05:07.958548+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-ae9d65d6
  violations: 2
  warnings: 6
  needs_review_count: 1
---

# UAT Coverage Assessment: framework_substrate

**Result**: FAIL
**AC verdicts**: 23 pass, 1 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 2 pass, 1 fail, 1 stale, 1 needs_review
**Capability verdict**: fail

Scope: 5 stories (STORY-81 archived, holds no ACs) / 24 ACs across the other four.
Every AC has exactly one `test_UAT_AC<n>_*` test. All five UAT files were executed
this cycle (`npx vitest run` over the five reconciliation files): **22 passed,
2 skipped** (AC-683, AC-688 — engine-gated; see Warning 3), 5/5 files green,
duration 1.18s. Every test body was read; the judgment below is on substantive
coverage, not on the presence of a matching name.

## Cumulative Intent Considered

Verified directly this cycle (`xgd ticket get`), ordered by `created_at`.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-79 `request-87b26bca` | free_and_reconciled | 2026-07-19 | Framework pivot: L1 substrate + module contract | YES |
| REQ-82 `request-11efc10f` | free_and_reconciled | 2026-07-20 | L1 schema + envelope validator + sole safe renderer (AC-682…688) | YES |
| REQ-84 `request-f243b6b9` | free_and_reconciled | 2026-07-20 | **Retired** the semantic layout modules and their ~20 dials | YES (retires) |
| REQ-85 `request-015e42ac` | free_and_reconciled | 2026-07-20 | Module contract; reframed carousel / contact-form (AC-697…704) | YES |
| REQ-87 `request-84af044b` | free_and_reconciled | 2026-07-21 | **Retired the name** "capability module" → *behavior module*, atomic, no alias (AC-722/723) | YES (retires) |
| REQ-90 `request-bc4c1408` | free_and_reconciled | 2026-07-23 | L1 document-level font resource table (AC-727/728) | YES |
| REQ-91 `request-42385423` | free_and_reconciled | 2026-07-23 | Typed pixel-mover axes (AC-725/726) | YES |
| REQ-93 `request-f26cbe32` | free_and_reconciled | 2026-07-25 | L1 pages host behavior modules bound to slots (relax the page XOR; mount the fragment into the placeholder) | YES — but see needs_review 1 |
| REQ-96…107 `bundle-ee56a66e` (BUNDLE-11) | bundled / reconciling | 2026-07-26…27 | L1 `control` node, text sizing, uniform surface group, hover/focus, motion, pattern, row wrap, slot sizing, link role, validator-always-runs | imminent — see Warning 6 |
| REQ-108 / REQ-114 | ready_to_reconcile | 2026-07-29…31 | Pointer-reactive texture; L1 palette colour model (literal base + palette overlay) | imminent — see Warning 6 |

Nothing in the ledger retires the *behaviour* any active AC describes. REQ-84 and
REQ-87 are the two retiring intents, and both are already absorbed: REQ-84's
module-dial ACs (AC-660…681, AC-666…673) were archived in earlier passes, and
REQ-87's rename is pinned by AC-682/686/722/723 — but its prose consequences were
not carried into STORY-82 (violation 2).

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-83 `story-d0a8cfad` | REQ-79, REQ-82, REQ-87, REQ-90, REQ-91 | aligned, gap | Body's emitter-defence claim for the structured families is unproven (violation 1) |
| STORY-80 `story-c490f1cf` | REQ-79, REQ-84, REQ-82 | aligned | Absolute base re-homed on L1 leaf axes; AC-716 proves literal-verbatim + 7 rejections |
| STORY-81 `story-3569e1a4` (archived) | REQ-79, REQ-84, REQ-82 | aligned | Supersession record only; behaviour re-homed on AC-684 (multi-segment track arm). Minor self-reference drift — warning 4 |
| STORY-82 `story-46e3b3c7` | REQ-79, REQ-84, REQ-85, **REQ-87** | **stale** | Body still calls the runtime type a "capability module"; REQ-87 retired that name atomically |
| STORY-85 `story-179b8c06` | REQ-85, REQ-87, (REQ-93) | **needs_review** | Own claims fully proven; REQ-93's page-level slot binding is described by no story and is absent from this branch's code |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | uat | AC-685 (`tests/reconciliation-l1-substrate.test.ts:302`) | uat-edit | AC-685's criterion has two paragraphs. ¶1 (text / alt / image-src / font-family) is proven; **¶2 is untested** — no test places a payload in a gradient stop colour, border colour, background-image URL, shadow, mask/transform field and asserts the emitter drops it. The renderer *does* implement this (`colour()` drops non-hex at `render.ts:41-43`; `isSafeUrl` + an independent character allowlist at `render.ts:70-85`), so the defence is real but unproven. AC-726 covers only the *validator* side; AC-725 covers only the happy path. AC-727 already proves the font-face half of ¶2. | Extend `test_UAT_AC685_*` with a structured-axis arm: render (bypassing `validateL1`) a doc carrying `surfaceGradient.stops[].color: 'red;}</style>'`, `border.color: 'expression(alert(1))'`, `backgroundImageUrl: 'javascript:alert(1)'`, a shadow/mask/transform payload, and assert the emitted CSS contains no `</style>`, `@import`, `javascript:`, `expression(` and that the unsafe URL / non-hex colour are absent entirely |
| 2 | violation | story | STORY-82 `story-46e3b3c7` | story-body-edit | Body describes the post-pivot contact-form as a "**capability module**" and refers to "capability config", "the capability validators" and "the Capability Modules story". REQ-87 (free_and_reconciled) renamed the runtime type to *behavior module* and forbids any alias; STORY-85 was updated for the rename, STORY-82 was not. | Replace "capability module / capability config / capability validators / Capability Modules story" with "behavior module / behavior config / behavior validators / STORY-85 (Behavior modules …)". No behavioural claim changes |
| 3 | warning | ac | AC-718 `acceptance_criterion-f3328e22` | ac-edit | Same retired naming as finding 2: "The contact-form **capability** exposes…", "the **capability's** named `submit` slot", "the **capability's** typed `config`". The behavioural claim is correct and proven by `test_UAT_AC718_*`; only the type name is stale. | Rename to *behavior module* throughout the criterion and its verification block |
| 4 | warning | ac | AC-719 `acceptance_criterion-da7c62ec` | ac-edit | Criterion says each L1 node carries its colour/border/opacity "as a literal **(or a named overlay role)**". Per REQ-79 language-triviality principle #2 — echoed by STORY-80's own body — L1 carries only the absolute literal; the named overlay is parked in L2 and has no L1 form on this branch (`grep -ci palette packages/site-schema/src/l1/schema.ts` → 0). The hedge describes an affordance the substrate does not have. | Drop the "(or a named overlay role)" clause; keep the literal claim |
| 5 | warning | uat | AC-683, AC-688 | environment | Both engine-gated probes **skipped** in this worktree: `playwright` is declared in `tools/generate/package.json` but is not installed here (root `node_modules` holds 9 entries; the browser binaries *are* cached under `~/Library/Caches/ms-playwright`). The tests themselves are substantive (real capture, empty Type-A delta set at 6 widths; 3-engine position/width/font-size agreement) — they are simply unexercised. The round-trip identity gate and the cross-browser guarantee therefore carry no executed evidence on this branch. | Install the workspace dependency in the regression worktree so both probes run, or record an explicit environment exemption |
| 6 | warning | story | STORY-81 `story-3569e1a4` | story-body-edit | Body's closing disposition says "This story is therefore **archived under a superseded capability**". Since the 2026-08-05 structural rebalance the story hangs under CAP-70 (`capability-ae9d65d6`, active); CAP-68 `capability-bd0b722e` remains the superseded container. The statement is now wrong about its own parent. | Reword to "archived; its capability CAP-68 was superseded and this record now hangs under CAP-70" |
| 7 | warning | ac | AC-716, AC-718, AC-719 | matrix-hygiene | These three ACs are still `status: pending` while the other 21 in the capability are `active`, and all three have green, substantive evidence. | Promote to `active` unless the pending state is deliberate |
| 8 | warning | capability | CAP-70 | out-of-band | BUNDLE-11 (`bundle-ee56a66e`, status `reconciling`) carries REQ-96…107 — L1 `control` node, text `sizing`, uniform surface group, hover/focus, motion, pattern, row wrap, slot sizing, link role, always-run validator — plus REQ-108/REQ-114 at `ready_to_reconcile`. All count as imminent intent and none is described by any story here. **They are not a coverage gap on this branch**: verified absent from the code (`hover`/`focus`/`pattern`/`control`/`palette` all zero hits in `packages/site-schema/src/l1/schema.ts`), their commits live only on `xgd-working`, and BUNDLE-11's own reconcile owns the matrix update. Recorded so the next pass does not rediscover it as drift. | No action for this editor; leave to BUNDLE-11's reconciliation |
| 9 | needs_review | story | STORY-85 `story-179b8c06` | — | **REQ-93** (`request-f26cbe32`, status `free_and_reconciled`, bundled in BUNDLE-10 which is also `free_and_reconciled`) requires an L1 page to bind behavior-module instances to named slots — relaxing the REQ-88 XOR and mounting each module's fragment in place of the inert `data-l1-slot` placeholder. No story in this capability (or any other — searched all story bodies) describes that behaviour, and it contradicts AC-723's "inert placeholder … no module code and no attached behaviour", which is what this branch's emitter actually does. The code is **not on main**: `packages/site-schema/src/schema.ts:540-547` still raises "a page is either a module stack or a raw L1 document, not both", and REQ-93's commit `71ba1177` is contained only by `xgd-working`. | Operator decision. Either (a) REQ-93's reconciled status is premature — its commit never reached main, so revert it to a pre-reconciled state and let a later bundle carry it; or (b) the matrix owes a story + ACs for slot-bound mounting, in which case AC-723 must be re-scoped at the same time (it currently pins the pre-REQ-93 semantics) |

## Notes for the Editor

**One real coverage gap, one naming sweep, one status question.** Only finding 1
needs a test written; the rest of the violations/warnings are prose.

**The REQ-87 rename is half-landed in the matrix.** STORY-85 and its ACs were
carried across; STORY-82 and AC-718 were not, and the STORY-82 UAT file's own
comments (`tests/reconciliation-reproduction-treatments.test.ts:9,35,115,128`)
still say "the contact-form capability's SSR render" / "the two survivor
capabilities". Findings 2 and 3 plus those comments are a single sweep — do them
in one pass, and grep for `capability` across the CAP-70 tickets and the five
reconciliation test files afterwards to confirm the only survivors are the
deliberate ones (the `capabilities.js` bundle filename, which REQ-87 left alone on
purpose, and the XGD-matrix sense of the word).

**Finding 1 is a defence-in-depth test, not a bug report.** The renderer already
drops the unsafe values; DOC-2 §2 calls the emitter "layer 2 … defence in depth",
and the whole point of AC-685 is that it holds *for a value that bypassed
validation*. Today that is proven for the four scalar sinks and for the font
resource table (AC-727 already drives five unsafe entries through and checks
brace balance) but not for the seven structured families REQ-91 added. The new
arm must call `renderL1Document` directly on a doc that would fail `validateL1` —
routing it through the validator first would test the wrong layer.

**Do not treat findings 5 and 8 as work.** Finding 5 is a worktree provisioning
gap, finding 8 is in-flight reconcile traffic. Neither is matrix drift, and both
are recorded only so the next attempt does not re-derive them.

**Finding 9 is the one that needs the operator, not the editor.** A ticket marked
`free_and_reconciled` whose code exists on no branch but `xgd-working` is either a
status error or a lost merge; either way the matrix cannot be edited into
correctness until that is settled, because authoring ACs for slot-bound mounting
here would produce UATs that cannot pass on this branch.
