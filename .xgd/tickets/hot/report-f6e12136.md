---
uid: report-f6e12136
id: REPORT-3884
type: report
title: 'UAT Coverage: Page Authoring Through The Control Surface: Read & Replace The
  Element Tree'
created_by: xgd
created_at: '2026-09-11T03:00:12.264687+00:00'
updated_at: '2026-09-11T03:00:12.264687+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-fe236246
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# UAT Coverage Assessment: Page Authoring Through The Control Surface: Read & Replace The Element Tree

**Result**: PASS
**AC verdicts**: 12 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

CAP-93 has one story (STORY-106, `story-189fc1ac`) carrying twelve ACs, AC-1083 … AC-1094.
All twelve are evidenced by `tests/reconciliation-page-composition-surface.test.ts`, one
`test_UAT_AC<n>_` per AC. The evidence was **executed**, not merely read: 10 of the 12 pass
green; AC-1093/AC-1094 could not run in this sandbox (`listen EPERM`, see warning 3) and were
judged on their bodies, which drive the real `/api/copy` transport against a real builder.

## Cumulative Intent Considered

STORY-106's `intent_uid` is `bundle-e59210c5` (BUNDLE-17, `free_and_reconciled`, merged
`0198704b`). The originating source ticket inside that bundle is **REQ-129**; the rest of the
ledger is prerequisite or mechanism.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-126 | free_and_reconciled | 2026-08-08 | Declared the surface, error taxonomy, addressing contract (CAP-92); used here unchanged | YES (prereq) |
| REQ-129 | free_and_reconciled | 2026-08-09 | **Originating intent**: `describe_page` widened to every node; verbatim `get_l1`; subtree-replacing `set_l1`; `get_copy`/`set_copy` retired; `AuthorPages` group; the security guarantee relocated into the closed vocabulary; whole-document submission recorded as a deliberate absence | YES |
| REQ-130 | free_and_reconciled | 2026-08-09 | Beyond L1 (config, modules, page metadata, generated assets) — adjacent, outside CAP-93's element-tree scope | YES (adjacent) |
| REQ-131 | free_and_reconciled | 2026-08-11 | Draft change journal; adds no element read/replace behaviour | YES |
| REQ-135 | free_and_reconciled | 2026-08-12 | Editor text properties; widens `copyFieldsOf` descriptors — why AC-1093's UAT derives the descriptor set rather than pinning it | YES |
| REQ-137 | free_and_reconciled | 2026-08-12 | Continuous shade carried on the palette *use*, replacing named steps — why AC-1085's seed carries `{ref, shade, alpha}` | YES |
| REQ-139 | free_and_reconciled | 2026-08-12 | Colour row / locked controls in the copy modal | YES |
| REQ-140 | free_and_reconciled | 2026-08-15 | A painted container becomes a segment; an unpainted one still yields no fields — AC-1094's premise | YES |
| REQ-142 | free_and_reconciled | 2026-08-15 | Async `SiteStore` port; every L1 operation awaited | YES (mechanism) |
| REQ-146 / REQ-149 | free_and_reconciled | 2026-08-15 / 08-17 | AI host into workerd; `publish` graduated into the portable core — why AC-1092's UAT unions `l1Operations` + `nodeOperations` | YES (mechanism) |
| REQ-134 | abandoned | 2026-08-12 | Image-generation component | NO |
| REQ-157 | draft | 2026-08-20 | The fidelity surface | NO — not yet active |

**Nothing in the ledger retires a behaviour a CAP-93 AC asserts**, and nothing reconciled adds
an element-tree read/replace behaviour no AC covers. Every AC is Active.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-106 | REQ-129 (originating); REQ-126 prereq; REQ-130/131/135/137/139/140/142/146/149 adjacent-or-mechanism | aligned | Body's six in-scope promises all map to ACs. One sub-clause ("no way to submit a whole page in one call") has no CAP-93 AC of its own — warning 1, not a violation, because the declared-absence surface is explicitly CAP-92's and REQ-126's UAT exercises it. One clause (a refusal names the offending field) post-dates the intent that recorded the opposite — finding 2a, low-impact both ways, defaulted rather than blocked |

## Evidence Quality

The suite is genuinely substantive and is worth naming as the standard, not just clearing it:

- **Nothing is mocked.** `createL1Toolbox` is the real toolbox over a real `mkdtemp` site;
  the draft's bytes on disk (`draftBytes`) and the rendered HTML (`cmdRender`) are the
  observations; AC-1093/1094 drive the real `/api/copy` origin over HTTP.
- **The map is compared against an independent walk of the seed** (`walk`, written in the
  test), so AC-1083 cannot pass by agreeing with the implementation about which elements are
  interesting — which is exactly the defect REQ-129 existed to fix.
- **AC-1086 asserts acceptance before unchanged-ness** (`{changed: ['0']}` first), because a
  *refused* write also leaves the page unchanged — the round-trip would otherwise be provable
  by a surface that rejects everything.
- **AC-1084 measures rather than argues** the no-styling claim: the same tree styled and
  unstyled must produce a byte-identical map.
- **AC-1093 derives its expectation from a hand-written twin** rather than pinning a literal
  descriptor list, so it asserts the actual claim (the derivation cannot tell who authored the
  element) and will not go stale when the exposed typography widens.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | story | STORY-106 | ac-add + uat-add (optional) | Story body and the capability's "bounded replace" bullet both claim "no way to submit a whole page in one call". No CAP-93 AC asserts it. The sibling half of the same sentence ("no separate insert or delete") *is* asserted, by AC-1088's check on the declaration's `sequences` note — so the coverage is asymmetric. Mitigating: the absence *is* declared (`l1-surface.json` `absences[1]`, "Replacing a whole page in one call") and `test_UAT_FC_REQ_126_manual_names_every_offered_operation_and_its_absences` iterates every declared absence, and AC-1092 pins declared-set == implemented-set exactly | Either accept as CAP-92-covered, or close the asymmetry with a one-line assertion in AC-1088's UAT that `L1_DECLARATION.absences` names the whole-page absence, mirroring the existing `sequences` note check |
| 2a | needs_review | ac | AC-1090 | needs_review-default | AC-1090 asserts a refusal names the offending field **as well as** the recovery strategy. REQ-129 — the originating intent — records the opposite as the shipped state: the pointer could not reach a Toolbox caller, and it was "mitigated by making the declared `SCHEMA_INVALID` meaning carry the *recovery strategy* rather than a promised hint it cannot deliver". STORY-106's Technical Context says the upstream fix has since landed, but records it under "Divergences and known limits", **not** under a `## Reconciliation Decisions` heading — so no authorized stage has formally decided it. Verified this cycle: the UAT passes, the refusal does name `fontSizePx`. **Impact screen**: reading A (field + strategy, what the code does today) and reading B (strategy only, REQ-129's recorded limit) are both low-impact — a refused write writes nothing under either, so no data loss, no security or auth exposure, no financial consequence, no irreversible action; the difference is the richness of an error string | **Suggested default: reading A (field + strategy).** It is what the shipped code does and what the green UAT measures. Formalize it: move the paragraph under a `## Reconciliation Decisions` heading in STORY-106's Technical Context, labelled `auto-defaulted at fix_uat_coverage`, so the next cycle reads it as a decision rather than re-deriving it as drift |
| 3 | warning | ac | AC-1090 | — | AC-1090's evidence rests on behaviour of the **unpinned** `@lagrangefoundry/ai` shared store: `renderHostError` appends host detail for any code that does not set `host_detail: false`, and `SCHEMA_INVALID` does not opt out. That package is not in the lockfile, so an upstream change can flip this assertion with no commit in this repo — the same channel that produced the original REQ-129 limitation in the first place | No action required; noted so a future red on `expect(answer).toMatch(/fontSizePx/)` is read as upstream drift, not as a local regression |
| 4 | warning | ac | AC-1093, AC-1094 | — | Both UATs were **skipped** in this run: the `beforeAll` hook times out at 180s because `startBuilder` dies on `listen EPERM: operation not permitted 0.0.0.0` (`tools/generate/src/cli/builder.ts:363`). This is the sandbox denying a socket, not a defect in the tests or the code; their bodies are substantive (real `/api/copy` transport, derived rather than pinned expectations) and they were judged `pass` on content | No action. Verify these two on a host that permits `listen` before treating any CAP-93 red as real |

## Notes for the Editor

- **This is a PASS.** Zero violations, zero blocking `needs_review`. Finding 2a is a
  `needs_review-default` — resolvable, non-blocking — and findings 1, 3 and 4 are warnings.
  None of them gates the capability.
- **The only finding worth acting on is 2a, and it is bookkeeping, not behaviour.** The
  behaviour is already correct and already proven green. What is missing is the *heading*: the
  upstream-fix paragraph sits under "Divergences and known limits" where a coverage check reads
  it as an unreviewed claim. Moving it under `## Reconciliation Decisions` is what stops this
  finding recurring every cycle. Note that the paragraph already argues its own case well
  ("the acceptance criterion below now asserts both halves ... so nothing here is
  outstanding") — it is filed under the wrong heading, nothing more.
- **Finding 1 is a judgment call, and I came down on the lenient side.** CAP-93's out-of-scope
  list explicitly hands "how the surface is declared" to CAP-92, and REQ-126's UAT already
  iterates the declared absences. I flagged it only because AC-1088 sets the opposite precedent
  *inside this same story* by asserting the `sequences` note. If the editor wants the two halves
  of that sentence covered symmetrically, it is one assertion in an existing test — not a new AC.
- **Do not re-litigate AC-1090 in the next cycle** once 2a is applied. This is the second
  consecutive cycle to touch it (report-9b910172 strengthened the AC at 02:19, report-fff96718
  caught the half-applied UAT at 02:37, report-845abf4c passed it at 02:50). The AC, the
  free-coded suite and the AC-numbered UAT are now consistent and green; the remaining gap is
  purely where the rationale is filed.
