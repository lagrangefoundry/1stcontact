---
uid: request-9500073f
id: REQ-406
type: request
title: 'Builder scopes: page style is claimed only when named, so a page-scoped builder
  can''t repaint the page'
created_by: EPIC-24
created_at: '2026-10-18T00:44:30.660563+00:00'
updated_at: '2026-10-18T00:56:44.172523+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: medium
  epic_parent: epic-f43a7c98
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-0ebd3665
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



## As built: implementation decisions

- **Name: `home.json#style`**, as proposed. It cannot collide with a section, because `style` is now a reserved section id: `sectionProblem` refuses a page with a top-level element called `style` ("would share its name with the page's style"). So such a page can't be decomposed, and no write can add a section with that id.
- **One enforcement point, REQ-397's store decorator.** `leased-store.ts` splits every stored page value (whole page or frame) into two units. The **body** (`home.json`) is everything except the L1 document keys other than `root`. The **style** (`home.json#style`) is exactly those keys: `widths`, `background`, `textColor`, `resources`, `column`, and any key added to the document later. A write touches the style file only if it changes a style key. So `set_page_style`, `use_font`, and any whole-page/frame write with a changed style key are all covered without changing any edit function. Since the per-file compare-and-set uses the same units, the style is compare-and-set like every other file.
- **Scopes.** `scopeFiles` is unchanged in behaviour: a page name expands to the page and its sections, and never adds `#style`. `home.json#style` is already a valid draft file name and is claimed only when named. The "not a draft file name" message now lists it.
- **Refusal.** `NOT_IN_SCOPE`, `file` = `home.json#style`. The message is: "This changes the page style of `home.json` (`background`), and `home.json#style` is not in this session's scope (…); nothing was written. To colour one section, fill that section's own box. Ask for `home.json#style` only when the brief changes the page itself." It lists every changed key.
- **Implicit writers** (consultant, client, system) lease `#style` only when their write changes the style. So a client page-style edit is refused `FILE_HELD`, naming the holder, while a builder holds `#style`, and is free while a builder holds only the page body. The router's existing `DraftFileRefusal` handler turns that into a 409. No client route writes page style today: `/api/palette` writes `site.json`. Any future one gets this for free.
- **Priming.** The `delegation-files` text (shown wherever scopes are enforced) lists the style file and adds: "Naming a page claims the page and every section it has now, but not its style: name `home.json#style` only when the brief asks for a change to the whole page, never to colour one section."
- **Gating** is REQ-397's. Builders are scoped only when the installed Delegate has `scope` (lagrange-framework REQ-207). Until then a builder write is implicit, so this refusal doesn't fire, and BUG-219's containment record is the protection.

## As built: UATs

`tests/test_UAT_FC_REQ-406_page_style_scope.test.ts` (node; real L1 operations, real lease decorator, real `claim` hook, memory store). These cases call the claim hook directly, as REQ-397's node cases do, so they always run and need no `skipIf`:
- a builder scoped to `home.json` (undecomposed) is refused `NOT_IN_SCOPE` on `set_page_style` and on `use_font`, the message names the key(s) and the guidance, and the stored draft is byte-identical;
- the same builder colours its header by filling the section's own box via `set_l1`; the page background is untouched;
- a whole-page write that changes `textColor` and `widths` is refused, naming both, and writes nothing;
- on a decomposed page, `home.json` claims the frame and its sections but not `#style`, and `set_page_style` is refused;
- a builder scoped to `home.json` + `home.json#style` repaints the page;
- a section can't be called `style`;
- a held `#style` refuses a second claim on it, while a claim naming only `home.json` succeeds (holding one doesn't hold the other);
- a client page-style edit is refused `FILE_HELD`, naming the builder that holds `#style`, and is allowed while a builder holds only the page body;
- priming names the style file and when to commission it.

Regression run: REQ-396 (node + workers), REQ-397 (node + workers), BUG-217, BUG-219, REQ-175, REQ-313, REQ-342, REQ-343, all green. REQ-295's `test_UAT_FC_REQ-341_a_worker_may_manage_pages…` fails the same way on a clean xgd-working checkout, so it isn't caused by this change.