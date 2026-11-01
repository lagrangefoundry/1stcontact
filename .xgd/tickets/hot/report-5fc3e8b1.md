---
uid: report-5fc3e8b1
id: REPORT-7522
type: report
title: 'Reconciliation Plan: free-coded (BUNDLE-35 — BUG-48, REQ-171, REQ-168, REQ-179,
  REQ-169, REQ-180, BUG-50, REQ-181, REQ-184, REQ-224, REQ-225)'
created_by: xgd
created_at: '2026-11-01T09:01:34.043680+00:00'
updated_at: '2026-11-01T11:57:58.789749+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-94dbe947
  anchor_uid: bundle-94dbe947
  items:
  - index: 1
    component: System Knowledge Base — shipping gate
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: 'Extends existing story story-c4f329d3 (STORY-117). BUG-48 (f00bf26):
      `1c assets` resolves the bundle''s corpus through the same predicate buildIndex
      uses and refuses — before writing anything — when any resolved document is missing
      from the document-index or chunk manifest, or present there under a different
      (stale) version; the awareness map is exempt only because resolveCorpus excludes
      it, and `1c assets` names every exemption it applied. `bin/kb-release` runs
      export → index → map → assets as one command. kbBundle now stamps document versions
      to the second, matching the index, so a non-whole-second mtime no longer reads
      as skew. FC evidence: tests/test_UAT_FC_BUG-48_corpus_and_index_agree.test.ts.'
    justification: STORY-117 owns the build/pack pipeline and already names 'the corpus
      quietly ends up smaller than intended' as its failure mode, but its packing
      criteria say nothing about corpus/manifest agreement, staleness-as-skew, named
      exemptions, the release command, or the second-resolution stamp. Same capability
      bucket (capability-45acba5e) — no new bucket introduced.
    story_uid: story-c4f329d3
    target_story_ids:
    - story-c4f329d3
    acceptance_criteria_changes:
      add:
      - Packing refuses (non-zero, nothing written) when a document the corpus predicate
        resolves is absent from either the document index manifest or the chunk manifest,
        naming each missing document
      - A document present in a manifest under an older version than the corpus file
        counts as skew and is refused the same way
      - The awareness map is held out of the agreement check because the corpus resolver
        excludes it, and the packing step reports every document it exempted
      - One release command runs export, index, map and packing in the fixed order
        and stops at the first failing step
      - Document versions in the packed bundle and in the index are stamped at the
        same (whole-second) resolution, so an unchanged file never reads as skewed
      modify: []
      remove: []
    intent_delta_summary: 'Packing the KB becomes a gate: the shipped bundle''s corpus
      and both index manifests must agree document-for-document and version-for-version,
      or nothing ships; exemptions are visible; a one-command release path exists;
      version stamping is unified to seconds.'
  - index: 2
    component: Projected Reference — L1 vocabulary covers the page
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: 'Extends existing story story-5836022a (STORY-137). BUG-48 (f00bf26):
      projectL1Vocabulary now projects l1DocumentSchema (all five top-level document
      keys) and the shapes those keys reach; the limits section carries L1_STRUCTURAL_RULES
      — the nine non-numeric refusals stated as the validator''s own messages with
      the projected sentence lifted from each entry''s doc comment (validator messages
      rewritten but keep the phrases existing readers match on); l1VocabularyGaps
      derives, at check time, each part of the declared source and the section that
      should render it, and reports any part the reference omits. FC evidence: tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts.'
    justification: STORY-137 owns the three generated references and the 'one source,
      rendered or lifted' discipline, but covers only the element union and numeric
      envelope of L1; the document shape, structural refusals and the self-check for
      coverage of its own source are absent. Same capability bucket (capability-45acba5e)
      — no new bucket.
    story_uid: story-5836022a
    target_story_ids:
    - story-5836022a
    acceptance_criteria_changes:
      add:
      - The layout-vocabulary reference documents the page document itself — every
        top-level document key and the shapes those keys reach — not only the element
        kinds
      - The limits section lists every structural (non-numeric) refusal the validator
        makes, in the validator's own message text, beside the numeric bounds
      - A coverage check derived from the schema source at check time reports any
        part of the declared source the reference does not render, and the shipped
        reference has none
      modify: []
      remove: []
    intent_delta_summary: 'The L1 reference must be complete against its own source:
      document shape plus structural rules, with a derived (not hand-listed) gap check
      proving it.'
  - index: 3
    component: AI Site Assistant — session texts and the chat ledger
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: 'Extends existing story story-a58a0974 (STORY-103). REQ-171 (merge
      8ea7801): the session''s texts are restructured into product level (role-independent
      constant composed into every role''s system prompt), role level (short purpose
      naming the documents to read) and a per-turn reminder of a few lines whose per-turn
      signals (corpus delta, draft-change) are marked as the deliberate exception;
      priming carries the summary-level manual projected against the session''s grant
      with DescribeTools reachable for detail; and a purpose-built ledger surface
      (ledger-surface.json / ledger-core.ts / ledger.ts) lets the consultant write
      the chat ticket''s body (the ledger) and a retrieval-oriented title instead
      of the session id, maintained on a stated trigger. FC evidence: tests/test_UAT_FC_REQ-171_session_texts.test.ts,
      tests/test_UAT_FC_REQ-171_ledger.workers.test.ts.'
    justification: STORY-103 owns who the assistant is told it is, the conversation-as-chat-ticket,
      and explicitly reserves the ticket body 'for a summary REQ-171 owns'. This bundle
      fills that reserved slot and reshapes the texts STORY-103 already describes
      — it extends the conversation capability (capability-7e4714b7) rather than creating
      a new bucket.
    story_uid: story-a58a0974
    target_story_ids:
    - story-a58a0974
    acceptance_criteria_changes:
      add:
      - The session's texts are organised as product level, role level and reminder,
        each piece of material appearing in exactly one; product-level material is
        role-independent
      - Priming carries the grant-projected summary manual, never a capability the
        session was not granted, and the full entry of a named tool is one DescribeTools
        call away
      - The per-turn reminder is a handful of lines that reference the rules of interaction
        rather than restating them, with its per-turn signals marked as the exception
      - The consultant can write the conversation's ledger into the chat ticket's
        body and give the ticket a retrieval-oriented title, through a dedicated ledger
        operation that can touch only this conversation's ticket
      - The ledger is maintained on a stated trigger
      modify:
      - 'The criterion/description text stating the chat ticket body is ''left for
        a summary something else writes'' is restated: the body is the ledger, written
        through the ledger operation'
      remove: []
    intent_delta_summary: Session priming becomes a three-part structure with no duplicated
      doctrine, uses the summary manual, and the chat ticket gains a consultant-maintained
      ledger body and title.
  - index: 4
    component: Accounts, Membership & Entitlement — admission after DOC-42
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: 'Extends existing story story-7b1025b8 (STORY-146). REQ-224/REQ-225
      (REQ-178 stragglers fa0b857, a9f1021, cd6002e): `admit` refuses only no_membership;
      a person whose every grant has lapsed is admitted with nothing selectable. REQ-180
      §1/D4 (7b17517): each unselectable business carries a lapse reason — expired
      (with the date access ended, latest grant wins), revoked, not_yet, never_granted
      — computed from the same answer as `selectable` and only for businesses with
      a live membership. REQ-184 (merge 9d4fe11, migration 0006): entitlements carry
      business_id (the object) and a nullable account_id (the subject); selectability
      reads only per-business capacity grants (account_id IS NULL), so an account-subject
      grant yields never_granted. REQ-169 (f205968): the ''reaches the builder'' outcome
      now requires accepting current terms. FC evidence: tests/test_UAT_FC_REQ-167_identity.workers.test.ts,
      tests/test_UAT_FC_REQ-178_businesses.workers.test.ts, tests/test_UAT_FC_REQ-180_lapse_reason.workers.test.ts,
      tests/test_UAT_FC_REQ-184_entitlement_subject.workers.test.ts.'
    justification: STORY-146 is the admission/grant story and its own Reconciliation
      Decisions record that AC-1750 is known-superseded by exactly these amendment
      commits and must be upgraded when they reconcile (Case 2, explicit supersession).
      Lapse reasons and the entitlement subject refine the same grant model. Same
      capability bucket (capability-e5939ceb).
    story_uid: story-7b1025b8
    target_story_ids:
    - story-7b1025b8
    acceptance_criteria_changes:
      add:
      - A person whose every business has lapsed is admitted, with every business
        present and none selectable (replaces AC-1750's account-level refusal)
      - 'Each unselectable business carries why: expired with the date access ended
        (latest grant wins for a renewed grant), revoked, not_yet, or never_granted;
        selectable and lapse are derived from one answer and cannot disagree'
      - A lapse reason is only ever computed for a business on which the caller holds
        a live membership
      - An entitlement names its business as object and optionally an account as subject;
        grants written by invite and business provisioning name no account
      - 'Only per-business capacity grants decide selectability: a grant naming an
        account against a business does not make that business selectable, and it
        reports never_granted'
      modify:
      - 'acceptance_criterion-c6bc805e (AC-2076): a lapsed / not-started / revoked
        business stays listed and unselectable, and carries its lapse reason; the
        person is admitted whether or not any other business is entitled'
      - 'acceptance_criterion-4c1d0046 (AC-1760): an invited and entitled person who
        has accepted the current terms reaches the builder'
      remove:
      - acceptance_criterion-5968d5c2
    intent_delta_summary: 'Membership admits and entitlement does not: refusal on
      lapsed grants moves from the person to the business (handled by business scope,
      item 5); lapses explain themselves; entitlement subject/object are split; reaching
      the builder now passes the terms gate too. AC-1750 superseded per STORY-146''s
      own recorded decision and REQ-178''s DOC-42 amendment.'
  - index: 5
    component: Business Scope — which business a request operates
    item_type: feature
    story_points: 3
    dependencies:
    - 4
    description: 'REQ-168 (merge 9af6bdf, migration 0005) plus the REQ-178 straggler
      router/resolver change (fa0b857). New scope.ts: resolveScope(env, identity,
      requestedBusinessId?) returns one business — the /b/<id>/ target if the caller
      holds a live, entitled membership on it, else refused; no target resolves to
      the first admissible business; platform_admin may enter a business without a
      membership but not one whose entitlement has lapsed; dev-open (isUnconfiguredLocalDev)
      resolves to TENANT_ID and ignores any target. Every store opener (site store,
      ticket store, project-KB index prefix, AI worker host) takes the scope; nothing
      outside the resolver and identity.ts reads env.TENANT_ID; openers refuse an
      empty scope under a non-configuration error. Preview assets resolve to the business
      of the referring page; two businesses in one isolate get separate chat hosts;
      deactivated businesses are absent from the admissible set; the 1stcontact business
      survives an idempotent migration. With nothing selectable, resolveScope answers
      null; route() keeps answering the chrome and /api/businesses and requireScope()
      turns business-scoped routes into a 403 with its own message, logged as no_entitlement.
      FC evidence: tests/test_UAT_FC_REQ-168_scope.workers.test.ts, tests/test_UAT_FC_REQ-168_single_reader.test.ts,
      tests/test_UAT_FC_REQ-178_lapsed_session.workers.test.ts.'
    justification: 'STORY-146 explicitly puts ''which business is selected and where
      a returning operator lands (REQ-168)'' out of scope, and STORY-121 only guarantees
      that a handle obtained for an account is confined to it — no story states how
      the business is derived from the identity per request. This is the tenant-isolation
      capability for onboarding; genuinely new. Capability: capability-e5939ceb.'
    story_uid: story-7102ffe3
  - index: 6
    component: Terms of Service Gate
    item_type: feature
    story_points: 2
    dependencies:
    - 4
    description: 'REQ-169 (f205968, fe95f12): terms.ts holds a version constant (date
      string) and text constant (lorem ipsum). After admission and before scope resolution,
      a person whose tos_version does not equal the constant is served the terms +
      accept control at the requested URL for navigations; assets, module scripts
      and API routes are refused 403 plain text; responses are non-cacheable and non-indexable.
      POST /api/terms/accept requires application/json (else 415, row untouched) and
      stamps tos_version and tos_accepted_at; acceptance reloads the same URL which
      now answers normally. Bumping the constant re-prompts already-accepted people.
      GET /terms stays readable for any admitted caller, showing the acceptance date
      once accepted. No decline control. The dev-open branch skips the check. FC evidence:
      tests/test_UAT_FC_REQ-169_terms.workers.test.ts.'
    justification: No story covers terms acceptance; the columns existed (REQ-167)
      but nothing read or wrote them. New user-visible gate in capability-e5939ceb.
    story_uid: story-0cd18650
  - index: 7
    component: Builder Workspace — business switcher and account in shell chrome
    item_type: upgrade
    story_points: 3
    dependencies:
    - 4
    - 5
    description: 'Extends existing story story-e674c60a (STORY-99). REQ-179 (6d25bf2,
      merge 8e5e12f/5bace72): the site selector leaves the site tab''s toolbar (siteSelectorAction
      deleted) and becomes a business switcher in the shell header, with the account
      behind an avatar on the right and a uniformly business-scoped tab strip. GET
      /api/businesses returns the account and its admissible businesses from the already-computed
      admission, lapsed ones included and marked. api.js prefixes every URL with the
      selected business (/b/<id>/); selectBusiness is the single place a scope moves
      (prefix, stored selection, pane site + frame, assistant session, Library). With
      nothing selectable the switcher renders disabled listing every business marked,
      tabs and panels are inert but the avatar/account stays usable, a banner names
      the state, and no site list is requested. REQ-180 §1/§3 (7b17517): the account
      surface states each lapse reason in words beside its business (switcher keeps
      a suffix); no user-facing string in the builder client or public site says ''tenant''.
      FC evidence: tests/test_UAT_FC_REQ-179_business_scope_chrome.test.ts, tests/test_UAT_FC_REQ-179_businesses_endpoint.workers.test.ts,
      tests/test_UAT_FC_REQ-180_account_surface.test.ts, tests/test_UAT_FC_REQ-180_business_vocabulary.test.ts
      (word rule).'
    justification: STORY-99 owns the workspace chrome and today describes a site selector
      in the toolbar choosing one site; this changes where and what is selected rather
      than adding a new surface. Same capability bucket (capability-a994b8f3) — no
      parallel chrome.
    story_uid: story-e674c60a
    target_story_ids:
    - story-e674c60a
    acceptance_criteria_changes:
      add:
      - The shell header carries a business switcher and an account avatar; no tab's
        toolbar offers a site selector, and every tab is scoped to the selected business
      - GET /api/businesses answers the account and every admissible business in one
        call, lapsed businesses included and marked unselectable
      - Switching business moves every subsequent request, the open site and frame,
        the assistant session and the Library to that business
      - With no selectable business the switcher is shown disabled with every business
        marked, tabs and panels are inert, the account remains reachable, a banner
        names the state, and no site list is requested
      - The account surface states each unselectable business's lapse reason in words
      - No user-facing text in the builder or public site uses the word 'tenant'
      modify:
      - Any existing STORY-99 criterion asserting the site selector lives in the site
        tab's toolbar / that panels read the site via the toolbar is restated against
        the shell-level business switcher
      remove: []
    intent_delta_summary: Scope selection moves from a site-tab toolbar control to
      shell chrome selecting a business, backed by /api/businesses, with explicit
      behaviour for lapsed and nothing-selectable accounts and the Business vocabulary
      rule on screen.
  - index: 8
    component: Business Fulfilment — only the operator adds a business
    item_type: feature
    story_points: 2
    dependencies:
    - 4
    description: 'REQ-180 D2/D3 (7b17517) and amendments A1/A3 (dfb55c6, 89fae47):
      POST /api/admin/businesses, behind platform_admin and answering 404 to everyone
      else, calls provisionBusiness and nothing else; a business and its tenant are
      created as one operation (all four rows, verified through admit). There is no
      self-serve ''add a business''. The gate is stated as product fulfilment (the
      caller owns the business whose product is businesses), and platform_admin has
      exactly two readers — scope entry (item 5) and this fulfilment gate — with no
      isAdmin/requireAdmin-shaped predicate anywhere; nothing outside those readers
      names or tests for ''the platform''s tenant'' (platformTenant, isPlatform, or
      comparing a business id against the deployment slug). FC evidence: tests/test_UAT_FC_REQ-180_admin_adds_a_business.workers.test.ts,
      tests/test_UAT_FC_REQ-180_fulfilment_gate.test.ts, tests/test_UAT_FC_REQ-180_business_vocabulary.test.ts
      (concept rule).'
    justification: STORY-146 explicitly excludes 'any operator console or CLI for
      issuing invites or creating businesses'; no story covers a route that creates
      a business or the constraints on privileged reads. New capability in capability-e5939ceb.
    story_uid: story-387c9dfe
  - index: 9
    component: Library — badge the exception
    item_type: upgrade
    story_points: 2
    dependencies:
    - 7
    description: 'Extends existing story story-1500b111 (STORY-144). REQ-181 (merge
      96744d7): under one site per business the ''on this site'' placement pill and
      its accent are dropped; a row reads icon · title · role pill, and only the exceptional
      state (a site-role material not placed) is badged; the ''used on this site''
      filter and per-site re-decision on site switch go with it, since switching site
      now switches business and the whole list. material.ts/router.ts/api.js/app.js
      adjusted accordingly. FC evidence: tests/test_UAT_FC_REQ-181_library_badges_the_exception.test.ts
      (plus adjusted BUG-47/REQ-161/REQ-176 library UATs).'
    justification: STORY-144 owns the Library and currently specifies the tenant-wide
      list with 'on this site' as a badge and filter; REQ-181 explicitly changes that
      rule. Same capability bucket (capability-e9324eb7).
    story_uid: null
    target_story_ids:
    - story-1500b111
    acceptance_criteria_changes:
      add:
      - A placed site asset carries no placement badge; only a site-role material
        that has not been placed is marked as the exception
      - A row reads type icon, title, then role pill
      modify:
      - Criteria asserting the 'on this site' badge, its accent and the 'used on this
        site' filter, and that switching the open site re-decides them, are restated
        for one site per business (switching site switches business and the list)
      remove: []
    intent_delta_summary: The Library stops badging the normal case and badges only
      the unplaced site asset; site-switch semantics follow the business switcher.
  - index: 10
    component: 1c CLI — builder dev server env layering
    item_type: upgrade
    story_points: 1
    dependencies: []
    description: 'Extends existing story story-e15a19ef (STORY-79). BUG-50 (merge
      42c983d): a single definition (tools/generate/src/cli/dev-env.ts) composes `wrangler
      dev --env-file .dev.vars --env-file ${ONECONTACT_SECRETS:-~/Documents/secrets/1c.dev.env}`;
      `1c builder` uses it and the root `dev:control` script delegates to it, so both
      start the server with the same environment and the API key is loaded either
      way. FC evidence: tests/test_UAT_FC_BUG-50_builder_env_files.test.ts.'
    justification: STORY-79 owns 1c CLI argument composition and already states `1c
      builder` starts `wrangler dev`; this fixes what that command passes. Same capability
      bucket (capability-aa030c83).
    story_uid: null
    target_story_ids:
    - story-e15a19ef
    acceptance_criteria_changes:
      add:
      - '`1c builder` and the package dev script start wrangler dev with the same
        env-file layering — project .dev.vars then the secrets file (ONECONTACT_SECRETS
        or the default path) — from one shared definition'
      modify: []
      remove: []
    intent_delta_summary: One definition of the dev server's environment layering,
      used by both entry points, so the secrets file (and API key) is always loaded.
---

# Reconciliation Plan

**Mode**: commits
**Source**: free-coded commits of BUNDLE-35 (BUG-48, REQ-171, REQ-168, REQ-179, REQ-169, REQ-180, BUG-50, REQ-181, REQ-184, REQ-224, REQ-225)

## Behavior Inventory

```yaml
behavior_inventory:
  source: commits (19 SHAs; version-bump-only commits 4b2ba3e, 2598245, 48054a6, 89fae47 carry no behaviour)
  features:
    - name: KB packing gate (BUG-48)
      entry_point: tools/generate/src/cli/assets.ts, kb.ts, bin/kb-release
      behaviors: [refuse skewed/stale bundle before writing, awareness map exempt via resolveCorpus and named, one-command release, second-resolution version stamps]
    - name: L1 reference completeness (BUG-48)
      entry_point: tools/generate/src/cli/kb-projection.ts, packages/site-schema/src/l1/validate.ts
      behaviors: [projects l1DocumentSchema and reached shapes, L1_STRUCTURAL_RULES in limits, derived l1VocabularyGaps]
    - name: Session texts + chat ledger (REQ-171)
      entry_point: tools/generate/src/cli/ai/roles.ts, host-core.ts, ledger-core.ts, ledger-surface.json, apps/control-app/src/ledger.ts
      behaviors: [product/role/reminder split, summary manual + DescribeTools, ledger body + title on chat ticket]
    - name: Business scope (REQ-168, REQ-178 stragglers)
      entry_point: apps/control-app/src/scope.ts, index.ts, router.ts, store.ts, tickets.ts, knowledge.ts, ai.ts, db/migrations/0005
      behaviors: [/b/<id>/ target, first admissible default, membership refusal, platform_admin entry, dev-open TENANT_ID, single TENANT_ID reader, null scope -> NoBusinessError 403]
    - name: Admission after DOC-42 (REQ-178 amend, REQ-180 §1, REQ-184)
      entry_point: apps/control-app/src/identity.ts, db/migrations/0006
      behaviors: [membership admits, lapse reasons, business_id/account_id split, capacity-grant-only selectability]
    - name: Terms gate (REQ-169)
      entry_point: apps/control-app/src/terms.ts
      behaviors: [version mismatch -> interstitial at URL / 403 for non-navigation, JSON-only accept, re-prompt on bump, GET /terms]
    - name: Business switcher chrome (REQ-179, REQ-180 §1/§3)
      entry_point: builder/business.js, app.js, api.js, router.ts GET /api/businesses
      behaviors: [header switcher + avatar, URL prefix, selectBusiness, nothing-selectable state, lapse wording, no 'tenant' on screen]
    - name: Business fulfilment (REQ-180 D2/D3/A1/A3)
      entry_point: router.ts POST /api/admin/businesses
      behaviors: [platform_admin only, 404 otherwise, provisionBusiness only, two platform_admin readers, no platform-tenant concept]
    - name: Library badges (REQ-181)
      entry_point: builder/library.js, material.ts
      behaviors: [drop placement pill, badge unplaced site asset only]
    - name: Dev env layering (BUG-50)
      entry_point: tools/generate/src/cli/dev-env.ts, index.ts
      behaviors: [one env-file definition for 1c builder and dev:control]
```

## Coverage Map

```yaml
coverage_map:
  - feature: KB packing gate
    status: partial
    existing_stories: [story-c4f329d3]
  - feature: L1 reference completeness
    status: partial
    existing_stories: [story-5836022a]
  - feature: Session texts + chat ledger
    status: partial
    existing_stories: [story-a58a0974]
    notes: [STORY-103 reserves the chat body for 'a summary REQ-171 owns']
  - feature: Admission after DOC-42
    status: partial
    existing_stories: [story-7b1025b8]
    existing_acs: [AC-1750 (superseded), AC-2076, AC-1760]
  - feature: Business scope
    status: uncovered
    notes: [STORY-146 lists REQ-168 as out of scope; STORY-121 covers only per-handle isolation]
  - feature: Terms gate
    status: uncovered
  - feature: Business switcher chrome
    status: partial
    existing_stories: [story-e674c60a]
  - feature: Business fulfilment
    status: uncovered
    notes: [STORY-146 excludes any business-creation surface]
  - feature: Library badges
    status: partial
    existing_stories: [story-1500b111]
  - feature: Dev env layering
    status: partial
    existing_stories: [story-e15a19ef]
```

## Plan Items

| # | Component | Type | Points | Deps | Description |
|---|-----------|------|--------|------|-------------|
| 1 | System KB shipping gate | upgrade STORY-117 | 2 | - | corpus/manifest agreement, stale=skew, kb-release |
| 2 | Projected reference covers the page | upgrade STORY-137 | 2 | - | document shape, structural rules, derived gap check |
| 3 | Session texts + chat ledger | upgrade STORY-103 | 3 | - | three-part texts, summary manual, ledger |
| 4 | Admission after DOC-42 | upgrade STORY-146 | 3 | - | membership admits, lapse reasons, entitlement subject; AC-1750 superseded |
| 5 | Business scope | feature | 3 | 4 | scope resolved from identity; single TENANT_ID reader; no-business 403 |
| 6 | Terms of service gate | feature | 2 | 4 | versioned acceptance before the builder |
| 7 | Business switcher in shell chrome | upgrade STORY-99 | 3 | 4,5 | /api/businesses, switcher, nothing-selectable, vocabulary |
| 8 | Business fulfilment | feature | 2 | 4 | operator-only add-a-business; privileged-read guards |
| 9 | Library badges the exception | upgrade STORY-144 | 2 | 7 | drop placement pill |
| 10 | Dev server env layering | upgrade STORY-79 | 1 | - | one env-file definition |

Total: 10 items (feature 3, upgrade 7), 23 points.

## FC Test Mapping

The prompt's fc_tests list was empty, but FC files for the bundled tickets exist on disk and are mapped: BUG-48 x2 -> 1,2; REQ-171 x2 -> 3; REQ-167 identity, REQ-178 businesses, REQ-180 lapse_reason, REQ-184 entitlement_subject -> 4; REQ-168 x2, REQ-178 lapsed_session -> 5; REQ-169 terms -> 6; REQ-179 x2, REQ-180 account_surface, REQ-180 business_vocabulary (word rule) -> 7; REQ-180 admin_adds_a_business, fulfilment_gate, business_vocabulary (concept rule) -> 8; REQ-181 -> 9; BUG-50 -> 10. The business_vocabulary file spans items 7 and 8 per test case.

## Observations

- Case 2 (explicit supersession): STORY-146's own Reconciliation Decisions (BUNDLE-34) state AC-1750 must be upgraded once the REQ-178 amendment commits reconcile; fa0b857/cd6002e are those commits, so AC-1750 (acceptance_criterion-5968d5c2) is listed under remove and AC-2076 is modified.
- REQ-169 changes the observable of AC-1760 (reaching the builder now also requires accepted terms); handled as a modify in item 4 rather than inside the new terms feature.
- Case 3 (mechanical touches, no intent change): the REQ-168 merge edits ~15 existing UATs (BUG-41/44/46/47, REQ-146, REQ-158..163, REQ-166, REQ-172, REQ-173) only to pass a scope into route()/openers; their owning stories keep their intent. No plan items absorb them.
- STORY-99 and STORY-121 describe the deployment's configured account being registered on first read; REQ-168 keeps TENANT_ID as the 1st Contact business and the dev-open scope, so that text stays true and is not changed here.
- REQ-180 §2 (the customer portal) is deferred to REQ-183 by the intent itself; not planned.
- `xgd ticket search` failed in this sandbox (embeddings cache not writable); reuse was established by walking all 62 story bodies and their capability links instead.
- BUG-48 notes that rebuilding the shipped KB needs Workers AI credentials; that is operational and outside the matrix.