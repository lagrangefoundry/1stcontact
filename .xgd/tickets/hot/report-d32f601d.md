---
uid: report-d32f601d
id: REPORT-11055
type: report
title: 'Reconciliation Plan: free-coded (BUNDLE-38 — REQ-199/200/201/202/203, BUG-57,
  BUG-62)'
created_by: xgd
created_at: '2026-11-05T21:02:51.986952+00:00'
updated_at: '2026-11-07T08:23:44.878206+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-7988e925
  anchor_uid: bundle-7988e925
  items:
  - index: 1
    component: Material Library Surface
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: 'Extends existing story STORY-144 (story-1500b111). REQ-201 (commit
      9fdf31c8): the Library tab subscribes to a ticket change feed instead of redrawing
      only after its own writes. GET /api/material answers {material, seq} with the
      head read before the list; GET /api/material/changes is SSE with seq as the
      frame id, a leading ready frame carrying the opening cursor, Last-Event-ID preferred
      over ?since. Events carry a finished row projected through the same rowOf as
      the list, so the pane splices one row and leaves selection, rail-collapse and
      the detail''s scroll untouched. Description text (body is presence-only in the
      log) is re-read for the one open item only, and skipped while the description
      editor is in edit mode. The feed is scoped by the business handle only (no cross-tenant
      events). A business switch closes the feed before the re-read and reopens under
      the new scope. Tailer polls at 2s. Baseline schema gains ticket_changes and
      ticket_change_floor.'
    justification: STORY-144 covers the Library list, filters, detail and description
      correction but none of its 23 ACs say anything about updates written elsewhere
      (AI describeCapture / re-describe). Live update extends the same Library capability
      (capability-e9324eb7); no new capability bucket is introduced.
    story_uid: story-1500b111
    target_story_ids:
    - story-1500b111
    acceptance_criteria_changes:
      add:
      - A material write made outside the Library (e.g. the AI description landing)
        appears on the open tab without a reload, replacing only that row; selection,
        rail state and the detail's scroll on another row are unchanged
      - GET /api/material returns {material, seq} with the cursor read before the
        list, and GET /api/material/changes streams SSE frames whose id is the change
        seq, opening with a ready frame carrying the cursor and resuming from Last-Event-ID
        in preference to ?since
      - An event's row is indistinguishable from the same row in a re-read list; the
        description text is re-read only for the material whose detail is open, and
        not at all while its description editor is in edit mode
      - 'The change feed carries only the scoped business''s material: a write by
        a second business never reaches the subscription'
      - Baseline migration carries ticket_changes and ticket_change_floor as transcribed
        from the component's schema statements
      modify:
      - 'AC-1715: a business switch closes the change feed before the list is re-read
        and opens a new one under the new scope, so no row or event from the previous
        business survives even when the re-read fails'
      remove: []
    intent_delta_summary: The Library is no longer refresh-on-own-write; it is a live
      view over a business-scoped change subscription that splices single rows and
      preserves pane state.
  - index: 2
    component: Behavior Modules (account-chrome)
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: 'Extends existing story STORY-85 (behavior modules). REQ-200 (commit
      5e84dd5d): a new L2 behavior module, account-chrome, beside contact-form, bound
      to an L1 slot with a slot preset registered by behavior id. Gated in the module
      by site.config.capabilities.accounts (the renderer hands capabilities to every
      module). All three states (signed out, signed in with portal link, builder link)
      render into the static snapshot; the no-JS baseline is a working <form method=post>;
      script only subtracts. ''Check your email'' shows on request completion at any
      status so known and unknown addresses are indistinguishable. L1 controls gain
      the anchor tag (portal and builder are links).'
    justification: STORY-85 owns the behavior-module contract and its vetted module
      instances (contact-form, carousel). account-chrome is another instance under
      the same contract, catalog and conformance obligations, so it extends capability-ae9d65d6
      rather than opening a new bucket.
    story_uid: story-179b8c06
    target_story_ids:
    - story-179b8c06
    acceptance_criteria_changes:
      add:
      - A site declaring capabilities.accounts renders the account-chrome module into
        its L1 slot with all three states (signed out, signed in, builder) present
        in the published bytes; a site not declaring it renders none
      - Without script the signed-out control is a working POST form; the enhancement
        shows 'check your email' on completion whatever the response status, so a
        known and an unknown address are indistinguishable
      - account-chrome is registered in the behavior catalog with an L2 slot preset
        and meets the module conformance obligations
      - L1 controls accept an anchor tag so a module's portal and builder links are
        real links
      modify: []
      remove: []
    intent_delta_summary: 'The module catalog gains account-chrome: sign-in/portal/builder
      chrome placed and painted by L1, gated by a declared site capability.'
  - index: 3
    component: 'Site Delivery: Public Serving'
    item_type: upgrade
    story_points: 2
    dependencies:
    - 2
    description: 'Extends existing story STORY-95. REQ-200 (commit 5e84dd5d): APEX_BODY
      is gone; / and every path outside /site/ resolve against the apex site named
      by APEX_SITE_KEY (storage/sites/1stcontact is its authored front page; unset
      key 404s). public-site gains a read-only session reader (sessions + memberships,
      no writes, naming no site or business); a failed read is signed out; readSessionId
      refuses a cookie not issued for the request host. The Worker rewrites one attribute
      on the account-chrome root to name the current state (signed-out is the identity
      transform). Session-dependent responses carry private/no-store, vary: cookie,
      no etag and never read or write the shared edge cache; pages without the chrome
      keep bytes, etag and shared cacheability.'
    justification: STORY-95 owns public serving and explicitly holds the apex to a
      holding response (AC-913) and puts the apex site out of scope; REQ-200 deliberately
      changes that. Session-aware state and its cache policy are serving behaviour
      of the same capability-a12e557f; no new bucket.
    story_uid: story-d34eccd8
    target_story_ids:
    - story-d34eccd8
    acceptance_criteria_changes:
      add:
      - The apex and every path outside /site/ serve the site named by APEX_SITE_KEY,
        and answer not-found when it is unset or unpublished
      - A page carrying account-chrome is served naming the visitor's session state;
        a missing, unreadable or foreign-host cookie reads as signed out, and the
        reader writes nothing
      - A session-dependent response is private, no-store, varies on cookie, carries
        no etag and is never stored in or answered from the shared cache; a page without
        the chrome is byte-identical to before and stays shared-cacheable
      modify: []
      remove:
      - AC-913
    intent_delta_summary: The apex now serves an authored site, and published pages
      that carry account chrome become session-aware with a private cache policy.
  - index: 4
    component: 'Contacts: Add, Invite & Send'
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: 'Extends existing stories STORY-146 (invite) and STORY-165 (pipeline
      axis). REQ-199 (commit 73302982): adding and inviting are two acts. POST /api/people/add
      (addContact) creates a Lead and sends nothing; POST /api/people/invite (invitePeople)
      moves existing selected contacts Lead -> Invited and mails them; GET /api/people/invite
      answers the modal''s prefill. In the Contacts tab Invite acts on a checked selection
      and is disabled with none checked; the modal shows From display-only, prefills
      Subject and Body from the business''s invite template, labels recipients To-List
      and sends one message per recipient. Edits apply to this send only and never
      write the template; a body missing the template''s declared {{cta_url}} is refused.
      Each message goes to the contact''s primary address; a contact with none is
      refused by name while the rest send. Both sent and failed outcomes move the
      pipeline; an address-less refusal does not. invites.ts composes templates, mail
      port, message record and transition with the mail port injected.'
    justification: STORY-146 owns the invite as an owner-gated transition and currently
      pins 'the dialog states no message is sent' (AC-2175) and insert-or-update invite
      (AC-2169); STORY-168 explicitly defers composing render+send to 'the later invite
      flow (REQ-199)'. STORY-165 owns the invite's effect on the pipeline. This changes
      existing invite behaviour in capability-e5939ceb, so it is an upgrade, not a
      new bucket.
    story_uid: story-7b1025b8
    target_story_ids:
    - story-7b1025b8
    - story-0ea74f39
    acceptance_criteria_changes:
      add:
      - Adding a contact creates a Lead and sends nothing; there is no flag on either
        route selecting the other's behaviour
      - Invite is enabled only with a checked selection, prefills subject and body
        from the business's invite template with From read-only, and sends one message
        per recipient so no recipient sees another's address
      - Edits in the invite modal apply to that send only and never change the template;
        a body that has dropped the declared {{cta_url}} is refused before anything
        is sent
      - Each invite goes to the contact's primary address; a contact without one is
        refused by name while the rest of the selection still sends, and the result
        reports each send
      modify:
      - 'AC-2169: invite acts only on existing contacts of the business; creating
        a contact is the separate add act'
      - 'AC-2172: owner-only gating applies to both the add and the invite routes'
      - 'AC-2205 (STORY-165): a sent or provider-failed invite moves the contact to
        Invited, a contact refused for having no address is not moved, and re-inviting
        keeps the original invite time'
      remove:
      - AC-2175
    intent_delta_summary: 'Invite no longer creates contacts and no longer sends nothing:
      add creates a Lead silently, invite mails a selected set through the business
      template and reports each send.'
  - index: 5
    component: Admission & Onboarding
    item_type: upgrade
    story_points: 2
    dependencies:
    - 4
    description: 'Extends existing stories STORY-146 (admission) and STORY-161 (terms
      gate). REQ-203 (commit cc38e067): admit admits a contact who holds nothing when
      they have not signed up and their account owns no business (withdrawn/lost memberships
      still refuse); the admission opens no route — guardTerms refuses everything
      but the interstitial. Accepting the terms for such an admission provisions the
      account''s own business (ensureOwnBusiness over provisionBusiness, named after
      the person or a provisional placeholder, open-ended grant, idempotent on tenants.owner_account_id)
      before stamping, so a failed write leaves the person able to retry; an operator
      re-accepting bumped terms is not provisioned. Accepting from /terms goes to
      the builder root. BUG-62 (commit 82f28300): the refusal reads ''1st Contact
      cannot open this for you at the moment'' for every reason and the scope refusal,
      naming no reason; admit logs the reason once where it decides, including platformAdminSeed,
      and denied() only renders.'
    justification: 'STORY-146 pins ''an invited person holding no business is refused
      as no_membership'' (AC-2173), which REQ-203 explicitly supersedes, and owns
      refusal byte-identity and reason logging (AC-1758, AC-1759) which BUG-62 corrects.
      STORY-161 owns acceptance. Both are existing behaviour in capability-e5939ceb
      / capability-3606e35b; no new bucket. STORY-162''s ''no self-serve add-a-business''
      is not contradicted: this provisions only an account''s first business, with
      no control.'
    story_uid: story-7b1025b8
    target_story_ids:
    - story-7b1025b8
    - story-0cd18650
    acceptance_criteria_changes:
      add:
      - A contact who has not signed up and whose account owns no business is admitted
        with no businesses and reaches only the terms interstitial; a withdrawn or
        lost membership on an account that owns a business is still refused
      - 'STORY-161: accepting the terms for an admission holding nothing provisions
        the account''s own business before recording acceptance, idempotently, and
        a failed provisioning records no acceptance; re-accepting with a business
        already owned provisions nothing'
      - 'STORY-161: accepting from /terms itself goes to the builder root'
      modify:
      - 'AC-1758: every refusal, including the scope refusal, reads ''1st Contact
        cannot open this for you at the moment'', claims nothing ended and names no
        reason'
      - 'AC-1759: the reason is logged once at the point admission decides, with whether
        the platform-admin seed applied, independent of which caller renders the refusal'
      remove:
      - AC-2173
    intent_delta_summary: 'An invited contact is no longer refused at the door: they
      are admitted to the terms gate and accepting provisions their first business;
      refusals become truthful and are logged where decided.'
  - index: 6
    component: Passwordless Sign-In & Sessions
    item_type: feature
    story_points: 3
    dependencies:
    - 2
    - 4
    - 5
    description: 'REQ-202 (commits dd8f4a07, 7f6e01af): the control app consumes auth-passwordless.
      sessions.ts answers its three ports, resolving a subject within the one tenant
      resolved from the request host. sign-in.ts serves GET/POST /sign-in (request
      a link), GET/POST /sign-in/<token> (redeem on POST only, never GET, because
      mail scanners fetch links), POST /sign-out. These four routes are matched ahead
      of the Access gate and a session cookie is tried ahead of the Access JWT, which
      remains a second producer. The invite''s ctaUrl becomes a per-contact redeemable
      30-day token minted in the inviting business. Withdrawing a person''s login
      ends every session they hold. Baseline schema gains the component''s tables
      (login_tokens, sessions) with a UAT comparing it to SCHEMA_STATEMENTS. ACCESS.md
      records the Bypass policy needed for the deployed invite.'
    justification: 'No story covers customer sign-in: STORY-146 lists ''sign-in for
      a member of a customer''s business (level-2 login)'' out of scope and STORY-120
      puts ''customer sign-in to a tenant''s own builder'' out of scope. Magic-link
      issue/redeem/sessions is a genuinely new capability.'
    story_uid: story-e0ca0a36
  - index: 7
    component: Platform Smoke Check
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: 'Extends existing story STORY-119. BUG-57 (commit 590d4a70): bin/smoke
      drops --draft and the five checks addressing the deleted /site/<slug>/draft/<sha>/
      channel. Their value moves to the published channel, gated on the site key:
      asset crawl (one level into CSS), published cache policy pinned against the
      Worker''s own PUBLISHED_CACHE, index really HTML, miss 404s rather than listing.
      --slug becomes --site-key (no alias; unknown args error). --control-origin defaults
      to https://app.1stcontact.io when --origin is that apex (not generalised to
      app.<host>); --workers-dev-origin stays explicit. No check can only ever skip:
      with every input supplied nothing skips, and each skip names the one argument
      that would run it.'
    justification: STORY-119 already owns the smoke check (AC-1336/1337/1338/1339/1425);
      this corrects which channel it checks and its argument names. Same capability-5d07b533,
      no new bucket.
    story_uid: null
    target_story_ids:
    - story-d5167ced
    acceptance_criteria_changes:
      add:
      - The published channel's cache policy is asserted equal to the Worker's own
        published cache value
      - --control-origin defaults to the control app when --origin is the 1stcontact
        apex, and no other origin derives a control origin
      modify:
      - 'AC-1339: the asset crawl runs against a published site addressed by --site-key,
        not a draft preview, still following one level into stylesheets'
      - 'AC-1338 / AC-1336: every check is runnable — supplying every input leaves
        nothing skipped — and each skip names the single argument that would run it;
        --slug and --draft no longer exist'
      remove: []
    intent_delta_summary: Smoke checks target the only channel that exists (published,
      by site key), with nothing left that can only skip.
---

# Reconciliation Plan

**Mode**: commits
**Source**: free-coded commits on BUNDLE-38 (REQ-201, REQ-200, REQ-199, BUG-57, BUG-62, REQ-203, REQ-202)

## Behavior Inventory

```yaml
behavior_inventory:
  source: "commits 9fdf31c8 .. 7f6e01af"
  features:
    - name: Library live updates (REQ-201, 9fdf31c8)
      entry_files: [apps/control-app/src/material.ts, router.ts, tickets.ts, builder/library.js, builder/api.js]
      behaviors: [GET /api/material -> {material, seq}, SSE /api/material/changes with ready frame + Last-Event-ID resume, single-row splice preserving selection/rail/scroll, open-item body re-read skipped in edit mode, tenant-scoped feed, switch closes feed before re-read, 2s tailer, baseline ticket_changes/ticket_change_floor]
    - name: account-chrome module + session-aware apex (REQ-200, 5e84dd5d)
      entry_files: [packages/framework/src/modules/account-chrome/*, l2/account-chrome.ts, apps/public-site/src/index.ts, session.ts, routes.ts]
      behaviors: [capabilities.accounts gate, three states in snapshot, no-JS POST form, indistinguishable check-your-email, anchor tag control, APEX_SITE_KEY apex, read-only session reader with host-bound cookie, private/no-store/vary cookie/no etag/no shared cache]
    - name: Contacts add vs invite (REQ-199, 73302982)
      entry_files: [apps/control-app/src/invites.ts, people.ts, router.ts, builder/people.js, templates.ts, mail.ts]
      behaviors: [POST /api/people/add, GET/POST /api/people/invite, selection-gated invite, template prefill, per-recipient send, cta_url refusal, primary address, per-contact refusal, sent+failed move pipeline]
    - name: Smoke checks (BUG-57, 590d4a70)
      entry_files: [tools/generate/bin/smoke.mjs, bin/smoke]
      behaviors: [draft checks removed, published asset/cache/index/404 checks, --site-key, control-origin default, no only-skip checks]
    - name: Truthful denial (BUG-62, 82f28300)
      entry_files: [apps/control-app/src/identity.ts, index.ts]
      behaviors: [new DENIED_MESSAGE, reason logged in admit with platformAdminSeed]
    - name: Signup provisions business (REQ-203, cc38e067)
      entry_files: [apps/control-app/src/identity.ts, onboarding.ts, terms.ts]
      behaviors: [admit holding-nothing contact, provision-before-stamp on accept, idempotent ensureOwnBusiness, /terms accept -> builder root]
    - name: Passwordless sign-in (REQ-202, dd8f4a07 + 7f6e01af)
      entry_files: [apps/control-app/src/sessions.ts, sign-in.ts, index.ts, invites.ts, people.ts, db/migrations/0001_baseline.sql]
      behaviors: [/sign-in issue, /sign-in/<token> redeem on POST, /sign-out, routes ahead of Access, cookie before JWT, host-scoped subject resolution, token invite links, withdraw ends sessions, schema transcription]
```

## Coverage Map

```yaml
coverage_map:
  - feature: Library live updates
    status: partial
    existing_stories: [STORY-144]
    gaps: [no AC for writes made outside the Library, SSE contract, scope of feed]
  - feature: account-chrome module
    status: partial
    existing_stories: [STORY-85]
    gaps: [module instance not in catalog ACs]
  - feature: session-aware apex serving
    status: partial (contradicted)
    existing_stories: [STORY-95]
    existing_acs: [AC-913 apex holding response — superseded]
  - feature: Contacts add vs invite + send
    status: partial (contradicted)
    existing_stories: [STORY-146, STORY-165, STORY-168]
    existing_acs: [AC-2175 no message sent — superseded, AC-2169, AC-2172, AC-2205]
    notes: [STORY-168 defers the render+send composition to REQ-199]
  - feature: Admission of invited contact, provisioning on accept, truthful denial
    status: partial (contradicted)
    existing_stories: [STORY-146, STORY-161]
    existing_acs: [AC-2173 superseded, AC-1758, AC-1759]
  - feature: Passwordless sign-in
    status: uncovered
    notes: [STORY-146 and STORY-120 list customer sign-in out of scope]
  - feature: Smoke checks
    status: partial
    existing_stories: [STORY-119]
    existing_acs: [AC-1336, AC-1338, AC-1339, AC-1425]
```

## Plan Items

| # | Component | Type | Points | Deps | Description |
|---|-----------|------|--------|------|-------------|
| 1 | Material Library Surface | upgrade STORY-144 | 3 | - | Live updates via change subscription (REQ-201) |
| 2 | Behavior Modules | upgrade STORY-85 | 2 | - | account-chrome L2 module (REQ-200) |
| 3 | Site Delivery | upgrade STORY-95 | 2 | 2 | Apex from APEX_SITE_KEY, session-aware private responses (REQ-200); supersedes AC-913 |
| 4 | Contacts | upgrade STORY-146, STORY-165 | 3 | - | Add vs invite, selection invite with per-recipient send (REQ-199); supersedes AC-2175 |
| 5 | Admission & Onboarding | upgrade STORY-146, STORY-161 | 2 | 4 | Invited contact admitted to terms and provisioned on accept (REQ-203); truthful logged denial (BUG-62); supersedes AC-2173 |
| 6 | Passwordless Sign-In | feature | 3 | 2,4,5 | Magic-link issue/redeem/sign-out, sessions, token invites (REQ-202) |
| 7 | Platform Smoke | upgrade STORY-119 | 2 | - | Published-channel checks, --site-key, no only-skip checks (BUG-57) |

## Observations

- Version-bump commits (03b5b2f5, 2dc94794, 9ce4967d, fa1e5272, e2ad5ab8) carry no behaviour and need no item.
- 7f6e01af is comment-only (scope name removed from prose to satisfy AC960); folded into item 6 as evidence, no AC change.
- Items 4 and 5 both modify STORY-146, so 5 depends on 4 to serialise edits on that story. Item 6 depends on 4 (invite link becomes a token) and 2 (the account-chrome Sign In control finally has an endpoint).
- REQ-203 vs STORY-162 ('only the operator adds a business'): not treated as a contradiction. STORY-162 rules out a self-serve add-another-business control; REQ-203 provisions only an account's first business, with no control. Flagged for the story cycle to confirm.
- AC-2079 and AC-2078 on STORY-146 are already recorded as superseded (BUNDLE-36), so they are not listed again.
- REQ-202 notes non-code operator steps (installing auth-passwordless into the shared store; Access Bypass policy in ACCESS.md); REQ-200 notes publishing 1stcontact and setting APEX_SITE_KEY. These are deployment facts, not ACs.
- Commit 7f6e01af mentions three pre-existing red suites (ledger-core.ts, BUG-42, REQ-199); out of scope for this plan.
- The FC test list given to this run was empty, but the commits add test_UAT_FC_REQ-199/200/201/202/203 and BUG-57/62 files; every one maps to an item above (199->4, 200->2/3, 201->1, 202->6, 203->5, BUG-57->7, BUG-62->5).
- Semantic `ticket search` could not run in this sandbox (embedding cache write and model download denied); reuse was established by reading the full story list and the candidate stories' bodies and ACs.