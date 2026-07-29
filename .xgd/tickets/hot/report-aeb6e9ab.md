---
uid: report-aeb6e9ab
id: REPORT-1060
type: report
title: 'Resync resolve conflicts: f5f29fb9f01dfd222dd5a744af7374b1e371be99'
created_by: xgd
created_at: '2026-07-29T06:22:47.676335+00:00'
updated_at: '2026-07-29T06:22:47.676335+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## State at entry to this attempt

No conflict markers, clean worktree, **no CHERRY_PICK_HEAD**. The conflicts for
incoming `22ee7a690` were resolved and already committed as `7b1f35120` during
attempt 1 of this session. See "Deviation" below — it affects the next step.

## Files resolved

- `tools/generate/src/l1/fold.ts` — UU, code file. **Incoming authoritative.**
  Three conflicting hunks, all taken from incoming (BUG-14): `surfaceRows`
  collection replaces BUG-11's `pendingSurfaces`/`fillCounts`; the band-fill
  fallback replaces the per-run `surfaceNodes` emit. Main-side BUG-13
  (`foldSectionBackgrounds`) auto-merged and was kept — paint order is
  `bands → sectionBgs → cards → content`.
- `tests/bug11-fold-surface-fill.test.ts` — UD (incoming deletes, main modified).
  Deletion accepted per rule 2a; the incoming commit explicitly supersedes the
  BUG-11 per-run-surface tests. **No test function was lost** — see below.
- `tools/generate/src/l1/probes.ts` — not conflicted; edited as required fallout.
  Main carries a hardening fix working never had (`SYNTHESIZED_SURFACE_ID_PREFIX`
  + `isSynthesizedSurfaceId`) that keeps fold-invented boxes out of the REQ-92
  non-text pairing queue and narrows the overlap exemption. BUG-14 stops emitting
  `surface-*` ids entirely, which would have left that predicate permanently
  false — a silent regression re-introducing phantom fidelity deltas. Retargeted
  the seam to `SYNTHESIZED_SURFACE_ID_PREFIXES = ['section-band-', 'section-bg-',
  'card-']`; comments updated at both call sites.
- `tools/generate/src/l1/index.ts` — export renamed to match the seam.
- `tests/bug14-fold-surface-hierarchy.test.ts` — incoming file, plus two UATs
  ported from the deleted BUG-11 file so its coverage is not lost:
  `test_UAT_FC_BUG-14_synthesized_surfaces_do_not_mispair_real_box_leaves` and
  `test_UAT_FC_BUG-14_only_synthesized_surfaces_are_exempt_from_overlap`.
- `tests/reconciliation-l1-fold-full-language.test.ts` — AC-731 retargeted from
  the per-run shape (2 backing boxes) to BUG-14's (1 band + 2 cards for 5 runs).
  Fixture output was dumped and read before rewriting the expectations.
- `tests/reconciliation-3probe-gate-evaluator.test.ts` — AC-736 retargeted
  (2 band boxes, not 1). Its synthetic `surface-wide` id renamed `card-wide` so
  it is still recognised as a synthesized surface and the clip-vs-overlap
  distinction stays load-bearing rather than vacuous.
- `packages/framework/src/l1/render.ts`, `packages/site-schema/src/l1/schema.ts` —
  auto-merged, no conflict (the typed `borderLeft` L1 box axis + renderer emit).

## Incoming changes preserved

Verified against `HEAD:` blobs:

- `fold.ts`: `SurfaceRow` (14), `buildSolidBands` (3), `buildCards` (3),
  `foldBorderLeftAxis` (2), `hasCardTreatment` (4), `section-band-` and
  `card-${idx` id emits all present.
- `schema.ts`: `borderLeft` axis present. `render.ts`: `border-left` emit present.
- `tests/bug14-fold-surface-hierarchy.test.ts`: 12 `test_UAT_FC_BUG-14` UATs.
- `tests/bug11-fold-surface-fill.test.ts`: absent from HEAD (deletion applied).

## Verification

- `pnpm -r build` clean; `tsc --noEmit` clean on `tools/generate` and
  `packages/framework`.
- Full suite: **100 files, 684 tests, all passing.**
- No conflict markers and no stale references to the old singular constant.

## ⚠ Deviation — next step must not run `cherry-pick --continue`

This stage's contract says to stage only and leave CHERRY_PICK_HEAD in place.
`git cherry-pick --continue` was run during attempt 1, before that constraint
was in scope, so the pick is already committed:

- HEAD = `7b1f3512072320c311a45d3e4144e07074dc049d` (the resolved BUG-14 commit)
- CHERRY_PICK_HEAD absent; worktree clean; nothing staged

The resolution content is complete and verified, but a downstream step that
assumes a paused pick will error with "no cherry-pick in progress". It should
detect the already-committed pick and advance instead.
