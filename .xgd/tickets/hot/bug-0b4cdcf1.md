---
uid: bug-0b4cdcf1
id: BUG-261
type: bug
title: 'EditImage returns generator_unavailable on every call: can''t trace a subject
  out of a stored photo'
created_by: xgd
created_at: '2026-10-24T00:16:28.963844+00:00'
updated_at: '2026-10-24T03:11:20.237318+00:00'
completed_at: null
last_field_updated: status
status: wont_fix
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-a3a6541e
---

## What I was doing
Making a logo mark from a sculpture that appears in an uploaded photo. The plan was to call `EditImage` on the stored photo (a PNG library item, 1448×1086, role site, rights owned) with a change asking it to isolate one subject and turn it into a flat single-colour silhouette, with `aspect_ratio: "1:1"` and `transparency: true`.

## Expected
A new ticket with the edited image attached, which I could then screenshot, place with `place_on_site`, and use.

## What happened
I made three calls within about 10 seconds (00:13:05Z, 00:13:07Z and 00:13:14Z on 2026-10-24). Two used the same `change` prose and one used a variant. All three failed with:

```
EditImage failed (generator_unavailable). The image generator could not be reached, or would not answer. This may be a passing fault or a deployment one, so a single retry is reasonable and a third is not.
```

No ticket was created.

## Impact
No other tool can derive a shape from a photograph. `draw_image` is hand-plotted SVG, and `edit_image` only does crop, rotate, resize and adjust. So the fallback was a hand-drawn approximation, which the user rejected as misshapen. Any "make a mark from the thing in this photo" request is blocked while this fails. A related gap: there is no non-generative trace or vectorize operation, which would make this independent of the generator.

## To reproduce
1. `EditImage` with `image` = any stored PNG library item, any `change` prose, `aspect_ratio` "1:1", `transparency` true.
2. Observe `generator_unavailable`.

Not yet confirmed: whether `transparency: true` or `aspect_ratio` is the trigger, or whether `CreateImage` fails the same way.

I made a fourth call about 10 minutes after the first three, this time **without** `transparency` (only `aspect_ratio: "1:1"`, with a plain-white background asked for in the prose). It failed the same way with `generator_unavailable`, so `transparency: true` is not the trigger.

-

-

-