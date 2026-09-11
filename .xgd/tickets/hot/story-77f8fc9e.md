---
uid: story-77f8fc9e
id: STORY-142
type: story
title: 'Guarded Retrieval: Material Fetched On The Client''s Behalf, And What It Is
  Recorded As'
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:40:46.962006+00:00'
updated_at: '2026-09-11T04:58:06.292213+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-87be4669
  capability_uid: capability-20802191
  story_kind: feature
  story_points: 2
---

## Story

**As a** client of the caretaker platform, **I want** the material the platform pulls in on my
behalf to be fetched only from real public web addresses, and to be recorded as somebody else's
work that I may not republish, **so that** asking for an article never turns my assistant into a
way into the platform's own private network, and nothing we retrieved for me can end up
published under my own domain.

## Description

The platform's second ingestion entry point takes an address rather than a file: background
material we retrieve for the client — an industry report, an article. The address arrives from a
conversation, so it is untrusted input on two separate axes, and this story owns both.

**Where we are willing to go.** A retrieval happens only over a secure web address. Addresses
that mean something only from inside the network the platform runs in — loopback, the private
blocks, link-local (where the cloud metadata service lives), carrier-grade NAT, their IPv6
equivalents, and the conventional private-zone names — are refused. Crucially the check is
applied at **every hop**, not only to the address the client named: a public address is free to
redirect to the metadata service, and a guard that only ever sees the first address is not a
guard. A redirect chain is bounded rather than followed forever, and a body larger than the
per-file ceiling is refused even when the remote server's declared size claimed otherwise,
because that declared size is the remote server's claim about itself.

**What the retrieved material then is.** A permitted retrieval yields the bytes, the content
type, and the address the bytes *finally* came from — the last hop, which is what the material's
provenance records, because naming an address we were redirected away from would be a provenance
record that is quietly wrong. The material lands **third-party, never republishable, exportable,
and as background for the assistant to read rather than something to put on a site**. That
recorded provenance is the untrusted marking: what came back is not a response that stops at a
response, it becomes corpus the assistant reads, so an entirely legitimate public address may
still return content written to be read by an AI. The address guard cannot cover that case; the
rights record can, and it is what stands between retrieved third-party copyright and the client's
own published domain.

**An address the guard refuses never becomes material.** Every refusal in this story leaves the
account's material exactly as it was and is reported as the caller's problem rather than a server
failure, in words a non-technical client can act on.

**In scope**: the address guard (scheme, private-address and per-hop redirect rules, the redirect
bound, the size bound), what a permitted retrieval returns, the provenance and rights the
retrieved material is recorded with, and the refusal behaviour of the retrieval entry point.

**Out of scope**, each covered by its own story: the ingestion pipeline the permitted bytes then
travel through — storage, record creation, the index announcement (STORY-140); how the retrieved
file is described; the gate in front of promoting material into a site's public asset library;
the declared field vocabulary the record is written in; and a *rendered* retrieval (a browser, a
settle, a screenshot), which is a capture — a different artefact with a different shape and its
own intent.

## Technical Context

- This story is the guard and the provenance in front of STORY-140's pipeline: the bytes a
  permitted retrieval returns converge with the upload path immediately afterwards, and
  everything after that convergence is STORY-140's and the description story's. The upload
  path's rights criterion defers the inverted-bits case to this story by name.
- The two distribution bits invert between the two entry points and neither derives from the
  other: a client upload is republishable and not exportable; retrieved background material is
  **not** republishable and **is** exportable — a third-party public document is what a
  cross-client corpus may learn from precisely because it is not the client's own business.
- The refusal is a *client* error, not a permission: the request is not malformed in a way the
  caller could be granted their way out of, so it is reported alongside the address that was
  refused. This is deliberately distinct from the promotion gate's refusal, which is about
  rights and is reported as forbidden.
- **Known limit, recorded rather than implied**: the address check is applied to the literal
  address. A hostname that resolves to a private address defeats it, and the platform's edge
  runtime cannot resolve a name before fetching it, so the check cannot be made complete from
  inside it. The intent records this as an open question and closing it needs a resolver the
  platform does not offer. No criterion here claims the guard is complete against name
  resolution, and none should be added until such a resolver exists.
- Security-policy relationship: the platform-level SSRF concern named in the architecture and
  security policies is what the address rules implement; the prompt-injection half is carried by
  the rights and provenance record rather than by the network guard.

## Reconciliation Decisions

- **The untrusted marking is the provenance record** (decided at reconciliation, 2026-09-10):
  REQ-163 asks to "mark fetched material untrusted in the manner [[DOC-10]] §5.2 already requires
  for retrieved content" without naming a mechanism. The landed code carries no separate
  `untrusted` flag: the marking is `origin: fetched` + `rights: third_party` +
  non-republishable, and the implementation states in as many words that this is where that half
  lives. Formalized in that observable form as AC-1706, because those three values are what any
  surface or tool can actually read. How retrieved content is delimited *where it enters the
  assistant's context* is the assistant's knowledge surface, not this ingestion path, and is not
  asserted here.

- **Non-web and malformed addresses are refused with the non-secure ones** (decided at
  reconciliation, 2026-09-10): the intent names only "non-HTTPS". The landed guard refuses
  `file:`, `data:` and anything that is not parsable as an address at all, through the same
  refusal. Formalized as part of AC-1700 because an allowlist of exactly one scheme is a stronger
  and more durable claim than a denylist of `http:`, and because the alternative — an
  unparsable string reaching the retrieval at all — has no defensible behaviour.

- **A retrieval that brings back nothing usable creates nothing** (decided at reconciliation,
  2026-09-10): the intent is silent on a remote error status, a redirect that names no
  destination, and a permitted retrieval whose body is empty. The landed guard refuses all three,
  each in the client's own words and with nothing left behind. Formalized as AC-1707 because each
  is a real outcome of pointing at a real address, and because the alternative — material with no
  bytes, or a redirect chain abandoned silently — would create exactly the permanently unfindable
  record every other refusal in this pipeline exists to avoid.

- **The recorded content type carries no parameters** (decided at reconciliation, 2026-09-10):
  the intent does not mention the charset and other parameters a remote server attaches to its
  content type. The landed guard records the type alone. Formalized as part of AC-1705 because the
  kind of a file is classified from that value downstream, and a type carrying a charset would
  match nothing in the closed kind vocabulary — the classification would silently degrade rather
  than fail.

- **The address check is scoped to the literal address, deliberately** (decided at
  reconciliation, 2026-09-10): AC-1701 asserts the address families that are refused and that
  ordinary public addresses are permitted. It does **not** assert completeness, because REQ-163
  records the name-resolution gap as an open question with a stated reason. Stating the guard as
  complete would be the more dangerous error of the two.

## Dependencies

STORY-140 (the ingestion pipeline) — the bytes a permitted retrieval returns are ingested by that
pipeline, and the recorded material is observable only through it. The guard's address rules and
its refusals are observable independently.

## Story Points

2