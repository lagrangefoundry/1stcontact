---
uid: request-d71a191f
id: REQ-669
type: request
title: 'Legal: 1st Contact''s own documents through the same pipeline, and owner-added
  sections'
created_by: EPIC-29
created_at: '2026-11-08T17:04:44.638103+00:00'
updated_at: '2026-11-08T18:27:32.109372+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  parent_uid: epic-e3db69b8
  story_points: 20
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-73cb53a4
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