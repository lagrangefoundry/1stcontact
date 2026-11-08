---
uid: story-e214a00d
id: STORY-175
type: story
title: 'L1 Modals: an author can declare an overlay panel and the controls that open
  and close it'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:07:18.748985+00:00'
updated_at: '2026-11-08T13:25:14.343311+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-0d00566a
  capability_uid: capability-ae9d65d6
  story_kind: feature
  story_points: 3
---

## Story
**As a** site author (the AI building a business's site, or a reproduction folding a captured reference), **I want** to declare that a subtree is a modal panel and that certain nodes open or close it, **so that** any site can have a modal for any content, with all of its look coming from the site definition and all of its accessibility obligations kept by the platform, without anyone writing a module for that one flow.

## Description
REQ-212 adds two node *roles* to L1. They are roles, not new node kinds, following the `link`/`reveal` precedent:

- **`dialog`** (the overlay role) may go on `box` and `container`. It carries only what a reference can legitimately vary: `backdrop` (scrim colour + opacity; absent = no scrim), `placement` (`center` | `top` | `bottom`; absent = center), `dismissOnEscape` (default true), `dismissOnBackdrop` (default true) and `ariaLabel`. The panel's own look comes from the node's ordinary axes. The role adds no way to paint.
- **`action`** (the disclosure verb) may go on `box`, `container` and `text`. It is a closed set of two verbs, `opens` / `closes`, each naming the id of a panel.

The validator enforces four whole-document structural rules: a panel declares an id; an action names exactly one verb; the target exists and carries `dialog`; `link` and `action` cannot both appear on one node.

The renderer retags an action node as `<button type="button">`, wraps a panel in a covering shell, and emits one vetted script (byte-identical for every site, no instance data) only when the document has a modal. The script owns opening and closing, focus moving in and back, the Tab trap, Escape, scrim click and scroll lock. With no script the page still works: the panel lays out in flow and open. The edit render ships no script. A `reveal` on a panel is not emitted. A document with no modal renders byte-for-byte as before. REF-l1 projects the new role, verb and rules.

**Out of scope** (REQ-212 §6): multi-step vocabulary or any L1 state machine; a general event system; migrating `account-chrome` onto the role; use of the platform `<dialog>` element.

## Technical Context
- Part of CAP-70 (Framework Substrate: L1 Layout, Values & Behavior Modules). Amends DOC-23 and cross-references DOC-25 §10.3: L1 owns what a reference can vary, the renderer owns what an obligation pins.
- Security Policy: still structured-only. The dialog shape is `.strict()`, the scrim reuses the existing overlay (hex colour + opacity) shape, and the script reads only its own markers, never a selector, key or script from the document. The renderer stays the sole emitter.
- The script and the invariant stylesheet are exported by name so CSP-bound consumers can hash them.
- Edit render parity with CAP-84 (Edit Render Channel): an action keeps its `<button>` and loses its acting attribute, just as a link keeps `<a>` and loses `href`.
- REF-l1 projection is covered by the BUG-48 reference-covers-source test.
- Evidence: `tests/test_UAT_FC_REQ-212_l1_modals.test.ts`, `tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts`.

## Reconciliation Decisions
- **Link/action exclusion is an explicit validator rule** (decided at reconciliation, 2026-11-08): REQ-212 §4.3 lists three structural rules and leaves link-and-action to strict-shape refusal. §8 item 16 then speaks of "four new structural rules". The landed code adds the link-or-action exclusion as a fourth named rule with its own message. That is consistent with §8, so it is formalized as the fourth rule in the refusal AC and the REF-l1 AC.
- **Covered-viewport obligations** (decided at reconciliation, 2026-11-08): §5.2 says the shell scrolls when a panel is taller than the screen and the panel does not shrink to fit. §8 has no item for this. It is formalized inside the overlay-presentation AC because an unreachable modal foot is a broken modal.
- **Several panels at once** (decided at reconciliation, 2026-11-08): §5.2 states panels open and close independently. §8 item 15 covers only the scroll-lock half. Independence is formalized explicitly in the reader-interaction AC, matching the landed UAT for two independent panels.

## Dependencies
None.

## Story Points
3