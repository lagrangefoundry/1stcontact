---
uid: request-9500073f
id: REQ-406
type: request
title: 'Builder scopes: page style is claimed only when named, so a page-scoped builder
  can''t repaint the page'
created_by: EPIC-24
created_at: '2026-10-18T00:44:30.660563+00:00'
updated_at: '2026-10-18T00:44:43.093982+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  epic_parent: epic-f43a7c98
  auto_merge_back: true
  needs_review: false
---

## Intent

A builder session may change a page's **style** only if its scope names the style explicitly. Page style means the L1 document keys other than `root`: background, text colour, widths, fonts/`resources`, column. Without that, `set_page_style` and `use_font` are refused before anything is written, and the refusal tells the builder to fill its section's own box instead. This is gap 2 of BUG-219. EPIC-19's notes on BUG-219 assigned it to EPIC-24's scopes: refusing the write outright is stronger than a containment check after the fact.

## Why a new ticket: what REQ-396 / REQ-397 already cover and what they miss

- **Covered:** on a *decomposed* page, a builder scoped to sections (`home.json#hero`) doesn't hold the frame `home.json`. Its `set_page_style` is refused with `NOT_IN_SCOPE` (REQ-397: "holding a frame doesn't hold its sections"). REQ-396 already routes page-style writes to the frame only.
- **Not covered, and this is the BUG-219 incident itself:** the builder's scope was `home.json`, a whole page. Under REQ-397, a page name claims the page (or its frame) and all its sections, so the builder holds the file the page style lives in, and the write is allowed. Every builder briefed to "work on the home page" can still repaint the whole page to fix one section.
- REQ-396 and REQ-397 are both at `ready_to_reconcile`, so their bodies can't be extended. Hence a separate ticket.

## Behaviour

1. **Page style is its own scope unit.** Proposed name: `home.json#style`. Final naming is the implementer's call, but it must not collide with a section id. The unit exists for both decomposed and undecomposed pages. For an undecomposed page, the style keys are the only part of `home.json` it excludes.
2. **Naming a page doesn't claim its style.** A scope of `home.json` claims the page body (the whole undecomposed page minus its style, or the frame's section list, modules and SEO plus every section), but not `home.json#style`. The consultant must name `home.json#style` to commission a page-style change.
3. **Refusal.** A builder whose scope lacks the page's style unit gets `NOT_IN_SCOPE` from `set_page_style` and `use_font`, and from any `set_l1`/frame write whose result changes a style key. The message names the key, says nothing was written, and says: "to colour one section, fill that section's own box. Ask for `home.json#style` only when the brief changes the page itself."
4. **Locks.** `home.json#style` is leased like any other REQ-397 file. Holding it doesn't hold the page body, and the reverse. The consultant's implicit writes and the client's hand edits (palette / page-style routes) take it implicitly, the same way they take other files.
5. **Consultant manual and priming.** Where the builder-session/scope text lists file names, add the style unit, plus one line: commission it only when the brief asks for a page-wide change.
6. **Gating is the same as REQ-397.** Builders are scoped only when lagrange-framework REQ-207 is installed. Until then, BUG-219's containment-record fix (page-style changes now appear in `account.changed`, and "page"/"addresses" checks fail on them) and the gap-3 builder priming are the protection. No new containment check wording is added (agreed on BUG-219).

## Test plan

`tests/test_UAT_FC_REQ-406_*` through the real toolbox / host with a scripted model backend, `skipIf` the installed Delegate lacks `scope`, the same way as REQ-397's delegation cases:
- builder scoped to `home.json` (undecomposed) calls `set_page_style` with a new background → refused `NOT_IN_SCOPE` naming the key, and the stored page is byte-identical;
- the same builder fills its header section's own box via `set_l1` → succeeds;
- a `set_l1` whose result changes a document key (not `root`) is refused the same way;
- builder scoped to `home.json` + `home.json#style` → `set_page_style` succeeds;
- `home.json#style` held by one builder → a second delegation naming it is refused `scope_held`, and one naming only `home.json` is allowed;
- a client page-style edit while a builder holds `home.json#style` → 409 naming the holder.
Regression: REQ-396 and REQ-397 UATs, BUG-219 UAT.
