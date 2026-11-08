---
uid: story-e214a00d
id: STORY-175
type: story
title: 'L1 Modals: an author can declare an overlay panel and the controls that open
  and close it'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:07:18.748985+00:00'
updated_at: '2026-11-08T23:49:30.694666+00:00'
completed_at: null
last_field_updated: updated_by
status: updated
fields:
  intent_uid: bundle-0d00566a
  capability_uid: capability-ae9d65d6
  story_kind: upgrade
  story_points: 5
  updated_by:
  - bundle-7ba3af93
---

## Story
**As a** site author (the AI building a business's site, or a reproduction folding a captured reference), **I want** to declare that a subtree is a modal panel and that certain nodes open or close it, **so that** any site can have a modal for any content, with all of its look coming from the site definition and all of its accessibility obligations kept by the platform, without anyone writing a module for that one flow.

**And as** the builder carrying a page across a View/Edit switch, **I want** to read which L1 panels a loaded page has open (plus its scroll offset) and put the other channel's document into that same state, **so that** the operator sees the same page in the same state on both sides of the toggle, including editing the copy inside an open modal (REQ-215).

## Description
REQ-212 adds two node *roles* to L1. They are roles, not new node kinds, following the `link`/`reveal` precedent:

- **`dialog`** (the overlay role) may go on `box` and `container`. It carries only what a reference can legitimately vary: `backdrop` (scrim colour + opacity; absent = no scrim), `placement` (`center` | `top` | `bottom`; absent = center), `dismissOnEscape` (default true), `dismissOnBackdrop` (default true) and `ariaLabel`. The panel's own look comes from the node's ordinary axes. The role adds no way to paint.
- **`action`** (the disclosure verb) may go on `box`, `container` and `text`. It is a closed set of two verbs, `opens` / `closes`, each naming the id of a panel.

The validator enforces four whole-document structural rules: a panel declares an id; an action names exactly one verb; the target exists and carries `dialog`; `link` and `action` cannot both appear on one node.

The renderer retags an action node as `<button type="button">`, wraps a panel in a covering shell, and emits one vetted script (byte-identical for every site, no instance data) only when the document has a modal. The script owns opening and closing, focus moving in and back, the Tab trap, Escape, scrim click and scroll lock. With no script the page still works: the panel lays out in flow and open. A `reveal` on a panel is not emitted. A document with no modal renders byte-for-byte as before. REF-l1 projects the new role, verb and rules.

**Edit render (REQ-215 §2).** The edit render emits exactly what the draft render emits for a modal, minus two things: the dialog script and the acting attributes on an action node. The covering shell, its declared id, the panel's `role="dialog"` and the overlay stylesheet are emitted in every channel. Every overlay rule is gated on a ready marker that only the script or the builder sets. So an edit render that nobody has told anything lays the panel out in flow, open and settled, and a click there still means "edit this" (REQ-116).

**Page state (REQ-215 §1, §3).** The framework can read a loaded page's state: the ids of its open L1 panels in document order, plus its vertical scroll offset. It can also apply such a state to a loaded page. Scroll is applied first, then panels, and the two channels apply panels differently:
- **Edit document:** told, not run. The ready marker is set, the open marker is set on exactly the named shells and removed from the rest, and the scroll lock goes on only while one is open. The same gated stylesheet then lays the panels out as overlays.
- **Draft document:** driven, not told. A named panel that is shut is opened by activating its own opener. A panel that should be shut is closed by activating its own Close, or, if it has none, by clicking its scrim. The page's own script therefore does the work, so focus, scroll lock and `aria-expanded` are true afterwards.

This code runs in the builder against the same-origin preview document. Nothing ships into the page.

**Out of scope** (REQ-212 §6; REQ-215 §5): multi-step vocabulary or any L1 state machine; a general event system; migrating `account-chrome` onto the role; use of the platform `<dialog>` element; carrying state into a behaviour module's own panel. The builder-side carry (URL path, the panel selector, re-applying after a save, resetting on navigation or site switch) belongs to the control-app's builder story, not this one.

## Technical Context
- Part of CAP-70 (Framework Substrate: L1 Layout, Values & Behavior Modules). Amends DOC-23 and cross-references DOC-25 §10.3: L1 owns what a reference can vary, the renderer owns what an obligation pins.
- Security Policy: still structured-only. The dialog shape is `.strict()`, the scrim reuses the existing overlay (hex colour + opacity) shape, and the script reads only its own markers, never a selector, key or script from the document. The renderer stays the sole emitter. The page-state code finds controls by comparing attribute values, not by building selectors from author ids.
- The script and the invariant stylesheet are exported by name so CSP-bound consumers can hash them.
- Edit render parity with CAP-84 (Edit Render Channel): an action keeps its `<button type="button">` and loses its acting attributes (`aria-controls`, `aria-haspopup`, `aria-expanded`, opens/closes target), just as a link keeps `<a>` and loses `href`.
- **REQ-215 supersedes REQ-212 §5.7 / acceptance 12 in one narrow respect** (bundle-7ba3af93): "no shell, no role in the edit render" is replaced by "the shell and the role, always". The edit render still has no dialog script and no acting attribute. AC-2436 is amended in place rather than retired, because its script and acting-attribute halves still hold.
- The page-state module is served to the browser as a framework entry point, so the builder runs this implementation and not a copy.
- REF-l1 projection is covered by the BUG-48 reference-covers-source test.
- Evidence: `tests/test_UAT_FC_REQ-212_l1_modals.test.ts`, `tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts`, REQ-215 page-state UATs (to be generated).

## Reconciliation Decisions
- **Link/action exclusion is an explicit validator rule** (decided at reconciliation, 2026-11-08): REQ-212 §4.3 lists three structural rules and leaves link-and-action to strict-shape refusal. §8 item 16 then speaks of "four new structural rules". The landed code adds the link-or-action exclusion as a fourth named rule with its own message. That is consistent with §8, so it is formalized as the fourth rule in the refusal AC and the REF-l1 AC.
- **Covered-viewport obligations** (decided at reconciliation, 2026-11-08): §5.2 says the shell scrolls when a panel is taller than the screen and the panel does not shrink to fit. §8 has no item for this. It is formalized inside the overlay-presentation AC because an unreachable modal foot is a broken modal.
- **Several panels at once** (decided at reconciliation, 2026-11-08): §5.2 states panels open and close independently. §8 item 15 covers only the scroll-lock half. Independence is formalized explicitly in the reader-interaction AC, matching the landed UAT for two independent panels.
- **Applying an empty state to an edit document closes every panel** (decided at reconciliation, 2026-11-08): REQ-215 §4 says the builder always carries a state whose initial value is "no panel open", so Edit matches View from the first frame. The code sets the ready marker even for an empty state. That turns the settled in-flow render into the closed overlay presentation. This is formalized in the edit-apply AC.
- **Scroll lock in an edit document** (decided at reconciliation, 2026-11-08): REQ-215 does not say whether a told edit document locks scroll. The code sets the lock marker while at least one named panel is open and removes it otherwise, so the page behind an open panel stays put as in View. This is formalized in the edit-apply AC.
- **A draft panel with no opener is not forced open; a draft panel with no Close that has opted out of scrim dismissal stays open** (decided at reconciliation, 2026-11-08): REQ-215 §3 says closing falls back to the scrim and declines exactly as a reader's click would. It says nothing about opening a panel that has no opener. The code forces nothing in either case, because a reader could not have reached that state either. This is formalized in the draft-apply AC.
- **An untouched edit document reads as no panel open** (decided at reconciliation, 2026-11-08): with no open marker set, the read reports no panel, even though the settled in-flow panel is visible. This matches the visitor's first frame in View, which is the state the carry is meant to preserve.

## Dependencies
None.

## Story Points
5