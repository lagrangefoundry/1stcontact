---
uid: report-46662a1b
id: REPORT-2466
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=ac)'
created_by: xgd
created_at: '2026-08-20T16:04:24.005822+00:00'
updated_at: '2026-08-20T16:04:24.005822+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-c4c7a854
  level: ac
  violations: 1
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every Edit
# Level: ac

**Result**: FAIL
**Violations**: 1
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

Second ac-level pass. REPORT-2464 (`report-8f9bb2e8`, fail, 2 violations + 1
warning) was answered by REPORT-2465 (`report-1b3c5555`, ac attempt 1, 3 fixes,
`violations_remaining: 0`). This pass re-read the post-fix state rather than
assuming those fixes held: **two of the three did hold and are verified below;
the third introduced a new contradiction.**

The intent ledger is unchanged from REPORT-2461/REPORT-2464 and was not
re-derived — the story-level cycle passed (REPORT-2463) and no intent ticket
changed status in the interval.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-141 | bundled in BUNDLE-19 (`free_and_reconciled`) | 2026-08-15 | Vitest split into node + workerd projects; D1/R2 bindings; filename routing convention; production compatibility settings | YES |
| REQ-142 | `free_and_reconciled` | 2026-08-15 | Async `SiteStore` port (11 verbs); `FsSiteStore`; `edit.ts` async; one whole change as one call; in-memory adapter; site factory over both backends; unchanged CLI surface + envelopes | YES |
| REQ-143, REQ-145, REQ-146, REQ-148 | `ready_to_reconcile` | 2026-08-15 | Third (D1/R2) adapter + CAS verbs; control-app as builder; injected store into `createL1Toolbox`; more `*.workers.test.ts` | imminent — not enforced here |
| REQ-147 | `reconciling` | 2026-08-15 | Cloudflare Access — no store surface | imminent, not relevant |
| REQ-149 / REQ-150 | `draft` / `free_coding` | 2026-08-17 / 18 | Publish in the cloud; Vite SSR server | NO |
| REQ-134, REQ-112 | `abandoned` | 2026-08-12 / 07-31 | — | NO |

**Verification environment.** Unchanged and still load-bearing: this worktree's
HEAD (`af939ba02`) predates BUNDLE-19's merge and contains none of the port
modules. Every citation below was read from `origin/main` via `git show` /
`git grep -a`, text mode forced.

## Alignment Ledger

Eleven ACs now hang off STORY-118 (`story-3f4a5f2b`, `story_kind=feature`), all
`status=active`, `kind=behavior`, `regression_only=false`. Three changed since
REPORT-2464: AC-1321 and AC-1329 edited (15:59), AC-1354 added (16:00).

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1321 `acceptance_criterion-d4cc3712` — totality + asynchrony | REQ-142 §5, §7, §10 | **resolved** — see info 2; enumeration now spans the full port and each added contract matches the code |
| AC-1354 `acceptance_criterion-56798f01` — start-up naming + tool adapter | REQ-142 §7 (Injection), §10 (three call sites) | **resolved** — see info 3; all three named entry points verified in the tree |
| AC-1329 `acceptance_criterion-ae2c7f77` — the split cost nothing | REQ-141 AC-1, AC-5 | **regressed** — the historical half was correctly demoted, but its replacement clause contradicts AC-1321 and the tree — see finding 1 |
| AC-1322 `acceptance_criterion-f713cba6` | REQ-142 §5, §7 | aligned, unchanged since 2026-08-20T05:24 |
| AC-1323 `acceptance_criterion-44c1d962` | REQ-142 AC-5, §10 | aligned, unchanged — still the sole owner of the `write` verb, which AC-1321 now explicitly cedes to it in one line |
| AC-1324 `acceptance_criterion-31f6a0c5` | REQ-142 AC-4 | aligned, unchanged |
| AC-1325 `acceptance_criterion-6a7b61e4` | REQ-142 AC-7, §8 | aligned, unchanged — and already owns the store-axis claim AC-1329 has now duplicated and over-broadened (finding 1) |
| AC-1326 `acceptance_criterion-d08eae5f` | REQ-142 AC-3, §7 | aligned, unchanged — owns the CLI half of the asset-source refusal; AC-1354 owns the adapter half plus their identity |
| AC-1327 `acceptance_criterion-16093733` | REQ-142 §7, §10 | aligned, unchanged |
| AC-1328 `acceptance_criterion-c8728ae8` | REQ-141 AC-2/3/4 | aligned, unchanged |
| AC-1353 `acceptance_criterion-003caa07` | REQ-142 AC-2, §7, §10 | aligned, unchanged |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1329 (`acceptance_criterion-ae2c7f77`), 4th bullet | ac-edit | REPORT-2465 replaced AC-1329's unverifiable historical bullet with: "No assertion is conditioned on which runtime it runs in **or which store it was given**… neither the split nor storage becoming a port introduced a runtime-dependent or **store-dependent** expectation", and a Verification reading "assert over the routed test sources that no assertion branches on the runtime it is executing in **or on which store it was handed**." Demoting the historical measurement was right, and the *runtime* half is a sound re-verifiable property. **The store half is not, and it contradicts a sibling AC.** AC-1321 mandates a claim that is only askable of one adapter: "A directory that exists but holds no definition is therefore not a site with a draft" — meaningless for a store with no directories. The tree satisfies it exactly as AC-1321 requires, by branching on the backend: `tests/reconciliation-site-storage-port.test.ts:187` guards `if (cwd !== null)` around two assertions at `:189–190` (`hasDraft('empty-dir')` is false, `readSiteJson('empty-dir')` is null), under the comment "Only askable of the adapter that has directories at all." That `cwd` **is** the backend discriminator by construction: `tests/support/site-factory.ts:45` declares `cwd: string \| null` on the shared handle, `:123` gives the filesystem backend a real temp dir and `:137` gives the memory backend `cwd: null`. So AC-1329 as rewritten forbids precisely the assertion AC-1321 requires, and a uat cycle asked to implement its Verification would either fail on the tree or quietly weaken the check to nothing. Compounding it, the store axis is **already owned, and correctly scoped**, by AC-1325: "The identical body of *editing* assertions … passes against both without a single assertion being adjusted for one of them" — scoped to the editing body, which is why AC-1325 does not collide with AC-1321's totality test. AC-1329's new clause is that same claim, unscoped. | Narrow AC-1329's fourth bullet to the runtime axis only — routing decides where a test runs, never what it claims — and drop the "or which store it was given" / "store-dependent" clauses from both the criterion and the Verification. The store axis needs no new home: AC-1325 already carries it, scoped to the editing assertions where it is true. Leave the demotion of the historical failing-set comparison exactly as REPORT-2465 wrote it; that half was correct. |
| 2 | info | coverage | AC-1321 | — | **REPORT-2464 finding 1 is resolved and verified against the code, not merely against the fix report's claim.** The enumeration now spans the port's full surface, and each added contract matches `origin/main`: "record a change" → returns the count, and "a store that cannot take the record answers with the counter unmoved rather than raising" matches `memory-store.ts` `appendChange`, which returns `Promise.resolve(0)` for a site it does not hold under the comment "Journalling never fails a write … reports the counter unmoved rather than throwing"; "the records after that count, where the counter stands now, and whether the retained window still reaches back that far" matches `ChangeSlice` (`journal-model.ts:52–59`: `since`, `now`, and the truncation flag "True when the window no longer reaches back to `since`"); "the files added, modified and removed … or no revision at all" matches `memory-store.ts` `pendingChanges`, which returns `{ baseRevision: null, added: […], modified: [], removed: [] }` for a held site and all-empty for an unheld one. AC-1321's one-line cession of `write` to AC-1323, with asynchrony still spanning the whole port, closes the omission cleanly without creating an exclusivity overlap. | none |
| 3 | info | coverage | AC-1354 | — | **REPORT-2464 finding 2 is resolved and verified.** Authored as one AC covering both halves, as instructed. All three naming sites exist where the AC says: `origin/main:tools/generate/src/cli/index.ts:1312` (`editOptions`), `builder.ts:624` (`builderStore`) with `previewRenderer` at `:638` constructing `new PreviewRenderer(builderStore(ctx))` — which is what makes the AC's "its preview of a draft renders through that same one" true rather than asserted — and `ai/toolbox.ts:505`. The adapter's asset-source half (`toolbox.ts:136–150`, `readSourceFile`) is covered including envelope identity with the CLI's refusal for the same input, which is the half AC-1326 does not carry. | none |
| 4 | info | exclusivity | AC-1354 vs AC-1324 / AC-1326 / AC-1327 | — | Checked for overlap introduced by the new AC; none rises to a finding. AC-1354's "a copy edit lands and reads back, and the change count advances" restates assertions AC-1324 also makes, but through a **different entry point** (the assistant's tool adapter, not the editing surface directly) — which is the surface AC-1354 exists to cover. Its builder bullet is about *where the store is named*; AC-1327 is about what the preview *serves*. Its refusal clause is the adapter's, complementary to AC-1326's CLI one and necessarily referencing it to assert identity. Recorded so a later check does not read these as duplication. | none |
| 5 | info | coverage | AC-1353, AC-1354 | — | Neither has a `test_UAT_AC1353_*` / `test_UAT_AC1354_*` in the tree; `git grep -a -o -E "test_UAT_AC13[0-9]{2}"` over `origin/main:tests` still returns AC-1321…AC-1329, one each. Both ACs' *texts* are aligned, so this is a **uat-level** item. For AC-1353 the evidence exists but is intent-named (`tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` and `:115`); for AC-1354 no equivalent exists and the uat cycle will be authoring rather than renaming. | none at this level |
| 6 | info | — | worktree / evidence | — | This worktree cannot host or run the tests these ACs describe: HEAD `af939ba02` predates BUNDLE-19's merge and `git ls-tree HEAD -- tools/generate/src/store` returns only `base/diff/fsutil/history/index/loadSite/paths/snapshot`. That is why no fix in this cycle has been able to author a UAT alongside a new AC, and it will constrain the uat cycle the same way. Not drift; recorded so it is not rediscovered as one. | none |

## Notes for the Editor

**One violation, and it is a narrowing, not a rewrite.** Delete two clauses from
AC-1329 — "or which store it was given" in the criterion's fourth bullet and "or
on which store it was handed" in the Verification, plus the word
"store-dependent" — and the AC is correct. Everything else REPORT-2465 did to
AC-1329 was right and should be preserved verbatim, including the paragraph
demoting the failing-set comparison to a one-time reconciliation measurement.

**Do not resolve this by editing AC-1321 or the test.** The tempting fix is to
delete AC-1321's "a directory that exists but holds no definition" clause, or the
`if (cwd !== null)` branch at `tests/reconciliation-site-storage-port.test.ts:187`,
so that AC-1329's broader claim becomes true. That would be backwards: the clause
traces to real filesystem-adapter behaviour, the branch is the correct way to
express a claim only one adapter can be asked, and REPORT-2461 already recorded
that a directory-without-definition is not a site with a draft as part of the
totality claim. The over-broad AC is the wrong element, not the sibling it
collides with.

**Why this was worth failing a second pass over.** The two substantive violations
from REPORT-2464 were both fixed well — I re-derived every contract AC-1321 now
asserts from `memory-store.ts` and `journal-model.ts` rather than taking the fix
report's word, and all of them check out. The regression came from the *warning*,
where a request to make a criterion re-verifiable was answered by broadening its
scope. A property that is checkable but false is worse than one that is true but
historical, and it would have reached the uat cycle as an unimplementable check.

**Carried forward unchanged.** The stale rationale comment at
`vitest.workers.config.mts:23–28` still states REQ-141's retracted supply-chain
diagnosis and remains an operator decision; no AC encodes the pin or its
reasoning, which is correct. STORY-118's "Known divergence" paragraph is the only
thing stopping a later reader re-deriving the retracted theory and must not be
removed.
