---
uid: bug-630b0ab0
id: BUG-388
type: bug
title: 'Paperwork → Legal: show the document first, standard or custom with confirmations,
  no owner-added sections'
created_by: EPIC-29
created_at: '2026-11-08T21:02:12.749865+00:00'
updated_at: '2026-11-08T23:24:39.516085+00:00'
completed_at: null
last_field_updated: story_points
status: ready_to_reconcile
fields:
  severity: medium
  parent_uid: epic-e3db69b8
  story_points: 5
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-cd8aadd1
  commits:
  - working_sha: 5eb8eb93fe65f3f211581b4f8b0714154118aa43
    reconcile_sha: null
    main_sha: null
  - working_sha: 7c15f49aec6ce82f8a212c422447a557f135034c
    reconcile_sha: null
    main_sha: null
  version: 0.2.835
---

## Symptom

[[REQ-669]] landed (ready_to_reconcile) with the Legal pane in a shape the operator has since rejected, and without the redesign its body's last section describes:
- The document view (`apps/control-app/src/builder/paperwork.js`, `openClientDocument`) still shows "Sections, and what added them" (the abandoned modular approach) and the wrong sentence "We keep this up to date: it is rebuilt from your site's features and your business details each time you publish". The notice never changes with the site's features.
- It opens on an always-open "Edit (markdown)" box rather than the current document.
- **Any owner can add their own sections** to a standard document. Operator: "This feels like additional complexity". The use cases were a business's own conditions (deposits, cancellation charges, made-to-order, age limits), and those are site text, not legal text. Decision: "drop the additional sections except for on 1c itself".
- The Legal assistant's chat box is not at the bottom of the page, as it is on every other tab.

Reconciliation runs in order, so this later ticket supersedes REQ-669 where they differ. Design: [[DOC-121]] §3 and §6 (updated 2026-11-08). [[DOC-120]] holds 1st Contact's sections.

**Explicit supersession of [[REQ-669]]:** item 1 (owner-added sections in Paperwork → Legal, for every business) is INVALIDATED except as described in part 2 here. REQ-669's "Paperwork → Legal: how a document is shown and edited" section is built here, not there; part 1 below is the authoritative version. REQ-669's "You can add your own sections" Terms sentence is INVALIDATED (already removed from DOC-120).

## 1. Paperwork → Legal: how a document is shown and edited

Applies to every legal document of every business, 1st Contact included. Wording uses the Privacy notice; for the terms documents say "terms" (e.g. "Use custom terms").

1. **No "Sections, and what added them" list,** and its data goes from the view.
2. **No "rebuilt from your site's features…" sentence.**
3. **The current document is shown first, read-only.** The always-open edit box, its Preview button and "Save my edit" go.
4. **Standard document.** Above the text, a short description: "This is 1st Contact's standard privacy notice. We keep it up to date for you, and it is filled in from your business details." On the right, **[Use custom notice]**. It opens a confirmation explaining the consequences (from then on the text is yours, we stop updating it, and you're responsible for keeping it accurate), with **OK | Cancel**. OK replaces the read-only text with the editor, starting from the current text.
5. **Custom document.** The area above the editor says where the owner is ("You're using your own privacy notice. We no longer update it for you.") and offers **[Use standard notice]**, with a confirmation. OK removes the editor and shows the read-only standard text again. **The custom text is kept, not deleted:** it stays in the version history, and choosing "Use custom notice" again starts from the last saved custom text.
6. **The editor is our standard LF editor:** `mountRichEditor` from `@lagrangefoundry/webui-markdown` (TipTap-based, already a control-app dependency), reading and writing the Markdown we store and render. Don't add TipTap or any other editor directly. The word "Markdown" never appears where a user sees it (no label, hint or button). Its output stays within what the safe legal renderer shows.
7. **Save and Cancel**, both with confirmations:
   - **Cancel:** "Changes since your last save will be lost." **Keep editing | Discard changes.** Discarding goes back to the last saved text.
   - **Save:** a checkbox, off by default, asking whether the change affects people. Privacy notice: "These changes change how we use people's information"; terms: "These changes matter to people already signed up". **Cancel | Save.** The checkbox drives the existing material-change behaviour (REQ-666). The confirmation says it goes live on save (legal pages publish on their own since REQ-669).
8. **The Legal assistant's chat box is at the bottom of the page,** as on every other tab's assistant. Reuse their layout; don't build a second one.

## 2. Added sections: 1st Contact only, from DOC-120

- **Owners cannot add sections.** Remove "Add your own section" and every add/edit/remove control for sections from the pane, and refuse the routes that write an owner section for any business, 1st Contact included. The Legal assistant no longer talks about adding sections. A document is **standard** or **custom**, nothing in between.
- **1st Contact keeps its added sections**, written only from [[DOC-120]], which we maintain. Its documents stay **Standard**, so standard revisions keep reaching them with its sections in place. The existing section records, placements and carry-through in rebuilds and revisions stay; only the owner-facing ways to write them go.
- **Changing DOC-120 reaches 1st Contact through a platform command,** e.g. `1c legal platform-sections --env dev|production`. It replaces 1st Contact's added sections with DOC-120's current ones and writes one new version of each affected document, material by default, with a flag for wording-only changes. The operator runs it. It applies only to the platform business. The one-off seed stays as it is.
- **On 1st Contact's pane, its sections show as part of the read-only document,** with no controls, and "Use custom notice" works as for any business.
- No other business has added sections today (only the seed wrote them), so nothing needs migrating.

## Test plan

UATs `test_UAT_FC_BUG-388_*`:
- The standard view shows the description and [Use custom notice] and no editor. Cancel in the confirmation leaves it unchanged; OK shows the editor seeded with the current text.
- The custom view shows [Use standard notice]. Switching back shows the read-only standard text and keeps the custom text, and switching to custom again starts from it.
- Cancel with unsaved changes confirms and discards to the last save.
- Save confirms with the checkbox, and the checked state reaches the material-change path.
- The pane has no "Sections, and what added them" list, no "site's features" sentence and no user-visible "markdown" text. The Legal assistant's chat box is at the bottom, as on other tabs.
- There is no add-section control for any business, and the owner-section routes refuse.
- After `1c legal platform-sections`, 1st Contact's documents carry DOC-120's current sections and stay Standard. A standard revision still applies to them with the sections in place.
- Update REQ-669's section tests (`test_UAT_FC_REQ-669_owner_sections_and_documents`, `_legal_pane`, `_standard_revisions`) to match: owner writes are refused, and 1st Contact's seeded sections still carry through.


## What changed (as built, 2026-11-08)

**Paperwork → Legal document view** (`builder/paperwork.js` `openClientDocument`, every business, 1st Contact included):
- No "Sections, and what added them" list (and `sections`, `ownSections`, `placements` are gone from the overview), no "rebuilt from your site's features" wording, no always-open edit box, no Preview, no "Save my edit".
- **Standard:** the current text first, read-only, under "This is 1st Contact's standard privacy notice. We keep it up to date for you, and it is filled in from your business details." with **[Use custom notice]** ("terms" for the terms documents). Its confirmation says the text becomes yours, we stop updating it, you are responsible for keeping it accurate, and nothing changes until you save; **Cancel | OK**. OK shows the editor, seeded with the last saved custom text if there is one, otherwise the current text. Nothing is written until Save.
- **Custom:** "You're using your own privacy notice. We no longer update it for you." with **[Use standard notice]**; its confirmation says the standard goes live on confirm and the custom text is kept in the history for the next "Use custom". OK writes the standard version (or, if the custom text was never saved, just closes the editor). The overview carries `custom`: the newest custom version's text, excluding versions carried over from before the records (seed history, `named_uid`).
- **Editor:** `mountRichEditor` from `@lagrangefoundry/webui-markdown` (degrades to its textarea). No user-visible "markdown" in the Legal pane (the own-document form's label is now "Text").
- **Cancel:** with no unsaved changes it just leaves; otherwise "Changes since your last save will be lost." **Keep editing | Discard changes**, and discarding goes back to the last save.
- **Save:** "It goes live on your site as soon as you save." with an unticked checkbox ("These changes change how we use people's information" / "These changes matter to people already signed up"), **Cancel | Save**. The checkbox's state is sent as `material` (REQ-666).
- The state label reads **Standard | Custom** (was "Edited by you"), in the list, the history and Shop's Terms-of-sale warning.
- **The Legal assistant's chat fills its pane**, so its text box sits at the bottom: `.builder-paperwork__assistant` is now a full-height column with no padding or scroll of its own, the same height chain as Settings' chat.

**Added sections: 1st Contact only**
- `…/documents/<id>/sections[/<section>]` answer **403** for every business (`SECTIONS_REFUSED`). `saveOwnerSection`/`removeOwnerSection` and the pane's section transport calls are deleted.
- New `replacePlatformSections` (client-legal.ts) and admin route `POST /api/admin/legal/platform-sections` `{sections, material}` (1st Contact's operator only, 404 otherwise). It retires every section in force, writes DOC-120's in order, then writes **one new standard version of each document whose text changes**, material unless `material: false`, and publishes the legal pages. A document 1st Contact has made custom is left alone; its sections come back with the standard text. A bad placement → 409.
- `1c legal platform-sections --env dev|production [--wording-only] [--origin] [--client-id/--client-secret] [--json]` reads DOC-120 with the same parse as the seed and posts it. The seed is unchanged.
- The Legal assistant's priming and the legal surface say Standard or Custom, nothing in between, and that a business's own conditions belong in site text. The revision email and the pane's revision notice no longer mention adding sections.

## Design decisions made during implementation
- Switching to custom is client-side until Save, so Cancel/"Use standard" before a first save writes nothing.
- "Last saved custom text" excludes seeded history, so 1st Contact's old Terms/Privacy texts are never offered as its custom text.
- `platform-sections` retires everything and rewrites, rather than diffing by heading. Only documents whose built text actually changes get a version.
- `POST …/preview` stays on the server (REQ-665's workers suite pins its safe rendering), but the pane no longer calls it.
- Known limit of the LF editor: StarterKit has no link or table support, so once TipTap has loaded, links in a custom text come back as plain text when edited.

## UATs
- `tests/test_UAT_FC_BUG-388_legal_document_view.test.ts` (jsdom, 7): standard view; the Use-custom confirm (Cancel/OK, editor seeded); Save's confirm and checkbox reaching `material`; Cancel/discard; Use standard keeping the custom text; no sections/markdown/add-section wording; the assistant chat filling its pane.
- `tests/test_UAT_FC_BUG-388_sections_are_1st_contacts_only.workers.test.ts` (6): section routes refused for platform and client; platform-sections in one material version, staying standard, plus wording-only; a standard revision still applies with the sections in place; a custom document left alone; route closed to others, bad placement 409; inert rendering.
- `tests/test_UAT_FC_BUG-388_platform_sections_command.test.ts` (2): reads DOC-120 the way the seed does; posts `{sections, material}`.
- Updated to match: REQ-665 `_legal_pane` and `_client_legal`, REQ-666 `_shop_and_legal_pane`, REQ-669 `_legal_pane`, `_owner_sections_and_documents` (owner writes refused), `_standard_revisions` (section written through `replacePlatformSections`), `_platform_cutover`, `_platform_seed`.