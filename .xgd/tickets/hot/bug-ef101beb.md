---
uid: bug-ef101beb
id: BUG-279
type: bug
title: 'First draft: the client was told ''your first draft is ready'' before the
  review ran — gate the announcement before it is said, and keep the critic''s cold
  read'
created_by: EPIC-19
created_at: '2026-10-25T18:31:09.793997+00:00'
updated_at: '2026-10-25T21:00:01.917621+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-95bc3b15
  story_points: 2
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-1810015d
  commits:
  - working_sha: ae346ec48a39f36745ec333c2782b6e02472b41f
    reconcile_sha: null
    main_sha: null
  - working_sha: 0609c8d6a7388313d078a599ccc9517c982b986e
    reconcile_sha: null
    main_sha: null
  version: 0.2.645
---

## Symptom

First-Draft-Test Dina's Diner 2 (site `site_24e7845dd4cf28ed711f024ba24b895f`),
2026-10-25 UTC, on a snapshot that includes REQ-458:
- **17:50:14** `first_pass_at` set, so the first-draft review is due.
- **18:02:46** the consultant tells the client: **"Your first draft is ready:
  [have a look](#show=draft&page=home)…"**
- **18:03:53** only then does the host's review hold fire ("your reply ended with
  the review of the site still owed… call critique"), and C1 runs. A recheck (C2)
  follows at 18:10. The consultant then says "The home page is ready for another
  look…" at 18:12:33.

So REQ-458's rule, **no first-draft hand-over without a review**, did not hold. The
hold only acts when the consultant's reply *ends*, by which time the
announcement has already been streamed to the client.

Separately, the critic's **cold read** (BUG-271) is discarded. `criticFor` in
`host-core.ts` runs the cold-read turn with `await ask(content)` and keeps only the
second turn's report, so the stranger's reading can't be inspected, measured or
shown to the operator.

## What changed

1. **The announcement is held before it is said, not after.**
   - The tool half was already in place from REQ-458: while the first-draft review
     is owed, `show_client` of the draft is refused ("call critique") and the
     REQ-445 hand-over steering is replaced by "review it first". This ticket
     leaves that as it is.
   - **New: the reply text is held too.** While the first draft's review is owed
     (`firstDraftReviewOwed`: first pass built, draft not yet reviewed by the
     client, a review due or a finding unanswered — and only where the site has a
     critic), the consultant's words reach the client one paragraph at a time. A
     paragraph that **hands the draft over** is held back. "Hands it over" means it
     links the whole draft (`](#show=draft)`, REQ-444's lead line) or says the
     draft/site/website is ready or finished.
   - At the end of a round in which the review is **no longer owed** (it has run
     and every finding is answered), the held paragraph is said. If that round
     announced the draft itself, the held one is dropped, so the client never hears
     it twice.
   - The hold sits **below the session manager**, as a backend-stream wrapper
     (`holdDraftAnnouncement` in `cadence-core.ts`, composed around
     `keepClientOriented`). So a held paragraph is not in the stored transcript
     either, and a reload can't show it early. Held paragraphs are kept per site
     by the host (`heldAnnouncements`), so a hold lasts across rounds.
   - Whether the review is owed is read at the start of each round and after each
     `Delegate`, `critique` or `answer_finding` result.

   The goal: the client never sees "your first draft is ready" before a review.
2. **The cold read is kept.** The cold-read turn's answer (the critic's prose:
   who the business is, who is speaking, what a visitor can do, what confused it)
   is stored on the review run as `critique.runs[].cold_read`. Its cost was
   already metered as the review's own requests (REQ-438: both turns are
   `request_spend` rows with the review's id). `read_plan` returns it as part of
   the plan.
3. **The Debug tab shows the reviews.** There is a new operator read,
   `GET /api/reviews?site=`, which returns `{ runs }` (the plan's critique runs,
   never shown to the client). The Debug pane has a new section, "This site's
   reviews", that lists each run newest first: its verdict, its cold read and its
   findings with their answers.

## Design decisions made during iteration

- At first, any `#show=draft…` link counted as an announcement. That held REQ-436's
  talker line "The Prices page is done: [have a look](#show=draft&page=prices)",
  which is progress after a build, not the hand-over, and it broke REQ-436's UAT.
  So the rule was narrowed: only the link to the whole draft (no page named)
  counts, plus the words "draft/site … ready/finished". A link to one page is
  never held.
- Held text is released at the end of the round, not straight after the last
  `answer_finding`. That way the consultant's own fresh announcement in the same
  round can replace it rather than repeat it.
- The hold wraps `keepClientOriented` from outside, so BUG-262/278's speak-first
  gate still counts held words as the round having spoken. Otherwise a cued round
  whose only words were held could never call `critique`.

## Test plan

`tests/test_UAT_FC_BUG-279_the_review_comes_before_the_hand_over.workers.test.ts`:

- A reply that says "Your first draft is ready: [have a look](#show=draft&page=home)"
  while the review is due reaches the client only after the review has run and its
  finding is answered. It comes once, after the review round's own words, and in
  the stored transcript it is not in the reply that wrote it. The rest of that
  reply streams as written.
- A review run stores the cold read's answer as `cold_read` beside its findings,
  and `GET /api/reviews` returns it.
`tests/test_UAT_FC_BUG-279_the_debug_tab_shows_the_cold_read.test.ts` (jsdom, the real builder):

- The Debug tab's "This site's reviews" section, read for the site in scope, lists
  each review newest first: its verdict, its cold read (or "No cold read was kept"
  for a run that has none), and its findings with their answers.

- The show_client refusal before `critique` and acceptance after it are already
  pinned by REQ-458's UAT (`…the_first_draft_is_not_shown_until_its_review_has_run_and_is_shown_after`).
  Both turns being metered is pinned by REQ-438's UAT. Neither is repeated here.
- Re-ran REQ-458, REQ-427, BUG-271, REQ-438, REQ-445, REQ-436, REQ-431, BUG-262,
  BUG-278, REQ-379, REQ-459 and the Debug pane suites (REQ-448, REQ-357). Two of
  those fail on a clean branch too, and still do: REQ-431
  `a_reply_that_links_the_view_inline…` and REQ-458 `with_a_builder_holding_the_pages…`.