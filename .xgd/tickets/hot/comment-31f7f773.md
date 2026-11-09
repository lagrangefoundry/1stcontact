---
uid: comment-31f7f773
id: COMMENT-8047
type: comment
title: Comment on bug BUG-393
created_by: xgd
created_at: '2026-11-08T23:31:59.402264+00:00'
updated_at: '2026-11-08T23:51:34.611684+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-84201195
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "59998833-3663-469b-86f7-8418773ecd40",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="c82262bb-9fe9-4349-b4f5-0c7bfb76aa34-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T23:30:38.764352+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="c82262bb-9fe9-4349-b4f5-0c7bfb76aa34-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T23:51:32.299673+00:00" -->
#### Claude
Checked for duplicates (none found) and reading the legal-publication code to see where Terms of sale versions get written.

Now `catalogItemChanged` — where an unpublished business skips the legal commit.

Found the gap: `catalogItemChanged` only commits legal versions when a site rebuild lands, so an unpublished business never gets any. Checking shipping triggers and the rebuild path next.

Worktree is set up; finding the existing REQ-666/REQ-669 UATs to model the new test on.

Writing the change now: a business-level legal commit when no site is published, flagged in the facts record so a first publish carries the same versions.

Core legal changes are in; now wiring the no-published-site commit into the rebuild path (catalog.ts and router.ts).

Now typechecking.

Typecheck clean. Writing the UAT suite now, reusing the REQ-666 harness (real router, real D1/R2, Stripe faked at fetch).

Now the workers UAT file.

All 3 pass. Checking they actually fail without the fix:

Good — the suite has teeth. Adding a small jsdom UAT for the Shop reminder text, then running the neighbouring legal/checkout suites.

The regression batch is running (18 suites). Meanwhile I'll update the ticket body with what was built.

One regression in REQ-666's confirmation test; looking at why.

Rerunning the failing REQ-666 suite plus mine (foreground):

All green. Re-running the other 14 suites against the final code:

All 19 suites pass. Checking this project's version-bump convention before committing.

Committing the fix, then lock → merge xgd-working in → bump → fast-forward back.

Fast-forwarded onto xgd-working. Running the ticket overlay check, then marking free_coded.

BUG-393 is fixed and merged into xgd-working. The ticket is at `free_coded` with commits `41dac549…` and `40a75dae…` and version 0.2.837. It isn't a duplicate (the only related ticket, BUG-374, is about the preview's payment page hanging).

**What changes for the operator:** once payments, shipping and all the seller details are in place, the business gets its Terms of sale version, even with no published site. Buy then works in the preview, a real payment can go through it, and the order records the Terms of sale version the buyer was shown. Publishing the site later carries that same version and doesn't write a new one. If a seller detail is missing, Buy still stays off and the Shop still shows the reminder with its "Fill in business details" button. Publishing is never a condition.

**How it works:**
- **Versions without a published site:** the record of which legal versions are in force now has a `published` flag. When a business has no published site, the rebuild path writes its versions anyway, naming the site it will publish, and marks the record unpublished.
- **Missing details hold the write back:** nothing is written while a seller detail is missing, so no Terms of sale goes out with "not set yet" placeholders. Regression testing caught this: without the hold, REQ-666's suite got a placeholder v1 and then the real one as v2.
- **Shipping changes now count:** a shipping save now triggers a legal update, as a payments change or a Paperwork → Legal save already did. So whichever of the three is set up last writes the first version.
- **New Shop text:** "There is no Buy yet: a buyer has to be able to read your Terms of sale, and they are written once payments, shipping and your business details are set up — see Paperwork → Legal." It no longer mentions publishing.

**One thing you need to do:** your production business was already fully set up before this landed, so nothing has happened since to write its version. After deploying, save anything in Paperwork → Legal (or change payments or shipping) and its Terms of sale v1 will be written.

**Tests:**
- **New:** two new test files with four tests, named `test_UAT_FC_BUG-393_*`. They cover:
  - an unpublished business being able to sell;
  - a checkout from the preview recording the version;
  - the first publish writing no new version;
  - a missing detail still keeping Buy off;
  - the reminder text and its button.

  The three server-side tests fail without the fix and pass with it.
- **Regression:** 19 existing suites (legal, checkout, shop, payments) all pass, 106 tests in total.

<!-- xgd-chat-end -->