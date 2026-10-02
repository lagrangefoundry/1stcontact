---
uid: doc-d652a3b1
id: DOC-65
type: doc
title: 'Next hypothesis: Alice and a plan panel (Bob optional)'
created_by: CHAT-58
created_at: '2026-10-02T17:48:44.828729+00:00'
updated_at: '2026-10-02T18:09:42.903696+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  doc_kind: architecture
  epic_parent: epic-95bc3b15
---

# Next hypothesis: Alice and a plan panel (Bob optional)

**Status:** hypothesis for the next test session. EPIC-19 creates the implementation tickets.

**Origin:** CHAT-58, after the Lagrange Foundry build, the 1st Contact landing page, and the first two-agent test session (Charlie's Plumbing, 2 Oct 2026).

**Relationship to earlier docs:**
- [[DOC-62]] described the room and the two-agent model.
- [[DOC-64]] is the core content primed into both agents.
- [[REQ-356]] built the plan ticket.

This doc updates all three with what the first live session taught us. Where it conflicts with DOC-64 (mainly how much Bob speaks), this doc is the current position until the test is run.

---

## 1. The hypothesis

> **A single designer voice in the chat, plus an always-visible panel rendered from the plan ticket, gives a novice client a better experience than two voices in the chat.**
>
> The panel carries where we are and the **enduring questions the client can answer unaided**: facts about the business that stay true. The chat carries the design conversation, including every large open question (style, palette, type, layout, story, choosing between variants), kept high in information and low in noise.

The next test runs with **Bob off** (he's behind a feature flag). The design is **agnostic about Bob**: the panel reads and writes the plan ticket, not a particular agent, so Bob can be switched back on without redesign.

**What would show the hypothesis is wrong:**
- the gaps Bob was introduced to close come back: the quality bar never captured, concept decisions left on defaults, no critique at milestones.
- the client stops engaging with the panel, so facts don't get collected.

---

## 2. What we've learned so far

### 2.1 About the client

- **They know what they don't like when they see it, and rarely what they like before they see it.** Visual choices have to be shown, not described.
- **A novice won't push.** A trained client asks "does this look premium?", "show me two", "what would you change?" and gets excellent answers. A novice doesn't know these are questions you can ask.
- **A novice won't do data entry.** In the Charlie session, a first post with 7+ questions got one answered. A list of questions is a form, and people treat it as one.
- **Clients have legitimate orders of their own.** One expert client put visuals first and words last, deliberately and correctly. The process must not fight that.
- **Long silences read as failure.** Gaps of 10, 25 and 20 minutes with no notice, followed by two pages of text, were bewildering.

### 2.2 About Alice (the designer)

**What works:**
- **Her judgement about the client's business is excellent, and she now volunteers it.** For Charlie she flagged the Roto-Rooter trademark, turned the 8am–10pm cutoff into the central trust claim, and identified the published callout fee as the most disarming fact a plumber can state.
- **With the plan and DOC-64 primed, she showed variants instead of describing them.** She did this unprompted, after asking the question in words twice. She recommended one variant with reasons and called the existing page "the weakest of the three."
- **She critiques herself when primed.** "What I'd change myself, unprompted." She also withdrew one of her own arguments once the reason for it no longer held. In the earlier Lagrange Foundry build, without the plan, she had needed asking.
- **She keeps the plan honestly.** Decisions are marked `defaulted`/`proposed`, not falsely `chosen`, and every decision log entry gives the reasoning and the alternatives rejected.
- **She picks up assets that arrive mid-turn,** e.g. a logo and team photo uploaded while she was building.

**What fails:**
- **Volume: reasoning in public.** Posts of 300–450 words; most of it was working-out that belonged in her head. Alice and Bob together out-wrote the client about 15 to 1.
- **Too many questions at once.**
- **Asking for details too early.** The contractor licence number was requested at intake; it's a pre-publish detail.
- **Building before collecting the substance.** The pages had structure where real competitor sites have facts: prices, response times, neighbourhoods, review counts, guarantees. That's why they read as a mockup. This is an extraction failure, not a design failure.
- **Using the client's own words as page structure.** "My wife does the books and answers the phone" became the centrepiece section, broadcasting a gendered role the client never asked to foreground. The client's words are raw material; check what the trade normally leads with first.
- **Placing a client asset without preparing it.** A logo on a white background was placed as-is and looked unmounted. Her own look-before-you-report step should have caught it.
- **Never asking for the quality bar,** even though it gates every critique.

### 2.3 About Bob (the coordinator)

**What works:**
- **Persistence.** The client answered dropped questions because Bob kept them alive. Without that, they would have gone unanswered.

**What fails:**
- **He made zero writes to the plan.** All plan writes in the Charlie session were Alice's. Bob's tool use was room reads and room posts only. No checks were ever asked.
- **He restated Alice.** "Here's where we stand" summaries duplicated what the client had just read.
- **He offered opinions** ("which I agree with", "her reasoning is sound"), and once fabricated one about a reference site neither agent had seen. Alice corrected him in front of the client.
- **His drive to close open items created a "nearly done" impression,** which implies "this is our best". It wasn't.
- **He interrupted the design conversation with process.** The client wants to read and respond to Alice first.
- **A spoken push on Alice risks the same overload.** Bob was introduced to push Alice into critique. Seen live, a second voice doing that in the chat could easily become overwhelming again.

### 2.4 Cost

The Charlie session cost about **$33, roughly 3× what current pricing supports** at this stage. Not the focus yet. Likely contributors, inferred from tool use rather than measured:
- long posts re-read by every participant on later rounds
- frequent standing-note rewrites
- builder delegations
- full room re-reads

Tracked in [[TODO-11]] (§9).

---

## 3. Screen layout

The chat half of the builder screen splits into **two stacked regions**:

- **Top: the plan panel.**
- **Bottom: the chat** (unchanged).

They are separated by the **same draggable divider used elsewhere in the builder**: drag to give either region more space, or collapse the panel entirely.

**Telling speakers apart in the chat** (cheap, worth doing regardless of Bob):
- speaker name at least as large as the body text
- an initial avatar on a coloured background
- a faint, distinct background tint per speaker

---

## 4. The panel is a rendering of the plan ticket

The panel holds no state of its own. **It renders the plan ticket and writes back to it.**

```
Alice writes to the plan ──▶ plan ticket changes ──▶ panel re-renders
                                     ▲
Client answers in the panel ─────────┘ (saved as they go)
                                     │
                                     └──▶ Alice is told what changed
```

- **Alice → panel.** Alice adds or edits items in the plan (an ask, a choice, a check). The panel notices the change and refreshes, with no reload and no chat message.
- **Client → plan.** Answers are saved to the plan as they're entered. There's no submit step for the panel as a whole.
- **Plan → Alice: the same channel as the client's page edits.** The client can already edit the page, and Alice learns about it through the per-turn change notice ([[REQ-160]], `session-delta.ts`). The plan is in the same project corpus, so plan changes travel on that channel too. Answers that arrive while she's mid-turn are picked up the same way mid-turn uploads already are.
  - **What the notice must carry.** Today the change notice lists ticket titles within a 400-character budget. For the plan that only says "the plan changed", which is useless. It must name **which asks the client answered and the answers**, and must **leave out changes Alice made herself**.
  - **No wake-up.** A client answer doesn't start a turn on its own. Answers accumulate and are reported on Alice's next turn, exactly like a page edit.
- **Agent-agnostic.** Any chat participant with plan access (Alice, or Bob if enabled) reads the same ticket and sees the same changes. Turning Bob on or off changes who maintains the panel, not how the panel works.
- **Who owns what.** Alice owns an item's wording, its input type and why it's asked. The client owns the answer. A client answer is never overwritten by an agent edit to the same item.

---

## 5. What the panel shows

In order, top to bottom; each section collapses when empty:

**The rule for what belongs on the panel:** a question goes on the panel only if **the client can answer it unaided** and the **answer endures**. Charlie's phone number is always his phone number. Which variant he prefers depends on the variants in front of him right now, and there may be four rounds of them.

| Panel (enduring, client knows the answer) | Chat (judgement, or tied to the current state) |
|---|---|
| phone, hours, towns covered, callout fee, licence number | style, palette, typography, layout |
| independent or franchise; how many vans | which variant, and why |
| "Do you have a brochure / price list / job photos?" | "Does this read as the most trusted plumber in town?" |
| guarantee terms; years in business | the core story; what to lead with |

So the panel shows, top to bottom (each section collapses when empty):

1. **Where we are.** The phase, in plain words: "Rough first version", "Refining", "Getting ready to publish". Progress is always framed by phase, never by how few items are left. This fixes the "nearly done" impression.
2. **Needs your answer.** All open asks (§6), each with a one-line reason why it matters. This is where facts get collected while Alice works.
3. **Decided / still open.** A compact, read-only view of the decision list with states.
4. **Alice is working on…** Once the interposition work lands: what she's doing and roughly how long.

**Not on the panel:** choosing between variants, and milestone checks ("are we happy with the layout?", "does this meet the quality bar?"). Both are judgements about the current state, so both belong in the conversation (§7.3).

---

## 6. Asks: questions waiting for the client

A new section of the plan ticket (an extension to [[REQ-356]]'s schema):

```yaml
asks:
  - id: callout_fee
    prompt: "What do you charge to come out?"
    why: "A published callout fee is the most reassuring fact a plumber can show."
    input: text | number | currency | phone | email | url | date
         | single_choice | multi_choice | upload
    options: [...]          # for single_choice / multi_choice
    accepts_upload: true    # "or upload a price list instead"
    needed_by: first_pass | revision | prelaunch
    blocking: false         # Alice is waiting on this to proceed
    status: open | answered | skipped
    answer: ...             # typed value, or selected option(s)
    answer_material: uid?   # the uploaded file, as a material ticket
    answered_at: datetime?
```

**Input types** match the shape of the answer:
- typed fields (text, number, currency, phone, email, URL, date)
- radio buttons (single choice) and checkboxes (multi choice)
- file upload

Any ask can also accept an upload instead of a typed answer.

**Rules for Alice when writing asks:**
- **Short prompt, one-line reason.** The reason is what makes a novice bother.
- **Put it on the panel the moment you think of it.** Don't hold a question back for the right moment, and don't ask it in the chat. A question on the panel costs the client nothing until he chooses to answer it, which is why a pre-publish detail like the licence number is fine there and wasn't fine as a chat question at intake.
- **Show all open asks.** No cap for now; grouping and ordering come later. `needed_by` orders them, it doesn't hide them.
- **Only enduring facts the client knows** (the §5 rule). Never put a judgement question on the panel.
- **Ask for documents, not data entry** (§7.5). "Upload your business card or letterhead" beats four separate fields for address, phone, email and licence number.
- **Close the loop.** When an upload answers an ask, Alice extracts the facts and fills in the related asks herself, so the client sees questions disappear.

---

## 7. How Alice should behave in the chat

The chat is the design conversation. **High information, low noise.**

### 7.1 Volume

- **Think first, then post the conclusion.** Working-out stays in her head.
- **One question per post, at most.** Everything else that's a fact goes to the panel as an ask.
- **No restating.** Don't repeat what the panel already shows: open items, things still needed, progress.

### 7.2 Stage-managing the conversation

The conversation needs stage management: the client should always know what is happening, what stage we're at, and what (if anything) we need from him. For this test Alice does it. It may ultimately be Bob's role (§8).

- **Say what stage this is, especially the rough first pass.** "I'm going to rough something up now. Don't worry, this is far from final; it's there to react to."
- **Before going away to work:** one line on what and roughly how long, and point at the panel. "I need a few minutes to build what we just discussed. Could you answer some of the questions in the panel while I do?"
- **On return:** short. What to look at, the one thing she wants the client to react to, and her recommendation. Detail goes in the decision log, not the chat.
- **Route every question to the right place.** An enduring fact goes on the panel immediately (§6). A large open question goes in the chat, framed so a novice can answer it: usually by showing alternatives, never by asking him to name a palette or a typeface unaided.

### 7.3 Milestone reviews

With checks off the panel, the push towards critique has to come from the conversation. At milestones (first pass done, before building more pages, before publish) Alice runs a short review in the chat against the brief: "You said you want to look like the most trusted plumber in town. Here's where I think this does that and where it doesn't." She ends with one question. This is the behaviour Bob was introduced to force; the test shows whether Alice does it unprompted (§10).

### 7.4 Intake

- **Ask only what shapes the first pass:** what the site is for right now, who it's for, and the quality bar in the client's own words. Everything else is an ask with `needed_by`.
- **Ask for the quality bar early.** It gates every check.

### 7.5 Getting the substance

- **Ask for artefacts, then extract the facts from them:**
  - letterhead, business card, blank invoice template
  - brochure, flyer, photos of the van and its livery
  - price list or rate card
  - Google Business, Yelp or Nextdoor links (reviews, hours, service area)
  - phone photos of real jobs

  The `material` type (DOC-38) and `capture_site` already support these.
- **Use reference sites as a checklist of content types.** When the client sends references, list *what kinds of fact* they show (prices, review counts, guarantees, response times, badges). Those become asks.
- **Never invent facts.** No made-up review counts or job numbers. A placeholder must look like a placeholder and be listed as an open ask.

### 7.6 Design behaviour (carried over from DOC-64)

- **Show visual choices as variants.** Never ask a client to pick between adjectives.
- **Volunteer critique.** Say what she'd change and why, and call a weak version weak.
- **Check what the trade leads with** before turning the client's own description into page structure.
- **Sensitivity check on how people are described,** especially roles that read as stereotypes.
- **Prepare client assets when placing them,** e.g. remove a white background, crop, resize. Check the result as part of verification.
- **Look before reporting:** every change is rendered and checked before the client is told.

### 7.7 The final details pass

Before publish, Alice asks the client to check every fact on the site. This happens **in the panel**: a "please check these details" section listing every fact with its source. It does not happen as a chat exchange. How confirmation works in general (extracted facts, out-of-date documents) is deferred: [[TODO-9]] (§9).

---

## 8. Bob, if enabled

Bob is **off** for the next test. If he's turned back on, the lessons from §2.3 apply:

- **Stage management is the most likely Bob role** (§7.2): saying what stage we're at, narrating Alice's work time, pointing the client at the panel, and keeping questions routed to the right place. It's a short, cheap, frequent voice that doesn't compete with the design conversation, and it fits the interposition work.
- **His main output is the panel, not the chat.** He can maintain asks in the plan, so persistence costs no extra text.
- **He never posts in the same round as Alice unless he's addressed.** The client reads and responds to Alice first.
- **He never restates Alice, never endorses or opposes a design** (agreement is an opinion too), and never describes something he hasn't seen.
- **He frames progress by phase,** never by how few items are left.
- **His remaining voice:** when addressed; stage management and narrating a wait; possibly prompting Alice's milestone reviews (§7.3) if she doesn't run them herself.

---

## 9. Important, but deferred

Listed here so they aren't lost. Each has a ToDo ticket, and we'll come back to them after the core interaction works.

| ToDo | Topic | Why it matters |
|---|---|---|
| [[TODO-9]] | **Confirming facts.** How extracted or supplied facts get confirmed without filling the chat; documents go out of date. | Wrong facts on a live site (hours, prices, towns) cost the client real business. Likely lives in the panel. |
| [[TODO-10]] | **Sensitive uploads.** Clients will upload documents containing customer data, including card numbers. | We must detect, refuse or redact, and delete, in line with the platform's privacy rules (no card data stored, collect only what's needed). |
| [[TODO-11]] | **Cost per session.** The Charlie session cost about $33, roughly 3× what pricing supports. | Needs measuring per agent and per tool before it can be reduced. |

Also deferred:
- **A hidden reviewer agent,** if Alice's self-critique under the plan turns out to be insufficient. It would review milestone renders against the brief and feed Alice, with nothing extra in the chat. Only if the test shows it's needed.
- **Reconciling [[DOC-64]]** with whatever this test shows, once it's run.
- **A better interface for comparing variants.** Today the client opens `/heavy`, `/family` and `/` by hand. Choosing stays a conversation (§5), but seeing variants side by side needs real UI. Not a problem for this test.
- **Grouping and organising the panel's asks** once the number of open asks makes the list hard to use.

---

## 10. Questions resolved, and the one that remains

Resolved in CHAT-58:

1. **How a client answer reaches Alice:** through the per-turn change notice, the same channel that already reports the client's page edits, extended to name the answered asks and their values. No wake-up (§4).
2. **What goes on the panel:** only enduring questions the client can answer unaided, put there the moment Alice thinks of them. Large open questions and anything tied to the current state stay in the conversation. The conversation is stage-managed (§5, §7.2).
3. **How many asks at once:** all of them, for now. Organisation comes later (§6, §9).
4. **Picking a variant:** a conversation, not a panel choice. The panel is for answers that endure; variant choice is ephemeral (§5).

**Still open: who pushes Alice towards critique?** Moving checks off the panel removed the mechanism that did it without a second voice. For this test, Alice runs milestone reviews herself (§7.3). If she doesn't, or they're soft, that is the clearest evidence for bringing Bob back, in the narrow role of prompting those reviews.

---

## 11. How we'll judge the test

Compare the next session against the Charlie session:

| Measure | Charlie session |
|---|---|
| Agent words : client words in the chat | ~15 : 1 |
| Questions per agent post | up to 7 |
| Silences without notice | 3 (10, 25, 20 min) |
| Quality bar captured | no |
| Concept decisions `chosen` by the client | 0 of 9 |
| Facts collected | phone, licence, independence |
| Cost | ~$33 |

New measures:
- asks answered via the panel
- uploads offered and received
- milestone reviews Alice ran unprompted, and whether they were honest about shortfalls
- stage announcements before each long piece of work
- the operator's verdict on whether the chat felt like a conversation with a designer
