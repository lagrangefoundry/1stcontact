---
uid: comment-0d5b0218
id: COMMENT-2930
type: comment
title: Comment on chat CHAT-53
created_by: CHAT-34
created_at: '2026-09-13T23:36:21.346791+00:00'
updated_at: '2026-09-13T23:36:21.346791+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: chat-462d975e
  kind: chat_transcript
---

<!-- xgd-turn id="bb8dcf7b-a09a-48c4-bb14-61bf088ad4bb-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T23:21:37.619758+00:00" -->
#### You
I am torn here and need to discuss a privacy issue

From the site owners perspective, understanding how often a user has visited the site, what features they use and for how long is very valuable. For 1c it is critical to help us understand where users are getting stuck which features are not working for them - which users are likely to churn and why.

I have worked on sites that gather all that info and use it in those ways, and in general I don't think users are too uncomfortable with the use of their data in aggregate.

The contact event log is different - the concept is that this is visible to the site owner on the site. When alice looks at bob's contact she can see that he was working on his site for three hours last night and he spent 30 minutes trying to configure his DNS. Now this is not a dating site or a social media site or a therapy site. For the most part for Alice to know those things about Bob is a bit like Alice knowing that Bob came into her store to pick up some plumbing supplies. On the other hand none of the places I have worked exposed per-user behavior to administrators in an easy to use interface - the data was there if you did a query.

So, how do we feel about this feature? What are the down sides - will users freak out if they learn the site owner has access to that kind of data about their use?

<!-- xgd-turn id="bb8dcf7b-a09a-48c4-bb14-61bf088ad4bb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T23:23:03.060869+00:00" -->
#### Claude
This is a real tension, and I think your instinct that something is different here is right — but I'd locate the difference somewhere other than "aggregate vs. individual."

## Where the line actually falls

The shop analogy holds for the *observation* and breaks on the *record*. In the store, Bob knows Alice can see them, the visibility is mutual and momentary, and nobody writes down "stood in front of the toilet-repair shelf for 30 minutes looking baffled, Tuesday 23:40." A scannable, durable, timestamped timeline is a different artifact from being seen. That's Nissenbaum's contextual-integrity point, and it's the one users actually react to.

More usefully, the feature is two different things welded together:

- **"Bob hit DNS config three times and bailed each time."** This is about your product. It is legitimately Alice's business, it's the reason the feature is valuable, and nobody will object to it.
- **"Bob was working from 21:00 to 00:20 last night."** This is about Bob. Duration and clock-time are where the life-inference lives: works weekends, up at 2am, went dark for two weeks in March. Alice has no business need for it, and it's the part that produces the visceral reaction.

Almost all the value is in the first axis and almost all the risk is in the second. That's the design lever.

## Will users freak out?

Mostly no — right up until one of them does, publicly. B2B precedent is strongly in your favour: Intercom, Pendo, Vitally, HubSpot all surface per-user activity to operators and users have normalised it. The failure mode isn't gradual discomfort, it's tail-shaped: a single screenshot captioned "my vendor can see exactly when I work." And the trigger is nearly always *discovery*, not *use*. People forgive what they were told; they don't forgive being blindsided.

One thing that materially changes the answer: **is Alice an organisation or a person?** A vendor's customer-success team reading an activity feed is boring and expected. Another individual — a peer, a landlord-shaped relationship, anyone Bob might meet socially — is a different emotional object entirely, even with identical data. If 1c's Alice is often the latter, weight everything below harder.

## What I'd actually do

Ship it, but reshape it around purpose rather than capability:

1. **Keep events, drop the clock.** Show "hit DNS errors 3× this week," not "23:40–00:12." Round timestamps to day granularity in the operator view. Session duration: don't surface it at all, or bucket it coarsely. You lose ~nothing diagnostically.
2. **Cap retention on the per-contact view** — 30–90 days. Keep the aggregate/analytics stream longer under its own rules. A dossier that goes back two years is a qualitatively different thing from a recent-activity panel.
3. **Tell Bob plainly, outside the privacy policy.** One visible sentence at signup, in the product's own voice. This is most of your reputational protection and it's nearly free.
4. **Give Bob the same view of themselves.** This is the highest-leverage move available. It converts a liability into a feature (their own work history), makes the disclosure self-evidencing, and gives you a clean internal test: if you're not willing to show Bob exactly what Alice sees, don't show it to Alice.
5. **Never surface derived judgements on a person's record.** Churn-risk score, "struggling" badge, engagement grade — the moment a human reads a classification *about a person* rather than an observation, you're somewhere else. Keep those in the aggregate cohort view where they belong.

Also worth pricing in: GDPR makes this personal data and profiling-adjacent regardless of who can see it. Since Bob can subject-access it anyway, "we hold it but hide it" isn't a privacy posture — it's obscurity with the same legal surface and worse optics when found.

## The compressed version

*Did they get stuck* is about your product and Alice should see it. *When were they there* is about Bob and mostly isn't Alice's business. Split the feature on that line, disclose it in one plain sentence, and show Bob the same panel — and I think this goes from a thing you're uneasy about to a thing you'd happily demo.

Want me to write this up as a design ticket, or as a doc ticket you can point implementation at later?

<!-- xgd-chat-end -->
