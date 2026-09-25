---
uid: comment-45836f55
id: COMMENT-3941
type: comment
title: Comment on bug BUG-146
created_by: xgd
created_at: '2026-09-25T21:30:01.485628+00:00'
updated_at: '2026-09-25T21:57:54.877529+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-3868705d
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "7ed9734f-18bb-46f4-a9b8-641c6e8a6ae5",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="6f9c9d2b-2ad7-4adb-929b-35e935f264f4-user" -->

<!-- xgd-chat role="user" ts="2026-09-25T21:29:34.866493+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="6f9c9d2b-2ad7-4adb-929b-35e935f264f4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-25T21:57:54.538075+00:00" -->
#### Claude
Now let me start. Scope ticket exists (BUG-146); marking it `free_coding` and cutting a branch.

Now the core change — rewriting `dev-env.ts`:

Now the three banner sites:

Now `bin/access-sim` and `bin/seed` — the printed recipes:

Now typecheck and check for other callers affected by the interface change:

Now the UAT file:

Now verify the UAT actually fails without the fix (RED check):

Green again after restore. Now the regression scope — the adjacent suites that touch this layering:

Identical 6 failures without my changes — pre-existing (port 8790 already in use by a running filing service; missing `dist-assets`). Restoring my work:

Now lock and merge back into `xgd-working`:

Done — landed on `xgd-working`, ticket at `free_coded`.

## What was wrong

`bin/access-sim` has always told the operator to write `.dev.vars.local` — un-blanking `ACCESS_TEAM_DOMAIN`/`ACCESS_AUD` is exactly what makes `isUnconfiguredLocalDev` false — but `devEnvLayering` composed two `--env-file` flags and neither was that file. So the one documented way to *leave* dev-open mode had no effect on either launcher, and an ignored token looks identical to working dev-open mode.

## What I built

- **`.dev.vars.local` is the third `--env-file`**, beside `.dev.vars` in the config dir (not the repo root the old recipe named — one location, no `../../`), and loaded **last**. Last matters: the retired workaround put the same vars in the secrets file, so the supported recipe now beats a leftover instead of losing to it.
- **Three warnings where there was one silence**: absent / 0-byte / present-but-Access-var-less are distinct lines, each naming the resolved path and what was lost.
- **Half an Access pair is now reported too** — one var alone switches the gate on and `guardAccess` refuses everything 503, which is what the newline-less `>>` produced. Asked of the composed result, since no single file is wrong in that state; a UAT drives the real Worker to confirm the 503.
- **`DEV_HOST`/`devUrl()`** replace `http://localhost:${port}` in both dev banners and `startBuilder`'s handle URL. The UAT pins it to the issuer `--print-env` publishes, not to a literal.
- **`bin/access-sim` and `bin/seed`** print the path the launchers read and point at `./bin/1c builder` rather than a hand-rolled `wrangler dev` — the hand-launch existed only because of the missing slot.

**Evidence**: `tests/test_UAT_FC_BUG-146_dev_vars_local.test.ts`, 11 legs, all passing; 9 fail with the third `--env-file` removed. Real simulator, real `--print-env`, real argv for both launchers, vars derived independently of `readDevEnv`, then the product's own gate — both directions in one leg (token admitted with the file, anonymous waved through without it). It stops at the gate by design; `admit` + a resolved person needs D1 and is already proved in `test_UAT_FC_REQ-167_identity.workers.test.ts`.

Pre-existing failures in the regression scope (verified identical on pristine files): BUG-124's filing suite hits `EADDRINUSE 8790` — your filing service is running — and REQ-318/REQ-115 need `dist-assets` and the webui packages a fresh worktree lacks.

## For you, on this machine

`apps/control-app/.dev.vars.local` is still the 0-byte file, and the launcher now says so verbatim:

```
.dev.vars.local at …/apps/control-app/.dev.vars.local is EMPTY — access-sim cannot
sign anyone in; the Worker is in dev-open mode (`./bin/access-sim --print-env >` that path).
```

To sign in: `./bin/access-sim --print-env > apps/control-app/.dev.vars.local`, then restart. Two leftovers worth clearing by hand — the populated `.dev.vars.local` at the **repo root** (126 bytes) is now read by nothing, and the Access vars appended to `~/Documents/secrets/1c.dev.env` are no longer needed there. The layering currently reports no half-pair, so whatever state that file is in is coherent.

<!-- xgd-chat-end -->