---
uid: comment-0ae35624
id: COMMENT-4840
type: comment
title: Comment on request REQ-324
created_by: xgd
created_at: '2026-10-03T19:24:15.425829+00:00'
updated_at: '2026-10-03T19:24:15.425829+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-96a62088
  kind: note
---

`repro-console:repro-www-hearingzone510-com#1` — iteration 1 re-measurement of issue 2 (a surface owning exactly one run keeps its pinned height) on a second bundle, after the fix landed.

Bundle `storage/references/www.hearingzone510.com/index` (captured 2026-10-03T18:26:44Z), site `repro-www-hearingzone510-com`. REQ-324's commits `a750b93` / `5059db1` are in HEAD.

**The fix runs, and is then not served.** `bin/1c l1-gate repro-www-hearingzone510-com --ref storage/references/www.hearingzone510.com/index --sandbox --json` → `recovery`:
`promoted` includes `0.4` (card-0), `0.5.2` (card-1), `0.13` (card-5) — exactly the single-run surfaces — but `served: false`, `servedFindings: 732`, `recoveredFindings: 870`, `fidelityResiduals: 516` (served document: 42). So `chooseRecovery` keeps the pinned document.

**What that leaves** (`1c page get … --json`): every single-run card pinned at every width with no `sizing` and a height-less run — card-1 heights `320:43 … 1280:52`, card-5 `320:48 … 1280:18.2`, card-0 `320:41.6 … 1280:23.4`, card-2 `50` everywhere, card-6 `56.3`. Gate `escape` findings on them: 'SCHEDULE AN APPOINTMENT' vs card-1 ×8 (e.g. 320×768: run 162.66×86 vs card 43 → "43px below its bottom edge"), '© 2026 Hearing Zone…' vs card-5 ×8, 'Learn to train…' vs card-0 ×2 — 18 of the round's 74 escapes; the rest are band backdrops/bands under the 2.5× perturbation.

**Cannot tell from here** whether the recovered document is genuinely worse or whether its 870 is inflated by two instrument defects filed this round: BUG-186 item 1 (all 42 on-sample overlaps on this page are pairs the reference makes identically) and item 2 (sampleFidelity's FIFO pairing of textless boxes is off by one — a recovery that reorders boxes would move that number a lot, plausibly the 42 → 516). To tell: diff the recovered vs served finding lists by kind/path with BUG-186's subtraction applied, and re-pair sampleFidelity geometrically.

Note also one of these cards is a self-surface (the `<a>` IS the button: `surface.self: true`), whose run is placed at the border-box top and not centred — REQ-370 issue 4; flowing it without that fix would trade escapes for position deltas, the same ordering hazard this ticket's own "fix order matters" paragraph describes.
