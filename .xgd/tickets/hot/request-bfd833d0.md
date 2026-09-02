---
uid: request-bfd833d0
id: REQ-176
type: request
title: 'Library: a type icon, a one-line row, and the wording clients actually read'
created_by: xgd
created_at: '2026-09-02T20:59:01.075259+00:00'
updated_at: '2026-09-02T22:36:24.153954+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: medium
  story_points: 3
  chat_ticket: chat-ded18c49
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-794e4a3c
---

# Library: a type icon, a one-line row, and the wording clients actually read

Three changes to the Library list and the upload overlay. They are one ticket
because they touch the same two files and the same handful of strings, and
because the icon is what makes the one-line row fit.

## 1. A type icon on each row

Each row opens with an icon for the material's type, replacing the `kind` pill.

`renderRow` in `library.js` currently emits three pills — kind, role, and the
"on this site" badge. The kind pill is the one an icon says better and shorter,
so it goes and the icon takes its place at the head of the row.

**Four kinds, not two.** `fields.kind` is `document | image | font | capture`
([[DOC-38]] §9), and fonts are real here — `describeFont` parses SFNT name
tables, and the *"Put it on the site"* hint literally says *"Photos, logos,
fonts."* So the mapping needs document, image and font, plus a fallback for
`capture` and for anything a later kind adds. A row must never render iconless.

The icon is a leading element inside the existing `builder-library__row`;
`webui/list-detail` has an icon slot for the expand toggle only, and `renderRow`
owns the whole content cell, so nothing in the component changes.

## 2. The row becomes one line

Today `.builder-library__row` is `flex-direction: column` — title on the first
line, `builder-library__row-meta` pills wrapping onto a second. It should be one
row: **icon, title, then the remaining pills after the title.**

The title is also larger than it should be. `renderRow` builds its own
`builder-library__row-title` span, which has no `font-size` and so inherits the
shell's body size; the component's own `.list-detail-row-title` sets 13px. The
library's title should match the component's rows rather than being the one
list in the builder with a larger one. Set it in `builder.css` — do not change
`webui-list-detail`, which other hosts share.

The title keeps its `text-overflow: ellipsis` and takes the remaining space; the
pills keep their intrinsic width and do not wrap or shrink. Truncation lands on
the title, never on a pill, because a half-rendered pill reads as a bug.

## 3. Wording

Four changes. The first three are unambiguous; the fourth is not — see below.

| Now | Becomes | Where |
|---|---|---|
| `Put it on the site` | `Site asset` | `config.js` `UPLOAD_AREAS[0].label` |
| `Just for you to read` | `Background information` | `config.js` `UPLOAD_AREAS[1].label` |
| `What's this for?` | `Purpose` | `config.js` `UPLOAD_PROMPT` |

The first two reach both surfaces from one edit: `library.js` derives its role
pill from the same constant —

```js
const ROLE_LABEL = Object.fromEntries(UPLOAD_AREAS.map((a) => [a.id, a.label]))
```

— which is exactly what that derivation is for. The upload overlay's two area
labels and the Library's role pill cannot drift apart, and this change should
not introduce a second place to edit them. The `id` values (`site`,
`reference`) are the wire vocabulary the route validates and **must not
change**; only the labels do.

The hints under each area stay as they are. The second one — *"they won't
appear on your site"* — is load-bearing (`config.js` says so), and shortening
the label to `Background information` makes it carry more of the reassurance,
not less.

## The fourth string: "Used on this site"

**Requested:** `Used on this site` → `Live on the site`. **Do not make this
change as written** — it would be false.

`placeOnSite` calls `promoteToSiteAsset`, which copies the bytes across the
bucket boundary and writes them through `editAssetAdd`. That writes to
**`draft/assets`** — its own collision message says so — and a draft is not the
published site. `RenderChannel` is `draft | published` and publishing is a
separate act. So a promoted asset is in the client's working copy, and reaches
the public site only when they publish.

Of the three readings:

1. *currently on the published site* — **no**
2. *in a version of the site* — **no**, not until published
3. *in the draft, including unpublished work* — **yes, this is what it means**

`Live on the site` asserts (1). A client who reads it and does not publish has
been told their logo is on their website when it is not.

Wording that is true of the draft: **`On this site`** (what the pill already
says), **`Added to the site`**, or **`In your draft`**. Recommendation:
`Added to the site` for the pill and `Added to` for the `site_slug` field label
in `RIGHTS_FIELDS` — it says a real thing happened without claiming the public
site shows it. **Confirm the wording before implementing**; the intent behind
the request may be that promotion *should* be publish-visible, which is a
different and much larger ticket.

If the label does change, the rationale comment on `.builder-library__badge--here`
in `builder.css` changes with it — it explains why that badge carries the accent
in terms of the old wording.

## Ordering against BUG-47

[[BUG-47]] is about the same badge: it currently fires from `site_slug`, which
records *where the file was uploaded*, not where it is placed, so it appears on
`reference` material that is not on any site. **BUG-47 should land first.**
Renaming a badge that is showing on the wrong rows makes it wrong in new words,
and BUG-47 may replace the field the badge reads — at which point this ticket's
wording change would have to be redone against the new one.

The other three wording changes and both layout changes have no such dependency
and can go ahead regardless.

## What must hold afterwards

- Every row shows exactly one type icon, including `capture` and any kind added
  later.
- No row shows a `kind` pill.
- A row is one line at the list's normal width; the title truncates and the
  pills do not.
- The row title's size matches `webui/list-detail`'s own rows.
- `webui-list-detail` is unchanged.
- The overlay's two area labels and the Library's role pill read identically,
  from one constant.
- `role` wire values are still `site` and `reference`.


---

## What was implemented

Everything above **except the fourth string**, which is still awaiting the
confirmation this ticket asks for. See *"Still open"* below.

### 1 & 2 — the icon and the one-line row

`KIND_ICON` in `library.js` names the three kinds a client uploads — `document`,
`image`, `font` — and `KIND_ICON_FALLBACK` catches `capture` and whatever
[[DOC-38]] §9 adds next. The map is **partial by design**: a `kind` the map has
never heard of lands on the paperclip rather than rendering an empty leading
cell, because an iconless row reads as a rendering fault rather than as a kind.
Emoji rather than SVG, matching the upload overlay's own area icons.

`renderRow` emits the icon, then the title, then the meta strip — which now
carries the role pill and the placement badge only. The `kind` pill is gone.

**The icon is labelled, not hidden** — a technical consequence of removing the
pill rather than a separate request. The pill was the only place the row said
its type *in words*, so the glyph carries `role="img"` and
`aria-label="<kind>"`: the fact moved to the icon, it did not leave the row. An
`aria-hidden` glyph — which is what the overlay's area icons are, correctly,
because a visible label sits beside them — would have silently deleted the kind
for a screen reader.

`builder.css` makes `.builder-library__row` a row axis; the title is
`flex: 1 1 auto; min-width: 0` with `font-size: 13px` to match
`.list-detail-row-title`; the icon and `.builder-library__row-meta` are
`flex: none` and the meta strip no longer wraps. `webui-list-detail` is
untouched.

### 3 — the three unambiguous wording changes

`UPLOAD_PROMPT` is `Purpose`; the two `UPLOAD_AREAS` labels are `Site asset` and
`Background information`. The `id` values are unchanged. The hints are
unchanged. `ROLE_LABEL` derives the Library's role pill and role filter from the
same constant, so the rename reached both surfaces from one edit.

### The rename reaches the assistant's own manual

Not in the original scope, and load-bearing: the L1 surface declaration's
"cannot fetch a file" absence note tells the client to drop a file onto the
conversation and **choose the area by name**. A note quoting a button that no
longer exists sends them hunting for it, so
`tools/generate/src/cli/ai/l1-surface.json` was renamed with the label.

Two existing suites asserted the old literal against that note and were updated
with it — `test_UAT_FC_BUG-44_surface_tells_the_truth` and
`test_UAT_FC_REQ-130_beyond_l1`. Their invariant is unchanged: *the note quotes
the drop area's own words*. This ticket's own UAT asserts that invariant
**against the constant** rather than against a literal, so the two can no longer
drift apart the way they just did.

Comments in `router.ts` and `tickets.ts` that quoted the old labels as UI copy
were updated for the same reason — a comment naming a button nobody can see is
a false landmark.

### BUG-47's ordering constraint is discharged

[[BUG-47]] is `free_coded` and landed before this. The badge reads `placed_on`,
which records where the bytes actually went, so the rows wearing it are the
right rows. Nothing here was blocked.

## Still open — the fourth string

`Used on this site` → `Live on the site` is **not implemented**, per the
analysis above: `placeOnSite` writes to `draft/assets`, and `Live on the site`
would tell a client who has not published that their logo is on their website.

Note that BUG-47 moved the strings this section describes. The three renderings
today are:

| Surface | Reads |
|---|---|
| the row pill | `On this site` |
| the rights field on `placed_on` | `Used on` |
| the list filter checkbox | `Used on this site` |

The recommendation stands — `Added to the site` for the pill, `Added to` for the
field label, and the filter following them — but it needs the operator's
confirmation, or a decision that promotion *should* become publish-visible,
which is a different and much larger ticket.

## Test plan

`tests/test_UAT_FC_REQ-176_library_row_and_wording.test.ts` — nine UATs:

- every row opens with exactly one non-empty icon, over a fixture holding all
  four §9 kinds plus one the map has never heard of; the three named kinds are
  distinct and the two unnamed ones share the fallback
- the icon still says the kind to a screen reader
- no row carries a `kind` pill, and the role and placement pills survive
- the row lays out on one axis, the title shrinks and ellipses
- the pills are `flex: none` and do not wrap
- the title is 13px, matching the component's own rows
- the overlay asks `Purpose` and names its two areas plainly, with the `site` /
  `reference` wire values unmoved and the second hint unchanged
- the overlay's labels and the Library's role pills read identically, from one
  constant, with both surfaces mounted
- the assistant's manual names the area the client will actually see, asserted
  against the constant

Layout is asserted through the CSS contract that produces it rather than by
measuring boxes: jsdom computes no layout and would report zero either way.

Regression scope run green: the four Library and upload suites, both surface
suites, both workers placement suites, and the builder-origin suite.
