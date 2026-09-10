---
uid: comment-f6afdcd3
id: COMMENT-2544
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T14:37:54.113897+00:00'
updated_at: '2026-09-10T14:37:54.113897+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-fd81bfc6
  kind: note
---

**REPORT-3745 (`report-fd81bfc6`) — FAIL: 3 violations, 4 warnings, 0 needs_review.**

## What changed since the last ac-level cycle

The tree moved a lot. Five ACs were authored under STORY-84 (AC-1625 responsive tracks, AC-1626 per-side padding, AC-1627 viewport-height response, AC-1628 `1c repro` materialization, AC-1629 band scrim), AC-691 gained the varying-axis carve-out, and AC-731 was rewritten with the self-painting-run discrimination and captured-surface-rect card geometry. That closes REPORT-2091's findings 3, 4, 5, 6, info 11 and finding 2(a) — all re-verified against live source in this worktree, not taken on the fix report's word.

## What still fails

**Violation 1 — STORY-86 has no AC for pinned-box content overflow (fifth raise).** The story body names three envelope violations; `probes.ts:405-416` pushes the `content height … exceeds pinned box height` clip and `evaluateLayout`'s docstring names all three. Every AC that enumerates violations (AC-706, AC-707, AC-710, AC-734, AC-736) names only overlap and viewport clip. Zero AC bodies match "overflow"/"content height" outside AC-734's title.

**Violation 2 — STORY-84 has no AC for the derived nowrap threshold (new).** The story body devotes a bolded section to it and lists it In-scope; `nowrapThreshold()`/`lineCountOf()` (`fold.ts:215-240`) ship all three stated rules onto `axes.nowrapFromPx` (`schema.ts:983`). Searching all 23 STORY-84 AC bodies for "nowrap"/"wrap"/"single line" returns one hit — the word "wrapper" in AC-812. AC-1010 under CAP-70 correctly owns only the renderer's side.

**Violation 3 — AC-731 and AC-812 give two different page-base rules.** AC-731 still says "the greatest **number of runs**"; `fold.ts:2105-2130` picks the fill with the greatest total band height across bands *and* backdrops, with run-count only as `if (!band)` fallback. AC-812 already states the shipped rule. I escalated to implementation here because the story body is internally inconsistent on exactly this point (its surfaces bullet vs its backdrop bullet), which is the cascade's stated condition for consulting the tier below.

**Warnings:** AC-710's text-only residual wording vs AC-705's "or kind label" (4th raise); AC-705/AC-710 duplicated report shape (4th raise); AC-729/AC-733 both specifying the source-less-media residual (3rd raise); BUG-19's full-bleed bar rule unexpressed — filed as a warning, not a violation, because the story body doesn't carry it either.

Findings 1 and 2 are the two repairs that need no judgement call and no story-body edit. Finding 3 does need a companion story-body edit, and I flagged that leaving it implicit is what carried it through four cycles.
