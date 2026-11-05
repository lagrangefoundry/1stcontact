---
uid: request-e8210d44
id: REQ-476
type: request
title: 'Consultant: knows the signed-in person''s name and uses it'
created_by: EPIC-19
created_at: '2026-10-27T20:30:09.246899+00:00'
updated_at: '2026-10-27T21:29:43.249104+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-b63c1466
  commits:
  - working_sha: dac372cc08559ab8d06c93ce887414ae788c1e7f
    reconcile_sha: null
    main_sha: null
  - working_sha: 17252c6532420a0d4738a7a2a60ef2144471b339
    reconcile_sha: null
    main_sha: null
  version: 0.2.681
  story_points: 3
---

## Why

The consultant is never told who is signed in. A person's name is recorded on their account (`user_names`) and the account menu shows it, but nothing passes it to the consultant's session. So the consultant only knows a name if the person happens to type it, and a client who never introduces themselves is never addressed by name.

## What

1. **The consultant's session is told the signed-in person's name:** the name they like to be called (`known_as`, else `given_name`, else `display_name`, the same chain as the account menu's greeting). Only the name is sent, never the email address (DOC-5 rule 26: send only what's needed).
2. **The consultant addresses the person by that name** from its first message. The name rides in the consultant's per-turn reminders ("Your client is signed in as Martin. Call them Martin."), taken from whoever sent the latest prompt, so another person on the same site is addressed by their own name. A conversation with nobody signed in (the `1c` CLI) says nothing about a name.
3. **If no name is recorded,** the reminder says so and tells the consultant to ask once, early, and not again if they'd rather not say. The consultant saves the answer with a new plan-surface tool, `set_client_name` (consultant-only `PlanWork` group; allowed to the talker). It writes to the signed-in person's account: as their name when none is recorded, or as what they are known as when one is, so a recorded name is never overwritten. The name is known on every later turn and conversation. With nobody signed in, the tool refuses with `NO_ACCOUNT`.

## Implementation

- `apps/control-app/src/router.ts`: `/api/ai/prompt` resolves the admitted person's name (`greetingFrom(currentNameOf)`) and a save function (`writeName`), and passes them to `streamPrompt`.
- `tools/generate/src/cli/ai/host-core.ts`: `ClientPerson`, held per site conversation from the latest prompt; it feeds the `client.name` provider and the plan surface's `clientName` port.
- `roles.ts` / `priming.json`: the `client.name` reminder entry and its `client-name` / `client-name-unknown` templates.
- `plan-surface.json` / `plan-core.ts` / `talker.json`: the `set_client_name` op.

## Test plan

`tests/test_UAT_FC_REQ-476_consultant_knows_the_name.workers.test.ts`: real `/api/ai/prompt` in workerd behind a real admission; the model client is the only double.
- `test_UAT_FC_REQ-476_consultant_is_told_the_signed_in_name`: a consultant request for a signed-in user with a recorded name carries that name (the given name, not the whole name), and not their email.
- `test_UAT_FC_REQ-476_consultant_uses_the_name`: the consultant is told to address the person by the name they like to be called (known-as wins over the recorded name).
- `test_UAT_FC_REQ-476_no_name_is_asked_once_and_saved`: with no recorded name, the session says so and says to ask once; the name the person gives via `set_client_name` is saved to their account, and later turns are told it.