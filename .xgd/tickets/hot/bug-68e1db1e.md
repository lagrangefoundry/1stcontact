---
uid: bug-68e1db1e
id: BUG-329
type: bug
title: 'Input upload question: picking several files uploads only the first, silently'
created_by: EPIC-19
created_at: '2026-11-02T20:48:49.492982+00:00'
updated_at: '2026-11-03T00:33:01.000637+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-731b41e4
  commits:
  - working_sha: a8cea10b1cd045a48e721f28dad5d89d2d018352
    reconcile_sha: null
    main_sha: null
  - working_sha: e7a40c6f187fcc3a9f22ccfe4abdbecefe67c6ed
    reconcile_sha: null
    main_sha: null
  version: 0.2.739
  story_points: 3
---

## Symptom

Production, 2026-11-02 (a test site build). On an Input upload question (a "photos still missing" ask, `input: upload`, `upload_role: site`), the operator picked several photos in the question's multi-file picker (REQ-619). Only the first arrived. The record:
- One `POST /api/material` for a photo at 20:23 (200, 12.9 s, one material created); no other upload request in that window, and none refused. So the browser sent one file.
- The ask has no `answer_material`: the answer citing the uploads was never saved.
- Separately, the same ask was recorded `answered` with `answer: "Uploaded to the Library"` (the BUG-216 "I've uploaded it another way" button) at 20:22:32.9, one second after a document upload on a *different* ask (a testimonials question) created its material at 20:22:31.9. Whether the client pressed it is unconfirmed.

Uploads on another upload ask (three documents, `upload_role: reference`) worked.

## Likely cause (to confirm by reproducing)

`plan-panel.js` `upload(ask, files)` sends the files one after another (each photo takes 10–15 s with capping and naming) and after each one does `if (asked !== site) return`. If the panel's `site` changes during the upload (the panel re-pointed or cleared, e.g. `setSite(null)` / `destroy()` when the view changes and the panel is re-mounted), the loop stops **silently**: the remaining files are never sent and the answer is never saved, with no message. A slow sequential upload makes navigating away during it likely.

The stray "Uploaded to the Library" answer may be a click landing on the photos ask's button after the list re-rendered under the pointer (REQ-619's one list folds answered items in place), or a handler bound to the wrong ask after a re-render.

## Fix

1. **Every picked file is uploaded, and the answer is saved,** even if the panel re-renders or the client switches view meanwhile: the upload belongs to the site and ask captured when the files were picked, not to whatever the panel shows later. Never stop silently; if the client switched to a different site, finish the uploads for the original site and save the answer there.
2. **Show progress per file** on the question ("Uploading 2 of 5…"), and name any file that's refused with the reason (as the Library does, REQ-221). Upload two or three at a time rather than strictly one after another.
3. **No answer the client didn't give.** Reproduce the stray "Uploaded to the Library" answer; whatever the cause, an upload on one ask never answers another, and a re-render never moves a click target under the pointer onto a different ask's button.

## Test plan

- `test_UAT_FC_<id>_all_picked_files_upload`: picking three files on an upload ask uploads all three and saves one answer citing the three materials.
- `test_UAT_FC_<id>_upload_survives_panel_rerender`: re-pointing or re-mounting the panel after the first of three uploads still uploads the other two and saves the answer on the original ask and site.
- `test_UAT_FC_<id>_upload_progress_and_refusals`: the ask shows "k of n" while uploading, and a refused file is named with its reason.
- `test_UAT_FC_<id>_upload_does_not_answer_another_ask`: uploading on one ask while another upload ask is open leaves the other ask unanswered.
## Reproduced

In jsdom against the real panel, with uploads held open: re-pointing the panel (`setSite('beta')`) or tearing it down (`destroy()`) after a file lands stops the sequential loop at its `if (asked !== site) return`. The remaining files are never sent, no answer is saved, and nothing is shown. The stray-answer mechanism reproduces too. Answering one upload question redraws it as answered and folds it in place (REQ-619), so the next question moves up. A pointer click aimed a moment earlier then lands on that question's "Uploaded" button and answers it.

## What changed (`apps/control-app/src/builder/plan-panel.js`)

- **The round belongs to the site and ask the files were picked on.** `upload()` captures the site at pick time and never stops on a redraw, a site switch or a teardown. Every file is sent with that site, and the answer is saved on that site and ask. `save(ask, body, site)` now takes the captured site, and draws the reply (or shows a failure) only while the panel still shows that site.
- **Three at a time** (`UPLOADS_AT_ONCE = 3`) rather than strictly one after another. The one answer cites the landed files **in the order they were picked**, whatever order they finished in.
- **Progress and refusals on the question:** an upload note (`.plan-ask__upload-note`, `role=status`) under the question says "Uploading k of n…" while the round runs. Afterwards it names each refused file as `<name> — <reason>` (the origin's message, else "the upload failed"), as the Library does (REQ-221). The files that landed are still the answer. If none landed there is no answer, and the refusals say why. The note is drawn on whichever block shows that ask (open or answered), so it survives redraws. It is kept per site and ask, and a later round on the same ask replaces it.
- **No answer the client didn't give.** A pointer click on a question that a redraw moved within 600 ms is not taken (`moveGuardMs` option, default 600). "Moved" means the question sits at or below the first block the redraw replaced, added or removed. A question also counts as moved when an upload note appearing or disappearing above it shifts it down or up. A keyboard-activated click (`detail` 0) always acts, because it targets the focused control, which no redraw moves. Each block's handlers are bound to that block's own ask, so an upload on one ask only ever answers that ask.
- Copy in `config.js` (`PLAN_UPLOADING`, `PLAN_UPLOAD_REFUSED`, `PLAN_UPLOAD_FAILED`); styles beside the other upload controls in `builder.css`.

## Design decisions

- Concurrency of 3 rather than unlimited. Each photo is capped, described and named on the origin (10–15 s). One at a time made five photos take about a minute, and all at once would set the model calls competing. This is why the Library's drop stays sequential.
- Guarding clicks by time-since-move rather than by measured geometry, so the rule needs no layout and holds in every renderer. It only swallows pointer clicks within 600 ms of a shift, which is exactly when the pointer's aim is stale.

## Tests

`tests/test_UAT_FC_BUG-329_every_picked_file_uploads.test.ts` (jsdom, real panel, transport replaced, uploads held open by the test):
- `all_picked_files_upload` — three picked files are all under way before any lands. They land out of order, and one answer on the original site cites all three in pick order.
- `upload_survives_panel_rerender` (×2) — five files; after the first lands the panel is re-pointed to another site, or destroyed. All five are still sent for the original site, and one answer citing five materials is saved on the original site and ask.
- `upload_progress_and_refusals` — the question shows "1 of 3", "2 of 3", "3 of 3" as files settle. A refused file is named with its reason after the round, and the answer cites the two that landed.
- `upload_does_not_answer_another_ask` — two open upload questions. Uploading on the first answers only the first. A pointer click on the second question's "Uploaded" right after the list moved does not answer it, and once the list has been still past the guard window the same click does.