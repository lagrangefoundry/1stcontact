---
uid: bug-f177bc6f
id: BUG-135
type: bug
title: the boot guard reports a working builder as failed, and breaks its layout
created_by: EPIC-16
created_at: '2026-09-21T23:17:11.874416+00:00'
updated_at: '2026-09-21T23:40:40.615852+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  epic_parent: epic-96d8aca6
  chat_comment: comment-bd86e73c
---

The deployed builder shows **"The builder did not start."** across the top of a builder
that started perfectly well, and the panel then breaks the layout underneath it so the
chat composer collapses to nothing. Found on the first production go-live (EPIC-16
§I21); cost roughly an hour of diagnosis that went through assets, staleness, import
maps, browser compatibility, storage and admission before the guard itself became a
suspect.

## What happens

`boot-guard.ts` runs a timer. At `BOOT_DEADLINE_MS = 4000` it checks whether `#app` is
still empty, and if so writes an error panel into it.

In production the mount takes longer than four seconds. That is not a fault: the chat
composer's engine is four cross-origin dynamic imports —
`https://esm.sh/@tiptap/core@2` and `starter-kit@2` (`webui-markdown/src/editor.js`),
`dompurify@3` (`webui-chat/src/sanitize.js`), `marked@9` (`webui-markdown/src/marked.js`)
— on top of every module fetch passing through Cloudflare Access. Localhost pays none
of that, which is why four seconds was ever enough.

So the guard fires, writes its panel into `#app`, and the shell then mounts alongside
it. The operator sees a working builder with a failure notice nailed to the top of it,
and — because the panel is now an unclassed `div` as first child of the mount point,
ahead of everything the shell laid out — **the chat composer renders with no input at
all**. Removing that one element by hand restores it.

## Why the existing guarantee does not cover this

`boot-guard.ts` states:

> IT NEVER HIDES A WORKING BUILDER. Every path checks that `#app` is still empty
> immediately before writing, so a slow-but-successful mount is never replaced by an
> error panel it raced.

Both `stillEmpty()` checks guard one direction: the guard must not overwrite a builder
that mounted first. Neither covers the builder mounting **second**, and once the panel
is written there is nothing that removes it. The documented promise is half a promise,
and the missing half is the case that actually occurs.

## What it should do

**Raising the deadline is not on its own a fix.** It re-tunes a race against a network
whose latency is not ours to predict — a slow morning puts it back — and it leaves the
layout corruption in place for whenever it does fire. A larger number is worth having
as part of the change, not as the change.

Three things, and the first two are independent of the third:

1. **Render outside `#app`.** The guard must not put anything inside the element the
   application mounts into. A fixed-position overlay on `document.body` cannot corrupt
   a layout whatever else is wrong, and costs nothing. This alone removes the
   invisible-chat-composer failure.
2. **Retract on arrival.** After writing, watch `#app`; if the builder mounts, take the
   panel down. The docstring's promise then holds in both directions instead of one.
3. **Distinguish "has not started" from "has not started YET".** A deadline cannot, and
   that is the whole defect — the guard reported a failure because it had no way to
   describe slowness. If `main.js` records that its module body began executing, the
   guard can tell a module graph that never ran from one that is merely taking its
   time, and say the true thing in each case. A slow mount reported as slow is useful;
   reported as broken it is worse than silence, because it sends the reader looking for
   a fault that is not there.

Keep everything the guard is good at. Its named causes (`hintFor`) are genuinely
useful, it is right to be inline ES5 with no imports, and it is right that a blank page
with the reason only in devtools was worth fixing. The defect is that it treats a clock
as evidence.

## Done looks like

A production builder that is slow to mount shows either nothing or an honest "still
loading", never a failure notice; whatever the guard does show cannot affect the
builder's layout; and if the builder arrives after the guard has spoken, the guard
withdraws.