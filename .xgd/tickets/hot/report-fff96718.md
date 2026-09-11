---
uid: report-fff96718
id: REPORT-3877
type: report
title: 'Capability-Intent Alignment: Page Authoring Through The Control Surface: Read
  & Replace The Element Tree (level=uat)'
created_by: xgd
created_at: '2026-09-11T02:37:49.185218+00:00'
updated_at: '2026-09-11T02:37:49.185218+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-fe236246
  level: uat
  violations: 1
  warnings: 3
  needs_review_count: 0
  anchor_report_uid: report-e37a6b4a
---

# Capability-Intent Alignment: Page Authoring Through The Control Surface: Read & Replace The Element Tree
# Level: uat

**Result**: FAIL
**Violations**: 1
**Warnings**: 3
**Needs review**: 0

At `uat` level the AC bodies AC-1083 … AC-1094 are the working reference. Intent was read
to build the ledger and to confirm that nothing reconciled since the previous `uat` cycle
(REPORT-2050, 2026-08-16) retires or widens a behaviour a UAT asserts.

**The one violation is a cascade the `ac`-level fix left half-applied this morning.**
AC-1090 was strengthened at 2026-09-11T02:19:42 (report-9b910172, attempt 2) to require the
offending field *as well as* the recovery strategy. That fix added the pointer assertion to
the free-coded suite (`test_UAT_FC_REQ-129_l1_authoring.test.ts:397`) but not to the
AC-numbered UAT, which is the test the `test_UAT_AC<n>_` convention makes AC-1090's
evidence. That UAT still asserts only the strategy half, and its inline rationale states
the *opposite* of the AC it is named for.

## Cumulative Intent Considered

STORY-106 (`story-189fc1ac`) is the only story under CAP-93. Its `intent_uid` is
`bundle-e59210c5` (BUNDLE-17, `free_and_reconciled`, merged `0198704b`); the source ticket
within that bundle is REQ-129.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-126 | free_and_reconciled | 2026-08-08 | Declared the surface, error taxonomy, addressing (CAP-92); used unchanged here | YES (prereq) |
| REQ-129 | free_and_reconciled | 2026-08-09 | **Originating intent**: `describe_page` over every node; verbatim `get_l1`; subtree-replacing `set_l1`; `get_copy`/`set_copy` retired; `AuthorPages` group; guarantee moved into the closed vocabulary | YES |
| REQ-130 | free_and_reconciled | 2026-08-09 | Beyond L1 (config, modules, metadata, assets); outside CAP-93 scope; bumped `surface_version` | YES (adjacent) |
| REQ-131 | free_and_reconciled | 2026-08-11 | Draft change journal; no change to element read or replace. **Was `ready_to_reconcile` at REPORT-2050; now reconciled** — still adds no element-tree behaviour a UAT must cover | YES |
| REQ-135 | free_and_reconciled | 2026-08-12 | Editor text properties; widens `copyFieldsOf` descriptors (warning 2) | YES |
| REQ-137 | free_and_reconciled | 2026-08-12 | Palette shade on the reference replaces named steps. **Was `bundled` at REPORT-2050; now reconciled** — this is why its entry is a warning this cycle rather than the `info` it was (warning 3) | YES |
| REQ-139 | free_and_reconciled | 2026-08-12 | Locks controls that cannot express what the element holds; the colour row for a gradient-filled run | YES |
| REQ-140 | free_and_reconciled | 2026-08-15 | A painted container becomes a segment; an **unpainted** one still returns `null` — AC-1094's premise, unchanged | YES |
| REQ-142 | free_and_reconciled | 2026-08-15 | Async `SiteStore` port; every L1 operation awaited (test file :143-150) | YES (mechanism) |
| REQ-146 / REQ-149 | free_and_reconciled | 2026-08-15 / 08-17 | AI host into workerd; `publish` into the portable core — why AC-1092's UAT unions `l1Operations` + `nodeOperations` (:617-628) | YES (mechanism) |
| REQ-134 | abandoned | 2026-08-12 | Image-generation component | NO |
| REQ-157 | draft | 2026-08-20 | The fidelity surface (look, compare, judge) | NO — not yet active |

Nothing in the ledger retires a behaviour a CAP-93 UAT asserts, and nothing reconciled
adds an element-tree read/replace behaviour that no AC covers. The only ledger movement
since REPORT-2050 is REQ-131 and REQ-137 reconciling; neither creates a coverage gap
against an AC body, and REQ-137 accounts for warning 3.

## Alignment Ledger

All 12 UATs live in `tests/reconciliation-page-composition-surface.test.ts`. All 12 are
substantive: real `createL1Toolbox`, real `L1_DECLARATION`/`L1_INSTANCES`, real draft bytes
off disk, a real `cmdRender`, and a real `/api/copy` origin. Nothing internal is mocked and
no UAT is a structural/AST-only check.

**Execution this session**: `npm test -- tests/reconciliation-page-composition-surface.test.ts`
→ **10 passed, 2 skipped (12)**. The two skips are AC-1093 and AC-1094, whose `beforeAll`
calls `startBuilder` and dies on `EPERM: listen 0.0.0.0`
(`tools/generate/src/cli/builder.ts:363`) — a sandbox socket restriction, not a test defect.
Separately, `npm test -- <both suites> -t refusal` → **2 passed**, which is the empirical
half of finding 1.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1083 (:228) | REQ-129 | aligned — map compared against a walk written in the test (:176), not the code's own notion of an interesting node; order, address/kind/label, `module`+`slot` present only inside instances, and a count closure proving no entry belongs to neither space |
| AC-1084 (:278) | REQ-129 | aligned — label rule asserted per kind, the control name read off the stored instance rather than a fixture; no axis name anywhere in the map; size-independence measured unstyled vs richly styled (:347-359) |
| AC-1085 (:369) | REQ-129, REQ-137 | aligned, **warning 3** — ref stays a ref, keyframe track stays a track, `target` names page+path, scoped read names module+slot; but the seeded reference is the bare pre-REQ-137 form |
| AC-1086 (:417) | REQ-129 | aligned — acceptance asserted *before* unchanged-ness exactly as the AC demands (:424-426); compared as structure, not bytes |
| AC-1087 (:433) | REQ-129 | aligned — siblings and a second page byte-identical; the count arithmetic (:471-473) closes the inserted-beside-it gap; reply names the address |
| AC-1088 (:476) | REQ-129 | aligned — the declared sequence and its no-separate-insert-or-delete note asserted, then map→read→replace, then a real render asserting both anchor targets (`about`, `#contact`), then removal |
| AC-1089 (:540) | REQ-129, DOC-2 | aligned — all six enumerated cases, each `SCHEMA_INVALID`, draft bytes identical after. This is the security-boundary UAT and it is complete |
| AC-1090 (:565) | REQ-129 | **VIOLATION (finding 1)** — asserts the code and the three strategy statements; never asserts the pointer the AC has required since 02:19 today, and its comment denies it reaches the caller |
| AC-1091 (:584) | REQ-129 | aligned — `NOT_FOUND` with the re-read-the-listing remedy; malformed refused distinctly (`SCHEMA_INVALID`, explicitly not `NOT_FOUND`); bytes unchanged after both |
| AC-1092 (:611) | REQ-129, REQ-130, REQ-146, REQ-149 | aligned, **warning 1** — exact set equality both directions over the `l1Operations`+`nodeOperations` union; retired pair absent from declaration and tool list; `AuthorPages` declared, granted, and covering `set_l1` |
| AC-1093 (:700) | REQ-129, REQ-135, REQ-139 | aligned, **warning 2** — real `/api/copy` on an assistant-authored subtree; axes byte-identical after the operator's save. Not executed this session (sandbox) |
| AC-1094 (:741) | REQ-129, REQ-140 | aligned — an unpainted container returns 200 with empty `fields` and `values`, a legitimate nothing-to-edit answer rather than a failure. Not executed this session (sandbox) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1090 (`acceptance_criterion-4bd36a69`) / `tests/reconciliation-page-composition-surface.test.ts:565-582` | uat-edit | AC-1090 was strengthened at 2026-09-11T02:19:42 (report-9b910172) to require the failure code, the recovery strategy **and** the offending field as a pointer, "complementary, not alternatives", with a Verification clause naming `fontSizePx` explicitly. `test_UAT_AC1090_a_refusal_carries_the_code_and_a_recovery_strategy` asserts only the code (:578) and the three strategy statements (:579-581). It never asserts the pointer, and its rationale at :568-572 asserts the contrary — "This caller does not receive the offending field … so the declared meaning carries the STRATEGY rather than promising specifics it cannot deliver." The `ac`-level fix applied the cascade to `tests/test_UAT_FC_REQ-129_l1_authoring.test.ts:397` only. **Not a code defect**: both refusal tests were run this session and passed, so the pointer does reach the caller | Add `expect(answer).toMatch(/fontSizePx/)` after :581; replace the :568-572 comment with the now-current contract (both halves, complementary), mirroring `test_UAT_FC_REQ-129_l1_authoring.test.ts:381-397`; rename the test to `…_carries_the_code_the_field_and_a_recovery_strategy` so the name states what it proves |
| 2 | warning | consistency | AC-1092 (`acceptance_criterion-fbda4a6e`) / test `:641` | uat-edit | AC-1092 requires the retired **pair** absent from "the manual a session is given". The test asserts only `expect(box.manual()).not.toContain('set_copy')`. `get_copy` is checked in the declaration (:634) and the tool list (:639) but not the manual, so a manual still describing the retired *read* half would pass. Carried unrepaired from REPORT-2050 finding 1 | Add `expect(box.manual()).not.toContain('get_copy')` beside :641 |
| 3 | warning | consistency | AC-1093 (`acceptance_criterion-d1bda2c2`) / test `:712` | uat-edit | AC-1093's Verification says "assert they are the fields that element's kind exposes, carrying its current values". The test asserts only `read.fields[0].name === 'text'` and `read.values.text`. `copyFieldsOf` (`packages/site-schema/src/l1/edit.ts:963-985`) returns `text` **plus** the REQ-139 colour row and the REQ-135 typography fields for a text node, so dropping those on assistant-authored nodes would still pass — which is precisely the indistinguishability the AC exists to assert. Carried unrepaired from REPORT-2050 finding 2 | Assert the full descriptor name set, derived from `copyFieldsOf` on an equivalent hand-written node rather than pinned as a literal list |
| 4 | warning | coverage | AC-1085 (`acceptance_criterion-aa3322ea`) / test `:381-387` | uat-edit | AC-1085 requires "a reference to a site-level value comes back as that reference and not as the value it points at". The seed carries the bare `{ ref: 'paper' }` / `{ ref: 'ink' }` form. REQ-137 (free_and_reconciled, 2026-08-12) made `{ ref, shade }` the production reference shape; it is exercised through the copy-edit path (`tests/reconciliation-copy-edit-colour-and-availability.test.ts:612-620`) but never through `get_l1`'s verbatim read, so a read that resolved or dropped `shade` would still pass this UAT. This was info #4 in REPORT-2050 when REQ-137 was `bundled`; it reconciled on 2026-08-12, which is what moves it to a warning | Put `shade` (and `alpha`, if the schema carries it) on the seeded reference at `:61` and assert it survives both the read (:384) and the AC-1086 write-back |
| 5 | info | exclusivity | `tests/test_UAT_FC_REQ-129_l1_authoring.test.ts` (13 tests) vs `tests/reconciliation-page-composition-surface.test.ts` (12) | — | The two suites cover the same scenarios in the same shape, but this is the repo-wide free-coded → reconciliation pattern and the reconciliation suite is strictly stronger. **Not a duplicate to remove.** Noted because the pair has now *diverged* on AC-1090 (finding 1): when they diverge, the AC-numbered suite is the one the matrix reads | none |
| 6 | info | coverage | AC-1093, AC-1094 | — | Both were skipped this session: their shared `beforeAll` calls `startBuilder`, which dies on `EPERM: listen 0.0.0.0` (`tools/generate/src/cli/builder.ts:363`) under the sandbox. Environment restriction, not a test defect. Findings 3 and the AC-1094 ledger entry rest on reading the test bodies against `copyFieldsOf`; no finding depends on those two outcomes | none |

## Notes for the Editor

- **Finding 1 is a one-line fix plus a comment rewrite, and it is the only thing standing
  between this level and a pass.** The behaviour is already correct and already proven —
  the free-coded suite asserts the pointer and passes. Do not touch production code.
- **All four findings share one shape**: an AC names a *set* (three things together, the
  retired pair, the fields a kind exposes, a reference of any form) and its UAT asserts one
  member of it. Finding 1 became a violation only because its AC was tightened this
  morning; findings 2–4 are the same defect at warning strength. An editor fixing 1 should
  fix 2–4 in the same pass — they are four assertions in two files.
- **Why the cascade was missed**: the `ac`-level fix report (report-9b910172) lists its
  `uat-edit` mutation against `test_UAT_FC_REQ-129_l1_authoring.test.ts` and treated that
  as the AC's test. The `test_UAT_AC<n>_` convention makes the reconciliation suite the
  matrix's evidence. Where a behaviour has both a free-coded and a reconciliation UAT, a
  `uat-edit` cascade must land in **both**, or in the AC-numbered one at minimum.
- No `code-issue` findings. Verified present and executed this session: `createL1Toolbox`,
  `l1Operations`, `nodeOperations`, `L1_DECLARATION`, `L1_INSTANCES`; `get_copy`/`set_copy`
  appear nowhere in `tools/generate/src/cli/ai/l1-surface.json` or `toolbox.ts`, so
  finding 2 is assertion breadth against a future regression, not a present hole.
- AC-1093/AC-1094 vs REQ-139, flagged by the previous two cycles as "the likeliest false
  positive", was re-checked and again produced no finding: AC-1093 is kind-relative, and
  AC-1094's premise (an **unpainted** container still returns `null`) is REQ-140's own
  stated rule at `packages/site-schema/src/l1/edit.ts:1012-1018`.
- Traceability, unrepaired by design and unchanged: CAP-93 carries no `intent_uid` and
  STORY-106's points at BUNDLE-17, so reaching REQ-129 still costs a dereference through
  eight bundled requests. Tooling-level, out of scope for a `uat`-level check.
