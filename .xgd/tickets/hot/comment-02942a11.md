---
uid: comment-02942a11
id: COMMENT-4643
type: comment
title: Comment on request REQ-356
created_by: xgd
created_at: '2026-10-01T21:02:19.782839+00:00'
updated_at: '2026-10-01T21:02:20.179657+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-d27ae815
  kind: chat_transcript
---

<!-- xgd-cli-session ts="2026-10-01T21:02:10Z" model="claude-opus-5-5" continued_from="dashboard" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-01T21:02:10Z" -->
#### You
Does Bob have anywhere to record/manage the state of the project? What I had in mind was a new ticket type "plan". It could start with a generic list of things that need to be decided. If there is any thinking to do Alice should create and update the plan, Bob should be responsible for tracking. It is never appropriate for Bob to say things like "I think the layout needs work" but completely appropriate for Bob to ask "Are we all happy with the layout" and to collect and record answers from Alice and the user. The plan ticket should have a structured plan in its front matter, that can be displayed on a panel or a card by Bob and unstructured content in the body - such as a log of decisions made etc. The ticket should capture all the input from the user about the goals, purpose and anything else that helps build the site. Lets design the plan ticket type if we do not already have it?

<!-- xgd-chat role="assistant" ts="2026-10-01T21:02:10Z" -->
#### Claude
No `plan` type exists, but two near-misses do: (1) a declared-but-never-written `brief` type in productTypePack() — per-site canonical decisions doc (DOC-9 §4, DOC-38 §9), zero instances; (2) the per-session decision ledger on the chat ticket body (REQ-171 record_decision) plus `frame` standing note (REQ-283). Recommendation: one type, not a third — rename/widen `brief` into `plan` (free while no instance exists) and move the decision log from the chat ticket into the plan body so a multi-session site has one log. Proposed shape: one living plan per site; frontmatter holds phase, structured brief (business, site_job distinct from audience, audiences, goal+measure/proxy, quality_bar, existing site + feeling, constraints), functionality from the fixed catalogue, decisions seeded from a generic list with area/tier(concept|detail)/state(open|defaulted|proposed|not_objected|chosen|delegated|parked)/compared/parked_reason, checks (Bob's 'are we all happy with…' questions with answers), and Alice's tasks with optional depends_on. Body: the client's own words, append-only decision log, notes. Write authority: Alice owns tasks and proposes decisions; Bob records intake answers, asks/records checks, updates progress; only a client answer moves a decision to chosen/delegated/parked. Schema invariant: checks[].answers[].by ∈ {alice, user} — Bob can never be an answerer, so 'Bob has no opinion' is enforced by data, not prompt. Open questions: rename brief→plan and move the log? depends_on optional? Bob-recorded answer sufficient as confirmation? one plan per site?

<!-- xgd-chat role="user" ts="2026-10-01T21:02:10Z" -->
#### You
Perfect, yes please create and REQ for this. Then I want you to write a document that captures this conversations conclusions: The roles, how they are expected to interact, how they are expected to use a plan ticket, the generic decisions that need to be checked off, the way we expect to get there. It should be written as core content for Alice and Bob

<!-- xgd-chat role="assistant" ts="2026-10-01T21:02:10Z" -->
#### Claude
Filed REQ-356 as an upgrade of `brief` → `plan` with the recommended answers taken: rename and move the decision log into the plan body; depends_on optional; Bob recording the client's stated answer is the confirmation; one plan per site. Notes that it resolves DOC-62 open questions 1 (structure keyed on the site — survives a lost conversation) and 3 (panel and log are one object), and refines DOC-62's write-authority rule: Bob may record the client settling a decision, never settle one himself. Bob's runtime (room, turn-taking, triggers) is out of scope.

<!-- xgd-chat-end -->