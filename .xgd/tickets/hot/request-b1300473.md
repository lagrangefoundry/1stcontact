---
uid: request-b1300473
id: REQ-129
type: request
title: 'L1 authoring on the control surface: verbatim get_l1 / set_l1 (click-to-edit
  modal unchanged)'
created_by: xgd
created_at: '2026-08-09T23:01:05.915932+00:00'
updated_at: '2026-08-10T11:00:53.398330+00:00'
completed_at: '2026-08-10T11:00:53.398330+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: e46509db9cc135d9fa181f4f5d43f0cd417c89c6
    reconcile_sha: null
    main_sha: null
  version: 0.1.33
  story_points: 5
  bundled_in: bundle-e59210c5
  chat_comment: comment-214c3fa5
---

# L1 authoring on the control surface: verbatim `get_l1` / `set_l1`

The AI can change words in an L1 tree it cannot compose. Give the control surface read and write
symmetry around one address, so the assistant can author L1 the way Claude already authors it in
the repository — and leave the operator's click-to-edit modal exactly as it is.

Depends on the declared surface (REQ-126) and the envelope validator on the authoring path
(REQ-107). Neither needed changing.

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
ceiling. Its nav bar is three L1 nodes carrying the REQ-106 link role. Nothing reachable from the
chat could produce that, which is why the assistant correctly refused to add a menu.

## What was built

### The read side — two tiers, because this is a context-economy problem

xgd's home page is 3,872 lines; gigabytealchemy's is 7,292. The model must not pull a document to
change a heading.

- **`describe_page(page)` widened to emit every node.** `walkSegments` no longer filters on
  `copyFieldsOf`. Each entry is `{path, kind, label}` plus `{module, slot}` when scoped. No axes
  reach the model here at all, so the map's size is bounded by node count rather than by how
  richly the page is styled. Its job changed from "what can I edit" to "where is everything".
  - `Segment.values` (a field map) is replaced by `Segment.label` (a string) — the text for a
    text run, the alt or src for an image, the control name, the slot name, or
    `"row, 3 children"` for a container. Enough to recognise a node among its siblings, and no
    more.
- **`get_l1(page, path)`** — `editL1Get`. The subtree at an address, verbatim: `axes`, `children`,
  `link` role, everything, exactly as stored.

### The write side

- **`set_l1(page, path, node)`** — `editL1Set`. Replaces the subtree at that address. Adding and
  removing are replacing a group with a group that has one child more or fewer; there is no
  insert or delete operation, and the surface's `sequences` say so.
- **`replaceL1Node(roots, path, replacement)`** lands in `packages/site-schema/src/l1/edit.ts`
  beside `resolveL1Node`, so the one addressing rule stays stated once. Two walks would be two
  chances for "the address a listing hands out is the address a write resolves" to stop holding.
- **`writeSegmentRoots`** in `edit.ts` is `segmentRoots`' pair: `segmentRoots` returns a live
  array for a repeated slot and a fresh one-element list for `[doc.root]` or a single slot, so a
  caller that replaced an entry cannot know whether its page already reflects the change.

**Verbatim is a decision, not a default.** `get_l1` returns what is stored, unresolved: palette
refs stay refs, responsive tracks stay tracks. The model must be able to write back what it read,
and a resolved view cannot be written back. Meaning comes from `describe_site`, which already
returns the whole base.

Addressing is REQ-126's contract unchanged. Validation is `validateOrThrow` unchanged — no new
validation was written.

### The declaration

`get_copy`/`set_copy` retire from the AI surface (`l1-surface.json` + `toolbox.ts` bindings):
`get_l1`/`set_l1` subsume them, and two ways to do one thing on one surface is what
no-legacy-modes forbids. Consequent changes:

- shape `copy_target` → `element`; `page_map`'s `segments` re-described;
- group `WriteCopy` → `AuthorPages`, and `instances.json`'s caretaker grant with it;
- `sequences` rewritten around read-then-replace, plus an explicit add/remove sequence;
- the "changing how something looks" and "adding, removing, moving or reordering" **absences are
  deleted** — they are no longer true. A new absence records that whole-document submission is
  deliberately absent;
- `surface_version` 1 → 2;
- `roles.ts`'s preamble no longer says "no tool will accept them" (a tool now accepts an object);
  it says the vocabulary is closed and a malformed change is refused whole.

## The operator's editor is untouched — demonstrated, not assumed

`editCopyGet`, `editCopySet` and `copyFieldsOf` are unchanged. Both invariants are exercised over
the real `/api/copy` transport, on subtrees the assistant authored:

1. The modal opens on an AI-authored `text` node, derives the same descriptors, saves — and the
   assistant's `axes` survive the operator's edit.
2. An AI-authored `container` yields an empty field list, not a form.

## Security — the guarantee moved, deliberately

"The AI cannot write HTML, CSS or JavaScript" used to hold because **no operation accepted them**.
It now holds because **L1's schema is closed**: `.strict()` objects, closed enums, hex-only
colours, a URL-scheme allowlist, no raw-CSS hole by policy, and the renderer's independent
`isSafeUrl` at every URL sink. Any hole found in L1's closure is a security finding against this
ticket, not a capability gap.

Measured rather than argued — each of these is refused whole, with the draft byte-unchanged: a
markup field, a style field, `javascript:` through the link role's `href`, `javascript:` through
an `image.src`, an undeclared kind (`iframe`), and a mistyped axis value.

## Upstream finding — refusal specificity

`validateOrThrow` reports the offending JSON pointer, and a `1c` user sees it. A Toolbox caller
does not: `Toolbox._renderHostError` renders a *declared* code as `code + the surface's declared
meaning` and drops the host error's own message, with no per-call detail channel. That was
harmless while the only write was a four-field copy edit; it is not harmless for a subtree, where
"that field is not accepted" without naming the field is not correctable.

Not fixable here (it is `@lagrangefoundry/ai`). Mitigated by making the declared `SCHEMA_INVALID`
meaning carry the *recovery strategy* rather than a promised hint it cannot deliver, and recorded
in a comment on `editL1Set`. REQ-122's chat-host suite already documents the same loss for
`NOT_FOUND`, so this is a second instance of one known gap, not a new one.

## Test plan

`tests/test_UAT_FC_REQ-129_l1_authoring.test.ts` — 13 UATs, nothing mocked:

- the map emits every node (compared against an independent walk of the seed, so it cannot pass
  by agreeing with the implementation about which nodes are interesting); labels are
  recognisable; no axis reaches the map;
- `get_l1` returns a subtree carrying a palette ref and a responsive track exactly as stored;
- **read → write → nothing changed** (asserting the write was *accepted*, since a refused write
  also leaves the page unchanged; compared as a document rather than as bytes, because the
  Toolbox renders results key-sorted);
- `set_l1` replaces one subtree and leaves its siblings alone;
- **acceptance**: through the Toolbox, `describe_page` → `get_l1(root)` → `set_l1(root)` composes
  a nav bar of text nodes carrying the REQ-106 link role at a page and an anchor — and it renders
  as real `<a>` elements (document-relative, per DOC-12 §7 relocatable artifacts);
- the six security cases above, plus a correctable refusal and a bad address;
- the retired pair is gone from declaration, implementation, tool list and manual, and the grant
  names a group the surface declares;
- the two modal invariants, over `/api/copy`.

Updated for the retired pair: `test_UAT_FC_REQ-126_l1_surface`, `test_UAT_FC_REQ-122_tool_surface`,
`test_UAT_FC_REQ-122_chat_host`, `test_UAT_FC_REQ-127_session_binding`.

Regression scope run green (111 tests across the 11 surface/edit/modal suites). Full suite: 1318
passed, 8 failed — 6 of those (`reconciliation-copy-edit-gesture`, `req117-edit-loop-browser`,
`req115-builder-composition`) verified pre-existing on the clean tree by stashing; the other 2
were REQ-127's, and are fixed.

## Not in scope

Whole-document submission. Bounding the payload by address is what keeps this affordable; a
document PUT would also have the model rewriting regions it never intended to touch.

`site.json`'s `nav: {pattern, entries}` is vestigial on both sites and nothing reads it.
Navigation is L1, and this ticket does not change that. That the model is shown a config key
nothing renders, and reasons from it, is a separate defect worth its own ticket.