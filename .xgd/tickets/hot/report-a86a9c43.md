---
uid: report-a86a9c43
id: REPORT-2468
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=ac)'
created_by: xgd
created_at: '2026-08-20T16:12:53.803514+00:00'
updated_at: '2026-08-20T16:12:53.803514+00:00'
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

Third ac-level pass. REPORT-2464 (2 violations + 1 warning) → REPORT-2465 (fix
attempt 1) → REPORT-2466 (1 violation) → REPORT-2467 (fix attempt 2, 1 fix
applied). The attempt-2 fix **did hold** and is verified below: AC-1329's store
clauses are gone from both the criterion and the Verification, and the scoping
paragraph naming AC-1325 and AC-1321 is present. But the fix narrowed AC-1329
onto an axis that carries the *same* defect one step over, and it was never
checked against AC-1328. That is finding 1.

Intent ledger re-derived from the ticket store (not carried over on trust); it is
unchanged from REPORT-2461/2464/2466. STORY-118's `intent_uid` is BUNDLE-19
(`bundle-77b28def`, `free_and_reconciled`, merged at `b18b859d7`); the two source
tickets bearing on this capability are:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-141 (`request-b18d2056`) | `bundled` in BUNDLE-19 (`free_and_reconciled`) | 2026-08-15 | Vitest split into node + workerd projects; D1/R2 bindings; `*.workers.test.ts` routing convention; production compatibility date/flags | YES |
| REQ-142 (`request-0dd62a5d`) | `free_and_reconciled` | 2026-08-15 | Async `SiteStore` port (11 verbs); `FsSiteStore`; `edit.ts` async; one whole change as one call; in-memory adapter; site factory over both backends; unchanged CLI surface + envelopes | YES |
| REQ-143, REQ-145, REQ-146, REQ-148 | `ready_to_reconcile` | 2026-08-15 | D1/R2 adapter, control-app as builder, AI host in workerd, modules in workerd | imminent — and all explicitly *out of scope* per STORY-118's Out-of-scope list; not enforced here |
| REQ-147 | `reconciling` | 2026-08-15 | Cloudflare Access — no store surface | imminent, not relevant |
| REQ-144 | `free_and_reconciled` | 2026-08-15 | Build/deploy/smoke scripts | YES, but no store surface |
| REQ-149 / REQ-150 | `draft` / `free_coding` | 2026-08-17 / 08-18 | Cloud publish; Vite SSR server | NO |
| REQ-134, REQ-112, REQ-65, REQ-69, REQ-80 | `abandoned` | various | — | NO |

**Verification environment.** Unchanged and still load-bearing. This worktree's
HEAD (`a9b0d8d34`) predates BUNDLE-19's merge: `git ls-tree HEAD --
tools/generate/src/store/` returns only `base/diff/fsutil/history/index/loadSite/
paths/snapshot`, while `origin/main` additionally holds `assemble.ts`,
`fs-store.ts`, `journal-model.ts`, `journal.ts`, `memory-store.ts`,
`site-store.ts`. Every code citation below was read from `origin/main` via
`git show` / `git grep -a`, text mode forced (STORY-118's survey hazard —
`builder.ts` and `fidelity.ts` carry NUL bytes).

## Alignment Ledger

Eleven ACs hang off STORY-118 (`story-3f4a5f2b`, `story_kind=feature`), all
`status=active`, `kind=behavior`, `regression_only=false`. One changed since
REPORT-2466: AC-1329, per REPORT-2467.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1321 `acceptance_criterion-d4cc3712` — totality + asynchrony | REQ-142 §5, §7, §10 | aligned — re-verified against `origin/main:tools/generate/src/store/site-store.ts`: the eleven enumerated questions are exactly the port's verbs (`hasDraft`, `readSiteJson`, `readPages`, `write`, `listAssets`, `readAsset`, `counter`, `appendChange`, `changesSince`, `pendingChanges`, `loadDraft`), all `Promise`-returning; `appendChange`'s doc states "Never fails a write: a store that cannot take the record returns the counter unmoved"; `DraftSnapshot.stamp` is "Opaque; equal iff the definition is unchanged" |
| AC-1322 `acceptance_criterion-f713cba6` — bytes, not locations | REQ-142 §5, §7 | aligned — `readAsset(): Promise<Uint8Array \| null>`, `StoredAsset.bytes`, and `StoredPage.name` documented as "A key, not a path — it never carries a directory component" |
| AC-1323 `acceptance_criterion-44c1d962` — one whole change | REQ-142 AC-5, §10 | aligned — `SiteWrite` carries `siteJson`/`pages`/`removePages`/`assets`/`removeAssets`, "an empty write is legal (it does nothing)" |
| AC-1324 `acceptance_criterion-31f6a0c5` — completes with no filesystem | REQ-142 AC-4, §8 | aligned |
| AC-1325 `acceptance_criterion-6a7b61e4` — both stores answer identically | REQ-142 AC-7, §8 | aligned — and remains the correctly-scoped owner of the store axis |
| AC-1326 `acceptance_criterion-d08eae5f` — unchanged CLI surface + envelopes | REQ-142 AC-3, §7 | aligned |
| AC-1327 `acceptance_criterion-16093733` — preview from whichever store | REQ-142 §7 (Preview assets), §10 | aligned — re-verified: `preview.ts:52` `{ kind: 'bytes'; contentType; body: Uint8Array }`, `:114` `await this.store.readAsset(...)`, `:118` content type from the name's extension |
| AC-1328 `acceptance_criterion-c8728ae8` — two runtimes, real bindings | REQ-141 AC-2/3/4, "Bindings mirror the deployed shape" | aligned — **and it is the sibling AC-1329 now collides with (finding 1)** |
| AC-1353 `acceptance_criterion-003caa07` — no filesystem in imports | REQ-142 AC-2, §7, §10 | aligned — re-verified: `git grep -a -n "node:"` over `store/site-store.ts`, `store/assemble.ts`, `store/journal-model.ts`, `store/memory-store.ts` and `cli/edit.ts` returns only prose in comments (`journal-model.ts:9`, `edit.ts:50/51/59`) and identifiers named `node` (`edit.ts:132/477/544/808`) — no import |
| AC-1354 `acceptance_criterion-56798f01` — start-up naming + tool adapter | REQ-142 §7 (Injection), §10 | aligned |
| AC-1329 `acceptance_criterion-ae2c7f77` — the split cost nothing | REQ-141 AC-1, AC-5, §3 | **not aligned** — the attempt-2 narrowing removed the store collision and left an identical runtime collision with AC-1328 and with the tree — see finding 1 |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1329 (`acceptance_criterion-ae2c7f77`), 4th bullet + final Verification sentence | ac-edit | AC-1329's fourth bullet now reads: "**No assertion is conditioned on which runtime it runs in**: a file routed to the Workers runtime **asserts exactly what it would assert in the filesystem runtime**, and the split introduced **no runtime-dependent expectation**. Routing decides where a test runs, never what it claims." Its Verification closes: "Assert over the routed test sources that **no assertion branches on the runtime it is executing in** — the expectation a test carries is the same one under either runtime." **Both are false against the tree, and both contradict sibling AC-1328, which mandates precisely the runtime-dependent expectations they forbid.** AC-1328 bullet 1 requires of a workers-marked file: "It **reports the Workers user agent**"; bullet 2 requires of every other file: "reports **a user agent that is not the Workers one**"; and AC-1328's Verification instructs "In the Workers-marked test, **assert the user agent** […] In an unmarked test, **use a filesystem module at load time** — so the file could only have loaded where one exists — and **assert the user agent is not the Workers one**." The tree does exactly that, in three places: `origin/main:tests/test_UAT_FC_REQ-141_workers_runtime.workers.test.ts:19` (`expect(navigator.userAgent).toBe('Cloudflare-Workers')`, plus `:21` `expect(typeof caches).toBe('object')`); `origin/main:tests/reconciliation-site-storage-port.workers.test.ts:32` (same assertion); and `origin/main:tests/test_UAT_FC_REQ-141_project_routing.test.ts:25` (`expect(globalThis.navigator?.userAgent).not.toBe('Cloudflare-Workers')`, preceded at `:21` by `expect(read('package.json')).toContain('"name": "1stcontact"')` — a `node:fs` read at module scope that only the filesystem runtime can satisfy). A file asserting `userAgent === 'Cloudflare-Workers'` does **not** assert what it would assert in the filesystem runtime; it asserts the negation of what its node-side counterpart asserts. These expectations were moreover **introduced by the split itself** — REQ-141's "What landed" lists both files as the split's own evidence — so "the split introduced no runtime-dependent expectation" is false in the strongest sense. This is the same defect REPORT-2466 caught on the store axis, one axis over: a universal claim over "the routed test sources" that forbids the discriminating assertion a sibling AC requires. A uat cycle asked to implement AC-1329's Verification would either fail on the tree at the three lines above or quietly weaken the check to nothing. | Scope the fourth bullet to behavioural assertions and exempt the runtime-identity probes AC-1328 owns. E.g.: "No *behavioural* assertion is conditioned on which runtime it runs in: routing decides where a test runs, never what a behavioural test claims. The deliberate exception is the runtime-identity probes AC-1328 requires — a workers-marked file asserting the Workers user agent, an unmarked file asserting it is not — which exist to prove the routing and could not be runtime-independent without ceasing to prove it." Mirror the same exemption in the Verification's final sentence. Because the title's second half ("and changed no assertion") is a historical delta claim already demoted to a one-time reconciliation measurement by the paragraph REPORT-2465 added, retitle to drop it — e.g. "The split cost nothing the single runtime provided". **Preserve verbatim**: bullets 1–3, the demotion paragraph, and the scoping paragraph REPORT-2467 added (which is correct and is what kept the store axis from re-broadening). |
| 2 | info | consistency | AC-1329 | — | **REPORT-2466 finding 1 is resolved and verified against the current ticket, not against REPORT-2467's account of it.** `or which store it was given` and `or store-dependent` are absent from the criterion; `or on which store it was handed` is absent from the Verification, whose final clause now resolves against the runtime axis alone. The added scoping paragraph — "This criterion is about the routing axis only […] because the port's totality claim (AC-1321) includes one question only the filesystem-backed adapter can be asked" — is present and correctly names AC-1325 as the store axis's owner. The `if (cwd !== null)` guard in `tests/reconciliation-site-storage-port.test.ts` and AC-1321's directory-without-definition clause were correctly left alone. | none |
| 3 | info | exclusivity | AC-1324 vs AC-1325 | — | Both enumerate the same body of editing assertions (read, write, copy edit, structured subtree round-trip, palette rules, asset add/remove, change counting, draft render), and one parameterized suite plausibly satisfies both. Judged **not** duplication: AC-1324's claim is completeness *in the absence of a filesystem* (its Verification adds "no filesystem site tree present at all" and "the fixture used holds no filesystem handle of any kind"), AC-1325's is *indistinguishability between the two adapters* (its Verification adds "sharing its assertions rather than duplicating them" and equality of the two assembled definitions after the same command sequence). Different properties over a shared assertion body. Recorded so a later pass does not read the shared enumeration as redundancy and delete one. | none |
| 4 | info | coverage | STORY-118 In-scope list vs the eleven ACs | — | Every In-scope bullet has a home: declared operations / asynchrony / totality → AC-1321; no location-shaped return → AC-1322; no filesystem *in imports* → AC-1353; one whole change as one call → AC-1323; two live stores chosen at start-up → AC-1354 (naming) + AC-1324 (completes) + AC-1325 (identical); editing surface, builder preview and tool adapter driven through the store given → AC-1354 + AC-1327; unchanged CLI surface and envelopes → AC-1326; two runtimes with real bindings and production compatibility → AC-1328; the split costing nothing the single config provided → AC-1329. The story's three "deliberate non-behaviours" are correctly **absent** from the ACs: no AC asserts filesystem-store atomicity (AC-1323 is explicitly "a claim about the shape of the ask rather than about the result"), the filesystem-free store's no-revision reporting is carried as totality inside AC-1321 rather than as a history claim, and asset-name confinement is not restated (it is CAP-85's). No coverage gap at this level. | none |
| 5 | info | coverage | AC-1353, AC-1354 | — | Still no `test_UAT_AC1353_*` / `test_UAT_AC1354_*` in the tree; the AC-named UATs on `origin/main` run AC-1321…AC-1329. Both ACs' texts are aligned, so this remains a **uat-level** item, unchanged from REPORT-2466 finding 5. For AC-1353 the evidence exists under an intent name (`tests/test_UAT_FC_REQ-142_site_store_port.test.ts`); for AC-1354 the uat cycle will be authoring rather than renaming. | none at this level |
| 6 | info | — | worktree / evidence | — | This worktree cannot host or run the tests these ACs describe (HEAD `a9b0d8d34` predates BUNDLE-19's merge; the port modules are absent). All code citations here were read from `origin/main`. Not drift; recorded so it is not rediscovered as one, and so the uat cycle expects the same constraint. | none |

## Notes for the Editor

**One violation, and again it is a narrowing.** Do not rewrite AC-1329. Bullets
1–3, the demotion paragraph and REPORT-2467's scoping paragraph are all correct
and must survive verbatim. Only the fourth bullet and the Verification's final
sentence need the AC-1328 exemption, plus the title change that follows from the
demotion already made.

**Do not resolve this by editing AC-1328 or the tests.** The tempting fix is to
drop AC-1328's "reports the Workers user agent" / "reports a user agent that is
not the Workers one" bullets, or the three assertions at
`tests/test_UAT_FC_REQ-141_workers_runtime.workers.test.ts:19`,
`tests/reconciliation-site-storage-port.workers.test.ts:32` and
`tests/test_UAT_FC_REQ-141_project_routing.test.ts:25`, so AC-1329's broader claim
becomes true. That would be backwards for the same reason REPORT-2466 gave about
the store axis: those probes are how the split proves itself — REQ-141 §3 states
the deliverable as "a file's runtime is legible from its name alone", and a
routing convention with no assertion that the routing happened is not checked at
all. The over-broad AC is the wrong element, not the sibling it collides with.

**The pattern worth naming, because this is the second time.** AC-1329 has now
twice been broadened into a universal claim over "the routed test sources" that
forbids a discriminating assertion a sibling AC requires — first on the store axis
(AC-1321's directory-without-definition, guarded by `cwd !== null`), now on the
runtime axis (AC-1328's user-agent probes). Both times the broadening came from
answering "make this re-verifiable" by widening scope. AC-1329's honest re-verifiable
content is its first three bullets: the node runtime still routes through Astro's
`getViteConfig` with its original aliases and timeouts, and the workers runtime
mentions Astro nowhere — both already asserted at
`tests/test_UAT_FC_REQ-141_project_routing.test.ts:53-56`. Anything beyond that on
the "changed no assertion" axis is the historical delta measurement, and the
demotion paragraph is the right home for it.

**Carried forward unchanged.** The stale rationale comment in
`vitest.workers.config.mts` still states REQ-141's retracted supply-chain diagnosis
(REQ-141 carries the explicit post-promotion CORRECTION; the actual cause was pnpm
11.9.0's incremental resolution dropping optional dependencies). No AC encodes the
pin or its rationale, which is correct and deliberate per STORY-118's "Known
divergence" paragraph — which must not be removed, or a later reader will re-derive
the retracted theory from the comment.
