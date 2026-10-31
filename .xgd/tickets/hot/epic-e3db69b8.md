---
uid: epic-e3db69b8
id: EPIC-29
type: epic
title: 'Legal: 1st Contact terms & privacy, and standard legal pages for client sites'
created_by: xgd
created_at: '2026-10-29T23:34:26.197150+00:00'
updated_at: '2026-10-31T18:01:41.212451+00:00'
completed_at: null
last_field_updated: body
status: underway
fields:
  priority: medium
  epic_children:
  - request-7075ae7f
  chat_comment: comment-02b19238
---

# Legal: 1st Contact terms & privacy, and standard legal pages for client sites

## Why

Beta opens to a few dozen invited testers in the UK, Ireland and possibly other EU states. They pay nothing, and some will be individuals (hobby bands, personal portfolios, community projects) and therefore **consumers**, not businesses. The terms of service page today is placeholder lorem ipsum (REQ-169) apart from the beta review clause (REQ-479). We need real, versioned documents now, and a lawyer review later, before any paid launch.

Our clients' sites also need legal pages (privacy notice, who-runs-this-site notice and, once they sell, terms of sale). Clients come to us so they don't have to deal with this, so the platform should supply a sensible default.

## Facts this area rests on

- **Operator:** Lagrange Foundry LLC, a **California** LLC. US-law base, with UK and EU consumer protections preserved (Rome I Art. 6: we cannot remove a consumer's local mandatory protections).
- **GDPR / UK GDPR apply** (Art. 3(2): we offer the service to people in the UK and EU). Art. 27 representative: state our position (occasional, low-risk exemption) and flag it for the lawyer.
- **EU AI Act Art. 50:** chatbot disclosure has applied since 2026-08-02. The terms say the consultant is an AI.
- **Minimum age 18.** Open to businesses, charities, projects and individuals (not "in business" only). Terms are written to be safe for consumers throughout.
- **Third parties that receive data (from the code, 2026-10-29):**
  - Cloudflare: hosting, D1, R2, Workers AI embeddings, Browser Rendering, Images, DNS, Turnstile, Access
  - Anthropic: the consultant and builder conversations
  - OpenAI: image generation **and editing of client-uploaded photos**
  - fal.ai: video generation **from client-uploaded photos**
  - Resend: email
  - GitHub: beta feedback and session-review material become development tickets in a GitHub repository
  - AI tools used by the team to review beta sessions (REQ-479 clause)
  - Fonts are self-hosted (not Google)
- **DOC-5 principle 26:** providers are disclosed in the terms, never asked per tool. Client material destined for their public site may go to those providers; private customer data (lead/visitor emails) must not.
- **Processor role:** for leads and contact-form data on client sites we are the client's processor, so our terms carry GDPR Art. 28 data-processing terms.

## Workstreams

1. **The platform mechanism** (child REQ): Markdown legal documents whose source of truth is doc tickets, every published version bundled by the build and kept reachable, and separate, versioned acceptance of Terms and Privacy Notice.
2. **The documents** (doc tickets, drafted in CHAT-84):
   - **Terms of Service:** base from Basecamp's CC BY 4.0 policies (attribution kept), adapted with UK and EU overlays, the AI clause, the beta clause and data-processing terms.
   - **Privacy Notice:** GDPR Art. 13 contents, provider list, international transfers, retention, rights, ICO / DPC complaint routes.

   Both start at `draft` and are published by creating the version.
3. **Standard legal pages for client sites** (child REQ, later): standard, **modular** documents generated from the features a site actually uses (contact form, newsletter, bookings, payments, embedded media). Each module contributes its clauses; the business's identity is filled in from structured facts. The client may **add to or replace** any document with their own. Structured-only, no free-form HTML (Security Policy).

## Out of scope

- Lawyer review (tracked as a pre-paid-launch gate, not done here).
- Cookie consent banner. Only strictly necessary cookies today, so a statement is enough. Revisit if analytics arrive.


## Update 2026-10-29: three documents, and drafts filed

- **Three documents, not two.** Blanket Terms of Service plus separate **Beta Terms**, which are withdrawn when the beta ends. Each one is versioned and accepted separately (REQ-488 updated to match).
- **Versions:** DOC-76 Terms of Service, DOC-77 Privacy Notice and DOC-78 Beta Terms are published at 2026-10-30. DOC-80 is the Terms of Service 2026-10-31 draft. It adds a harassment, bullying and doxing section to §6 (prompted by the Sandy Hook harassment campaign) and lets people report abuse in §7, with priority for the person targeted. Publishing it makes every level 1 user accept the Terms again. Contact: legal@1stcontact.io. Address: c/o California Registered Agent Inc., 1401 21st Street, Suite 370, Sacramento, CA 95811.
- **Rule: anything the documents promise about deletion or retention must be done by code, automatically.** There is no data-deletion epic yet; DOC-37 (Data Deletion & Retention) is a design only. Until it is built, the drafts promise only on-request deletion within one month (the GDPR deadline), with no automated retention schedule. An automated deletion/export workstream implementing DOC-37 is needed before the documents can promise more, and before the beta ends.

## Scope agreed with the operator, 2026-10-30

This epic owns the legal documents **and** the experience and automation around them: presenting, accepting, storing acceptance, generating client drafts, and automated deletion.

### Three levels of user

- **Level 0:** 1st Contact operators (Lagrange Foundry staff).
- **Level 1:** our clients, the businesses and people who build sites with 1st Contact.
- **Level 2:** our clients' customers, the people who use the client sites.

The mechanism is the same for level 1 and level 2. Only the document set differs.

### 1. Versioned acceptance (levels 1 and 2)

- A business has a **set of required documents**. The set is data, so documents can be added and withdrawn. Today:
  - Level 1 (the platform's set): Terms of Service, Privacy Notice, Beta Terms.
  - Level 2 (each client's set): the client's Terms and Privacy Notice. There are **no Beta Terms at level 2**.
- A user accepts **a particular version** of each document. Publishing a new version means that user must accept again before continuing.
- A user who has not accepted the current version of every required document **cannot use the product functionality**.
  - Level 1: the builder.
  - Level 2: the signed-in features of a client site (the portal). Public forms stay login-free (DOC-5 #22), so a lead form is never gated.
- Every acceptance is **stored**, at both levels: who accepted, which version (the document's ticket uid), when, and the wording shown. This builds on the REQ-240 acceptance registry, which already works per business and per contact. No second mechanism.

### 2. The acceptance page (the same at both levels)

- It lists each required document as a **link, with a checkbox next to it**.
- Clicking the link opens the document (Markdown, rendered safely) in a **viewer**. The viewer also has a checkbox, so the document can be accepted from there. Ticking either checkbox ticks both.
- Continue is enabled once every required document is ticked. The Privacy Notice's checkbox says "I have read", not "I agree", because our legal basis is not consent.

### 3. Generated first drafts for clients (level 1, later)

A simple first draft of the client's Terms and Privacy Notice, generated from the features the site uses and the regions the client operates in (this is workstream 3 above). The client can add to or replace it. Their published documents become their level 2 required set.

### 4. Automated deletion (later)

- Account data is **deleted automatically 30 days after a user leaves**.
- **Correction:** account deletion is **not built** today. The portal's "Delete account" control only explains what erasure means and how to ask for it (`portal.ts`, REQ-183 §4.2). DOC-37 is a design only. So this is new work: real erasure (DOC-37), plus the 30-day scheduled job.
- Only once it runs in code do the documents promise it (the rule above). Then a new version of the Terms and Privacy Notice states it, and users are re-prompted under section 1.

### Priority

**Now:** level 1 beta. REQ-488 (the mechanism and the acceptance page for the platform's three documents) and the documents DOC-76, DOC-77, DOC-78.
**Later, as their time comes:** level 2 acceptance on client sites, generated client drafts, automated deletion.

### Decisions (operator, 2026-10-30)

1. **"Left" means the user closed their account.** Closing removes access at once; data is erased 30 days later. Inactivity does not start the clock.
   - There is **no close-account control today**. The portal's "Closing your account" panel (`portal.ts`, REQ-183) says "This page does not close your account on its own. Ask us and we will do it." So workstream 4 needs three things: a real close-account control in the portal, the erasure itself (DOC-37), and the scheduled job that erases 30 days after closing. The panel's copy changes in the same change, so it never says more than the code does.
2. **Level 2 uses the same rule: 30 days after closing, for every client.** No per-client setting until a client asks for a different period; that would be added then.