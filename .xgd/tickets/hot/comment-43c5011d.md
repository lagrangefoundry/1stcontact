---
uid: comment-43c5011d
id: COMMENT-5462
type: comment
title: Comment on bug BUG-213
created_by: xgd
created_at: '2026-10-17T22:47:10.033443+00:00'
updated_at: '2026-10-17T22:54:22.208796+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-b0bdc50d
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "1ed8689f-44ed-428b-a2b8-298c2b8f7930",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="4ec86006-82f2-4cb2-ae3f-cd62b45001f0-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T22:45:13.410095+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="4ec86006-82f2-4cb2-ae3f-cd62b45001f0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-17T22:51:52.944644+00:00" -->
#### Claude
I'm following `as` into `promoteToSiteAsset`, which is where the name gets decided.

Root cause found. Now checking how placements are recorded and how `edit_image` re-promotes, since that decides what a fix has to look like.

I've traced the root cause. No code has changed and the ticket is untouched. The fix needs a decision from you, because one claim in the EPIC-19 note doesn't hold up.

## Root cause

`as` is passed all the way down correctly. `place_on_site` hands it to `library.place`, which passes it to `promoteToSiteAsset` as `args.name`. The function then ignores it once the item is already on the site:

```ts
// apps/control-app/src/material.ts:886
const recorded = placedAs(ticket.fields).find((placed) => placed.slug === args.slug)
...
const name = recorded ? recorded.name : await freeAssetName(sites, args.slug, args.name)
```

This is the REQ-229 "which door" rule. If the Library item already has a recorded name on this site, the call is treated as a re-placement: new bytes go to that recorded name and the requested name is thrown away. That rule exists so that dragging the logo a second time, or the automatic re-placement after a crop, replaces `logo.png` instead of creating `logo-2.png`. It was never meant to apply when the caller explicitly asks for a different name. That is why all 6 calls came back as `Bob-s-Salon_-Hair-Heart-Community.png`.

The data model also only holds one placement per item per site. `recordPlacement` (`material.ts:1100`) replaces that site's entry in `placed_as` rather than adding to it.

## Fixing `as` alone won't unblock the montage

The EPIC note says "(1) alone is enough to unblock a montage". With the current code, that isn't true:

1. **A site copy can't be cropped on its own.** `edit_image` can only store a crop on a Library item. For a site file it refuses with `NOT_EDITABLE` and says to edit the Library item instead (`image-core.ts:166-182`).
2. **Cropping the Library item overwrites every copy.** Saving a crop calls `republishMaterial` (`material.ts:1017`), which writes the newly cropped image over every name recorded in `placed_as`. If `as` produced 6 recorded copies, any later crop would make all 6 the same. If the copies were not recorded, they would lose the "stays adjustable through the Library item" promise and the "used on this site" marker.
3. **The parallel batch would race even after a fix.** `recordPlacement` reads, edits and writes `placed_as`, so 6 simultaneous calls can drop each other's entries.

The only way 6 crops come out of the fix to (1) alone is a fragile sequence: crop, place as A, re-crop, place as B, and so on, with A–E not recorded so the next crop doesn't overwrite them. That's a workaround, not a fix.

## Options

- **A. Just fix the bug.** An explicit `as` that differs from the recorded name always creates a new copy (a free name, renamed if taken). It is either not recorded in `placed_as`, or recorded but skipped when a crop is re-applied. The tool's promise is then kept, but per-copy crops still don't work.
- **B. Store the crop per placement.** `placed_as` entries become `{slug, name, edits?}`. `as` adds an entry, `edit_image` accepts a placed site name and stores that copy's own crop, and re-applying a crop renders each copy with its own crop (or the item's crop when it has none). This makes the montage work. It's essentially the design question in the note, and bigger: a schema change, plus `edit_image` resolution and the republish loop.
- **C. Put the crop on the picture element (L1).** This is cleaner in principle, but a new kind of value has to go through the L1 schema, the security policy and the renderer. It's out of scope for a bug ticket.

My recommendation is **B**, with A's behaviour as part of it: `as` gives a new copy, and that copy carries its own crop. A on its own closes the ticket but leaves the montage blocked, which is what the reporter actually hit. B is still one intent, "one Library item, several framed placements", so it can stay on BUG-213 (about 5 points). Point 3 needs fixing either way: write the placement as one atomic append, or retry when it conflicts.

How do you want to scope it: A only, or B?

<!-- xgd-turn id="6f2181d1-91cd-405c-bd26-574b23ca31fe-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T22:54:15.950371+00:00" -->
#### You
**A site copy can't be cropped on its own.** `edit_image` can only store a crop on a Library item. For a site file it refuses with `NOT_EDITABLE` and says to edit the Library item instead (`image-core.ts:166-182`). <-- that's nonsense of course we need to edit site files!

Go with your recommendation

<!-- xgd-chat-end -->