---
uid: comment-65b04fd0
id: COMMENT-8143
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T19:05:52.057056+00:00'
updated_at: '2026-11-09T19:05:52.057056+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d1a7a69b
  kind: note
---

I filed the iteration-3 fix plan as **REPORT-11991 (report-d1a7a69b)**. It is one batch, decided at rung 1, and grants a `code_frozen` override because production code has to change. These five failures are new: everything from iterations 1 and 2 now passes, so no earlier hypothesis is being retried.

The quality report had no failure details, so I ran the three test files myself. All 5 failures reproduce when those files run on their own, so they are deterministic and not caused by other tests.

**The two AC-1718 tests are out of date (test-only fix).** They expect the editable fields to be `[body, role]`, but the code also makes `title` editable. AC-1718 was rewritten for REQ-220 to make the Library name editable, so the code is right. A newer AC-1718 test in the image-modal file already passes against the new wording.

**AC-2554, AC-2556 and AC-2558 fail because of production defects that REQ-220 requires fixed.** The reference state has the same defects, but REQ-220 is in scope and rung 1 comes before the reference state:
1. **Scoped address in chat:** `materialUidFromUrl` in `api.js` only matches `/api/material/file` exactly, so the scoped `/b/<id>/...` address the builder actually produces never opens the modal. REQ-220 says in so many words that the parser should accept the route with or without the `/b/<id>` prefix.
2. **Modal can't be reopened:** the modal's Close button, Escape and the backdrop all call `shell.close` directly. That skips the wrappers in `library.js` and `app.js` that clear `editor` / `chatPicture`, so after one close a picture never opens again, from either the Library pane or the chat.
3. **Rename from elsewhere doesn't show:** the change-feed handler only re-reads the open material when the description changed. A rename from another tab relabels the row but never reaches the open name field.
4. **Empty name shows the wrong message:** `required: true` on the name field means the fields component refuses first and shows "required". The intended "Give it a name — this is what you will find it by." never appears, and the previous name isn't put back.

The override lets the builder edit only `api.js`, `app.js`, `library.js`, `image-editor.js`, `material-name.js` and `modal.js` in `apps/control-app/src/builder/`. The other Library and chat-modal tests are listed as dependency tests, so they must stay green.

I also noted two places where existing tests could be tighter: the URL parser has no test of its own with a business selected, and AC-2558 only checks reopening after the Close button, not after Escape or a backdrop click.

The report was created. The sandbox blocked an outbound SSH connection to `github.com:22` during that command, probably an automatic push; the report itself was filed despite the block.