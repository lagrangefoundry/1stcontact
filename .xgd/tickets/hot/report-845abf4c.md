---
uid: report-845abf4c
id: REPORT-3879
type: report
title: 'Capability-Intent Alignment: Page Authoring Through The Control Surface: Read
  & Replace The Element Tree (level=uat)'
created_by: xgd
created_at: '2026-09-11T02:50:54.989472+00:00'
updated_at: '2026-09-11T02:50:54.989472+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-fe236246
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
  anchor_report_uid: report-e37a6b4a
---

# Capability-Intent Alignment: Page Authoring Through The Control Surface: Read & Replace The Element Tree
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

At `uat` level the AC bodies AC-1083 … AC-1094 are the working reference; the `ac`-level
cycle passed at 2026-09-11T02:28 (report-15d19871, 0 violations). Intent was re-read only
to confirm the ledger has not moved since the previous `uat` cycle (report-fff96718,
2026-09-11T02:37) — it has not: no `request-*` ticket carries an `updated_at` on 2026-09-10
or 2026-09-11.

**The one violation and all three warnings from report-fff96718 are repaired and
verified against the current test file, not against the fix report's claim.** This cycle
found no new drift.

## Cumulative Intent Considered

STORY-106 (`story-189fc1ac`) is the only story under CAP-93. Its `intent_uid` is
`bundle-e59210c5` (BUNDLE-17, `free_and_reconciled`, merged `0198704b`); the originating
source ticket inside that bundle is REQ-129. Statuses below were re-read from the ticket
files this session.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-126 | free_and_reconciled | 2026-08-08 | Declared the surface, error taxonomy, addressing (CAP-92); used unchanged here | YES (prereq) |
| REQ-129 | free_and_reconciled | 2026-08-09 | **Originating intent**: `describe_page` over every node; verbatim `get_l1`; subtree-replacing `set_l1`; `get_copy`/`set_copy` retired; `AuthorPages` group; guarantee relocated into the closed vocabulary | YES |
| REQ-130 | free_and_reconciled | 2026-08-09 | Beyond-L1 authoring (config, modules, metadata, assets); outside CAP-93's scope; bumped `surface_version` | YES (adjacent) |
| REQ-131 | free_and_reconciled | 2026-08-11 | Draft change journal; adds no element read/replace behaviour | YES |
| REQ-135 | free_and_reconciled | 2026-08-12 | Editor text properties; widens `copyFieldsOf`'s descriptors for a text run | YES |
| REQ-137 | free_and_reconciled | 2026-08-12 | Continuous `shade` on the reference replaces named palette steps — `{ ref, shade, alpha }` is the production reference shape | YES |
| REQ-139 | free_and_reconciled | 2026-08-12 | Locks a control that cannot express what the element holds; the colour row for a gradient-filled run | YES |
| REQ-140 | free_and_reconciled | 2026-08-15 | A painted container becomes a segment; an **unpainted** one still returns `null` — AC-1094's premise, unchanged | YES |
| REQ-142 | free_and_reconciled | 2026-08-15 | Async `SiteStore` port; every L1 operation awaited (suite `:143-157`) | YES (mechanism) |
| REQ-146 / REQ-149 | free_and_reconciled | 2026-08-15 / 08-17 | AI host into workerd; `publish` into the portable core — why AC-1092's UAT unions `l1Operations` + `nodeOperations` (`:649-666`) | YES (mechanism) |
| REQ-134 | abandoned | 2026-08-12 | Image-generation component | NO |
| REQ-157 | draft | 2026-08-20 | The fidelity surface (look, compare, judge) | NO — not yet active |

Nothing in the ledger retires a behaviour a CAP-93 UAT asserts, and nothing reconciled adds
an element-tree read/replace behaviour no AC covers.

## Alignment Ledger

All 12 UATs live in `tests/reconciliation-page-composition-surface.test.ts` — one per AC,
matching the `test_UAT_AC<n>_` convention. All 12 are substantive: real `createL1Toolbox`,
real `L1_DECLARATION` / `L1_INSTANCES`, real draft bytes read off disk, a real `cmdRender`,
and a real `/api/copy` origin. Nothing internal is mocked; no UAT is a structural/AST-only
check.

**Execution this session**: `npm test -- tests/reconciliation-page-composition-surface.test.ts
--reporter=verbose` → **10 passed, 2 skipped (12)**. The two skips are AC-1093 and AC-1094:
their shared `beforeAll` calls `startBuilder`, which dies on
`Error: listen EPERM: operation not permitted 0.0.0.0` at
`tools/generate/src/cli/builder.ts:363`. That is the sandbox's socket restriction, not a
test defect, and it is the same restriction report-fff96718 recorded (info #6). Those two
UATs were therefore assessed by reading their bodies against the production derivation —
see the ledger rows and info #2.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1083 (`:234`) | REQ-129 | aligned — map compared as an ordered list against a walk written in the test (`:182`), not the code's own notion of an interesting node; address/kind/label on every entry; `module`+`slot` present only inside instances; a count closure (`:281`) proving no entry belongs to neither space and none is emitted twice |
| AC-1084 (`:284`) | REQ-129 | aligned — label rule asserted per kind, the control's label read off the stored instance rather than a fixture (`:316-338`); no axis name anywhere in the serialised map (`:342-349`); size-independence measured as exact map equality, unstyled vs richly styled (`:353-365`) |
| AC-1085 (`:375`) | REQ-129, REQ-137 | aligned — **prior warning 4 repaired**: the seed now carries REQ-137's full `{ ref: 'paper', shade: -0.35, alpha: 0.9 }` / `{ ref: 'ink', shade: 0.2 }` production shape (`:62`, `:67`) and `:393-399` pins the whole reference, so a read that resolved it to a hex *or* kept `ref` while dropping the variation keys now fails. Keyframe track still a track; `target` names page+path; the scoped read names module+slot |
| AC-1086 (`:432`) | REQ-129 | aligned — **prior warning 4, second half repaired**: acceptance asserted *before* unchanged-ness (`:441`) exactly as the AC demands, page compared as structure not bytes (`:445`), and `:452-457` now names explicitly that the reference survived the write back verbatim, variation keys and all — the half a whole-page equality hides |
| AC-1087 (`:460`) | REQ-129 | aligned — siblings and a second page byte-identical; the count arithmetic (`:498-500`) closes the inserted-beside-it gap; reply names the address in both `changed` and `message` |
| AC-1088 (`:503`) | REQ-129 | aligned — the declared sequence and its "no separate way to insert or delete" note asserted (`:508-512`), then map→read→replace, then a real `cmdRender` asserting both anchor targets (`about`, `#contact`), then removal back to the original child count |
| AC-1089 (`:567`) | REQ-129, DOC-2 | aligned — all six enumerated cases (raw markup, raw stylesheet, `javascript:` link role, `javascript:` image src, undeclared `iframe` kind, wrongly-typed `fontSizePx`), each `SCHEMA_INVALID`, draft bytes identical after. This is the security-boundary UAT and it is complete |
| AC-1090 (`:592`) | REQ-129 | aligned — **prior violation repaired**: `:615` now asserts `/fontSizePx/`, the pointer AC-1090 has required since 2026-09-11T02:19; the `:595-604` rationale, which previously asserted the contrary, now states the current contract (code + strategy + pointer, complementary); the test is renamed `…_carries_the_code_the_field_and_a_recovery_strategy`. Executed and passing this session |
| AC-1091 (`:618`) | REQ-129 | aligned — `NOT_FOUND` with the re-read-the-listing remedy; a malformed address refused distinctly (`SCHEMA_INVALID`, explicitly not `NOT_FOUND`); bytes unchanged after both |
| AC-1092 (`:645`) | REQ-129, REQ-130, REQ-146, REQ-149 | aligned — **prior warning 2 repaired**: `:680` adds `manual()).not.toContain('get_copy')`, so both halves of the retired pair are now checked in all three places the AC names (declaration, tool list, manual). Exact set equality both directions over the `l1Operations`+`nodeOperations` union; `AuthorPages` declared, granted, and covering `set_l1` |
| AC-1093 (`:739`) | REQ-129, REQ-135, REQ-139 | aligned — **prior warning 3 repaired**: `:765-776` replaces the lone `fields[0].name === 'text'` check with the full descriptor-name set *derived* from the same origin's read of the hand-written twin at `0.0.0`, plus an `arrayContaining(['text','color','fontSizePx','italic','textTransform'])` floor so the equality cannot be two impoverished forms agreeing, plus each read carrying its own values (20 vs 32). Not executed this session (sandbox); the assertion was checked statically against `copyFieldsOf` — see info #2 |
| AC-1094 (`:804`) | REQ-129, REQ-140 | aligned — an unpainted container returns 200 with empty `fields` and `values`, a legitimate nothing-to-edit answer rather than a failure. Not executed this session (sandbox); confirmed statically against `packages/site-schema/src/l1/edit.ts:1022` + `:1048` (the painted-surface branch is gated on `opts.paints`, so an unpainted box/container falls through to `return null`) and `tools/generate/src/cli/edit.ts:646-647` (`derived?.fields ?? []`) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | AC-1085, AC-1086, AC-1090, AC-1092, AC-1093 | — | The one violation and three warnings raised by report-fff96718 are all repaired in `tests/reconciliation-page-composition-surface.test.ts` and verified here against the file itself: `:615` (pointer), `:680` (`get_copy` in the manual), `:765-776` (derived descriptor set), `:62`/`:67`/`:393-399`/`:452-457` (full REQ-137 reference shape, read and write-back). The shape those four shared — "an AC names a set, its UAT asserts one member of it" — no longer occurs in this suite | none |
| 2 | info | coverage | AC-1093, AC-1094 | — | Both skipped this session on `EPERM: listen 0.0.0.0` (`tools/generate/src/cli/builder.ts:363`), the sandbox's socket restriction. Their assertions were verified statically instead: `copyFieldsOf` (`packages/site-schema/src/l1/edit.ts:959-985`) emits the `color` descriptor unconditionally (`colorField`, `:637-648`) and `italic`/`textTransform` unconditionally (`typographyFields`, `:574-589`), while `fontSizePx` appears exactly when the axis is held (`sizeField`, `:513-524`) — both nodes in the fixture hold it, and neither declares a `fontFamily`, so the `fontWeight` branch resolves identically for both. AC-1093's derived equality and its `arrayContaining` floor therefore hold, and AC-1094's empty-field answer follows from `edit.ts:1022`/`:1048` + `tools/generate/src/cli/edit.ts:646-647`. Environment restriction, not a test defect | none |
| 3 | info | exclusivity | `tests/test_UAT_FC_REQ-129_l1_authoring.test.ts` (13 tests) vs `tests/reconciliation-page-composition-surface.test.ts` (12) | — | The two suites cover the same scenarios in the same shape, but this is the repo-wide free-coded → reconciliation pattern and **not a duplicate to remove**. The AC-1090 divergence that made report-fff96718's violation is resolved in the correct direction: the AC-numbered suite — the one the matrix reads — is now the strictly stronger of the two on all four repaired points. The free-coded suite still carries the weaker forms at `:456`, `:537` and `:61`/`:66`, which is the documented pattern rather than drift | none |

## Notes for the Editor

- **Nothing to fix.** Zero violations, zero warnings, zero `needs_review`. No production
  code was examined for defects beyond the two static confirmations in info #2, and no
  `code-issue` finding arises: every behaviour a UAT asserts and that could be executed in
  this environment was executed and passed.
- **Do not treat info #2 as a reason to weaken AC-1093/AC-1094's UATs.** The skip is a
  property of this sandbox (no `listen(2)`), not of the tests; they execute where a socket
  can be bound, and report-1b35e36b records them passing in a session where one could.
- **Traceability, unrepaired by design and unchanged across all three cycles**: CAP-93
  carries no `intent_uid` and STORY-106's points at BUNDLE-17, so reaching REQ-129 costs a
  dereference through eight bundled requests. Tooling-level; out of scope for a `uat`-level
  check, and recorded here only so the next cycle does not re-derive it.
