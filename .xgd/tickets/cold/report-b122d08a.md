---
uid: report-b122d08a
id: REPORT-1059
type: report
title: 'Resync resolve conflicts: f5f29fb9f01dfd222dd5a744af7374b1e371be99'
created_by: xgd
created_at: '2026-07-29T06:10:19.117716+00:00'
updated_at: '2026-07-29T06:10:19.117716+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `packages/framework/src/l1/render.ts` — class **UU**, code file (rule 2c: UU on
  implementation code, incoming authoritative). Resolved by **integration**, not by
  taking a side: the two sides changed the same lines for orthogonal reasons and are
  not mutually exclusive.
  - **Ours** (reconcile, `bundle-cceaba25`) had refactored the CSS `url()` emission
    into the hardened `cssUrl()` sink (render.ts:88) — it adds an independent
    `CSS_URL_ALLOWED` character allowlist on top of `isSafeUrl`. Its docstring states
    explicitly that `escapeHtml` must never be used for a CSS url: escapeHtml leaves
    newlines untouched, a newline terminates a CSS string, and the following `}` then
    closes the rule so the remainder becomes live CSS (DOC-2 §2).
  - **Theirs** (`f2e5686e0`, free-coded BUG-13) still carried the older inline
    `url("${escapeHtml(...)}")` form, but introduced a `hasBgImageUrl` flag in order to
    also emit `background-size: cover; background-position: center;
    background-repeat: no-repeat`.
  - **Resolution**: kept ours' `cssUrl()` sink (the weaker `escapeHtml`-based sanitiser
    is NOT reintroduced) and re-expressed theirs' new BUG-13 behaviour in terms of it,
    gating the cover-sizing on `bgUrl` instead of `hasBgImageUrl`.

    ```ts
    const bgUrl = cssUrl(a.backgroundImageUrl)
    if (bgUrl) bgLayers.push(bgUrl)
    if (bgLayers.length) base.push(`background-image: ${bgLayers.join(', ')}`)
    // BUG-13 — a section/band background image fills its box (cover, centered, …)
    if (bgUrl) base.push('background-size: cover', 'background-position: center', 'background-repeat: no-repeat')
    ```

Auto-merged without conflict (staged as part of the same pick): `tools/generate/src/l1/fold.ts`,
`tools/generate/src/cli/capture/values-diff.ts`, `tests/bug13-fold-section-background.test.ts` (new).

### Note on the enrichment rule

The auto-enriched metadata proposed "take the more recent commit by timestamp and flag
for post-merge review" (ours 2026-07-28 23:05:34 -0700 vs theirs 2026-07-23 20:55:13 -0700,
i.e. ours). Taking ours wholesale would have **dropped** the incoming BUG-13 behaviour
entirely, which rule 2c forbids. Integrating preserves both sides, so the timestamp
tie-break was not needed. Flagged for post-merge review as the enrichment requested.

## Incoming changes preserved

Verified against `git show f2e5686e0 -- packages/framework/src/l1/render.ts`:

- The incoming behavioural change — `background-size: cover`, `background-position: center`,
  `background-repeat: no-repeat` emitted for a box carrying a real background image URL —
  **is present** (render.ts:477-480), including the BUG-13 rationale comment verbatim.
- The gate is `bgUrl` (non-null only when the URL passes both `isSafeUrl` and
  `CSS_URL_ALLOWED`), a strictly narrower predicate than the incoming `hasBgImageUrl`
  (`isSafeUrl` only). The cover-sizing therefore fires exactly when a real image layer is
  actually painted, and never for a solid/gradient/scrim-only box. No incoming behaviour is
  lost; the only delta is that a URL which passes the scheme check but contains characters
  that could break out of the CSS string is now dropped rather than emitted.
- The incoming UATs assert both the `url("…")` layer and `background-size: cover` in the
  emitted CSS (`tests/bug13-fold-section-background.test.ts:134-135`) and pass.
- No conflict markers remain; no test function was deleted.

## Verification

- `pnpm -r build` — clean across all 7 workspace projects (typecheck included).
- `npx vitest run` — **100 files / 681 tests passed**, including the 9 new
  `test_UAT_FC_BUG-13_*` UATs.

## Staging state

`git status --porcelain` shows no conflict classes; 4 paths staged (M/M/M/A).
`CHERRY_PICK_HEAD` = `f2e5686e0994a7ab2a1b998e8c86f9a9404b175e`, still present and
untouched — the cherry-pick remains paused for the next workflow step to continue.

## Process deviation (disclosed)

This session was invoked as stage_resolver **after** an earlier turn in the same session had
already resolved this conflict and run `git cherry-pick --continue`, producing commit
`2d88d9a61`. That turn predated these instructions, which reserve `--continue` for the next
workflow step. On receiving the mission the state was restored rather than papered over:
`git reset --hard b8d9c34c8` (the pre-pick tip) followed by `git cherry-pick f2e5686e0`,
which reproduced the identical conflict; the resolution was then re-applied and staged only.
The tree, the staged content, and `CHERRY_PICK_HEAD` now match the state the next step
expects. No `--continue`/`--skip`/`--quit`/`--abort` has been run since.
