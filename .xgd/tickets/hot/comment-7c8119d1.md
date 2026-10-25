---
uid: comment-7c8119d1
id: COMMENT-4732
type: comment
title: Comment on request REQ-270
created_by: xgd
created_at: '2026-10-03T01:04:03.277096+00:00'
updated_at: '2026-10-03T01:04:03.277096+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-e2dfcce5
  kind: note
---

`repro-console:repro-faelan-com#6` — iteration 6 re-measurement of issue 3 (`repro-scrim-invisible-when-painted-as-a-background-image-gradient`), on a second bundle.

Seen on `storage/references/faelan.com/index`. It is the only `overlay` delta of this round's 5:

```json
{ "text": "§0", "role": "section", "property": "overlay", "expected": "#000000 @ 0.3", "actual": "none", "tier": "LOW", "severity": 1050 }
```

- **Reference:** `.montage-overlay{position:absolute;inset:0;background:#0000004d}` (mirrored `index.BM9-dqc-.css`), a separate scrim element, read by `overlayInBox` as `{"color":"#000000","opacity":0.3}`.
- **L1** (`iteration-6/page.json`): `section-bg-0.axes = {"backgroundImageUrl":"/assets/scorched-earth.jpeg","overlay":{"color":"#000000","opacity":0.3}}`. That is **correct**.
- **Render** (`iteration-6/site/index.html`): `background-image: linear-gradient(#0000004d, #0000004d), url(...)`. That is correct paint, which the pixels confirm: the gate reports 1 region on the whole page, and it is not over this band's scrim.
- **actual-manifest** `sections[0].overlay: null`. The repro-side extractor still does not read a gradient-layer scrim. Same mechanism, same false delta, now on a second bundle.

Still open as of this capture (2026-10-02T23:18:31Z). The one engine commit since (b830e3e80e, builder plan panel) does not touch it.
