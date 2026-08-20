---
uid: report-8f9bb2e8
id: REPORT-2464
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=ac)'
created_by: xgd
created_at: '2026-08-20T15:56:48.383136+00:00'
updated_at: '2026-08-20T15:56:48.383136+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-c4c7a854
  level: ac
  violations: 2
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every Edit
# Level: ac

**Result**: FAIL
**Violations**: 2
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

Per the level cascade, the story-level cycle ran first and **passed**
(REPORT-2463, `report-975eb8b5`, 2026-08-20T15:49). STORY-118's body is
therefore this check's working reference; the intent ledger below is carried
forward from REPORT-2461 (`report-1ac15f89`) and re-confirmed, not re-derived,
and is consulted only where the story body is itself ambiguous — which happened
once (finding 3).

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-141 | bundled in BUNDLE-19 (`free_and_reconciled`) | 2026-08-15 | Vitest split into node + workerd projects; D1/R2 bindings; filename routing convention; production compatibility settings; one UAT per project | YES |
| REQ-142 | `free_and_reconciled` | 2026-08-15 | Async `SiteStore` port (11 verbs, total, no location-shaped returns); `FsSiteStore` carrying today's non-atomicity; `edit.ts`'s 31 exports async; one whole change as one call; in-memory adapter; site factory over both backends; unchanged CLI surface + envelopes | YES |
| REQ-143, REQ-145, REQ-146, REQ-148 | `ready_to_reconcile` | 2026-08-15 | Third (D1/R2) adapter + `version`/`expect` CAS verbs; control-app as builder; injected store into `createL1Toolbox`; more `*.workers.test.ts` | imminent — not enforced here (would make the matrix describe unreconciled code) |
| REQ-147 | `reconciling` | 2026-08-15 | Cloudflare Access — no store surface | imminent, not relevant |
| REQ-149 | `draft` | 2026-08-17 | Publish in the cloud | NO |
| REQ-150 | `free_coding` | 2026-08-18 | Vite SSR server | NO |
| REQ-134, REQ-112 | `abandoned` | 2026-08-12 / 2026-07-31 | — | NO |

The story's single parent is `bundle-77b28def` (BUNDLE-19, `free_and_reconciled`,
`merged_at_commit b18b859d…`); of its nine source tickets only REQ-141 and
REQ-142 carry storage/runtime asks.

**Verification environment.** This worktree's HEAD (`af939ba02`) predates
BUNDLE-19's merge — `git ls-tree HEAD -- tools/generate/src/store` shows no
`site-store.ts`, `assemble.ts`, `memory-store.ts` or `journal-model.ts`, and
there is no `vitest.workers.config.mts`. Every code and test citation below was
read from `origin/main` via `git show` / `git grep -a`. Anyone re-running these
spot checks locally must do the same, with text mode forced (`builder.ts` and
`fidelity.ts` carry deliberate NUL bytes and are skipped silently by a plain
recursive grep).

## Alignment Ledger

Ten ACs hang off STORY-118 (`story-3f4a5f2b`, `story_kind=feature`, so ACs are
expected). All ten are `status=active`, `kind=behavior`, `regression_only=false`.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1321 `acceptance_criterion-d4cc3712` — totality + asynchrony | REQ-142 §5, §7, §10 | **gap**: enumerates 7 of the port's 11 verbs; `appendChange`, `changesSince`, `pendingChanges` appear in no AC at all — see finding 1 |
| AC-1322 `acceptance_criterion-f713cba6` — bytes and keys, never locations | REQ-142 §5 ("no path-shaped escape hatches"), §7 (asset sources, preview assets) | aligned |
| AC-1323 `acceptance_criterion-44c1d962` — one whole change per multi-file command | REQ-142 AC-5, §10 | aligned — covers the `write` verb AC-1321 omits, so the omission is not a gap for that verb |
| AC-1324 `acceptance_criterion-31f6a0c5` — whole surface against the filesystem-free store | REQ-142 AC-4 | aligned |
| AC-1325 `acceptance_criterion-6a7b61e4` — identical over both stores | REQ-142 AC-7, §8 | aligned |
| AC-1326 `acceptance_criterion-d08eae5f` — arguments, output, refusal envelopes unchanged | REQ-142 AC-3, §7 (asset sources) | aligned |
| AC-1327 `acceptance_criterion-16093733` — draft preview from whichever store | REQ-142 §7 (preview assets), §10 | aligned |
| AC-1328 `acceptance_criterion-c8728ae8` — two runtimes, filename routing, real bindings | REQ-141 AC-2, AC-3, AC-4 + landed sections | aligned |
| AC-1329 `acceptance_criterion-ae2c7f77` — the split cost nothing, changed no assertion | REQ-141 AC-1, AC-5 | **partial**: bullets 1–3 are re-verifiable properties; bullet 4 is a one-time historical measurement carried as an active criterion — see finding 3 |
| AC-1353 `acceptance_criterion-003caa07` — no filesystem imports | REQ-142 AC-2, §7, §10 | aligned — added by the story-level fix (REPORT-2462) and correctly scoped to `edit.ts` plus the four port modules, with `fs-store.ts` named as the one expected filesystem import |
| STORY-118 In-scope bullet 4–5 — "chosen at start-up" / "the assistant's tool adapter" | REQ-142 §7 (Injection), §10 (three call sites) | **gap**: neither the start-up naming topology nor the tool adapter is covered by any AC — see finding 2 |
| Deliberate non-behaviours (fs store not atomic; asset-name confinement not restated) | REQ-142 §7, story Technical Context | aligned — correctly *absent* from the AC set; the story explicitly instructs "Do not write an acceptance criterion asserting atomicity of the filesystem store" |
| Exclusivity — AC-1324 vs AC-1325 | REQ-142 AC-4 vs AC-7 | not duplicates — see info 4 |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1321 (`acceptance_criterion-d4cc3712`) | ac-edit | AC-1321 is the story's totality criterion — "Storage answers every question it is asked, for every site" — but its enumeration names only 7 of the port's 11 declared verbs. `origin/main:tools/generate/src/store/site-store.ts` declares `appendChange` (:137), `changesSince` (:143) and `pendingChanges` (:146) alongside the 7 AC-1321 lists (:113–:131, :149) and the `write` AC-1323 covers. STORY-118's Description names all four journal-facing questions explicitly ("record a change; read the changes since a given count; report what the draft has pending against the revision it descends from"), and its Out-of-scope paragraph *retains* exactly the totality claim for them while ceding their semantics to CAP-99: "this story owns only that those questions are asked of the store like every other, and therefore answer over a store with no filesystem." So the three verbs are in scope for totality and expressed in no AC. The gap has already propagated into the evidence: `git grep -a -E "pendingChanges\|changesSince\|appendChange" origin/main:tests/reconciliation-site-storage-port.test.ts` returns zero hits, and the AC-1321 UAT (`tests/reconciliation-site-storage-port.test.ts:126`) asks exactly AC-1321's 7 questions and no more — for the held site and for the unheld slug alike. The story's own recorded non-behaviour "The filesystem-free store is not a revision store. It reports every file as pending against no base revision" is likewise asserted nowhere, because the verb it describes is in no AC. Flagged for this level by REPORT-2461 finding 5. | Extend AC-1321's two enumerations to all 11 verbs. Held site: add "record a change" (returns the counter, unmoved by a store that cannot take the record — `site-store.ts:135`), "read the changes since a given count" (a slice plus where the counter now stands), and "report what the draft has pending" . Unheld slug: state the empty answer for each of the three, and record the filesystem-free store's pending-against-no-base-revision answer as the story's Technical Context already does. Keep the asynchrony assertion covering all 11. |
| 2 | violation | coverage | STORY-118 In-scope bullets 4 and 5 → AC tree | ac-add | STORY-118 names three surfaces driven through the store — "The editing surface, the builder's preview of a draft, and the assistant's tool adapter all driven through the store they were given" — and separately claims the injection topology: "nothing chooses between them at runtime — the store is named once at start-up, by the command line, by the builder origin and by the assistant's tool adapter, and every command downstream simply takes what it was given." The AC set covers the first surface (AC-1324) and the second (AC-1327). **The assistant's tool adapter appears in no AC**, and no AC asserts the start-up naming topology or the absence of runtime mode detection. Both halves are real and checkable in the tree: `origin/main:tools/generate/src/cli/ai/toolbox.ts:505` names the adapter once — `new L1Toolbox(slug, { ...opts, store: fsSiteStore(ctxOf(opts)) })` — under the comment "It is named here, once — the operations below it never learn which store they got", and `readSourceFile` (`toolbox.ts:136–150`) is the tool adapter's half of REQ-142 §7's asset-source move, raising "the same `CommandError` `editAssetAdd` used to raise, with the same code, path and hint". AC-1326 covers the CLI's half of that same move (`1c asset add` NOT_FOUND envelope) and not the adapter's. `git grep -a -i toolbox` over `tests/reconciliation-site-storage-port.test.ts`, `…workers.test.ts` and `tests/test_UAT_FC_REQ-142_site_store_port.test.ts` returns zero hits, so this is uncovered in AC and in evidence. AC-1325's "which store a command got is not observable from its result" is about results, not about who chose; it does not carry this. | Author **one** AC covering both halves, not two — a separate AC per half would overlap and create the exclusivity problem this check exists to prevent. Criterion: each of the three entry points (the CLI's `editOptions()`, the builder origin's `builderStore()`, the assistant's tool adapter) names its store once at start-up, nothing downstream chooses or detects one at runtime, and the assistant's tool adapter drives an edit — including an asset add whose source it reads itself and refuses with the unchanged code/path/hint envelope — through the store it named. |
| 3 | warning | consistency | AC-1329 (`acceptance_criterion-ae2c7f77`), 4th bullet | ac-edit | AC-1329's first three bullets are re-verifiable properties of the tree, and its UAT (`tests/reconciliation-site-storage-port.test.ts:595`) executes them. Its fourth — "The set of failing tests is unchanged across the split and across storage becoming a port: re-running the same files against the pre-split configuration, and against the pre-port branch, yields the same files and the same counts" — is a one-time measurement, not a property: verifying it requires checking out the pre-split configuration and the pre-port branch, which no suite run can do. The UAT correspondingly does not attempt it, so an active criterion is carrying an unverifiable half. STORY-118 supports the *statement* but places it under Technical Context → "Suite state at the time of reconciliation, and its attribution", i.e. as attribution of pre-existing failures; the In-scope list does not include it. This is the one place the story body was ambiguous enough to send me back to intent: REQ-141 AC-1 and REQ-142 AC-1 both phrase it as the reconciliation-time correctness claim, which confirms the historical reading. | Narrow AC-1329 to the three structural bullets its title's first half describes. Keep the "changed no assertion" claim by re-expressing it in a re-verifiable form, or record the before/after failing-set comparison explicitly as a one-time reconciliation measurement (story attribution note, where it already lives) rather than as an active criterion. Do not simply delete the claim — it is the story's whole correctness argument for the split. |
| 4 | info | exclusivity | AC-1324 + AC-1325 | — | The two share a near-identical assertion body (read, write, copy edit, structured subtree round-trip, palette rules, asset add/remove, change counting, draft render). They are **not** duplicates: AC-1324 adds "no filesystem site tree present at all" and "the fixture holds no filesystem handle of any kind"; AC-1325 adds cross-store equality of the assembled definition. They trace to two distinct source criteria — REQ-142 AC-4 (fake adapter proves no caller depends on the filesystem) and REQ-142 AC-7 (one factory, one body of assertions, both backends). Recorded so a later check does not read the shared body as drift. | none |
| 5 | info | coverage | AC-1353 | — | AC-1353 was authored by the story-level fix at 2026-08-20T15:43 and has no `test_UAT_AC1353_*` in the tree; `git grep -a -o -E "test_UAT_AC13[0-9]{2}"` over `origin/main:tests` returns AC-1321…AC-1329 (one each) and no AC-1353. The evidence exists but is still named for the intent: `tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` and `:115`, under the header `// ── AC-2: the seam is real, not described`. This is a **uat-level** item, not an AC gap — AC-1353's text is aligned. | none at this level |
| 6 | info | exclusivity | AC-1328 + AC-1329 (their UATs) | — | The two ACs' *texts* are cleanly separated — AC-1328 owns the partition rule and the compatibility settings, AC-1329 owns the Astro transform and the node config's preserved includes/aliases/timeouts. Their *tests* are not: `test_UAT_AC1329_the_split_kept_the_astro_runtime_and_partitions_cleanly` (`:595`) re-asserts AC-1328's partition rule, its "composing configuration declares no suite of its own" clause, and its compatibility-date/flags claim. No AC-level action; flagged for the uat cycle. | none at this level |
| 7 | info | coverage | AC tree — deliberate absences | — | Three story claims are correctly expressed in *no* AC, and each is deliberate: the filesystem store's non-atomicity (STORY-118 Technical Context instructs "Do not write an acceptance criterion asserting atomicity of the filesystem store"); asset-name confinement (carried from CAP-85, "not restated here"); and REQ-141 AC-6 / REQ-142 AC-6's clean build, typecheck and lint, which are `xgd quality run` gates rather than capability behaviour. Recorded so a future coverage sweep does not read these as gaps. | none |

## Notes for the Editor

**Both violations are additive and neither touches the story body.** The
story-level cycle passed and STORY-118 already says everything these two
findings ask the AC layer to express — finding 1's three verbs are named in the
story's Description and retained by its Out-of-scope paragraph; finding 2's tool
adapter is named twice, in the Description and in the In-scope list. Nothing here
needs a `story-body-edit`, and none of it should be resolved by deleting story
text.

**Finding 2 must produce one AC, not two.** The start-up naming topology and the
tool adapter are two halves of the same claim — the adapter is one of the three
naming sites. Splitting them yields two ACs that each half-describe the other,
which is the exclusivity failure mode this level checks for.

**Finding 1 changes the shape of the AC-1321 UAT, so expect a `uat-edit` at the
next level.** The existing test walks a fixed list of seven questions twice (held
slug, unheld slug) over both backends. Extending the AC extends that list; it does
not need a new test. `appendChange`'s contract is worth reading before writing the
assertion — `site-store.ts:135` records that "a store that cannot take the record
returns the counter unmoved", which is the memory adapter's behaviour and is the
kind of thing a naive "assert it appended" test would get wrong.

**Finding 3 is the one place I would accept being overruled.** If the operator
reads REQ-141 AC-1 / REQ-142 AC-1 as a standing regression claim rather than a
reconciliation-time measurement, AC-1329's fourth bullet is correct as written and
the gap is in the UAT instead. I classified it as a warning rather than a
violation for that reason, and did not classify it `needs_review` because the
story body does resolve it — Technical Context, not In-scope.

**Do not read AC-1321's omission of `write` as part of finding 1.** `write` is the
one port verb deliberately covered elsewhere: AC-1323 owns it in full, including
the empty-change case. The three journal verbs have no such home.

**Carried forward, unchanged, from the story-level report.** The stale rationale
comment in `vitest.workers.config.mts:23–28` still states REQ-141's retracted
supply-chain diagnosis; it remains an operator decision and no AC encodes the pin
or its reasoning, which is correct. STORY-118's "Known divergence" paragraph is
the only thing stopping a later reader re-deriving the retracted theory and must
not be removed.
