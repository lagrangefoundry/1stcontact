---
uid: report-d1a7a69b
id: REPORT-11991
type: report
title: 'Report: fix_plan for story-1500b111'
created_by: xgd
created_at: '2026-11-09T19:05:40.131271+00:00'
updated_at: '2026-11-09T19:20:29.359333+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-1500b111
  fix_iteration: 3
  items:
  - index: 0
    tests:
    - tests/reconciliation-library-image-modal.test.ts::test_UAT_AC2554_chat_picture_opens_the_same_modal_for_scoped_and_unscoped_material_addresses
    - tests/reconciliation-library-image-modal.test.ts::test_UAT_AC2556_library_name_is_one_field_in_pane_and_modal_committed_as_the_title_and_kept
    - tests/reconciliation-library-image-modal.test.ts::test_UAT_AC2558_undo_and_redo_step_through_the_sitting_saving_the_recipe_at_each_step
    - tests/reconciliation-library-role-correction.test.ts::test_UAT_AC1718_description_and_upload_role_are_editable_rendered_edited_as_source_and_stored
    - tests/reconciliation-library-tab.test.ts::test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored
    - tests/reconciliation-library-image-modal.test.ts::test_UAT_AC1718_name_description_and_upload_role_are_the_editable_fields_and_a_correction_is_stored
    dependency_tests:
    - test_UAT_AC1714_
    - test_UAT_AC1715_
    - test_UAT_AC1717_
    - test_UAT_AC1811_
    - test_UAT_AC1812_
    - test_UAT_AC1814_
    - test_UAT_AC1815_
    - test_UAT_AC2018_
    - test_UAT_AC2019_
    - test_UAT_AC2020_
    - test_UAT_AC2085_
    - test_UAT_AC2086_
    - test_UAT_AC2087_
    - test_UAT_AC2161_
    - test_UAT_AC2324_
    - test_UAT_AC2326_
    - test_UAT_AC2458_
    - test_UAT_AC2459_
    - test_UAT_AC2461_
    - test_UAT_AC2553_
    - test_UAT_AC2555_
    - test_UAT_AC2557_
    - test_UAT_AC2559_
    - test_UAT_FC_REQ-220_
    - test_UAT_FC_REQ-201_
    - test_UAT_FC_REQ-213_
    hypothesis: 'REQ-220 behaviours are missing from the builder: materialUidFromUrl
      rejects the scoped /b/<id>/api/material/file address, the modal own Close/Escape/backdrop
      call shell.close and bypass the editor.close wrappers in library.js and app.js
      so a closed picture never reopens, a title-only feed update never reaches the
      open name field, and the required:true name descriptor shows required instead
      of NAME_REQUIRED; separately the two older AC-1718 tests still expect body+role
      after AC-1718 added the Library name.'
    instructions: 'Five failures, two causes. (1) Production, under the code_frozen
      override. (a) builder/api.js materialUidFromUrl must accept the material file
      route with or without a leading /b/<businessId> prefix (still refusing member=
      and foreign paths), as REQ-220 orders. (b) Every exit of the image modal (its
      Close button, Escape, backdrop) must clear the caller handle: library.js openPicture
      keeps editor and app.js openPictureFromChat keeps chatPicture set because image-editor.js
      wires its Close button and modal.js wires Escape/backdrop straight to shell.close,
      never through the wrapped close. Make the dialog report its own closing to the
      caller (e.g. an onClose the editor forwards from createModalShell) so the picture
      can be reopened from pane and chat. (c) In the library.js change-feed handler,
      an update for the open material whose row title differs must push the new title
      into the open detail name field (nameField.setName), the image alt and an open
      modal, unless the name cell is in edit mode (.fields-control-cell present),
      where the typed text wins and nothing is read. (d) Emptying the name must send
      nothing, put the previous name back and show NAME_REQUIRED against the field:
      the required:true on MATERIAL_NAME_FIELD makes mountFields refuse with its own
      word before onCommit can throw NAME_REQUIRED, so the module own contract never
      applies. (2) Tests only: the two AC-1718 tests in reconciliation-library-role-correction.test.ts
      and reconciliation-library-tab.test.ts expect editable fields [body, role];
      AC-1718 now includes the Library name (title) on every material, so update those
      expectations (or delete a test whose claims the passing image-modal AC-1718
      test already covers, keeping its other claims). All dependency tests must stay
      green.'
    test_scope: test_UAT_AC2554_ or test_UAT_AC2556_ or test_UAT_AC2558_ or test_UAT_AC1718_
      or test_UAT_AC1714_ or test_UAT_AC1715_ or test_UAT_AC1717_ or test_UAT_AC1811_
      or test_UAT_AC1812_ or test_UAT_AC1814_ or test_UAT_AC1815_ or test_UAT_AC2018_
      or test_UAT_AC2019_ or test_UAT_AC2020_ or test_UAT_AC2085_ or test_UAT_AC2086_
      or test_UAT_AC2087_ or test_UAT_AC2161_ or test_UAT_AC2324_ or test_UAT_AC2326_
      or test_UAT_AC2458_ or test_UAT_AC2459_ or test_UAT_AC2461_ or test_UAT_AC2553_
      or test_UAT_AC2555_ or test_UAT_AC2557_ or test_UAT_AC2559_ or test_UAT_FC_REQ-220_
      or test_UAT_FC_REQ-201_ or test_UAT_FC_REQ-213_
    ladder:
      rung1: REQ-220 (in scope) orders the scoped-address parser fix verbatim, requires
        a closed modal to reopen, and gives the name field the feed path; AC-1718
        was rewritten for REQ-220 to include the Library name, so rung 1 decides all
        five.
      rung2: The reference has the same defects (api.js:1739-1753 exact pathname match,
        image-editor.js:297 Close wired to shell.close, library.js:832 and app.js:1702
        wrappers, library.js:1374 body_changed-only re-read), but material-name.js:49,75
        declares NAME_REQUIRED as the refusal; rung 1 overrules the reference.
      rung3: The AC-2554/2556/2558 tests stand and the code changes; the two AC-1718
        tests change because the AC moved.
    override:
      rule: code_frozen
      rung: 1
      justification: REQ-220 is in scope and requires that the parser recognise the
        material file route with or without a /b/<id> prefix, that the modal can be
        closed and reopened, and that the name field receives renames from the change
        feed with the typing guard; the reference lacks all three, and its own material-name.js
        declares NAME_REQUIRED as the empty-name refusal that the required:true descriptor
        short-circuits. The tests are right and the builder code is wrong.
      files:
      - apps/control-app/src/builder/api.js
      - apps/control-app/src/builder/app.js
      - apps/control-app/src/builder/library.js
      - apps/control-app/src/builder/image-editor.js
      - apps/control-app/src/builder/material-name.js
      - apps/control-app/src/builder/modal.js
      tip_evidence:
      - file: apps/control-app/src/builder/api.js
        lines: 1739-1753
      - file: apps/control-app/src/builder/image-editor.js
        lines: 297-297
      - file: apps/control-app/src/builder/library.js
        lines: 832-835
      - file: apps/control-app/src/builder/library.js
        lines: 1374-1374
      - file: apps/control-app/src/builder/app.js
        lines: 1702-1705
      - file: apps/control-app/src/builder/material-name.js
        lines: 42-76
      trust_boundary: false
  batches_pending: false
---

# Fix Plan — Iteration 3

## Hypothesis
Two separate causes. First, three REQ-220 behaviours that AC-2554, AC-2556 and AC-2558 assert are not in the builder code, and the reference has the same gaps:
- the chat parser rejects the scoped `/b/<id>/api/material/file` address;
- the modal's own Close button, Escape key and backdrop bypass the callers' `editor.close` wrapper, so a closed picture can never be reopened;
- a title-only change on the feed never reaches the open name field, and an emptied name shows the fields component's "required" instead of `NAME_REQUIRED` with the previous name put back.

Second, the two older AC-1718 tests still expect `[body, role]` after AC-1718 was rewritten for REQ-220 to make the Library name editable.

## Analysis
Iterations 1 and 2 fixed a different set of failures: REQ-181 badge tests, and REQ-168 `route()` scope tests in the workers suite. All of those now pass. The 5 failures in this iteration are new, so there is no repeated hypothesis.

The quality report had no JUnit detail, so I ran the three node test files to get the actual assertions.

1. **AC-1718, 2 tests (`reconciliation-library-role-correction.test.ts:326`, `reconciliation-library-tab.test.ts:285`)**
   - Both assert the editable fields are `['body','role']`. The code returns `['body','role','title']` (or `['role','title','body']`).
   - AC-1718's current text says "the editable fields of the detail view are the material's **Library name** (on every material…), the description, and, for material the client uploaded… *What it is for*". So the code is right and these tests are stale.
   - A third AC-1718 test, `test_UAT_AC1718_name_description_and_upload_role_are_the_editable_fields_and_a_correction_is_stored` in the image-modal file, already passes against the new wording.
   - Fix: test-only. Update the expected editable set to include `title`, or delete a test whose claims the passing test already covers. Keep the other claims (undescribed statement, markdown rendered/source, stored correction, no editable rights rows other than role).

2. **AC-2554 (`image-modal.test.ts:609`), click on the scoped address after the modal was closed opens nothing.** Two production defects combine here:
   - (a) `materialUidFromUrl` (`builder/api.js`, reference lines 1739-1753) requires `pathname === '/api/material/file'`, so `/b/<id>/api/material/file` resolves to null. REQ-220's "Answered from EPIC-1" section names this defect and orders the fix.
   - (b) `openPictureFromChat` (`app.js`, reference line 1702) clears `chatPicture` only inside its wrapped `chatPicture.close`. The modal's Close button (`image-editor.js:297` at the reference) calls `shell.close` directly. Escape and the backdrop also go through `shell.close`. So `chatPicture` stays set and every later click returns early.

3. **AC-2558 (`image-modal.test.ts:934`), "the picture can be reopened after its modal is closed".** This is the same close-path defect as 2(b), in `library.js` `openPicture` (reference line 832): `editor` is cleared only by the wrapped `editor.close`, which the dialog's own exits never call. REQ-220 says: "Closing and reopening the modal a month later, a crop can be widened again".

4. **AC-2556 (`image-modal.test.ts:727, 751, 752`)**
   - (a) The feed handler (`library.js`, reference line 1374) re-reads the open detail only when `body_changed`. A rename arriving with `body_changed:false` relabels the row, but `nameField.setName` is never called.
   - The code's own comment at `reload()` says "a picture renamed from another tab, or by the assistant, lands here". REQ-220 §8 accepts "the name field gets the same subscribe-feed guard `openDetail`'s `reload()` gives the description". So the title must reach the open name field from the feed row, except while the name cell is in edit mode. That guard already passes at line 738.
   - (b) An emptied name shows `"required"` and leaves the cell in its error state. `MATERIAL_NAME_FIELD` carries `required: true` (`material-name.js:45`), so `mountFields` refuses before `onCommit` runs.
   - The module's own declared intent never takes effect: `NAME_REQUIRED` (reference `material-name.js:49`) is thrown at line 75 so that `commit:'auto'` reverts the control and shows that sentence.
   - The field must end up showing `NAME_REQUIRED` with the previous name restored, and send nothing.

**Isolation:** these are not cross-suite effects. The failures reproduce when the three node files run alone (5 failed out of 15), and they are deterministic.

**Workers side:** `reconciliation-library-image-modal.workers.test.ts` (AC-2555/2556/2557/2559 routes) passes. The name route is correct; the defects are all in the browser builder.

## Spec Changes Made
None. AC-1718 already says what the code does. AC-2554, AC-2556 and AC-2558 say what REQ-220 requires.

## Weak Evidence Flags (preventative — best effort)
- `tests/reconciliation-library-image-modal.test.ts::test_UAT_AC2554_chat_picture_opens_the_same_modal_for_scoped_and_unscoped_material_addresses` — weak-observation — REQ-220 asks for a direct `materialUidFromUrl` case with a scope set (scoped, unscoped, member, foreign, absolute URL); a parameterised check inside this UAT would pin the parser apart from the click path.
- `tests/reconciliation-library-image-modal.test.ts::test_UAT_AC2558_undo_and_redo_step_through_the_sitting_saving_the_recipe_at_each_step` — weak-observation — closes only via the Close button; add one reopen after Escape and one after a backdrop click, since all three exits share the defect.

## Batches
**Batch 0 (single batch, all 5 failures).** The AC-1718 tests and the AC-2556 test assert on the same field (the name row's presence in the editable set), so they stay together. The production edits are a small, coupled set:
- `api.js` `materialUidFromUrl`;
- `app.js` and `library.js`, so the modal close always clears the open-editor handle;
- `library.js`, so the feed pushes the title into the open name field;
- `material-name.js`, so an empty name is refused with `NAME_REQUIRED` and the old value restored.

## Mode overrides (REQ-892)
- Batch 0
  - Rule: `code_frozen`, decided at rung 1.
  - Files: `apps/control-app/src/builder/api.js`, `apps/control-app/src/builder/app.js`, `apps/control-app/src/builder/library.js`, `apps/control-app/src/builder/image-editor.js`, `apps/control-app/src/builder/material-name.js`.
  - Justification: REQ-220, which is in scope, orders that the parser "should recognise the material file route with or without a `/b/<id>` prefix". It also requires that a closed modal can be reopened ("Closing and reopening the modal…"), and gives the name field the feed path with its typing guard. The reference has all of these gaps, but rung 1 comes before rung 2.
  - The empty-name sentence is the module's own declared contract (`NAME_REQUIRED`, `material-name.js:48-49, 69-76` at the reference), which the `required:true` descriptor short-circuits.
  - Dependency tests: every Library and chat-modal consumer of these files.

## Resolution ladder (REQ-938)
- **Batch 0, AC-2554/2556/2558: rung 1.** REQ-220's "Answered from EPIC-1" section orders the scoped-address parser fix verbatim. Its body requires reopen after close. Its §8 requires the feed path for the name field. Reference evidence: `api.js:1739-1753`, `app.js:1702`, `library.js:832` and `:1374`, `image-editor.js:297`, `material-name.js:49, 75`. The reference has the same defects, so the rung-2 reading is overruled by the in-scope intent.
- **Batch 0, AC-1718 (2 tests): rung 1.** AC-1718 was rewritten for REQ-220, a later intent, to include the Library name. The code shows `title` editable, so the older tests change, not the code.