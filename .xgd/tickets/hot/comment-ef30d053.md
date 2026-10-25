---
uid: comment-ef30d053
id: COMMENT-5614
type: comment
title: Comment on bug BUG-272
created_by: xgd
created_at: '2026-10-24T23:32:44.366053+00:00'
updated_at: '2026-10-24T23:35:39.708085+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-3bd5d1b7
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "41cd262c-a9ff-4338-8f41-fdc657078f19",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ff8d73c2-ea0b-427a-b038-553eada99821-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T23:31:59.210205+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ff8d73c2-ea0b-427a-b038-553eada99821-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T23:35:37.453494+00:00" -->
#### Claude
I've stopped before writing any code because the ticket's own gate isn't met yet, and that's your call to make.

**The conflict:** BUG-272's body says the change "lands only after REQ-452 compares today's builder configuration with this one on the recorded briefs and the operator accepts the comparison." REQ-452 (the builder replay evaluation tool) is still at `draft`, so that comparison can't be run yet. The free-coding protocol only lets me reach `free_coded` after merging into `xgd-working`, and merging is exactly the "landing" the gate forbids.

**What I've found so far:** most of the fix is configuration rather than code. The builder's priming sections, the conversation-memory text ("Reaching the rest of this conversation" is the `transcript-pointer` entry in `tools/generate/src/cli/ai/priming.json`) and the surface manuals (`l1-surface.json`, `fidelity-surface.json`, `talker.json`, …) are all JSON. REQ-452 is designed to score a priming/grant variant from files, so the change could be built as a candidate it can evaluate. The per-role wording of shared tool descriptions may need a small code mechanism, and I'll find out during implementation.

**Options:**
- **A (recommended):** I implement it fully on a `free-BUG-272` branch, with tests and a commit, but don't merge. The ticket stays at `free_coding` with the branch recorded, ready to be REQ-452's first candidate. After you accept the comparison, I merge and set `free_coded`. The risk is that the branch drifts from `xgd-working` while it waits.
- **B:** You waive the gate. I implement, merge and set `free_coded` now, and the REQ-452 comparison becomes evidence after the fact.
- **C:** I wait until REQ-452 exists.

Which do you want? If A or B, I'll go straight ahead.

<!-- xgd-chat-end -->