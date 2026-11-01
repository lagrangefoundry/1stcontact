---
uid: report-7d8dd209
id: REPORT-7790
type: report
title: 'Reconciliation Plan: free-coded BUNDLE-36 (REQ-185/170/183/186/188/189, BUG-51/52/53/54/56)'
created_by: xgd
created_at: '2026-11-01T17:54:53.149753+00:00'
updated_at: '2026-11-01T20:50:59.711722+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-39edf66d
  anchor_uid: bundle-39edf66d
  items:
  - index: 1
    component: Accounts, Membership & Entitlement — scope & fulfilment gate
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: 'REQ-185 (commit 2103d2e). Extends existing stories story-7102ffe3
      (Business Scope) and story-387c9dfe (Business Fulfilment). Splits users.platform_admin:
      ownership of the 1st Contact business becomes an ordinary memberships.role=''owner''
      row; the membership bypass keeps a column renamed platform_operator (migration
      0007) whose only reader is scope.ts. POST /api/admin/businesses gates on ownsPlatformBusiness
      (owner of this business AND this business''s product is businesses) and no longer
      reads the column. PLATFORM_ADMINS env var (empty by default, declared in both
      wrangler halves) seeds the owner membership and the platform_operator column
      as two separate facts inside admit, before the user lookup, idempotently (WHERE
      NOT EXISTS), and leaves the rows behind when emptied. AdmittedBusiness carries
      role, null exactly on the bypass path.'
    justification: 'Both stories pin the old single-flag model (AC-2121 ''platform
      admin'', AC-2158 ''flag read in exactly two places'', AC-2149 ''without the
      fulfilment privilege''). Intent explicitly supersedes those readings (Case 2).
      No new capability bucket: scope entry and the fulfilment gate already exist
      in capability-e5939ceb; only what they read changes.'
    story_uid: story-7102ffe3
    target_story_ids:
    - story-7102ffe3
    - story-387c9dfe
    acceptance_criteria_changes:
      add:
      - Owning the 1st Contact business is a memberships.role='owner' row, indistinguishable
        to a caller from owning any other business
      - A PLATFORM_ADMINS holder can operate the 1st Contact business on a database
        with no membership row for them; admission seeds the owner membership and
        the platform_operator flag as separate rows, idempotently, and emptying the
        var removes neither
      - An admitted business entered via the platform_operator bypass carries role
        null, so entering a hosted business is never read back as owning it
      - No single predicate answers both 'is this person an owner here' and 'may this
        person enter a business they are not a member of'
      modify:
      - 'AC-2121: restate in terms of platform_operator — may enter any existing business
        without membership; lapsed, deactivated or unknown still refused; handle carries
        no extra scope'
      - 'AC-2158: the platform_operator column has exactly one reader (scope entry);
        a second read fails the build'
      - 'AC-2149: a caller who is not an owner of the platform business (ownsPlatformBusiness
        false) gets 404 and no business is created'
      remove: []
    intent_delta_summary: 'Replace the ''platform_admin / fulfilment privilege flag''
      vocabulary with two facts: owner membership on the platform business (gate for
      fulfilment) and platform_operator (scope bypass only), plus the PLATFORM_ADMINS
      bootstrap that seeds both.'
  - index: 2
    component: Accounts, Membership & Entitlement — invite
    item_type: upgrade
    story_points: 3
    dependencies:
    - 1
    description: 'REQ-186 (merge de210b4). Extends existing story story-7b1025b8 (Identity:
      the invite provisions the account, login binds it). provisionInvite is removed
      from production (survives only as tests/support inviteAccount fixture). The
      invite becomes invitePerson: a transition on the (tenant_id, email) row of the
      business the caller is scoped to — updates invited_at on an existing contact
      (same row id) and inserts only when absent; email casefolded; invited_at not
      restamped; display_name filled only when empty; reports created (inserted vs
      promoted). It writes no memberships and no entitlements row; app access comes
      from Provision a business. Route POST /api/people/invite gated on ownsBusiness
      (not ownsPlatformBusiness): non-owner 403, dev-open loopback refused, empty
      address 400; platform_operator does not confer ownership. GET /api/people reports
      canInvite and canFulfil separately. Unconfigured TENANT_ID refusal moves onto
      admit. No mail is sent and the dialog says so. The DOC-42 §1 sequence (invite
      Alice, provision her a business, Alice signs in, sees only hers and her /account)
      runs end to end.'
    justification: STORY-146 states the invite provisions person+business+grant in
      one operation; REQ-186 explicitly supersedes that (Case 2) and decomposes it
      into invite + provisionBusiness. Same capability bucket (who exists / how they
      arrive), so upgrade, not a parallel story.
    story_uid: story-7b1025b8
    target_story_ids:
    - story-7b1025b8
    acceptance_criteria_changes:
      add:
      - Inviting an address already a contact of the business updates that same row
        (same id) and inserts no second row; the result reports whether a row was
        created
      - Invites from two different businesses differ only in users.tenant_id and the
        users schema carries no level column
      - A re-invite does not restamp invited_at and never overwrites an existing display_name
      - An owner may invite into their own business; a non-owner (including a platform_operator
        holder) is refused 403, the dev-open loopback path is refused, an empty address
        is 400
      - The invite writes no memberships row and no entitlements row; an invited person
        with no business is refused no_membership at the door
      - GET /api/people reports canInvite and canFulfil as two separate flags
      - The invite dialog states that no message is sent
      - 'The DOC-42 §1 sequence runs: invite, provision a business, sign in, reach
        only that business and its /account'
      modify:
      - 'AC-1743: re-inviting a known address reports the existing person and creates
        nothing (no business, no grant)'
      - 'AC-1742: the starter site comes from business provisioning, not from the
        invite'
      - 'AC-1745: the unconfigured platform-tenant refusal is made at admission, not
        at the invite'
      - 'AC-2115: business provisioning writes grants naming no account; the invite
        writes no grant at all'
      - 'AC-1744: casefolding applies at the invite route and at login'
      remove:
      - AC-1740
      - AC-2078
      - AC-2079
    intent_delta_summary: 'The invite stops provisioning: it becomes an owner-gated,
      idempotent contact→invited transition on one row with no membership or grant;
      provisioning is a separate act (Provision a business).'
  - index: 3
    component: Contacts tab — the people of a business
    item_type: feature
    story_points: 3
    dependencies:
    - 1
    description: REQ-170 (merge accd812), REQ-189 (759f695), BUG-56 (9c0d7b0), plus
      REQ-186's detail-pane repair. A builder tab (id 'people', label 'Contacts',
      list heading 'Contacts') listing the population of the business the caller is
      scoped to, via GET /api/people and /api/people/detail; a business switch clears
      then re-reads. A person in another business is a 404 indistinguishable from
      nobody. Detail pane renders synchronously then fills; shows who they are and
      ONE table keyed by business joining memberships (businesses they run) and grants,
      with empty cells reading 'Not an operator' / 'No grant', multiple grants sharing
      one business cell via rowSpan, and grant business names joined from tenants.
      The list shows displayName and address in two cells, 'No name yet' when unnamed.
      Styled with builder-people rules matching webui-fields (13px, 8px gutter, row
      rules, muted labels) across list, detail and its dialogs; no class names a state
      value. The tab is never named for the privileged half.
    justification: No existing story covers a people/contacts surface in the builder;
      STORY-99 covers the workspace shell generically and STORY-162 only the fulfilment
      route. Genuinely new user-visible capability.
    story_uid: story-0034d937
  - index: 4
    component: Contacts tab — editing grants and a contact's record
    item_type: feature
    story_points: 3
    dependencies:
    - 3
    description: 'REQ-170 edit side + migration 0008, BUG-54 (merge 48a83cb), REQ-186
      fulfilment-dialog wiring. From a contact''s detail: open a grant (must name
      a business, else refused) and revoke one (sets entitlements.revoked_at + status=''revoked'',
      row kept; access check unchanged); suspend/restore login via POST /api/people/status
      (server capability retained, no UI binding). ''Who they are'' edits only Email
      and Name; all observed fields (stage/access, status, invited/first seen/last
      seen/terms accepted/created) are locked. POST /api/people/record patches email
      and/or display_name for one person in the scoped business: gated on ownsBusiness
      (403 otherwise), email validated by the shared isEmailShape rule (400), casefolded,
      duplicate within a business 400 (same address in another business allowed),
      unknown or foreign id 404, absent keys untouched, observed fields ignored. Client
      refuses malformed email inline without calling the transport and rolls back
      on rejection. The Provision a business control is rendered in the detail for
      canFulfil holders and posts the contact''s own address.'
    justification: No story covers editing grants or a contact's record from the builder.
      Separated from item 3 because it is the owner-gated write surface (distinct
      gates, validation and persistence) rather than the read surface; together they
      would exceed 3 points.
    story_uid: story-a55c2f35
  - index: 5
    component: Contacts tab — access and pipeline axes
    item_type: feature
    story_points: 2
    dependencies:
    - 2
    - 3
    description: 'REQ-188 final shape (50e9454, superseding the three-state line of
      59b9839). Two independent axes per contact: Access = Member iff tos_accepted_at
      set; Pipeline = stored users.pipeline_stage (migration 0009, default ''lead'',
      no CHECK, backfill ''invited'' where invited_at set; seeded platform operator
      written at ''invited''). One shared derivation module (people-axes.js) used
      by panel, people.ts and workerd tests. The invite assigns stage ''invited''
      and COALESCEs invited_at, never touching access; accepting terms makes a Member
      without changing stage. Each row draws a stage and a member badge; two facets
      (stage, access) combine so ''invited and never came'' and ''signed up and never
      asked'' are askable. Classes name the axis, never a value.'
    justification: No existing story models contact state or pipeline; this is a new
      classification capability layered on the contacts surface, with its own schema
      column.
    story_uid: story-0ea74f39
  - index: 6
    component: Customer portal — the account's own surface
    item_type: feature
    story_points: 3
    dependencies:
    - 1
    description: 'REQ-183 (03f961b). GET /account on the control app renders the customer
      portal as a page of a site through PreviewRenderer (no second render path) against
      the business the caller is an account OF (never TENANT_ID, never the operated
      business), under the reserved ''portal'' slug, falling back to a shipped default
      portal site whose site.json derives from the scaffolder''s. GET/HEAD only (405
      otherwise); 404 with neither admission nor scope. New vetted behaviour module
      account-portal in the framework catalog: paints nothing, account line and holdings
      are invariant elements filled client-side from /api/businesses, delete affordance
      is an L1 control. The Delete account control reveals the DOC-37 §6.1 erasure
      explanation and performs no deletion (account still exists afterwards); no copy
      claims otherwise; no add-business, plan, charges, export or ''tenant'' wording.
      The avatar dialog gains only a link out (new tab).'
    justification: No story covers a customer portal or the account-portal module.
      New user-visible capability; it reuses STORY-85's module contract rather than
      extending it, so no upgrade there.
    story_uid: story-83ff6262
  - index: 7
    component: Local store safety — import guard, starter guard, 1c reset
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: 'BUG-51 (a6f66c3). Extends existing stories story-e674c60a (Builder
      workspace; AC-1402 local→shared copy) and story-fde7370b (Cloudflare Site Store).
      POST /api/import reads the target''s change counter: zero proceeds as before;
      non-zero refuses 409, writes nothing, naming slug and change count; an explicit
      force in the payload (1c push --force, bin/publish --force applying to every
      slug) overrides; force absent from an ordinary push. createDraft reports whether
      it created the row and createStarterSite scaffolds only on creation, leaving
      an existing site untouched. New ''1c reset'': previews without --yes (lists
      dirs, file count, size; deletes nothing; exit 0); with --yes removes apps/control-app/.wrangler/state
      (plus public-site state with --include-public), never storage/; refuses while
      something listens on --port (default 8788); absent state is ''already empty'';
      repo-anchored.'
    justification: AC-1402 currently promises an unconditional idempotent copy, which
      BUG-51 deliberately changes (Case 2); createDraft's contract lives in the site-store
      story. 1c reset is the operator's control over the same local dev store the
      workspace command defaults to (AC-1401), so it extends that bucket rather than
      opening a new one.
    story_uid: story-e674c60a
    target_story_ids:
    - story-e674c60a
    - story-fde7370b
    acceptance_criteria_changes:
      add:
      - An import into a site with builder-recorded changes is refused 409 naming
        the slug and change count, and the stored site is byte-identical afterwards;
        the same import with force lands
      - 1c reset previews without --yes, removes only the local state directories
        with --yes (public-site only with --include-public), never touches storage/,
        refuses while the dev port is listening, reports an absent store as already
        empty, and resolves paths from the repo root
      - createDraft reports whether it created the site, and provisioning a business
        whose starter slug already holds a site leaves its definition and pages unchanged
      modify:
      - 'AC-1402: a local site''s draft copies into the shared store idempotently
        while the target carries no builder-recorded changes; otherwise it is refused
        unless forced'
      remove: []
    intent_delta_summary: Scaffold/import writes no longer overwrite authored work
      silently; the operator gets one deliberate, guarded way to empty the local store.
  - index: 8
    component: Builder workspace chrome — session expiry and control sizing
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: 'BUG-52 (902b5b6) and BUG-53 (af7c9f7, fdd00b8). Extends existing
      story story-e674c60a. Every builder request goes through one send() in api.js;
      a 401 (or a rejected fetch, classified as an authentication failure with hedged
      wording) is reported by session.js: at load the reason replaces the builder
      (standing REQ-149''s boot guard down); mid-session a strip appears above a shell
      that stays live and un-inerted; a refused site listing no longer empties the
      pane, Library or Contacts tab. Non-401 failures behave as before. Chrome controls
      (Theme, About, Contacts filter row, Invite, Provision a business, dialog buttons)
      share one --builder-control-font-size token, declared after each font: inherit
      so it wins regardless of source order; dialog buttons use builder-modal__btn
      with --primary on affirmative actions.'
    justification: STORY-99 owns the workspace chrome and its failure reporting (AC-1403
      'a workspace that cannot start says so'); these extend that bucket with session-expiry
      reporting and uniform control sizing. No new capability bucket. The access-harness
      7-day token change is test infrastructure and gets no AC.
    story_uid: story-e674c60a
    target_story_ids:
    - story-e674c60a
    acceptance_criteria_changes:
      add:
      - An expired session at load is reported in place of the builder, and mid-session
        as a strip above a shell that stays live; neither renders an empty account
        and a refused listing clears no pane
      - A failed request that is not a 401 is handled exactly as before
      - Every chrome button and filter control resolves to the single control font-size
        token, as the last font declaration on each control's rules
      modify: []
      remove: []
    intent_delta_summary: The workspace distinguishes an ended session from an empty
      account, and its controls share one type size.
---

# Reconciliation Plan

**Mode**: commits
**Source**: free-coded commits on BUNDLE-36 (REQ-185, REQ-170, REQ-183, REQ-186, BUG-51, REQ-188, REQ-189, BUG-52, BUG-53, BUG-54, BUG-56)

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded commits (18 SHAs; version-bump and pure merge-bump commits carry no behaviour)"
  entry_files:
    - apps/control-app/src/identity.ts
    - apps/control-app/src/scope.ts
    - apps/control-app/src/router.ts
    - apps/control-app/src/people.ts
    - apps/control-app/src/portal.ts
    - apps/control-app/src/builder/{people.js,people-axes.js,email-shape.js,api.js,session.js,app.js,main.js,config.js,business.js,builder.css}
    - packages/framework/src/modules/account-portal/*
    - tools/generate/src/cli/{reset.ts,push.ts,index.ts}, bin/publish, tools/generate/src/store/d1r2-store.ts
    - db/migrations/{0007_platform_operator,0008_entitlement_revocation,0009_pipeline_stage}.sql
  features:
    - name: platform_admin split (REQ-185)
      behaviors: [owner membership on platform business, platform_operator bypass sole reader scope.ts, ownsPlatformBusiness gate on /api/admin/businesses, PLATFORM_ADMINS seeding in admit, AdmittedBusiness.role null on bypass]
    - name: invite (REQ-186)
      behaviors: [POST /api/people/invite owner-gated, update-not-insert, no restamp, no rename, created flag, no membership/entitlement, canInvite+canFulfil, no mail and says so, provisionInvite removed]
    - name: Contacts tab read (REQ-170, REQ-189, BUG-56)
      behaviors: [GET /api/people(+detail) scoped, cross-business 404, joined business/grant table, empty-cell wording, rowSpan, name/address cells, styling, label Contacts]
    - name: Contacts tab writes (REQ-170, BUG-54)
      behaviors: [open/revoke grant with revoked_at, status route, POST /api/people/record patch with validation/casefold/dup/404/403, locked observed fields, fulfil dialog]
    - name: contact axes (REQ-188)
      behaviors: [access from tos_accepted_at, stored pipeline_stage lead/invited, two facets, badges, axis-named classes]
    - name: customer portal (REQ-183)
      behaviors: [GET /account via PreviewRenderer, portal slug + default site, account-portal module, delete explains only, avatar link]
    - name: local store safety (BUG-51)
      behaviors: [import 409 on counter>0, --force, createDraft created flag, starter only on create, 1c reset]
    - name: builder chrome (BUG-52, BUG-53)
      behaviors: [401 -> session notice at load / strip mid-session, single send(), control font-size token]
```

## Coverage Map

```yaml
coverage_map:
  - feature: platform_admin split
    status: partial
    existing_stories: [story-7102ffe3, story-387c9dfe]
    existing_acs: [AC-2121, AC-2158, AC-2149]
    gaps: [owner-row ownership, PLATFORM_ADMINS seeding, role null on bypass]
  - feature: invite
    status: partial (superseded semantics)
    existing_stories: [story-7b1025b8]
    existing_acs: [AC-1740, AC-2078, AC-2079, AC-1743, AC-1742, AC-1745, AC-2115, AC-1744]
    gaps: [transition semantics, owner gate, no grant/membership]
  - feature: Contacts tab read
    status: uncovered
  - feature: Contacts tab writes
    status: uncovered
  - feature: contact axes
    status: uncovered
  - feature: customer portal
    status: uncovered
    notes: [reuses STORY-85 behaviour-module contract unchanged]
  - feature: local store safety
    status: partial
    existing_stories: [story-e674c60a, story-fde7370b]
    existing_acs: [AC-1402]
  - feature: builder chrome
    status: partial
    existing_stories: [story-e674c60a]
    existing_acs: [AC-1403]
```

## Plan Items

| # | Component | Type | Points | Deps | Description |
|---|-----------|------|--------|------|-------------|
| 1 | Scope & fulfilment gate | upgrade (STORY-160, STORY-162) | 3 | - | REQ-185 platform_admin split + PLATFORM_ADMINS bootstrap |
| 2 | Invite | upgrade (STORY-146) | 3 | 1 | REQ-186 invite as owner-gated transition; provisionInvite gone |
| 3 | Contacts tab (read) | feature | 3 | 1 | REQ-170/189/BUG-56 list, joined detail table, styling, label |
| 4 | Contacts tab (writes) | feature | 3 | 3 | grants open/revoke (0008), record edit (BUG-54), fulfil dialog |
| 5 | Contact axes | feature | 2 | 2,3 | REQ-188 access + stored pipeline stage, two facets |
| 6 | Customer portal | feature | 3 | 1 | REQ-183 /account via site pipeline, account-portal module |
| 7 | Local store safety | upgrade (STORY-99, STORY-121) | 3 | - | BUG-51 import guard, starter guard, 1c reset |
| 8 | Workspace chrome | upgrade (STORY-99) | 2 | - | BUG-52 session expiry, BUG-53 control size |

Total: 8 items (feature 4, upgrade 4), 22 points.

## Observations

- Semantic `xgd ticket search` failed in the sandbox (embedding cache write to main worktree + HF download blocked); reuse was established by reading all 65 stories' titles and the ACs of every plausible target (STORY-99/93/94/121/146/160/161/162/85).
- REQ-188 supersedes intra-bundle text: REQ-186's acceptance 'appears in that tab as Member' and 59b9839's three-state line are NOT to be encoded; the invite moves a contact to pipeline stage Invited, never to Member. Items 2 and 5 follow the final commit 50e9454.
- BUG-54's 'state' locked field became stage/access after REQ-188; item 4 encodes the final field set.
- REQ-170 test narrowing of REQ-161's library-tab assertion (adjacency instead of tab count) and the REQ-183 catalog-count test edits (framework-tokens, reproduction-treatments, req84) are implicit supersessions of test pins only; check STORY-144/STORY-85 UATs still pass during story execution but no AC change is planned.
- STORY-93 AC-876 (import replaces wholesale) remains true for counter-zero sites; item 7 does not modify it, but the story cycle should confirm no conflict.
- Known out-of-scope gap recorded by REQ-186: members of a customer's business cannot sign in (admit resolves against the platform tenant). Not encoded.
- With BUG-54, no UI control suspends a login; POST /api/people/status remains a server capability (item 4 covers the route, not a control).