---
uid: comment-39d66391
id: COMMENT-3658
type: comment
title: Comment on chat CHAT-55
created_by: xgd
created_at: '2026-09-22T21:25:30.634432+00:00'
updated_at: '2026-09-22T21:30:12.026018+00:00'
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

<!-- xgd-chat-end -->