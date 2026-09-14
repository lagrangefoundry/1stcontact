---
uid: request-7c513b4a
id: REQ-244
type: request
title: 'The gated page: a per-contact link, and what they did with it'
created_by: EPIC-10
created_at: '2026-09-13T22:02:50.801812+00:00'
updated_at: '2026-09-13T22:02:50.801812+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  depends_on:
  - request-41a9dc90
  - request-a0910456
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-e410b03e
---

# The gated page: a per-contact link, and what they did with it

The mail carries a hard-to-guess link to a page listing the artifacts the form promised,
and arriving there — and taking each paper — is recorded against the contact.

## 1. What is true today

**There is no gated page and no artifact store for one.** `assetUrl` is a free `url` an
author types; nothing serves it, nothing gates it, and [[CHAT-56]] recorded that no PDFs
exist in either repo — the papers are ticket bodies.

**Nothing records what a contact does.** `asset.sent` says we sent it. Whether anybody
opened it, came back, or took one paper and not the other is not recorded anywhere.

## 2. The link is per contact, and that is what makes the tracking possible

A single unguessable URL to an artifact cannot say WHO followed it: everyone who gets the
mail gets the same link. So the link is minted **per contact per form**, and the
attribution is the reason for it rather than a side benefit.

**It does not expire.** Delivery is at-most-once ever and [[REQ-223]] deliberately refuses
a public re-send path, so an expired link is a dead end at exactly the thing the contact
came for. What the token protects is a whitepaper, and the tracking is worth more than the
secrecy.

**It is NOT a credential, and nothing may make it one.** A sign-up link creates a member
and therefore expires and is single-use, which is what `login_tokens` already does. This
one identifies a contact for the purpose of recording a visit and unlocking a download,
and grants no session and no access to anything else. The two kinds of link have opposite
rules and must not be built from one mechanism.

## 3. It is a GET, and public-site keeps its character

`apps/public-site/src/index.ts` states that it serves pages and receives nothing, and
[[REQ-223]] amended that for exactly one path and one method. **This ticket amends nothing
further**: a gated page is a `GET`, and so is a download.

There is deliberately no beacon and no client-side timer. The server timestamps what it
receives, which is enough: for a thin page whose only content is the download links, the
interval between arriving and taking a paper is the engagement signal a dwell timer would
have been approximating — and it is a measured fact rather than a lower bound.

## 4. What is recorded

**`page.accessed`** — every arrival, not only the first. "They came back on Thursday" is a
real signal and the spine is built to hold facts rather than a deduplicated summary.

**`asset.downloaded`** — one per artifact actually fetched, naming which one. This is the
conversion, and with a set of papers it is the only thing that says which they wanted.

**Both go straight into `contact_events`.** They are milestones and there are a handful per
contact, so they need no rollup. [[EPIC-11]] owns the raw activity log and the session
summary; when that arrives these keep working unchanged and the rollup handles the noisy
kinds it was built for.

## 5. The artifacts

The bytes are site assets — `site_assets` plus R2, which is where every other artifact a
site owns already lives. Nothing new is invented to store a PDF.

**The real papers still do not exist.** As [[REQ-223]] said of delivery: build against the
asset as an abstraction, prove it with a fixture, and leave the files to the content work.

## 6. Controls

The same assumption [[REQ-223]] was written under — the caller is hostile and scripted, and
CORS constrains nobody.

- An unknown, malformed or revoked token is refused, and the refusal is identical for all
  three so the endpoint is not an oracle for which tokens exist.
- The token names the contact. Nothing in the request may assert one.
- A download is reachable only through a valid token for a form that promised that asset —
  so a token cannot be walked sideways into another business's artifacts.
- The page is `noindex`, and unlinked is not a control.

## 7. Acceptance criteria

1. A mail's link opens a page listing exactly the assets its form promised, and no others.
2. Arriving records one `page.accessed` against the right contact; arriving three times
   records three.
3. Taking one paper records `asset.downloaded` naming that paper, and taking the second
   later records a second event naming the other.
4. Two contacts who were sent the same form receive different links, and each one's events
   land on that contact.
5. An unknown, malformed or revoked token is refused with a response byte-identical to the
   other two.
6. A token grants no session, and reaches nothing but its own page and its own assets.
   Asserted by attempting to reach another business's artifact with a valid token.
7. The interval between `page.accessed` and `asset.downloaded` is derivable from the stored
   timestamps, and no duration is stored as a measurement.
8. `public-site` still answers `405` to every method and path outside the one [[REQ-223]]
   opened; the additions here are `GET` only.