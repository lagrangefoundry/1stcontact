---
uid: comment-db2f911b
id: COMMENT-7866
type: comment
title: Comment on bug BUG-358
created_by: xgd
created_at: '2026-11-05T21:05:11.419924+00:00'
updated_at: '2026-11-05T21:10:31.455768+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-5ac4b213
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "2a8a5b8c-9219-4a90-94bc-61f15d77d2e5",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="bcd6552a-9893-45e2-905e-d9d632887cd5-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T21:04:19.143520+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="bcd6552a-9893-45e2-905e-d9d632887cd5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T21:10:29.925013+00:00" -->
#### Claude
Reading the importer (`apps/control-app/src/site-import.ts`) to find where the picture type is decided.

Now making the edits in the worktree.

Now the UAT, which uses the REQ-474 rig.

All pass. Now confirming the UAT fails without the fix:

Red without the fix and green with it. Running the typecheck next:

Typecheck is clean. Before committing I'm checking how this project handles the version gate.

Following that order: lock, merge xgd-working into the branch, bump, commit, then merge back.

The merge was a fast-forward. Moving the ticket to free_coded:

BUG-358 is fixed. The commit (`c7ef6d56c8`, version 0.2.786) is on xgd-working, the ticket is at `free_coded`, and the branch has been cleaned up.

**Cause:** capture saves each `/_next/image?url=…` picture under the last part of its address. That gives names like `assets/image` and `image-1`, with no file extension. `import_from_site` worked out the file type from that name, got `application/octet-stream`, and filed the pictures as documents. The same name also caused a second problem: `site_material` treated two different photos of the same shape as one picture at two sizes, so it offered only one of them.

**Fix** (`apps/control-app/src/site-import.ts`):
- **Type comes from the file's contents.** An imported picture's type is read from its first bytes (PNG, JPEG, GIF, WebP, AVIF, SVG). The saved filename gets the matching extension, so a `.jpg` address that was actually served as WebP is stored as `.webp`. The name is only used when the contents don't identify a format.
- **Name comes from the real picture.** If an address's last part has no extension and its `url` or `src` setting points to a picture file, that file names the picture. So `site_material` now offers `meal-prep-spread.jpg`, and different photos stay separate. It works for any image-resizing service built this way, not just Next.js. The address the picture was fetched from is still what's recorded on the Library item.

**Testing:** the new test, `tests/test_UAT_FC_BUG-358_optimizer_pictures_import_as_images.workers.test.ts`, fails without the fix and passes with it. It covers two different same-shaped WebP photos served through `/_next/image`:
- Both are offered, under their real file names.
- Both import as images with type `image/webp` and a `.webp` filename.

The existing REQ-474 site-import tests still pass, and the control-app typecheck is clean.

**Still to do by hand:** the Library items already imported wrongly (DOC-2…DOC-9) are not repaired. They still carry their original addresses, so `site_material` will list those pictures as already in the Library. Delete those items, then run `import_from_site` again to bring them back in as images.

The ticket body has the final design and test plan. Moving it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->