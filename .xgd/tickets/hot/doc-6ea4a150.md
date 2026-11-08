---
uid: doc-6ea4a150
id: DOC-121
type: doc
title: 'Legal documents: design for every business''s terms, privacy notice and terms
  of sale'
created_by: EPIC-29
created_at: '2026-11-08T17:59:13.759856+00:00'
updated_at: '2026-11-08T18:01:41.545863+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  doc_kind: architecture
  epic_uid: epic-e3db69b8
---


# Legal documents: design

**Status:** design agreed with the operator in EPIC-29, 2026-11-07 to 2026-11-08. Parts are built ([[REQ-665]], [[REQ-666]], [[REQ-668]]), parts are ticketed ([[REQ-669]], [[BUG-383]]), §7 is built under [[REQ-669]] item 2 (except choosing an audience), and §8 is agreed but **deliberately not ticketed yet** (operator, 2026-11-08: "hold on tickets for this for now"); [[TODO-23]] is the reminder. Where a ticket and this document disagree, this document is the newer statement of intent.

**Words.** "Legal documents" in the builder and in tickets; "legal pages" for what a site shows. "Legal" as a heading (Paperwork → Legal, the footer's link row).

**Not legal advice.** Everything here is a reasonable starting point written in good faith. A lawyer reviews the standard text and these rules before paid launch.

## 1. Principles

1. **Every business is the same.** 1st Contact is a business like any other and gets every document, check, update and protection a client gets. Nothing in the legal path branches on "is this the platform business" ("we eat our own dog food").
2. **Standard text is written once, by us, never by AI.** A lawyer reviews one library, not every site. Code fills it in from the business's details.
3. **Site features never change the Privacy notice or the Terms.** Those documents are written with contingencies ("If you join our mailing list…"), so turning a feature on or off sends no email and asks nobody to accept again.
4. **Owners are responsible for their documents.** We supply a starting point, they are told it places obligations on them (1st Contact Terms §8, [[DOC-117]]), and they may add to it, edit it or replace it.
5. **Structured-only.** Owner Markdown and standard text reach the browser only through the legal Markdown sink (`renderLegalMarkdown`); placeholders are typed business details, escaped (Security Policy).
6. **Legal pages never depend on compute.** They are static pages, like the rest of a published site (Architecture Policy 34). A legal change rebuilds the business's published sites from their **published** definitions, never an owner's draft ([[REQ-669]]).

## 2. The standard library

- **Where it lives:** doc tickets carrying `legal_module` ([[DOC-87]]–[[DOC-116]], [[DOC-119]]), maintained in EPIC-29 and bundled by the build. Owners never see or edit the library itself; they see their own documents built from it. The 1st Contact business's Paperwork → Legal shows 1st Contact's documents, not the library.
- **Sections, not feature modules.** Each module is one section of one document, with a position, a plain-English note for the Legal assistant, a `material` flag, and placeholders from a closed list of business details.
- **Which sections appear:**
  - **Terms of use, Privacy notice, Member terms:** every section, always (trigger `always`, region `any`), written in "if" style. Every business has all three. They change only when the owner edits them or we revise the standard text. The build refuses a module that would make them depend on a feature or region ([[REQ-669]]).
  - **Terms of sale:** exists only when the business sells (`sells`). It has per-region sections (UK, EU, US cancellation rules), chosen from the business's country and the countries it ships to. Nobody re-accepts it; each order records the version shown.
- **Regions in the first release:** US, UK and EU.
- **Revising the library** publishes a new version of a module. It reaches businesses as described in §5.

## 3. A business's documents

A business has:

| Document | When it exists | Who it is for | Acceptance |
|---|---|---|---|
| Terms of use | always | every visitor | shown (footer); never accepted |
| Privacy notice | always | everyone whose data the business holds | shown; signed-in customers "read" it at first sign-in and after a significant change |
| Terms of sale | when it sells | buyers | shown at checkout ("By paying you agree…"), version recorded on the order, linked from the confirmation email |
| Member terms | always (their text says "when you create an account") | signed-in customers | agreed at first sign-in, and again after a significant change; linked from the acceptance page and account area, not the footer |
| Its own documents (§7) | when the owner adds them | as the owner chooses | as the owner chooses |

Each standard document is either **Standard** or **Edited by you**, per document:

- **Standard:** built from the library and the business details. The owner can still **add their own sections** at a place they choose; the document stays Standard and our sections keep updating ([[REQ-669]]).
- **Edited by you:** the owner has changed our text. From then on we never change it; they get our revisions as advice (§5) and a warning when it falls behind.

**Business details** (Legal mode form; the Legal assistant may change them): legal name, trading name, postal address, contact email, country, returns window, delivery note. Changing a detail never takes a document out of Standard. Selling needs the legal name, address and contact email ([[REQ-666]]).

### 1st Contact's own documents

Exactly the same model ([[REQ-669]], seeded from [[DOC-120]]): the standard documents plus 1st Contact's added sections, plus its Beta Terms as a document of its own. 1st Contact's clients accept its Member terms (which carry the platform rules: AI, content, harassment and doxing, processing terms, liability), read its Privacy notice and accept the Beta Terms. We maintain **one** standard set plus 1st Contact's additions, never a second full copy. Until REQ-669 lands, [[DOC-117]] and [[DOC-118]] are in force and 1st Contact's sites also carry generated standard documents; that duplication is accepted until then.

## 4. Where documents appear

- **Every web page's footer** carries a "Legal" row linking the documents everyone is subject to (Terms of use, Privacy notice, Terms of sale when selling, and the owner's display-only documents). Member terms and documents to accept are linked from the acceptance page and the signed-in customer's account area instead. The renderer writes it from the document list, not from the site design, so the consultant cannot remove it; it must never be silently dropped ([[BUG-383]]). No owner switch to hide it.
- **Pages** at `/legal/<name>`, and every published version at `/legal/<name>/v<N>`, permanently ([[REQ-666]]). `/legal/` is reserved for them ([[BUG-383]]).
- **The consultant never writes legal text, legal pages or legal links**; it sends the owner to Paperwork → Legal ([[BUG-383]]).
- **Checkout:** one line above the pay button, no tick box. **Acceptance page:** at sign-in, for documents signed-in customers must agree to or read.

## 5. Changes and who is told

**Significant (material) vs wording.** For standard text, the module's `material` flag decides. For an owner's edit, the owner chooses with a switch, off by default, with the Legal assistant's advice.

| What changes | What happens |
|---|---|
| Wording-only change to any document | New dated version; nobody is asked or told |
| Significant Terms / Member terms change | Signed-in customers accept again at next sign-in |
| Significant Privacy notice change | Live at once (no notice period for the public); emailed to every contact we hold an email address for; signed-in customers asked to read it at next sign-in |
| New use of data already held | Not automated: the consultant warns the owner that it usually needs consent |
| Terms of sale change | Applies to new orders; each order keeps the version it was shown |

**How standard revisions reach a site** ([[REQ-669]]): legal pages publish on their own, not with the site. Saving business details or an owner edit updates them straight away. A revision of the standard text is announced to each affected owner first (owner message and Paperwork → Legal notice, with old and new wording and the date), and takes effect **14 days later** automatically; that wait is for owners, not the public. An edited document is never changed; its owner gets the revision as advice. Announcing and applying run as batched background work.

**Reaching people.** We tell people only through contact details we hold. Contacts do **not** need an email address (phone-only enquiries stay). The Privacy notice says "we can only tell you directly if we have a way to contact you" ([[DOC-107]], [[DOC-118]] §10). Text messages for phone-only contacts are later work. Records kept after deletion keep name, email address and billing address ([[DOC-37]] §6.3).

## 6. Paperwork → Legal

- Lists the business's own documents: status (Standard / Edited by you), live version, which sections are the owner's, warnings, pending standard revisions with their date.
- Business details form.
- Markdown editor and preview for edits and added sections.
- The **Legal assistant** explains sections (from each module's note), says what a change will do, changes business details, and files a library gap as a request. It never writes document text and is not a lawyer.

## 7. Custom documents (agreed 2026-11-08; built under [[REQ-669]] item 2, without choosing an audience)

A **+** button in Paperwork → Legal adds a document of the business's own, such as 1st Contact's Beta Terms or a competition's rules.

- **Title:** what visitors see; the page address follows from it (`/legal/beta-terms`).
- **Text:** Markdown, through the legal sink.
- **Kind**, one of three:
  - **Display only:** a page linked from the footer; nobody accepts it.
  - **Accept once:** signed-in customers accept it at their first sign-in after it is published; later versions don't ask again.
  - **Accept every new version:** each new published version is put to signed-in customers again.
- **Draft, then Publish new version.** Unlike Paperwork messages (live on save), editing a custom document saves a draft and publishing is a separate, deliberate step, so fixing a typo in an "accept every new version" document doesn't make everyone accept again. Before publishing, the pane (and the assistant, if asked) says what publishing will do.
- **Versions:** each published version is kept with its date and its own permanent page; acceptances name the exact version.
- **Withdraw:** removes it from the site and the acceptance page and keeps everyone's acceptance records. The Beta Terms end this way when the beta ends.
- **Where it appears:** display-only documents in the footer; documents to accept on the acceptance page and in the signed-in customer's account area.
- **Later, not now:** choosing which signed-in customers a document applies to (for example only beta participants). For now it applies to everyone who signs in.

## 8. Version history for owners (agreed 2026-11-08, not yet ticketed; see the reminder in the status line)

Owners need past versions: orders and acceptances point at exact versions, and a dispute asks "what had this customer agreed to on that date?".

- Every document in Paperwork → Legal has a read-only **history**: each published version, its date, whether it is in force, how many people accepted it, and its text.
- **Restoring** an old version publishes a copy of it as the newest version. Nothing is rewritten or lost.
- Visitors can already open every published version at its permanent page ([[REQ-666]]). REQ-661 already shows version history for 1st Contact's builder documents; this extends it to every document.

## 9. Open

- Lawyer review of the standard library and these rules before paid launch (including the 14-day owner notice, renewal notices for subscriptions under US auto-renewal law and the UK DMCC Act, and online cancellation for California).
- Text-message notices for contacts with only a phone number.
- Choosing an audience for custom documents.
- Version history for owners (§8).
