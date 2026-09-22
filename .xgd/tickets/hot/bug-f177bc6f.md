---
uid: bug-f177bc6f
id: BUG-135
type: bug
title: the boot guard reports a working builder as failed, and breaks its layout
created_by: EPIC-16
created_at: '2026-09-21T23:17:11.874416+00:00'
updated_at: '2026-09-21T23:51:41.470422+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  epic_parent: epic-96d8aca6
  chat_comment: comment-bd86e73c
  commits:
  - working_sha: f1f7f87713742507431f698cc4a8c9536277b8ce
    reconcile_sha: null
    main_sha: null
  version: 0.2.314
  story_points: 3
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


## What was built

All three, plus the larger number as margin rather than as the fix.

**1 — the guard renders into its own element, never `#app`.** It creates a single
`div#boot-guard` as a child of `document.body` and writes there. Both messages are
`position:fixed`, so nothing the guard shows can participate in the builder's layout
however wrong the rest of the page is. The invisible chat composer is unreachable by
construction, not by tuning.

**2 — it retracts.** Once there is something on screen the guard polls `#app` every
250ms and removes its element the moment the builder mounts. A poll rather than a
`MutationObserver` for the same reason the file is ES5 with no imports: it is the code
that runs when the modern path has already failed, and one property read is the
smallest mechanism that cannot itself become the reason nothing happens. The same tick
refreshes the waiting note, so its sentence stays true as the boot progresses.

**3 — a caught fault, not a clock, licenses the verdict.** "The builder did not start."
is now written only when the guard has actually caught something — a failed
script/stylesheet load, a rejected top-level await, a throw. Slowness with nothing in
evidence reads as slowness: a small note that says **"Still loading the builder…"** and
states plainly that nothing has failed. Two consequences follow:

- the guard can no longer look once and stop looking, because a fault may arrive after
  the deadline. A module that 404s at eight seconds is as dead as one that 404s at one,
  and an operator left on "still loading" forever would be back at the blank page — so
  a fault caught after the deadline upgrades the note to the panel immediately;
- the API probe moves behind the same gate. A healthy-but-slow boot no longer asks
  `/api/sites` at all.

**Which kind of slow.** `main.js` writes `data-builder-boot` on `documentElement`:
`loading` as the first statement of its module body (every import resolved; the server
has not answered) and `mounting` once the answers are in. The guard reads it and says
the true thing in each case — *its code is still loading* / *waiting on the server* /
*drawing*. The attribute is a literal in `main.js` rather than an import, because
nothing bundles that file; `boot-guard.ts` owns both spellings and a UAT pins the two
sides together so a one-sided rename cannot silently turn every slow boot back into
"the module graph never ran".

**The numbers.** `BOOT_NOTICE_MS = 4000` (when the guard may say it is waiting — it
claims nothing, so it can stay short) and `BOOT_DEADLINE_MS = 12000` (when a caught
fault becomes a verdict). The deadline gates a fault rather than replacing one because
an error event is not on its own proof of a dead page: a stylesheet that 404s fires one
and the builder mounts fine.

## Evidence

New: `tests/test_UAT_FC_BUG-135_boot_guard_honesty.test.ts` — six UATs running the guard
against a real DOM. A slow mount is never called a failure (and the deadline is past the
four seconds a production mount routinely crosses); the mount point is left completely
empty while the panel sits fixed on `body`; the guard withdraws when the builder arrives
late; the waiting note distinguishes the three phases; a fault arriving after the
deadline is still reported; and `main.js`'s two phase writes are pinned to the constants
`boot-guard.ts` exports.

Updated: `tests/test_UAT_FC_REQ-149_builder_boot_guard.test.ts`. REQ-149's claim is
unchanged and still asserted — each of its three named causes produces a page naming the
cause and the fix — but the page is read out of the guard's own element now, and the
unreachable-origin case puts the module's own rejection in evidence rather than relying
on the clock, which is the shape it takes in reality. Its "never overwrites a mounted
builder" UAT additionally asserts the guard writes no element at all in that case.

Note for whoever picks this up locally: `main.js` is served from the staged assets, so
`./bin/1c assets` is needed before the change is visible in a running builder.