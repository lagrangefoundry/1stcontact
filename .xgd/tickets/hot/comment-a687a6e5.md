---
uid: comment-a687a6e5
id: COMMENT-3028
type: comment
title: Comment on epic EPIC-13
created_by: xgd
created_at: '2026-09-17T03:15:49.406040+00:00'
updated_at: '2026-09-18T02:35:10.597468+00:00'
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

<!-- xgd-turn id="359e3dc8-2073-441e-9a8c-bcdf522715eb-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T04:18:32.124245+00:00" -->
#### You
Yes, we just need a mechanism to tell the user "this cannot be edited if you want changes here is a CTA to make a copy". This should be clear and explicit - what we were discussing before sounded like there were automated versioning things going on - that would be confusing.

I don't like copy-on-write it is copy-to-write, agree?

<!-- xgd-turn id="359e3dc8-2073-441e-9a8c-bcdf522715eb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T04:19:49.031670+00:00" -->
#### Claude
Agreed on the name, and it's more than a naming preference — that's why it's worth conceding properly. "Copy-on-write" is a term of art for a mechanism whose *defining* property is that the copy is invisible: the OS does it, you never learn it happened. That invisibility is precisely what you're rejecting. So I named a mechanism by the one attribute you don't want. **Copy-to-write** is accurate: the write is refused, the user is told, the copy is a deliberate act.

And my friction objection was weaker than I made it sound. Everything I argued for survives intact, because the copy inherits the template's key — so "fix the logo once" still works, it just costs a click and a clear sentence instead of happening behind the operator's back. That's a good trade and I was defending the wrong side of it.

It's also **simpler to build**, which is worth saying because it's a point in favour rather than deference. The refusal is a real store refusal — REQ-160's `immutable` rule with `when: "fields.status != draft"` — surfaced as a real message. Copy-on-write would have needed that same lock *plus* a silent interception layer to catch the refusal and transparently repoint the campaign. One mechanism, one UI pattern, applied to both templates and sent campaigns.

**One thing your explicitness principle forces, though: the CTA is two CTAs.** "Make a copy" is ambiguous in a way that matters, because the two readings have different consequences:

- **"Update this template"** — new version, *same key*, becomes the current template for future campaigns. Past campaigns keep the version they used. This is fixing the logo.
- **"Start a new template from this one"** — new key, a separate design sitting alongside. Changes nothing about what the next campaign looks like. This is wanting a second look for announcements.

If we're going to tell the user what's happening rather than doing it silently, we have to tell them *which of these* they're doing — offering one undifferentiated "copy" button would reintroduce exactly the confusion the explicitness is there to prevent.

Correcting the epic now — replacing the copy-on-write subsection rather than layering another correction onto something I wrote twenty minutes ago.

Done — the diff removes only the copy-on-write subsection and the timestamp; the latch, the logo/asset constraints, and the REQ-197 check are untouched.

The epic now records copy-to-write as the mechanism, with the naming correction explained (not just applied, so it doesn't get "improved" back to the term of art later), the fact that it's the simpler build, the note that brand-once survives because the copy inherits the `TemplateKey`, and the two-CTA split.

One consequence worth flagging, since it's a new obligation rather than a restatement: **the refusal has to be legible everywhere the operator might hit it, not just in the template editor.** The store refusal fires wherever a write lands — the styling pane, the AI chat pane if the copywriter tries to adjust the chrome, a bulk action. If any of those surfaces the raw store error instead of the message-plus-CTA, the operator gets a stack trace where you intended a clear explanation. Same for a `sent` campaign edited from the contact timeline. It's a UI-consistency requirement that follows from putting the enforcement in the store, which is still the right place for it.

Nothing here has touched code — ticket body only, so no branch or free-coding cycle yet.

<!-- xgd-turn id="9a92c380-2d43-40aa-b383-b39d4649935c-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T04:27:50.595451+00:00" -->
#### You
**"Update this template"** — new version, *same key* <-- no no key the key is the ticket number the user changes it they EXPLICITLY CHOOSE which template they want 

template-125 is chosen by the user to be associated with campaign-2551 which is sent on July 12 2027
template-125 (unchanged) chosen by the user to be associated with campaign-2583 which is sent on July 28 2027

Users site undergoes and upgrade, logo is changed. User cannot edit template-125 they hit [Make a copy] to create template-132

template-132 chosen by the user to be associated with campaign-2653 which is sent on Aug 7 2027

User is in control - don't confuse them with hidden keys and versions

<!-- xgd-turn id="9a92c380-2d43-40aa-b383-b39d4649935c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T04:30:35.455311+00:00" -->
#### Claude
You're right, and the mistake is worse than the CTA count — I'd kept newest-wins resolution alive from REQ-197 and it doesn't belong here at all. Your example makes the model plain: **template-125 is template-125.** The operator picks it for campaign-2551 and picks it again for campaign-2583 three weeks later. Nothing resolves, nothing becomes current, nothing is inherited.

So the two CTAs collapse to your one: **[Make a copy] → template-132**, independent, in draft, and from then on the operator picks 132 because they choose to. "Set up your brand once" was a solution to a problem you don't have — the propagation I was defending *is* the hidden behaviour, not a benefit paid for by it.

Your example also settles something I hadn't stated: **frozen ≠ retired.** template-125 goes out on July 12 and is frozen; on July 28 campaign-2583 uses it unchanged. So a `used` template stays fully selectable — the latch blocks editing, never reuse. That needed writing down, because "frozen" reads like "archived" to whoever builds the picker.

And it changes the pin timing I recorded two turns ago. I had the draft holding a *key* that resolved to a uid at the draft boundary. With no keys, the campaign holds the template's ticket id from the moment the operator chooses it. So at the draft boundary only three things happen — body freezes, list snapshots, template latches to `used` — and the template reference was never in doubt.

**One consequence I'd flag as my inference rather than your instruction:** this means a campaign's style template is *not* REQ-197's `template` type. That one is keyed and newest-wins precisely because nobody chooses it — the system reaches for "the invite template" and fills a role. Yours is chosen by ticket id and latched. Different identity model, different lifecycle, so it should be a distinct type rather than the same type behaving two ways depending on who created it. The good news is that this **dissolves the dependency I flagged last turn** — platform templates are untouched, so there's nothing to verify against REQ-197's callers.

Rewriting the affected sections rather than layering another correction — the key assumption is threaded through several of them.

Written. Two sections out (the versioning argument, the REQ-197 dependency), two in, everything else preserved — preview/test send, the per-recipient substitution limit, and the logo/asset constraints all survived the rewrite.

Your worked example is quoted verbatim in the epic; it's the clearest specification in the whole section, and it carries the dates, so the July 12 / July 28 / Aug 7 sequence documents "frozen but still selectable" better than any rule I could write about it.

Two repairs I made while in there, since they were consequences of my own earlier edits rather than of your correction: the reconstructibility obligation had two live cross-references pointing at a passage I'd dropped during an earlier rewrite. It's now stated where it's used, with its limit — reconstructible from the frozen body plus the chosen template, *modulo per-recipient substitution*.

Where the template model now stands:

- **template-125 is template-125.** The operator picks it per campaign. No key, no resolution, no chain.
- **Latch:** `editable → used`, closing the first time a campaign carrying it leaves draft. Blocks editing, never reuse.
- **[Make a copy]** yields an independent new template with its own id. It supersedes nothing.
- **Distinct type** from REQ-197's keyed platform templates — recorded as my inference from your rule, flagged as such.

The one thing still genuinely unresolved from this whole thread is the asset/erasure collision: "never delete an asset a sent campaign references" against DOC-37's identity severance. Your example sharpens it rather than softening it — template-125's logo has to keep resolving for mail sent in July 2027 that someone opens in 2029. Not blocking anything today, but it wants a decision before either side of it hardens.

<!-- xgd-turn id="29b17958-62db-479d-805b-840a4cf311c5-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T04:45:08.982532+00:00" -->
#### You
**Yeah REQ-197 is wrong we need to supersede it with this design - ok?**

<!-- xgd-turn id="29b17958-62db-479d-805b-840a4cf311c5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T04:46:54.618835+00:00" -->
#### Claude
Let me check what REQ-197 actually is and whether it's built before agreeing — superseding it means something different if it's shipping.

Agreed — with one refinement that I think makes it right rather than just smaller, and one caution about *when*.

I read REQ-197 and `templates.ts`. It's coded and sitting at `ready_to_reconcile` with two working commits, serving three system messages — `invite`, `signin`, `lapsed` — via `templateFor(store, key)` with seed-if-absent, called from `invites.ts` (two sites) and `sessions.ts` (one).

**The refinement: two separable things are bundled in REQ-197, and only one of them is wrong.**

1. **Role resolution** — `invite` → some ticket. This is *necessary* and isn't the thing you objected to. A signin email fires at 3am for a tenant who has never opened the templates UI; there is no human present to choose a ticket id, and a brand-new tenant has no templates at all. Something has to answer "which ticket is this business's invite email."
2. **Newest-ticket-wins as the resolution rule** — this is exactly the hidden versioning you rejected. Nobody points at anything; the winner is implicit, and it changes as a *side effect* of creating a ticket.

So supersede (2), keep (1), and the replacement is the design we just built: **a role is a pointer the business sets, not a query that picks a winner.**

- `invite` is a named slot in settings holding `template-125`.
- Sending reads the slot → template-125. One answer, inspectable, no clock-ordering.
- template-125 is `used` and frozen. Edit refuses → **[Make a copy]** → template-132.
- The business **explicitly repoints** the slot to 132. The UI can offer that right at the copy — "use template-132 for invites? [Yes/No]" — but it's a choice, never a consequence.
- Seed-if-absent survives: a new tenant's slot is empty, seeding mints the ticket and sets the slot.

**Which reverses what I recommended last turn.** I split campaign templates from platform templates into two types *because* they had different identity models. Superseding newest-wins removes that difference — both are chosen by ticket id, both latch, both copy-to-write. So it's **one type**, and the split loses its premise. That's a simplification your instinct bought that I'd argued us out of.

**The caution is timing, and it's specific.** REQ-197 is `ready_to_reconcile` — coded, awaiting reconcile. That's the cheapest possible moment to change the design (three call sites, no migration, nothing on main), but it's also precisely the state where **its body must not be edited**: a reconcile cycle commits to the ticket text, and rewriting it underneath produces a capability matrix describing a spec nobody can read. That's the exact hazard framework EPIC-3 exists to prevent.

So I'll record the supersession in EPIC-13 — where the design lives — and **not** touch REQ-197's body. Landing it in REQ-197 needs to go through whoever owns that cycle, either after it reconciles or by pulling it back deliberately. Want me to raise that with them once this is written down?

Recorded — timestamp plus two trailing blank lines; nothing substantive removed.

The epic now carries the supersession with the verified state of REQ-197 in it (coded, `ready_to_reconcile`, three call sites, nothing on main), the role-slot replacement, and the explicit note that this collapses the two-type split back to one type — so a later reader sees the reversal and its reason rather than two contradictory sections.

The one thing I'd still flag: **superseding REQ-197 is now written down but not landed.** The design says one thing and the code at `ready_to_reconcile` says another, and that gap is only safe while somebody remembers it exists. It needs to reach REQ-197 through its own cycle — not by editing that body now, for the reason above.

Say the word and I'll raise it with whoever owns that cycle. I'd also hold off on any code in this session until that's sorted, since the template type is the thing both sides want to change and racing REQ-197's reconcile would be the worst way to discover the conflict.

<!-- xgd-turn id="23b4c68c-2743-42b2-9087-1f81e2dfaad6-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T19:15:06.846711+00:00" -->
#### You
It has been built we need a new ticket to change it - simple as that. (I own all cycle :-) ) - REQ-197 cannot be changed now.

Ok we need to start getting concrete. I am focusing on the features that complete the web builder functionality - this includes email configuration, inbound and outbound but not the campaigns tab.

I think we have a design doc that covers this? 46? Can you summarize for me the work that needs to be done and the user settings?

As I see it there are the following email paths:

1. outgoing from 1c - forms, transactions, notifications, campaigns
2. outgoing from user's email - sent as martin@lagrangefoundry.ai
3. incoming

1 and 3 should all end up in the contact log and we create a ticket (frozen) with the contents

Can we intercept 2? Or do we need to ask the user to cc a special address (e.g. contact@mysite.com)

The settings has to allow configuration of email forward. Sending one incoming address to one or more outgoing addresses - one of these incoming addresses can be marked as a catchall. We can allow many of these - say 20?

Suggestion: needs to be thought through - if the user's DNS already has email configured, we might suggest doing basic email config (e.g. primary forwarding address and catchall) before switching the DNS so that email is always up. Note the pattern for DNS switching will involve an AI chat flow. (see EPIC-5 IIRC)

These settings are part of that DNS switch and need to fit into that story seamlessly.

Don't cut any tickets yet there are a lot on the board - lets just work through the high level requirements - I favor fewer tickets - each ticket ideally has something that I can see working.

<!-- xgd-turn id="23b4c68c-2743-42b2-9087-1f81e2dfaad6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T19:17:37.936044+00:00" -->
#### Claude
Let me gather the facts before answering — DOC-46, EPIC-5's cutover flow, and what the epic already records as verified-today.

Facts first: **DOC-46 isn't the doc.** It's *"What 1st Contact is, and how to say it"* — positioning and language. No DOC covers email design. **EPIC-13 is the design doc** — it's ~57k characters now and already holds everything below. Nothing needs extracting unless you want a DOC for a different audience.

And your scope lands exactly on a line the epic already drew. OQ1 resolved the surface question: **email configuration goes in Settings, not a tab of its own** — *"addresses, forwarding, catch-all, authentication and DNS health, and send-as status are written once and read many times, which is what EPIC-4 built Settings to be."* The one new tab is substantially just campaigns. So "everything except the Campaigns tab" is a clean cut along a seam that's already there, not a new boundary.

## The three paths

**Path 1 — outbound from 1c.** Sender port exists (`mail.ts` + Resend, REQ-196) and delivery events already land on the contact spine (`email-webhook.ts`, REQ-198). **The gap is the record**: we know a message was delivered, we don't store what it said. That's the frozen ticket, and it's REQ-263 — which depends on framework REQ-160 for the mechanism.

**Path 3 — inbound.** Nothing exists. No Routing, no Worker, no parse, no bodies, no threading. This is the largest single piece of new work in your scope.

**Path 2 — outbound from their own mail client. No, we can't intercept it, and it isn't a limitation we can engineer around.** MX governs *inbound only*. When Gmail sends as `martin@lagrangefoundry.ai`, it goes Gmail → recipient's MX. Our DNS is not consulted and never will be — outbound routing is chosen by the sending client, and that's SMTP, not a Cloudflare gap.

**But the priority is lower than it looks, because the reply half is free.** A customer replying to that message sends to `martin@lagrangefoundry.ai` → our MX → captured. So the contact log gets *the customer's entire side* of every conversation regardless. What's missing is only the business's own sent copy.

Four ways to close that gap, in descending order of how much I'd trust them:

| approach | cost | catch |
|---|---|---|
| **Mailbox sync** (Gmail API / IMAP, read Sent) | OAuth + a sync loop | What HubSpot and Streak actually do. Reliable. Big privacy surface. |
| **Custom SMTP submission** — their send-as routes through us | **We'd need a real SMTP endpoint** | Workers can't accept SMTP (no TCP listen), so this needs infra we don't have. Also needs checking whether consumer Gmail permits it or only Workspace. |
| **Workspace BCC routing rule** | ~zero | Admin sets one rule, all outbound BCC'd to us. **Workspace only** — consumer Gmail can't auto-BCC. |
| **Ask them to CC manually** | zero | Won't happen reliably. Humans don't. |

On your CC idea specifically — one flaw worth naming: `contact@mysite.com` is a *forwarding* address, so CC'ing it sends the business a copy of their own email. It'd need a **reserved capture address that doesn't forward**, which is the same namespace concept the epic already reserves for BFM synthetic traffic.

**My recommendation: defer path 2 out of this scope entirely.** It's a CRM-sync feature, not email configuration, and it's the only one of the three with real infrastructure cost. Ship 1 and 3, keep the data model indifferent to how a sent message arrived, and revisit.

## The settings inventory

1. **Which domain** — already EPIC-5's selector. Don't rebuild it.
2. **Forwarding table** — N rows of `local-part → one or more destinations`. Your 20 is a reasonable cap.
3. **Destination verification** — Cloudflare Email Routing *requires* each destination address to confirm by clicking a link before it can receive. This is a real multi-step flow, not a text field, and it's the piece most likely to be underestimated.
4. **Catch-all** — on/off plus its destination.
5. **`noreply@` refused**, `info@` discouraged — already decided.
6. **Send-as status** — read-only here; the setup subsystem is deferred (the epic already puts it outside the cutover window).
7. **Record-vs-forward** — we forward everything, we don't record everything, or a published address fills the activity log with spam. Already decided; needs a control.
8. **Deliverability status** — read-only from `resolver.ts`. I'd defer, but flag it as a conscious omission.

## The cutover ordering — you already settled this

It's recorded in EPIC-13 from 2026-09-16, and EPIC-5 carries the matching correction. The sequence:

1. Zone created `pending`, live DNS swept, web records written — **EPIC-5**
2. **Customer is asked who their email should go to; Routing is configured in the pending zone** — **EPIC-13**
3. Nameserver pair shown and pasted — **EPIC-5**
4. Mail resolves to our pipeline at the moment delegation flips

Your addition is genuinely new though: **a minimum viable config — primary forwarding address plus catch-all — is the floor that makes step 2 safe to complete.** That's what "configured enough to flip" means, and it wasn't written down.

**Which surfaces a conflict worth deciding now.** The epic says *"catch-all optional and off by default"* — correct steady-state, since a catch-all is a spam magnet. But at cutover it's the exact thing that stops mail being lost to an address nobody remembered. I'd make **catch-all default-on through cutover**, with a later prompt to turn it off once the real addresses are known. Tell me if you'd rather it stay off.

## Proposed shape — four tickets

Ordered, each with something visible:

1. **Inbound end-to-end, one address, hardcoded** — Routing + Email Worker + parse + frozen ticket + contact event + visible on the contact page. *Demo: send mail to the domain, watch it appear on the contact.* This is the spine everything else hangs off.
2. **Email configuration in Settings** — the forwarding table, destination verification, catch-all. *Demo: configure it in the UI, send, it forwards.*
3. **Cutover integration** — step 2 of the window: the ask, Routing written into the pending zone, the minimum-config floor. *Demo: run EPIC-5's flow end to end and mail never drops.*
4. **Outbound record** — every 1c-sent message writes its frozen ticket and event, not just the delivery webhook. *Demo: trigger a form confirmation, read its actual content on the contact log.* **Blocked on framework REQ-160** — worth starting that now if it isn't moving.

A fifth exists but isn't in this scope: the new ticket superseding REQ-197's keyed resolution. Small, and it can wait.

Shall I write this into the epic as a scoping section — the path-2 analysis, the minimum-config floor, the catch-all decision, and the four-ticket shape — with no tickets cut?

<!-- xgd-turn id="1aef6e8a-a89d-48ea-a4b2-136b1278d1b5-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T20:05:38.274868+00:00" -->
#### You
On your CC idea specifically — one flaw worth naming: `contact@mysite.com` is a *forwarding* address, so CC'ing it sends the business a copy of their own email. It'd need a **reserved capture address that doesn't forward**, which is the same namespace concept the epic already reserves for BFM synthetic traffic. <-- why is that a forwarding address? What does that mean? It doesn't matter what the actual address is contact, info, biz, system - can call it whatever. The point is it gets an email into our system that we can then process - we treat emails to this address specially, look at the adddressees and add the email to their contact logs - I think is small and simple - it is not reliable but is nice to have, some users will use it religiously.

**My recommendation: defer path 2 out of this scope entirely.** It's a CRM-sync feature, not email configuration, and it's the only one of the three with real infrastructure cost. Ship 1 and 3, keep the data model indifferent to how a sent message arrived, and revisit. <-- surely what I have in mind is small and part of the in-bound email path - its at the end of this scope but I (a) don't want to loose it and (b) don't want to build something that cannot accomodate it

**Destination verification** — Cloudflare Email Routing *requires* each destination address to confirm by clicking a link before it can receive. This is a real multi-step flow, not a text field, and it's the piece most likely to be underestimated. <-- this is good yes. We have a lot of that machinery though

**Deliverability status** — read-only from `resolver.ts`. I'd defer, but flag it as a conscious omission. <-- yes defer this it is more of a campaigns consideration (not entirely but I think that is where we will meet it head on)

Also be aware of the BFM guttering requirements see EPIC-15 and doc 51

<!-- xgd-turn id="1aef6e8a-a89d-48ea-a4b2-136b1278d1b5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T20:08:16.011366+00:00" -->
#### Claude
Two corrections of mine before anything else.

**The CC point — you're right, I invented a problem.** The address is ours; we decide it doesn't forward. Nothing more to it. Your design is the whole design: a reserved address, don't forward it, read the addressees, file the message to their logs.

**And I was wrong about path 1.** I said the gap is that we don't store what was sent. We do — `messages.ts` already writes an `email` ticket per send with the **rendered body**, called from `lead.ts` (form confirmations), `sessions.ts` (signin) and `invites.ts`. Its own docstring: *"THE BODY IS THE RENDERED MESSAGE. The template changes; what we sent does not."* So path 1 is essentially built for every path that exists today. The real gaps are just the immutability lock (REQ-263) and the synthetic mark — which collapses my proposed ticket #4 almost to nothing.

**Path 2 stays in scope, at the end.** It is small and it is inbound, you're right. One thing has to be designed in from the start or it gets expensive:

> **Direction is derived from the `From`, not from the pipe a message arrived through.**

A BCC'd capture is an *outbound* message arriving on the *inbound* path. If the record infers "inbound = from a contact", that capture files backwards — the business becomes a contact of itself. And the filing rule differs: normal inbound files to the sender; a capture files to the **addressees**, so one message ticket produces N contact events. Both are trivial if the model has direction and filing-target as explicit fields; both are a migration if it doesn't.

**Destination verification** — agreed, and the epic already names the machinery: §"The button is a token, and the mechanism already exists". **Deliverability** — deferred, noted as meeting us head-on in campaigns.

## BFM guttering

It's **DOC-54** you want, not 51 — DOC-51 is *"The client's material — what you may use, and what you must ask"*. DOC-54 is *"The test gutter: how manufactured traffic is marked, hidden, and collected"*. Four things in it bite directly on this scope:

1. **R1 names inbound email as an entry point** the marker must reach — *"form post, inbound email, webhook"*. So the inbound Worker is a marker entry point on day one, not a retrofit.
2. **The derivation rule is strict:** *"in-flight mark where there is one, parent's mark where there is not, never a default of false."* For inbound there's no request context to carry a mark, so **the mark has to ride in the message** — which is exactly what EPIC-13's reserved address namespace is for. That connects two things that were written independently.
3. **DOC-54 §2.4 already names `messages.ts` as carrying `synthetic` in the ticket record.** Migration `0013` is planned against head `0012` — I verified `0012_sending_domains.sql` is current and no `synthetic` column exists yet. Inbound adds message tickets and contact events to what that migration has to cover.
4. **DOC-54 depends on a state EPIC-13 hasn't built.** Its forwarding test resolves by saying the test message *"lands where EPIC-13 already sends unmatched inbound mail — a pending / unidentified state in the contact list."* That state doesn't exist. So the unmatched-sender landing place isn't a nicety in ticket 1 — EPIC-15's design is resting on it.

## Revised shape — four tickets

1. **Inbound end-to-end** — Routing + Email Worker + parse + message ticket + contact event + visible on the contact + **unmatched sender → pending/unidentified** + the synthetic mark from the reserved namespace. *Demo: mail to the domain appears on the contact; mail from a stranger lands in pending.*
2. **Email configuration in Settings** — forwarding table, destination verification, catch-all.
3. **Cutover integration** — the ask, Routing written into the pending zone, the minimum-config floor.
4. **Capture address** — reserved, non-forwarding, files to addressees. *Demo: BCC it, see your sent message on every recipient's log.*

Writing all of this into the epic now, no tickets cut.

Recorded — 159 lines in, the only removals being the timestamp and the three-line REQ-197 paragraph that said the wrong thing about routing (now: new ticket, REQ-197 untouched).

Three things in there I'd point at as more than bookkeeping:

**The correction to this epic's own "what exists today."** That section said outbound exists and delivery events land on the spine — and left a reader to infer the content isn't stored. It is. I've written the correction in rather than quietly fixing it, because someone scoping ticket 4 off the original text would have built something that already exists.

**DOC-54 and this epic turn out to specify the same mechanism.** The gutter needs an in-flight mark on inbound mail and there's no request context to carry one; this epic reserves an address namespace for BFM. Those were written independently and they're the same thing. Worth knowing before either gets built, because it means the reserved namespace isn't optional decoration — it's the only place the mark can enter on that path.

**EPIC-15 is resting on something that doesn't exist.** Its forwarding test resolves cleanly *because* the test message lands in "pending/unidentified" — a state DOC-54 describes as one this epic "already sends unmatched inbound mail" to. We don't. It's in ticket 1 now, but if ticket 1 gets trimmed, that's the thing that can't be trimmed out of it.

And the catch-all call — default **on** through cutover, off for green-field — is written as overriding §"Incoming"'s stated default rather than contradicting it silently. That's the one judgement in this pass I'd most want you to overrule if you disagree, since it's the difference between a spam magnet and a lost-mail incident and I've picked a side.

<!-- xgd-turn id="46a8fe93-1b43-4afa-a17f-168d24724ebe-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T21:47:15.234647+00:00" -->
#### You
Your scope covers most of the contact activity log requirements today. This feature is sort of being pulled in two different directions (1) Lagrange-framework EPIC-1 as an aggregate view of a system log and (2) Your requirements. REQ-235 was written before both.

My guidance - I would like to understand the contact activity log in the context of our overall logging system, it should not stand alone. However, It has its requirements, which are very different from system logging and I am not sure that they mix.

Can you review what REQ-235 says, I am ready to implement it but I want to make sure we understand how it does/does not fit with lf:EPIC-1 and make sure that it can support the requirements that you have

<!-- xgd-turn id="46a8fe93-1b43-4afa-a17f-168d24724ebe-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T21:50:41.442901+00:00" -->
#### Claude
I'll read REQ-235 and the framework EPIC-1 before answering.

Read REQ-235, EPIC-11, lf:EPIC-1 (now revision 8, 1332 lines), the installed `@lagrangefoundry/logging`, and the live `contact_events`/`events.ts`.

## The short answer: EPIC-1 has already decided they don't mix, and said so structurally

Your instinct is right, and it's better supported than you think — **EPIC-1 rules the contact activity log out of its own scope twice, on two different grounds.**

§7 ("Dropping the word audit") names three lanes and puts business events outside:

> *`contact_events`, `site_changes`, `ticket_changes`, `ledger.ts` … It is not a logging problem, so it stays out of scope. **It is a metrics source.***

§42 then makes it a property of the data rather than a policy:

> *`actor` never leaves the raw tier … member behaviour lives in `contact_events` — which means **no permanent tier carries a person, as a structural property rather than a policy one**.*

I verified that's real in the shipped package: `DIMENSIONS` includes `actor`, and the comment in `record.js` says exactly that. So the system log's permanent tiers are per-business aggregates with no person in them, **by construction**.

And §34 names the contact log without realising it. Rollup vs aggregation:

> *Aggregation … output: **a different kind of thing** — a number, a chart, **a `contact_events` row**.*

**So the contact activity log is not a view of the system log and not a tier of it. It is one of the log's aggregation outputs** — the same relationship EPIC-8's traffic charts have. That's what "should not stand alone" resolves to: it doesn't stand alone because it *consumes* the log, not because it lives inside it.

## Why they can't be merged — the differences made precise

Five, and each one alone is disqualifying:

| | system log | contact spine |
|---|---|---|
| **lifetime** | pruned by `(kind, level)` — 7d / 30d / 180d, then rolled up | forever |
| **mutability** | rollup is **lossy and irreversible** (§34) | `UPDATE` refused by the database trigger |
| **grain** | one record per invocation | one row per milestone |
| **audience** | operator and the AI | the *customer*, reading a person |
| **erasure** | expiry — nobody requests it | DOC-37 severance must reach it, which is why `DELETE` is deliberately left reachable on the spine |

The last two are the ones that would actually bite. Merging puts a named person's erasable data into a pipeline whose永 permanent tiers are aggregates — you can't sever an identity out of a rolled-up count, and you can't show a solo trader a customer-facing timeline assembled from a store that's pruning underneath it.

## Where they do meet — one seam, and it's already specified

EPIC-1 §41.5, in full:

> *Member behaviour. Aggregation into `contact_events` — REQ-235's session inference. Its only demand on this design is that raw records carry `actor`/`contact_id` and a `trace_id` for session linkage, and that **the raw window outlives the inference schedule**.*

That's the entire contract. Three obligations fall out, and REQ-235 should state them as its interface to EPIC-1 rather than re-deriving anything:

1. Raw records carry `actor` + `trace_id` — already in `DIMENSIONS`.
2. Raw `info` horizon (30d) ≫ session inference schedule. With the 04:17 cron the gap is ~18h, so this holds with enormous margin — **but the cron is the wrong granularity for your original ask**: a session ending at 10am isn't summarised until the next morning.
3. The durable artifact is the `contact_events` row, not the raw rows. Which is REQ-235's genuine answer to EPIC-1's open Q14.1 (days or months?) — for *this* reader, **hours**.

## What REQ-235 needs before you implement

COMMENT-2905 already diagnosed most of this on 2026-09-14 and it was never applied, because the turn ended on four questions you didn't answer. Re-verified today, still true:

**Stale facts in §1** — three. The cron exists (`crons = ["17 4 * * *"]`, `index.ts:562`, REQ-231), so §3's "first periodic job in the system" argument is dead and closing on a cron is a new caller. `apps/public-site/wrangler.toml` has no `[observability]` block at all — **EPIC-11 inherits the same error**. And `email.received` is inbound, so it's three of nine kinds, not two.

**§2 stops being a store decision.** EPIC-1 §16 kills Analytics Engine on three verified grounds — adaptively sampled at volume, 3-month non-configurable retention, reads cost 4× writes. Sampling is fatal *specifically for you*: §4 refuses to "present a floor as a fact", and sessions inferred from a sampled stream do exactly that one layer down. **D1, bounded, with the `ticket_change_floor` → `reset` pattern AC-2 already names.** EPIC-11's "the raw layer is not D1 by default" is now wrong and should be corrected too.

**§2 stops inventing a row shape.** `@lagrangefoundry/logging` is built and already in the shared store at `../node_modules/@lagrangefoundry/logging` — I verified it's there and that **nothing in 1c imports it yet**. REQ-235's first commit is the first consumer. Retention becomes `horizon(kind, level)`, a policy table and one extra `DELETE` predicate.

**Still blocked on you:** §4/AC-5's per-surface durations. CHAT-53 contradicts your original EPIC-11 ask verbatim, and that's your call, not mine.

## Does it support my scope? Mostly by not touching it — with three exceptions

**Email never uses the raw layer.** Every email fact is a milestone written straight to `contact_events` — `email.sent/delivered/bounced` today, `email.received` next. So EPIC-13 and REQ-235 are independently shippable in either order. That's the good news.

The three places they collide:

**1. `TIMELINE_LIMIT = 100` is about to stop being safe, and `events.ts` says so in its own docstring:**

> *paging it would be a control nobody has asked for over data nobody has enough of.*

Email falsifies that sentence. Every message in both directions lands on the spine, plus a campaign event per recipient per send. A moderately chatty client blows through 100 rows in weeks — and the module already knows this shape of bug, which is why `provenanceOf` is its own query rather than the tail of the capped list. So **EPIC-11 scope item 5 (folding) stops being deferrable presentation and becomes a correctness requirement for reading a timeline at all.** REQ-235 §6 currently pushes it out explicitly. One of us has to own it, and it should be decided before I cut EPIC-13's ticket 1, because that's the ticket that makes the timeline long.

**2. The gutter column is a shared prerequisite, and whoever ships first should land it.** EPIC-11 already owns `synthetic`/`run_id` on `contact_events` and argues — correctly — that it must land *before* anything reads the spine. EPIC-13's inbound ticket writes to the same table through the same `INSERT … SELECT … FROM users` derivation. That's one migration (DOC-54's `0013`, against verified head `0012`), not two. **This is the only real sequencing decision on the table today**, given you're ready to implement REQ-235 and I'm about to cut ticket 1.

**3. A raw event store has no gutter position at all, and that's a new hole.** DOC-54 §2.4 names four tables plus message tickets — it doesn't name a raw log, because none existed when it was written. If REQ-235 lands one, BFM probe traffic writes raw rows, and EPIC-8's traffic aggregates count synthetic hits as visitors. That's DOC-54 §3's named failure — *"aggregates, counts and exports are the ones that get forgotten… the number is wrong in the flattering direction"* — arriving in the one store nobody has applied the contract to.

**And one shared question worth answering once:** where does a fact about someone we haven't identified live? REQ-235 §2 says the raw layer exists *precisely because* `contact_id NOT NULL` can't hold anonymous events. EPIC-13 puts unmatched inbound mail in a pending/unidentified queue on the Contacts tab — no contact, no timeline entry. Same shape of fact, two stores. I think that's correct and should stay — the pending queue is **actionable state with sticky triage**, not a log — but if it isn't written down in both, somebody routes unmatched mail into the raw log or invents a third queue.

## What I'd like from you

1. **Timeline folding/paging — REQ-235 or EPIC-13 ticket 1?** My vote: EPIC-13 ticket 1, since it's the ticket creating the volume and it needs a readable contact page to demo at all.
2. **Migration 0013 (`synthetic`/`run_id`) — who lands it?** Whoever's first; it should not appear in both tickets.
3. The four questions from 2026-09-14 are still open, and §4/AC-5 can't be written without #1 of them (duration).

Say the word and I'll (a) write the interface contract into EPIC-13 — the seam, the three obligations, and the three collisions, and (b) make the REQ-235 §1–§3 corrections and the EPIC-11 store correction. I haven't touched either, since you're about to implement REQ-235 and I don't want to move the body under you.

<!-- xgd-turn id="436346f3-bb9c-41fa-a2f4-5d699ddadf03-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T21:55:51.181401+00:00" -->
#### You
ok please create your ticket 1 and update 235 as you suggest and ref ticket 1 as a dependency

I run installs and migrations tell me what and when and I will run the command for you.

Please check for security updates in your ticket.

<!-- xgd-turn id="436346f3-bb9c-41fa-a2f4-5d699ddadf03-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T22:03:04.504198+00:00" -->
#### Claude
Now writing ticket 1's body.

REQ-267 created. Now revising REQ-235, preserving §4–§6 as they stand.

Now recording the cut in EPIC-13's body.

Done — three writes, all verified intact.

## REQ-267 created (`request-042df82b`) — ticket 1 of EPIC-13

**"Inbound mail, end to end: capture against the contact, pending for a stranger, and the synthetic mark"** — `draft`, priority high, auto-linked as EPIC-13's first child. 12 ACs.

Scope as the epic's cut specified, plus the two items you assigned it. One refinement I made rather than taking the scope literally:

- **Paging is in, folding is out.** I split the seam at **correctness vs presentation** — that a reader can reach every event is REQ-267's (it's the ticket creating the volume); collapsing runs of low-value kinds into a readable row stays EPIC-11 item 5. Taking all of "folding" would have pulled a presentation redesign into an inbound-pipeline ticket.
- **Migration `0013` is split from REQ-267's own tables.** `0013` is DOC-54's contract alone (four tables, `synthetic` + `run_id`); the sender-suppression table for sticky discard is a later migration. That keeps REQ-235's dependency to one additive migration instead of to a whole inbound pipeline.

Verified while writing it, and it shaped the spec: `ForwardableEmailMessage` gives `from`/`to` as the **envelope**, `headers`, `raw` as a stream, `rawSize`, and `setReject`/`forward`/`reply` — **no MIME parser and no DMARC verdict field**. So parsing is ours, and the alignment result arrives as a header whose exact spelling I've marked as "read from current Cloudflare docs before writing the parse" rather than guessed. Tenancy resolves cleanly: `sending_domains` has a unique index on `domain` → `business_id`.

## REQ-235 updated, with REQ-267 as `depends_on`

New **§0** states the EPIC-1 relationship: the contact log is an *aggregation output*, not a tier — with §7, §42 and §34 quoted, the five reasons they can't merge, and §41.5's seam restated as three obligations REQ-235 owes the framework. §1's three stale facts corrected. §2 now consumes `@lagrangefoundry/logging`'s record, picks **D1 with AE rejected on the three verified grounds**, and makes retention a `(kind, level)` band. §3 reopens as "a new caller of the existing cron — but 04:17 daily leaves an 18-hour lag, so it needs a sub-daily expression."

Two things I added that weren't in my summary to you:
- **A redaction position** (§2) — the raw store holds URLs, headers and IPs; EPIC-1 §2/§10 plus the package's B5 enforce it at the sink, not at call sites. New AC-5.
- **The raw store's gutter hole** (§2) — DOC-54 §2.4 names four tables and predates any raw log, so BFM probes would land in EPIC-8's traffic aggregates as visitors. New AC-11.

**§4/AC-5 I did not resolve.** CHAT-53 vs your original EPIC-11 quote is still your call, so per-surface minutes is marked provisional with the question stated, including the solo-trader case. Everything else in §4–§6 stands as drafted.

EPIC-13's body records the cut and the two boundary decisions.

## Security check

EPIC-13's six EPIC-17 clauses all trace into REQ-267 §11 as a table. Two things the existing notes didn't cover, now in the ticket:

**§9 — rendering captured mail is a new untrusted-content surface.** REQ-267 is the first ticket that displays anonymous input inside the builder. A stranger's HTML body rendered on the origin holding an operator session is stored XSS with an email address as the delivery mechanism — EPIC-17 F1's shape through a different door, and F1's writeup is about *uploaded* bytes, so nothing currently covers it. Bodies render inert, remote images don't load by default (read-receipt beacon + operator IP disclosure). AC-12 asserts it.

**§3 — tenancy from the envelope recipient, never the `To:` header.** A message can be Bcc'd to us with `To:` naming another business entirely. AC-2 asserts it.

**One live issue, outside the ticket:** `apps/control-app/.dev.vars~` is sitting untracked in the working tree, and `.gitignore` has `.dev.vars` and `.dev.vars.*` — **neither matches the tilde suffix**. That's an editor backup of a secrets file one `git add -A` away from a commit, and it's EPIC-17 F8's exact hygiene item. Want me to widen the pattern to `.dev.vars*` and delete the backup? I haven't touched it — it's your file and I don't know if it holds something you still need.

## What you'll need to run, and when

**Nothing yet.** No code exists, so no migration and no install.

- `@lagrangefoundry/logging` needs **no install** — it's already resolvable in the shared store at `../node_modules/@lagrangefoundry/logging`. Verified, and nothing in 1c imports it yet.
- **Migration `0013`** will be REQ-267's first commit. I'll write the file and hand you the exact `wrangler d1 migrations apply` line — local first, then production — once it's written.
- REQ-267 will need a **MIME parser dependency** (Workers-compatible, since `raw` is a stream and the platform gives us nothing). I'll name the exact package and the install command before coding rather than picking one now.

Next step is `xgd branch cut REQ-267` and the migration. Say go and I'll start with `0013` alone, so REQ-235 is unblocked before the rest of the inbound work lands.

<!-- xgd-turn id="0377589e-ba66-4b16-93b9-8396f12fdd31-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T22:10:26.295808+00:00" -->
#### You
You are an EPIC session - you create and watch the children - they do the coding

Please also check for BFM changes (EPIC-15)

<!-- xgd-turn id="0377589e-ba66-4b16-93b9-8396f12fdd31-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T22:13:19.889974+00:00" -->
#### Claude
Understood — I create and watch; children code. That changes my next step, and I'll correct it below.

Three BFM findings, one of them a blocker. Updating REQ-267.

Noted and saved — I'll stop at "the child is ready to be picked up". My "next step is `xgd branch cut`" line was out of role; that's REQ-267's session, not this one.

## BFM check — three findings, one of them a blocker

**1. Migration `0013` is claimed by three epic bodies and owned by no ticket.**

- **EPIC-11**: *"What this epic owns: the `synthetic` and `run_id` columns on `contact_events`, landing before REQ-235 builds anything that reads them."*
- **EPIC-15** §Children: its **first code child** is *"four things rather than three: the signed marker, the `synthetic` column, the default-excluding read handle, **and the reaper**"* — and adds *"it does not start until EPIC-10 is working and tested."*
- **REQ-267**, as of my last turn.

EPIC-15 has cut no code child; only DOC-54 exists. So the migration everyone agrees is urgent is filed nowhere.

**2. The gate behind it is real, and EPIC-15's read of it is stale.** EPIC-15 §6 records EPIC-10 as *"done, REQ-240–245 reconciled"*. All six are **`ready_to_reconcile`**, not reconciled. If `0013` rides EPIC-15's bundle, then **REQ-235 and REQ-267 are both transitively blocked on EPIC-10's reconciliation** — a chain neither ticket knew it was in an hour ago. EPIC-15's body needs that correction; it isn't mine to edit.

I've recorded the collision and the gate in REQ-267 rather than quietly claiming the migration, with the split it assumes stated as *pending your decision*: **a column is not the gutter**. `0013` is one additive migration that unblocks two epics and is cheapest now, which is EPIC-11's own argument; the four *mechanisms* stay EPIC-15's and stay gated. If you refuse the split, REQ-267 drops `0013` and both it and REQ-235 move their dependency onto EPIC-15's child.

**3. A real spec gap the reserved-address channel has, and DOC-54 doesn't cover.** §2.1 rejects a marker that is *"unsigned, malformed, or outside its time window"* — but an email local part is an unsigned bearer string, so **two of those three checks have no carrier on the inbound path**. A run id travels through SMTP hops and spam filters in the clear; without a window it becomes a permanent make-my-mail-invisible token for anyone who ever saw one. REQ-267 now requires the run id to **name a run that exists and is still open**, with unknown/closed/expired all degrading to real. That leg depends on EPIC-15's run registry; the never-forward half doesn't (an address matching the reserved pattern is reserved regardless), so it ships either way.

Also folded in: synthetic attachment blobs now take DOC-54 §2.5's **reserved key prefix**, not just the message prefix — a bucket has no `WHERE` clause and the reaper's sweep is a prefix listing. REQ-267 is at 13 ACs; the new ones cover the degrade-to-real cases and the blob prefix.

## State of the children

| | |
|---|---|
| **REQ-267** `draft` | Ready to be picked up **except** for the `0013` ownership call. Everything else is specified. |
| **REQ-235** `draft` | `depends_on: REQ-267`. Blocked on §4's duration question (CHAT-53 vs your original ask) before AC-5 can be written. |
| Tickets 2–4 | Not cut. I'll cut them as REQ-267 gets picked up, unless you want them earlier. |

## What needs you

1. **Does `0013` split from EPIC-15's bundle?** My recommendation is yes — column now, mechanisms gated. It's the one decision standing between REQ-267 and being picked up.
2. **REQ-235 §4's duration question** — still open from 2026-09-14.
3. **`apps/control-app/.dev.vars~`** — still untracked and still not matched by `.gitignore`'s `.dev.vars` / `.dev.vars.*`. EPIC-17 F8. Want me to widen the pattern and delete the backup, or is that file yours?

**Nothing to install or migrate yet** — no code exists. When REQ-267's session writes `0013` it'll hand you the `wrangler d1 migrations apply` line; `@lagrangefoundry/logging` needs no install at all.

<!-- xgd-turn id="33cd6494-addd-40cd-88d7-00e5f2de8e21-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T02:07:50.108554+00:00" -->
#### You
ok lets talk about what we have. I am looking at Lagrange Foundry, Settings tab and I just clicked "Send email from this domain" and got this message: ✗ Sending from your own domain is not available on this deployment, so the toggle would change nothing. Your website is unaffected.

What does that mean?

<!-- xgd-turn id="33cd6494-addd-40cd-88d7-00e5f2de8e21-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T02:09:33.170645+00:00" -->
#### Claude
That message is REQ-264's runtime half working exactly as designed — it's the replacement for the raw Resend error you hit while scoping that ticket (`✗ Resend refused GET /domains (401). This API key is restricted to only send emails`).

**What it literally means:** this deployment has no Resend credential that can *manage domains*, so turning the toggle on would fail. Rather than let you press it and get a provider error, the surface refuses up front and tells you the one thing you'd care about — your site is untouched.

There are exactly two ways to get there, and they're indistinguishable in the message by deliberate design (`domains.ts:359` — "one sentence, in our words, for every way of getting there"):

1. **No key at all** — `resendFor()` returns `null` when `RESEND_API_KEY` is empty (`resend.ts:311`).
2. **A key Resend refuses for domain management** — `canManageDomains()` does a real `GET /domains` on every read of the domain state and returns false on 401/403 (`domains.ts:318`). That's the sending-access-key case.

**Which one you're seeing depends on where you're looking.** If that's your local `bin/1c` dev server, it's cause 1 and it's certain: `apps/control-app/.dev.vars` has no `RESEND_API_KEY` line at all, and wrangler.toml deliberately doesn't carry it (`# THE CREDENTIAL IS NOT HERE. RESEND_API_KEY is a wrangler secret`). Locally that toggle can never be available unless you add the key to `.dev.vars`. If it's the deployed control app, it's cause 2 — the pushed secret is still a **Sending access** key, and you need a **Full access** one.

**One thing the message rules out, which is useful:** it is never a transient. `canManageDomains()` returns `true` when Resend is merely unreachable — explicitly, so a slow provider doesn't take a working capability away from a customer. So seeing this means the credential really is absent or really is scoped wrong; it doesn't mean Resend was having a moment.

**How to tell for certain on the deployed side:** `bin/deploy` now probes this and writes a capability row for `RESEND_API_KEY` — `works, but only for SENDING` is the exact line for cause 2. The report is per-run, so it's the next deploy's output rather than something I can read now. `npx wrangler secret list` from `apps/control-app` will tell you whether the secret is present, though not its scope.

Nothing here is a defect and nothing needs changing — REQ-264 is `free_coded` and this is its intended behaviour. The only open question is which cause applies to the surface you're looking at.

<!-- xgd-turn id="3da39539-1ad5-4f0f-a6f3-b103f3e1018c-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T02:34:40.430663+00:00" -->
#### You
Surely the domain is owned by Cloudflare why dopes resend need credentials to change domain

<!-- xgd-turn id="3da39539-1ad5-4f0f-a6f3-b103f3e1018c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T02:35:09.527556+00:00" -->
#### Claude
Two different things are being confused by the word "domain" — and the code splits them cleanly.

**Cloudflare owns the zone. Resend owns the sending identity.** We never ask Resend to change DNS; it has no access to your zone and couldn't write a record if it wanted to. Cloudflare does every write, through `CLOUDFLARE_DNS_TOKEN`. What Resend is asked for is something Cloudflare cannot produce.

Look at what `enableSending` actually does (`sending.ts:263`):

```
const registered = await resend.createDomain(domain)   // Resend
const specs = toSpecs(registered.records)              // → Cloudflare specs
...                                                     // we write them into the zone
await resend.verifyDomain(registered.id)               // Resend
```

`createDomain` **returns the records**. That's the crux. We don't know what to write until Resend tells us, because:

- **The DKIM record is a public key whose private half only Resend holds.** `resend._domainkey.<domain>` publishes a keypair that Resend mints per domain and signs your outgoing mail with. Cloudflare can publish any string you hand it, but it cannot invent a key that Resend will sign with. That record's *value* can only come from Resend.
- **The return-path `MX` on `send.<domain>` points at Resend's infrastructure**, and Resend has to be expecting mail for that subdomain — bounce handling for your domain has to be provisioned on their side.
- **Authorization to use the From address.** Even with perfect DNS, Resend will refuse `no-reply@yourdomain.com` unless that domain is registered on your Resend account. SPF authorizes Resend-the-service to send for you; the account registration authorizes *your* account specifically. Otherwise anyone with a Resend key could send as anyone who'd published the SPF record.
- **`verifyDomain` / `readDomain` are the third wait.** Resend does its own resolver check that the records landed, and its verdict — `pending` / `verified` / `failed` — is the state the toggle reports. That's a fact that lives only at Resend.

So the split is: **Resend generates and verifies, Cloudflare publishes.** Two credentials, two jobs. The message you hit means the Resend half is unavailable — we could write the records into your zone perfectly well, but they'd be records for a sending identity that doesn't exist, pointing at a DKIM key nobody holds. Mail from them would fail SPF/DKIM at the receiver and land in spam, which is worse than not offering the toggle. Hence the refusal up front.

<!-- xgd-chat-end -->