---
uid: report-f6518e8e
id: REPORT-3272
type: report
title: 'Reconciliation Plan: the product ticket store (REQ-162, free-coded commits)'
created_by: xgd
created_at: '2026-09-01T23:51:59.267222+00:00'
updated_at: '2026-09-02T00:47:12.726717+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: request-13a5e206
  anchor_uid: request-13a5e206
  items:
  - index: 1
    component: Product Ticket Store
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'The platform gains a second store, beside the site store: everything
      a site is made FROM — client uploads, fetched background, capture bundles, the
      per-site brief, and the conversations — as tickets in D1. The ticketing component''s
      schema arrives as `db/migrations/0003_ticket_store.sql`, applied by the same
      runner and the same test factory as 0001/0002, with two claims the transcription
      needs: every statement in the component''s own SCHEMA_STATEMENTS appears in
      the file (a copy is a fork unless something checks it), and the `tenants` table
      0001 already created is reconciled with `ALTER TABLE tenants ADD COLUMN config`
      — without it the component''s IF NOT EXISTS leaves the older table alone and
      the first tenant registration fails with `no such column: config` against a
      migration that appeared to apply cleanly. `ticketStoreFor(env)` is the single
      wiring point: it refuses at construction when TENANT_ID or BLOBS is absent,
      registers the configured tenant only after a read proves it absent (putTenant
      is an upsert that overwrites status, so unconditional registration would reactivate
      a suspended account), and returns a handle with the tenant bound in — no operation
      takes an account, and the scoped handle is terminal. A ticket created through
      the Worker''s own wiring reads back through a second, independently constructed
      handle. A handle for one account can neither read nor write another''s rows:
      a cross-tenant uid reads as not_found on `get` and is absent from `query`, so
      the barrier holds on the path a caller is handed freely as well as the one it
      had to obtain a uid for. `1c assets` emits `src/generated/ticketing.js` (and
      its .d.ts) re-exporting an absolute path, because a bare `@lagrangefoundry/*`
      specifier resolves from the main checkout and not from a linked git worktree;
      a stale shared install — one predating the BlobStore port — is detected by the
      file the capability lives in rather than by a version that never changes, and
      reported as a named skip carrying the install command.'
    justification: No existing story covers a ticket store at all. story-fde7370b
      and story-3f4a5f2b (capability-c4c7a854) are the SITE store — site definitions,
      pages, assets — and answer a different set of questions about a different subject;
      nothing in the matrix mentions tickets, a type pack, or a second D1 schema.
      story-d5167ced's AC-1341 already asserts generically that every Worker binding
      is repeated under its named environment, and AC-1427 that derived artifacts
      are generated before typecheck, but neither says the platform HAS a store for
      client material, that its schema tracks an upstream component's, that one account's
      material is unreachable from another's, or that construction fails loudly on
      a misconfigured deployment. This is a new capability bucket — the client's material
      as tickets — not an extension of the site store's.
    story_uid: story-ab1ecd62
  - index: 2
    component: Material Blob Storage
    item_type: feature
    story_points: 2
    dependencies:
    - 1
    description: 'Attachment bytes have a home that the Worker serving the public
      internet cannot reach. `attach` and `attachments` work through the wired store,
      each attachment record carrying a sha256 and a size and hanging off its parent
      so backlinks traverse it for free. The bytes land at `t/<tenant>/blob/<sha256>`
      in a bucket of the store''s own — `1stcontact-material`, bound as BLOBS — and
      are provably NOT in `1stcontact-sites`, the bucket `apps/public-site` serves
      by path: brand guidelines, positioning papers and competitor captures are the
      client''s confidential material, and sharing the bucket would leave only routing
      code between a confidential document and a public URL. This is BUG-31''s mistake
      with disclosure rather than overwrite as the failure mode, which is why the
      boundary is a bucket and not a key prefix — a prefix is a convention enforced
      by whoever remembers it, a missing binding is enforced by its absence. Addressing
      is content-derived and tenant-prefixed, so the same file uploaded by two accounts
      dedups within each and yields two different absolute keys across them, rather
      than one shared object. The binding is declared top-level and repeated under
      [env.production] naming the same bucket, and the workers suite declares it too
      so the isolation claim is proved against real R2 rather than argued from the
      config.'
    justification: 'No existing story covers attachment storage or a second object-store
      bucket. story-fde7370b''s AC-1398 pins the SITE bucket''s declaration and story-d5167ced''s
      AC-1341 pins environment repetition generically, but neither states that a second
      bucket exists, why it must be separate from the one the public site serves,
      or that bytes provably land in one and not the other — the disclosure boundary
      is the substance here and it is asserted nowhere. Kept separate from item 1
      because the security claim is a different one (disclosure across Workers, not
      isolation across accounts), it was mutation-tested independently, and it carries
      its own deployment obligation: the bucket must be created before the next production
      deploy, since miniflare conjures it locally and Cloudflare does not.'
    story_uid: story-a7a12d81
  - index: 3
    component: Material Types
    item_type: feature
    story_points: 3
    dependencies:
    - 1
    description: 'The product type pack names what a site is made from. `material`
      covers client uploads and fetched background — one type for an uploaded PDF,
      a fetched report and a photo, differing by `kind` rather than by type. `reference`
      covers capture bundles, kept a type of its own because a bundle is N attachment
      records with a lifecycle of its own rather than one blob. Both carry DOC-38
      §9''s rights and provenance block verbatim, shared rather than duplicated so
      the corpus predicate and the Library can query across the two: `rights` (owned|licensed|third_party),
      `republishable`, `exportable`, `origin` (uploaded|captured|fetched|site), `kind`
      (document|image|font|capture), `source_url`. A bad `rights` or `kind` value
      is refused. `republishable` and `exportable` are required rather than defaulted
      — DOC-38 §4.2 shows the two inverting between a client''s own site and a third-party
      reference, so any rule deriving them is wrong for half the corpus, and a fail-closed
      default would produce not a refusal anyone sees but a corpus silently marked
      unusable and indistinguishable from one genuinely marked so. They are booleans,
      not truthy values, so the string a form would submit is refused. `source_url`
      is required exactly where it exists — captured and fetched material came from
      somewhere, an upload did not. `brief` is the per-site canonical decisions document:
      a required `site_slug`, because one-per-site is not one-per-tenant and a tenant
      may own several, and a body that must be present and non-empty because unlike
      a material no later extraction fills it in. None of the three carries a status
      vocabulary: §9 specifies six fields and no lifecycle. The pack also merges the
      chat schemas from the AI component (imported, not restated, because TicketSessionArchive
      is what reads them back) and the component''s own attachment schema as shipped
      — so one store serves both halves of the platform''s memory, and a chat session
      persists as a ticket found by `fields.session_id` with its transcript in a `chat_transcript`
      comment and its body left for the summary.'
    justification: 'No existing story defines these types. capability-b4ac88fc (Site
      Materials & Starting Point) is the nearest neighbour and is a different subject:
      a SITE''s own inventory — its scaffold, the assets it can reference, the repo''s
      font licences, its palette — whereas these are the tenant''s source material
      feeding the assistant, held in the ticket store and scoped to an account. story-a58a0974
      and story-7f437d57 own the assistant conversation and its pane; neither says
      a session can persist as a ticket, and this commit changes no chat behaviour
      — it only makes the schemas available in the same pack, which is a property
      of the pack. The field rules are the substance of DOC-38 §9 and have no AC anywhere.'
    story_uid: story-e07c589b
  - index: 4
    component: Cloudflare Site Store
    item_type: upgrade
    story_points: 1
    dependencies:
    - 2
    description: 'Extends existing story story-fde7370b. AC-1398 states that the two
      deployment halves ''name the same database and the same bucket'' — singular,
      and true only while SITES was the only bucket. With BLOBS correctly added, two
      different buckets each correctly declared twice fail both the count and the
      one-distinct-value form of that claim: the criterion became wrong rather than
      merely imprecise. The claim it was always making — each binding names the same
      target on both sides — is restated per binding, which keeps holding as bindings
      are added.'
    justification: 'Extends an existing capability bucket (capability-c4c7a854, the
      site store''s deployment configuration) rather than introducing a new one: the
      criterion''s subject, scope and verification are unchanged — only the quantifier
      moves from ''the bucket'' to ''each declared binding''. No new story, no parallel
      assertion, and no second place where deployment-half pairing is claimed. Classified
      upgrade rather than feature because the behaviour is already documented and
      merely generalised; the BLOBS bucket''s own claims live in item 2, on the store
      that owns it.'
    story_uid: story-fde7370b
    target_story_ids:
    - story-fde7370b
    intent_delta_summary: 'Generalise AC-1398 from a single-bucket claim to a per-binding
      one: every binding the configuration declares names the same target in the default
      and the named production environment, for however many bindings exist. Nothing
      else about the criterion changes.'
    acceptance_criteria_changes:
      add: []
      modify:
      - 'acceptance_criterion-24cd21ca (AC-1398) — ''Both deployment halves declare
        the same database and bucket, and the schema is applied before upload with
        a rehearsal that changes nothing'': replace ''Both halves name the same database
        and the same bucket'' with a per-binding statement — each declared binding
        names the same target in both halves, paired by binding name rather than counted
        across the file, so the claim survives the addition of a binding. The schema-location,
        apply-before-upload, runnable-step, rehearsal and no-database-binding clauses
        are unchanged.'
      remove: []
---

# Reconciliation Plan — REQ-162, the product ticket store

**Mode**: commits
**Anchor**: request-13a5e206 (REQ-162)
**Source commits**: `fc117f1d35` (the whole change), `2284bf4bbd` + `bc36b2cce9` (version bumps only — `package.json` 0.2.18 -> 0.2.19 -> 0.2.20, no behaviour, no plan item)

## Intent, as the operator stated it

DOC-38 §6 rests on every piece of client material being a ticket and DOC-10 §8 homes chat sessions the same way; neither existed. There was no `@lagrangefoundry/ticketing` import in the tree, no ticket tables in `db/migrations` (only the site store's 0001/0002), no product TypePack, and so nowhere for `material`, `reference` or `brief` to be defined. The ticket stands the store up and defines the types in it. Its own acceptance list names: the schema as a migration; a blob bucket distinct from `1stcontact-sites` declared in both wrangler halves; attachment ops through the wired store with `ticketStoreFor` throwing when the blob binding is absent; a handle for tenant A unable to reach tenant B, asserted rather than assumed; the three types validating DOC-38 §9's fields; the chat schemas merged into the same pack; and a ticket created through the Worker readable back through it — explicitly with **no HTTP routes**, which belong to REQ-161.

The two open questions the body carried are settled in the body itself and confirmed by the code: `reference` keeps its own type, and `brief` keeps its own type with `fields.site_slug`.

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded commits: fc117f1d35, 2284bf4bbd, bc36b2cce9"
  entry_files:
    - "db/migrations/0003_ticket_store.sql"
    - "apps/control-app/src/tickets.ts"
    - "apps/control-app/wrangler.toml"
    - "apps/control-app/src/router.ts"
    - "tools/generate/src/cli/assets.ts"
    - "tests/support/ticketing-installed.ts"
    - "tests/support/d1-site-factory.ts"
    - "vitest.workers.config.mts"
  features:
    - name: "The ticket schema, as migration 0003"
      description: >
        The ticketing component's SCHEMA_STATEMENTS transcribed to .sql, because
        wrangler's migration runner reads files off disk and cannot import a JS
        constant. Sits beside 0001/0002 under the declared migrations_dir and is
        listed in the test factory's explicit MIGRATIONS array. Carries one
        statement that is NOT a transcription: ALTER TABLE tenants ADD COLUMN
        config, reconciling the tenants table 0001 already created (the
        component's own CREATE is IF NOT EXISTS and leaves it alone, so the
        first putTenant would fail with `no such column: config`).
      behaviors:
        - "Every statement in the component's SCHEMA_STATEMENTS appears in the file"
        - "The migration is found beside the existing two under migrations_dir"
        - "The tenants table gains the config column the ticket store's accessor writes"
        - "Removing the ALTER fails 13 of the 15 workerd UATs (mutation-tested)"
      entry_point: "db/migrations/0003_ticket_store.sql"
    - name: "ticketStoreFor(env) — the single wiring point"
      description: >
        Builds MultiTenantTicketStore over an Accessor on D1 and an R2BlobStore
        on BLOBS, then returns forTenant(TENANT_ID). Constructed per request
        rather than memoised, because forTenant performs the registry check and
        a cached handle would carry a check made against a row that may since
        have been deactivated.
      behaviors:
        - "Throws TenantNotConfiguredError when TENANT_ID is absent or blank"
        - "Throws BlobsNotConfiguredError when the BLOBS binding is absent — at construction, before any op"
        - "Registers the configured tenant only after a read proves it absent (putTenant is an upsert over status; unconditional registration would reactivate a suspended account)"
        - "Hands the blob store in UNSCOPED, so forTenant binds accessor and every tenant-partitioned port together from one validated id"
        - "The returned handle takes no account on any operation; the scoped handle is terminal"
      entry_point: "apps/control-app/src/tickets.ts:ticketStoreFor"
    - name: "The tenant barrier, on rows"
      description: "DOC-10 §4.1's information barrier, expressed structurally rather than by a filter every call site must remember."
      behaviors:
        - "A cross-tenant uid reads as not_found on get — never as a leak of existence"
        - "A cross-tenant uid is absent from query, which is handed out freely and would otherwise enumerate the barrier away"
        - "A cross-tenant update is refused and the target row is unchanged when re-read"
      entry_point: "MultiTenantTicketStore.forTenant"
    - name: "Attachments, in a bucket of their own"
      description: >
        A second R2 bucket, `1stcontact-material`, bound as BLOBS — deliberately
        not `1stcontact-sites`, which apps/public-site serves to the public
        internet. Keys are t/<tenant>/blob/<sha256>, composed by the component's
        R2BlobStore.
      behaviors:
        - "attach returns a record carrying sha256 and size; attachments lists it back"
        - "The bytes are present in BLOBS at the tenant-prefixed content address"
        - "The bytes are absent from the public-site bucket (mutation-tested: wiring the blob store to SITES fails this)"
        - "Two tenants uploading identical bytes get the same sha256 and different absolute keys — dedup within, isolation across"
        - "BLOBS is declared top-level and repeated under [env.production], naming the same bucket, and that bucket is never the one public-site serves"
        - "The workers vitest config declares both buckets so isolation is proved against real R2"
      entry_point: "apps/control-app/wrangler.toml, TicketStoreEnv.BLOBS"
    - name: "The product type pack"
      description: "productTypePack() — dev-time configuration over the component's one validation engine."
      behaviors:
        - "types() carries material, reference, brief, chat, comment and attachment"
        - "material and reference share DOC-38 §9's field block verbatim; body optional (the AI text shadow is written after the record)"
        - "rights and kind are closed enums; a value outside either is a validation failure"
        - "republishable and exportable are required and boolean — omitting either, or passing 'yes', is refused"
        - "source_url is required_when origin is captured or fetched, and unset for an upload"
        - "brief requires site_slug and a required non-empty body"
        - "No status vocabulary on the three new types — §9 specifies six fields and no lifecycle"
        - "Chat schemas are imported from the AI component (chatSchemas), not restated"
        - "The component's ATTACHMENT_SCHEMA is merged under its own exported ATTACHMENT_TYPE key"
        - "A chat ticket persists with status open, is found by fields.session_id, and holds its transcript in a chat_transcript comment with the body left free"
      entry_point: "apps/control-app/src/tickets.ts:productTypePack"
    - name: "Build-time resolution of the ticketing component"
      description: >
        `1c assets` writes src/generated/ticketing.js as an absolute re-export,
        exactly as REQ-146 does for the AI library, because a bare specifier
        resolves by walking up from the importing file — which finds the shared
        store from the main checkout and nothing from a linked git worktree.
      behaviors:
        - "ticketing.js and ticketing.d.ts are emitted into src/generated and reported as a named line in the asset report"
        - "The .d.ts declares an explicit export list rather than a wildcard, so an upstream rename fails typecheck rather than surfacing as undefined at first use"
        - "chatSchemas joins the AI component's export list, so the pack can import the chat half"
        - "A stale shared install (one predating the BlobStore port) is detected by the file the capability lives in — the package version is 0.0.0 and stays 0.0.0 — and reported as a named skip carrying the install command, never as an undefined constructor"
      entry_point: "tools/generate/src/cli/assets.ts:writeTicketingShim"
    - name: "Router env widening (no routes)"
      description: >
        RouterEnv extends TicketStoreEnv so the new bindings are part of the
        Worker's type program even though no route reaches them yet — a binding
        declared in wrangler.toml and absent from the type program is one
        nothing checks. No HTTP surface was added; REQ-161 owns /api/tickets/*.
      behaviors:
        - "The ticket store's bindings are typechecked as part of the Worker's env"
      entry_point: "apps/control-app/src/router.ts:RouterEnv"
```

## Coverage Map

```yaml
coverage_map:
  - feature: "The ticket schema, as migration 0003"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps:
      - "Nothing in the matrix mentions a ticket store, its schema, or tracking an upstream component's DDL"
      - "The shared tenants registry serving two stores, and the ALTER that makes it work, is undocumented"
    notes:
      - "AC-1398 (story-fde7370b) covers the SITE schema being applied before upload; it says nothing about a second migration or about what is in it"
  - feature: "ticketStoreFor(env) — the single wiring point"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps:
      - "Construction-time refusal on a missing blob binding; register-if-absent tenant bootstrap"
    notes:
      - "story-fde7370b's AC-a0ae39fd makes the analogous claim for the SITE store ('an unknown or inactive account is refused when the handle is asked for'). Same shape, different store — the argument transfers but the criterion does not, and the ticket store adds a refusal the site store has no equivalent of."
  - feature: "The tenant barrier, on rows"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps:
      - "Cross-tenant refusal on get, query and update for the ticket store"
    notes:
      - "story-fde7370b AC-84f710e2 states it for the site store's sites. The ticket store is a separate store over separate tables; asserting one proves nothing about the other, which is why this commit asserted it again."
  - feature: "Attachments, in a bucket of their own"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps:
      - "That a second bucket exists at all; that it must not be the bucket public-site serves; that bytes provably land in one and not the other"
    notes:
      - "story-d5167ced AC-1341 already asserts generically that every top-level binding is repeated under a named environment, found structurally — so BLOBS's repetition is covered generically. The REQ-162 static UATs re-pin it specifically, which is the pattern REQ-143 set for the site store's bindings. The DISCLOSURE claim (BLOBS != SITES) is covered nowhere and is the substance here."
  - feature: "The product type pack"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps:
      - "material, reference and brief; DOC-38 §9's field rules; the chat schemas sharing the pack"
    notes:
      - "capability-b4ac88fc (Site Materials & Starting Point) reads adjacent — it owns a site's asset inventory, font provenance and palette — but its subject is a site's own referenced bytes, not a tenant's source corpus in the ticket store. Judged a different bucket; flagged below as the one classification call worth a second look."
      - "story-a58a0974 / story-7f437d57 own the assistant conversation. No chat BEHAVIOUR changed here: the schemas are merged into the pack and proved to persist, and migrating live sessions is explicitly out of scope. Folded into the pack story rather than upgrading either chat story."
  - feature: "Build-time resolution of the ticketing component"
    status: partial
    existing_stories: ["story-a58a0974", "story-d5167ced"]
    existing_acs: ["acceptance_criterion-b9b99c29", "acceptance_criterion-58129be5", "acceptance_criterion-a1bf86b4"]
    gaps:
      - "The same claim for the ticketing component, plus staleness detection by capability file rather than by a version that never changes"
    notes:
      - "AC-1407 makes exactly this claim for the ASSISTANT library and is owned by the assistant's story; extending it would drag the ticket store into a story about conversation. AC-1427 (derived artifacts generated before typecheck) and AC-a1bf86b4 (preflight reports every shared component) still hold unchanged. Folded into item 1 as the mechanism that makes the store reachable at all."
  - feature: "Router env widening (no routes)"
    status: covered
    existing_stories: []
    existing_acs: []
    gaps: []
    notes:
      - "A type-program widening with no runtime behaviour and no route. Not a plan item; it is carried implicitly by item 1's bindings."
  - feature: "REQ-143's bucket assertion, repaired"
    status: partial
    existing_stories: ["story-fde7370b"]
    existing_acs: ["acceptance_criterion-24cd21ca"]
    gaps:
      - "'the same bucket' is singular and is falsified by a second bucket correctly declared"
    notes:
      - "Item 4. The claim is unchanged in intent; only its quantifier moves."
```

## Plan Items

| # | Component | Type | Points | Deps | Description |
|---|-----------|------|--------|------|-------------|
| 1 | Product Ticket Store | feature | 3 | - | Migration 0003 pinned against the component's SCHEMA_STATEMENTS and the shared `tenants` registry reconciled; `ticketStoreFor` refusing at construction and registering the tenant only if absent; the tenant barrier on rows; build-time resolution of the component from any checkout |
| 2 | Material Blob Storage | feature | 2 | 1 | Attachments through the wired store; bytes in `1stcontact-material` and provably not in the bucket public-site serves; per-tenant content addressing; the binding declared in both wrangler halves |
| 3 | Material Types | feature | 3 | 1 | `material`, `reference`, `brief` with DOC-38 §9's rights and provenance block — enums closed, `republishable`/`exportable` required, `source_url` required where the material came from somewhere — plus the chat and attachment schemas sharing one pack |
| 4 | Cloudflare Site Store | upgrade | 1 | 2 | AC-1398 generalised from 'the same bucket' to per-binding pairing, which is what it always meant |

**Totals**: 4 items (feature: 3, upgrade: 1), 9 points.

## FC test coverage

The injected `fc_tests` list was empty; the detector globs `test_UAT_FC_*.py` and this repository is TypeScript. Two FC files are on disk and are treated as binding evidence:

- `tests/test_UAT_FC_REQ-162_ticket_store.workers.test.ts` — 15 UATs in workerd against real D1 and both real R2 buckets. Items 1 (5: read-back through two handles, tenant registration, both construction refusals, cross-tenant read, cross-tenant write), 2 (3: attach/attachments, bytes in BLOBS and not SITES, cross-tenant blob addressing), 3 (7: pack contents, §9 fields on both types, bad enum, required booleans, `required_when` source_url, brief, chat session + transcript comment).
- `tests/test_UAT_FC_REQ-162_ticket_store_bindings.test.ts` — 7 static UATs. Items 2 (4: BLOBS declared, repeated under production, same bucket both halves, not the public-site bucket) and 1 (3: migration found beside the existing two, tenants reconciled, SCHEMA_STATEMENTS fully present).

`tests/test_UAT_FC_REQ-143_store_bindings.test.ts`'s modified case (`the two halves name the same database and buckets`) is item 4's evidence.

Every FC UAT maps to exactly one item; none is left for `check_fc_orphans` to find.

## Intent scope vs implementation footprint

**Case 1 for the bulk of it** — the diff is the ticket's four deliverables and nothing beyond them. No HTTP routes were added, ingestion creates nothing, and no chat session was migrated, all as the body's out-of-scope section says.

**Case 2 for one file** — `tests/test_UAT_FC_REQ-143_store_bindings.test.ts` was modified, and the ticket declares that explicitly under *Collateral*: the file-wide `bucket_name` count was the same claim while SITES was the only bucket and became wrong once a second was added correctly. This is knowing supersession of a prior intent's assertion, so it is item 4 rather than a silent regression note. `apps/control-app/src/router.ts` (RouterEnv widened, no route) and `tests/support/d1-site-factory.ts` (0003 added to MIGRATIONS) are both declared in the ticket's implementation notes.

**No Case 3.** Nothing in the diff touches an area whose owning intent is silent about it.

## Observations

- **Two stores, not one.** Everything the matrix currently says about storage is about the SITE store (capability-c4c7a854). Several of this commit's claims *rhyme* with existing site-store ACs — one account per handle, no operation takes an account, an unusable account refused at handle construction — and every one of them is a claim about different tables in a different store. Asserting the site store's isolation proves nothing about the ticket store's, which is why the commit asserted both barriers again against real D1 and real R2. Kept as new stories rather than as upgrades to story-fde7370b for that reason.
- **The one classification call worth a second look** is item 3 against capability-b4ac88fc (Site Materials & Starting Point). The names collide — 'materials', 'provenance' — but the subjects do not: CAP-89 owns what a *site* references and where those bytes came from (its scaffold, its asset registry, the repo's font licences), while `material`/`reference` are the *tenant's* source corpus feeding the assistant, tenant-scoped in D1 and R2 and never rendered. Classified feature under a new bucket; if the capability owner disagrees, item 3 converts to an upgrade cleanly because its ACs are self-contained.
- **Two claims here are load-bearing and were mutation-tested rather than argued.** Wiring the blob store to SITES fails the disclosure UAT; dropping the `ALTER TABLE tenants ADD COLUMN config` fails 13 of the 15 workerd UATs. Both belong in the ACs as stated failure modes, not as implementation notes — they are the difference between a criterion and a comment.
- **AC-1341 already covers the environment repetition generically**, structurally, for every Worker and every binding kind. The REQ-162 static UATs re-pin it for BLOBS specifically, exactly as REQ-143 did for the store's bindings. That is duplication by an established convention rather than by accident; noted so the downstream AC for item 2 leads with the *separation* claim (which nothing else makes) rather than restating repetition.
- **AC-1427 says 'two of those artifacts'** while the generator now emits four. The criterion's actual claim — generation runs before typecheck so a fresh checkout builds — is unaffected, and the enumeration reads as illustrative of the browser artifacts. Left alone rather than manufactured into an upgrade; worth a glance the next time that story is opened.
- **An operator obligation the matrix cannot enforce**: `wrangler r2 bucket create 1stcontact-material` must run before the next production deploy. Miniflare conjures the bucket locally and Cloudflare does not, so its absence is invisible in every test and appears only in production. Recorded here because no AC can assert it.
- **The two version-bump commits carry no behaviour.** `2284bf4bbd` and `bc36b2cce9` move `package.json` 0.2.18 -> 0.2.19 -> 0.2.20 and produce no plan item.