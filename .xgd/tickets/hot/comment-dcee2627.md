---
uid: comment-dcee2627
id: COMMENT-4887
type: comment
title: Comment on request REQ-265
created_by: xgd
created_at: '2026-10-04T15:54:51.075953+00:00'
updated_at: '2026-10-04T15:54:51.075953+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-47ab4ddc
  kind: note
---

`repro-console:repro-www-bluelotusintegralhealing-com#3` — iteration 3 re-measurement of the half-leading class on www.bluelotusintegralhealing.com.

Region #1 of `regions.json` (`bbox {32,2240,48,16}`, score 93.79, meanDiff 31.26) is
23.4% of the 401.17 ranked score. Both sides have the same lead, "Contact"
(`expected-manifest.json` / `actual-manifest.json` index 25). The line box matches
(ref `y 2241.29 h 20.8`, ours `y 2241.28 h 20.80`), and so do fontSizePx 16 /
lineHeightPx 20.8 / weight 900. `renderedTextBox.y` is **2242.19 on the reference and
2241.28 on ours**. That's a 0.91px difference, which equals the half-leading
(20.8 − 19) / 2 = 0.9. The glyphs are painted at the line-box top instead of half a
leading below it. 0 value deltas, because the run's box matches.

In L1 (`page.json` root child 16), `lineHeightPx` is 20.8 and `whiteSpace` is
`break-spaces`. The reference reports `whiteSpace: "break-spaces"` and ours reports
`null`. I didn't trace whether that is part of the mechanism.
