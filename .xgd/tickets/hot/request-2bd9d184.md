---
uid: request-2bd9d184
id: REQ-175
type: request
title: The consultant gets the whole of L1, and keeps getting it
created_by: xgd
created_at: '2026-09-02T20:48:58.308743+00:00'
updated_at: '2026-09-03T02:34:19.795944+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  story_points: 13
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-5974554b
  commits:
  - working_sha: 18102f737435788398a4873745f807444b06e098
    reconcile_sha: null
    main_sha: null
  - working_sha: 6cddcbb1c4fb022c0a7defe8ec10e71faa644472
    reconcile_sha: null
    main_sha: null
  version: 0.2.50
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
today. That half is a knowledge problem and is [[BUG-48]]'s to fix.

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

- [[BUG-48]] — the consultant must be able to *discover* the vocabulary. Parity
  without discovery is what produced this session: full capability, no knowledge
  of it. Neither ticket is sufficient alone.
- [[REQ-157]] — seeing the result. Parity plus discovery still leaves the
  consultant unable to check its own work.


## Decisions (agreed with the operator)

The implementation choice left open above is now made, and the scope is widened
in one direction the first investigation found.

### D1 — a dedicated document-level pair, in the authoring grant

The document is reached by a **new read/write pair on the control surface**, not
by extending the address grammar. `l1/edit.ts` states one resolution rule — index
the root list, then walk `children` — and that rule is what keeps the address a
render stamps identical to the address a write resolves. A non-positional
sentinel in the same `l1_address` parameter would break that, and the surface
declares `l1_address` as positional child indices, so the manual would be lying
in the same way [[BUG-44]] found `set_l1`'s refusal prose lying.

Nor is it folded into `update_page`. Page appearance would then sit in the
`ManagePages` grant beside slug and SEO, while `set_l1` sits in `AuthorPages` —
so a role granted authoring but not page management could paint every element on
a page and not the page itself. The pair goes in **`AuthorPages`**, with `set_l1`,
because painting the page is authoring.

Write semantics are **merge, not replace**, on `set_config`'s reasoning: naming
`background` must not silently drop `resources`. Reads return the document keys
as stored — palette refs unresolved — so what comes back is what may be written
back, exactly as `get_l1` already promises for a node.

### D2 — the read gap closes at `describe_page`

`describe_page` is where the blindness is introduced, not `edit.ts`: `editPageGet`
already returns the whole page including `l1`, and the toolbox projection narrows
it to `{page, components, segments}`. So the map a consultant reads carries the
document-level keys, and the acceptance criterion — *set a page's background and
read back what it set* — is met by the tool it would already have called.

### D3 — every key, `widths` and `column` included

All five non-`root` keys are writable: `background`, `textColor`, `widths`,
`column`, `resources`. `widths` is included rather than declared absent. An
absence here is a rule the parity test in (2) would have to carry an exception
for, and an exception is how this gap comes back. It is also safe: the envelope
validator already cross-checks every keyframe `at` against `doc.widths` and
refuses `geometry.anchor` without a `column`, so a ladder change that would
strand a keyframe is refused whole rather than half-applied.

### D4 — `resources` is in scope, and so is the hole it opens

A consultant that can set `axes.fontFamily` but cannot add a face to
`resources.fonts` writes a family nothing serves and gets a clean accept and a
serif fallback. So `resources` is writable here.

That alone would only move the silent failure: an unbound family is still
accepted today. **Nothing checks that a painted family resolves.** So this ticket
closes it — see D5.

### D5 — L1 is self-validating

The general rule, of which D4's font hole is the instance this ticket found:

> **A change that would break the page is refused, with a message that says what
> is wrong and what would be accepted — never accepted and silently wrong.**

L1 already works this way for most cross-references, and the model to copy is
the one it already has: a palette reference that names nothing is refused with
the declared names listed. The two references that do *not* work this way, and
must:

**A painted font family must resolve to a face.** `axes.fontFamily` carries a CSS
font *stack* (`"Satoshi, Helvetica Neue, Arial, sans-serif"`), while
`resources.fonts[].family` carries the primary family (`"Satoshi"`). The rule is
therefore on the stack's **first** family, and a first family that is a generic
or system keyword (`serif`, `ui-sans-serif`, `system-ui`, …) needs no face — the
whole reproduction corpus paints stacks of both shapes and must keep validating
unchanged. An unresolvable family is refused, naming the families the document
does declare.

**A referenced asset must exist.** An `image` node's `src` and a surface's
`backgroundImageUrl` may name a site asset that is not there, and today that is
accepted and paints a broken image — the failure [[BUG-44]]'s session ended on.
Site-relative handles are checked against the site's actual assets, with the
query and fragment stripped before comparison (the corpus writes
`/assets/xgd-grid-hero.svg?v=3` for an asset stored as `xgd-grid-hero.svg`, and a
naive comparison would reject the reproduction path's own output). Absolute
`http(s)` references are not the site's to vouch for and are left to the existing
scheme allowlist. The check runs where the asset listing is known — the site
validation the write path already runs — and is skipped when no listing is in
scope, the way the palette check already is.

### D6 — the parity test has two layers

Both, because either alone has a blind spot.

**Round-trip over the reproduction corpus.** For every reproduced page in
`storage/sites/`, every node address reads through the surface and writes back
unchanged and accepted, and every document-level key the page carries does the
same. This is what catches a surface that strips or refuses something the
importer emits.

**Enumeration from the schema.** The key set is *derived from
`l1DocumentSchema`*, never listed by hand, and every key must be covered by a
surface operation. This is the half that makes the guarantee structural: the
sixth document key fails the test on the day it is added, which is the "next
capability reopens the gap silently" failure this ticket exists to prevent. The
corpus check alone would pass a key no reproduced page happens to use yet.

### Not done here

Asset **existence** is now validated, but the caretaker is granted `DrawImages`
and not `ManageAssets` — so it can bind only faces and images the site already
holds. Whether the consultant should be able to add an asset itself is a grant
decision, not a parity gap, and is left where it is.