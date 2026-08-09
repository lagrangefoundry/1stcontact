---
uid: request-b1300473
id: REQ-129
type: request
title: 'L1 authoring on the control surface: verbatim get_l1 / set_l1 (click-to-edit
  modal unchanged)'
created_by: xgd
created_at: '2026-08-09T23:01:05.915932+00:00'
updated_at: '2026-08-09T23:31:56.240805+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: e46509db9cc135d9fa181f4f5d43f0cd417c89c6
    reconcile_sha: null
    main_sha: null
  version: 0.1.33
---

# L1 authoring on the control surface: verbatim `get_l1` / `set_l1`

The AI can change words in an L1 tree it cannot compose. Give the control surface read and write
symmetry around one address, so the assistant can author L1 the way Claude already authors it in
the repository — and leave the operator's click-to-edit modal exactly as it is.

Depends on the declared surface (REQ-126) and the envelope validator on the authoring path
(REQ-107). Neither needs changing.

## Why

REQ-126 declared the control surface faithfully: 16 operations covering everything `edit.ts` can
do. `edit.ts` contains no reference to `axes`, `children`, `splice` or `insert` — its entire L1
reach is `editCopySet`, over the four fields `copyFieldsOf` exposes (`text`; `src`/`alt`;
`backgroundImageUrl`). So the AI inherited a four-field copy editor, accurately.

That was the right surface for the gesture it was modelled on — a person clicking a heading and
typing words. It is the wrong surface for composing a page.

Measured on `storage/sites/xgd/draft/pages/home.json`:

| | |
|---|---|
| L1 nodes in the tree | 122 |
| visible through `describe_page` | 67 (54%) |
| nodes carrying `axes` | 86 — exposed nowhere |

xgd.dev was built by Claude writing this JSON directly and extending L1 itself when it hit a
ceiling (`feat(l1): typed scroll-reveal and stagger axes`, `typed texture axis + radial
gradients`, `responsive layout track + wrapping rows`). Its nav bar is three L1 nodes carrying the
REQ-106 link role at `root.children.0.children.1`. Nothing reachable from the chat can produce
that, which is why the assistant correctly refuses to add a menu.

## Behaviour

**Two tiers on the read side, because this is a context-economy problem.** xgd's home page is
3,872 lines; gigabytealchemy's is 7,292. The model must not pull a document to change a heading.

- `describe_page(page)` — **widened to emit every node**, not only those with copy fields. Path,
  kind, and a short label. No axes. Its job changes from "what can I edit" to "where is
  everything". Skipping layout containers was right when the model could only edit words; those
  containers are precisely what it needs to see now.
- `get_l1(page, path)` — the subtree at an address, **verbatim**: `axes`, `children`, `link` role,
  everything, exactly as stored.
- `set_l1(page, path, node)` — replace the subtree at that address with a validated L1 subtree.

**Verbatim is a decision, not a default.** `get_l1` returns what is stored, unresolved: palette
refs stay as refs, responsive tracks stay as tracks. The model must be able to write back what it
read, and a resolved view cannot be written back. Meaning comes from `describe_site`, which
already returns the whole base — `palette`, `theme`, `nav`, `assets` — so `{"ref": "orange"}` is
already interpretable today.

Addressing is REQ-126's contract unchanged: the address `describe_page` hands out is the address
`resolveL1Node` resolves and the renderer stamps as `data-l1-path`.

Validation is `validateOrThrow` (`edit.ts:124`) unchanged — `validateSite` runs `validateL1`'s
full envelope (numeric ranges, URL-scheme allowlist, node-count cap, geometry-track
well-formedness, unique ids) over the assembled site before a byte is written, and returns
JSON-pointer paths built for exactly this: *"so callers (including AI tool-call validators per
DOC-8 §6) can self-correct"*. No new validation is written.

## ⚠️ The operator's editor must not break

`editCopyGet`, `editCopySet` and `copyFieldsOf` are the **click-to-edit modal's** contract
(REQ-117 / REQ-118 / DOC-28 §4), reached over `/api/copy`, and they also back `1c copy get|set`.
They are NOT touched by this ticket. The four-field projection is the right granularity for a
non-technical operator clicking a heading, and it stays exactly as it is.

What retires is only the **AI-facing** pair — the `get_copy` and `set_copy` *operations* in
`l1-surface.json` and their bindings in `toolbox.ts` — because `get_l1`/`set_l1` subsume them and
no-legacy-modes forbids two ways to do one thing on one surface. The modal never called the
toolbox, so it cannot be affected; that must nonetheless be demonstrated rather than assumed.

Two invariants to prove, not assert:

1. After the assistant authors a subtree through `set_l1`, the modal still opens on the nodes
   within it and still saves — an AI-authored `text` or `image` node is indistinguishable to
   `copyFieldsOf` from an authored-by-hand one.
2. Node kinds the modal does not expose (rows, boxes, plain containers) remain invisible to it
   rather than rendering an empty form. That is already true — `copyFieldsOf` returns null for
   them — and must stay true when the AI can create them freely.

## Security

Today "the AI cannot write HTML, CSS or JavaScript" is guaranteed by **no operation accepting
them**. Under `set_l1` it is guaranteed by **the schema rejecting them**.

That is a comparable guarantee only because L1 is a closed language: `.strict()` objects, closed
enums, a URL-scheme allowlist, no raw-CSS hole by policy (CLAUDE.md, DOC-24, DOC-2), and the
renderer keeping an independent `isSafeUrl` at every URL sink as a second line of defence. The
guarantee holds — but it MOVES, from the shape of the surface to the closure of the schema, and
that is a deliberate choice to record rather than discover later. Any hole found in L1's closure
becomes a security finding against this ticket, not a capability gap.

## Acceptance

Give gigabytealchemy the nav bar xgd.dev already has, through the chat: a container of text nodes
carrying the REQ-106 link role, targeting a page and an anchor. It needs both halves — reading a
subtree with its axes, and writing a subtree with structure and roles — so it cannot pass by
accident.

Note that `site.json`'s `nav: {pattern, entries}` is vestigial on both sites (`entries: []`, and
nothing in `packages/framework`, `apps/public-site` or `apps/control-app` reads it). Navigation is
L1, and this ticket does not change that. That the model is shown a config key nothing renders,
and reasons from it, is a separate defect worth its own ticket.

## Not in scope

Whole-document submission. Bounding the payload by address is what keeps this affordable; a
document PUT would also have the model rewriting regions it never intended to touch.