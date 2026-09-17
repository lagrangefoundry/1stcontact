---
uid: comment-a687a6e5
id: COMMENT-3028
type: comment
title: Comment on epic EPIC-13
created_by: xgd
created_at: '2026-09-17T03:15:49.406040+00:00'
updated_at: '2026-09-17T04:10:26.775660+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-d76e554a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "2795cbe3-905d-4c9b-b46b-6e6a4fd63b7d",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="3ec61b5f-5d5c-476e-a28e-fdc378f0beb6-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T03:15:42.725130+00:00" -->
#### You
Did you create REQ263? It should be your child.

I would like to discuss nomenclature for a moment. We are using the term email and the associated ticket type for an actual email sent to a user. We are proposing to use the word campaign to describe an outgoing email sent to many users.

Question: is a campaign a single message? Or is it multiple messages to the same group of users, perhaps overtime? If it's the latter then we need another word for the message because I don't want to overload email which seems to have been appropriate already

<!-- xgd-turn id="3ec61b5f-5d5c-476e-a28e-fdc378f0beb6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T03:18:11.383811+00:00" -->
#### Claude
Re-parented REQ-263 — and it wasn't mine.

**REQ-263.** Created by the framework session `EPIC-3` (the immutability epic), which had claimed `epic_parent: ticket://lagrangefoundry/lagrange-framework/EPIC-3`. The store refuses a direct reassignment, so I cleared it and set it to `epic-d76e554a`. The framework dependency is unchanged — it's recorded in the body as `Depends on: …/REQ-160`, which is the right place for it: REQ-263 is the 1stcontact-side type-pack declaration, REQ-160 is the mechanism. It's EPIC-13's child now, and the first one.

## Nomenclature

**A campaign is a single send. The epic already commits to that**, though not in so many words — §"The Campaigns surface" records the decomposition as:

> campaign = **content × list × schedule**

Content is singular there. One campaign is *these bytes, to these people, at this time*. So the answer to your question is the former, and — this is the useful part — **the word for the message already exists in the model and it isn't `email`. It's `content`.** A content ticket is the composed bytes; it's reusable (one content may go to more than one list, or be tested against another), it's separate from `template` because a template is a *role* that gets re-filled and a marketing email is a specific thing said once.

So the stack is:

| word | what it is |
|---|---|
| **list** | the audience |
| **content** | the composed message — the bytes |
| **campaign** | one send: content × list × schedule |
| **email** | one actual message to one person |

**`email` is not at risk of overload**, because the epic already rules out the case that would cause it: per-recipient sends are *not* tickets. A campaign to 800 people produces one campaign ticket, one content ticket, and 800 events on the contact spine — **zero `email` tickets**. An `email` ticket only exists when a message owns its own body, which means one-to-one and transactional. That's exactly the reading you say it already has, and it survives.

**The industry check supports "one send" too.** Mailchimp and Klaviyo — which is where our customers' intuitions come from — both use campaign for a single send and reserve a different word (*automation*, *flow*) for the over-time series. HubSpot is the odd one out, using campaign as the umbrella over many assets. We should follow the small-business tools.

**Which leaves the word we'll need later.** When we do build multiple messages to the same list over time, it needs its own name so nobody reaches for "campaign" and collapses the distinction. My recommendation is **sequence** — an ordered set of campaigns with relative timing — over *flow* or *journey*, both of which are jargon that says less. Worth reserving now even though it's nowhere near the build.

Two things that pressure-test "campaign = one send", both resolving cleanly under the singular reading:

- **A/B test** — two campaigns, same schedule, different content, linked. Not one campaign with variants.
- **Re-send to non-openers** — a second campaign: different list (the non-openers), different schedule, same content.

Say the word and I'll record this as a Vocabulary section on the epic — the table plus the reserved `sequence`, and the note that `email` tickets are one-to-one only, which is the sentence that actually protects the term.

<!-- xgd-turn id="81140979-d498-45ad-9e38-50fcc0659977-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T03:26:13.500903+00:00" -->
#### You
ok good I like those terms and that means that the body of a campaign ticket can be the message content

<!-- xgd-turn id="81140979-d498-45ad-9e38-50fcc0659977-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T03:27:57.377356+00:00" -->
#### Claude
Agreed, and recorded on EPIC-13 as a new dated section (appended, nothing rewritten).

It's worth being explicit that your conclusion **overturns something the epic had already decided**, rather than following from it. §"Three ticket types, and one that must not be" had `content` as its own type, separate from the campaign. Putting the content in the campaign body means **two types, not three** — list and campaign — and the tab's item list drops from Lists / Content / Campaigns to **Lists / Campaigns**. I've written it as a `### Correction:` subsection, matching how the earlier list-entity correction was handled, so the original reasoning and the reason it was superseded both stay legible.

The old argument for a separate content type was immutability by the `template` precedent — *"edit produces a new ticket, and a sent campaign keeps pointing at the bytes that actually went out."* Freezing the campaign body at send preserves that exactly. What's genuinely lost is named reuse of one content across several campaigns, and "duplicate this campaign as a draft" covers close to all of it: an A/B wants two different bodies anyway, and a re-send to non-openers is a new campaign with a different list.

Two consequences I've written down because they'll bite otherwise:

**The freeze predicate differs from `email`'s, and that's not an inconsistency to tidy up.** REQ-263 freezes an `email` from create with *no* `when`, on the grounds that the record is written before the provider is called so no legitimate editing window exists. A campaign has exactly such a window — the draft, where the AI copywriter in the chat pane is the whole point. So campaign carries a predicate on the draft state, which is the shape REQ-263 examined and deliberately rejected for itself. Same mechanism (framework REQ-160), different predicate, and the reason has to sit at the declaration or someone later "fixes" it.

**Nothing now stores the rendered bytes for a broadcast.** With no per-recipient ticket, what actually went out has to be *reconstructible* from the frozen body plus the pinned template — which means `template_uid`, never `template_key`, and deterministic rendering. If that ever stops holding, the record stops being evidence and we have to store a rendered artefact instead.

Also from the last turn: REQ-263 is now EPIC-13's child.

<!-- xgd-turn id="2813b81c-2503-4a2b-95de-3f1dc12d7e7e-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T03:50:30.938558+00:00" -->
#### You
`content` as its own type, separate from the campaign <-- when I said that I was thinking that a campaign was a sequence of email sends, not one. Please update the epic and any related docs with the change.

Freezing the campaign body at send preserves that exactly. What's genuinely lost is named reuse of one content across several campaigns, and "duplicate this campaign as a draft" covers close to all of it: an A/B wants two different bodies anyway, and a re-send to non-openers is a new campaign with a different list. <-- I suggest we keep it simple. A campaign is a single send of a single message to a single list of users. Once the send is triggered the campaign would move into a different state perhaps it goes from draft to sending to sent. The sending could take a while particularly if it is a new list or a large list, that's fine. But my point is that once it is out of draft mode the content is frozen. And then becomes a historical record and as a point out it can be copied for another email blast.

Honestly I am not familiar with mailing list software. Does that feel like an appropriate simplification? Other constraints that would impose that you feel are an appropriate at this level?

<!-- xgd-turn id="2813b81c-2503-4a2b-95de-3f1dc12d7e7e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T03:52:51.064022+00:00" -->
#### Claude
Yes — it's an appropriate simplification, and reassuringly unoriginal: draft → scheduled → sending → sent with the content frozen at send is close to exactly what Mailchimp and Klaviyo do. You're not inventing a model here, you're landing on the one the category converged on. Epic updated; the correction is now written as a **withdrawn premise** rather than a change of mind, since the three-type split was the right answer to "campaign = a sequence" and simply has nothing to be separate *from* once campaign means one send.

The freeze point is worth stating more strongly than "it's the historical record", and I've written it that way. Because `sending` is deliberately long — ramping and the 8am floor make slowness a feature — an edit mid-send wouldn't just rewrite history, it would send recipients 401–800 a **different message** from 1–400, with nothing recording that two things went out under one name. Freezing at the draft boundary makes that structurally impossible.

## The constraints I'd add at this level

Freezing the body covers *content*. A campaign is content × list × schedule, and the other two are still open. Six, of which the first two are a pair and the important one:

**1. The audience has to be snapshotted too.** A list is alive — people join and leave during a send. If the campaign resolves recipients lazily, "who did we send this to" is unanswerable a month later, and a resume after a crash can't know where it got to. So the draft→sending transition resolves the list to a recipient set, after suppression, and records it.

**2. But consent stays live — and this is the exception nobody must tidy away.** If someone unsubscribes twenty minutes into an 800-person send, they must not receive it. So suppression is re-checked *per recipient at the moment of sending*, against the frozen set. **Snapshot the audience; never snapshot consent.** These two look contradictory and aren't, which is precisely why it needs writing down.

**3. Cancel is a first-class state, not a failure.** Spotting the wrong list at recipient 50 must be stoppable. `cancelled` records how far it got — filing it as `failed` makes a deliberate act read as an incident.

**4. `sent` means accepted, not delivered.** Bounces and complaints arrive hours later, per recipient, by webhook, and land on the contact spine. The campaign may aggregate them for display; it must not be the record of them.

**5. A test send must not move the lifecycle.** "Send it to me first" is what everyone does before a blast. It leaves the campaign in draft and writes no contact events — the one path that renders freezable content without freezing it.

**6. Resume must not double-send.** A ramped send *will* be interrupted. That needs a progress cursor over the frozen, ordered recipient set — which is only possible *because* of constraint 1.

And: duplicate-as-draft copies the body and the template reference, never the list, schedule, snapshot or outcome. Copying those would make the new campaign a claim about a send that never happened.

**The one cost, so you can price it.** If you ever build `sequence`, each step is a campaign with its own body, so a body shared across steps means duplicated bytes. Small, and years away — I'd take the simplification.

No other docs needed changing. I checked every ticket that mentions campaigns: DOC-4, DOC-35 and EPIC-12 use it incidentally in a way that's consistent, and EPIC-14's boundary already says *"a campaign is a human composing to a list"* — which is this decision, written before we made it.

<!-- xgd-turn id="1442f4b6-7590-4639-9cae-37e8aa6c84bc-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T03:55:06.584805+00:00" -->
#### You
I think templates could be a different thing there is in my mind to aspects to the content of our campaign. There is the message content which is what we just described as going into the campaign ticket body. But then there is also the associated styling and boiler plate. By which I mean logo had a copyright notice terms and conditions unsubscribe all the things that are professional email needs and of course the HTML styling that goes around it. All of that is a template and I think it's appropriate that the templates and the message body are kept separate. We obviously need a Preview that will allow the user to see the styled message before they hit send. We probably need a test message so they can actually send an email to themselves and see what it looks like in gmail before they send it but I still think that the template which will be reused over many messages should be kept separate from the message content.

I guess maybe such a template needs to be frozen too? Or a version of it frozen? As soon as it has been attached to 1campaign

<!-- xgd-turn id="1442f4b6-7590-4639-9cae-37e8aa6c84bc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T03:56:38.554374+00:00" -->
#### Claude
You've landed on the answer that's already half-built here, and the version instinct is right. Let me answer the freeze question first because it changes what we write.

**No lock needed — and freeze-on-first-attach would actively hurt.** Attach a template to one campaign and you could never fix the logo again. What you want is the second thing you said: *a version of it frozen*. That mechanism already exists in this repo. REQ-197's `template` type is **keyed** — `TemplateKey`, newest-ticket-wins — and its own words are *"replacing a template is writing a new ticket rather than editing a live one in place… the record of what was sent last month still points at the ticket that said it."* So templates are immutable by construction, not by lock: you edit freely forever, each edit mints a new version, every past campaign keeps pointing at the bytes it actually used.

That only holds if the campaign pins `template_uid` (the specific version) and never `template_key` (the role). Which raises the one real decision hiding in your question: **when is the pin taken?** If a draft pins at attach time, a template fix made while you're still writing won't reach your draft — surprising and annoying. So the draft holds the *key*, and the draft→sending transition resolves it to a uid. **One moment, three things pinned: the body freezes, the audience snapshots, the template version resolves.** An operator can override to a specific old version, but that's the exception.

Let me also correct something I wrote imprecisely last turn: "two ticket types, not three" counted only what the Campaigns surface *introduces* — list and campaign. `template` is a pre-existing type and is entirely unaffected. In fact the epic's original argument for why template is its own type gets *cleaner* now: a template is a keyed role that gets re-filled, a campaign body is a specific thing said once. Those were always different lifecycles; now they're the only two.

Two things worth adding on top of what you raised:

**Preview and test send are different tools and you need both.** Preview shows you *our* rendering; a test send shows you *Gmail's*, which mangles HTML in ways no preview can predict — that's why every tool has both. The constraint that matters: preview must render through the exact same path as the real send, or it's a lie. And note previewing a *sent* campaign is the same operation, which is how the historical record gets read back — so one renderer, no preview-only path.

**The unsubscribe link can't be in the frozen bytes.** You listed it as template boilerplate, and it is, but it carries a token identifying *who* is unsubscribing — so it's resolved per recipient at send time, same as `{{first_name}}`. That qualifies the reconstructibility claim I wrote into the epic last turn: a sent campaign reconstructs to the message *modulo per-recipient merge fields*, not byte-for-byte. Worth stating plainly or "reconstructible" is quietly false. And the send path should refuse a broadcast whose rendered output has no unsubscribe mechanism — that's compliance and deliverability, not a template author's option.

Writing this into the epic now.

Recorded — append-only, 86 lines, the only removal being the timestamp.

Four subsections added to EPIC-13:

- **The template is the other half of the content, and it stays separate** — `body × template`, with the note that `template` is a pre-existing type untouched by last turn's correction.
- **Does the template need freezing too? No — it is already versioned** — the freeze-on-first-attach alternative written down as explicitly rejected with its reason, so nobody re-proposes it. And the pin decision: the draft boundary now pins three things in one moment — body freezes, list resolves to a recipient set, template resolves to a version.
- **Preview and test send are two different tools** — with the one-renderer rule, and the observation that previewing a sent campaign is the same operation, which is what makes the deterministic-render obligation testable rather than aspirational.
- **What per-recipient substitution does to "frozen"** — the unsubscribe token and merge fields, so "reconstructible" is stated with its limits rather than overstated.

One open thread I'd flag but haven't written as decided: the campaign body is markdown, and a template is HTML chrome with a slot for it. That's implied by everything above but never stated, and it's the seam where markdown rendering and email-safe HTML have to meet — inline styles, table layouts, no `<style>` blocks that Gmail strips. It's the least glamorous part of email and where most of the surprise lives. Worth its own pass when you're ready.

<!-- xgd-turn id="d7cf33a8-6115-4e97-a9ab-a97683d09e4d-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T04:08:36.551187+00:00" -->
#### You
I think our template ends up with a lifecycle. It is important that we preserve the template for the same reason we need to preserve the content, we want to see what the user actually received, the actual logo that was used, the actual unsubscribe statement etc. etc. But the template should go through the same lifecycle as the campaign they are joined at the hip, one template can serve multiple campaigns but once a template has gone out it is frozen. It would have a lifecycle like a campaign wood and once it has appeared in using his email it must be frozen. Perhaps the simplest user experience is when we create a new campaign we also create a new style template. One or both could be created as copies of existing content?

<!-- xgd-turn id="d7cf33a8-6115-4e97-a9ab-a97683d09e4d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T04:10:26.218942+00:00" -->
#### Claude
Strong agreement on the preservation goal, and one correction on the mechanism — because the thing you asked for and the thing that delivers it aren't quite the same shape.

**"The same lifecycle as the campaign" can't hold, and your own constraint is why.** You said one template can serve multiple campaigns. So campaign A is `sent` while campaign B, on the same template, is still `draft`. What state is the template in? It can't be both. A shared object can't share the lifecycle of each of its several owners.

What a template actually needs is **a one-way latch, not a lifecycle**: `editable → used`. It closes the moment any campaign pins it at draft-exit, and never reopens. `sending` is meaningless for a template; `draft`/`used` is the whole state machine. That gives you exactly what you asked for — *once it has gone out it is frozen* — without the contradiction.

**Copy-on-write then gives you every other property on your list, including your UX.** Editing a `used` template doesn't error and doesn't make the operator go find a "duplicate" button — it transparently mints a new version and repoints the campaign they're working on. From the UI that reads precisely as *"creating a campaign also creates a new style template, seeded from an existing one."* From the store it's one new ticket only when someone actually changes something.

The reason to do the copy lazily rather than eagerly matters, and it's your customers' core value here — **set up your brand once**:

- **Eager** (every campaign gets its own template ticket at creation): fixing the logo means editing every future campaign individually, forever. There's no shared thing left to fix. You'd end up reintroducing a "current template" concept to copy *from* — which is the key you already have, plus N near-identical copies.
- **Lazy** (copy-on-write): fix the logo once, every future campaign picks it up, every past campaign keeps its pinned version. And it kills the spooky-action worry too — if two drafts share v3 and one operator edits styling, that edit mints v4 and repoints only their campaign. The other draft is untouched.

## The catch, and it's the thing you specifically named

You said you want to see *"the actual logo that was used."* **Freezing the template does not give you that.** The logo isn't bytes in the template — it's a URL to an image. Replace `logo.png` at the same address and every preserved campaign silently re-renders with the new logo. The frozen HTML is intact and the claim it supports is false.

Two consequences, and the second is worse than a record problem:

1. **Template assets must be content-addressed** — URL derived from the bytes, so new logo means new URL and the old one keeps resolving. The epic already has this precedent for attachments: *"addressing is content-derived — so the same document forwarded around a thread dedups to one blob."* Same mechanism, applied to template assets.
2. **Assets referenced by a pinned template can never be deleted** — because email images are hot-linked. The recipient's client fetches that logo *when they open the message*, which might be next year. Deleting an old asset doesn't just break the archive, it breaks mail already sitting in inboxes.

One flag before this gets built: `template` is an existing type already serving platform messages (the invite, the lapse notice) via REQ-197. Adding the latch extends a type with other consumers. I think it generalises correctly — a platform template that's been sent should also close rather than be edited in place — but that needs checking against its current callers rather than assuming.

Writing it up.

Recorded — append-only, 79 lines, the single deletion being the timestamp.

Four subsections: the latch (with the A-sent/B-draft contradiction spelled out so nobody re-proposes a shared lifecycle), copy-on-write with eager per-campaign copies written down as considered-and-rejected and *why*, the content-addressed asset requirement, and the REQ-197 consumer check as an explicit unverified claim rather than an assumption.

Where the model stands now, for a campaign leaving draft — one moment, four things settle:

| | what happens |
|---|---|
| **body** | freezes |
| **list** | resolves to a recipient set (consent stays live per-recipient) |
| **template** | resolves to a `template_uid`, and that version latches to `used` |
| **assets** | must already be content-addressed, or the preservation claim is void |

The asset retention obligation is the one I'd watch. It's the only constraint in this whole thread that reaches outside the epic — it lands on the blob store and collides with DOC-37's erasure path, since "never delete an asset a sent campaign references" and "sever this person's identity on request" are going to want the same bytes gone and not gone. Worth a proper look before either side hardens, though it's not blocking anything today.

<!-- xgd-chat-end -->