---
uid: request-2bd9d184
id: REQ-175
type: request
title: The consultant gets the whole of L1, and keeps getting it
created_by: xgd
created_at: '2026-09-02T20:48:58.308743+00:00'
updated_at: '2026-09-02T20:48:58.308743+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 13
  auto_merge_back: true
  needs_review: false
---

# The consultant gets the whole of L1, and keeps getting it

## Why

The consultant must be able to express anything the reproduction path can
express. Reproduction is where L1 grows: we add vocabulary because a founder
site needed it, and the importer starts emitting it the same day. If the
consultant's surface does not grow with it, every capability we add makes the
gap between "what a captured site can look like" and "what a client can be sold"
one feature wider.

That gap is not hypothetical. In the session behind [[CHAT-35]] the consultant
spent most of an hour concluding that text over a background image — the single
strongest "expensive vs template" tell in [[DOC-17]] — was impossible, and told
the operator it needed to be built. It was already built. The reproduction of
gigabytealchemy.ai does it on the home page:

```json
{ "kind": "box", "id": "section-bg-0",
  "axes": {
    "backgroundImageUrl": "/assets/AlchemistLabWithTech.png",
    "overlay": { "color": { "ref": "slate", "shade": -0.599 }, "opacity": 0.3 }
  } }
```

The consultant could have written that node. It did not know the field names,
and the way it found out — refusal by refusal — never reached them.

## Two different failures, and only one is a capability gap

**Most of L1 is already reachable and was merely unknown.** `set_l1` replaces a
node with an object validated against the full element schema, so every axis the
importer emits — `backgroundImageUrl`, `overlay`, `objectFit`, `objectPosition`,
`gapPx`, `surfaceFill`, `gradientFill`, `geometry`, `responsive` — is writable
today. That half is a knowledge problem and is [[REQ-176]]'s to fix.

**The page document itself is genuinely unreachable.** `l1DocumentSchema`
(`packages/site-schema/src/l1/schema.ts`) is:

```
{ widths, background?, textColor?, resources?, column?, root }
```

`set_l1` addresses a roots array that is literally `[l1.root]`
(`tools/generate/src/cli/edit.ts:400-416`), so path `"0"` **is** `root` and the
other five keys have no path at all. No tool writes them: `update_page` writes
only `title`/`slug`/`seoMeta`, and `set_config` writes the site base. The only
writer in the toolchain is `scaffold.ts:69-70`, at site-creation time.

They are not readable either. `describe_page` returns `{page: {id, slug, title,
seoMeta}, components, segments}` — the page background never appears in any tool
result. So the consultant cannot set the page background, cannot read it, and
has no way to discover that it is white. That is precisely how the [[CHAT-35]]
session shipped off-white text on a white page.

## What this ticket does

**1. Make the L1 document addressable.** Every key of `l1DocumentSchema` outside
`root` — `background`, `textColor`, `widths`, `column`, `resources` — becomes
readable and writable through the control surface. Whether that is an extended
path grammar reaching above `"0"`, or a dedicated document-level operation, is
an implementation choice; the acceptance criterion is that a consultant can set
a page's background colour and read back what it set.

`background` and `textColor` take the same colour form the axes take, including
palette refs — the reproduction writes `{"ref": "sand"}` there, so a hex-only
implementation would already be behind the importer on the day it landed.

**2. Guarantee parity structurally, not by promise.** A test that fails when the
reproduction path can write something the consultant surface cannot. The
reproduction corpus in `storage/sites/` is the natural fixture: take a
reproduced page, and assert every node and document-level key in it is
reachable and writable through the surface the consultant is granted.

This is the half that makes the ticket worth more than its first half. Without
it, the next capability added for reproduction reopens the same gap silently,
and we find out the way we found out this time — a client-facing session where
the assistant tells the operator to build something that already exists.

## Explicitly in scope

Anything else reproduction has developed that the consultant cannot reach. The
document-level keys are the ones found so far; the parity test in (2) is what
finds the rest, and its first run is expected to surface more. Fix what it finds
rather than narrowing it to the known list.

## Related

- [[REQ-176]] — the consultant must be able to *discover* the vocabulary. Parity
  without discovery is what produced this session: full capability, no knowledge
  of it. Neither ticket is sufficient alone.
- [[REQ-157]] — seeing the result. Parity plus discovery still leaves the
  consultant unable to check its own work.
