---
uid: request-214ab747
id: REQ-640
type: request
title: 'Erasure disclosures: portal, privacy notice and terms match the deletion lifecycle'
created_by: EPIC-9
created_at: '2026-11-03T17:41:49.299081+00:00'
updated_at: '2026-11-04T19:01:33.166758+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-ce0874f2
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-913432cb
  commits:
  - working_sha: 4183cb064d37e0ab9deaf7443460d7116416408d
    reconcile_sha: null
    main_sha: null
  version: 0.2.748
  story_points: 1
---

## Purpose

Make the portal's "Closing your account" page match what 1st Contact actually keeps when someone's information is deleted, as set out in [[DOC-37]] (amended 2026-11-03) and now published in the Privacy Notice and Terms.

**Every statement must be true on the day it is published.** Describe the outcome (what is kept, for how long, why), never the mechanism, so it stays true whether the lifecycle job ([[DOC-37]] §7.1) is built yet or an operator applies the rules by hand. Nothing may describe a feature that does not exist yet ([[REQ-183]] §4.2).

## Outstanding scope: the portal page only

**File:** `apps/control-app/src/portal.ts`, `erasureSlot()`, the "Closing your account" panel of the customer portal (level 2: a client's customers).

**The copy must agree with the published Privacy Notice ([[DOC-85]], 2026-11-03) §6 and §9.** Where this ticket and DOC-85 differ, DOC-85 wins, because it is what people have accepted.

Changes:

1. **The payments survivor.** Today it says "Your invoices and payments, with you reduced to the least the law allows", and its reason says the law requires it. Change both:
   - **What:** your invoices and payments are kept for **7 years from each payment**, with you reduced to your **name and billing address**.
   - **Why:** keep the "why it is for you" framing. Give both reasons: the law's record-keeping rules, and that a dispute about a payment can come up long afterwards. Today's text says it is only the law, which is no longer the whole reason.
2. **Add timing.** Information is hidden as soon as deletion is asked for, and deleted 30 days later. If you have already paid for something that is still running, it runs to the end of its term, and the 30 days start then.
3. **Add one line on delays.** While a dispute, chargeback or unpaid balance is open, deleting the information about it can be paused until it is resolved.
4. **Keep the closing paragraph true.** "The three above are the whole of the difference" must stay accurate after changes 2 and 3. Timing and delays are not survivors, so the three survivors stay three, but adjust the wording if the new lines make that sentence misleading.

**Unchanged:**
- **"This page does not close your account on its own. Ask us and we will do it"** stays until a self-serve control exists.
- **The email-fingerprint survivor** stays as it is, with no retention period added. [[DOC-37]] §7.1 says it is never deleted.
- **The [[REQ-180]] §3 vocabulary guard** still applies to the new copy.

## Done (no work left here)

- **Privacy Notice changes (formerly §2):** published as [[DOC-85]], Privacy Notice 2026-11-03, by [[EPIC-29]].
- **Terms of Service changes (formerly §3, including the cancellation and cooling-off clause):** published as [[DOC-84]], Terms of Service 2026-11-03, by [[EPIC-29]]. It supersedes the unpublished [[DOC-80]].
- **Timing:** the operator chose to publish both on 2026-11-03 rather than wait for the first live payment ([[GOAL-55]]). Terms about payments don't apply until payments are taken. **The portal change has no timing gate**; land it whenever.

## Out of scope

- The legal documents. Any further change is a new dated version owned by [[EPIC-29]].
- Building the lifecycle job, the deferral records, the reduced identity record or the email fingerprint ([[DOC-37]] §6.3, §7.1), each a later child of [[EPIC-9]].
- A self-serve close-account or delete control in the portal.

## Test plan

UATs named `test_UAT_FC_REQ-640_*` render the portal's erasure slot and assert that it says:
- 7 years, and name and billing address, for payment records;
- disputes as a reason payment records are kept;
- hidden at once, deleted after 30 days, and the end-of-term case;
- the line pausing deletion while a dispute, chargeback or unpaid balance is open;
- "Ask us and we will do it", which must still be there.

The existing REQ-180 vocabulary guard and the existing portal suites must still pass.

## What changed (commit 4183cb06)

In `erasureSlot()` of `apps/control-app/src/portal.ts`:

- **Payments survivor.** It now reads: "Your invoices and payments, kept for 7 years from each payment, with you reduced to your name and billing address." The reason now reads: "The law requires some of these records, and a dispute about a payment can come up long afterwards. If one does, this record is what settles it, whichever side raised it." Both reasons from DOC-85 §6 and §9 are given, in the "why it is for you" framing.
- **New "When it happens" heading after the closing promise**, with two paragraphs:
  - "Your information is hidden as soon as you ask, and deleted 30 days later, in case you change your mind. If you have already paid for something that is still running, it runs to the end of its term, and the 30 days start then." The "in case you change your mind" reason is taken from DOC-85 §6.
  - "While a dispute, chargeback or unpaid balance is open, deleting the information about it can be paused until it is resolved."
- **The closing sentence is unchanged** ("…the three above are the whole of the difference"). It stays true because the timing lines sit after it, under their own heading, so they don't read as a fourth thing kept. The UAT checks that order.
- "Ask us and we will do it", the fingerprint and consent-dates survivors, and "What is destroyed" are unchanged.

## UATs

`tests/test_UAT_FC_REQ-640_erasure_disclosures.test.ts` renders the portal through assemble → `renderSiteFiles` and reads only the `[data-account-erasure]` panel's visible text:
- `…payment_records_are_kept_7_years_as_name_and_billing_address`: also checks the old "least the law allows" wording is gone.
- `…disputes_are_a_reason_payment_records_are_kept`: checks both the law and disputes are given as reasons.
- `…hidden_at_once_deleted_after_30_days_and_end_of_term`
- `…deletion_pauses_while_a_dispute_chargeback_or_unpaid_balance_is_open`
- `…the_page_still_says_ask_us_and_three_survivors_are_the_whole_difference`: checks "Ask us" and the unchanged fingerprint survivor are still there, and that the timing text comes after the three-survivors sentence.

The REQ-183 portal suite passes. Three REQ-180 tests were already failing in files this change doesn't touch (`builder/tenant-cost.js`, `business.ts`/`hostname.ts` `platformBusiness`, the `/api/plan` route). `portal.ts` adds no new vocabulary-guard hits.