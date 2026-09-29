---
uid: comment-0c893f95
id: COMMENT-4308
type: comment
title: Comment on request REQ-336
created_by: xgd
created_at: '2026-09-29T04:05:20.978203+00:00'
updated_at: '2026-09-29T04:05:20.978203+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-2635d442
  kind: note
---

repro-console:repro-faelan-com#4

Re-measured on this ticket's own bundle, `storage/references/faelan.com/index`,
iteration 4. **Both issues confirmed fixed end to end. Issue 3 is closed too.**

**Issue 1 — the dropped rotation.** The chain now carries through all four stages:

```
capture.json  sections[0].fields[*].transformRotateDeg   -5   3   -8   4
l1.json / page.json  image-{0,1,2,3}.transform.rotateDeg -5   3   -8   4
site/home.html  .l1-4…l1-7  transform: rotate(-5deg) / rotate(3deg) / rotate(-8deg) / rotate(4deg)
actual-manifest.json elements[5..8].transformRotateDeg   -5   3   -8   4
```

matching the four wrapper declarations in `assets/index.BM9-dqc-.css`
(`.photo-circle` -5, `.photo-torn` 3, `.photo-soft-1` -8, `.photo-soft-2` 4).
All four collage photographs are turned in `iteration-4/diff/actual.png`, and
`values-diff.json` reports **0** transform deltas where this ticket recorded 4
HIGH. The 12 ranked regions / 71051.80 score this ticket attributed to it are
gone: this round has 11 regions totalling 10203.76, none of which is a rotation.

**Issue 2 — the flattened translucent colours.** Both alphas survive now:
`capture.json` `sections[0].fields[0].borderColor` is `"#ffffff4d"` (not
`#ffffff`), and `sections[0].content[1..3].color` is `"#ffffffe6"` (not
`#ffffff`). Both manifests agree on both, and `values-diff.json` shows
`border: "4px solid #ffffff4d"` on the reference and reproduction sides of the
"Faelan" image object with `mismatch: false`.

**Issue 3 — `foldResiduals` empty while `capturedAxesOf` named `transformRotateDeg`.**
`./bin/1c refold --ref storage/references/faelan.com/index` now reports
`fold residuals: 0` with the rotation carried, so the count is honest rather than
silent — there is nothing left for it to report on this bundle.

**And the structural-failure verdict is still gone:** `./bin/1c l1-gate --ref
storage/references/faelan.com/index --json` returns `pass: true` with zero
findings at every sampled width, and `gate.json` for this iteration has
`l1Pass: true`, `layout.findings: []`.

The residuals this bundle still carries are a different class and are filed as
REQ-347 (the page's `z-index:20/15/5` is read off the leaf and lost, so the hero
`<h1>` paints under a collage photo; and `frameOf` attributes a wrapper's ring to
the `<img>`'s content box) with the ruler half as BUG-164.
