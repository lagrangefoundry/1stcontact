---
uid: comment-5811e2cc
id: COMMENT-3955
type: comment
title: Comment on request REQ-302
created_by: xgd
created_at: '2026-09-26T18:58:34.924410+00:00'
updated_at: '2026-09-26T18:58:34.924410+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-edbc7e5f
  kind: note
---

`repro-console:repro-faelan-com#1` — iteration 1 re-measurement of this ticket's
**issue 4** (the hero scrim landing on `surfaceFill` with its alpha dropped on
one side and composited on the other) on a second reference bundle.

Seen again, unchanged, on `storage/references/faelan.com/index` (captured
`2026-09-26T18:29:48.415Z`, `captureSchema: 6`; nothing has landed in the engine
since). This is the second bundle and the third observation of the class — after
this ticket and REQ-308's re-measurement — and the mechanism is now arithmetic
rather than inference.

```
REF=/Users/martin/lagrangefoundry/1stcontact/storage/references/faelan.com/index
ITER=/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-faelan-com/iteration-1
```

**The deltas** — 4 of this round's 20, `$ITER/diff/values-diff.json`, one per hero
run, all identical:

```json
{"text":"FAELAN","role":"heading","property":"surfaceFill","expected":"#000000","actual":"#0b101e","kind":"color","tier":"LOW","magnitude":0.17845491226345167,"severity":1060.1514312600393}
{"text":"Artist •","role":"body","property":"surfaceFill","expected":"#000000","actual":"#0b101e",…}
{"text":"Musician","role":"link","property":"surfaceFill","expected":"#000000","actual":"#0b101e",…}
{"text":"• Creator","role":"body","property":"surfaceFill","expected":"#000000","actual":"#0b101e",…}
```

**The arithmetic.** `$REF/capture.json` `/sections/0/background` is
`{"kind":"image","image":"assets/scorched-earth.jpeg","overlay":{"color":"#000000","opacity":0.3}}`
and `sections[0].surfaceFill` is `null` on **both** sides
(`$ITER/diff/expected-manifest.json`, `actual-manifest.json`). `bodyBackground`
is `#0f172b` on both sides. So:

- reference side: the scrim's declared colour with the alpha discarded →
  `#000000`;
- our side: the scrim composited over an opaque body →
  `0.7 × (15, 23, 43) = (10.5, 16.1, 30.1)` → `(11, 16, 30)` = **`#0b101e`**,
  which is the reported value.

**The render is correct**, so this is the probe and not the renderer:
`$ITER/site/home.html` `.l1-2` emits
`background-image: linear-gradient(#0000004d, #0000004d), url("assets/scorched-earth.jpeg")`
— `#4d` is 0.30 — over `background-size: cover; background-position: center`. The
L1 carries `axes.overlay = {"color":"#000000","opacity":0.3}` verbatim
(`$ITER/page.json`, `section-bg-0`), matching the capture exactly.

**One difference from REQ-308's re-measurement:** there the four runs' pixels
agreed to 0.74/255, which isolated the delta as false. Here the pixels under
these four runs cannot be isolated — region 1 `(0,32) 1280×784` covers the whole
hero and is dominated by a 16px displacement (REQ-331 / REQ-265, filed and
appended this round), so this round can only confirm the value-level mechanism,
not re-confirm that no pixel differs. The mechanism is identical and the numbers
above are exact.

Not re-filed. This round's own gap ticket is REQ-331; its issue list cites this
ticket for these four deltas rather than repeating them.
