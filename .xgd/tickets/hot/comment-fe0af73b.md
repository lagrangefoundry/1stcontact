---
uid: comment-fe0af73b
id: COMMENT-2029
type: comment
title: Comment on request REQ-171
created_by: xgd
created_at: '2026-09-01T21:52:08.245526+00:00'
updated_at: '2026-09-03T03:20:54.440987+00:00'
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

<!-- xgd-turn id="467c011f-bdcc-4172-bd3c-a01d1691dc8e-user" -->

<!-- xgd-chat role="user" ts="2026-09-01T22:13:06.288445+00:00" -->
#### You
Let's get the philosophy of this exercise straight.

Key goal: Do not fill the context with things that are duplicative or irrelevant.

The priming, IIRC is:

1) Generic orientation including KB tool use information
2) Role description with required and suggested reading
3) ...is there a third part

And then
4) Reminder every turn for anything that needs reminding

2 Should be short (it points to the docs needed)
4 should be very short a handful of lines

Lets use the term "reminder" not preamble please.

I think your 7 rules are too big for the reminder, but the reminder could include "Don't forget the 7 rules of interaction in DOC-33" for example

<!-- xgd-turn id="467c011f-bdcc-4172-bd3c-a01d1691dc8e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-01T22:14:31.303051+00:00" -->
#### Claude
Let me get the actual structure from the code rather than from memory.

Checked the code. There are **four** parts, not three — and the one you didn't list is the biggest.

**A. The role's system prompt** — `CARETAKER_SYSTEM` in `roles.ts`. ~40 lines, hand-written, sits on the `Role` object. Not part of KM's priming document at all. This is where "You are the caretaker of a website your user owns" lives.

**B. The priming document** — one document KM assembles (`assemblePriming` in `@lagrangefoundry/knowledge`), three fixed sections in this order:

1. `# What exists` — the landscape maps, one per KB, plus honest gaps
2. `# Your purpose` — `CARETAKER_PURPOSE` verbatim
3. `# How to search` — the projected tool manual, the list of searchable KBs, then a closing trigger: *"Prime yourself now: pick the territories above that bear on your purpose, search them, and read what you find before starting work."*

**C. The per-turn reminder** — `caretakerReminder()`, system channel, never in the transcript.

Your numbering maps to B3, B2, B1 — so your (1) is real but it's **last**, not first, and the landscape you didn't name is first. Your (4) is C. Nothing in your list is A.

Two things follow from that:

**Your "short, points to the docs" instinct for (2) isn't what's there.** `# Your purpose` is currently four lines of prose that name no documents. Making it a purpose plus a reading list is a real change, and it's the shape the section was built for — the trigger line right after it already says "pick the territories that bear on your purpose."

**You're right about the 7 rules, and it settles my earlier question.** Rules in the corpus, pointer in the reminder. But the pointer is dead on arrival right now: zero doc tickets carry `doc_kind: system_kb`, so DOC-33 isn't in the corpus for the model to search for. "Don't forget the 7 rules in DOC-33" only works once DOC-33 is in there.

**My question about naming.** You said use "reminder" not "preamble". I'd been using "preamble" for **A** and "reminder" for **C**, which are different objects — A rides once at session start, C rides every turn. So which did you mean?

- Rename A to something else, keeping A and C distinct? (`roles.ts` calls A "the preamble" in its own comments, so this is a real rename.)
- Or: A shouldn't exist as a separate blob at all — dissolve it into B1/B2/B3 and C, so there's exactly one hand-written text per your four-part model?

The second would be the stronger position given "don't fill the context with duplicative things" — A is 40 hand-written lines and some of it is arguably restating what the projected manual already says.

<!-- xgd-turn id="0bbb93cc-2a9b-4af5-93e2-d55b49677ba5-user" -->

<!-- xgd-chat role="user" ts="2026-09-01T22:17:01.261871+00:00" -->
#### You
Remember that we are abandoning the caretaker role this new role is "consultant"

<!-- xgd-turn id="0bbb93cc-2a9b-4af5-93e2-d55b49677ba5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-01T22:17:19.766822+00:00" -->
#### Claude
Understood — consultant throughout. The ticket body already says so; I was quoting the current identifiers, which all get renamed.

So the four parts, in the new vocabulary:

- **A** — the consultant's system prompt (`CARETAKER_SYSTEM` → renamed). ~40 hand-written lines. Currently opens "You are the caretaker of a website your user owns."
- **B1** `# What exists` — the landscape maps
- **B2** `# Your purpose` — the consultant's purpose, and per your point, its reading list
- **B3** `# How to search` — the projected tool manual and the closing trigger
- **C** — the consultant's per-turn reminder

My question is still open, and it's about **A**:

**Does the consultant have a hand-written system prompt at all, or does A dissolve into B2 and C?**

A is the largest hand-written text in the session and the least reviewed. Some of it is genuinely irreducible — tools-only, a malformed change refused whole, never name framework concepts to the client. Some of it duplicates the projected manual. Some of it is the caretaker's job description and is simply wrong now.

Given "don't fill the context with duplicative things," the aggressive answer is: no A. What the consultant *is* goes in B2 with its reading list, what must not decay goes in C, everything else is corpus. That leaves one hand-written text per part and nothing restating anything.

The conservative answer is: keep A, cut it hard, because the system prompt is the only text with real weight in the model's attention.

Which one do you want?

<!-- xgd-turn id="f0f57a23-2b96-4be2-80ca-2f6c74ebac37-user" -->

<!-- xgd-chat role="user" ts="2026-09-01T22:24:47.959567+00:00" -->
#### You
No don't rename caretaker - lets retire it and create a new role please.

**B. The priming document** — one document KM assembles (`assemblePriming` in `@lagrangefoundry/knowledge`), three fixed sections in this order:

1. `# What exists` — the landscape maps, one per KB, plus honest gaps
2. `# Your purpose` — `CARETAKER_PURPOSE` verbatim
3. `# How to search` — the projected tool manual, the list of searchable KBs, then a closing trigger: *"Prime yourself now: pick the territories above that bear on your purpose, search them, and read what you find before starting work."*
   
   *Lets talk about this we can call this "priming" it is your "preamble". I want to adjust your statements a little:*
   
   on 3 - a full tool manual could be huge -  what goes in the primer should make it clear: What tools are available. What they are intended for. Summary guide. How to get more info.
   
   Your purpose - it depends on what your purpose is but I fully expect it to be short with role-specific references. That is the intention.

<!-- xgd-turn id="f0f57a23-2b96-4be2-80ca-2f6c74ebac37-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-01T22:27:20.240838+00:00" -->
#### Claude
Good facts came out of that. Let me record the decisions in the ticket.

Recorded in the ticket: retire rather than rename, "priming" for the assembled document, purpose short with role-specific references, mechanism as a summary. I've dropped "preamble" entirely and call the fourth text "the system prompt", which is its actual field name on the `Role` — no clash with either of your terms.

**Your instinct on the manual is right, and it's worse than "could be huge".** The declaration carries 27 operations across 9 groups. For every granted operation the renderer emits the summary, the long description (20 of 27 have one), every parameter with its type, necessity and description, the return shape's fields, and every error code with its message — on top of a 2,107-character overview. That whole reference work is what currently goes into `# How to search`, every session.

The good news is that the summary level you describe is already authored, just never rendered on its own. Groups have client-facing titles and descriptions — "Looking at the site", "Changing what is on a page", "Changing the site's colors" — and every operation has a one-line summary. So: group title, group description, one line per operation, drop params and returns and errors, fetch the full entry on demand. Two of the nine groups have no description, so those need writing.

**The catch: that's an upstream change.** The renderer is `toolbox/manual.js` in `@lagrangefoundry/ai`, outside this repo, and it holds two properties a new level mustn't break — the manual is a pure projection ("a usable manual generates with no prose written in any configuration"), and every string is byte-for-byte identical to the Python peer, so a summary level lands in both languages or neither. The tempting shortcut is to hand-write a short `mechanism` string here instead. I've written that into the ticket as rejected: it's exactly the drift REQ-126 exists to prevent — a hand-written inventory still describing last month's surface six weeks later, believed by the model precisely because it's in the priming.

**The question I still need answered**, and I think it keeps slipping because it's about the text that isn't in your four-part model. There is a ~40-line hand-written string that sits on the role object, separate from the priming document, that the model sees before any of it. Today it opens "You are the caretaker of a website your user owns."

Does the consultant have one at all?

If yes, it needs writing and cutting hard. If no, it dissolves — what the role *is* goes in the priming's purpose section, what must not decay goes in the reminder, the method goes in the corpus, the surface stays projected. One hand-written text per part, nothing restating anything, which is your governing constraint applied literally.

I lean toward dissolving it, with one reservation: a rule that lives only in the corpus fires only when the model thinks to search for it, and the habits DOC-33 §7 describes are exactly the ones a drifting model stops searching for. The reminder pointer covers that — but only once DOC-33 is actually in the corpus, and right now zero documents are.

<!-- xgd-turn id="3061a67a-63cd-4c73-b630-779eef663a25-user" -->

<!-- xgd-chat role="user" ts="2026-09-01T23:57:15.561741+00:00" -->
#### You
So in the short terms I would like this:

(1) Can you create a ticket for an operation, built into the API or as a separate build-script that will construct the tool summary - I actually like that it would be part of the API - it should be available on all our tool APIs - please create a lagrange framework ticket for that.
(2) Its very hard to have this abstract conversation about the session proming I need to see the ACTUAL TEXT and how it is specificed. I assume there is a configu document can you point me to it?

<!-- xgd-turn id="3061a67a-63cd-4c73-b630-779eef663a25-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T00:00:39.800664+00:00" -->
#### Claude
Framework store reachable. Creating the ticket.

Created **REQ-113** in lagrange-framework (the ticket saved locally; the git push to the remote failed — worth a look separately). Now let me get you the actual priming text.

Now the priming text. There is no config document — it's assembled at runtime from four code locations, so let me render the real thing.

Both done.

## (1) lagrange-framework REQ-113

Created: *"A summary level for the projected manual, and a declared way to fetch the detail"*. It specifies the summary level as a coarser projection of the same declaration (group title + group description + one line per operation), holds it to the two properties the renderer already claims — pure projection, byte-for-byte JS/Python parity — and treats "how to get more info" as a declared operation so every surface gets it automatically rather than each host inventing its own. The declared-operation-versus-host-accessor choice is left open, with the tradeoff stated.

One thing to note: the ticket saved locally but the git push failed (`Could not read from remote repository`) — that repo's remote may need attention.

## (2) There is no config document

That's the answer, and it's part of the problem. The priming is assembled at runtime from four locations, one of which is in another repo:

| Part | Where it's specified |
|---|---|
| System prompt | `tools/generate/src/cli/ai/roles.ts` |
| `# What exists` | awareness-map tickets, read at session start |
| `# Your purpose` | `tools/generate/src/cli/ai/host-core.ts` |
| `# How to search` | projected from `l1-surface.json` + `instances.json` |
| Reminder | `roles.ts` |
| The assembly itself | `@lagrangefoundry/knowledge/src/priming.js` — upstream |

So I rendered it. **`.xgd/tmp/session-texts.md`** has all four texts verbatim, produced by `.xgd/tmp/dump-priming.mjs` which imports the real modules — nothing in it is hand-written for the document.

**The sizes make your point better than the argument did:**

- System prompt: **2,251 chars**
- Priming document: **38,030 chars** — of which the manual is **37,389**, or **98.3%**

Everything that is not the tool manual — the purpose, all three headings, the searchable-KB list, the closing trigger — is **641 characters**. And that 37,389 is the L1 site surface *alone*; real sessions compose the knowledge surface too, so the true figure is higher.

**One structural finding that fell out of rendering it.** Because the host passes `box.manual()` as the `mechanism`, it *replaces* the knowledge component's own default prose — the text that says retrieval is cheap, reach for it rather than assuming, the bolded terms are validated access points and make good first queries. So the section headed `# How to search` contains no instruction about searching. It contains the site-editing manual. The only thing left telling the model to use the knowledge base is the single trigger line at the very end.

That looks like an accident of the seam rather than a decision, and it bears directly on the role rebuild. Worth reading the file before we go further.

<!-- xgd-turn id="b01f2276-10bb-4c77-97ff-b086e11f0834-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T00:27:51.016435+00:00" -->
#### You
ok I want to fix this upstream in the framework

<!-- xgd-turn id="b01f2276-10bb-4c77-97ff-b086e11f0834-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T00:29:25.452501+00:00" -->
#### Claude
Let me check the shape of the fix and the Python peer before proposing anything.

Before you spend anything on this — **my "no search instruction" finding was wrong**, and the correction changes what's worth fixing.

The knowledge surface's own declaration carries that guidance in its `overview`:

> *"It is always here and retrieval is cheap, so search it whenever you are unsure, rather than assuming and rather than asking for material you could fetch yourself... If you were primed with a map of what exists, the bolded terms in it are validated access points."*

And `host.ts` builds priming and composes the knowledge surface in the same `if (knowledge !== null)` branch, so whenever priming exists, `box.manual()` includes that block. The doctrine reaches the model every time. My dump only registered the L1 surface, which is why it looked absent.

The size finding is unaffected: 37,389 of 38,030 characters.

**What is actually defective upstream, having looked properly:**

**The doctrine is written twice.** `DEFAULT_MECHANISM` in `knowledge/priming.js` and the `overview` in `ai-knowledge/knowledge_surface.json` say the same three things in near-identical words — retrieval is cheap so don't assume, query in natural language, the bolded map terms are validated access points. In every configuration that passes a `mechanism`, which is the documented intended usage, `DEFAULT_MECHANISM` is dead text that still reads as live doctrine. Two copies, one always dead, free to drift apart. You can already see the seam: priming says "the bolded terms **above**", the surface hedges with "**if you were primed with** a map".

**The contract is unenforced.** KM assembles a section headed `# How to search` and hands the entire contents to the host, assuming the host will explain how to search. Nothing checks that. A host that passes a manual with no knowledge surface in it gets a section titled "How to search" containing unrelated tool documentation and no search instruction — silently, in both languages. That's the failure I mistakenly reported as current: it isn't happening here, but nothing prevents it.

Neither is a crisis. The second is a genuine seam defect worth a ticket; the first is a dedupe that follows from fixing it.

**My question:** REQ-113 is about the manual carrying too much detail for priming — different package (`ai` vs `knowledge`), different defect. Do you want this as a separate framework bug ticket, or folded into REQ-113 as a second section? I'd file it separately, but it's now small enough that either is defensible.

<!-- xgd-turn id="4de62a61-c54f-4310-a804-82f15359b339-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T00:38:18.942890+00:00" -->
#### You
ok we seem to have 4 things and I think we only need three:

(1) Product level material - what is the product, what tools are available to all roles - access to the KMS
(2) Role level material - what is the role of this session, specific docs that should be read/followed
(3) Reminder - role specific

Do you agree?

<!-- xgd-turn id="4de62a61-c54f-4310-a804-82f15359b339-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T00:39:12.128576+00:00" -->
#### Claude
Yes, agreed — and it's better than what I was proposing, because it fixes something I'd left broken.

Today the system prompt is **per-role** and carries product facts: how the site is built, tools-only, a malformed change refused whole, private until published. Every one of those is true for the caretaker too. Under the current shape, standing the ongoing tier up later means copying them into a second role's prompt — exactly the drift we keep saying we're avoiding. Your (1) makes them role-independent and stated once. That's the real win.

It also dissolves the upstream duplication I was about to file. The KMS doctrine is product-level; it belongs in (1) once, not written twice as `DEFAULT_MECHANISM` and again as the knowledge surface's overview, with one copy always dead. **So hold off on that framework ticket** — the split makes it moot rather than needing a fix. REQ-113 is unaffected; (1) still needs a summary-level tool projection rather than the full reference.

Two amendments.

**Generated state has no slot in your three, and it will get smuggled into (3) if we don't give it one.** `# What exists` — the landscape maps — is neither product nor role nor habit. It's what the corpus contains right now. Same for REQ-160's corpus delta and REQ-131's draft-change signal, which already ride in the reminder for exactly this reason; `roles.ts` flags it in its own comment: *"REQ-131 ADDED ONE THING THAT IS NOT A HABIT."*

I'd say: the maps go in (1) as what the KMS currently holds, and the per-turn deltas stay in (3) because that's the only per-turn channel there is — but name that as a deliberate exception rather than letting it happen again by default. Otherwise (3) accretes every volatile thing that doesn't fit elsewhere, which is how the current reminder got its third and fourth jobs.

**"Tools available to all roles" needs care.** The manual is projected per grant, and the required property is that a session is never told about a capability it wasn't granted — so it can't propose one, apologise for one, or probe for one. If (1) is one shared text listing every tool, that property breaks. It works if (1) is shared *prose* plus a tool summary still projected against this session's grant. Worth being explicit about which you meant: the tools every role has, or per-session-projected tools sitting in the product section.

One consequence you should see before agreeing to it: this makes the system prompt product-level and shared, and moves role identity into the priming. That's an inversion of what's there now, and it means the role's own text — who it is, how it speaks, what it must not do — sits in a document the model reads *after* the product text rather than in the highest-weight position. I think that's right, but it's a real change in emphasis and not just a re-filing.

Want me to write the three-part structure into REQ-171?

<!-- xgd-turn id="bedf5160-18b9-44b3-9eed-9d008e8d15b6-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T23:28:01.782577+00:00" -->
#### You
PLease check now

<!-- xgd-turn id="bedf5160-18b9-44b3-9eed-9d008e8d15b6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T23:28:55.784000+00:00" -->
#### Claude
Checked. Here's the state:

- **REQ-171** — body unchanged since my 15:27 update yesterday. Its only comment is the auto-captured chat transcript, not a new instruction.
- **lagrange-framework REQ-113** — landed intact, status `draft`.
- **Framework git remote** — still unreachable (`git ls-remote origin` fails the same way). Not a ticket problem; that repo's remote access is down.
- Recently touched framework tickets are REQ-112 and BUG-41, both from other work — nothing related to this thread.

So nothing has changed since my last message, and I don't know what you wanted me to look at. What should I be checking?

If it was just "go ahead" on my last question, say so and I'll write the three-part structure into REQ-171 — product level, role level, reminder — including the two amendments: an explicit home for generated state (landscape maps in (1), per-turn deltas staying in (3) as a named exception), and the tool summary staying projected per grant so a session is never told about a capability it wasn't granted.

<!-- xgd-turn id="62040ebd-fa6c-4331-8dba-e54a06269b70-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T23:54:55.560897+00:00" -->
#### You
REQ-113 complete, please proceed

<!-- xgd-turn id="62040ebd-fa6c-4331-8dba-e54a06269b70-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T23:58:22.710685+00:00" -->
#### Claude
Both halves of REQ-113 landed — the `summary` level and a declared `DescribeTools` operation. Let me measure what it actually buys.

The codebase has moved — `instances.json` now says `consultant`, plus a new `fidelity` surface. Let me see what landed.

REQ-174 has already landed the consultant role in another session. Let me see what's left before I write anything.

Everything's in place now. Numbers first: with REQ-113's summary level, the L1 manual goes **43,047 → 10,830 chars**, taking the priming document from **43,732 → 11,515**. That's 74% off. (The L1 surface grew from 37k to 43k when REQ-175 landed, so the saving is bigger than it would have been yesterday.) Writing the structure in now.

REQ-171 rewritten around the three-part structure.

**What I removed from scope,** because it landed while we were talking: REQ-174 already retired `caretaker`, declared `consultant`, rewrote the system prompt and left `LEGACY_ROLE_NAMES` for old sessions. REQ-113 shipped both halves upstream — the `summary` level and a `DescribeTools` operation. The ticket now records those as done rather than re-specifying them.

**What the ticket says.** The three parts split by what changes them: product level (role-independent — what the product is, what the tools are for, how to reach the KMS), role level (purpose plus required reading), reminder (habits only). Both your amendments are written in as decisions: landscape maps go in (1), per-turn deltas stay in (3) as a *named* exception, and (1) is shared prose plus a per-grant tool projection so the never-told-about-an-ungranted-capability property survives. I also wrote in the consequence you should be able to argue with later — this demotes role identity out of the highest-attention position.

**Two things worth knowing before the next step.**

REQ-113 is `free_coded` upstream but hasn't reached this repo's shared store, and nothing is wired: `host.ts`, `session-knowledge.ts` and `system-knowledge.ts` all still call `box.manual()` with no level. So the 74% saving is available but not taken.

The corpus is still empty — 0 of 40 doc tickets carry `doc_kind: system_kb`. Every "reference it rather than restate it" decision in the ticket is inert until DOC-33 and DOC-35 are in there, and they need an authoring pass first, not a field flip. That's the real critical path.

I've left the title alone again. It now describes almost none of the ticket; suggest *"The session's three texts: product level, role level, reminder"* — say the word.

<!-- xgd-turn id="907fbb14-842e-475b-b8ff-f5e7feab3fca-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T00:08:46.216924+00:00" -->
#### You
I have run bin/install in lagrange-foundry is there more needed to export this content?

<!-- xgd-turn id="907fbb14-842e-475b-b8ff-f5e7feab3fca-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T00:10:25.346002+00:00" -->
#### Claude
The install hasn't landed in the shared store. Two separate things needed.

**1. `@lagrangefoundry/ai` is still the old copy.**

- `src/toolbox/manual.js` — 5,430 bytes, no `MANUAL_LEVELS`. The framework source is 11,032 bytes.
- The two files REQ-113 added — `src/manual_toolbox.js` and `src/manual_surface.json` — aren't there at all.

So it's not a stale cache; the `ai` package wasn't replaced. The source side is fine — REQ-113's commit `4eae08e3` is an ancestor of `xgd-working` in lagrange-framework, so it's in what would be packed.

Most likely `--env`. It defaults to `$LAGRANGE_JS_ENV`, falling back to the repo's parent, which is `/Users/martin/lagrangefoundry` — the right place. If `LAGRANGE_JS_ENV` is set in your shell, the tarballs went somewhere else. Worth an `echo $LAGRANGE_JS_ENV`. Otherwise the run failed on that component, and since `bin/install` echoes every command it runs and prints a closing table of what went where, the output will say — `@lagrangefoundry/ai` should appear in that table.

One-line check:

```
grep -c MANUAL_LEVELS /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai/src/toolbox/manual.js
```

`1` means it landed, `0` means it didn't.

**2. Yes — `./bin/1c assets`, and it's needed regardless of the install.**

`apps/control-app/src/generated/` and `apps/control-app/dist-assets/` are both currently missing. Something wiped them; the generated bridges existed earlier in this session. That's the step that type-strips the framework bridges and copies the builder client and webui components across. `1c preflight` is the diagnostic — it reports every shared-store component and exits 6 naming what's absent.

Worth knowing: the bridge files re-export from an *absolute* path into the shared store, so once the store is updated the Worker sees new code without regenerating. But the bridge file has to exist, and right now none do.

**3. Then it's code, not export.** Adopting the summary level means passing `{ level: 'summary' }` at `host.ts`, `session-knowledge.ts` and `system-knowledge.ts`, and granting the manual surface so `DescribeTools` is reachable. That's REQ-171 work under free-coding, and I'd want the store updated first so the UAT can actually exercise it.

<!-- xgd-turn id="551b87ea-a78b-4c0c-807c-894843d88e8a-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T00:17:31.822525+00:00" -->
#### You
```
((.venv-working) ) martin@nyx 1stcontact % grep -c MANUAL_LEVELS /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai/src/toolbox/manual.js

0
((.venv-working) ) martin@nyx 1stcontact % bin/1c assets
modules    2 css, 2 client.js → packages/framework/src/modules/module-assets.ts
builder    22 files
webui      59 files, 7 import-map entries, 6 stylesheets
framework  edit-client.js, site-schema-edit.js, site-schema-shade.js
ai         /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai/src/workers.js
ticketing  /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ticketing/src/index.js
knowledge  /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/knowledge/src/index.js
bridge     /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai-knowledge/src/index.js
kb         8 document(s), 568KB inlined
out        /Users/martin/lagrangefoundry/1stcontact/apps/control-app/dist-assets
((.venv-working) ) martin@nyx 1stcontact %

```

<!-- xgd-turn id="551b87ea-a78b-4c0c-807c-894843d88e8a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T00:19:01.475997+00:00" -->
#### Claude
`grep` returned 0 — the install definitively didn't land. `assets` ran clean though, and its output raises something I need to check: `kb 8 document(s)`.

Two corrections, one of them mine.

**The install didn't land.** `grep` returning `0` confirms it: the shared store still has the old `@lagrangefoundry/ai`, and the two files REQ-113 added (`manual_toolbox.js`, `manual_surface.json`) aren't there. The `assets` run doesn't contradict that — it only reports *where* it pointed the `ai` bridge, not what version sits at that path. So `{ level: 'summary' }` still isn't callable here. Worth checking `echo $LAGRANGE_JS_ENV`, and whether `@lagrangefoundry/ai` appeared in the closing table `bin/install` prints.

`assets` itself is now fine — `src/generated/` and `dist-assets/` are rebuilt.

**My corpus claim was wrong.** Five doc tickets carry `doc_kind: system_kb` — DOC-17, DOC-31, DOC-33, DOC-35, DOC-39 — and `kb/system/` holds four of them chunked and indexed, which the `kb 8 document(s), 568KB inlined` line was telling me. I'd queried with `--json --flags frontmatter,fields`, which returns no frontmatter at all; every `doc_kind` came back empty and I read that as "nothing is tagged" rather than "nothing was returned".

That inverts the critical path. DOC-33 and DOC-35 — the two I said were blocking — are exactly what's in the corpus. So the purpose's reading list and the reminder's pointer to the rules of interaction are buildable now, not after an authoring pass. I've corrected the ticket: the section is now "The corpus already carries the playbook", and what's left is a read-through of those two documents against DOC-39 §3.5 — they're retrievable, but DOC-35 still ends in open questions about itself, which isn't how a document addressed to the AI should read. That's a read, not a blocker.

So the only thing actually gating REQ-171's first piece of code is getting REQ-113 into the shared store.

<!-- xgd-turn id="00601050-686e-4496-bc30-803f0e0ba30a-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T01:37:42.295518+00:00" -->
#### You
```
((.venv-working) ) martin@nyx 1stcontact % grep -c MANUAL_LEVELS /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai/src/toolbox/manual.js

3
((.venv-working) ) martin@nyx 1stcontact % bin/1c assets                                                                                             
modules    2 css, 2 client.js → packages/framework/src/modules/module-assets.ts
builder    22 files
webui      59 files, 7 import-map entries, 6 stylesheets
framework  edit-client.js, site-schema-edit.js, site-schema-shade.js
ai         /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai/src/workers.js
ticketing  /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ticketing/src/index.js
knowledge  /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/knowledge/src/index.js
bridge     /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai-knowledge/src/index.js
kb         8 document(s), 571KB inlined
out        /Users/martin/lagrangefoundry/1stcontact/apps/control-app/dist-assets
((.venv-working) ) martin@nyx 1stcontact %

```

Updated

<!-- xgd-turn id="00601050-686e-4496-bc30-803f0e0ba30a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T01:38:37.518754+00:00" -->
#### Claude
Verified against the delivered store — `ManualToolbox` and `manualInstanceConfig` are exported, and the numbers hold exactly:

| | manual | priming document |
|---|---|---|
| `full` (today) | 43,047 | 43,732 |
| `summary` | 10,830 | 11,515 |

The blocker's gone, so the summary adoption is ready to code: pass `{ level: 'summary' }` at `host.ts`, `session-knowledge.ts` and `system-knowledge.ts`, register `ManualToolbox` alongside the L1 and knowledge surfaces, and grant it via `manualInstanceConfig()` so `DescribeTools` is reachable. Plus the two missing group descriptions in `l1-surface.json`, which only matter once the summary renders.

**One process question before I cut a branch**, and it's the scope-split item already open on the ticket.

REQ-171 currently holds three things: the summary adoption (ready now), the three-part restructure (blocked on your answer below), and the ledger (a write path, a trigger and a title rename). If I free-code all of it on one branch, nothing lands until the last piece does. If the summary adoption gets its own ticket it completes cleanly today — but I won't create one unless you say so.

**And the question the restructure is waiting on:** where does product-level material physically live? Either a role-independent system prompt that every role shares, or a new priming section owned by KM. The first keeps it in the highest-attention position the model reads; the second keeps one assembler and one ordering. Everything else in the restructure follows from that choice, so I don't want to guess it.

I can start on the summary adoption the moment you tell me which ticket it belongs to.

<!-- xgd-turn id="fa29b96b-de58-48d4-adbd-3d024a9165f2-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T02:36:52.849762+00:00" -->
#### You
Please free code it all on one branch

<!-- xgd-turn id="fa29b96b-de58-48d4-adbd-3d024a9165f2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T03:06:55.546976+00:00" -->
#### Claude
Understood — one branch, whole ticket. Let me first check what exists for the ledger piece, since that's the part I've specified but never verified is buildable.

`TicketAppendBody` exists on the ticketing surface, but that surface isn't registered in the session at all — so the ledger needs a narrow host operation rather than handing the consultant a general ticket API. Recording the decisions in the ticket first, since UATs have to trace to its language.

Structure understood. Starting with the summary manual + `ManualToolbox` wiring.

Now implementing. First, composing `ManualToolbox` centrally so both hosts get it.

Now the text restructure. Reading the current system prompt in full.

Now the text split — product-level material into a shared constant, role material staying per-role.

Verifying what's landed so far before moving to the ledger.

Now the ledger. Checking how a session reaches its chat ticket.

The Worker has a `TicketStore`; the node CLI doesn't. That maps onto the fidelity-surface pattern REQ-157 established. Let me use it as the template.

Now building the ledger surface.

Everything I need is on the store. Writing the Worker's ledger.

Typecheck clean (the one error is pre-existing on HEAD). Now the UATs — reading the existing harness first.

`toolbox.ts`'s node wrapper builds its own `extraSurfaces` and silently ignores the argument — that's why the ledger never composed. Switching the test to the core path the Worker actually uses.

Two new failures from my changes. Let me look.

<!-- xgd-turn id="065aeec8-cd06-4deb-bace-cd81ce936dee-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T03:16:15.085229+00:00" -->
#### You
Please free code it all on one branch

<!-- xgd-turn id="065aeec8-cd06-4deb-bace-cd81ce936dee-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T03:20:54.368069+00:00" -->
#### Claude
Picking up where the run was killed. Let me settle whether `reconciliation-l1-navigation` is a real regression or a flake.

`reconciliation-l1-navigation` isn't in the node-project run at all — the earlier failure was an artifact of the combined run that OOM'd. Node project: 6 failing files, exactly the HEAD baseline. No regressions.

Before committing, the ticket says the ledger follows `extraOps`; I built it as a composed surface. Fixing that so the UATs trace to accurate language.

Done — REQ-171 is `free_coded` at `f0724a53`, version 0.2.58, merged back to `xgd-working`, branch and lock cleaned up. 26 UATs pass (18 node, 8 workerd).

**What landed:**

**Priming carries a summary.** All four call sites now pass `{ level: 'summary' }`, and `ManualToolbox` is composed centrally in `createL1Toolbox` so both hosts get `DescribeTools` without either wiring it. The L1 manual goes 43,047 → 10,830 characters. The route to the detail travels with the summary that needs it.

**Product material is written once.** `PRODUCT_SYSTEM` names no role and is asserted to name none, including the retired one — read from `LEGACY_ROLE_NAMES` rather than written out, so it stays true if that list grows. `CONSULTANT_ROLE_TEXT` composes in front of it, role-first.

**Two lines the rename had carried forward are gone.** "They are not technical" is now DOC-35 §9.4's asymmetry rule; "make the smallest change" now applies to adjustments only, with options-that-differ-in-kind at real decisions.

**The purpose names both corpora and the documents to read.** The reminder gained one line carrying the habit that decays plus a pointer to DOC-33, and stays under 600 characters.

**The ledger is written** — a third surface, composed only where there's a ticket store, so the CLI gets a consultant that can't record decisions rather than one that fails to start.

**Three things worth knowing:**

I changed a decision after specifying it. The ticket said the ledger would follow the `extraOps` pattern; `extraOps` supplies host implementations for operations `l1-surface.json` already declares, and the ledger changes no site — putting it there would falsify that document's claim about itself. I built it as a surface and rewrote the ticket's Decisions section to say so before committing, so the UATs trace to accurate language.

`tools/generate/src/cli/ai/toolbox.ts`'s node wrapper accepts no `extraSurfaces` and silently drops the argument. It cost me a debugging cycle. I left it alone — widening it wasn't needed here — but it's a trap for the next caller.

The full combined suite OOM'd and produced one failure (`reconciliation-l1-navigation`) that doesn't reproduce: it passes alone, passes grouped with neighbours, and is absent from a clean `--project node` run. That run shows 6 failing files, exactly the HEAD baseline — all KB-index environmental failures that predate this branch.

<!-- xgd-chat-end -->