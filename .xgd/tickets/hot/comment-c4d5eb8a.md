---
uid: comment-c4d5eb8a
id: COMMENT-2640
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-11T00:25:25.444157+00:00'
updated_at: '2026-09-11T00:25:25.444157+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-4a18649d
  kind: note
---

**REPORT-3821** (`report-4a18649d`) filed — `progress_made: true`, `needs_more_work: false`, `violations_remaining: 0`. Every actionable finding in report-6885f18e is now closed; the assessor can verify.

## This call — the two remaining warnings

**Finding 6 (AC-1050)** — both clauses the AC's own Verification names now run at the AC that claims them:

- *"a colour chosen there lands on that panel"* — the test pressed Escape where it should have picked. It now drives the row: asserts the palette is asked with `null` (the panel holds a hex literal, so nothing to pre-select), that the pick stages without committing, then Saves and asserts `surfaceFill` becomes the palette **reference** `{ref:'brand'}` — and that the panel next door, which also paints a fill, is untouched. That last one is what catches a row wired to the wrong address. This needed a fixture addition: the suite's site had no palette at all, so there was nothing to choose.
- *"a container that paints nothing is not offered as a region"* — anchored to `getElementById('root')` rather than to a selector miss, asserting it *is* rendered, carries neither edit attribute, and contains a region that *is* addressable. A bare "nothing matches `[data-l1-path="0"]`" would also pass on a page that never rendered.

**Finding 5 (AC-1040)** — the transparent-foreground backstop existed only under an intent-named suite. Added region `[0.9]` to the form-presentation fixture, **appended last so no existing address shifts**, and asserted the backstop inside `test_UAT_AC1040_…`: no `--preview-color`, no `--preview-text-image`, but family and weight still mirrored — so the box degraded because there was no paint, not because the dressing failed. It reaches the backstop by the transparent-colour route rather than the gradient one, which is what makes it a backstop. The BUG-34 copy stays, per Finding 8.

## Proven, not assumed

Three more mutation probes, each confirmed failing then reverted:

| Clause | Probe | Result |
|---|---|---|
| colour lands | drop `colors` from the staged-values merge | `'#101822'` vs `{ref:'brand'}` |
| unpainted container | `segmentKind` returns `'container'` by kind | root got stamped |
| AC-1040 backstop | `put('--preview-color', …)` unconditionally | `'rgba(0, 0, 0, 0)'` vs `''` |

All three production files diff clean against their backups. `git status` shows two modified test files and nothing else.

**150 tests pass** across the capability. Both fixture changes were swept for regressions and caused none.

One caveat I've repeated in the report because it governs whether any of this means anything: the webui store is unreachable from a worktree, and these suites *pass* when it's missing. Without the symlink they report ~10 trivially-passing tests. Every number above was produced with it in place; the chromium-gated clauses still print `NOT VERIFIED` as designed.

I left `uat_coverage` alone — AC-1039 still reads `fail`. That field belongs to `check_uat_coverage`, and setting it here would be manufacturing progress. A coverage check run with the symlink should now earn real stamps.
