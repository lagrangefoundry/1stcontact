---
uid: comment-07d6a4dc
id: COMMENT-3023
type: comment
title: Comment on request REQ-262
created_by: xgd
created_at: '2026-09-16T21:40:12.882573+00:00'
updated_at: '2026-09-16T21:43:30.927655+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-ba7e2bb9
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "3abbcbce-d460-480f-bfb6-ea92d97b4e54",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="054f9a55-6b0c-4bfc-aae8-3f30353b8fda-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T21:40:03.466897+00:00" -->
#### You
Can you outline what your plan is here for priming a session. Let me lay out my expectations:

1. We need to create a knowledge base specifically for this function that contains all the relevant docs including DOC-63 which is specifially for this
   2. We need to review the prompt that we are giving the AI together once everything else is in place
   3. We need to make sure that the AI has proper access to the tools - I just discovered that it didn't have xgd execution so it couldn't make tickets properly!!

<!-- xgd-turn id="054f9a55-6b0c-4bfc-aae8-3f30353b8fda-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T21:43:30.426594+00:00" -->
#### Claude
I read the ticket, the brief, `ai.ts`, and the first round's actual artifacts. Two things need saying before the plan, because both change it.

## Two corrections first

**1. There is no DOC-63.** The highest doc ticket is DOC-53 — *"The reproduction engine and the loop-1 session — the diagnosing session's knowledge base"*, `doc_kind: architecture`. That is the one the ticket names and the one I'll work on. Its §1 (the pipeline map) is still marked **TO BE WRITTEN** and is a deliverable here.

**2. The first round did not fail for want of `xgd`. It produced a complete, excellent gap ticket and the console threw it away.**

`storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-1/ai/outcome.json` reads `status: failed`, `reason: "the round produced no outcome block."` But `transcript.txt` ends with a full, well-formed `"status": "filed"` block — the `coverage-check-misses-section-background-images` diagnosis that DOC-53 §3.1 already records as the first round's finding.

The cause is `parseOutcome` in `ai.ts:~470`:

```
/```(?:json)?\s*\n([\s\S]*?)```/g
```

Non-greedy. The ticket `body` is a JSON string containing literal ` ``` ` fences — because brief §6.3 *requires* the round to quote `gate.json` and `values-diff.json` with their actual numbers, and that is how anyone quotes JSON. The match terminates at the first inner fence, the JSON is truncated mid-string, no later fence parses, and the round is recorded as having produced nothing. I reproduced it: 1 fence found, `Unterminated string starting at line 8 column 13`, 0 parsed.

The failure mode is perverse: **the better the round's evidence, the more certain it is to be discarded.** A thin, unquoted diagnosis would have parsed fine.

By the REQ-261/REQ-262 split this is REQ-261's ("what the round hands back"), and I have not touched it. But it is worth more than anything in this ticket and I'd fix it first. Tell me whether to file/extend it there or pull it in here.

Related, and also uncomfortable: the round reached ticket knowledge by **reading `.xgd/tickets/hot/request-7ff1bacd.md` directly by path** (transcript line 89). Nobody gave it that path; it grepped `^title:|^status:` and found the store. So requirement 7 is not currently held — not because the prompt points at a path, but because nothing stops the round finding one.

---

## The plan

### Part 1 — the session KB

**Selection rule.** `doc_kind` is single-valued and already means production membership, so it can't carry this; DOC-53 is `architecture` and must stay so. Three candidates:

| | drift risk | cost |
|---|---|---|
| hand list in console code | high — drifts from what exists | nil |
| `fields.session_kb: true` opt-in on the doc ticket | low — travels with the document | one field |
| link-walk from DOC-53's Related | nil — self-maintaining | pulls in whatever gets linked |

**Recommend the opt-in field**, with the six named docs (DOC-53, 23, 27, 30, 19, 21) asserted present by a test — so the rule is a rule, and the minimum set is a floor that can't silently empty.

**Mechanism.** Mirror `exportCorpus` (`tools/generate/src/cli/kb.ts:354`), which already solves exactly this: the *console* (which has `Bash`) runs `xgd ticket list --type doc --view --json`, filters on the field, and writes `<DOC-ID>.md` into a `kb/` directory in the console workspace, rebuilt per round so it cannot go stale. The round reaches it with `Read`/`Glob`/`Grep` alone. Requirement 6 is then structural, not a promise.

**Plus a generated `INDEX.md`** — one line per document saying *what question it answers*. This is the thing that stops the KB from just making the prompt longer: the round reads the index and then one document, not six.

**Non-mixing.** Forward direction is already free — `inSystemKb` admits only `doc_kind: system_kb`, so DOC-53 is excluded by construction; I'll assert it rather than assume it (requirement 5). Reverse direction needs your call: I'd **permit** a production doc in the session KB via the same opt-in field, one document at a time, so it's a deliberate act and not a category leak.

### Part 2 — the prompt review

Done *after* Part 1 exists, reviewed with you, as you asked. My going-in position:

- **Keeps**: §1 constraints, §2 the one rule, §3 reading order, §4 verdicts, §5 residual-class naming, §7 the output contract. All of it earned its place — the first round followed §3's order exactly and §5's class name is textbook.
- **Moves to the KB**: vocabulary and the engine map. The brief teaches method and should not grow a glossary.
- **Changes**: §7's worked examples get a *realistic* body (the ticket is right that a toy example teaches a toy shape) — **and an explicit rule about fenced blocks inside `body`**, which is the writing half of the parser fix. §8's Related becomes reachable KB filenames instead of `[[DOC-19]]` citations the round cannot follow.
- **Dropped**: §6 and §7 restate the ticket shape twice; consolidate.

I'll state keeps/moves/drops as a table in the ticket before changing a line, so the review is a review and not a diff read.

### Part 3 — tools

The constraint is measured and I'm not relitigating it: the **deny list is the gate**, the allow list is not. So "give the round `xgd`" means putting `Bash` back, which reopens everything.

What the round actually needs is **read-only ticket search** — and it is already doing it, by grepping the store. Two honest routes:

- **Broker**: the console exports a ticket digest (id, type, title, status, one line) into the KB each round; grep over that is sanctioned, and full-body reads go through a request back to the console.
- **Scoped `Bash`**: `--allowedTools 'Bash(xgd ticket get:*)'` with everything else denied. This *might* gate correctly — prefix rules are a different mechanism from omission — but the original finding was measured and so must this be, before anything relies on it.

I'd **measure the scoped rule first** (it's ten minutes and the answer is durable either way), then choose. If it doesn't gate, broker. Writing stays the console's under both.

### Part 4 — measurement

Baseline from the failed round: **18 tool calls**, 7 of them `Read`, 8 `Grep`. Cost needs REQ-261 req 13. A primed round on a comparable reproduction gets the same two numbers recorded beside it.

---

## What I need from you

1. **The `parseOutcome` fence bug** — fix here, or under REQ-261?
2. **Selection rule** — opt-in field, as recommended?
3. **May a production-KB doc enter the session KB?**
4. Confirm you meant **DOC-53**, not DOC-63.

Nothing committed yet, and no code until the ticket body carries whatever we settle.

<!-- xgd-chat-end -->