---
uid: comment-39d66391
id: COMMENT-3658
type: comment
title: Comment on chat CHAT-55
created_by: xgd
created_at: '2026-09-22T21:25:30.634432+00:00'
updated_at: '2026-09-22T21:55:27.799787+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-ecd7a0d8
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "f75b1de9-f536-45c8-aae2-8c773de81ec5",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="6636a931-a67e-45e1-b5fe-b4715cd95bfa-user" -->

<!-- xgd-chat role="user" ts="2026-09-22T21:24:45.293352+00:00" -->
#### You
can you take a look at what is configured to go into an xgd prompt in this project - I think we are stuffing too much in - it is triggering constant errors

<!-- xgd-turn id="6636a931-a67e-45e1-b5fe-b4715cd95bfa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-22T21:30:11.230685+00:00" -->
#### Claude
Here's what's actually going into the prompt for this project, measured rather than estimated.

## Where it's configured

Not in this project. The chat/interactive prompt is assembled by `xgd_source/core/workflow_v2/session_factory.py:_assemble_priming_prompt()` from the **package-global** config at `xgd_source/config/system.yaml` → `session.roles.user_interaction`. There is no per-project override — 1stcontact gets the same list as every other xgd project.

```yaml
user_interaction:
  preamble_template: user_interaction_preamble.txt
  include_foundational_docs: true
  include_governance_docs: true
  llm_context_docs: [PHILOSOPHY, TDD-PROCESS, TEST-STRATEGY, FREE-CODING,
                     FRAGILE-INTENT-LIFECYCLE, BROWSER-TESTING,
                     CODING-STANDARDS, STORY-TYPES, TASK-TEMPLATE]
  include_intent_ticket: false
  include_tech_design: false
```

## Measured size (rendered live against this project)

**178,109 chars ≈ 45K tokens**, before the dashboard adds the CHAT ticket block, the background-jobs warning, and the prior transcript.

| Section | chars | share |
|---|---|---|
| preamble | 1.9K | 1% |
| **System Knowledge** (DOC-5 Architecture Policy + DOC-2 Security Policy) | 11.1K | 6% |
| **Project Context Documents** | 165.2K | 93% |
| ├ FRAGILE-INTENT-LIFECYCLE.md | 58.5K | **33%** |
| ├ FREE-CODING.md | 54.7K | **31%** |
| ├ PHILOSOPHY.md | 16.1K | 9% |
| ├ STORY-TYPES.md | 11.4K | 6% |
| ├ TASK-TEMPLATE.md | 6.8K | 4% |
| ├ CODING-STANDARDS.md | 5.4K | 3% |
| ├ TDD-PROCESS.md | 4.8K | 3% |
| ├ TEST-STRATEGY.md | 4.7K | 3% |
| └ BROWSER-TESTING.md | 2.7K | 2% |

Two docs are 64% of the whole thing.

## Findings

**1. `include_foundational_docs: true` is a silent no-op.** `_read_foundational_docs()` reads `xgd_source/core/workflow_v2/priming_docs/`, which **is not in the installed wheel** — `site-packages/.../workflow_v2/` has no `priming_docs` directory. The loop is `if doc_path.exists()`, so it silently returns empty. Consequence: `EXTREME-GENERATIVE-DEVELOPMENT.md` is never loaded, despite FREE-CODING.md telling every session it is "loaded automatically into every primed session." This hits builder/assessor/planner/editor too. (It's accidentally saving 41K here, but it's a bug either way — and if it were fixed, PHILOSOPHY/TDD-PROCESS/TEST-STRATEGY would then be injected **twice**, since they exist in both `priming_docs/` and `system_docs/` and `user_interaction` lists all three.)

**2. Four docs are dead weight for a chat session in this project:**
- `FRAGILE-INTENT-LIFECYCLE.md` (58.5K) — xgd's internal working/main topology, watermark algorithm, merge drivers. A design-chat session never operates any of it.
- `TASK-TEMPLATE.md` (6.8K) and `STORY-TYPES.md` (11.4K) — planner/assessor-role artifacts; a chat session doesn't write task or story tickets.
- `BROWSER-TESTING.md` (2.7K) — pytest + the Python playwright plugin. This project is TS/vitest with no playwright in `package.json`.

**3. `FREE-CODING.md` at 54.7K is the one doc a chat session genuinely needs**, but a large fraction is historical rationale (the BUG-1024 / BUG-1032 / BUG-977 narratives, the `$PPID` explanation, retired-mechanism notes). An operational-rules version would be ~12–15K with no loss of enforceable content.

Trimming 2+3 takes the prompt from ~178K to ~48K chars (~12K tokens) — a 73% cut.

**4. `include_system_knowledge` is already off** (BUG-1415), so the ~40 DOC tickets aren't being dumped. Only the two governance policy docs come in, at 11K — that's reasonable and I'd leave it.

## On the errors

I didn't find prompt-length failures in the logs. The only context-related hits in the last 200MB of `dashboard_stderr.log` were two `No conversation found with session ID` (dead-session recovery, not overflow), and zero `Usage credits required for 1M context`. What I *did* see looks like a different problem:

- `dashboard_stderr.log` is **1.1 GB**, `dashboard.jsonl` is **238 MB**
- `index_query_profile` showing `index_load_ms` of **21,000–31,000 ms** on a 6,083-entry hot index
- every dispatcher poll spamming `dispatch_terminal_exclusion_unresolved` for ~50 already-`free_and_reconciled` tickets

Which errors are you actually seeing? If it's chat sessions dying or turns failing, the prompt size is a plausible contributor and the trim above is the fix. If it's the dashboard stalling or timing out, that 21–31s index load and the 1.1GB log are the more likely culprits and I'd chase those instead.

<!-- xgd-turn id="afc5b194-959f-4e58-9357-719c31a04836-user" -->

<!-- xgd-chat role="user" ts="2026-09-22T21:45:15.816040+00:00" -->
#### You
I am seeing dashboard chat sessions constantly produce a red dot and silently die with no error - this is happening everywhere but in this project nor than any other. Other discussions I have had have pointed to context bloat - but note that its happening on new tickets with only priming and a short prompt

<!-- xgd-turn id="afc5b194-959f-4e58-9357-719c31a04836-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-22T21:55:24.830209+00:00" -->
#### Claude
Let me reproduce the actual invocation the dashboard makes.

Reproduced the invocation end to end. **Prompt size is not what's killing these sessions** — that diagnosis is wrong, and I'd stop chasing it.

## The prompt is fine at the transport layer

I built the exact argv the dashboard builds for `role="interactive"` and ran it against this project:

```
argv[8]  --settings             12,478 bytes
argv[12] --append-system-prompt 179,410 bytes
TOTAL ARGV                     192,074 bytes   (ARG_MAX on this box = 1,048,576)
→ elapsed 4.7s, returncode 0, result: success, "OK"
```

No E2BIG, no truncation, no context error. The 179K priming turn works.

## The actual silent-death path

`invoker.py:1351` — `invoke_streaming` collects errors out of the JSON stream into `stream_error_events` (populated at lines 1191/1203 from `{"type":"result","is_error":true}`), but only ever *surfaces* them inside `if proc.returncode != 0:`. **If the CLI reports an error in-stream and exits 0, that error text is collected and thrown away.** The generator then ends with no exception and no text, and `ChatSessionRunner._finalize()` unconditionally writes the turn as `status="complete"` with empty content. No banner, no `⚠️` notice, no log line. Dead tab.

The store confirms the fingerprint. Across all 710 session files:

| assistant turns | count |
|---|---|
| `complete`, non-empty | 2033 |
| `aborted`, empty | 73 |
| **`complete`, EMPTY** | **43** |
| `aborted`, non-empty | 42 |

**35 of the 43 empty-`complete` turns are turn #1** — a brand-new session, priming plus a short prompt, exactly what you described. Sample user messages: *"Please implement this ticket following the FREE CODING protocol"*, *"Please continue"*, *"Is this chat connected?"*.

And when the CLI *does* exit non-zero, the plumbing works correctly — those turns get a visible error:

```
7×  You've hit your session limit · resets 8:50pm
4×  You've hit your monthly spend limit
2×  API Error: 529 Overloaded
1×  API Error: 500 Internal server error
```

So it's specifically the exit-0-with-stream-error case that vanishes. I haven't caught the CLI doing it live — that's the mechanism that fits the evidence, not something I've observed in the act.

## Why this project and not the others

Not the prompt — the ticket store. This project has 6,083 hot + 625 cold index entries, and the dashboard log shows `index_load_ms` of **21,000–31,000 ms**, plus a confirmed hard failure:

```
index_fcntl_lock: timed out after 30000ms waiting for exclusive lock on __cold_index__.flock
```

Separately, `/api/ai-permissions` has failed **738 times** with `DirectorySpacesNotConfiguredError` and 34 times with `PermissionSchemaError` — `…/1stcontact.git/main/.xgd/permissions.yaml` has no `directory-spaces` block, so no role's path-scoped `Edit(...)` grant can compile. That's a genuinely broken config in this project and it feeds the same `--settings` document the chat session launches with. Worth fixing regardless of the red dot.

## Two things I'd change

1. **Surface stream errors regardless of exit code** in `invoke_streaming` — if `stream_error_events` is non-empty, raise even on returncode 0.
2. **Make `_finalize()` refuse to write an empty `complete` turn** — record it as an error turn instead, so a silent death can never look like a successful empty answer.

Both are small and would convert every one of those 43 invisible failures into a visible message.

## Housekeeping (unrelated but live)

`dashboard_stderr.log` is **1.1 GB**, `dashboard.jsonl` is 238 MB, and there are 710 files in `.xgd/tmp/chat_sessions/`. Eight dashboard processes are running machine-wide, all with `ppid=1`, one per project — only pid 45740 (port 5555) serves 1stcontact, so they aren't contending here, but several are days old.

Want me to take the two-part fix? It's an xgd-repo change, so it'd need its own ticket and branch there rather than going under CHAT-55 — say the word and I'll scope it.

<!-- xgd-chat-end -->