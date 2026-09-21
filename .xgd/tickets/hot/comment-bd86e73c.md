---
uid: comment-bd86e73c
id: COMMENT-3641
type: comment
title: Comment on bug BUG-135
created_by: xgd
created_at: '2026-09-21T23:35:42.808218+00:00'
updated_at: '2026-09-21T23:49:51.357989+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-f177bc6f
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d0f63cc4-e1fd-419f-b5ae-aa0f6c3a7281",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="f48bed9c-ffec-4d81-82d3-48d851b5100a-user" -->

<!-- xgd-chat role="user" ts="2026-09-21T23:34:53.255994+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="f48bed9c-ffec-4d81-82d3-48d851b5100a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-21T23:49:50.100323+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

The ticket is clear and prescriptive. I have the design decisions I need; I'll state them in the ticket rather than block on questions. Starting the free-coding flow.

Now let me write the new boot guard.

Now `main.js` records its boot phase:

Now the version bump and commit.

Done. BUG-135 is at `free_coded`, commit `f1f7f87`, merged into `xgd-working`, branch cleaned.

## What changed

**`apps/control-app/src/boot-guard.ts`** — the three fixes the ticket asked for:

1. **Renders outside `#app`.** The guard creates its own `div#boot-guard` on `document.body`, both messages `position:fixed`. Nothing it shows can participate in the builder's layout, so the invisible-chat-composer failure is gone by construction.
2. **Retracts.** Once something is on screen it polls `#app` every 250 ms and removes itself the moment the builder mounts. Poll rather than `MutationObserver` for the same reason the file is ES5 with no imports. The same tick refreshes the waiting note.
3. **Evidence, not a clock.** "The builder did not start." is written only when the guard has actually *caught* something — a failed load, a rejected top-level await, a throw. Slowness with nothing in evidence reads as **"Still loading the builder…"**, stating plainly that nothing has failed. Two consequences: the guard can no longer look once and stop (a fault arriving after the deadline upgrades the note to the panel), and the `/api/sites` probe moved behind the same gate, so a healthy-but-slow boot no longer asks at all.

`BOOT_NOTICE_MS = 4000` (a note that claims nothing, so it can stay short), `BOOT_DEADLINE_MS = 12000` (when a caught fault becomes a verdict). The deadline gates a fault rather than replacing one because an error event isn't proof of a dead page — a 404ed stylesheet fires one and the builder mounts fine.

**`apps/control-app/src/builder/main.js`** — writes `data-builder-boot` on `documentElement`: `loading` as the first statement of the module body, `mounting` once the answers are in. That's what lets the note say *which* kind of slow. The attribute is a literal there rather than an import because nothing bundles that file; a UAT pins the two spellings to the constants `boot-guard.ts` exports.

## Evidence

`tests/test_UAT_FC_BUG-135_boot_guard_honesty.test.ts` — 6 UATs against a real DOM. `tests/test_UAT_FC_REQ-149_builder_boot_guard.test.ts` updated: REQ-149's claim is unchanged and still asserted (each named cause produces a page naming the cause and the fix), but the page is read from the guard's own element, and the unreachable-origin case now puts the module's rejection in evidence — the shape it actually takes. 11/11 pass on `xgd-working`.

Adjacent suites run clean apart from three failures I confirmed pre-existing on `xgd-working` before my change (REQ-180's `spend.ts:189` tenant string, and the webui-serving tests that need the out-of-band install).

One operational note: `main.js` is served from staged assets, so `./bin/1c assets` is needed before the change shows up in a running builder.

<!-- xgd-chat-end -->