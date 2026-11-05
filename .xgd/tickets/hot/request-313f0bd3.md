---
uid: request-313f0bd3
id: REQ-635
type: request
title: 'Material: accept the social platforms'' own exports (ZIP) and file their photos,
  posts and reviews in the Library'
created_by: EPIC-19
created_at: '2026-11-03T00:01:44.295847+00:00'
updated_at: '2026-11-03T01:16:53.421049+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-7d8f52d7
  commits:
  - working_sha: 370ea702b1d4c77e8d646bbc966550f5403aea17
    reconcile_sha: null
    main_sha: null
  - working_sha: 3d135125a3a823abbb7412221cecd6b8a29a13fd
    reconcile_sha: null
    main_sha: null
  version: 0.2.741
  story_points: 13
---

## Why

DOC-82 §5 step 0 (gather first) and DOC-71 §12.1 (2026-10-26, never ticketed): a client's social pages are high-value material, but a capture of a social link usually hits a login wall, and copying content out piece by piece is tedious and lossy. The major platforms each offer a one-file export of the owner's own content; we should take it. Uploads don't accept ZIP today (`UPLOAD_ACCEPT` in `config.js`: images, PDF, text, CSV, HTML, JSON, XML, YAML, fonts).

## What

1. **Uploads accept ZIP files** everywhere a client can upload (Input questions, the Library, the chat's attach button), up to a size limit suited to media exports (decide by measurement; a few hundred MB is typical for photo-heavy exports) with a clear message past it.
2. **Recognised exports are unpacked into ordinary material.** The host detects the platform from the archive's structure and files what matters into the Library, each item tagged with where it came from:
   - **Facebook / Instagram** ("Download your information", Meta Accounts Center; HTML or JSON): photos and videos of posts, post text and captions, profile/about text.
   - **LinkedIn** ("Get a copy of your data"): profile text, positions, posts and articles.
   - **Google Business Profile** (Google Takeout): business info, reviews and their replies, posts, photos.
   
   Photos go in as pictures (capped as usual, BUG-206), text as documents the consultant can read and search, reviews as a document with each review attributed. Duplicates and tiny or irrelevant items (avatars, UI icons, ads data, messages) are skipped. Private messages and other people's personal data are never imported.
3. **An unrecognised ZIP** is unpacked as a set of files: each supported file inside becomes material as if uploaded on its own; the rest are listed as skipped, with the reason.
4. **The consultant is told what arrived** ("Your Instagram export added 84 photos and 120 post captions to the Library") and can ask about it like any other material.
5. **Guided instructions** in the system knowledge base, one short entry per platform: where to request the export, which options to choose (all time, high-quality media, HTML or JSON), how long it usually takes, and "when the email arrives, upload the file here". The consultant links the right entry when the client mentions a platform.
6. **Never ask for a password,** and no official API access in this ticket (DOC-71: later, with Meta's app review).
7. **Large unpacking runs in the background** (it may take longer than one request), with progress on the upload ("Unpacking your export: 40 of 84 photos").

## Decisions (2026-11-02, with the operator)

- **ZIPs are capped at what one request carries: 95 MB.** No chunked upload. Cloudflare refuses request bodies over 100 MB (Free/Pro zones), so 95 MB is the measured ceiling. A ZIP over it is refused before any bytes are sent, and again by the origin, with one message saying the limit and how to make a smaller export (a shorter date range or lower media quality). The ZIP is sent as the raw request body to its own route and streamed straight into R2 — never buffered whole in the Worker (128 MB of memory) — and the job reads it back one entry at a time with range reads. The ZIP itself is deleted from storage once it is unpacked (it can hold messages and other data we never import).
- **Roles:** photos and videos inside an archive take the drop area the client chose; every text document an export yields (captions, posts, profile, positions, articles, business info, reviews) is always Background information (`reference`).
- **At most 100 photos/videos per archive, most recent first** (by the platform's own timestamp where it gives one, else the file's date in the ZIP). The rest are reported as skipped ("N older photos not imported"). Text is never capped.
- **Meta HTML exports:** JSON is parsed fully; an HTML export still yields its photos and videos and the post text read from its HTML. The guide entries say to choose JSON.
- **Fixtures** are built from each platform's documented layout; TODO-19 (todo-c365a65f) is the operator's task to make real exports and test them.
- **Job:** one Cloudflare Workflow instance per archive (`MaterialImport`, binding `MATERIAL_IMPORT`), one checkpointed step per batch of entries, its state a row in a new D1 table `material_imports` (REQ-631's shop-import pattern). Without the binding (suites, CLI) the same steps run in the isolate. The upload surfaces poll the import and show its progress; the finished import lists the materials it created, so an Input question answered with a ZIP cites every item it produced.
- **Each imported item says where it came from**: `from_import` (the import id) and `from_platform` on the material, and a line "From your Instagram export." under its description. Duplicates inside one archive (same bytes) are imported once.

## What landed

- **The way in.** `UPLOAD_ACCEPT` now offers `.zip`; the Input question's picker already took any file. A ZIP from any of the three surfaces goes through `uploadMaterial` in `api.js` to `POST /api/material/archive?filename=&role=` as the **raw body** (`content-type: application/zip`), refused in the browser first when over 95 MB (`builder/archive-limit.js` holds the limit and the one sentence, shared with the Worker). The route streams the body into R2 under `imports/<business>/<id>.zip`, opens a `material_imports` row (migration `0042`) and starts the job: the `MaterialImport` Workflow (`worker.ts`, bound as `MATERIAL_IMPORT` in every environment in `wrangler.toml`), or the same steps in the isolate without the binding. It answers `202 { import }`; `GET /api/material/archive?id=` is one import, without `id` the business's recent imports. A ZIP posted to the ordinary multipart `/api/material` is refused (400, naming the archive route) rather than stored as one unreadable document. The role is required on the archive route.
- **The job** (`material-import.ts`): step "plan" reads the ZIP's central directory by range (`zip-reader.ts`: stored and deflated entries, ZIP64, encrypted/unsupported entries refused per entry; an entry is checked against the 25 MB material ceiling before and while inflating), detects the platform and writes the plan to R2 beside the ZIP; then one step per batch of 5 items, each item advancing the row's cursor as it lands (a retried step resumes, never re-imports); then "finish", which deletes the ZIP and its plan. A failure records the client's sentence on the row and also deletes them.
- **The planner** (`export-plan.ts`): Instagram (JSON posts + media, profile Name/Username/Bio/Website/Category only; HTML: media under `media/posts/` and the post text), Facebook (JSON posts + their media, profile name/intro/websites; HTML likewise), LinkedIn (`Profile.csv` headline/summary/industry/location/websites — never address, birth date or messengers; `Positions.csv`; `Shares.csv`; `Articles/`), Google Business Profile (every JSON under `Google Business Profile/` or `Google My Business/`: reviews with stars, the reviewer's published display name only, date and the business's reply; local posts; location info; photos). Meta's byte-per-character mojibake is repaired. Before any planner runs, messages, other people's details (followers, connections, friends, contacts, invitations, endorsements, recommendations), comments and reactions, ads data, account and security details, profile pictures and stories are set aside as counted skip lines; whatever else an export holds is "Other files — not part of what we take from a … export". An unrecognised ZIP yields every file an upload takes (pictures, video, PDF, text formats, fonts) and lists the rest per file with a reason (another ZIP, an unreadable kind); `__MACOSX/`, `.DS_Store` and `Thumbs.db` are not listed. Content types come from the one table (REQ-246), not a new one.
- **Per item**: same bytes as an earlier item → skipped "the same as another file in this archive"; a picture under 64×64 → skipped as an icon or thumbnail; otherwise `ingestUpload` with the chosen role for pictures and files and `reference` for every document an export writes, carrying `from_import`/`from_platform` (now also on every Library row) and the note "From your Instagram export." / "From <file>.zip.". Ingest refusals (too large, HEIC unreadable) become skip lines. Imported site pictures are Library pictures marked for the site; they are not copied into the site's assets (the consultant places them as any other Library picture).
- **What the client sees.** Each import carries a `summary`: "Unpacking your Instagram export: 40 of 84" while it runs, then "Your Instagram export added 84 photos and 2 documents (Instagram post captions, Instagram profile) to the Library. Skipped: …" (a generic archive is named by its file). The Library shows one line per import it has seen this page, polled every 2 s while one runs, and redraws its list when one finishes. A ZIP on the chat waits on its chip ("I'll unpack it into the Library once sent") so it goes with the role chosen there; it uploads on send, the message carries "📎 Attached: `x.zip` — a ZIP, being unpacked into the Library (its photos for the site); you will be told what it adds", and the Library follows it. An over-limit ZIP is refused on its chip at once. An Input question answered with a ZIP shows the progress under the panel, waits for the unpacking, and answers with every material it produced (nothing usable answers nothing). A reload during an unpacking does not resume the progress line (the import itself carries on).
- **The consultant is told** on its next turn, once, on its own cursor on the chat ticket (`imports_told`; a session never told is told the past week's): "Your client's Instagram export (x.zip) has been unpacked into the Library: … Left out: … Each item says which export it came from; read or search them like any other material, and tell the client what arrived in a line." (≤ 900 chars, beside the plan-answers notice).
- **Guidance**: DOC-83 (doc-fd0b7601, `system_kb`) — one entry per platform: where to request, what to choose, how long, "upload the file here", and the 95 MB advice. The consultant's material track now says: offer the platform's own export, never ask for a password; the "Social exports" guide has each one's steps (the no-knowledge priming says the same without the guide). It reaches the shipped KB at the next `1c kb build`.

## Test plan

`tests/test_UAT_FC_REQ-635_export_import.workers.test.ts` (the route, real D1 and R2, the job in-process; describers and the model are the doubles):
- `test_UAT_FC_REQ-635_zip_upload_accepted_and_oversize_refused` — a ZIP is accepted (202) and its archive deleted once unpacked; over 95 MB is 413 with the message; no role is 400; a ZIP on the multipart route is 400 naming the archive route.
- `test_UAT_FC_REQ-635_instagram_export_unpacked` — 3 photos (role site) and two documents (role reference), each tagged and noted; caption mojibake repaired; profile without email or birth date; no message text, message photo, avatar or follower; the skip lines.
- `test_UAT_FC_REQ-635_instagram_export_takes_the_most_recent_100_photos` — 103 posts → 100 newest imported, "Older photos and videos (3)".
- `test_UAT_FC_REQ-635_google_reviews_imported` — reviews document with stars, published name, date and reply, newest first, no reviewer photo; info and posts documents; the photo.
- `test_UAT_FC_REQ-635_facebook_export_unpacked`, `test_UAT_FC_REQ-635_linkedin_export_unpacked` — posts, profile (no email, address or birth date), positions, articles; no messages or connections.
- `test_UAT_FC_REQ-635_unknown_zip_unpacked_as_files` — three photos and a PDF become four materials in the chosen role; `setup.exe`, a duplicate and a 16×16 icon listed as skipped with reasons; `__MACOSX` not listed; the exact summary.
- `test_UAT_FC_REQ-635_consultant_told_what_arrived` — after an Instagram export is unpacked, the next turn's tail carries the notice; the turn after does not.

`tests/test_UAT_FC_REQ-635_zip_upload_surfaces.test.ts` (jsdom, the real builder and plan panel; transports are the network):
- `…_zip_upload_accepted_by_the_browser_transport_and_oversize_refused_before_sending` — `.zip` in the accept list; `uploadMaterial` posts the raw file to the archive route; an oversize ZIP throws the message and sends nothing.
- `…_zip_upload_accepted_from_the_library_with_progress` — drop on the Library's Site area; the progress line, then the outcome.
- `…_zip_upload_accepted_from_the_chat_attach_and_sent_with_the_message` — the chip waits, its role is changed, send uploads with that role and the message carries the archive line; the Library follows it.
- `…_oversize_zip_refused_on_its_chip`.
- `…_zip_upload_accepted_from_the_input_question_and_answers_with_every_item` — progress under the panel, then one answer citing every produced material.

Regression scope run: REQ-246, REQ-291, REQ-221 (×3), REQ-414, REQ-161 (×3), BUG-196 (×2), REQ-158, BUG-303, BUG-48, REQ-358, BUG-103, BUG-153, BUG-236, REQ-201, REQ-364, BUG-129, REQ-631, REQ-149, REQ-159, BUG-256, BUG-200 — green. Two failures were red before this change, and stay red: BUG-244's "+" text and REQ-466's critic budget (8653 > 8600).


## Merge note (for reconcile)

While this work was in progress, BUG-329 rewrote the plan panel's `upload()` (several files at once, an "Uploading k of n…" note per question) and REQ-634 added migration `0041`. Merging xgd-working into `free-REQ-635` resolved both inside the merge commit `145ec5e`. Reconcile does not carry that commit, so when it replays `370ea70` over them, the final shape is this:
- **Plan panel:** no panel-level progress element. An archive upload runs inside BUG-329's round. The ZIP's `summary` shows in that question's upload note as `.plan-ask__uploading.plan-ask__unpacking`, first as progress and then as the outcome, and stays there after the round, as a refusal does. A failed import is a refusal (`PLAN_UPLOAD_REFUSED(name, summary)`). The answer cites every produced material: `uids.flat()`. The UAT reads `[data-ask="photos"] .plan-ask__unpacking`.
- **Test schema factory:** `0041_default_currency` and then `0042_material_imports`. `atHead` checks that the `material_imports_business` index is present and `shop_settings` is gone.
- **Migration manifest:** both `0041` and `0042` keys.
- **router.ts:** the `material-import` imports go beside REQ-634's `DEFAULT_CURRENCY_PATH, defaultCurrencyRoute, shopRoute` import.