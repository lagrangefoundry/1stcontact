---
uid: chat-4ddcde8c
id: CHAT-12
type: chat
title: XGD website copy
created_by: xgd
created_at: '2026-07-30T20:42:45.219423+00:00'
updated_at: '2026-07-30T23:06:48.807674+00:00'
completed_at: null
last_field_updated: body
status: open
fields: {}
---

## Session record — xgd.dev copy pass

### DOC-9 rewritten first (xgd-biz, `doc-d27f58f5`)

The positioning keystone had drifted from the product *and* from its own downstream papers.
It described XGD's original conception — spec in at the top, validated code out at the bottom.
That is now the **secondary** mode. DOC-4 §Wave 3 and DOC-5 §4 had already moved to the current
position; the keystone was the stale one.

Revised: §1 core message (**"XGD makes generative development safe without making it slow"**),
§2 spine (governance runs *behind* you, not in front), §2.1 new (two modes, cadence as
positioning, the route-around argument), §3 (Kubernetes analogy strengthened — reconciliation is
literally an async background controller), §5 (the qualify-out tension cadence language creates),
§6, §7, §8 (split into three proof assets), §10.

**§6 is the load-bearing correction:** never say "out of the loop" bare. It is the *coding* loop.
The human stays in **product design, architecture and QA**. Unqualified, the phrase says the human
has left the project — untrue, and it hands the magic-wand audience exactly the reading §5 exists
to prevent. Rules added to both the do and don't lists.

Regression benchmark framing fixed per operator: one regression per two tickets is **the error
rate to expect from structured vibe coding as a practice**, not a defect XGD introduces. Our claim
is the instrument and the repair, not the rate. §10 forbids quoting it unframed.

### Page rewritten against it

`storage/sites/xgd/draft/pages/home.json` — 31 text slots, copy only, no structural change.

- **Hero sub** now leads on cadence ("Work at conversational speed. Behind you, XGD…"), then
  mechanism, then ownership. Was pure mechanism.
- **Problem** retold as the trap rather than a list of complaints: fast breaks quietly →
  discipline costs cadence → so you route around it. Sets up the answer instead of restating
  the pain three times.
- **How** is now the loop, not a static description of the matrix: you build → XGD reconciles →
  the record can't go stale → regressions get repaired. Carries the benchmark, framed.
- **Proof** gains the numbers (9 months, 1 person, 130k/300k, zero lines read) and the
  **abandonment story** — built autonomous-first, then noticed we were avoiding it. Previously
  unused in any material.
- **Contract** corrected: it described autonomous mode. Headline is now *"You're out of the code.
  Not out of the project."* Columns match DOC-9 §6 exactly.
- **Close/signup**: waitlist is primary, both papers named.

### IA fixes

`id="papers"` was on the **Proof** section, so the nav "Whitepapers" link and the hero's secondary
CTA both landed on a section with no paper in it. Renamed to `proof`. Papers are email-gated now,
so nav "Whitepapers" → `#signup`; hero secondary is *"See the evidence"* → `#proof`, giving
sceptics a non-committal path while ready readers take the primary CTA.

Also softened "the ninety thousand **already there**" → "**it wrote last month**". The original
invited brownfield readers that DOC-7 says we cannot yet serve.

### Open

- **Mailing-list opt-in is not on the page** — `contact-form` supports `text|email|tel|textarea`
  only (`packages/framework/src/modules/contact-form/meta.ts:48`). A checkbox is behavioural, so
  it belongs as a `config` addition to the module. Needs its own ticket.
- **Whitepaper delivery has no artifact and no backend.** No PDFs exist in either repo; the papers
  are ticket bodies. `/api/lead` does not exist. Deferred by the operator as "easy mechanics".
- **Candidate L1 gap:** a text leaf carries one style, so the two paper titles run unemphasised
  inside the sentence. No way to mark an inline run without splitting the node and losing the
  flow. Same family as the REQ-95 gap list.
- **Structural, not done:** section shape is still eyebrow → headline → paragraph → grid, six
  times; the proof section is still small for what it carries. Both are layout work, not copy.
- DOC-5 §4 is titled "Three Modes of Working" and describes two.


<!-- xgd-chat-end -->