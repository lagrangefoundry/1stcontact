---
uid: report-5769ecf8
id: REPORT-2471
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (ac) — attempt 4'
created_by: xgd
created_at: '2026-08-20T16:26:16.970496+00:00'
updated_at: '2026-08-20T16:26:16.970496+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-c4c7a854
  level: ac
  fixes_applied: 1
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Site Storage Port: One Async Store Behind Every Edit (ac)

**Attempt**: 4
**Fixes applied this call**: 1
**Violations remaining**: 0
**Needs more work**: false

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-1327 (`acceptance_criterion-16093733`) | Bullets 1–3 and their three Verification sentences preserved verbatim. Bullet 4's freshness claim ("A change made to the draft outside the builder is picked up on the next request, without the server being restarted") replaced with the store-shaped property the port actually contributes; the Verification's final sentence rewritten to match. Added a scoping paragraph handing the operator-visible freshness outcome back to CAP-85's AC-1033 by name. |

### Detail on finding 1 (the only violation)

Took the report's preferred resolution (re-scope) over the minimal one (delete), because the
port *did* contribute something real to how the preview stays current, and re-scoping keeps that
property under this capability rather than dropping it.

New bullet 4:

> The preview re-asks the store on each request; its memoised render is invalidated by the
> store's own stamp rather than held, so what is served follows the definition the store
> currently holds.

New final Verification sentence:

> Change the definition the store holds and assert the store answers with a different stamp and
> the next request re-renders rather than serving the cached entry — asserting the
> cache-invalidation path, not the end-to-end freshness outcome AC-1033 proves.

Plus an explicit hand-off paragraph naming CAP-85, AC-1033 (`acceptance_criterion-ae33f0ab`) and
REQ-119 (`request-64864801`), and quoting STORY-118's Technical Context sentence that states the
division ("CAP-85's builder origin owns request confinement and freshness, not the store's
shape"). The word "restart" still appears in AC-1327 — only inside that paragraph, where it is
explicitly disclaimed as *not* this capability's claim.

**Citations re-verified from `origin/main` before editing** (this worktree's HEAD predates
BUNDLE-19's merge, per report finding 6):
- `tools/generate/src/cli/preview.ts:79-86` — "memoised per `(slug, channel)` and invalidated by
  the store's stamp … the stamp is checked before the cache is read, not on a timer".
- `tools/generate/src/cli/preview.ts:100` — `await this.store.loadDraft(slug)` on every `file()`
  call, i.e. the store is re-asked per request.
- `tools/generate/src/cli/preview.ts:6` — the header naming REQ-119 / DOC-28 §12 T5 as the owner
  of request-time rendering and of removing "the staleness rule that came with it".

**Not done, per the report's explicit instruction:** CAP-85's AC-1033 was not touched. It is the
older, correctly-placed owner and REQ-119 is its intent.

**No collision introduced with AC-1321.** AC-1321 owns the store *answering* with a stamp ("a
token that is equal if and only if the definition is unchanged"); the new AC-1327 bullet owns the
preview *consuming* it. Different sides of the same seam, as the report notes.

## Sweep for the pattern the report named

The report asked that the remaining ACs be read against STORY-118's "Relationship to existing
capabilities" paragraph and its three "deliberate non-behaviours", not only against the In-scope
list — this being the third instance of an AC broadened past its own story's scoping. I read all
eleven AC bodies in full this call and checked each against those two paragraphs:

- **AC-1323** — explicitly self-limits to "the shape of the ask rather than … the result", so it
  does not trip the "filesystem store is not atomic" non-behaviour. Clean.
- **AC-1321** — its "every file added against no base revision" clause matches the "filesystem-free
  store is not a revision store" non-behaviour rather than contradicting it. Clean (and report
  finding 3 already ruled its journal-facing clauses in bounds).
- **AC-1322 / AC-1327** — assert asset *bytes*, consistent with the "preview trades streaming for
  buffering" non-behaviour. Clean.
- **AC-1322 / AC-1327 / AC-1354** — none restates asset-name confinement, so the "carried, not
  introduced" non-behaviour (CAP-85's rule) is respected. Clean.
- **AC-1329 / AC-1328** — re-read; the runtime-axis exemption and the store-axis scoping paragraph
  are both present and correctly worded, matching report finding 2. Clean.
- **AC-1324 / AC-1325 / AC-1326 / AC-1353** — no claim whose proof belongs to CAP-86, CAP-99,
  CAP-85 or CAP-82. Clean.

No further instances of the pattern found. AC-1327 was the last one.

## Code Edits (if any)

None this call. No test edits either: findings 2, 3, 4 and 6 are informational with "none"
resolution, and finding 5 (no `test_UAT_AC1353_*` / `test_UAT_AC1354_*` on `origin/main`) is
marked "none at this level" — it is a uat-level item, and this worktree cannot host or run those
tests anyway (finding 6: HEAD `2caa60b71` predates BUNDLE-19's merge; the port modules are absent
from `tools/generate/src/store/`).

## Carried forward for the uat cycle

- AC-1327's new Verification changes what its UAT must assert: a stamp-change-drives-re-render
  assertion against the `PreviewRenderer` cache, not a no-restart freshness experiment. Any
  existing AC-1327 UAT written to the old fourth bullet will need re-pointing, and must not
  duplicate CAP-85's AC-1033 evidence.
- Finding 5 stands unchanged: AC-1353's evidence exists under an intent name
  (`tests/test_UAT_FC_REQ-142_site_store_port.test.ts`) and needs renaming; AC-1354's needs
  authoring.
- Report's standing caution, untouched by this call: STORY-118's "Known divergence" paragraph
  about the stale `vitest.workers.config.mts` rationale comment must not be removed.

## needs_review Items Forwarded

None. The single violation was categorized `ac-edit` and has been applied.
