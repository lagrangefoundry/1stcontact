---
uid: story-83ff6262
id: STORY-166
type: story
title: 'Customer portal: an account reaches its own page, rendered as site content,
  with an honest Delete account control'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:14:57.817737+00:00'
updated_at: '2026-11-01T20:14:57.817737+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-39edf66d
  capability_uid: capability-e5939ceb
  story_kind: feature
  story_points: 3
---

## Story
**As an** account of a business (a 1st Contact customer today, and one level down a customer of that customer), **I want** a page that is about me and my relationship with that business, and that tells me plainly what closing my account would destroy and what would survive, **so that** I can see what I hold and exercise my right to erasure without being misled about what the system does, even if every grant I hold has lapsed.

## Description
The customer portal is the account's own surface (REQ-183). It is a **page of a site**: it is the "portal" site of the business the caller is an account *of*, rendered by the same pipeline that renders every other site page. It is not a builder feature. v1 has exactly one capability, a **Delete account** control. That control is live. It reveals the DOC-37 §6.1 explanation of what erasure destroys, what survives, and why each survivor serves the person. It deletes nothing and records no request.

In scope:
- `/account` on the control-app origin. It is reached from the builder's avatar dialog through a link that opens a new tab.
- The host business is the one the caller is an account of. It is never the business they are currently operating, and the page needs no business scope, so an account whose grants have all lapsed still reaches it.
- An authored `portal` site in the host business takes precedence. Otherwise a shipped default portal is rendered. Its site settings derive from the starter site every new site gets.
- The account line and the list of businesses the account operates are filled in the browser from the caller's existing account endpoint (REQ-179). With no scripting, the page shows the full explanation.
- The surface reads only and grants nothing. It answers only about the caller.

Out of scope (REQ-183 §5, "What this does not land"): any deletion machinery (store registry, sweep, crypto-shred, suppression hash, billing redaction), recording erasure requests, plan, charges, editing details, export, adding a business, a new endpoint, a new renderer, a new store adapter, any reader of TENANT_ID, seeding `portal` at provisioning time, and any change to the terms-of-service gate (D9).

## Technical Context
- **Origin decision (D1):** `app.1stcontact.io` was chosen because the identity layer (Access plus `admit`) is already there. `public-site` was rejected: it is GET-only, edge-cached and unauthenticated, so one cached copy would be everybody's answer. The origin is provisional. The pages are not: they are site content.
- **One renderer (D3):** `/account` goes through the same request-time preview renderer as `/preview/<slug>/draft/…`. The fallback is a real in-memory SiteStore, not a branch in the renderer. The renderer's store parameter was widened to the SiteStore port for this.
- **Host resolution (D2):** the host is the admitted user's own business row. With no admission it falls back to the request's scope. With neither, the answer is 404. Business-scope resolution is not consulted on the admitted path. Depends on REQ-178/REQ-179 reopening (B1), so that membership admits and the avatar is present even when nothing is selectable.
- **Behaviour module:** `account-portal` is a vetted module in the framework catalog under the same contract as `contact-form` (CAP-72 / CAP-70). It paints nothing. Its presentation is L1 in its slots, the identity and holdings lines are invariant elements its client fills, and the reveal/dismiss affordances are L1 `control` nodes. The REQ-180 §3 "no tenant wording" rule applies to it even though it lives outside the two apps.
- **Builds on:** CAP-114 admission (plan item 1: REQ-185's split of `platform_admin` and the AdmittedBusiness role), REQ-179's `/api/businesses` endpoint, and REQ-169's ToS gate, left as it was.

## Reconciliation Decisions
- **No "get in touch" link** (decided at reconciliation, 2026-11-01): REQ-183 D5 says the explanation ends "in a way to get in touch". The landed copy ends with "Ask us and we will do it" and has no contact link or `mailto:`, because this deployment routes no contact address. The overriding acceptance rule ("No copy on the surface claims anything the system does not do", DOC-37 §6.2) forbids a remedy that looks like it works when it does not. Reconciliation treats the acceptance list as governing over D5's wording. This is not flagged as a code issue. The AC requires the explanation to tell the person that closing is done by asking, and it forbids a contact channel that does not work. Adding a routed link later is an ordinary L1 edit.
- **Scope fallback when there is no admission** (decided at reconciliation, 2026-11-01): D2 names only the admission. The code falls back to the request's business scope when there is no admission, as in local or dev runs without Access, and answers 404 only when both are absent. REQ-183 "Behaviour that landed" explicitly specifies the 404-on-neither case, so the fallback is formalized with it.
- **Account line format** (decided at reconciliation, 2026-11-01): intent says only that an account with no display name is named by its verified email. The code shows "Name — email" when both exist, otherwise whichever exists. Formalized as written.
- **Holdings sentence form** (decided at reconciliation, 2026-11-01): D6 requires the businesses to be listed by name. The code renders "This account operates N business(es): A, B." and uses a business's id when it has no name. Formalized.
- **Draft channel serves the portal** (decided at reconciliation, 2026-11-01): intent is silent. The authored portal's draft is what is served, because the portal has no publish path yet. Formalized under the authored-portal AC.

## Dependencies
Plan item 1 (Accounts, Membership & Entitlement: scope and fulfilment gate, REQ-185).

## Story Points
3
