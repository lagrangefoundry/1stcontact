---
uid: request-fc2557ae
id: REQ-666
type: request
title: 'Legal: terms at checkout, member acceptance and change notices on client sites'
created_by: EPIC-29
created_at: '2026-11-07T21:24:41.986769+00:00'
updated_at: '2026-11-08T20:32:27.805121+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-e3db69b8
  story_points: 13
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-b189659d
  commits:
  - working_sha: 5055a8c44d228e0fcc9b30ee9050feeea22d9bf1
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 27ac75c2caec5a013543e23ffbb07e2421e02a3d
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 2c64130b94e36038f7d74c90a5ff4c751204b2f5
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 6499527fa5c6d6aee524979096f649427ced75c5
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: fcf7b8a17e01d30f84381dafffac1bd8bdb6e050
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 45c13735d68da8726d5e17261e711f1cfa133bc0
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: fe23464deb24bc65d55e1bd6d847eb542be86ffd
    reconcile_sha: null
    main_sha: null
  - working_sha: 7c443149b97a14f8cbb20a0d204de78d5d0bf006
    reconcile_sha: null
    main_sha: null
  version: 0.2.826
---

## Why

Depends on REQ-665, and on [[REQ-668]] (every business's customers sign in to that business) for items 4–5: REQ-668 must land before member acceptance and re-acceptance are built here.

EPIC-29, shaped with the operator 2026-11-07. REQ-665 builds a client business's legal documents; this one puts them to use where the law needs them: at checkout, in the confirmation email, at member sign-in, and when a document changes in a way existing people must be told about. EPIC-9's transcript (2026-11-07) found that a client's checkout shows no terms of sale and no privacy notice today.

## What changes

1. **Checkout line, no tick box** (tick boxes cost sales): one line above the pay control — "By paying you agree to our Terms of sale. See our Privacy notice." Both are links to the exact live versions. The **version uids shown are recorded on the order**.
2. **Confirmation email carries a lasting copy** of the Terms of sale version that governed the order (a link to that exact immutable version, plus the cancellation summary for EU/UK buyers). Delivered through REQ-660's order message.
3. **Selling needs seller details.** The Buy button stays off until the business details the Terms of sale need (legal name, postal address, contact email) are filled in, just as there is none without a shipping zone; the Shop tab says what's missing. With standard documents the Terms of sale always exist once the site sells; for an **edited** Terms of sale we **warn, not block** — the owner has taken it on.
4. **Signed-in customers accept the Terms; the Privacy notice is shown, not agreed to.** On a client site with signed-in customers (the portal today; mailing lists, subscriptions and members-only content as they arrive — operator 2026-11-07), first sign-in shows the existing acceptance page (REQ-488, level 2) with the Terms of use / Member terms to agree to and the Privacy notice as "I have read". Records go to the existing acceptance registry (REQ-240) on the contact.
5. **Re-acceptance only for material Terms changes.** A new Terms version makes signed-in customers accept again only when it is material (a module flagged material, or the owner said so when saving an edit). Wording-only changes just get a new dated version.
6. **Telling people about privacy changes.** A material change to the Privacy notice (module flag for standard documents; an owner toggle "tell people about this change" for edited ones, with the Legal assistant's advice) sends a new Paperwork Email message, **"We've updated our privacy notice"**, to the business's contacts **before the change takes effect**. It is an ordinary message: editable, on REQ-660's trigger list, tracked on each contact. Changes that only affect new sign-ups (e.g. adding a mailing list) send nothing.
7. **The consultant and Legal assistant say all of this** before a publish that triggers re-acceptance or a notice, and explain that using existing data for a materially new purpose usually needs consent — flagged, not automated.

## Notes

- Notice timing: the email goes out at publish, and the new version takes effect a set number of days later (default 30; lawyer to confirm). Until then the previous version stays live.
- Subscription terms and renewal notices (US auto-renewal laws, UK DMCC Act) are lawyer items; this ticket only provides the material-change notice path they will use.
- **Open, not in this ticket:** whether 1st Contact's own acceptance page should stop asking clients to tick the Privacy Notice (operator to decide).

## Test plan

UATs named `test_UAT_FC_REQ-666_*`, real router and D1, mail asserted on the recorded outgoing message, Stripe mocked at its boundary:
- Checkout shows the line with links to the live versions; the order records both version uids.
- The confirmation email links the exact Terms of sale version of that order, which stays readable after a newer version is published.
- No Buy button without legal name, address and contact email; the Shop tab names what's missing; an edited Terms of sale shows a warning, not a block.
- First sign-in on a client site shows the acceptance page with Terms to agree and Privacy as "I have read"; acceptances are recorded on the contact.
- A material Terms change makes signed-in customers accept again; a wording-only change does not.
- A material Privacy change sends "We've updated our privacy notice" to contacts and the new version takes effect only after the notice period; adding a mailing list sends nothing.

## Implementation (free-coded 2026-11-07)

All seven items are built. Items 4–5 were built once [[REQ-668]] had landed: every business's customers sign in to that business. The decisions below were confirmed with the operator ("go ahead") on 2026-11-07.

**1. The checkout line.**
- **Placement.** The checkout page draws one line just above Stripe's payment form: "By paying you agree to our Terms of sale. See our Privacy notice." There is no tick box. It is ordinary L1 text in the design's `small` role (`checkoutLegalLine` in the checkout module), so the module still ships no CSS. The edit channel does not draw it.
- **Links.** Each document name links, in a new tab, to the page the site serves it on (`legal/terms-of-sale`, `legal/privacy`). A document the site does not carry is left out of the line; with neither, there is no line.
- **Versions on the order.** When checkout starts, the order records the Terms of sale and Privacy notice versions on the site: new columns `orders.terms_of_sale_uid` and `orders.privacy_uid` (migration `0058_legal_notices.sql`). They are read from the business's own records (the latest `legal_site_facts`), never from the page.

**2. The lasting copy in the confirmation.**
- **The link.** The order confirmation ([[REQ-660]]'s `order_confirmation` message) gains a `terms_of_sale` link to the exact version the order was placed under, at `legal/terms-of-sale/v<N>`.
- **The cancellation summary.** A buyer shipping to the UK or the EU also gets a `cancellation` paragraph: "You can cancel this order within 14 days of receiving it, without giving a reason. To cancel, reply to this email. The Terms of sale linked above explain how returns and refunds work." This is platform wording, for the lawyer to confirm.
- **Both placeholders are "kept".** A new placeholder flag, `kept`: the copy may not drop it, but it may have no value at a send. A business whose stored copy predates the placeholder gets it drawn at the end, so every business's confirmation carries the link.
- **Versions stay readable.** Every publish now also writes every version ever on the site as its own static page, `legal/<name>/v<N>`. These are not in the footer. So the link stays good after newer versions are published.

**3. Selling needs seller details.**
- **The gate.** Buy stays off, the checkout quote's `canCheckout` is false, and `start` answers 409 `no_seller_details` ("This shop is not selling right now.") until the business details have a legal name, a postal address and a contact email.
  - The owner's draft preview adds which ones are missing.
  - A render's catalog carries `sellerReady`.
  - `buyBlockers` gains `seller`, whose builder note points to Paperwork → Legal.
  - The consultant's checkout readiness lists `seller` and `missingDetails`.
- **The Shop tab.** `GET /api/shop/selling` adds `sellerDetails`, `missingDetails` and `termsOfSale` (`standard` / `edited` / `none`).
  - The Shop tab names the missing details, with a "Fill in business details" button that opens Paperwork → Legal.
  - An edited Terms of sale shows a warning, not a block.
- **No Terms of sale on the site, no Buy** (operator, 2026-11-08: "Please close this gap"). A buyer has to be able to read what they agree to.
  - `sellerReadiness` reads the Terms of sale *on the site* (the last publish's facts).
  - The Shop tab says so (`NO_TERMS_OF_SALE_PROMPT`), the checkout refuses with `no_seller_details`, and the consultant's readiness lists "Terms of sale on your site".
  - A render shows Buy only when the seller details are filled in AND the render itself carries the Terms of sale page. A publish that first puts the Terms of sale on the site therefore shows Buy in that same publish.
  - The Terms of sale arrive at a publish, as every standard document does ([[REQ-665]]). A site that starts selling through a Save (shipping, Stripe) gets Buy at its next publish.
  - Until DOC-87..116 are published, no business has a Terms of sale. The test shop needs its documents added.
- **1st Contact is a business like any other** (operator, 2026-11-08: "I use the technology I built and I get the benefit of checks that I built").
  - Its shop gets the same seller-details and Terms of sale checks, the checkout line and the order versions.
  - Its sites get their legal documents built at publish, with their pages, footer links and archived versions. The [[REQ-665]] exemptions in `siteLegalFor` and `legalPagesFor` are removed.
  - Paperwork → Legal shows it a Business details form (details are writable for it), and the Legal assistant's business-details operations are offered to it.
  - Its *builder* documents (DOC-76/77/78, accepted at the builder's door) are unchanged and still not edited there.
  - Paperwork → Legal does not list its sites' generated documents; it still shows the builder documents. That is deliberate (resolved below): [[REQ-669]] makes them one set of documents, and until then the duplication is accepted.

**6. A significant Privacy change goes live at publish and is emailed then** (per the operator decision below; the first build's 30-day notice period was cut over and removed, 2026-11-08).
- **What counts as significant (material).**
  - A version is material when a material module is added, removed or given new wording.
  - An owner's edit is material when it is saved with "tell people about this change". The pane has the checkbox; the route accepts `material`.
  - Each version records `material`.
  - Wording-only changes and details changes are not material. They go live at the publish and send nothing.
- **Live at once.** Every version goes on the site at its publish, for everyone. There is no upcoming version, no `NOTICE_DAYS`, no "takes effect on" line on the site or in the pane, and no scheduled swap.
  - `planLegalPublish` and `applyDueLegal` lose their notice-period code.
  - Facts records no longer carry `upcoming`.
  - Migration `0059_legal_notices_no_period.sql` drops `legal_change_notices.effective_at` and `applied_at`.
- **The email.** A publish that puts a material Privacy version on a site that already carried one records a `legal_change_notices` row. The 10-minute cron (`runLegalNotices`, `legal-notices.ts`) then sends "We've updated our privacy notice" (the [[REQ-660]] trigger `privacy_notice_changed`, editable in Paperwork → Email; its seed now reads "The new version is now in effect.", and the `effective_date` placeholder is gone).
  - Batches of 25, at most 5 notices a tick. Each send is recorded on the contact (message record, `email.sent` event, `legal_notice_sends` row), so a contact is told once.
  - **Who.** Every contact with an email address, including people unsubscribed from the mailing list (it is a service notice).
  - **Except:**
    - contacts who are not active (`users.status`: there is no separate "deleted" or "hidden" contact state today, so suspended and removed contacts are both not active);
    - contacts whose mail bounced or who reported it as spam (their message records, as lead mail is suppressed); these are recorded as `suppressed` and skipped.
  - Contacts with no address are not contacted.
- **Signed-in customers are asked to read it again** at their next sign-in ("I have read"), but only after a significant change. That is item 5's rule applied to the Privacy notice (`client-terms.ts`).

**7. What the assistants say.**
- **The consultant.** The pre-publish summary (`status.legal.summary`, which the consultant must tell the owner before publishing) says when a publish is a significant Privacy change: it goes live with the publish, the contacts are emailed and signed-in customers are asked to read it. It also says that using existing information for a materially new purpose usually needs consent. That is flagged, not automated. The `status` description in `l1-surface.json` mentions it.
- **The Legal assistant.** Its role prompt gains the same rules, and help deciding whether to tick "tell people about this change".

**4. Signed-in customers accept their business's Terms; the Privacy notice is read.**
- **Which documents.** A contact of a client business, signed in to it ([[REQ-668]]), owes the documents that business's last publish put on its site:
  - the Terms of use and, when the site has signed-in customers, the Member terms, each *agreed to* ("I agree to the Terms of use");
  - the Privacy notice, marked as *read* ("I have read the Privacy notice"), never agreed to.
- **The page.** `guardTerms` serves them on [[REQ-488]]'s acceptance page (`clientTermsHtml` in `client-terms.ts`), refusing every other request until they are accepted, exactly as for 1st Contact's own documents. A page showing a version no longer in force is refused (409).
- **The record.** Each acceptance goes to the [[REQ-240]] registry on the contact:
  - Terms of use under `t_and_c_accepted`, Privacy notice under `privacy_policy_accepted`, Member terms under a new key, `member_terms_accepted`;
  - each names the version record's uid and the wording drawn;
  - `member.signed_up` is recorded on the first acceptance.
- **Unchanged.** A business with no published documents asks for nothing. 1st Contact's own contacts still get the platform documents.
- **Admission.** A client business's contact who has accepted and operates no business is admitted to their portal (`admit`). This is the ordinary state for a customer, not "a relationship that ended", which is the refusal 1st Contact's own contacts keep.

**5. Re-acceptance only for material Terms changes.**
- **When.** An agreed document is owed again only when a version since the one accepted is material: a material module added, removed or revised, or an owner's edit saved with "This change matters to people already signed up".
- **Wording-only changes** get a new dated version and nobody is asked.
- **The Privacy notice is read again after a significant change too** (operator decision below), as well as being emailed (item 6).
- **The pre-publish summary** says when a publish will ask signed-in customers to accept again.

**Supersedes:**
- [[REQ-643]]'s exact `/api/shop/selling` shape: its UAT now expects the three new fields.
- [[REQ-643]] and [[REQ-642]]'s "a Save (shipping, connecting Stripe) makes Buy show": when the site did not sell at its last publish, Buy now waits for the publish that puts the Terms of sale on it. Their UATs publish there. The shop suites set up selling through `tests/support/shop-legal.ts` (`readyToSell`): real details write and a real publish with a one-module library.
- [[REQ-665]]'s "the 1st Contact business is unchanged" and "a client business shows none" for sites: 1st Contact's sites get their documents too, and its Legal pane its business details.
- [[REQ-668]]'s "every other business has published none until REQ-666 lets it, so its contacts owe nothing" in `guardTerms`: they now owe their own business's documents, as above.
- [[REQ-665]]'s `legalPagesNow`: it now serves what the last publish put on the site (plus versions that have since taken effect), rather than the newest version. That matches REQ-665's "an owner's edit goes on the site at the next publish".

**UATs.**
- `tests/test_UAT_FC_REQ-666_legal_in_use.workers.test.ts`: real router, D1, public-site Worker, Stripe faked at fetch, signed webhook, the cron function, mail asserted on recorded messages.
  - The checkout line and its links; the order recording both uids.
  - The confirmation linking v1, with the cancellation summary, and v1 still readable after v2.
  - No Buy, no checkout and the missing details named until all three details are set; an edited Terms of sale warns, not blocks.
  - A selling site with no Terms of sale has no Buy, refuses checkout and the Shop tab says so; Buy is back at the publish that adds it.
  - The 1st Contact business gets the same checks: its site gets a Terms of sale, it has no Buy until its details are filled in, then Buy and the checkout line. Its builder documents are still refused edits.
  - A wording-only Privacy change sends nothing.
  - A material change (the business starts trading with the UK) is announced in the summary with the consent flag, is live at the publish with no "takes effect" line, and is emailed once each to every active contact with an address. That includes one unsubscribed from the mailing list, and excludes a suspended one and one whose mail bounced.
  - An unflagged edit sends nothing; a flagged edit is live at publish and announced.
- `tests/test_UAT_FC_REQ-666_member_acceptance.workers.test.ts`: the real Worker and D1, Bob signing in from Alice's site through the recorded link.
  - First sign-in shows Terms to agree and Privacy as "I have read", from Alice's own text, never 1st Contact's.
  - Nothing is served until he accepts; a stale version is refused.
  - Both acceptances are recorded on his contact, with the wording; no business is built for him; he then reaches his portal.
  - A wording-only change does not ask again. A material change (UK terms and UK privacy rights) is announced in the summary and asks him again: to agree to the Terms and to read the Privacy notice.
  - An owner edit asks again only when saved as material.
- `tests/test_UAT_FC_REQ-666_shop_and_legal_pane.test.ts` (jsdom builder):
  - The Shop tab's missing-details prompt, no-Terms-of-sale prompt and edited-terms warning.
  - 1st Contact's Legal pane offers and saves its business details.
  - The Legal pane's "tell people about this change" on save.
- `tests/test_UAT_FC_REQ-666_final_wording.test.ts`: the Legal assistant's priming and surface overview state the significant-change rule and never that every publish asks again; the portal panel names name, email address and billing address.


## Operator decision 2026-11-08 (from EPIC-29): no notice period for privacy changes

**This replaces the notice-period design in item 6 and the Notes above.** Where they disagree, this section wins.

- **A significant (material) Privacy notice change goes live at publish, for everyone.** No *upcoming* version, no `NOTICE_DAYS`, no "An updated version of this privacy notice takes effect on <date>" line on the site, no "Version N takes effect on <date>" in the pane, and no scheduled job that swaps the version in. Remove them; don't leave them behind a flag.
- **Why:** the feature behind a material change goes live at the same publish, so holding the old notice back for 30 days shows new visitors a notice that doesn't describe what happens to their data, and the code can't actually stop existing data being used meanwhile. The wait added complexity without protecting anyone. (Consent for a materially new use of existing data stays a consultant warning, as in item 7.)
- **The email stays:** "We've updated our privacy notice" goes out **when the new version is published**, in small batches from the existing scheduled job, recorded on each contact, to every contact we hold an email address for (including people unsubscribed from the mailing list: it is a service notice, not marketing; excluding contacts that are deleted, hidden or whose address has bounced). Contacts with no email address are not contacted; the published notice says so (module DOC-107: "We can only tell you directly if we have a way to contact you").
- **Signed-in customers** are also asked to read the new version at their next sign-in ("I have read", not "I agree"), using item 5's machinery, but only for a significant change. Wording-only changes ask nothing and send nothing.
- **Why the email is rare now:** the standard Privacy notice no longer changes with site features. Its modules are written in "if" style ("If you join our mailing list…") and all have trigger `always` and region `any` (DOC-97–107, published 2026-11-08). It changes only when the owner edits it or when we revise the standard text.
- **Not in this ticket:** sending the notice by text message to contacts with only a phone number, once text messages exist.

Test plan change: replace "the new version takes effect only after the notice period" with "the new version is live at publish and the email is sent then; a wording-only change sends nothing and asks nothing".


## Also in this ticket (EPIC-29, 2026-11-08): wording the final design changes in code that has already landed

- **Legal assistant priming** (`tools/generate/src/cli/ai/priming.json`, REQ-662): "Before the client publishes, say that publishing makes everyone accept again." becomes the final rule: a **significant** Terms change makes signed-in customers accept again; a significant Privacy change is emailed to contacts with an email address when published and signed-in customers are asked to read it at next sign-in; wording-only changes ask and send nothing. Check `legal-surface.json`'s overview for the same claim.
- **Portal "Closing your account" panel** (`apps/control-app/src/portal.ts`, REQ-640): payment records are kept with you reduced to your **name, email address and billing address** (was "name and billing address"), matching DOC-118 §6 and DOC-37 §6.3 (operator, 2026-11-08: "if we keep data we keep an email").

Test plan additions: the Legal assistant's priming states the significant-change rule and no longer says publishing makes everyone accept again; the portal panel names name, email address and billing address.

**Done (2026-11-08):**
- **Legal assistant:** its priming and surface overview now state the significant-change rule, and the rule formerly named `publish-means-accept-again` is now `significant-change-rule`.
- **Portal panel:** it reads "name, email address and billing address". REQ-640's UAT was updated to match.


## Resolved 2026-11-08 (operator, EPIC-29): 1st Contact's Legal pane — neither A nor B

The open question above ("Paperwork → Legal does not yet list its sites' generated documents") is answered by the design in [[REQ-669]], not by option A or B:

- **1st Contact has one set of legal documents**, not builder documents plus site documents. Like every business, they are the standard documents plus 1st Contact's own added sections ([[DOC-120]]) plus its own documents (the Beta Terms). Its clients accept them at the builder's door and its sites show them. So there is no second privacy notice to reconcile, and no "use the hand-written document where one exists" special case.
- **1st Contact's Paperwork → Legal shows only 1st Contact's own documents**, exactly as a client's pane shows only theirs. The **standard library** (the module texts) is not shown or edited there. It is kept in doc tickets maintained in EPIC-29 and reaches businesses through the build (operator: "The standard docs are stored in a ticket, maintained by you and updated via a build").
- **This ticket builds neither A nor B.** Leave the pane as it is now; REQ-669 makes the builder documents and the site documents the same documents in one cutover. Until then 1st Contact's sites carry generated standard documents alongside the builder documents. That duplication is accepted (there are no clients) and lasts only until REQ-669 lands.