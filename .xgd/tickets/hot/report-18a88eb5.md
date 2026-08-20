---
uid: report-18a88eb5
id: REPORT-2472
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=ac)'
created_by: xgd
created_at: '2026-08-20T16:31:15.752280+00:00'
updated_at: '2026-08-20T16:31:15.752280+00:00'
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

Fifth ac-level pass. REPORT-2464 (2v/1w) → fix 1 (REPORT-2465) → REPORT-2466 (1v) → fix 2
(REPORT-2467) → REPORT-2468 (1v) → fix 3 (REPORT-2469) → REPORT-2470 (1v) → fix 4
(REPORT-2471).

**REPORT-2470's finding 1 was acted on, and the freshness sentence it objected to is gone
from AC-1327.** Verified against the current ticket (`acceptance_criterion-16093733`,
`updated_at` 16:24:39), not against REPORT-2471's account of it: bullets 1–3 and their
three Verification sentences survive verbatim; the old bullet 4 ("A change made to the
draft outside the builder is picked up on the next request, without the server being
restarted") is removed; a hand-off paragraph naming CAP-85 / AC-1033 / REQ-119 was added.
CAP-85's AC-1033 was not touched, as instructed.

**The violation below is that the replacement bullet 4 lands on the same side of the
capability boundary as the sentence it replaced.** REPORT-2470 recommended the specific
re-scoping wording that fix 4 applied, on the stated premise that "the `DraftSnapshot.stamp`
that arrived with REQ-142 is what invalidates the memoised render". **That premise is false
and this pass falsified it in the tree.** The stamp, the memoised render cache, and the
stamp-before-cache-read invalidation rule all predate REQ-142 and are REQ-119's — they are
present verbatim in `2b902ead0^`, the commit immediately before the port landed. So the
re-scope did not hand the claim back to CAP-85; it restated CAP-85's claim in the
mechanism's own vocabulary. REPORT-2470's alternative resolution — plain deletion, which it
verified leaves no coverage gap — is the correct one and is the recommendation here.

This is the **fourth** instance of the pattern REPORT-2470 named (AC-1329 broadened past
the store axis, then past the runtime axis; AC-1327 past the capability boundary; now
AC-1327 past it again one layer down).

## Cumulative Intent Considered

STORY-118 (`story-3f4a5f2b`, `story_kind=feature`, `status=completed`) carries
`intent_uid = bundle-77b28def`. All statuses below were re-read from the ticket store this
pass.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-19 (`bundle-77b28def`) | `free_and_reconciled` | 2026-08-18 | The bundle this story's intent points at; nine source tickets, of which only REQ-141 and REQ-142 carry a storage or test-runtime surface | YES |
| REQ-141 (`request-b18d2056`) | `bundled` in BUNDLE-19 | 2026-08-15 | Vitest split into node + workerd projects; real D1 (`DB`) and R2 (`SITES`) bindings; `*.workers.test.ts` routing; `compatibilityDate` + `nodejs_compat` copied from the apps' wrangler.toml; node project unchanged | YES |
| REQ-142 (`request-0dd62a5d`) | `free_and_reconciled` | 2026-08-15 | Async `SiteStore` port (11 verbs); `FsSiteStore`; in-memory adapter; `edit.ts` async with `store` injected; one whole change as one `write`; `DraftStore` **folded into** the port and `PreviewFile` carrying bytes; site factory over both backends; unchanged CLI surface and `code/path/hint` envelopes | YES |
| REQ-144 (`request-7bef34e0`) | `free_and_reconciled` | 2026-08-15 | Build/deploy/smoke scripts | YES — no store surface |
| REQ-119 (`request-64864801`) | `free_and_reconciled` | 2026-07-31 | **Request-time draft and edit renders inside control-app** — and, as this pass establishes from the tree, the render cache and its stamp-based invalidation. Not a BUNDLE-19 source; its behaviour lives in CAP-85's tree (AC-1033). The true owner of the claim in finding 1 | YES — but **not this capability's** |
| REQ-143 (`request-18a48d63`) | `ready_to_reconcile` | 2026-08-15 | The Cloudflare SiteStore (D1 + R2 adapter) | imminent — explicitly Out of scope per STORY-118; not enforced here |
| REQ-145 / REQ-146 / REQ-148 | `ready_to_reconcile` | 2026-08-15 | Builder move, AI host in workerd, behavior modules in workerd | imminent — out of scope |
| REQ-147 (`request-23fd6e61`) | `reconciling` | 2026-08-15 | Cloudflare Access on the builder | imminent — no store surface |
| REQ-149 / REQ-150 | `draft` / `free_coding` | 2026-08-17 / 18 | Cloud publish; Vite SSR server | NO |

**Level cascade honoured.** The story-level cycle passed at REPORT-2463, so STORY-118's body
is the working reference throughout. Intent was consulted on exactly one point: whether
REQ-142 asks for the preview's cache behaviour. It does not — the string `cache` appears
once in REQ-142's entire body, in the survey-hazard note about NUL cache-key separators in
`builder.ts`/`fidelity.ts`, and the words `stamp`, `stale`, `fresh`, `memois` and `restart`
appear nowhere in it at all.

**Verification environment.** Unchanged from REPORT-2470 and still load-bearing. This
worktree's HEAD (`d0d0fd1ea`) predates BUNDLE-19's merge; the port modules are absent from
`tools/generate/src/store/`. Every code citation below was read from `origin/main` or from
the named historical commit via `git show`, text mode forced where relevant (STORY-118's
survey hazard).

## Alignment Ledger

Eleven ACs hang off STORY-118, all `status=active`, `kind=behavior`, `regression_only=false`.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1321 `acceptance_criterion-d4cc3712` — totality + asynchrony | REQ-142 §5, §7, §10 | aligned — the ten enumerated questions plus `write` are exactly the port's verbs (`site-store.ts`). The stamp clause is in bounds; see finding 3, which is also the line that makes finding 1 a violation |
| AC-1322 `acceptance_criterion-f713cba6` — bytes, not locations | REQ-142 §5, §7 | aligned |
| AC-1323 `acceptance_criterion-44c1d962` — one whole change | REQ-142 AC-5, §10 | aligned — a claim about the shape of the ask, not atomicity, per STORY-118's first deliberate non-behaviour |
| AC-1324 `acceptance_criterion-31f6a0c5` — completes with no filesystem | REQ-142 AC-4, §8 | aligned |
| AC-1325 `acceptance_criterion-6a7b61e4` — both stores answer identically | REQ-142 AC-7, §8 | aligned — correctly-scoped owner of the store axis |
| AC-1326 `acceptance_criterion-d08eae5f` — unchanged CLI surface + envelopes | REQ-142 AC-3, §7 | aligned |
| AC-1327 `acceptance_criterion-16093733` — preview from whichever store | REQ-142 §7 (Preview assets), §10 | **not aligned** — bullets 1–3 are exactly the port's business; the new bullet 4 and the new final Verification sentence assert REQ-119's cache mechanism. See finding 1 |
| AC-1328 `acceptance_criterion-c8728ae8` — two runtimes, real bindings | REQ-141 AC-2/3/4 | aligned |
| AC-1329 `acceptance_criterion-ae2c7f77` — the split cost nothing | REQ-141 AC-1, AC-5, §3 | aligned — both prior repairs hold; see finding 7 |
| AC-1353 `acceptance_criterion-003caa07` — no filesystem in imports | REQ-142 AC-2, §7, §10 | aligned |
| AC-1354 `acceptance_criterion-56798f01` — start-up naming + tool adapter | REQ-142 §7 (Injection, Asset sources), §10 | aligned |

**Coverage over STORY-118's In-scope list is complete**, and rechecked independently this
pass: declared operations / asynchrony / totality → AC-1321; no location-shaped return →
AC-1322; imports assertion → AC-1353; one whole change → AC-1323; two live stores chosen at
start-up with identical behaviour → AC-1324 + AC-1325 + AC-1354; editing surface, preview
and tool adapter driven through the given store → AC-1324 + AC-1327 (bullets 1–3) + AC-1354;
unchanged CLI surface and envelopes → AC-1326; two test runtimes with real bindings →
AC-1328 + AC-1329. **No AC crosses into the Out-of-scope list**: none asserts the Cloudflare
adapter, none asserts filesystem-store atomicity, none asserts change-record contents or
window policy, none asserts publish/checkout/render/history, and none encodes the test-pool
pin or its retracted rationale (STORY-118's "Known divergence" requirement — respected).

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency (with an exclusivity consequence) | AC-1327 (`acceptance_criterion-16093733`), 4th bullet + final Verification sentence | ac-edit | The replacement bullet reads: "**The preview re-asks the store on each request; its memoised render is invalidated by the store's own stamp rather than held, so what is served follows the definition the store currently holds.**" The matching Verification sentence: "**Change the definition the store holds and assert the store answers with a different stamp and the next request re-renders rather than serving the cached entry.**" Every element of that claim predates this capability and belongs to REQ-119 / CAP-85. Read from the commit immediately before the port landed, `2b902ead0^:tools/generate/src/cli/preview.ts`: (a) `DraftSnapshot.stamp` already exists, line 41, carrying the *identical* docstring "Opaque; equal iff the definition is unchanged. **Keys the render cache**, so a change made outside the builder — `1c copy set`, a hand-edited page — **is picked up on the next request rather than needing the server restarted**"; (b) `PreviewRenderer` already carries the *verbatim* docstring "The render is **memoised** per `(slug, channel)` and **invalidated by the store's stamp** … the stamp is checked before the cache is read, not on a timer" (lines 113–117), the same `cache = new Map<string, { stamp: string; rendered: RenderedSite }>()` (line 120), and the same `if (hit && hit.stamp === snapshot.stamp) return hit.rendered` (line 172); (c) `file()` already re-asked the store per request — `const snapshot = this.store.load(slug)` (line 135). REQ-142 changed exactly two things here: `DraftSnapshot.loaded: LoadedSite` became `result: LoadResult`, and the interface moved from `DraftStore` in `preview.ts` to `SiteStore` in `store/site-store.ts`. The cache, its invalidation policy and the per-request re-ask are untouched. REQ-142's body never asks for any of it (`cache` appears once, in the NUL-separator survey note; `stamp`/`stale`/`fresh`/`memois`/`restart` appear zero times). STORY-118's Technical Context states the division in terms — "**CAP-85's builder origin owns request confinement and freshness, not the store's shape**" — and a memoised render invalidated by a stamp *is* the freshness mechanism, not the store's shape. The exclusivity consequence is concrete: the new Verification sentence is CAP-85 **AC-1033**'s (`acceptance_criterion-ae33f0ab`, STORY-99 `story-e674c60a`, capability `capability-a994b8f3`) own experiment — AC-1033 already closes with "the assertion cannot pass on a rendering that was simply produced once and held" — and AC-1033 already carries `uat_coverage: pass`. A uat cycle here would author a second proof of an already-proven CAP-85 behaviour. | **Delete bullet 4 and the final Verification sentence.** REPORT-2470 verified — and this pass re-verified — that deletion leaves **no** coverage gap: STORY-118's In-scope bullet "the builder's preview of a draft … driven through the store they were given" is carried by AC-1327 bullets 1–3 (renders from a store with no filesystem tree; an asset resolves to bytes plus a content type; an absent asset resolves to nothing) plus AC-1354's "the builder origin names it once per context, and its preview of a draft renders through that same one". **Do not re-scope a third time.** The port's genuine contribution to the stamp is that `loadDraft` now *answers* with one, and AC-1321 already owns exactly that ("plus a token that is equal if and only if the definition is unchanged"); there is nothing left for AC-1327 to own on this axis. **Keep the hand-off paragraph** added by fix 4 (the one naming CAP-85, AC-1033 and REQ-119) — it is correct and is the record of why the bullet is absent — but delete or adjust its final sentence "This capability owns only the store-shaped half: that the preview asks the store again, and trusts the store's stamp to decide whether its cached render still describes what the store holds", which asserts the same misattribution in prose. **Do not edit CAP-85's AC-1033.** |
| 2 | info | consistency | AC-1327 bullets 1–3 | — | The part of fix 4 that is correct, recorded so it is not disturbed. Bullets 1–3 and their three Verification sentences are byte-for-byte what REPORT-2470 asked be preserved, and are supported by REQ-142 §7 ("Preview assets") and §10 (`readAsset(): Promise<Uint8Array \| null>`, `PreviewFile` carrying bytes) and by `origin/main:tools/generate/src/cli/preview.ts:106-114`. The freshness sentence REPORT-2470 objected to is genuinely gone. | none |
| 3 | info | consistency | AC-1321 (`acceptance_criterion-d4cc3712`), stamp clause | — | Judged **in bounds**, and the reason is the line finding 1 crosses. STORY-118's list of what storage is asked ends at "assemble and validate the current draft" and does not itself mention a token; AC-1321 refines that operation's *answer shape*, which is the port's declared surface and is REQ-142's deliverable (`site-store.ts`, `DraftSnapshot`). That is a claim about what the store hands back. AC-1327's bullet 4 is a claim about what a consumer *does* with it — a caching policy the port neither introduced nor changed. Recorded so a later pass neither reopens AC-1321 nor reads finding 1 as reaching it. The same reasoning covers AC-1321's three journal-facing clauses, already ruled in bounds by REPORT-2470 finding 3 against STORY-118's Out-of-scope hand-off to CAP-99 (`capability-702b7c02`). | none |
| 4 | info | exclusivity | AC-1324 vs AC-1325 | — | Carried forward from REPORT-2468 finding 3 / REPORT-2470 finding 4 and re-confirmed independently. Both enumerate the same body of editing assertions and one parameterized suite plausibly satisfies both; **not** duplication, because AC-1324's claim is completeness *in the absence of a filesystem* ("no filesystem site tree present at all", "the fixture used holds no filesystem handle of any kind") and AC-1325's is *indistinguishability between the two adapters* ("sharing its assertions rather than duplicating them", equality of the two assembled definitions). Likewise AC-1326's CLI not-found refusal and AC-1354's tool-adapter not-found refusal are different entry points, not duplicates. Recorded so a later pass does not delete one of either pair. | none |
| 5 | info | coverage | AC-1353, AC-1354 | — | Still no `test_UAT_AC1353_*` / `test_UAT_AC1354_*` on `origin/main`; the AC-named UATs there run AC-1321…AC-1329. Both AC texts are aligned, so this is a **uat-level** item, unchanged from REPORT-2466 / 2468 / 2470 finding 5. For AC-1353 the evidence exists under an intent name (`tests/test_UAT_FC_REQ-142_site_store_port.test.ts`) and needs re-pointing; for AC-1354 the uat cycle will be authoring rather than renaming. | none at this level |
| 6 | info | — | worktree / evidence | — | This worktree cannot host or run the tests these ACs describe (HEAD `d0d0fd1ea` predates BUNDLE-19's merge; the port modules are absent from `tools/generate/src/store/`). All code citations here were read from `origin/main` or from `2b902ead0^` via `git show`. Not drift; recorded so it is not rediscovered as one, and so the uat cycle expects the same constraint. | none |
| 7 | info | consistency | AC-1329 (`acceptance_criterion-ae2c7f77`) | — | Both earlier repairs re-verified against the current ticket this pass and both hold. Title "The split cost nothing the single runtime provided"; bullet 4 scoped to *behavioural* assertions with the explicit AC-1328 exemption for the routing probes and the D1/R2 bindings; the Verification carrying the matching exclusion; the demotion paragraph (the before-and-after failing-set comparison as a one-time reconciliation measurement, REPORT-2465) and the store-axis scoping paragraph naming AC-1325 and AC-1321 (REPORT-2467) both intact. That thread stays closed. | none |

## Notes for the Editor

**One violation, one action: delete.** Bullet 4 of AC-1327 and the last sentence of its
Verification. Nothing else in the AC tree needs to move.

**Why a third re-scope would be wrong.** The last two fix attempts each replaced an
over-broad claim with a narrower one and each time the narrower one was still on the wrong
side of the line, because the line was drawn from a report's assertion about provenance
rather than from the tree. This pass checked the tree: `git show 2b902ead0^:tools/generate/
src/cli/preview.ts` is the whole argument, and it shows the cache, the stamp and the
per-request re-ask all sitting there a fortnight before the port existed. There is no
remaining preview-side property this capability contributed; the port's contribution is
`loadDraft` answering with a stamp, and AC-1321 already carries it. Delete rather than
re-word.

**A caution for whoever applies this.** REPORT-2470's "Notes for the Editor" recommend the
exact wording that is now the violation, and REPORT-2471 recorded three `preview.ts`
citations as evidence for it. Those citations are real lines but they are REQ-119's lines —
`preview.ts:79-86` and `:100` on `origin/main` are the *moved* forms of `2b902ead0^`'s
lines 113–117 and 135. If a future pass re-reads only `origin/main`, the same wrong
conclusion is available again. The historical commit is the disambiguator; cite it.

**The pattern, now at four instances.** AC-1329 twice, AC-1327 twice. In every case the AC
states something *true*; the defect is that the proof belongs to a sibling that already
carries it. STORY-118's "Relationship to existing capabilities" paragraph (CAP-86, CAP-99,
CAP-85, CAP-82) and its three "deliberate non-behaviours" are where that boundary is
written — the In-scope list says what this capability covers, those two paragraphs say what
it must not restate. For the uat level specifically: before authoring a UAT for any AC here,
check whether a sibling capability's AC already carries `uat_coverage: pass` for the same
experiment. AC-1033 does.

**Carried forward unchanged.** The stale rationale comment in `vitest.workers.config.mts`
still states REQ-141's retracted supply-chain diagnosis. No AC encodes the pin or its
rationale, which is correct and deliberate per STORY-118's "Known divergence" paragraph —
which must not be removed, or a later reader will re-derive the retracted theory from the
comment.
