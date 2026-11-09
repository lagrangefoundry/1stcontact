---
uid: request-d71a191f
id: REQ-669
type: request
title: 'Legal: 1st Contact''s own documents through the same pipeline, and owner-added
  sections'
created_by: EPIC-29
created_at: '2026-11-08T17:04:44.638103+00:00'
updated_at: '2026-11-08T20:54:17.157242+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-e3db69b8
  story_points: 20
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-73cb53a4
  commits:
  - working_sha: 599b0eb34da0f8ac6747cf1a7497fb31318aed66
    reconcile_sha: null
    main_sha: null
  - working_sha: a48009edb43911e67dbe1947adecb5c13b42dee7
    reconcile_sha: null
    main_sha: null
  - working_sha: 9b0b9ee3a77059e9b97d4ae7c2fa9e48163e7414
    reconcile_sha: null
    main_sha: null
  - working_sha: 80dc98ae043f46962a59808b510ee755ce0f0658
    reconcile_sha: null
    main_sha: null
  - working_sha: db3ce92efb3b2686a4be487e6c0a4d79a8e0928e
    reconcile_sha: null
    main_sha: null
  - working_sha: 692a35a3d857060b4e1f3081e730f807580e5878
    reconcile_sha: null
    main_sha: null
  version: 0.2.832
---

## Why

Operator, 2026-11-08 (EPIC-29): "I certainly want all the automated protections and update tech to work for 1c … We eat our own dog food. Ideally it's the same doc." 1st Contact is a business with a site, members (our clients), a mailing list, a contact form and paid plans. REQ-665 left it out ("the 1st Contact business is unchanged"): its Terms, Privacy Notice and Beta Terms are still doc tickets inlined by the build, read-only in Paperwork → Legal, and the platform's acceptance gate is separate code. Every exemption is a place the product goes untested on the one business that uses it daily.

1st Contact's documents can't be *only* the standard text: its Terms carry platform rules no client site has (AI, content ownership, harassment and doxing, GDPR Art. 28 processing terms, the paragraph on the legal documents we provide), and it has Beta Terms. Taking over (editing) its standard documents would lose the automatic updates. The answer, useful to every client, is **owner-added sections**: the operator's second editing case from the first EPIC-29 discussion ("small language change") without taking the document over.

## What changes

1. **Owner-added sections.** In Paperwork → Legal, a standard document gets "Add your own section": a heading and Markdown text, placed after a standard section the owner chooses (or at the end). The document **stays Standard**: our sections keep updating; the owner's sections are carried through every rebuild unchanged. Saving an added section writes a new version of the document, with the same per-document "tell people about this change" / "ask signed-in customers to accept again" switch as an edit (REQ-666), off by default. Keeping added sections consistent with the standard text is the owner's job; the Legal assistant can point out a conflict but, as before, cannot write text.
2. **Owner-only documents.** "Add a document": title, Markdown, whether it is agreed to or read, and whether signed-in customers must accept it. It can be withdrawn (withdrawing retires the document, never anyone's record of having accepted it). 1st Contact's Beta Terms are one.
3. **1st Contact through the same pipeline, no exemptions.** Its documents become its business's records like every other business: the standard Terms of use, Privacy notice and Terms of sale, plus 1st Contact's own added sections, plus the Beta Terms as its own document. Its Legal mode is editable like any other. Its clients sign in to it (REQ-668) and accept its documents through the same acceptance gate as any business's signed-in customers (REQ-666 item 4), so the separate level-1 path (`guardTerms` reading the built-in bundle) goes. Its material changes follow the same rules: privacy email to its contacts at publish, Terms re-acceptance for material changes. Remove `requirePlatformTenant`-style legal branches rather than adding conditions to them.
4. **Cut over, not phased.** The built-in bundle of 1st Contact's documents (doc tickets with `legal_document`, inlined by the build, and the build refusing malformed ones) is replaced in one change. Every version already published (DOC-76, DOC-77, DOC-78, DOC-84, DOC-85, DOC-117, DOC-118) is carried into 1st Contact's records as history **under its existing uid**, so every recorded acceptance still points at the text it named. The starting split of 1st Contact's current Terms and Privacy Notice into standard text plus added sections is drafted in EPIC-29 and seeded once. The **module library stays in the build** (doc tickets with `legal_module`), reviewed in EPIC-29.
5. **Features never change the Privacy notice, Terms of use or Member terms.** The library already says this in data (operator, 2026-11-08: modules written in "if" style, trigger `always`, region `any`; DOC-87–107 and DOC-116 published 2026-11-08). The library build now **refuses** a privacy or terms module with any other trigger or region, and a member-terms module with a trigger other than `signed_in_customers`, so a later module can't bring the churn back. Only Terms of sale appears and disappears with selling, and keeps per-region modules (nobody re-accepts it; each order names its version).
6. **The edited-document warning** (REQ-665 item 4) then only fires for Terms of sale and for a revision of our standard text, never for a Privacy notice or Terms change caused by features. Keep it; it needs no special case.

## Out of scope

Text-message notices. Lawyer review (EPIC-29). Rewriting module texts (EPIC-29's doc work).

## Test plan

UATs named `test_UAT_FC_REQ-669_*`, real router and D1, real builder (jsdom) for the pane, real site build for pages:
- An owner adds a section after "Who we are"; the document stays Standard; a later revision of a standard module rebuilds it with the owner's section still in place.
- Saving an added section writes a new version; with the switch off, nothing is sent and nobody re-accepts; with it on, the REQ-666 behaviour follows.
- An owner-only document that signed-in customers must accept appears on the acceptance page; withdrawing it removes it from the page and keeps existing acceptance records.
- The 1st Contact business has the same Legal mode, Buy gate, checkout line and acceptance gate as a client business; nothing in the legal path branches on it.
- After the cutover, an acceptance recorded against DOC-84's uid still resolves to DOC-84's text, and the acceptance page asks a 1st Contact client to accept 1st Contact's current Terms.
- The library build refuses a privacy module with trigger `mailing_list`, a terms module with region `uk`, and a member-terms module with trigger `sells`; it accepts the published library.
- Turning a contact form or mailing list on or off and publishing leaves the Privacy notice and Terms of use versions unchanged.


## Supersedes, and a document change at landing

- **Explicit supersession of [[REQ-665]]:** "The 1st Contact business is unchanged" and "a client business shows none" are superseded by item 3 here. REQ-665's examples of a mailing-list form adding a section to the Privacy notice, and of an edited Privacy notice warning about a new feature, no longer happen with the published library (item 5); REQ-665's trigger mechanism stays, and only Terms of sale uses it.
- **When this lands,** publish a new Terms of Service version adding to §8 "Legal documents we provide for your site": "**You can add your own sections** to one of our standard documents without taking it over. We keep our parts up to date; keeping your own sections accurate and consistent with ours is up to you." It is left out of [[DOC-117]] until the feature exists, so the Terms never describe something the product can't do.


## The split is drafted: [[DOC-120]] (EPIC-29, 2026-11-08)

[[DOC-120]] is 1st Contact's own sections on top of the standard documents, each with its placement (`start` or `after <module key>`), plus 1st Contact's business details. Seed it as owner-added sections on the 1st Contact business. How 1st Contact's documents map:
- **Member terms** (what 1st Contact's clients accept; replaces "Terms of Service"): standard [[DOC-116]] plus 1st Contact's sections (who we are, who can use the Service, AI, your content, things you must not do, reporting, your site's legal duties, the processing terms, our part, our responsibility, ending, law, contact).
- **Privacy notice:** the standard modules plus 1st Contact's sections (who this notice covers, the builder's data categories, AI and media providers, where we work from, how long we keep it, security and age, visitors to client sites).
- **Terms of sale:** the standard modules, including the new "Subscriptions and services" ([[DOC-119]]), plus "Our cooling-off periods go further".
- **Terms of use:** standard only.
- **Beta Terms** ([[DOC-78]]): an owner-only document 1st Contact's clients must accept.
- Links move to the `/legal/...` paths (`/legal/member-terms`, `/legal/privacy`, `/legal/beta-terms`); the old `/terms`, `/privacy` and `/beta-terms` addresses should redirect so links already sent keep working.

Test plan addition: after seeding, 1st Contact's Member terms are the standard text with DOC-120's sections at their placements, and a 1st Contact client's acceptance page asks for the Member terms, Privacy notice (read) and Beta Terms.


## Added 2026-11-08 (operator, EPIC-29): standard updates reach every site, with warning to the owner

Replaces REQ-665's "standard documents are rebuilt when the site is published". Under that rule an owner who doesn't republish never gets our corrections, and one who does gets them by surprise.

7. **Legal pages are published on their own**, not with the site. They are rebuilt and served as static pages, with no site republish, when:
   - **the business details are saved** (straight away);
   - **the owner edits a document or an added section** (straight away, like Paperwork messages);
   - **a revision of the standard text takes effect** (item 8);
   - **selling starts or stops** (Terms of sale appears or goes, as now).
8. **A revision of the standard text is announced to owners before it takes effect.** When a new version of a module is published in the library, every business whose documents would change gets:
   - an **owner message** (a Paperwork system message to the owner and delegates, editable copy, fixed trigger) and a **notice in Paperwork → Legal**, naming each document affected and showing the old and new wording of each changed section;
   - the **date it takes effect**: 14 days after the revision is published (`LEGAL_REVISION_NOTICE_DAYS`, a platform constant). The waiting period is for owners, so they can read what the new text commits them to; it is not a notice period for the public.
   - On that date the business's documents are rebuilt and their legal pages updated automatically. If the revision is material, REQ-666's consequences follow then: the privacy email to contacts, Terms re-acceptance for signed-in customers.
   - Before the date, the owner can add their own sections or edit the document. An **edited** document is never changed; its owner gets the same message as advice ("our standard text now says…") and the edited-document warning in Legal mode.
   - The consultant and Legal assistant can say what is changing and when.
   - Revisions for 1st Contact's own documents follow exactly the same path.
9. **Bounded by construction** (Architecture Policy 35): announcing a revision and applying it on its date run as scheduled background work in small batches across businesses, never as a fan-out inside the request that publishes the module.

Test plan additions:
- Saving business details updates the published legal page without a site publish.
- Publishing a module revision sends the owner message with old and new wording and the effective date, and changes nothing on the site until that date; on the date the legal page shows the new text.
- A business with that document edited gets the message as advice and its document is unchanged.
- A material revision sends the privacy email to contacts on the effective date, not when the revision is published.


## Answers to the implementation questions (EPIC-29, 2026-11-08)

The design behind these answers is [[DOC-121]] (Legal documents: design). Where this ticket and DOC-121 disagree, DOC-121 wins.

1. **What signed-in customers accept: the Member terms, never the Terms of use.** Terms of use are for every visitor and are shown, not accepted (DOC-121 §3). Signed-in customers agree to the Member terms and read the Privacy notice, plus any of the business's own documents that ask for acceptance. This changes REQ-666's behaviour for every business, which is intended: no 1st Contact branch.
2. **How 1st Contact gets Member terms: every business has them; there is no detection.** Simpler than the proposed "account module or anyone signed in" rule, and it avoids Member terms appearing only after someone's first sign-in. Member terms always exist (their text is already conditional: "These terms apply when you create an account…"). They are linked from the acceptance page and the signed-in customer's account area, **not** from the footer. So a site with no accounts shows nothing extra, and nobody is asked to accept them until they sign in. As part of this ticket: set [[DOC-116]]'s `legal_module_trigger` to `always` (a doc-ticket field change), drop the `signed_in_customers` trigger if nothing else uses it, and change item 5's build check so member-terms modules must also be `always` / `any`.
3. **Legal pages "published on their own" (item 7): yes to the recommendation.** After a legal change, rebuild each of the business's published sites from its **published** definition (never the owner's draft), as batched background work on the existing rebuild path. No separate store of `/legal/*` pages outside the snapshot.
4. **Seeding 1st Contact's history and DOC-120: yes to a one-off command per environment** (`1c legal seed-platform --env dev|production`). It reads the doc tickets and writes the records, and each old version keeps its original doc uid so an acceptance naming DOC-84 still finds DOC-84's text. Hand the operator the exact command; the operator runs it, once per environment.
5. **The "You can add your own sections" sentence: yes, at the cutover,** inside 1st Contact's "Legal documents we provide for your site" section. No separate Terms of Service version. It is a material change, so every 1st Contact client is asked to accept the new Member terms at their next sign-in. That is expected, and there are no clients yet.

**Item 2, the business's own documents:** build it in [[DOC-121]] §7's shape, not a narrower one that §7 would later replace:
- three kinds: display only, accept once, accept every new version;
- a title, which sets the `/legal/<slug>` address;
- edits save a draft, and **Publish new version** is a separate step;
- withdrawing keeps everyone's acceptance records.

Choosing which signed-in customers a document applies to stays out (DOC-121 §7, "later"). The Beta Terms are seeded as **accept every new version**. Owner version history (DOC-121 §8) is **not** in this ticket.

**Size and landing: agreed.** One ticket, several commits on one branch, landing in three steps:
1. The library check, owner-added sections and the business's own documents.
2. The cutover, the seed and the redirects from the old addresses.
3. Separate legal publishing and revision announcements.

Merge back and move to `free_coded` only when all three are done.



## As built (REQ-669 session, 2026-11-08)

One branch, four commits, landed together. Where this section and the earlier ones differ, this describes the code.

**1. The library check (item 5).** A trigger is now only `always` or `sells`. The build refuses a Terms of use, Privacy notice or Member terms module that is not `always` / `any`, and a Terms of sale module whose trigger is not `sells`. Detection of site features (contact form, mailing list, account box, media from other sites) is gone, so turning one on or off never changes a document. DOC-116's trigger is now `always`. The Legal assistant's `feature_effect` only knows `sells`.

**2. Owner-added sections (item 1).** These are `legal_owner_section` records, placed at `start`, `after:<module key>` or `end`. A section whose module later leaves the document goes to the end rather than being dropped. Adding one is refused on an edited document ("change its text directly, or go back to the standard version first"). Each save or removal writes a new standard version, with the "tell people" / "ask again" switch off by default. The heading is escaped and the text goes through the legal Markdown sink. The pane has "Your own sections" (add, change, remove) on a standard document.

**3. The business's own documents (item 2, DOC-121 §7).** These are `legal_own_document` drafts.
- The address comes from the title when the document is created, and never moves. The standard documents' addresses are refused.
- There are three kinds: display only, accept once, accept every new version.
- **Publish new version** publishes the draft, and is refused when nothing changed since the last version. Each version gets its own `/legal/<address>/v<N>` page.
- **Withdraw** takes it off the site and the acceptance page. Every acceptance and every version page are kept.
- A display-only document is in the footer. The other kinds are accepted on the acceptance page under `own_document:<address>` keys. "Accept every new version" asks again at each version; "accept once" never asks again.

**4. What signed-in customers accept (answers 1–2).** Every business has Member terms. They are served at `/legal/member-terms` and are not in the footer. Signed-in customers agree to the Member terms, read the Privacy notice, and accept the business's own documents that ask for it. They are never asked to accept the Terms of use. Membership ("member since") counts a Member terms acceptance, as well as an older `t_and_c_accepted` one.

**5. The cutover (items 3–4).**
- The build no longer bundles 1st Contact's Terms, Privacy Notice and Beta Terms (`legal-documents.ts` and `generated/legal.js` are gone).
- 1st Contact's members go through the same gate, Legal mode, pages and checks as any business's customers. The separate builder-door path, its pages, and the read-only 1st Contact Legal mode are removed.
- The one step that stays specific to 1st Contact is onboarding, not a legal rule: accepting 1st Contact's documents, as someone who owns nothing, still gives them a business ([[REQ-203]]).
- `/terms`, `/privacy` and `/beta-terms` redirect (302) to the Member terms, Privacy notice and Beta Terms on 1st Contact's own site. `<path>/<YYYY-MM-DD>` goes to the version published that day.
- The `{{processors}}` list used to come from the bundled Privacy Notice's table. It is now a platform constant (`PLATFORM_PROVIDERS`, taken from DOC-118's table).
- Acceptance counts (how many people hold which version, never who) are now in every business's Legal mode and in the Legal assistant's `acceptance_summary`.
- People → Agreements names a business's own version (`v<N>`) and links its page.

**6. The seed (item 4, answers 4–5).** You run `1c legal seed-platform --env dev|production` once per environment. It reads the old doc tickets and DOC-120 (now marked `legal_seed: platform`) and posts them to the operator-only `POST /api/admin/legal/seed-platform`, which:
- Writes 1st Contact's business details.
- Writes history: the Terms of Service versions become the Member terms' history, the Privacy Notice versions the Privacy notice's. Each keeps its original uid (`named_uid`, so an acceptance naming DOC-84 still finds DOC-84's text) and its date. History is numbered after any version a site publish already wrote.
- Writes DOC-120's added sections, then one new standard version of each document carrying them. These are material, so every 1st Contact client accepts again.
- Creates the Beta Terms as an accept-every-version document of 1st Contact's own (DOC-78, then a version with its links moved to `/legal/...`).
- Stores the Terms of sale section until 1st Contact sells, and records the history as having been on its site, so every old version keeps a permanent page.
- Publishes the legal pages.
- Refuses to run a second time, or on a business that already has its own sections or documents.

DOC-120's "Legal documents we provide for your site" now includes the "You can add your own sections" bullet. No separate Terms of Service version.

**7. Legal pages published on their own (item 7).**
- These publish the legal pages straight away, with no site publish: a Paperwork → Legal write (details, an edit, "go back", a section, publishing or withdrawing one of the business's own documents, but not saving a draft), and the Legal assistant's detail change. They rebuild each published site from its **published** definition.
- Selling starting or stopping (the `payments` rebuild) does the same, so the Terms of sale come and go with it.
- An item or stock rebuild keeps the legal pages as they stand.

**8. Standard revisions (items 8–9).**
- The library keeps every published module version. A version takes effect `LEGAL_REVISION_NOTICE_DAYS` (14) after its `legal_module_version` date. Versions on or before `LEGAL_LIBRARY_BASELINE` (2026-11-08, the library as published at this landing) are in force at once.
- Documents are always built from the library in force that day. Before the day, a site publish keeps the old wording.
- On every tick, `runLegalRevisions` (migration 0060: `legal_revision_runs`, `legal_revision_businesses`) tells businesses in batches of 10, with a cursor. It sends the fixed `legal_revision` owner message (copy editable in Paperwork → Email) to the owner and delegates: each document, the day, and each changed section as it is now and as it will be. A business whose document is edited is told as advice, and that document is never changed.
- A business that joins during the notice period is told too.
- On the day, the job publishes each told business's legal pages again, so REQ-666's consequences of a material change follow then (the privacy email to contacts, re-acceptance).
- Paperwork → Legal shows the notice with both wordings. The consultant's pre-publish summary and the Legal assistant's new `standard_revisions` tool say what changes and when.
- The owner message is a notify kind, so it carries "Stop these emails" like the other notifications. Whether a legal notice should be opt-out-able is yours to decide.

## What you need to do at landing

1. Deploy, so migration 0060 applies.
2. Straight after, run the seed. Until it has run, 1st Contact has no documents, so somebody signing up to 1st Contact is shown no acceptance page and gets no business. For production, with the Access service token in `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET`: `NODE_USE_ENV_PROXY=1 node tools/generate/bin/1c.mjs legal seed-platform --env production`. For dev, run the same with `--env dev` (through `bin/access-sim`).
3. Expect two things. The seed's Privacy notice is a material change, so 1st Contact's contacts with an email address get "We've updated our privacy notice". And every 1st Contact client is asked to accept the Member terms, Privacy notice and Beta Terms at their next sign-in.

## UATs

- Library check: `test_UAT_FC_REQ-669_library_check` (refusals, and the published library accepted).
- Sections and own documents: `test_UAT_FC_REQ-669_owner_sections_and_documents` (routes, publish, site, acceptance page) and `test_UAT_FC_REQ-669_legal_pane` (jsdom: sections, add a document, the revision notice).
- Cutover and seed: `test_UAT_FC_REQ-669_platform_cutover` (the seed through the admin route, DOC-84's uid, 1st Contact's acceptance page, signing up, redirects) and `test_UAT_FC_REQ-669_platform_seed` (the seed built from the real tickets and DOC-120).
- Publishing on its own, revisions, and features: `test_UAT_FC_REQ-669_standard_revisions` (announced with both wordings and the date, nothing until the day, applied on the day with the owner's section in place, edited documents told as advice, the privacy email on the day, a business joining in the notice period, details publishing at once, a mailing list on and off changing nothing).
- The Legal assistant's revisions tool: `test_UAT_FC_REQ-669_the_legal_assistant_says_what_our_standard_text_will_change_and_when`, in REQ-665's assistant suite.
- Suites pinning behaviour this ticket supersedes were rewritten: REQ-169, REQ-488, REQ-661, REQ-665, REQ-666, REQ-479, REQ-642.


## Paperwork → Legal: how a document is shown and edited (operator, 2026-11-08, EPIC-29)

Change to the as-built REQ-665/REQ-666 document view (`apps/control-app/src/builder/paperwork.js`, `openClientDocument`). This replaces that view's layout; where earlier items in this ticket describe the pane differently, this section wins. Applies to every legal document of every business, 1st Contact included. Wording below uses the Privacy notice; for other documents say "terms" (e.g. "Use custom terms").

1. **No "Sections, and what added them" list.** Site features no longer add sections (DOC-121), so the list goes, along with its data in the view.
2. **No "rebuilt from your site's features…" sentence.** It is wrong: the notice never changes with the site's features.
3. **The first thing shown is the current document**, read-only. The always-open "Edit (markdown)" box, its Preview button and "Save my edit" go.
4. **Standard document.** Above the text, a short description: "This is 1st Contact's standard privacy notice. We keep it up to date for you, and it is filled in from your business details." On the right, **[Use custom notice]**. It opens a confirmation explaining the consequences (from then on the text is yours, we stop updating it, and you're responsible for keeping it accurate), with **OK | Cancel**. OK replaces the read-only text in that space with the editor, starting from the current text.
5. **Custom document.** The area above the editor says where the owner is ("You're using your own privacy notice. We no longer update it for you.") and offers **[Use standard notice]**, with a confirmation. OK puts the read-only standard text back and removes the editor. **The custom text is kept, not deleted**: it stays in the version history, and choosing "Use custom notice" again starts from the last saved custom text.
6. **The editor is our standard LF editor**: `mountRichEditor` from `@lagrangefoundry/webui-markdown` (TipTap-based, already a control-app dependency, used by goal-map), reading and writing the same Markdown we store and render. Don't add TipTap or any other editor directly. It is never called "Markdown" anywhere a user sees: no "markdown" label, hint or button. Its output must stay within what our safe legal renderer shows.
7. **Save and Cancel**, both with confirmations:
   - **Cancel:** "Changes since your last save will be lost." **Keep editing | Discard changes**. Discarding goes back to the last saved text.
   - **Save:** asks whether the change affects people. For the Privacy notice: a checkbox "These changes change how we use people's information"; for terms: "These changes matter to people already signed up". Unchecked by default. **Cancel | Save**. The checkbox drives the existing material-change behaviour (REQ-666). The confirmation states when it goes live (with legal pages publishing on their own under this ticket: on save).
8. **The Legal assistant's chat box sits at the bottom of the page**, as on every other tab's assistant. Match their layout; don't build a second one.

**Owner-added sections (item 1 above) in this layout — open, confirm with the operator before building:** the redesign has no visible place for "Add your own section" yet, and 1st Contact needs it. Proposed: on a standard document, below the read-only text, an **"Add your own section"** button. Added sections appear inline in the document marked "Your section", each with Edit and Remove, using the same editor and the same Save/Cancel confirmations. The document stays Standard.

Tests: standard view shows the description and [Use custom notice] with no editor; the confirmation's Cancel leaves it unchanged and OK shows the editor seeded with the current text; custom view shows [Use standard notice], and switching back restores the read-only standard text while keeping the custom text (switching to custom again starts from it); Cancel with unsaved changes asks and discards; Save asks with the checkbox, and the checked state reaches the material-change path; no "Sections" list, no "site's features" sentence and no visible "markdown" text in the pane; the chat box is at the bottom as on other tabs.