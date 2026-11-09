---
uid: bug-c54cf144
id: BUG-392
type: bug
title: 'Shop: seller-details notice opens Legal not Business details, doesn''t clear
  on save; Country is free text'
created_by: EPIC-31
created_at: '2026-11-08T22:31:09.062850+00:00'
updated_at: '2026-11-09T00:54:10.017537+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  parent_uid: epic-8146aecd
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-ab62bed3
  commits:
  - working_sha: c1610314bcb162c59b1e87eb5c581830e65ae9c8
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 6e349f0fe6c0e6270193b4c18ff9822b29b584b3
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  version: 0.2.838
  story_points: 3
---

## Symptom

Shop tab, once payments are connected, while the Terms of sale still need business details. The owner sees this notice:

> Fill in your business details to start selling: your Terms of sale need your legal name, postal address, contact email. Your site has no Terms of sale yet, so there is no Buy: a buyer has to be able to read what they agree to. They are added when you publish, once selling is set up — see Paperwork → Legal.

1. **The "Fill in business details" button opens the wrong place.** It switches to Paperwork → Legal, which is the document list (`app.js` `onOpenLegal`: `paperwork.setMode('legal')`). The owner then has to find the "Business details" row themselves.
2. **The notice stays up after the owner saves the details.** Two causes:
   - The Shop's `checkPayments()` (`shop.js`) re-reads selling state only when the Shop asks. A save in Paperwork doesn't tell it.
   - The second sentence ("Your site has no Terms of sale yet…") is shown whenever `termsOfSale === 'none'`. That stays true until the next publish, even when nothing is missing.
3. **Country on the Business details form is a free-text box** (`paperwork.js` `openDetails`: every field except two is an `<input>`). The server accepts only an ISO country code (`client-legal.ts`: "… is not a country code (such as GB, IE or US)"). So the owner has to guess the format, and a country name is refused.

This is a fix to work that has already landed (REQ-665, REQ-666).

## Fix

1. **The button opens the Business details form.** "Fill in business details" switches to the Paperwork tab and opens the Business details form directly, the same form as clicking its row in Paperwork → Legal. The "Open Terms of sale" button on the edited-terms warning still opens Paperwork → Legal.
2. **The notice clears when the details are saved.**
   - Once a save leaves no detail the Terms of sale need, the notice is gone the next time the Shop is shown, with no reload and no publish. The Shop re-reads selling state when the tab is shown again, or when Paperwork reports a save.
   - ~~The "no Terms of sale yet" sentence is shown only while details are still missing.~~ **Dropped (superseded by [[BUG-393]]).** BUG-393 was filed after this ticket and has already landed. Its operator decision keeps the "There is no Buy yet…" sentence whenever `termsOfSale === 'none'`, and its UAT pins that. It also removes the cause: the Terms of sale version is now written as soon as the details are complete, with or without a publish. So `termsOfSale` stops being `none` after the save, and the re-read above clears the whole notice.
   - If a save leaves some details still missing, the notice remains and lists only those.
3. **Country is a drop-down of countries.** Each option shows the country's name (e.g. "United Kingdom") and saves its ISO code (`GB`), with an empty "Choose a country…" option first. The list comes from the same country data the server validates against (`countries.ts`, `isCountry`), the way Settings → Shipping's "Add a country…" list does. So every choice is one the server accepts. A saved code shows as selected when the form reopens.

## Test plan

UATs `tests/test_UAT_FC_BUG-392_*.test.ts` drive the builder through its real entry points:
- With payments ready and details missing, clicking "Fill in business details" shows the Paperwork tab with the Business details form open.
- With the same setup, saving complete details and returning to Shop hides the seller notice, with no reload and no publish in between.
- A partial save leaves the notice up, naming only the remaining fields.
- Country renders as a `<select>`. Choosing "Ireland" saves `IE`, and reopening the form shows Ireland selected. Every option value passes `isCountry`.

- The legal overview (`GET /api/paperwork/legal`, real router and D1) carries `countryChoices`. Every choice passes `isCountry`, and saving `IE` is accepted.

Regression: `tests/test_UAT_FC_REQ-666_shop_and_legal_pane.test.ts`, `test_UAT_FC_BUG-393_shop_reminder`, the REQ-665/669, BUG-386/388 and REQ-661 Paperwork suites, and the REQ-665/666/BUG-393 workers suites.

## What was built

- **`createPaperworkPanel(...).openDetails()`** (`builder/paperwork.js`) switches to Legal mode and selects the "Business details" row. It reads the overview first if it hasn't been loaded yet. The Shop's new `onOpenDetails` option (default `onOpenLegal`) is wired in `app.js` to activate the Paperwork tab and call it. "Open Terms of sale" still uses `onOpenLegal`.
- **The Shop re-reads selling state** (`shop.checkPayments()`) on two triggers in `app.js`: the shell's `onTabChange` to the Shop tab, and Paperwork's new `onLegalSaved` callback. That callback fires after every Paperwork → Legal save (`legalSaved`).
- **Country is a `<select>`.** `clientLegalOverview` (`client-legal.ts`) carries `countryChoices: SHIPPABLE_COUNTRIES`, the set `isCountry` accepts. The form lists them by `Intl.DisplayNames` name, sorted, with "Choose a country…" (empty value) first, and saves the code. If a saved code isn't in the list, it is still shown as an option, so reopening the form never drops it silently.

UATs: `tests/test_UAT_FC_BUG-392_seller_details_from_shop.test.ts` (jsdom, whole builder) and `tests/test_UAT_FC_BUG-392_country_choices.workers.test.ts`.