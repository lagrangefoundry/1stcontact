---
uid: comment-ac9e4976
id: COMMENT-3400
type: comment
title: Comment on request REQ-289
created_by: xgd
created_at: '2026-09-21T00:17:06.372460+00:00'
updated_at: '2026-09-21T00:35:43.469377+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-625707ca
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "05dbee54-cfd3-4e03-8d2c-d8d2dcf6201a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="3d8a25cc-5399-4f76-8e97-e0c4704c3611-user" -->

<!-- xgd-chat role="user" ts="2026-09-21T00:16:09.666182+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="3d8a25cc-5399-4f76-8e97-e0c4704c3611-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-21T00:35:42.872090+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Now I'll append the implementation decisions to the ticket and start work.

Now extracting the POST half of `pushSite` so both commands share it:

Now the two new CLI commands:

Now the usage text and the boolean flags:

Now the two `bin/` scripts:

Now the workers UAT for the export route:

Done — REQ-289 is at `free_coded`, merged into `xgd-working` as `37fddc2bd9`, version `0.2.301`.

## What landed

**`GET /api/export`** (`apps/control-app/src/router.ts`) — the Worker reads through the store it serves from and answers the exact payload `/api/import` accepts. It resolves its target from the authenticated scope the way the import does: >1 site is a 409 ("no unambiguous site… Nothing was read"), 0 sites is a 404 naming the business. No rights gate on the read — BUG-84's gate stays on the write side, where publishing actually happens.

**One reader for both halves** — `readSitePayload` split into `readSiteDraft` (read) + the capture-rights gate, and `pushSite`'s POST half lifted into `postSitePayload`. So export and import can't drift apart, and both commands report Access bounces and BUG-51's 409 in identical words.

**`bin/copy-to-cloud` / `bin/copy-from-cloud`** — thin scripts over `1c copy-to-cloud` / `1c copy-from-cloud` (`1c copy` was taken by the structured-edit verb). One implementation, direction as a parameter, two names because the operator reads the name back. They take the business's **name**, resolve it to each side's own id via `/api/businesses`, and address both calls with `/b/<id>/`. The target business must already exist — there's no call that could create one. `--origin` overrides the non-cloud end, `--force` forwards BUG-51's answer, `--backup FILE` writes the source's export and touches no destination, `--contacts` is recognised and refused with a per-direction reason (refused *before* the credential check).

**15 UATs**, all passing: 4 in workerd over real D1/R2 (including a full export→import→export round trip into a second business), 11 in node, two of which spawn the real scripts over loopback HTTP.

**Docs**: DOC-41 §2/§3 and `apps/control-app/ACCESS.md` now name the pair as the content path and state that a site's home is the builder's store.

## The backup is not done yet — and it needs you

I ran it against your live access-sim (`:8799`) and business-name resolution worked end-to-end, but the export 404'd: your `wrangler dev` is serving the **main checkout's** code, which doesn't have the route. Once the dev server picks up `xgd-working`:

```bash
eval "$(./bin/access-sim --print-token)"
bin/copy-to-cloud --origin http://127.0.0.1:8799 \
  --backup storage/backups/lagrange-foundry.json "Lagrange Foundry"
```

One decision I made that's worth your eye: **`--backup` exists at all.** The ticket's acceptance wants the local export landing somewhere committable, and the alternative was a hand-built `curl` that has to know a business id. I recorded the reasoning in the ticket body under "How it is built".

Two things that constrain the commands, both recorded on the ticket: locally the pair can only reach a business other than `TENANT_ID` **through access-sim** (with `ACCESS_DEV_OPEN` the Worker has no admission to resolve a name against), and `--contacts` is refused in both directions today — asymmetrically, so building it later can't quietly make it symmetric.

<!-- xgd-chat-end -->