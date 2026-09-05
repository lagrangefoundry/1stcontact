---
uid: request-46f2245a
id: REQ-187
type: request
title: Session renewal and mid-session denial — the start of a conversation
created_by: xgd
created_at: '2026-09-05T19:26:36.232349+00:00'
updated_at: '2026-09-05T19:26:36.232349+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
---

# Session renewal and mid-session denial — the start of a conversation

**This ticket is a conversation, not a specification.** Nothing here is decided.
It exists so the question has a home and does not get answered by accident inside
a bug fix. [[BUG-52]] covers what a *reload* does with a lapsed session and is
deliberately narrow; this is the question of why a session lapsed under someone
who was working.

## The requirement, as stated

Being denied access mid-session is not acceptable for a person who is actively
engaged. Re-login by email is significant friction and must be infrequent.

Both are product constraints rather than security preferences, and they pull
against the instinct that a shorter session is always safer. The purpose of the
conversation is to find where the line actually sits for this product and this
customer.

## One fact that reframes it

`admit` runs on **every request**. `users.status`, membership and entitlement are
re-read per call, so revocation from the Users tab is already immediate and does
**not** depend on the Access session being short.

This matters more than it first sounds. The usual argument for short sessions is
bounding the damage of a stolen cookie — and here that damage is already bounded
by a control we hold and have exercised. Session length and revocation latency
are coupled in most systems and are not coupled in this one.

## Two dials, and they are not equally important

**Session duration** is a Cloudflare Access application setting — thirty minutes
to a month, or tied to the identity provider's own session. It lives in the
Cloudflare dashboard rather than this repository; `apps/control-app/ACCESS.md`
is where such settings are recorded.

**Which identity provider** is the larger lever, and probably the whole answer.
One-time-PIN email is the highest-friction option available: every re-auth is a
code, in a mailbox, retyped. A conventional IdP makes re-auth a *silent
redirect* — the IdP session is long-lived and the person sees a flicker rather
than a login. For the modal customer, a tradesperson on a phone, "check your
email for a code" every few days is the shape of thing that loses accounts.

## Initial thoughts, offered to be argued with

- **A long Access session plus a real IdP**, keeping one-time PIN only as the
  fallback for someone with no other identity. This is where I would start.
- **Step up on destructive actions rather than shortening the session.** Erasure
  ([[DOC-37]]), billing changes, transferring or deleting a business. Re-auth
  where it is rare and consequential is better security than a short global
  session and costs almost nothing in friction.
- **Renewal before expiry, not recovery after it.** If the client knows roughly
  when the session ends it can prompt — or silently probe — while the person is
  still working, rather than discovering it at the moment of a save. This is the
  part with real design content, and the part most likely to be got wrong.
- **Decide what "actively engaged" means.** Keystrokes, an open chat turn, an
  unsaved draft? The requirement above depends on a definition nobody has written
  down, and an idle tab held open for a week is not the same as a person typing.

## Questions this needs answers to

- What is the Access application's session duration today, and what should it be?
- Is a conventional IdP acceptable for the customer base, or is email the only
  identity they reliably have?
- Which actions deserve step-up, if any?
- What happens to unsaved builder state across a renewal — does the design
  guarantee it survives, or merely try?
- Does the recursion apply? Level-2 members reach a portal on the customer's own
  site ([[DOC-42]] §1), which is not behind our Access application at all. A
  session policy that only describes level 1 answers half the product.

## Not in scope here

The client's behaviour when a session has *already* lapsed — that is [[BUG-52]]
and should land first, because a session will expire eventually under any policy
this conversation arrives at.
