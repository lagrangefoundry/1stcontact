---
uid: report-71a8e1bb
id: REPORT-8460
type: report
title: 'Reconciliation Plan: BUNDLE-37 (BUG-55, REQ-190..REQ-198)'
created_by: xgd
created_at: '2026-11-02T04:08:25.762762+00:00'
updated_at: '2026-11-04T17:22:14.467908+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-5052a63c
  anchor_uid: bundle-5052a63c
  items:
  - index: 1
    component: Knowledge read seam (system + project KB)
    item_type: upgrade
    story_points: 2
    dependencies: []
    target_story_ids:
    - story-c4f329d3
    - story-3cf3d57b
    description: 'Extends existing stories story-c4f329d3 (STORY-117, system KB build)
      and story-3cf3d57b (STORY-149, one search across both KBs). BUG-55: search,
      searchChunks and KnowledgeRuntime.open are called with `indexes` (a map keyed
      by source name) instead of a singular `source`, so `1c kb build` completes its
      awareness-map step and the assistant''s search-then-read works in both hosts.
      The project KB is keyed DEFAULT_SOURCE. The build side (buildIndex/buildChunkIndex)
      stays positional. The shared-store preflight now checks that the installed knowledge
      component is COMPATIBLE (resolves a KB through its own indexFor) as well as
      present, and reports this on its own line.'
    justification: 'This is a bug fix to existing KB build/search behaviour, so it
      is an upgrade. No new capability bucket: the read seam already belongs to capability-45acba5e
      and capability-7e4714b7. Evidence: tests/test_UAT_FC_BUG-55_index_seam.test.ts
      (3 FC tests: a hit can be searched and then read; each KB is keyed by its own
      declared source; the preflight notices store/repo disagreement).'
    intent_delta_summary: The knowledge read seam takes a per-source index map. A
      runtime given no matching index refuses loudly and never reads as an empty corpus.
      The shared-store preflight checks compatibility as well as presence.
    acceptance_criteria_changes:
      add:
      - 'STORY-117: the knowledge-base build''s search step resolves each KB against
        an index map keyed by its declared source, and the full release pipeline completes'
      - 'STORY-117: the shared-store preflight resolves a KB through the installed
        component''s own indexFor and reports incompatibility on its own line, separate
        from presence counts, with no network or embedder'
      - 'STORY-149: a search hit from either KB can be read back through a runtime
        opened with the same source-keyed index map, in both hosts; the project KB
        is keyed DEFAULT_SOURCE'
      modify: []
      remove: []
    story_uid: story-c4f329d3
  - index: 2
    component: Site storage keys & published address
    item_type: upgrade
    story_points: 3
    dependencies: []
    target_story_ids:
    - story-fde7370b
    - story-d34eccd8
    - story-5349d01f
    description: 'Extends existing stories story-fde7370b (STORY-121, Cloudflare site
      store), story-d34eccd8 (STORY-95, serve a published site) and story-5349d01f
      (STORY-94, publish). REQ-190 changes: (1) one 0001_baseline.sql replaces migrations
      0001-0009 and seeds no people; its platform-tenant id literal matches wrangler.toml.
      (2) Every primary key is an opaque CSPRNG id minted only by tools/generate/src/store/ids.ts,
      and no composite key is built from data. (3) Child rows (site_pages/assets/changes/revisions)
      carry site_id and no tenant_id; R2 uses draft/<siteId>/ and sites/<siteId>/rev/.
      Renaming a business, changing a slug, or moving a site is a one-column UPDATE
      with no object copied. (4) A slug is unique within its business only, and moving
      onto a taken slug is refused by the constraint. (5) The public address is /site/<siteId>/,
      so two businesses can both publish `home`. published_sites, SlugClaimedError
      and the 409 are deleted. (6) Erasure enumerates TenantSiteStore.siteKeys().
      (7) site_revisions.id and site_changes.at stay integer ordinals. The source-scan
      tests skip dot/build output (commit a007aab).'
    justification: 'The site store, publish and serve stories already exist. REQ-190
      re-keys them and changes what a URL token means, without adding a new capability
      bucket. REQ-190''s body explicitly supersedes the global slug claim, so AC-1422
      is removed. Evidence: tests/test_UAT_FC_REQ-190_baseline.test.ts and tests/test_UAT_FC_REQ-190_opaque_keys.workers.test.ts
      (21 FC tests).'
    intent_delta_summary: Keys are opaque and never data. The published address is
      the site key, not a globally claimed slug. Child rows and objects are keyed
      by site only, and the business is named in exactly one row.
    acceptance_criteria_changes:
      add:
      - 'STORY-121: the schema is one baseline migration that seeds no people, and
        its platform-tenant literal equals the deployment''s configured id'
      - 'STORY-121: every primary key is an opaque random id from a single minter,
        identical inputs yield unrelated keys, the prefix is only a reading aid, and
        nothing branches on it'
      - 'STORY-121: no child row records the business; renaming a business, changing
        a slug, or moving a site to another business rewrites one column and copies
        no object'
      - 'STORY-121: a slug is unique within its business, and a move onto a taken
        slug is refused by the constraint'
      - 'STORY-121: erasure reaches every object by enumerating the business''s site
        keys, and forgetting a site removes its rows and objects'
      - 'STORY-121: revision id and journal counter remain integer ordinals'
      - 'STORY-95: a published URL is /site/<siteId>/, the same key used in joins;
        a key for another business is not obtainable through the handle'
      - 'STORY-94: two businesses can each publish a site called home; there is no
        claim table and no reader of one'
      - 'STORY-94: a new account''s starter site is named home and is visibly unnamed
        until named'
      modify: []
      remove:
      - acceptance_criterion-51835b53
    story_uid: story-fde7370b
  - index: 3
    component: 'Person identity: addresses and names as tables'
    item_type: upgrade
    story_points: 3
    dependencies:
    - 2
    target_story_ids:
    - story-7b1025b8
    - story-0034d937
    - story-a55c2f35
    description: 'Extends existing stories story-7b1025b8 (STORY-146 identity/invite),
      story-0034d937 (STORY-163 Contacts read) and story-a55c2f35 (STORY-164 Contacts
      edit). REQ-191: users has no email column. user_emails holds casefolded addresses
      with exactly one primary per person, and an address resolves to one person within
      a business. Admit and invite resolve through user_emails, including invites
      at a secondary address. Correcting an address rewrites the primary row. Changing
      which address is primary changes no key. The detail pane lists the other addresses,
      primary first, as read-only. REQ-193: user_names holds one row per name. Every
      part is optional. Names are superseded (corrected|changed) rather than updated,
      and a partial unique index enforces exactly one current row. Reads go through
      one resolver, and only `changed` former names reach the client. The Contacts
      tab gains a name pane for editing name parts. Greeting falls back from known_as
      to given_name.'
    justification: 'Contacts and identity stories already cover a person''s address
      and name, so this is an upgrade that changes their storage and editing shape.
      No new capability bucket. Evidence: test_UAT_FC_REQ-191_user_emails.workers,
      REQ-191_other_addresses, REQ-193_names.workers, REQ-193_name_pane and REQ-193_seeded_names.workers.'
    intent_delta_summary: A person holds several addresses (one primary) and a superseding
      history of optional-part names. The display name and single email column are
      gone, and the Contacts UI reads and edits through these tables.
    acceptance_criteria_changes:
      add:
      - 'STORY-146: users carries no address column; a person holds several casefolded
        addresses with exactly one primary, and an address resolves to exactly one
        person in a business'
      - 'STORY-146: admission and invite resolve identity through the address table,
        including an invite at a secondary address'
      - 'STORY-164: correcting the address rewrites the primary row, and changing
        which address is primary changes no key or foreign key'
      - 'STORY-163: the detail pane lists every non-primary address, styled and offering
        no control, and the section is absent for a person with one address'
      - 'STORY-164: a name is a row per name with every part optional, superseded
        (corrected or changed) rather than updated, with exactly one current row;
        only changed former names reach the client'
      - 'STORY-164: the name pane edits name parts, and clearing every part supersedes
        the row so the person has no name'
      modify:
      - 'acceptance_criterion-8fead1a2 (AC-2171): a re-invite does not restamp the
        invitation time and never supersedes an existing current name'
      - 'acceptance_criterion-5d6bb323 (AC-2179): each list row shows the resolved
        name and the primary address, reading No name yet when the person has no current
        name'
      - 'acceptance_criterion-7914c104 (AC-2188): Who they are offers editing on the
        primary address and the name parts; observed fields stay locked'
      - 'acceptance_criterion-5c205ca2 (AC-2192): an owner can correct a contact''s
        primary address and name parts in the business they are scoped to'
      - 'acceptance_criterion-890af8ec (AC-1744): an address differing only in case
        or padding is the same person, enforced by the schema storing casefolded addresses'
      remove: []
    story_uid: story-7b1025b8
  - index: 4
    component: 'Accounts: the payer that owns businesses'
    item_type: upgrade
    story_points: 3
    dependencies:
    - 3
    target_story_ids:
    - story-7b1025b8
    - story-387c9dfe
    - story-83ff6262
    description: Extends existing stories story-7b1025b8 (STORY-146), story-387c9dfe
      (STORY-162 business fulfilment) and story-83ff6262 (STORY-166 portal). REQ-194
      adds an `accounts` table. An invite mints an account with an opaque acct_ key.
      users.account_id is required, so a person with no account is refused by the
      schema. tenants.owner_account_id names the owning account, and the platform
      business is owned by nobody. Business ids are minted biz_, and nothing the product
      mints for a business reads acct_. An account may hold several people, and all
      of them operate its businesses. A non-null entitlements.account_id names an
      accounts key, while the capacity grant keeps its NULL subject. findAccount returns
      an account. Provisioning refuses an account that does not exist or holds nobody.
      /api/businesses reports `person` rather than presenting a person under `account`.
      No permission check reads role.
    justification: 'Account, ownership and entitlement subject are already described
      by capability-e5939ceb stories, so this is an upgrade. It gives an existing
      noun a table and re-points existing ACs. No new capability bucket. Evidence:
      tests/test_UAT_FC_REQ-194_accounts.test.ts and .workers.test.ts (14 FC tests).'
    intent_delta_summary: The account is a distinct table that pays and owns businesses.
      People belong to an account, businesses name an owning account, entitlement
      subjects are account keys, and the chrome is told the signed-in person under
      that noun.
    acceptance_criteria_changes:
      add:
      - 'STORY-146: an invite mints an account with an opaque key, and a person with
        no account is refused by the schema'
      - 'STORY-146: an account may hold several people, and all of them operate its
        businesses'
      - 'STORY-162: a business names the account that owns it; the platform business
        is owned by nobody; no business id the product mints or the deployment names
        reads acct_'
      - 'STORY-162: provisioning refuses an account that does not exist or holds nobody,
        and findAccount answers with an account'
      - 'STORY-146: no permission check reads role'
      modify:
      - 'acceptance_criterion-17f275a7 (AC-1741): a business''s identifier is opaque,
        distinct from its owning account''s identifier, and derived from nothing a
        human chose'
      - 'acceptance_criterion-d384dcb1 (AC-2115): a non-null entitlement subject names
        an accounts key; the capacity grant keeps its null subject and meaning'
      - 'acceptance_criterion-be56b74c (AC-2157): the businesses payload carries exactly
        ''person'' and ''businesses'' and offers no self-serve creation contract'
      - 'acceptance_criterion-3f0182e4 (AC-1742): provisioning writes the business
        (owned by the account), its owner membership and grant together, plus a starter
        site named home addressed by its opaque key'
      remove: []
    story_uid: story-7b1025b8
  - index: 5
    component: Contact history (contact_events)
    item_type: feature
    story_points: 3
    dependencies:
    - 4
    description: 'REQ-195 adds contact_events, an append-only table. It keeps occurred_at
      and recorded_at separate and uses an untyped dotted kind and a ref. A BEFORE
      UPDATE trigger refuses rewrites, while DELETE stays reachable for erasure. business_id
      is derived from the contact via INSERT...SELECT. Provenance is the earliest
      event. Emitters: contact.created (invite and the PLATFORM_ADMINS seed), contact.invited
      (every press) and member.signed_up (terms acceptance). recordEvent is the write
      path for later email.* kinds. The Contacts detail pane gains a History section:
      newest first, an Origin line from the earliest event, recorded_at shown only
      when it differs, and unknown kinds rendered verbatim.'
    justification: 'No existing story covers a contact''s event history. STORY-163
      and STORY-165 describe present state only, so this is a new capability. Evidence:
      test_UAT_FC_REQ-195_contact_events.workers and test_UAT_FC_REQ-195_contact_history.'
    story_uid: story-4630e921
  - index: 6
    component: Outgoing message composition & sending (templates + mail port)
    item_type: feature
    story_points: 3
    dependencies: []
    description: REQ-196 adds a sendEmail({to,from,subject,body}) -> {providerId}
      port with two adapters. A Resend adapter is used when RESEND_API_KEY is present.
      Otherwise a local adapter records in memory, delivers nothing, and returns ids
      prefixed local_. The credential is the only switch. Validation is shared. A
      missing MAIL_FROM is refused. A deploy secret hook pushes the key, and the key
      is redacted by the router. MAIL.md is the DNS runbook. REQ-197 adds a `template`
      ticket type in the tenant store (template_key invite|signin|lapsed, subject,
      placeholders, required body). templateFor picks the newest by key and seeds
      the default. renderTemplate refuses on a declared token missing from the body,
      a declared token with no or empty value, or any unsubstituted token, naming
      the template and the token. There are three business-neutral seed templates,
      each with {{cta_url}}. TicketStore.query gains sort.
    justification: 'No story covers sending mail or message templates; invitePerson
      previously documented that nothing is sent. These are genuinely new capabilities.
      The port and the templates are combined because both are the prerequisite verbs
      and content for any outgoing message, and neither has a caller on its own. Evidence:
      test_UAT_FC_REQ-196_mail.workers, REQ-196_mail_configuration, REQ-197_render
      and REQ-197_templates.workers.'
    story_uid: null
  - index: 7
    component: Email record, delivery webhook & messages pane
    item_type: feature
    story_points: 3
    dependencies:
    - 5
    - 6
    description: REQ-198 adds one `email` ticket per outgoing message in the tenant
      store, joined to the contact and to the specific address. The record is written
      `queued` before the provider call and updated after, and it stores the rendered
      body. The sending port is injected. A signed delivery webhook is mounted ahead
      of the Access gate. It verifies the signature over raw bytes, bounds replay
      by timestamp, fails closed when unconfigured, and refuses before parsing. It
      sets delivered/bounced by finding the record through each business's scoped
      handle. The Contacts detail pane lists a contact's messages newest first with
      subject, date, status and failure reason, and /api/people flags contacts holding
      a bounced message.
    justification: 'No existing story records outgoing messages or receives provider
      callbacks, so this is a new capability. Evidence: test_UAT_FC_REQ-198_email_record.workers,
      REQ-198_delivery_webhook.workers and REQ-198_messages_pane.'
    story_uid: null
  - index: 8
    component: 'Local dev fixture: bin/seed and bin/access-sim'
    item_type: feature
    story_points: 2
    dependencies:
    - 3
    - 4
    description: 'REQ-192 adds bin/seed, which applies db/dev-seed.sql to the local
      D1 and is idempotent through fixed 128-bit ids with INSERT OR IGNORE. It writes
      remote only with --remote and seeds no operator. The cast covers states nothing
      reachable by clicking produces: Alice with three businesses under one account,
      one of them with an ended grant; people on both DOC-44 §3 axes; a person with
      two addresses; and four name shapes (title/known_as/former and corrected names,
      null-reason supersession, mononym, no known_as). bin/access-sim publishes a
      JWKS and mints RS256 tokens that the real verifyAccessJwt accepts and refuses
      under a wrong aud. It lists every user_emails address. ACCESS.md points to both.'
    justification: 'No story covers a repeatable developer fixture or a local Access
      simulator. These are operator/developer-facing tools rather than test-only output:
      they make a fresh clone usable. Evidence: test_UAT_FC_REQ-192_dev_seed.workers,
      REQ-192_seed_command, REQ-192_access_sim and REQ-193_seeded_names.workers.'
    story_uid: null
---

# Reconciliation Plan

**Mode**: commits
**Source**: BUNDLE-37 free-coded commits (BUG-55, REQ-190, REQ-191, REQ-192, REQ-193, REQ-194, REQ-195, REQ-196, REQ-197, REQ-198)

## Behavior Inventory

```yaml
behavior_inventory:
  features:
    - name: knowledge read seam (BUG-55, 798310c)
      entry_files: [tools/generate/src/cli/kb.ts, tools/generate/src/cli/shared-store.ts, apps/control-app/src/{knowledge,session-knowledge,system-knowledge}.ts]
      behaviors: [search/searchChunks/open take indexes keyed by source, project KB keyed DEFAULT_SOURCE, shared-store compatibility preflight on its own line]
    - name: opaque keys + /site/<siteId>/ (REQ-190, 5c012c3, a007aab, merge ae7e655)
      entry_files: [db/migrations/0001_baseline.sql, tools/generate/src/store/{d1r2-store,ids,revision-model}.ts, apps/public-site/src/{routes,site-store}.ts, apps/control-app/src/{identity,public-url,router}.ts]
      behaviors: [single baseline, one key minter, site_id-only child rows, R2 by siteId, slug unique per business, published_sites/SlugClaimedError removed, siteKeys erasure, ordinals stay integers]
    - name: user_emails (REQ-191, merge 5df406b)
      behaviors: [several casefolded addresses with one primary, admit/invite via user_emails, other-addresses pane section]
    - name: user_names (REQ-193, 0d170e4, b38dbda, fbb90d8)
      behaviors: [optional name parts, superseded rows, single resolver, name pane, seeded name shapes]
    - name: accounts (REQ-194, d1b3fa8, 7ea4e12)
      behaviors: [accounts table, users.account_id, tenants.owner_account_id, biz_/acct_ ids, entitlement subject is account key, /api/businesses reports person]
    - name: contact_events (REQ-195, 13d686a)
      behaviors: [append-only events with trigger, derived business_id, contact.created/invited/member.signed_up emitters, History pane]
    - name: mail port (REQ-196, 164e51c)
      behaviors: [sendEmail port, Resend/local adapters switched by credential, MAIL_FROM required, deploy secret hook, redaction]
    - name: templates (REQ-197, 242a8bf)
      behaviors: [template ticket type, templateFor newest-wins + default seed, renderTemplate refusals, query sort]
    - name: email records (REQ-198, 5360036)
      behaviors: [email ticket per message queued-before-send, signed delivery webhook ahead of Access, messages pane, bounced flag on /api/people]
    - name: dev fixture (REQ-192, 3d9529a)
      behaviors: [bin/seed idempotent local-unless---remote, no operator, bin/access-sim real JWT verification]
    - name: version bumps (7b67e13, e862cec, a89fc80, 1da94d7, b3b210b, df47207, bb73eb6, 3c6d47d, 39bd0f6, 7c25b0c, e1fbf43, 2700bf9, eec028d, 1ff5b50)
      behaviors: [package.json version only - no capability]
```

## Coverage Map

```yaml
coverage_map:
  - feature: knowledge read seam
    status: partial
    existing_stories: [story-c4f329d3 (STORY-117), story-3cf3d57b (STORY-149)]
    gaps: [source-keyed index map, compatibility preflight]
  - feature: opaque keys + published address
    status: partial (contradicted)
    existing_stories: [story-fde7370b (STORY-121), story-d34eccd8 (STORY-95), story-5349d01f (STORY-94)]
    existing_acs: [AC-1422 superseded]
  - feature: user_emails / user_names
    status: partial
    existing_stories: [story-7b1025b8 (STORY-146), story-0034d937 (STORY-163), story-a55c2f35 (STORY-164)]
    existing_acs: [AC-2171, AC-2179, AC-2188, AC-2192, AC-1744 to modify]
  - feature: accounts
    status: partial
    existing_stories: [story-7b1025b8, story-387c9dfe (STORY-162), story-83ff6262 (STORY-166)]
    existing_acs: [AC-1741, AC-2115, AC-2157, AC-1742 to modify]
  - feature: contact_events
    status: uncovered
  - feature: mail port + templates
    status: uncovered
  - feature: email records + webhook
    status: uncovered
  - feature: dev seed + access-sim
    status: uncovered
```

## Plan Items

| # | Component | Type | Points | Deps | Description |
|---|-----------|------|--------|------|-------------|
| 1 | Knowledge read seam | upgrade | 2 | - | BUG-55: source-keyed index map + compatibility preflight (STORY-117, STORY-149) |
| 2 | Site storage keys & published address | upgrade | 3 | - | REQ-190: opaque keys, site_id-only children, /site/<siteId>/, remove AC-1422 (STORY-121/95/94) |
| 3 | Person identity: addresses & names | upgrade | 3 | 2 | REQ-191 + REQ-193 (STORY-146/163/164) |
| 4 | Accounts | upgrade | 3 | 3 | REQ-194 (STORY-146/162/166) |
| 5 | Contact history | feature | 3 | 4 | REQ-195 contact_events + History pane |
| 6 | Message composition & sending | feature | 3 | - | REQ-196 mail port + REQ-197 templates |
| 7 | Email record & delivery webhook | feature | 3 | 5,6 | REQ-198 |
| 8 | Local dev fixture | feature | 2 | 3,4 | REQ-192 bin/seed + bin/access-sim (+ REQ-193 seeded names) |

**Total**: 8 items (4 upgrade, 4 feature), 22 points.

## Observations

- Version-bump commits and merge commits carry no capability. Merges ae7e655 (REQ-190) and 5df406b (REQ-191) carry the real REQ-191 diff and are folded into items 2 and 3.
- Supersession (Case 2): REQ-190 explicitly removes the global slug claim (published_sites, SlugClaimedError, 409), so AC-1422 (acceptance_criterion-51835b53) is removed. REQ-191, REQ-193 and REQ-194 retract the single email/display_name columns and the person-as-account payload, so the ACs pinning them are modified rather than removed, because the behaviour they describe persists in a new shape.
- REQ-192's own body supersedes its earlier two-phase-seed acceptance clauses, but those were never matrix ACs, so nothing needs removing.
- BUG-55 commit notes say 15 knowledge tests remain red due to a separate ai/ai-knowledge priming skew. That is out of scope here and must not be absorbed into item 1.
- Commit 7ea4e12 corrects prose: entitlements.account_id is NOT populated by provisioning (the capacity grant keeps a NULL subject). Item 4 follows the code.
- Story search (`xgd ticket search`) failed in this sandbox (embeddings index not writable), so reuse was checked by reading every candidate story's full AC list instead.
- No FC test files were listed by the harness (pattern is .py), but TypeScript FC tests (test_UAT_FC_*.test.ts) exist for every item. Each item's justification names its FC suites so the story cycle can rename them.