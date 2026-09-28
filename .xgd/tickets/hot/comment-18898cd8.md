---
uid: comment-18898cd8
id: COMMENT-4194
type: comment
title: Comment on request REQ-343
created_by: xgd
created_at: '2026-09-28T19:05:08.889172+00:00'
updated_at: '2026-09-28T20:06:15.530507+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b3534e71
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "15de606e-ac27-485e-9a7f-4308311627ba",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="10191164-2560-44f3-84db-9e130d9872cf-user" -->

<!-- xgd-chat role="user" ts="2026-09-28T19:04:12.772665+00:00" -->
#### You
Can this be done as a configuration? It can be a deploy-time config but I would like to be able to flip back if it all goes south

<!-- xgd-turn id="10191164-2560-44f3-84db-9e130d9872cf-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-28T19:10:45.674195+00:00" -->
#### Claude
I read the ticket and the code. Short answer: yes — and there's a shape that makes the flip-back safer than the obvious one.

Yes — and the obvious version of it is the unsafe one, so I've written the safer shape into the ticket.

**The obvious version**: delete the write groups from `consultant.l1.groups` in `instances.json`. That *is* already deploy-time config, CI-validated. But it breaks two things. You'd have to remember which groups to put back (nothing records the pre-narrowing list once you've deleted it), and it decouples the two switches — narrowed consultant plus `enabled: false` is a deployment where the consultant can neither write nor delegate, which is behaviour 3 of your own ticket. A rollback you can get wrong by flipping the wrong one of two keys isn't a rollback.

**What I've specified instead**: one new key in `delegation.json`, beside `enabled`:

```json
"primary_writes": true
```

Four properties make it flip cleanly:

- **`enabled` dominates, structurally.** The narrowing applies at the same non-null `runtime` that composes the `delegate` tool (`host-core.ts:1269` hangs everything off `workerSettings`). So there's no reachable config where the write groups are gone and there's no worker — including the `enabled: true` but no `workers.builder` case. Behaviour 3 becomes a property of the wiring, not a rule to remember.
- **The withheld set derives itself.** Every group in `l1-surface.json` declares `effect: "read" | "write"`; the narrowed grant is the consultant's `instances.json` entry filtered to `read`. `instances.json` keeps stating maximum authority untouched, so the flip-back restores the right thing with nothing recorded twice — and a write group added next month is withheld without an edit.
- **Absent means `true`.** Omission has to fail toward "the consultant keeps its hands", not toward a dead primary. Present-but-not-a-boolean is a start-up refusal naming the key, same as `enabled`.
- **It needs no new plumbing.** `composeSiteSurfaces` already takes a `config` override (`config ?? L1_INSTANCES[role]`), and `delegationMethod(delegating)` already returns template-or-null on one condition — it takes a second and returns commission-only prose.

Side effect: the gate stops blocking the code. Ship with `primary_writes: true` and the merge is inert — byte-for-byte today's behaviour. Your ten-consecutive-delegations evidence then governs a one-key deploy edit rather than a release.

**One thing I want you to confirm before I build it**: `DrawImages` is declared `effect: "write"`, so the derivation takes `write_image` off the consultant too — drawing an image becomes a worker's job. That's consistent with "writes no part of its L1", but your behaviour-1 list doesn't mention it. Keeping it would need an exception list, which is exactly the hand-maintained list the derivation avoids. Happy either way, but it's a real behaviour choice, not a detail.

No code written. Say the word and I'll cut the branch.

<!-- xgd-turn id="5f9eeeec-598d-4303-9a82-cc72b4e962e7-user" -->

<!-- xgd-chat role="user" ts="2026-09-28T19:29:13.322275+00:00" -->
#### You
Are you dependant on REQ-342? If not please proceed. And make the detault primarty_writes: false please

<!-- xgd-turn id="5f9eeeec-598d-4303-9a82-cc72b4e962e7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-28T19:59:19.220944+00:00" -->
#### Claude
REQ-342 is unstarted (no status) and I'm not dependent on it. Proceeding.

Now let me update the ticket body for the `false` default and the prose scope, then implement.

Now the implementation. Starting with the config document and its validator:

Now let me write the changes. First the config document and validator:

Now the validator in `delegation.ts`:

Now the derivation in `toolbox-core.ts`:

Now wire it in `host-core.ts` at the point the delegation surface is composed:

Now pass it into the consultant's toolbox:

Now `roles.ts` — the provider, the function, and the stale `BUILDER_ROLE` note:

Now host-core: pass `writing` to the binding, and fix the stale "ADDITIVE AND NOTHING ELSE" comment.

Now the delegation.ts header, then typecheck:

Now the full node suite to find anything else the narrowing moves:

Now the node-level UAT suite:

Full node suite passed (exit 0). Now the workers-level UAT, which is where the real composed session lives:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="2e1ab446-9b8e-4259-ba3e-cf35b2bd7571-user" -->

<!-- xgd-chat role="user" ts="2026-09-28T20:06:14.381265+00:00" -->
#### You
PLease continue

<!-- xgd-chat-end -->