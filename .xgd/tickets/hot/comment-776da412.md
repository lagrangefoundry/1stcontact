---
uid: comment-776da412
id: COMMENT-4897
type: comment
title: Comment on request REQ-383
created_by: xgd
created_at: '2026-10-04T17:19:39.646166+00:00'
updated_at: '2026-10-04T17:19:39.646166+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-47824940
  kind: note
---

`repro-console:repro-joyfulculinarycreations-com#9` — iteration 9 re-measurement of REQ-383 issue 1 (carried bands own their runs) on joyfulculinarycreations.com, HEAD fold.

The console gated the fold from 08:42, before c5c06e0060 (09:44). I refolded a **copy** of `storage/references/joyfulculinarycreations.com/index` on HEAD 892f14aa37 (`cp -R … /tmp/jcc9-bundle && ./bin/1c refold --ref /tmp/jcc9-bundle && ./bin/1c l1-gate --ref /tmp/jcc9-bundle --json`):

- **Landed:** `backdrop-8` (#7a7a7a) is now a container that owns its runs (root child `0.49`, runs `0.49.17`, `0.49.20`, …).
- **New regression on this bundle:** its identical twin `backdrop-9` (same fill, same keyframes, x 0 / width = w at all six widths) is now nested as `0.49.0` under `backdrop-8`. The off-sample probe now flags it at every off-sample width ≤1195 and at 1920, at both heights (18 escapes the served fold did not have). Examples: "backing surface backdrop-9 was full-bleed at every captured width and stops 18px short of the viewport's right edge" at 338, and "… stops 480px short" at 1920. `backdrop-8` itself, with the same keyframes at top level, is not flagged. So a full-bleed box keeps its full-bleed treatment at top level and loses it once nested. I cannot tell from the JSON whether the renderer or only the probe's model drops it (that needs a browser render at 1920).
- **Not closed:** content-robustness escapes are 92 on both the served fold and HEAD, with the same per-width counts (11/11/9/9/1/1/7/7/9/9/9/9). Recovery is still not served: `servedFindings 892`, `recoveredFindings` 1642 → 1205, `fidelityMaxDeltaPx` 14.61 → 80.02, `fidelityResiduals` 35 → 215.

The fold-side gap from this round is filed as REQ-385 and the instrument side as BUG-201.
