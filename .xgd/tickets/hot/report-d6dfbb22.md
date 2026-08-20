---
uid: report-d6dfbb22
id: REPORT-2470
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=ac)'
created_by: xgd
created_at: '2026-08-20T16:23:33.823613+00:00'
updated_at: '2026-08-20T16:23:33.823613+00:00'
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

Fourth ac-level pass. REPORT-2464 (2v/1w) → REPORT-2465 (fix 1) → REPORT-2466 (1v) →
REPORT-2467 (fix 2) → REPORT-2468 (1v) → REPORT-2469 (fix 3).

**REPORT-2468's violation is resolved and verified against the current ticket, not
against REPORT-2469's account of it.** AC-1329 (`acceptance_criterion-ae2c7f77`,
`updated_at` 16:15:05) now reads "The split cost nothing the single runtime provided";
its fourth bullet is scoped to *behavioural* assertions and exempts "everything AC-1328
owns — the probes that prove the routing itself happened … and the real database and
object-store bindings that exist only in the Workers runtime"; the Verification's final
sentence carries the same exemption. Bullets 1–3, the demotion paragraph (REPORT-2465)
and the store-axis scoping paragraph naming AC-1325 and AC-1321 (REPORT-2467) all
survive verbatim. Neither AC-1328 nor any test was touched. Re-checked against the tree:
`git ls-tree origin/main -- tests/` yields exactly two `*.workers.test.ts` files
(`test_UAT_FC_REQ-141_workers_runtime.workers.test.ts`,
`reconciliation-site-storage-port.workers.test.ts`), and every runtime-conditioned
assertion in either is an AC-1328-owned probe (user agent, `typeof caches`, D1
`sqlite_master` + engine-enforced PK, R2 server-computed `size`/`etag`); the node-side
probe at `tests/test_UAT_FC_REQ-141_project_routing.test.ts:21,25` is the other half.
The store-axis `cwd !== null` guard is untouched and is correctly outside the narrowed
bullet, which now conditions on runtime only. That thread is closed.

**The violation below is new to this pass and was not raised by REPORT-2461/2464/2466/2468.**
It is a cross-capability scope collision on AC-1327, found by walking each AC against
STORY-118's "Relationship to existing capabilities" paragraph rather than against its
In-scope list alone.

## Cumulative Intent Considered

STORY-118 (`story-3f4a5f2b`, `story_kind=feature`, `status=completed`) carries
`intent_uid = bundle-77b28def` (BUNDLE-19, `free_and_reconciled`, merged at
`b18b859d7414a049be45e09f48426d73742e5bf2`). BUNDLE-19's nine source tickets are
REQ-133, BUG-35, REQ-131, REQ-140, REQ-139, REQ-123, REQ-141, REQ-144, REQ-142; only
REQ-141 and REQ-142 carry a storage or test-runtime surface. All statuses below were
re-read from the ticket store this pass, not carried over.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-141 (`request-b18d2056`) | `bundled` in BUNDLE-19 (`free_and_reconciled`) | 2026-08-15 | Vitest split into node + workerd projects; D1 (`DB`) and R2 (`SITES`) bindings; `*.workers.test.ts` routing convention; `compatibilityDate: '2025-07-01'` + `nodejs_compat` copied from the apps' wrangler.toml; node project unchanged (aliases, timeouts, Astro transform) | YES |
| REQ-142 (`request-0dd62a5d`) | `free_and_reconciled` | 2026-08-15 | Async `SiteStore` port (11 verbs); `FsSiteStore`; in-memory adapter; `edit.ts`'s 31 exports async with `store` injected; one whole change as one `write`; `DraftStore` folded into the port and `PreviewFile` carrying bytes; site factory over both backends; unchanged CLI surface and `code/path/hint` envelopes | YES |
| REQ-144 (`request-7bef34e0`) | `free_and_reconciled` | 2026-08-15 | Build/deploy/smoke scripts | YES — no store surface |
| REQ-119 (`request-64864801`) | `free_and_reconciled` | 2026-07-31 | **Request-time draft and edit renders inside control-app** — the change that removed render-artifact staleness. *Not* a BUNDLE-19 source; its behaviour lives in CAP-85's tree (AC-1033). Relevant here only as the true owner of the claim in finding 1. | YES — but **not this capability's** |
| REQ-143 (`request-18a48d63`) | `ready_to_reconcile` | 2026-08-15 | The Cloudflare SiteStore (D1 + R2 adapter) | imminent — explicitly Out of scope per STORY-118; not enforced here |
| REQ-145 (`request-b474390f`) | `ready_to_reconcile` | 2026-08-15 | control-app becomes the builder | imminent — out of scope |
| REQ-146 (`request-0cdfdc5b`) | `ready_to_reconcile` | 2026-08-15 | The AI host moves into workerd | imminent — out of scope |
| REQ-148 (`request-7ae3c2cc`) | `ready_to_reconcile` | 2026-08-15 | Behavior modules render in workerd | imminent — out of scope |
| REQ-147 (`request-23fd6e61`) | `reconciling` | 2026-08-15 | Cloudflare Access on the builder | imminent — no store surface |
| REQ-149 (`request-554ac441`) | `draft` | 2026-08-17 | Cloud publish | NO |
| REQ-150 (`request-34dd9049`) | `free_coding` | 2026-08-18 | Vite SSR server for `1c` | NO |

**Level cascade honoured.** The story-level cycle passed at REPORT-2463
(`report-975eb8b5`), so STORY-118's body is the working reference throughout; intent was
consulted only to confirm that REQ-141/REQ-142 do not themselves call for the behaviour
in finding 1 (they do not — REQ-142 §7 "Preview assets" and §10 speak only of
`readAsset` returning bytes and `PreviewFile` carrying them, and say nothing about
freshness or restarts).

**Verification environment.** Unchanged and still load-bearing. This worktree's HEAD
(`2caa60b71`) predates BUNDLE-19's merge: `git ls-tree HEAD -- tools/generate/src/store/`
returns only `base/diff/fsutil/history/index/loadSite/paths/snapshot`, while `origin/main`
additionally holds `assemble.ts`, `fs-store.ts`, `journal-model.ts`, `journal.ts`,
`memory-store.ts`, `site-store.ts`. Every code citation below was read from `origin/main`
via `git show`, text mode forced where relevant (STORY-118's survey hazard — `builder.ts`
and `fidelity.ts` carry NUL separators).

## Alignment Ledger

Eleven ACs hang off STORY-118, all `status=active`, `kind=behavior`,
`regression_only=false`.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1321 `acceptance_criterion-d4cc3712` — totality + asynchrony | REQ-142 §5, §7, §10 | aligned — the ten enumerated questions plus `write` are exactly the port's verbs; the stamp clause ("a token that is equal if and only if the definition is unchanged") is the port's own contribution to preview freshness and is correctly housed here (see finding 1 and finding 3) |
| AC-1322 `acceptance_criterion-f713cba6` — bytes, not locations | REQ-142 §5, §7 | aligned |
| AC-1323 `acceptance_criterion-44c1d962` — one whole change | REQ-142 AC-5, §10 | aligned — and correctly a claim about the shape of the ask, not about atomicity, per STORY-118's first deliberate non-behaviour |
| AC-1324 `acceptance_criterion-31f6a0c5` — completes with no filesystem | REQ-142 AC-4, §8 | aligned — its "keeps its change count through the same arithmetic … validates through the same assembly path" is STORY-118's own sentence about the filesystem-free store, verbatim in substance |
| AC-1325 `acceptance_criterion-6a7b61e4` — both stores answer identically | REQ-142 AC-7, §8 | aligned — remains the correctly-scoped owner of the store axis |
| AC-1326 `acceptance_criterion-d08eae5f` — unchanged CLI surface + envelopes | REQ-142 AC-3, §7 | aligned |
| AC-1327 `acceptance_criterion-16093733` — preview from whichever store | REQ-142 §7 (Preview assets), §10 | **not aligned** — bullets 1–3 are exactly the port's business; bullet 4 restates CAP-85's freshness claim, which STORY-118's own Technical Context assigns away from this capability. See finding 1 |
| AC-1328 `acceptance_criterion-c8728ae8` — two runtimes, real bindings | REQ-141 AC-2/3/4, "Bindings mirror the deployed shape" | aligned — re-verified against both `*.workers.test.ts` files and the node-side routing probe |
| AC-1329 `acceptance_criterion-ae2c7f77` — the split cost nothing | REQ-141 AC-1, AC-5, §3 | aligned — REPORT-2468's violation is repaired and holds; the fourth bullet and the Verification are both scoped to behavioural assertions with the AC-1328 exemption |
| AC-1353 `acceptance_criterion-003caa07` — no filesystem in imports | REQ-142 AC-2, §7, §10 | aligned |
| AC-1354 `acceptance_criterion-56798f01` — start-up naming + tool adapter | REQ-142 §7 (Injection, Asset sources), §10 | aligned — the tool adapter's NOT_FOUND clause is REQ-142 §7's "raised at the call site with identical code/path/hint", and is a different entry point from AC-1326's CLI refusal, not a duplicate of it |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1327 (`acceptance_criterion-16093733`), 4th bullet + final Verification sentence | ac-edit | AC-1327's fourth bullet reads: "**A change made to the draft outside the builder is picked up on the next request, without the server being restarted.**" Its Verification closes: "**Mutate the draft through the editing surface and assert the next preview request reflects it without a restart.**" This is a freshness claim, and STORY-118's Technical Context assigns freshness away from this capability in terms: "**CAP-85's builder origin owns request confinement and freshness, not the store's shape**". CAP-85 already owns it as an active AC — **AC-1033** (`acceptance_criterion-ae33f0ab`, STORY-99 `story-e674c60a`, capability `capability-a994b8f3`): "A definition changed outside the workspace is shown on the next request, with no render step and no restart — and unwinds the same way", whose Verification is the same experiment ("Change the site's definition outside the workspace … request both draft-side channels again and assert the new value is present"). The behaviour is real but it is **not this capability's deliverable**: it was delivered by **REQ-119** (`request-64864801`, `free_and_reconciled`, 2026-07-31, "Request-time draft and edit renders inside control-app"), which is not among BUNDLE-19's nine source tickets, and `origin/main:tools/generate/src/cli/preview.ts:6` names it as such — "Request-time renders of the draft and edit channels (**REQ-119** / DOC-28 §12 T5) … Rendering on request removes that step and the staleness rule that came with it". Neither REQ-141 nor REQ-142 asks for it: REQ-142 §7 "Preview assets" and §10 change `DraftStore.asset()` to `readAsset(): Promise<Uint8Array \| null>` and make `PreviewFile` carry bytes, and say nothing about restarts or staleness. This is the same defect shape REPORT-2466 and REPORT-2468 caught twice on AC-1329 — an AC widened past the scoping its own story states — one capability over instead of one axis over. A uat cycle asked to implement this Verification would author a second, independent freshness UAT under this capability, duplicating CAP-85's AC-1033 evidence and giving the freshness model two homes to keep in step. | **Preserve bullets 1–3 and their Verification sentences verbatim** — they are exactly the port's business. Replace bullet 4 with the store-shaped property the port actually contributes, e.g.: "The preview re-asks the store on each request; its memoised render is invalidated by the store's own stamp rather than held, so what is served follows the definition the store currently holds." (This is real and citable: `origin/main:tools/generate/src/cli/preview.ts:79-86` — "memoised per `(slug, channel)` and invalidated by the store's stamp … the stamp is checked before the cache is read, not on a timer" — and `preview.ts:100` `await this.store.loadDraft(slug)` on every `file()` call. It does not collide with AC-1321, which owns the store *answering* with a stamp; this would own the preview *consuming* it.) Mirror that in the Verification's final sentence, replacing "assert the next preview request reflects it without a restart" with an assertion that a changed definition produces a changed stamp and a re-render rather than a cache hit. If the editor prefers the minimal action, plain deletion of bullet 4 and its Verification sentence is also correct and leaves **no** coverage gap: STORY-118's In-scope bullet "the builder's preview of a draft … driven through the store they were given" is fully carried by bullets 1–3 plus AC-1354's "the builder origin names it once per context, and its preview of a draft renders through that same one". **Do not resolve this by editing CAP-85's AC-1033** — it is the older, correctly-placed owner, and REQ-119 is its intent. |
| 2 | info | consistency | AC-1329 (`acceptance_criterion-ae2c7f77`) | — | **REPORT-2468 finding 1 is resolved, verified against the current ticket rather than against REPORT-2469's account.** Title is now "The split cost nothing the single runtime provided"; the fourth bullet reads "No *behavioural* assertion is conditioned on which runtime it runs in … The deliberate exception is everything AC-1328 owns — the probes that prove the routing itself happened (a file asserting which runtime it loaded in, whether by user agent, by a global only one runtime has, or by using a filesystem module at load time) and the real database and object-store bindings that exist only in the Workers runtime"; the Verification carries the matching exclusion. Checked against both `*.workers.test.ts` files on `origin/main` and against `tests/test_UAT_FC_REQ-141_project_routing.test.ts`: every runtime-conditioned assertion present is inside the exemption. Bullets 1–3, the demotion paragraph and the store-axis scoping paragraph are intact. | none |
| 3 | info | consistency | AC-1321 (`acceptance_criterion-d4cc3712`), journal-facing clauses | — | Considered and judged **in bounds**, recorded so a later pass does not reopen it. STORY-118 Out-of-scope hands "what a change record contains, what the counter means, and how a caller reads changes back" to CAP-99 (`capability-702b7c02`), whose AC-1253 / AC-1259 / AC-1262 / AC-1268 own precisely those semantics. AC-1321's three journal-facing clauses assert only the *shape and totality* of the answers the port hands back — that recording answers with a count and never raises, that reading-since answers with records, position and a truncation flag — which is the same-sentence grant "this story owns only that those questions are asked of the store like every other". They assert no record contents, no window policy and no actor/label fields. The distinction is thin but real and is the reason this is not finding 1's shape: AC-1321 is scoped to the port surface, whereas AC-1327's bullet 4 asserts an end-to-end operator-visible outcome another capability already proves. | none |
| 4 | info | exclusivity | AC-1324 vs AC-1325 | — | Carried forward from REPORT-2468 finding 3 and re-confirmed. Both enumerate the same body of editing assertions and one parameterized suite plausibly satisfies both; judged **not** duplication, because AC-1324's claim is completeness *in the absence of a filesystem* ("no filesystem site tree present at all", "the fixture used holds no filesystem handle of any kind") and AC-1325's is *indistinguishability between the two adapters* ("sharing its assertions rather than duplicating them", equality of the two assembled definitions). Recorded so a later pass does not read the shared enumeration as redundancy and delete one. | none |
| 5 | info | coverage | AC-1353, AC-1354 | — | Still no `test_UAT_AC1353_*` / `test_UAT_AC1354_*` on `origin/main`; the AC-named UATs there run AC-1321…AC-1329. Both AC texts are aligned, so this is a **uat-level** item, unchanged from REPORT-2466 finding 5 and REPORT-2468 finding 5. For AC-1353 the evidence exists under an intent name (`tests/test_UAT_FC_REQ-142_site_store_port.test.ts`); for AC-1354 the uat cycle will be authoring rather than renaming. | none at this level |
| 6 | info | — | worktree / evidence | — | This worktree cannot host or run the tests these ACs describe (HEAD `2caa60b71` predates BUNDLE-19's merge; the port modules are absent from `tools/generate/src/store/`). All code citations here were read from `origin/main`. Not drift; recorded so it is not rediscovered as one, and so the uat cycle expects the same constraint. | none |

## Notes for the Editor

**One violation, and this one is a cross-capability collision rather than a narrowing.**
Do not rewrite AC-1327. Bullets 1–3 (renders from the store with no filesystem tree;
an asset resolves to its bytes plus a content type derived from its name; an asset the
store does not hold resolves to nothing rather than to an error or an empty file) are
exactly the port's business and are supported by REQ-142 §7 and §10. Only the fourth
bullet and the Verification's final sentence need to change.

**Why deletion is safe and why re-scoping is better.** Deletion leaves no gap —
STORY-118's In-scope bullet about the preview is carried by AC-1327 bullets 1–3 and
AC-1354. But the port *did* contribute something to how the preview stays current: the
`DraftSnapshot.stamp` that arrived with REQ-142 is what invalidates the memoised render
(`origin/main:tools/generate/src/cli/preview.ts:79-86`, `:100`). Re-scoping bullet 4 onto
that — the preview re-asks the store and trusts its stamp — keeps a real property of this
capability while handing the operator-visible freshness outcome back to CAP-85's AC-1033.

**Do not resolve this by editing CAP-85.** AC-1033 (`acceptance_criterion-ae33f0ab`) is
older, active, correctly placed, and its intent (REQ-119, 2026-07-31) predates this
bundle by a fortnight. STORY-118's own Technical Context points at it. The over-broad AC
is the wrong element, not the sibling capability it collides with.

**The pattern worth naming, because this is now the third instance.** AC-1329 was twice
broadened past a scoping its own story states (the store axis, then the runtime axis);
AC-1327 carries the same shape across a capability boundary. In each case the AC is
*true* — nothing here is a false claim — and in each case the defect is that the claim's
proof belongs to a sibling that already carries it. When checking the remaining levels,
read each AC against STORY-118's "Relationship to existing capabilities" paragraph
(CAP-86, CAP-99, CAP-85, CAP-82) and its three "deliberate non-behaviours", not only
against the In-scope list. The In-scope list says what this capability covers; those two
paragraphs say what it must *not* restate, and that is where the remaining drift has been.

**Carried forward unchanged.** The stale rationale comment in `vitest.workers.config.mts`
still states REQ-141's retracted supply-chain diagnosis (REQ-141 carries the explicit
post-promotion CORRECTION; the actual cause was pnpm 11.9.0's incremental resolution
dropping optional dependencies). No AC encodes the pin or its rationale, which is correct
and deliberate per STORY-118's "Known divergence" paragraph — which must not be removed,
or a later reader will re-derive the retracted theory from the comment.
