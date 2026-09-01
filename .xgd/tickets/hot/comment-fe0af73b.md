---
uid: comment-fe0af73b
id: COMMENT-2029
type: comment
title: Comment on request REQ-171
created_by: xgd
created_at: '2026-09-01T21:52:08.245526+00:00'
updated_at: '2026-09-01T22:02:30.161620+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-72001560
  kind: chat_transcript
---

<!-- xgd-turn id="2fedd51e-cb46-4dc0-a4b9-6a4fcaac4cd9-user" -->

<!-- xgd-chat role="user" ts="2026-09-01T21:51:58.306853+00:00" -->
#### You
I'm looking at this ticket and we have a fundamental misconception. The role "caretaker" is waayy outdated.

We might call this role a "concierge" but this is fundamentally the role that builds the website today.

Perhaps this req should start with (1) we need a new role "Website consultant". Then lets build up the priming for new sessions from there?

<!-- xgd-turn id="2fedd51e-cb46-4dc0-a4b9-6a4fcaac4cd9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-01T21:57:05.690511+00:00" -->
#### Claude
Read the ticket, the three texts, and checked the corpus state. Here's my read.

## The role isn't just misnamed — the name is the bug

DOC-4 asks for a platform for "creating **and** operating" small-business web presences. We shipped one role, named it after the second half, and have been using it for the first. `CARETAKER_SYSTEM` opens *"You are the caretaker of a website your user owns"* — in most sessions today there is no site yet and nothing to caretake. And DOC-33 stage 10 already treats caretaker as a distinct, **later** role: the handoff is "a live site, the ledger, and an introduction to the caretaker," who inherits the ledger. So the docs never had one role. The code did.

That makes this bigger than a prompt review, and it's why your instinct to lead with the role is right: the three texts don't need auditing against a system that moved, they need **deriving from a role we haven't declared yet**.

## Consultant, not concierge

Concierge denotes accommodation — it fetches what you asked for. But DOC-33 §7.4 and DOC-35 §8.5 make strategic pushback non-negotiable and explicitly **non-modal**: the defining act of this role is telling a client their stated problem isn't their actual problem (DOC-35 §4.3 — the Underperformer who says "I want a better website" and means "I want more customers"). A concierge that pushes back is a bad concierge; a consultant that doesn't is a bad consultant. It also matches the doc-set's own vocabulary — DOC-33 is *The Consultation Playbook*, and sells "the consultation".

**One role now, `caretaker` reserved rather than deleted.** Adding both today is exactly the speculative structure DOC-33 stage 1 forbids — there is no ongoing tier to serve, and the caretaker's grant will be narrower when there is. Park it.

## What each text becomes

**Preamble.** Two lines are actively wrong for the new role, and the rest survives.

- *"They are not technical"* → DOC-35 §9.4's asymmetry rule instead. Fluency is loud, confusion is silent, so: default to the careful register and let demonstrated fluency escalate it, never de-escalate on silence. A flat assumption is wrong for half our known population (you're §5.3).
- *"Make the smallest change that answers the request"* → this is the caretaker's instruction and it directly contradicts DOC-33 §7.1. Refining a single proposal drifts toward the model's default, which is the templatey pull the product exists to escape. Two or three **structurally distinct** options at every significant decision. Minimal-change survives only for adjustment-level work.

Unchanged: tools-only, refused-whole, the typed tree, never name framework concepts, read before you write, private until publish.

**The playbook does not go in the preamble** — DOC-33 §12 says so itself, and it's the same REQ-126 layering. The preamble says the role has a method and is expected to consult it; the method lives in the system KB.

**Purpose (KM step 2).** Currently frames only the framework corpus — "how this system builds and describes sites". That was the whole truth with one KB. The consultant also goes looking for the client's own material and prior decisions, and for consultation knowledge (playbook, personas, rubric). It should name both landscapes and say what each is *for*.

**Reminder.** Stays short. The habit that actually decays by turn thirty for this role is options-not-iterations — a model will quietly slide into refine-the-one-proposal. That's the candidate, alongside what's already there.

## The summary gap is really the ledger gap, and that's a better answer

DOC-33 §3.1 supersedes DOC-10 §8 here: the `chat` ticket body is the **ledger** — decisions, the *why*, rejected alternatives, status — not a prose summary. Two things fall out for free:

1. It fixes retrieval structurally rather than by instruction. A summary has to be *told* to name the client's business (DOC-38 §6); a ledger names the business, the positioning and the palette because that's what it records.
2. It answers your per-turn/threshold/session-end question differently: **at decision points, not on a clock.** A character threshold is right for indexing a transcript (DOC-39 §4.2) and wrong for a ledger. `append_body` already has compare-and-set, so a gate commit writes the delta (DOC-33 §3.3).

## One thing that blocks the purpose rewrite

**Zero doc tickets carry `doc_kind: system_kb`.** The export gate landed (REQ-164) but nothing is tagged, so the shipped corpus is projections only. Pointing the consultant's purpose at the playbook does nothing until DOC-33/DOC-35 are in it — and they'd need a pass first, because DOC-39 §3.1/§3.5 say a system-KB document is addressed to the AI, carries no engineering rationale, and DOC-35 currently ends in open questions about itself. That's real authoring work, not a tag flip.

I've updated the body to lead with the role. Two calls for you:

1. **Split the ledger out?** (a) rename + (b) rewrite the three texts are inseparable. (c) the ledger is a write path, a trigger *and* a title rename, and (d) the system-KB authoring pass is its own thing. I'd keep REQ-171 = role + priming and file the other two separately — say the word and I'll create them.
2. **Title** — left alone per convention, but it now describes the old frame. Suggest *"Declare the website-consultant role, and derive the session priming from it"*.

Let me update the ticket body now.

Ticket updated. It now leads with the role and derives the three texts from it, rather than auditing them.

The two decisions I'd like from you before coding:

**Scope.** The rename and the three texts are one unit. The ledger (write path + trigger + title rename) and the system-KB authoring pass for DOC-33/DOC-35 are each substantial enough to stand alone — I've recorded both as open rather than assuming a split, since you own ticket creation. Say the word and I'll file them.

**The one question I couldn't settle for you** is at the bottom of the ticket: where the conversational mechanics live. Options-not-iterations, show-don't-ask, ask-facts-not-diagnoses, the one-push rule — REQ-126's layering test says anything that moves with the method belongs in the corpus, and these move with DOC-33. But they're also exactly the habits that decay over a long session, which is a preamble concern. Corpus knowledge only fires when the model goes looking; a habit has to be present whether it looks or not. My inclination is the preamble carries them as compressed rules and the corpus carries the method they come from — but that's a genuine duplication, and I'd rather you weighed in than have me pick.

<!-- xgd-turn id="f64871e8-a77a-47e7-a7e4-47f300797342-user" -->

<!-- xgd-chat role="user" ts="2026-09-01T22:02:18.118425+00:00" -->
#### You
Can you ask your question as a question - I don't know what you are trying to ask?

<!-- xgd-turn id="f64871e8-a77a-47e7-a7e4-47f300797342-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-01T22:02:29.585471+00:00" -->
#### Claude
Fair — I buried it. Here it is plainly.

DOC-33 §7 lists rules for how the consultant conducts a conversation — offer options rather than iterating on one, show rather than ask, ask for facts not diagnoses, push back once then execute, never say "we'll get back to you".

**My question: should those rules be written into the preamble, or left in the playbook for the AI to retrieve from the system KB?**

Preamble means they're present on every turn whether or not the model thinks to look. But the preamble is hand-written, so when you revise the playbook the preamble silently goes stale — which is the exact failure REQ-126 was about.

System KB means one source of truth that stays current. But corpus knowledge only reaches the model when it searches for it, and a model drifting into bad habits by turn thirty has no reason to search.

<!-- xgd-chat-end -->