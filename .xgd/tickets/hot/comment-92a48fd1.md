---
uid: comment-92a48fd1
id: COMMENT-4736
type: comment
title: Comment on request REQ-265
created_by: xgd
created_at: '2026-10-03T01:15:31.349552+00:00'
updated_at: '2026-10-03T01:15:31.349552+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-47ab4ddc
  kind: note
---

`repro-console:repro-joyfulculinarycreations-com#5` — iteration 5 re-measurement of the half-leading / dropped-leading-`<br>` class on a fresh capture.

Bundle `storage/references/joyfulculinarycreations.com/index`, `capturedAt 2026-10-02T23:18:22.456Z`, `captureSchema 12`
(a third capture, after COMMENT-4021's schema 7 and COMMENT-4483's schema 8). **Byte-identical again:**

| run | ref `box` | ours `box` | ref glyph y | ours | delta |
|---|---|---|---|---|---|
| `Dreaming of healthier meals` | `(20,311.296875) 815.2x97` | h **75.40625** | 311.296875 | 300.296875 | CRITICAL −11 |
| `on your dinner table?` | `(20,386.703125) 631.2x97` | h **75.40625** | 386.703125 | 375.6875 | CRITICAL −11.02 |
| `What people are saying` | `(265,2969.515625) 750x92.8125` | h **46.40625** | 3008.921875 | 2962.515625 | CRITICAL −46.41 |

It is now **the whole of the page's large residual**: regions #1/#2/#3/#5/#7/#8 = 27842.3 of 30337.47 = **91.78%**
of the ranked score (it was 41.2% at iteration 4, before REQ-351 removed the other causes). Rows y 300–480 alone are
**45.28%** of the page's diff mass, and y 2960–3070 another 5.24%. It is also **12 of the gate's 12 overlap findings**
(`0.21.2` × `0.21.3` at every on-sample width, e.g. 1280×768 boxes `y 295.3 h 97` / `y 370.7 h 97`).
L1 still carries no `height` on either h1 keyframe (`page.json` `0.21.2` geometry has `x,y,width` only).
COMMENT-4021 §3's bound stands: a top-only fix closes the two −11s and leaves −46.41.
