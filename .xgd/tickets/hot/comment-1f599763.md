---
uid: comment-1f599763
id: COMMENT-2966
type: comment
title: Comment on request REQ-239
created_by: xgd
created_at: '2026-09-14T03:06:10.167297+00:00'
updated_at: '2026-09-14T03:32:20.299214+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-e89cbbff
  kind: chat_transcript
---

<!-- xgd-turn id="a70b2edc-08c6-4882-9a7f-6a5e7f749b26-user" -->

<!-- xgd-chat role="user" ts="2026-09-14T03:05:23.012932+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="a70b2edc-08c6-4882-9a7f-6a5e7f749b26-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-14T03:32:19.733455+00:00" -->
#### Claude
Now I have the full picture. Let me start the free-coding flow.

Now I'll write the priming configuration for the settings role.

Now the priming config, providers and role builder for the settings role:

Now the session id, manager keys and resolution:

Now `managerForBusiness` and `buildBusiness`:

Now generalise `attach` and add `openBusinessSession`:

Now make `streamPrompt` and `tailSession` resolve business sessions:

Now the `/api/ai/session` route must be able to open the business conversation:

Now the rename call from the pane:

Now the settings pane:

Now mount it in `app.js`:

Now the stylesheet:

Now the workers end-to-end test:

Now let me write the workers end-to-end UAT:

Now the wire-value pin between `router.ts` and `api.js`:

Done. REQ-239 is at `free_coded` with both commits recorded.

## What landed

**The tab** — `SETTINGS_TAB` in `config.js`, rightmost in `TABS`, `fill: true`, with its own `settingsSplit` and `settingsChat` storage keys. Blocked with the other three when a grant lapses, because it is business-scoped like them and needs no exception.

**The two panes** — `settings.js` on the left: a section per setting, the business name as a `mountFields` control in `commit: 'auto'` (click the value, type, return). A second `createChatPanel` instance on the right, not a second mode of the site tab's.

**One API, two callers** — the pane posts to `/api/business/name`, the assistant calls the surface's `rename_business`; both bottom out in `business.ts`'s single rename rule. The rename's effects render as notes with no control beside them, and the switcher above relabels itself so the chrome cannot disagree with the field.

**The settings role** — `SETTINGS_ROLE`, its own declared order in `priming.json`, loaded through the framework's `rolesFromMapping`. It inherits neither consultant entry (both are about building a site), has no corpus, and is framed by `business-line` — the record's *name*, read per turn, because that is the thing the conversation exists to change.

**The business-scoped session** — `business-<id>` alongside `site-<key>`, `claude+business:` backend namespace, one manager map, `attach` taking role and backend as parameters, and `openBusinessSession` taking no subject at all. A session id naming another business is refused by equality against the request's resolved scope.

## Two decisions you should know about

**The grant is not in `instances.json`.** The ticket asked for an entry there; REQ-237 settled it the other way while building the surface, and I followed REQ-237 — that file is validated in CI against the declarations this repo hands the validator, so a key for a per-deployment surface is a grant nothing can check. The property you wanted is intact and proved on the wire: a real turn is offered `read_business`/`rename_business` and no site operation.

**The hostname field is not built.** REQ-238 is still `draft` — no operation to call, nothing true to render. The pane is a list of sections so it is an append, not a rewrite. The left pane holds the business name alone until that lands.

## Tests

30 UATs across three files (jsdom builder, node role/identity, workerd end-to-end over real D1 with real turns). Full suite: 4049 passed, 2 failed — `bug32-webui-scope-rebrand` and `BUG-67 backend settings`, both of which fail identically on a stashed clean tree and are unrelated to this work.

<!-- xgd-chat-end -->