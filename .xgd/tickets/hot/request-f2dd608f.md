---
uid: request-f2dd608f
id: REQ-656
type: request
title: 'Library: an Upload button that adds files straight to the Library'
created_by: EPIC-19
created_at: '2026-11-05T19:17:28.502314+00:00'
updated_at: '2026-11-06T20:27:46.621269+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  parent_uid: epic-95bc3b15
  story_points: 5
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-7063f0f8
  commits:
  - working_sha: 9f84eb73adb3f5ca86919c4e21ab0872011f3bed
    reconcile_sha: null
    main_sha: null
  - working_sha: c664132b1ca08d72b967e7f50e3c17545c4178dd
    reconcile_sha: null
    main_sha: null
  version: 0.2.805
---

## What

The Library gets an **Upload** button, so a client or operator can add their business's material straight to it without going through the conversation.

- **Upload** sits in the Library's header, next to its filters. It opens the same file picker the conversation's **+** uses: the same accepted types, several files at once, and on a phone or tablet the system's photos, camera or files choice.
- **Dropping files onto the Library** does the same, with the same drop highlight the conversation shows.
- **One upload path.** Files are processed exactly as conversation uploads are (stored, described, sorted into the upload areas, social exports unpacked), and appear in the Library as ordinary material with progress shown on their rows. No second upload implementation.
- **The consultant finds out.** On its next turn it is told the client added files to the Library, and which ones, in the same form as other background material notices. It reads them like any other material. The upload itself doesn't post a chat message or start a turn.
- Limits and refusals (file size, type, the archive limit) are the same as in the conversation, and are shown in the Library.

## Why

The operator asked for it (2026-11-05). The Library is where a client looks at their material, and it is the natural place to add more. Today the only way in is the conversation's **+** or dropping files on the conversation.

Related prompt change, made directly without a ticket: the hand-over opening now asks for business material, and the playbook (DOC-75, "Sending you files") gives the consultant exact upload instructions. Done on landing (2026-11-06): that line now also tells the client they can open the Library tab and click **Upload**, or drop files on the list, and that the consultant is told on its next turn.

## Design decisions (made at implementation, 2026-11-06)

- **Supersedes REQ-161's role overlay on the Library (explicit supersession).** The "Purpose" sheet that a file drag over the Library raised (two areas, *Site asset* / *Background information*, nothing created without a choice) is removed, together with `upload.js`, its stylesheet and `UPLOAD_PROMPT`. A drop on the Library now behaves like a drop on the conversation: an outline on the Library while files are dragged over it, and the files go straight in. The REQ-161 ACs about the overlay (it asks "Purpose", drop into an area commits that role, a drop outside both areas creates nothing, both entry points raise one overlay, dismissing creates nothing) are invalidated by this ticket. `UPLOAD_AREAS` stays as the role vocabulary the Library's filter, its role field and the consultant's manual use.
- **What a file is for is the conversation's default**, `defaultRole` in `attachments.js`: pictures, fonts and ZIPs are *Site asset*, everything else *Background information*. The client corrects it on the row (REQ-213's role field), as they would on a conversation chip.
- **One picker and one drop handler, shared.** `attachments.js` exports `filePicker` (the hidden `<input type=file multiple accept=UPLOAD_ACCEPT>`) and `watchFileDrops` (the `is-dropping` outline and drop capture). The conversation's tray and the Library both use them, so the accepted types and the drop behaviour cannot drift.
- **Progress on the rows.** While a file uploads, the Library shows a line for it ("Uploading `name`…") in the same status area ZIP imports use. When that file is stored the line goes and the Library re-reads, so its row appears one file at a time. A ZIP is followed by the existing import lines (REQ-635).
- **How the consultant is told.** The upload carries `source=library`, and the material ticket records `added_via: library`. The per-turn corpus delta (REQ-160) already sweeps new material every turn. It now picks out material *created* since its cursor with `added_via: library` and says them in their own line: `Your client added N files to the Library: IMAGE-12 (`shop.jpg`), …. Read or search them like any other material.` Those files are left out of the generic "documents entered this client's knowledge" line, so they are not announced twice. There's no extra store query. Conversation attachments are not marked, because their message already announces them. ZIPs from the Library are announced by the existing imports notice (REQ-635) once unpacked.
- **The first turn now stores the delta cursor.** Opening a session creates its chat ticket, so the delta used to persist its cursor only once something had changed. On a business with no awareness map, the next turn re-took the cursor at "now", after a file the client added between the two turns, and that file was never told. The cursor is now written whenever the chat holds none. Without this, a Library upload in a new business's first conversation would go unannounced.
- **A refused file** shows `<filename> — <the origin's sentence>` in the Library's refusal line (REQ-221), the same sentence the conversation's chip shows. The ZIP size limit is checked before sending, by the same `uploadArchive` the conversation uses.

## Test plan

- `tests/test_UAT_FC_REQ-656_library_upload_button.test.ts` (the real `mountBuilder`, jsdom, Library transport injected):
  - **Upload** sits in the Library's filter row and opens a picker whose `accept` and `multiple` match the conversation's **+** picker.
  - Picking two images shows an "Uploading …" line for each, sends both through the one upload transport (`role: site`, `source: library`), draws two rows and clears the lines. No chat message is posted and no turn starts.
  - A file dragged over the Library gets the `is-dropping` outline and no question sheet. Dropping a PDF adds it as `reference` with `source: library`.
  - A refused file shows the origin's sentence in the Library's refusal line, and the conversation's chip shows the same sentence.
- `tests/test_UAT_FC_REQ-656_library_upload_told.workers.test.ts` (workerd: the real route, D1/R2 and the corpus delta; model boundaries stubbed):
  - In a business's first conversation, a file uploaded with `source=library` is stored with `added_via: library` (same `material` record and `origin: uploaded` as a conversation upload). The next turn says `Your client added 1 file to the Library since your last turn: IMAGE-n (`van.png`).` exactly once. A conversation upload in the same window stays in the corpus line and isn't marked. The turn after says nothing more.
  - An unknown `source` is refused with 400 and stores nothing.
- Superseded tests, rewritten or removed (REQ-161 overlay):
  - `test_UAT_FC_REQ-161_upload_overlay.test.ts` is deleted.
  - `reconciliation-upload-overlay.test.ts` keeps only AC2021 (one definition names each role), now read from `UPLOAD_AREAS`. The overlay ACs AC1725–AC1735 are dropped; seven of them were already failing on clean working.
  - The REQ-176, REQ-221, REQ-414, REQ-635 and BUG-70 suites drop their overlay steps: the drop now goes straight onto the Library, the picker is checked through `filePicker`, and BUG-70 checks the Upload button's size instead of the overlay's.
- Regression: the builder, Library, attachment and upload suites, and the workers suites for the delta and the material route, show no new failures against a clean-working baseline. The remaining failures there are pre-existing, or are worktree location artifacts: webui serving, env files.