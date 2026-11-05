---
uid: comment-22cb4914
id: COMMENT-3022
type: comment
title: Comment on request REQ-261
created_by: xgd
created_at: '2026-09-16T21:37:38.215477+00:00'
updated_at: '2026-09-16T22:08:15.245183+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-37608664
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "1cc1fc73-fc05-4eea-829e-08371df4098a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="48152f8f-464b-4489-8f8e-8606a6b28306-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T21:37:07.088464+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="48152f8f-464b-4489-8f8e-8606a6b28306-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T22:02:27.739924+00:00" -->
#### Claude
Now I'll implement. Starting with `ai.ts` — the parse, the outcome shape, the stream reader and the tool-policy check.

Now the tool-policy check and the runner (resume, cost capture, fallback).

Now the `diagnose` body — digest, resume, and the shared settle path.

Now the UAT suite.

The ticket's behaviour 8 was rewritten while I worked — the tool policy is now explicitly REQ-262's. Removing that piece from my change.

Done. REQ-261 is at `free_coded`, merged into `xgd-working`, branch cleaned.

**What landed** (`647e49c`, `a70c934`, `70606fd` — v0.2.225):

- **The parse** — `jsonObjectsFromEnd` replaces the lazy fence regex: a string-aware balanced-brace scan trying every `{` in reverse. The observed round's transcript is a repo fixture and parses to `status: filed`, the right residual class, and its 6,346-character body with fenced evidence intact. The same UAT asserts the old regex really does truncate it.
- **Bugs beside the gap** — `AiOutcome.bugs`, read on every status, filed through the same `fileTicket` call at `draft`, one body file each, one extra link per bug. The unboundedness of the gap ticket lives where it can bind: the brief and the per-round prompt, with "Deferring is losing."
- **Resume** — `session.ts`: one session per reproduction chain, cut on a moved reference, a changed brief, or 5 rounds. A resumed round isn't re-sent the brief (that growth is half the danger) and is told its memory is *a pointer, never evidence*. A resume that never started is retried once fresh; a round that ran and failed is not.
- **Transcript** — the `result` event no longer reprints the diagnosis; only `subtype: "init"` is a session starting.
- **Recovery** — `[read it again]` re-parses `transcript.txt` and files through the same path, spawning nothing. A failed round now names the file that holds what it said.
- **Cost** — model, cost, duration, turns, tokens off the stream, into `outcome.json` and onto the page.
- **Digest** — `ai/evidence-digest.md`: deltas, regions, asset attribution, and a key census of the manifest (the thing that cost the first round four tool calls). Capped, and says when it caps. Named in the prompt as arithmetic, not a source.

**Two things to know:**

1. **Behaviour 8 changed under me.** I'd built the session-tool-list falsifier against the earlier wording ("the tool policy is asserted, not enumerated"); the body was rewritten mid-session to assign that surface to REQ-262. I removed it in commit 2 rather than carrying it — `AI_ALLOWED_TOOLS`, `AI_DISALLOWED_TOOLS`, `AI_PERMISSION_MODE`, `AI_SETTING_SOURCES` are untouched. If you still want that check, it belongs in REQ-262.
2. **The acceptance criterion is met: BUG-100** (`bug-14025216`) is filed at `draft`, carrying the first round's body verbatim — `referenceCoverage()` reading `elements[].src` alone, and `reconcileGates` letting that false finding hijack a breached run to `capture-incomplete`.

One deviation worth flagging: requirement 2 names the fixture at `storage/tmp/…`, which is gitignored. I copied it byte-for-byte to `tests/fixtures/repro-console/` so the UAT survives a fresh checkout.

13 new UATs; 102 tests green across REQ-254/255/256/261.

<!-- xgd-turn id="e207a926-89ed-4a26-9fd2-3521c9e02029-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T22:04:21.545337+00:00" -->
#### You
**Behaviour 8 changed under me. <-- there were som last mninute changes to the ticket, were you able to accomodate these? If not please do so**

<!-- xgd-turn id="e207a926-89ed-4a26-9fd2-3521c9e02029-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T22:08:14.590163+00:00" -->
#### Claude
Let me re-read the current ticket body in full and check it against what actually landed.

Behaviour 8's substance is accommodated — but checking it properly surfaced one thing I did leave coupled. Let me verify and fix it.

Yes — and checking it properly found one thing I'd left half-done.

**The last-minute changes were:** behaviour 8 replaced wholesale ("The tool policy is asserted, not enumerated" → "This ticket changes no tool permissions"), and a new requirement 6 inserted, shifting the old 6–10 to 7–11. Behaviours 1–7, the acceptance list and out-of-scope are unchanged from what I built against.

**What I'd already done:** removed the session-tool-list falsifier (commit `a70c934`) and its two UATs.

**What I'd missed:** requirement 6 says this ticket changes *none* of the policy. I verified that as a fact rather than an intention — the entire `── the tool policy ──` section of `ai.ts`, all four constants and every doc comment on them, is byte-identical across my commits. But my resume UAT still pinned `'manual'` and named `Bash` as literals. That would have made REQ-261's test file **a second place REQ-262 has to edit** to change a constant it owns — reintroducing the exact cross-session coupling behaviour 8 was rewritten to prevent, just via the test rather than the code.

Fixed in `3d620df`: the UAT now asserts the resumed argv **is** the fresh argv plus `--resume <id>` and nothing else, and that both carry whatever `AI_PERMISSION_MODE`, `AI_SETTING_SOURCES`, `AI_ALLOWED_TOOLS` and `AI_DISALLOWED_TOOLS` say — read from the constants, not from literals. Requirements 5 and 6 become one assertion, and neither owns a value.

Proved it: with `AI_PERMISSION_MODE` changed to `'plan'` on a scratch edit, REQ-256's UAT fails (that ticket owns the value) and all 13 of REQ-261's pass. Then reverted.

I deliberately did **not** add a UAT pinning the four constants' exact values, even though requirement 6 is phrased as a testable negative — that test would itself be the coupling the requirement forbids. The ticket now records that reasoning so a reconciler doesn't read the absence as a gap.

REQ-261 is back at `free_coded`, v0.2.227, five commits, merged and cleaned. 102 tests green.

<!-- xgd-chat-end -->