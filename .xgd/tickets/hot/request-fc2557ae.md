---
uid: request-fc2557ae
id: REQ-666
type: request
title: 'Legal: terms at checkout, member acceptance and change notices on client sites'
created_by: EPIC-29
created_at: '2026-11-07T21:24:41.986769+00:00'
updated_at: '2026-11-08T01:32:31.699516+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
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
  - working_sha: 27ac75c2caec5a013543e23ffbb07e2421e02a3d
    reconcile_sha: null
    main_sha: null
  - working_sha: 2c64130b94e36038f7d74c90a5ff4c751204b2f5
    reconcile_sha: null
    main_sha: null
  - working_sha: 6499527fa5c6d6aee524979096f649427ced75c5
    reconcile_sha: null
    main_sha: null
  version: 0.2.821
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
- **No block when there is no Terms of sale yet.** This differs from my recommendation in chat. REQ-665's module texts (DOC-87..116) are still drafts, so no client has a Terms of sale yet; blocking on it would turn off every client shop until they are published. The checkout line simply leaves out a document the site does not carry.
- **The 1st Contact business is left as [[REQ-665]] leaves it.** Its documents are the platform's build-bundled ones, with no business details form, so it has no seller gate, no checkout line from client documents, and no versions recorded.

**6. A material Privacy change is announced before it takes effect.**
- **What counts as material.**
  - A version is material when a material module is added, removed or given new wording.
  - An owner's edit is material when it is saved with "tell people about this change". The pane has the checkbox; the route accepts `material`.
  - Each version records `material`.
  - Wording-only changes, details changes and non-material modules (e.g. the mailing-list section, which only affects new sign-ups) are not material. They go live at the publish and send nothing.
- **The notice period.**
  - When the site already carries a Privacy notice and the next version is material, the publish puts the new version on the site as *upcoming*. It takes effect `NOTICE_DAYS` = 30 days later, a platform constant pending the lawyer.
  - Until then the current version stays live. Its page says "An updated version of this privacy notice takes effect on <date>", with a link to the new version's page.
  - The pane shows "Version N takes effect on <date>".
- **The sends.** The publish records a `legal_change_notices` row. The 10-minute cron (`runLegalNotices`, `legal-notices.ts`) then:
  - sends "We've updated our privacy notice" (a new [[REQ-660]] trigger, `privacy_notice_changed`, editable in Paperwork → Email) to the business's contacts with an address, in batches of 25. Each send is recorded as the business's message on the contact, with an `email.sent` event and a `legal_notice_sends` row, so a contact is told once;
  - when the date comes, writes new facts with the version in force and rebuilds the live site.
  - It is bounded per tick (5 notices × 25 contacts), so it never fans out unbounded in one request.

**7. What the assistants say.**
- **The consultant.** The pre-publish summary (`status.legal.summary`, which the consultant must tell the owner before publishing) says when a publish is a material Privacy change: the contacts are emailed now and the new version takes effect on <date>. It also says that using existing information for a materially new purpose usually needs consent. That is flagged, not automated. The `status` description in `l1-surface.json` mentions it.
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
- **The Privacy notice is not re-asked.** Its material changes are told by email (item 6).
- **The pre-publish summary** says when a publish will ask signed-in customers to accept again.

**Supersedes:**
- [[REQ-643]]'s exact `/api/shop/selling` shape: its UAT now expects the three new fields.
- [[REQ-668]]'s "every other business has published none until REQ-666 lets it, so its contacts owe nothing" in `guardTerms`: they now owe their own business's documents, as above.
- [[REQ-665]]'s `legalPagesNow`: it now serves what the last publish put on the site (plus versions that have since taken effect), rather than the newest version. That matches REQ-665's "an owner's edit goes on the site at the next publish".

**UATs.**
- `tests/test_UAT_FC_REQ-666_legal_in_use.workers.test.ts`: real router, D1, public-site Worker, Stripe faked at fetch, signed webhook, the cron function, mail asserted on recorded messages.
  - The checkout line and its links; the order recording both uids.
  - The confirmation linking v1, with the cancellation summary, and v1 still readable after v2.
  - No Buy, no checkout and the missing details named until all three details are set; an edited Terms of sale warns, not blocks.
  - A material change (the business starts trading with the UK) announced in the summary with the consent flag, waiting 30 days, emailed once to each contact, then live.
  - A mailing list or an unflagged edit sending nothing; a flagged edit announced.
- `tests/test_UAT_FC_REQ-666_member_acceptance.workers.test.ts`: the real Worker and D1, Bob signing in from Alice's site through the recorded link.
  - First sign-in shows Terms to agree and Privacy as "I have read", from Alice's own text, never 1st Contact's.
  - Nothing is served until he accepts; a stale version is refused.
  - Both acceptances are recorded on his contact, with the wording; no business is built for him; he then reaches his portal.
  - A wording-only change does not ask again. A material change (UK terms) is announced in the summary and asks again, for the Terms only.
  - An owner edit asks again only when saved as material.
- `tests/test_UAT_FC_REQ-666_shop_and_legal_pane.test.ts` (jsdom builder):
  - The Shop tab's missing-details prompt and edited-terms warning.
  - The Legal pane's "tell people about this change" on save, and the "takes effect on" line.