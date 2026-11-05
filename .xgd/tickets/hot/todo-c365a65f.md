---
uid: todo-c365a65f
id: TODO-19
type: todo
title: 'Social exports: make real exports from each platform and test them against
  REQ-635'
created_by: REQ-635
created_at: '2026-11-03T00:18:00.504933+00:00'
updated_at: '2026-11-03T00:18:00.504933+00:00'
completed_at: null
last_field_updated: created_at
status: open
fields:
  kind: user_task
  related_uid: request-313f0bd3
  auto_merge_back: true
---

## Why

REQ-635 reads the export ZIPs that Instagram, Facebook, LinkedIn and Google Business Profile hand an owner. Its detectors and fixtures were built from each platform's *documented* folder layout, not from real files. The platforms change their layouts without notice, so the only proof the importer recognises what they actually send today is a real export from each.

## What to do

Use a real account you own (a test or low-activity business account is ideal — fewer photos, quicker export). For each platform below: request the export, wait for the email, download the ZIP, and save it **unopened and unrenamed** to

    /Users/martin/lagrangefoundry/1stcontact/storage/tmp/exports/<platform>/

(`storage/tmp/` is gitignored, so nothing private gets committed). Then upload it (see "Test" below).

**Size:** uploads cap ZIPs at 95 MB (one request — REQ-635). If an export comes out bigger, re-request it with a shorter date range or lower media quality, and note in a comment that you had to.

### 1. Instagram (Meta Accounts Center)
1. Instagram app or instagram.com → **Settings → Accounts Center → Your information and permissions → Download your information**.
2. **Download or transfer information → choose the Instagram account → Some of your information**.
3. Tick **Posts** (under *Your Instagram activity → Content*) and **Personal information** (profile). Leave Messages unticked — but also make one second export *with* Messages ticked, to prove they are not imported.
4. **Download to device**. Date range **All time**, Format **JSON**, Media quality **High** → **Create files**.
5. Takes minutes to a day. The email links back to Accounts Center → **Download**.
6. Optional: one extra export in **HTML** format (REQ-635 imports photos and post text from HTML too).

### 2. Facebook Page (Meta Accounts Center)
1. facebook.com → **Settings & privacy → Settings → Accounts Center → Your information and permissions → Download your information**.
2. Choose the **Facebook profile or Page** that is the business. Some of your information → tick **Posts** and **Profile information** (or Page information). Leave Messages unticked.
3. Download to device, **All time, JSON, High** → Create files. Same email → Download flow.

### 3. LinkedIn
1. linkedin.com → **Me → Settings & Privacy → Data privacy → Get a copy of your data**.
2. Choose **"Want something in particular?"** and tick **Profile, Positions, Articles, Shares (posts)** — or "The works" if simpler.
3. **Request archive**; LinkedIn asks for your password on its own page (never ours).
4. The particular-items archive usually arrives in ~10 minutes; "the works" can take up to a day. Email → download.

### 4. Google Business Profile (Google Takeout)
1. Go to **takeout.google.com** signed in as the Google account that manages the business profile.
2. **Deselect all**, then tick only **Google Business Profile**.
3. **Next step → Transfer to: Send download link via email**, Frequency **Export once**, File type **.zip**, File size **1 GB**.
4. **Create export**. Usually minutes to hours. Email → **Download your files**.
5. A business with reviews that have owner replies is the best test (each review must come out attributed, with its reply).

## Test

For each ZIP, on dev (`bin/deploy --env dev` first if REQ-635 isn't on dev yet):
1. Open the business's Library and upload the ZIP into **Site asset**.
2. Watch the upload's progress line ("Unpacking your export: …").
3. Check the Library: photos appear as pictures (at most the 100 most recent); post captions / posts / profile / reviews appear as Background information documents, each saying which export it came from. No avatars, icons, ads data or messages.
4. Ask the consultant "what came in from my Instagram export?" — it should know.
5. Also try dragging the ZIP onto the chat, and attaching it to an Input question.

Record the outcome per platform as a comment on this ticket (worked / not recognised / something missing or wrong, with what you saw). For anything wrong, reopen REQ-635's session and point it at the ZIP in `storage/tmp/exports/<platform>/` — it can read that folder and correct the detector and fixtures from the real layout.
