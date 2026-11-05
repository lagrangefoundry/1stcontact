---
uid: request-7075ae7f
id: REQ-488
type: request
title: 'Legal documents: Markdown terms, privacy & beta terms from doc tickets, versioned
  acceptance'
created_by: xgd
created_at: '2026-10-29T23:34:47.345507+00:00'
updated_at: '2026-10-31T20:47:58.050314+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  epic_uid: epic-e3db69b8
  epic_parent: epic-e3db69b8
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-32ffa35c
  commits:
  - working_sha: 881188bd0aa2a9d80aab51e982200b143d965013
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 1320fdc620e02969b48159a38ba077820ecf630b
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: a54a22c79830e7b1e1ae3b7bb6233c64e9063971
    reconcile_sha: null
    main_sha: null
  - working_sha: f50ea7c62bc8b1f493920bce5fe4c52e1f80abb6
    reconcile_sha: null
    main_sha: null
  version: 0.2.710
  story_points: 8
---

# Legal documents (Terms, Privacy Notice, Beta Terms): Markdown from doc tickets, versioned separate acceptance

Part of EPIC-29. Replaces the placeholder terms of REQ-169 and folds in REQ-479's beta review clause (which now lives in the Beta Terms, DOC-78).

## What the user sees

- **`/terms`, `/privacy` and `/beta-terms`** show the current Terms of Service, Privacy Notice and Beta Terms, rendered from Markdown: headings, paragraphs, ordered and unordered lists (including nested lists), tables, bold, italic, links and horizontal rules. The drafts DOC-76, DOC-77 and DOC-78 use every one of these.
- **Three documents, and the set is data, not code.** The Beta Terms exist only while the beta runs, so a document can be **withdrawn**: once withdrawn it is no longer required for acceptance and no longer linked from the interstitial, but its past versions stay reachable.
- **The document pages are public**: served before sign-in, because a notice somebody can read only after agreeing is not a notice. Each page lists every published version of that document.
- **Every past version stays reachable** at `/terms/<version>`, `/privacy/<version>` and `/beta-terms/<version>`, where `<version>` is the date the version came into force (`YYYY-MM-DD`). An unknown version is a 404. Each page states its version and links to the current one.
- **Before the builder loads**, a person who has not accepted the current version of **any** required document sees the acceptance page (EPIC-29 §2):
  - each outstanding document is a **link with a checkbox next to it** (a new person sees all three; after a re-publication only the changed document is listed);
  - clicking the link opens the document in a **viewer**, which has its own checkbox; ticking either one ticks both;
  - Continue is enabled once every listed document is ticked. It posts the doc uids the page showed; if any is no longer the version in force the post is refused (409) and nothing is recorded, so a page left open across a publication cannot record agreement to text nobody saw;
  - Terms and Beta Terms say "I agree to …"; the Privacy Notice says "I have read …". Our legal basis is not consent, so the wording must not present it as consent;
  - a withdrawn document (the Beta Terms after the beta) is not listed.
- **The page and viewer are one component, built to be reused at level 2** (a client site's own Terms and Privacy Notice, EPIC-29 §1). This REQ ships only the level 1 use.
- **Publishing a new version of any required document re-prompts** everyone on their next request, exactly as bumping `TERMS_VERSION` does today. The builder stays blocked (every asset and API route, as REQ-169) until they accept.

## Source of truth: doc tickets

- **Each published version of each document is its own doc ticket.** That is how every version is kept. Fields:
  - `legal_document`: `terms` | `privacy` | `beta`
  - `legal_version`: `YYYY-MM-DD`
  - `legal_status`: `draft` | `published` | `withdrawn` (a `withdrawn` ticket carries no text and marks the document retired from its `legal_version` date)
- **A published version is never edited.** A change is a new ticket with a new version.
- **`doc_kind` (decided 2026-10-30):** the build selects legal tickets by the presence of `fields.legal_document`, never by `doc_kind`. The tickets carry `doc_kind: architecture` until the operator's new `legal` kind exists in xgd, then move to it; no code here changes when they do.
- **The build** (the step that already produces generated modules for the worker) reads every `published` legal doc ticket from the ticket store and emits a generated module containing each version's Markdown. The current version of a document is the latest `legal_version` among its published tickets.
  - `draft` tickets never reach the build output.
  - The build **fails** if two published tickets claim the same document and version, or if a document has no published version.
- `TERMS_TEXT`, `BETA_REVIEW_CLAUSE` and the hand-edited `TERMS_VERSION` constant in `apps/control-app/src/terms.ts` are **deleted**, not kept alongside. The beta review clause moves into the Terms doc ticket text.

## Rendering is safe by construction

The Markdown renderer is the only emitter for these pages (Security Policy):
- Raw HTML in the source is escaped, not passed through.
- Link targets are limited to `http:`, `https:`, `mailto:` and paths on this site (`/privacy`, `#…`), which the drafts use to link each other. Anything else (`javascript:`, `data:`, `//host` and so on) is rendered as the link text alone.
- The renderer is a small dependency-free Markdown subset (headings, paragraphs, nested lists, tables, rules, bold, italic, links). The framework's Astro renderer is build-time only and refuses rather than neutralises unsafe input; the builder's loads `marked`/DOMPurify from a CDN, which a CSP-locked self-contained page cannot.
- The page's existing CSP holds: no new inline script beyond the hashed constant (REQ-485).

## Acceptance records: reuse the REQ-240 registry (corrected 2026-10-29)

`apps/control-app/src/acceptances.ts` (REQ-240, EPIC-10) already provides what this needs:
- type-1 **document** acceptances, including `t_and_c_accepted` and `privacy_policy_accepted`;
- each record names the **ticket uid** of the exact text accepted;
- `documentOutstanding` treats a newer ticket under the same key as outstanding;
- every transition appends a `contact_events` row;
- `SEED_DOCUMENTS` seeds a default T&C and privacy document;
- the write path is a function, callable without a builder session.

**This REQ builds on it and adds no parallel table.**
- **Add one key**, `beta_terms_accepted` (type 1), to the single key module.
- **The platform documents are the platform business's acceptance documents.** The build turns each published xgd legal doc ticket into the acceptance document under the matching key: `terms` → `t_and_c_accepted`, `privacy` → `privacy_policy_accepted`, `beta` → `beta_terms_accepted`. The `legal_version` is carried on that document, so `/terms/<version>` can find it. The platform's in-force document per key comes from the generated module, not from a tenant store. `SEED_DOCUMENTS` (the business-neutral seed written into customers' stores) is **not** generated from the platform documents: that would put Lagrange Foundry's terms in a customer's store (decided 2026-10-30).
- **Open tension, decide at implementation.** REQ-240 §3 wants document copy to change without a deploy, while the operator wants doc tickets in the xgd store pulled by the build (this REQ). The operator's choice holds for the *platform's* own documents. Customers' own documents (EPIC-29 workstream 3) stay in their tenant store, as REQ-240 intends.
- **`guardTerms` asks REQ-240's question:** is any required document outstanding? Accepting the interstitial calls `recordAcceptance` once per outstanding document, with the wording shown.
- **`users.tos_version` / `users.tos_accepted_at` are retired.** Existing values migrate into `t_and_c_accepted` acceptance state, against a published Terms ticket standing for the placeholder version (`legal_version: 2026-10-28`, the old placeholder text plus the beta review clause). The columns are dropped and nothing reads them afterwards.
- **Membership follows.** `tos_accepted_at` was also the *member* marker (People views, `admit`'s sign-up check, the dev seed). A contact is now a member when they hold a granted `t_and_c_accepted` acceptance, and "member since" is that row's `created_at` (first acceptance; an upsert to a newer version keeps it).
- `member.signed_up` (REQ-195) is appended on the first acceptance only and carries the accepted document uids (`{documents: {key: uid}}`). Accepting a newer version later is recorded by its own `acceptance.granted` event naming that document.
- **The gate costs no extra query:** the admission's user row carries the held document uids (one JSON column) and `member_since`, both computed from `user_acceptances`.
- Migration `0038_legal_acceptances.sql` carries every `tos_accepted_at` into a granted `t_and_c_accepted` row naming DOC-79 (`doc-d5784580`, the 2026-10-28 placeholder: the old lorem text plus the beta review clause), then drops both columns. Those people are re-prompted for the 2026-10-30 versions.
- **Contacts shows the version** (added 2026-10-30, for TODO-17). Each row in a contact's Agreements section (`builder/people.js`, `describeAcceptance`) shows, beside the document name, Agreed/Withdrawn and the date, the version date (`legal_version`) of the document accepted, linked to that version's page (`/terms/<version>`, `/privacy/<version>`, `/beta-terms/<version>`). A document with no `legal_version` (a customer's own tenant document) shows no version.
- **Withdrawal:** a withdrawn document (the Beta Terms after the beta) stops being required, which REQ-240 does not yet support. Add it as a property of the document, not by deleting acceptance rows.

## Test plan (UATs, `test_UAT_FC_REQ-488_*`)

`tests/test_UAT_FC_REQ-488_legal_documents.workers.test.ts` (Worker `fetch` against a real D1):
1. `each_document_serves_its_current_version_rendered`: `/terms`, `/privacy`, `/beta-terms` without a session; heading, link, nested list (Terms) and table (Privacy) appear as elements; each states its version.
2. `raw_html_and_unsafe_links_in_a_document_are_inert`: `<script>`, `<img onerror>`, `javascript:` and `data:` links are escaped/dropped; https and site-path links survive.
4. `an_older_version_is_served_at_its_date_and_an_unknown_one_is_a_404`: the older page says so and links the current one.
5. `publishing_any_one_document_re_prompts_and_blocks_the_builder`: one document at a time; only that document is listed; builder assets and API routes are 403.
5a. `a_withdrawn_document_is_no_longer_required_and_its_versions_stay_served`.
5b. `the_page_offers_a_link_and_a_checkbox_per_document_with_honest_wording`: "I agree to" for Terms and Beta Terms, "I have read" for the Privacy Notice.
6. `accepting_records_each_document_through_the_acceptance_registry`: one `user_acceptances` row and one `acceptance.granted` event (key, wording, document uid) per document, one `member.signed_up`, no other acceptance table. Plus `a_page_showing_superseded_documents_cannot_accept` (409, nothing written).
6a. `the_contact_record_names_the_version_each_document_was_accepted_at`: after accepting, `personDetail`'s acceptances carry each document's `legal_version` and `/<document>/<version>` link; a document that is not a published platform version carries none.
7. `the_migration_carries_tos_stamps_into_acceptances_and_drops_the_columns`: runs the real 0038 file.

`tests/test_UAT_FC_REQ-488_legal_build.test.ts` (node):
3. `a_draft_never_reaches_the_build_output`.
8. `the_build_fails_on_a_duplicate_version_or_a_document_with_nothing_published`, and `versions_are_ordered_and_a_withdrawal_retires_a_document`.
5b. `ticking_in_the_viewer_ticks_the_list_and_continue_waits_for_all`: the served page in jsdom with its own script running.

`tests/test_UAT_FC_REQ-240_agreements_pane.test.ts` (jsdom, the People pane):
6a. `each_platform_document_shows_its_version_linked_to_its_page`: the Agreements row shows "version YYYY-MM-DD" as a link to that version's page; a record without a version (newsletter, a tenant's own document) shows none.

Existing suites moved onto the new mechanism (same claims): REQ-169, 188, 192, 195, 203, 240, 245, 479, BUG-54, and the sign-in suites that accept terms in their fixtures.

## Build input

`1c assets` reads the legal tickets through `xgd ticket list` (the KB export's reader), so `xgd` must be on PATH for a build or deploy. The module writer takes the ticket list as a parameter so UATs do not depend on the CLI.

## Publication (2026-10-30)

Operator decision: DOC-76, DOC-77 and DOC-78 are published as version `2026-10-30`.

## Why free-coded

The mechanism exists (REQ-169). This generalises it to two documents and moves the text out of code, so it's a contained change.