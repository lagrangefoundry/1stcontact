---
uid: comment-6a65b0c6
id: COMMENT-2174
type: comment
title: Comment on request REQ-174
created_by: xgd
created_at: '2026-09-02T22:39:49.475887+00:00'
updated_at: '2026-09-02T23:01:05.831560+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-43ce519b
  kind: chat_transcript
---

<!-- xgd-turn id="a00ffacb-6d76-4b7f-8dd9-a70533e96dff-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T22:39:17.817611+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="a00ffacb-6d76-4b7f-8dd9-a70533e96dff-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T23:01:05.711415+00:00" -->
#### Claude
Now the consumers.

Now the legacy-role alias in the session manager.

Now the tests.

Now writing the UAT suite.

Now run the new suite.

Now commit on the branch.

Done — REQ-174 is at `free_coded` on `xgd-working` (`ada55fd336`, v0.2.46).

## The one question the ticket asked me to decide

**Stored-role compatibility: accept on read, no migration.** `LEGACY_ROLE_NAMES = ['caretaker']` in `roles.ts` registers the old name as a second key onto the *same* `Role` object in the session manager's map. Reasoning: the manager resolves a resumed session's role by keyed lookup and throws on a miss, so a bare rename strands every archived conversation; migrating would mean rewriting an append-only record stream *and* the archives of every deployment (including the store-backed one in production) to change a word. Only one path is live — `createSession` and `aiStatus` use the new name exclusively, so nothing is ever written under the legacy one and the alias ages out. I verified the compat UAT fails when the alias is removed.

## What changed

- `roles.ts` — `CONSULTANT_SYSTEM` / `consultantReminder` / `CONSULTANT_ROLE`, plus `LEGACY_ROLE_NAMES`. The preamble's custodial paragraphs are rewritten as advisory (form a view and state it; say when the request would make the site worse; never build past an open question), "user" → "client", closed-vocabulary constraint language untouched.
- `CONSULTANT_PURPOSE` — the knowledge-priming sentence said the role "looks after" a website; now it advises and builds.
- `instances.json` grant key, `host.ts`, `host-core.ts`, `toolbox.ts`, `toolbox-core.ts`, `apps/control-app/src/ai.ts`, and the 10 test suites naming the role.
- DOC-33's four prose occurrences, via `xgd ticket update` (doc change, no code).
- New: `tests/test_UAT_FC_REQ-174_consultant_role.test.ts` — 5 UATs against the real builder origin (only the Anthropic client doubled), including a guard that scans the tree so a straggler can't reappear.

Tests: the 11 affected node suites (140) and the whole workers project (207) pass. Full node project: 5 files fail, all pre-existing — `bug32-webui-scope-rebrand` AC960 fails identically on `xgd-working` without my change, and the builder-origin/copy-edit failures are the known worktree webui-resolution artifact (they pass in the main checkout).

## Two things to note

1. **The KB still says the old word.** `kb/system/DOC-33.md` and the inlined `apps/control-app/src/generated/kb.js` are build artefacts of the ticket store; DOC-33's rename reaches them on the next `1c kb build`, which needs `CLOUDFLARE_ACCOUNT_ID`/`CLOUDFLARE_API_TOKEN` I don't have. Per DOC-39 §12 the corpus and index ship together, so that's one command when you next rebuild. The guard test excludes `kb/` and `generated/` for exactly this reason.

2. **Unrelated finding, not fixed here.** `host.ts` passes `logDir` into `SessionManager`, but upstream only reads `junctions` and defaults to `memoryJunctions()`. So the Node host has been running on in-memory junctions — `storage/chat/live/` is leftovers from an older build, and a crashed process loses the in-flight turn the file junction existed to save. I found it because my first draft of the compat UAT asserted on the junction file and got ENOENT. Say the word if you want a ticket for it.

<!-- xgd-chat-end -->