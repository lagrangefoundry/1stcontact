---
uid: request-37983f6e
id: REQ-212
type: request
title: Modals in L1 — the overlay role and the disclosure verb
created_by: martin-github@westhead.me
created_at: '2026-09-10T00:17:52.482228+00:00'
updated_at: '2026-09-10T00:51:22.505630+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-18361267
  commits:
  - working_sha: d64e82a62d41306819c6bca7054d6de2087292e8
    reconcile_sha: null
    main_sha: null
  - working_sha: d49d559f7a7e84ee819a576fe1a1cfed2f333af4
    reconcile_sha: null
    main_sha: null
  version: 0.2.143
---

# Modals in L1 — the overlay role and the disclosure verb

**Status:** design + free-coded substrate change. Amends [[DOC-23]] (L1 substrate)
and cross-references [[DOC-25]] §10 (the behavior-module contract).

## 1. What prompted it

1st Contact's own header wants a Sign In link that opens a modal: an email field
and a Continue button, which on submit replace the panel's contents with *"Please
check your email. If you are already a member we have just sent you a sign-in
link."*

That exact flow already exists as a behaviour module — `account-chrome`
([[REQ-200]]) — so putting it on the site is a site-definition job. The question
this ticket answers is the general one behind it: **can the AI author a modal at
all, for any content, without a module being written for that specific flow?**

Today it cannot, and the substrate says so out loud.
`modules/account-chrome/styles.css` ships:

```css
.account-chrome[data-account-chrome-enhanced] .account-chrome__dialog {
  position: fixed; inset: 0; z-index: 2147483000;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0, 0, 0, 0.5);
}
```

with the comment *"Covering the page and centring on it is behavioural — a modal
that did not would not be one — and no L1 axis can express `position: fixed`."*

[[DOC-25]] §10.2 says a conforming behaviour ships **zero CSS beyond §10.3
invariants**. A 50%-black scrim no site can vary is not an obligation-pinned
invariant, it is taste that had nowhere else to live. That block is an honest
admission of a **substrate gap**, not a principled carve-out.

## 2. The line this is decided on

[[DOC-25]] §10.3 states the rule: *L1 owns everything the reference can
legitimately vary; the module owns what an obligation pins.* Decomposing a modal
against it:

| part | before | belongs to |
|---|---|---|
| panel look (fill, radius, padding, width, type) | L1 already | L1 — nothing needed |
| overlay presentation (cover, centre, scrim, layer) | module CSS, unvariable | **L1 — the gap** |
| what opens it, what closes it | module `client.js` + `data-*` | **L1 says which; the renderer owns how** |
| dialog obligations (role, focus, Escape, scroll lock) | largely absent | **the renderer** |
| step transitions ("swap for the message") | module, per flow | module — it is a server round-trip |

The last row stays a module deliberately. `account-chrome`'s "one message
whatever the server answers" is [[REQ-134]] policy — it exists so a known and an
unknown address are indistinguishable — and no L1 axis can or should express it.
**This ticket adds no L1 state machine and no multi-step vocabulary.**

## 3. Why this is a node ROLE and not a module

The precedent is [[REQ-100]]'s scroll reveal, whose own note argues the case:
motion became an L1 *adjective* rather than a module partly because *"putting it
in a module would make animated content unfoldable by construction — `fold` maps
captured node axes onto L1 node axes and never authors a module."*

A captured reference site with a modal has exactly that problem. If modal-ness
exists only inside a module, reproduction can never fold one.

The precedent for L1 carrying an **obligation** is [[REQ-106]]'s link:
`l1LinkSchema` pins `rel="noopener noreferrer"` whenever `newTab` is set — *"there
is deliberately no way to ask for `_blank` without its `rel`"* — and `href` clears
`isSafeUrl`. `l1FocusRingSchema` exists because [[DOC-24]] holds focus above
taste. The renderer being the sole sink is already how L1 carries what is not
negotiable. A dialog's obligations ride in on the same rail.

## 4. What is added

### 4.1 `dialog` — the overlay role

A node-level field on `box` and `container` — the two kinds that hold children,
because a modal panel always frames content. Not a seventh node kind, for the
same reason `link` is not: a modal is a role a subtree takes, not a species of
thing.

It carries only what a reference can legitimately vary:

- `backdrop` — the scrim painted over the page behind the panel, as a colour and
  an opacity. Absent means no scrim.
- `placement` — where the panel sits in the covered viewport: `center`, `top` or
  `bottom`.
- `dismissOnEscape` — whether Escape closes it. Defaults to true.
- `dismissOnBackdrop` — whether a click on the scrim closes it. Defaults to true.
- `ariaLabel` — the panel's accessible name, for when its visible content is not
  a sufficient one.

Everything else about how the panel looks is the node's ordinary surface, sizing,
padding and paint axes. The dialog role adds no way to paint.

**A node carrying `dialog` must declare an `id`.** The id is what an action
names, and a dialog nothing can open is a dialog nobody sees.

### 4.2 `action` — the disclosure verb

A node-level field on `box`, `container` and `text` — the kinds a reader
activates. A **closed** set of two verbs, not an event system:

- `opens` — the id of a node carrying `dialog`.
- `closes` — the id of a node carrying `dialog`.

**Exactly one of the two.** A node that both opens and closes the same panel is
a toggle nobody asked for and a contradiction the shape should refuse.

`action` and `link` are **mutually exclusive** on one node. A node either
navigates somewhere or acts on this page; both at once is a control whose
behaviour depends on which handler wins.

`image` deliberately cannot carry it. A void element cannot be a button, and
wrapping one would move focus to an outer element and cost the node its
[[REQ-99]] focus ring — the same reasoning that makes `link` retag every other
kind and wrap only this one. A close affordance built from a picture is authored
as a `box` around the `image`.

`control` deliberately cannot carry it either, for the reason it cannot carry
`link`: the module owns that element's semantics.

### 4.3 Validation

Three structural rules, checked over the whole document:

- a node carrying `dialog` must declare an `id`;
- an `action` must name exactly one verb;
- the id an `action` names must exist **and must carry `dialog`**. Opening
  something that is not a dialog is a no-op the author would never see.

`action` alongside `link` is refused by the node shape itself, because every node
object is `.strict()` and the two fields cannot both be present — the same
enforcement-by-construction `control`'s exclusion from `link` already relies on.

## 5. How it renders

### 5.1 The action node retags to a button

The renderer **retags** the node's own element as `<button type="button">` rather
than wrapping it, so the class, every paint axis and the focus ring stay on the
element the author styled. This is [[REQ-106]]'s discipline, verbatim.

An **opening** action carries `aria-haspopup="dialog"`, `aria-controls` naming
the panel, and `aria-expanded`. A **closing** action carries neither
`aria-haspopup` nor `aria-expanded`: a Close is not the thing that reveals the
panel, and a control claiming a disclosure state it does not own is worse than
one claiming nothing.

### 5.2 The dialog element, inside a covering shell

`role="dialog"` and `aria-modal="true"`, plus `aria-label` when the role named
one. The panel is focusable as a fallback target (`tabindex="-1"`) so focus has
somewhere to land in a panel holding nothing focusable.

Here — and only here — the renderer **wraps** rather than retags. Covering the
page and dimming it is a statement about the page *around* the panel, which the
panel's own element cannot make; and unlike a link, the wrap costs nothing,
because focus goes to the panel and every axis the author wrote stays on it. The
`id` stays on the panel, so `aria-controls` points at the region rather than at
the scrim.

The shell contributes **no box** until the script marks the document, so an
unenhanced page lays the panel out exactly where it would have been unwrapped.

Two things about the covered viewport are the renderer's rather than the
author's, because an obligation pins them: the shell scrolls when a panel is
taller than the screen, and the panel does not shrink to fit it. A modal whose
foot cannot be reached is broken, and no axis an author writes could rescue it.

Several panels may be open at once, and each opens and closes on its own. The
scroll lock lifts only when the last of them closes.

### 5.3 The no-JS baseline: script only ever subtracts

The server renders the dialog **in flow and open**, exactly as `account-chrome`
does and for the same reason: a visitor with no script meets real content they
can actually use, and every failure of the script — a blocked bundle, a throw,
an ancient browser — leaves a working page rather than a blank one.

So an opener's `aria-expanded` starts `true`, and the script folds the panel away
before wiring anything. The overlay presentation itself is gated on a marker only
the script sets, so with no script the panel lays out as an ordinary part of the
page rather than a fixed sheet over content nothing can dismiss.

### 5.4 One renderer-owned script, carrying no instance data

Like [[REQ-100]]'s observer and [[REQ-108]]'s pointer listener, the dialog
behaviour is a single vetted script, identical for every site, emitted **only
when a document actually carries a dialog**. It owns everything an obligation
pins:

- closing every dialog on start-up, and marking the document so the overlay CSS
  applies;
- opening on an `opens` activation and closing on a `closes` activation, keeping
  each opener's `aria-expanded` honest;
- moving focus into the panel on open, and **returning it to the opener** on
  close;
- **trapping Tab** inside the open panel;
- **Escape** closes, unless the role turned that off;
- a click on the **scrim** closes, unless the role turned that off — a click
  inside the panel never does;
- **locking page scroll** while a panel is open.

No document can name a selector, a key, or a script. Every number and colour the
author wrote is compiled into the stylesheet by the renderer; the script reads
only its own markers — so it is byte-identical for every site, which is what
makes it vettable once. The script and the invariant stylesheet are exported by
name, so a CSP-bound consumer can hash them rather than hunt for them in markup.

### 5.5 A panel's scroll entrance is not emitted

A panel starts closed, so it never scrolls into view; a `reveal` on it could
therefore never fire, and REQ-100's pre-state rule would leave it at `opacity: 0`
forever — visible only as a modal that opens onto nothing. The two axes do not
compose, so the emitter declines the one that cannot work rather than shipping
the trap. A reveal on the panel's *contents* is unaffected.

### 5.6 A document that declares no modal is unchanged

No shell, no stylesheet, no script, and every other role — a link above all —
renders byte-for-byte as it did before.

### 5.7 The edit render

The edit channel emits **no dialog script**, and an action node keeps its
`<button>` element while losing the target attribute that would act — precisely
as a link keeps its `<a>` and loses its `href`. The edit render therefore differs
from the draft render by the missing behaviour and nothing else: same tag, same
class, same declarations, same box. The panel renders in flow, settled, editable.

## 6. What is deliberately NOT in this ticket

- **No multi-step vocabulary.** See §2.
- **No general event system.** Two verbs, closed set.
- **`account-chrome` is not migrated.** Its stylesheet keeps the block quoted in
  §1 for now; moving its dialog slot onto the L1 role is a follow-up, and doing
  it here would put a live authentication surface inside a substrate change.
- **No `<dialog>` element.** The platform element cannot be reached without
  `showModal()`, which would make every modal script-only and break §5.3's
  baseline outright.

## 7. Documentation

The system knowledge base gains this vocabulary:

- `REF-l1` is projected from the schemas, so the new role, the new verb and their
  shapes appear there from the declaration itself — including the three new
  structural rules, whose prose is their doc comment.
- The judgement a field list cannot carry — **when a modal is the right answer
  and when it is not** — goes to the two authored documents that already own
  those questions rather than to a new one: [[DOC-48]] gains a section on the
  craft (the three cases it genuinely fits, the many it does not, and the rule
  that decides between them), and [[DOC-47]] records that a modal is now
  something the assistant can build, and that it is ordinary layout rather than a
  new component.

## 8. Acceptance

1. A `box` or `container` may carry `dialog`; a `text`, `image`, `control` or
   `slot` may not.
2. A `box`, `container` or `text` may carry `action`; an `image`, `control` or
   `slot` may not.
3. A node carrying `dialog` without an `id` is refused.
4. An `action` naming neither verb, or both, is refused.
5. An `action` naming an id that does not exist, or that exists but carries no
   `dialog`, is refused.
6. A node carrying both `action` and `link` is refused.
7. An action node renders as `<button type="button">` keeping its own class; an
   opening one carries `aria-haspopup="dialog"`, `aria-controls` and
   `aria-expanded="true"`, and a closing one carries neither `aria-haspopup` nor
   `aria-expanded`.
8. A dialog node renders with `role="dialog"`, `aria-modal="true"`, `tabindex="-1"`
   and its `aria-label` when one was given, inside a shell that contributes no box
   until the script marks the document.
9. The scrim colour and opacity, the placement, and the panel's own paint all
   come from the document; none of them appear in any module's stylesheet.
10. A document carrying a dialog emits the dialog script exactly once; a document
    carrying none emits no dialog script at all.
11. The script contains no value taken from the document.
12. The edit render emits no dialog script, and an action node keeps its
    `<button>` while losing the attribute that would act.
13. The overlay presentation is gated on a marker only the script sets, so the
    unenhanced page lays the panel out in flow.
14. A `reveal` on a panel is not emitted, and a document declaring no modal
    renders byte-for-byte as it did before.
15. The reader can open a panel, close it, dismiss it with Escape and with a
    click on the scrim but never with a click inside it, and can turn either
    dismissal off; focus moves in on open and returns to whatever opened it on
    close; Tab cannot leave an open panel; the page behind does not scroll, and
    stops being locked only when the last panel closes.
16. `REF-l1` renders the new role, the new verb, their shapes and the four new
    structural rules, with no vocabulary gap reported.