---
uid: bug-39d43ee6
id: BUG-323
type: bug
title: 'Header: the builder sets the phone menu button to the word "Menu" unasked,
  overriding the three-bar default'
created_by: EPIC-19
created_at: '2026-10-31T21:43:31.362892+00:00'
updated_at: '2026-10-31T23:14:57.467161+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  priority: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-f27bebbb
  story_points: 3
  commits:
  - working_sha: 1243ae46640463df32497ce8e9625120afaa487a
    reconcile_sha: null
    main_sha: null
  - working_sha: a454e26c3d1b6848df06e3b88d03cc4e2069992a
    reconcile_sha: null
    main_sha: null
  version: 0.2.717
---

## Symptom

Production, 2026-10-31, Ariel's Arc Welding (`site_be615746320df3268946af454ff075e2`): on a phone the header's folded navigation shows the word "Menu", not three bars. BUG-289 made three bars the default precisely so the button reads as a page menu (and doesn't collide with a restaurant's food "Menu"), and the operator had agreed that.

## Root cause

- BUG-289's default is live: `render.ts` draws `node.menuButton ?? 'icon'`.
- Ariel's stored header (`header.json`, nav `header-nav`) carries `"menuButton": "label"` and `"menuLabel": "Menu"`, so the word is asked for explicitly.
- Nothing asked for it: no consultant Delegate brief mentions the menu button, and the plan records no decision about it. The builder set it on its own.
- The builder's view of the field presents the three values as equal choices (`l1NavSchema`: "three bars (`icon`, the default), the label's words (`label`), or both (`icon_label`)"), with no rule that the default stands unless the client asks.

## Fix

1. **The three-bar button stands unless the client asked for words.** The builder leaves `menuButton` unset (or `icon`) unless its brief asks for words on the button. The schema description the builder reads says so in one line.
2. **The host enforces it.** A builder write that sets `menuButton` to `label` or `icon_label` when the brief it is working from does not ask for it is refused with a reason ("the menu button stays three bars unless the client asked for words on it"), the same way other unrequested changes are refused. A consultant brief that does ask for it (the client said so) passes.
3. **Repair existing sites.** A stored nav with `menuButton: label`/`icon_label` and no client request on record is returned to the default (three bars) — Ariel's header included. If there is no cheap way to tell "requested" from "unrequested" on old sites, return all of them to the default; the client can ask again.

## Test plan

- `test_UAT_FC_BUG-323_builder_menu_button_refused_unasked`: a builder write setting `menuButton: 'label'` under a brief that doesn't mention the menu button is refused naming the rule, and the header still renders three bars at 375 px.
- `test_UAT_FC_BUG-323_menu_button_words_when_asked`: the same write under a brief asking for the word "Menu" on the button is accepted and renders the word.
- `test_UAT_FC_BUG-323_unrequested_word_button_repaired`: a stored site with `menuButton: 'label'` and no request renders three bars after the repair.
## What changed

- **The builder's rule.** The nav's schema description (`l1NavSchema`, `menuButton`) says the button stays three bars unless the client asked for words on it.
- **The host's check.** Each builder's brief reaches the writer its tool calls run as: the framework's account `mark` hook carries the worker session id and its goal, and `briefingAccount` (host-core) hands it to the draft claims (`DraftClaims.briefed`), so a builder's `Writer` carries `brief`. The lease store (`leased-store.ts`, every draft write goes through it) refuses a builder (scoped) write that gives a nav a word button (`label` or `icon_label`) it did not already have on that page, unless the brief asks for words on the menu button. The refusal is `DraftFileRefusal` code `NOT_ASKED`, says "the menu button stays three bars unless the client asked for words on it; nothing was written", and tells the builder to leave `menuButton` unset. A word button the page already had is not refused; the consultant, the client's own edits and `1c` are not checked.
- **What counts as asking** (`menu-button.ts`, `briefAsksForMenuWords`): one sentence of the brief names the button (menu button / toggle / icon, hamburger, or `menuButton`) and words on it (label, labelled, `icon_label`, word(s), text, says, reads, spelled, written). A brief that never mentions the button does not ask.
- **The repair.** Migration `0039_menu_button_default.sql` returns every stored draft nav with `menuButton` `label` or `icon_label` to `icon` (whole pages and decomposed section rows), keeps `menuLabel` (still the accessible name), and bumps the version of each site it changed so no copy assembled before the repair keeps being served. Nothing on record says whether a client asked, so all of them go back to three bars; a client who wanted the words can ask again. Published revisions are immutable: Ariel's live site shows three bars from its next publish.

## Design decisions

- The check sits in the lease store rather than in each L1 operation, because every draft write already passes through it and it already knows who is writing and with what scope.
- The repair is a D1 migration so it runs once, at deploy, on every environment. A text replace is exact because the definition columns hold compact `JSON.stringify` output; the same characters inside a string would be escaped.