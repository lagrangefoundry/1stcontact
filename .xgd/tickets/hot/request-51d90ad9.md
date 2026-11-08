---
uid: request-51d90ad9
id: REQ-665
type: request
title: 'Legal mode: client legal documents built from site features'
created_by: EPIC-29
created_at: '2026-11-07T21:24:39.869396+00:00'
updated_at: '2026-11-07T22:47:02.636559+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-e3db69b8
  story_points: 20
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-66cb2730
  commits:
  - working_sha: 4451eff25a08de984ad4959a327287672b9a6492
    reconcile_sha: null
    main_sha: null
  - working_sha: fe54781afc0f7f0185a8f1d6c6dc25705f36d68a
    reconcile_sha: null
    main_sha: null
  version: 0.2.818
---

## Why

EPIC-29 workstream 3, shaped with the operator 2026-11-07 (EPIC-29 transcript). Client businesses now sell (EPIC-31), and every client site needs legal documents: terms of use, a privacy notice and, once it sells, terms of sale. Clients come to us so they don't have to deal with this, so the platform supplies **a reasonable starting point**, built from the features the site actually uses. A lawyer reviews the module library before paid launch (EPIC-29 out of scope); this ticket builds the mechanism and ships with the first module texts drafted in EPIC-29.

The Paperwork tab's Legal mode exists (REQ-661) but is read-only and lists documents only for the 1st Contact business; a client business shows none. This ticket gives client businesses their own documents in that mode.

## What the user sees

1. **A client business's Legal mode lists its documents** — Terms of use, Privacy notice, and Terms of sale when the site sells; Member terms when the site has signed-in customers. Each shows whether it is **Standard** (we keep it up to date) or **Edited by you**, its live version, its history, and which site features added which sections.
2. **Business details form** in Legal mode: legal name, trading name (optional), postal address, contact email, country, returns window (days), delivery-time note. The documents are filled in from these. Changing a detail **does not** take a document out of standard.
3. **Edit** a document as Markdown, with preview. Saving an edit makes that document **Edited by you**, per document (editing the Terms of sale leaves the Privacy notice standard). From then on we no longer change its text (operator: "if they edit they are on their own").
4. **Edited documents still get a warning.** When a later site publish would have added or removed a module, the document shows it, e.g. "Your site now collects mailing-list sign-ups. Our standard privacy notice would add this section", with the section text shown. **"Go back to the standard version"** makes it standard again.
5. **The documents are pages on the published site** (`/legal/terms`, `/legal/privacy`, `/legal/terms-of-sale`, `/legal/member-terms`), static like every other page, with **footer links added automatically**. They appear in the builder's Page menu as legal pages and are edited only in Paperwork → Legal.
6. **Standard documents are rebuilt when the site is published**, not on every edit, so the text arrives with the feature it describes. If the rebuilt text differs from the live version it becomes a new version. **Before the publish, the consultant tells the owner** which legal sections are being added or removed and why (operator 2026-11-07).
7. **The Legal assistant** (REQ-662, view only) gains: change business details (the same write the form uses), explain a section using the module's plain-English note, say what a feature change will do to the documents, and report a clause our modules don't cover as a request for the module library (existing development-ticket tool). It still **cannot change document text** and is not a lawyer, and says so.

## The model

- **Modules are standard text filled in by code, never written by AI.** The lawyer reviews the library once, not every site. Each module is a doc ticket in the platform store (like DOC-84), bundled by the build like the platform's legal documents. A module declares:
  - **document** it belongs to (terms / privacy / terms_of_sale / member_terms) and its **position**;
  - **trigger** from a closed set the code evaluates (below);
  - **region** (us / uk / eu / any);
  - **placeholders** from a closed list of business details and site facts;
  - **material: yes/no** — whether adding or changing it affects people already on file (used by REQ-666 for re-acceptance and change notices);
  - a **plain-English note** for the assistant.
- **Triggers are detected from the site, never ticked on a legal list** (a separate list would drift): has a contact form; collects mailing-list sign-ups (newsletter acceptance); sells (`canSell`); has signed-in customers; embeds third-party media; always.
- **Regions: US, UK and EU in the first release** (operator 2026-11-07). The region facts are the business's **country plus where it sells**; the shop's shipping zones say where it sells, so a US shop shipping to Ireland gets the EU cancellation module.
- **Three things change a standard document**, and each is picked up at the next site publish: the site's features, the business details, and the **module library itself** (a lawyer revision, a new provider). The processors list in every client privacy notice comes from the **same source as DOC-85's provider table**, so adding a provider updates every client's notice.
- **Storage:** a business's documents are versioned records in its own store, newest wins, on REQ-660's message-record pattern; each version records whether it was standard or edited and which module versions produced it. A published version is immutable, so an order or acceptance can name it.
- **The 1st Contact business is unchanged:** its documents stay build-bundled doc tickets, read-only in the pane.

## Security

Structured-only. Owner Markdown reaches the browser only through `renderLegalMarkdown`; placeholders are filled from typed business details, escaped. Document size is capped.

## Out of scope (REQ-666)

Checkout line and order version, confirmation email copy, member acceptance on the client site, change notices to existing people, Buy-button gate on seller details.

## Test plan

UATs named `test_UAT_FC_REQ-665_*`, through the real router and D1, the real builder (jsdom) for the pane, and the real site build for pages:
- A site with a contact form and no shop gets Terms and Privacy; turning on selling adds Terms of sale at the next publish; a mailing-list form adds the newsletter section to the Privacy notice; removing it removes the section.
- A US business shipping to Ireland gets the EU cancellation module; a UK business gets UK wording; a US-only business gets no 14-day cancellation module.
- Business details fill the placeholders; changing one rebuilds the document and it stays Standard.
- Editing a document marks it Edited; a later feature change leaves its text untouched and shows the warning with the section text; "Go back to the standard version" restores it.
- Editing one document leaves the others Standard.
- Published site has the legal pages and footer links; pages are static.
- The privacy notice's processors list matches the platform provider list.
- Owner Markdown with HTML/script is rendered inert.
- The Legal assistant can set a business detail, cannot write document text, and its tools name nothing outside its grant.
- The pre-publish summary lists the sections being added or removed.


## Implementation (free-coded 2026-11-07)

**What landed, as it now behaves.**

- **The module library** is 30 doc tickets, DOC-87 to DOC-116. Each carries the fields `legal_module`, `legal_module_document`, `legal_module_position`, `legal_module_trigger`, `legal_module_region`, `legal_module_material`, `legal_module_note`, `legal_module_version` and `legal_module_status`. `1c assets` validates them and bundles the published ones into `generated/legal-modules.js` (`legalModuleLibrary`, `writeLegalModulesModule`). A module is refused, with its ticket named, if it uses an unknown document, trigger, region or placeholder, has no text, or duplicates another's key and version. Drafts never reach the build. **The modules were created at `draft`, following the DOC-76..85 precedent.** The operator publishes them (`legal_module_status: published`) after reviewing them. Until then a client business has no sections, so it gets no client documents or pages.
- **Placeholders** come from a closed list: `business_identity` (the legal name, plus "trading as" when the trading name differs), `business_name`, `legal_name`, `trading_name`, `postal_address`, `contact_email`, `country`, `returns_days`, `delivery_note`, `site_address`, and `processors`. `processors` is the provider table under "Who we share it with" in the platform Privacy Notice in force (DOC-85 §4), parsed by `platformProviders`. Every value is single-line and length-capped, with each Markdown character backslash-escaped. A missing value reads "[…: not set yet]". `renderLegalMarkdown` now treats `\X` as the literal character, and an escaped `\|` stays inside a table cell.
- **Triggers are detected from the site:**
  - `contact_form`: a contact-form instance on a page.
  - `mailing_list`: a form taking the `newsletter` acceptance, as a box or implied.
  - `sells`: Stripe can take payments and at least one shipping-zone country is saved.
  - `signed_in_customers`: an `account-chrome` or `account-portal` module.
  - `third_party_media`: an L1 image or video whose src is an absolute http(s) address.
  - `always`.
- **Regions** come from the country in the business details, plus every shipping-zone country once the site sells. GB maps to uk, US to us, an EU member to eu, and `any` always applies.
- **Documents are per business** (v1: one site per business). The facts come from the site being published.
- **Records in the business's ticket store** are versioned, with the newest winning:
  - `client_legal_document`: document, version, standard true/false, and the module refs (`key@date`) it was built from. For an edited version, these are the standard modules it was edited from.
  - `legal_details`
  - `legal_site_facts`: per publish, the triggers, the regions and the version uids put on the site.
- **Publish** (`POST /api/publish` and the consultant's `publish`) uses a `legal` step in `publishSite`. It runs after the refusals and the ladder, just before the render. Each standard document is rebuilt, and a new version is written only when its text changes. An edited document is kept as written. A document the site no longer needs is taken off.
  - A legal change alone is a reason to publish: a rebuilt text, an owner's edit, going back to standard, or changed facts.
  - Versions are written only after the revision has landed.
  - The pages are `legal/<name>.html` in the site's header and footer. Every web page's footer gets the links (a page with no footer gets a `<footer>` holding just the links).
  - A Shop Save's rebuild keeps the pages, using the current versions. The builder preview shows them, best effort: a preview never fails over them.
  - The Page menu lists them as "Legal: … — edited in Paperwork → Legal".
- **An owner's edit, or going back to standard,** goes on the site at the next publish. An edited document's warning is computed against the facts the last publish saw, plus the current details and library.
- **The pre-publish summary:** `GET /api/publish/status` and the consultant's `status` carry `legal` (`documents` and `summary`, one sentence per section added or removed, and why). The `publish` description tells the consultant to say these to the owner first.
- **Routes**, all owner or delegate only:
  - `GET /api/paperwork/legal`: the platform overview for 1st Contact; for a client, `{client, details, detailFields, documents}`.
  - `PUT …/details`
  - `POST …/preview`
  - `PUT …/documents/<id>`: an edit. It makes that one document `edited`. The text is capped at 60,000 characters.
  - `POST …/documents/<id>/standard`
  - The 1st Contact business's documents are unchanged and read-only (a write to them answers 409).
- **The Legal assistant's** new operations are `business_details`, `change_business_details` (its only write, through the same route as the form), `list_modules`, `explain_section` (the module's note) and `feature_effect`. It also has the development surface's `RequestCapability`, for a clause the library lacks. No operation takes document text. A details change emits `messages_changed`, so the pane reads again. The role prompt says it is not a lawyer and cannot change a word of any document.
- **The pane:**
  - The client's documents, with Standard / Edited by you and the version.
  - A Business details row and form.
  - Per document: which feature (and region) added each section, the history, an Edit (markdown) box with Preview, the warning with each added or removed section's text, and "Go back to the standard version".

**Supersedes:**
- [[REQ-661]]'s "a client business shows none". Its UAT is now `test_UAT_FC_REQ-661_a_client_business_does_not_see_the_platform_documents`.
- [[REQ-662]]'s "the Legal grant has no write". Its UAT is now `test_UAT_FC_REQ-662_the_legal_grant_writes_no_document_and_its_manual_names_nothing_else`: the only write is the business details.

**UATs.**
- `tests/test_UAT_FC_REQ-665_client_legal.workers.test.ts`: real router, D1, publish, and the public-site Worker. It covers:
  - Terms and Privacy for a contact-form site; Terms of sale added at the publish after selling starts.
  - The newsletter section added and removed.
  - The US→IE, UK and US-only regions.
  - Details filling the placeholders, and a details change taking effect at the next publish while staying Standard.
  - An edit kept through a feature change, with the warning and its section text, then "Go back".
  - Static pages, footer links and the Page menu.
  - The processors matching the platform provider list.
  - HTML and script left inert; the size cap.
  - The pre-publish summary.
  - The 1st Contact business left unchanged.
- `tests/test_UAT_FC_REQ-665_legal_assistant.workers.test.ts`: the details write and its refusals, explain and feature effect, no text write, and the grant containing nothing else.
- `tests/test_UAT_FC_REQ-665_legal_pane.test.ts` (jsdom builder).
- `tests/test_UAT_FC_REQ-665_legal_module_build.test.ts` (the bundler).