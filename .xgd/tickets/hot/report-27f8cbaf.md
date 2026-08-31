---
uid: report-27f8cbaf
id: REPORT-2999
type: report
title: 'Reconciliation Plan: BUNDLE-21 (BUG-36 + BUG-37 + BUG-38) — free-coded commits'
created_by: xgd
created_at: '2026-08-31T16:34:45.744832+00:00'
updated_at: '2026-08-31T16:39:41.651473+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-78f4e2fe
  anchor_uid: bundle-78f4e2fe
  items:
  - index: 1
    component: Cloud Site Store (D1 + R2 adapter)
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: The cloud store's refusal now names WHICH refusal it is in a form
      a program can act on (no such account vs. not active), and a repeated read of
      an unchanged draft no longer re-validates the whole definition — the assembled
      value is held per host process, keyed by account and site, and proven current
      by the site's own write version read live on every request.
    justification: 'Both behaviours are properties of the existing cloud-store adapter
      and land in tools/generate/src/store/d1r2-store.ts, inside STORY-121''s declared
      surface ("every storage question, answered by a database and an object store",
      plus its typed account refusal). No new capability bucket: the store already
      owns the account refusal (AC-1387) and already owns loadDraft as the answer
      to "what does this site''s draft assemble to". The memo is a change to how that
      same question is answered, not a second store, a second read path, or a new
      caller-facing verb — the only caller-visible additions are that a recreated
      or forgotten site never reads back a previous site''s assembled value, and that
      a write through another handle or another process is still seen. The refusal-reason
      half is a sharpening of AC-1387, which today only requires the two reasons be
      distinguishable in a human-readable message; the landed code makes the distinction
      machine-readable because a caller that owns the deployment configuration may
      legitimately resolve ''unknown'' and may never resolve ''inactive''. Documenting
      only the message would leave the safety argument for item 2''s bootstrap unstated
      in the matrix.'
    story_uid: story-fde7370b
    target_story_ids:
    - story-fde7370b
    intent_delta_summary: STORY-121 gains a criterion that repeated reads of an unchanged
      draft do no redundant validation work while remaining current against a live
      version read (including across processes), and that the retained value cannot
      outlive or be misattributed to the site it describes. AC-1387 is sharpened so
      the two account refusals are distinguishable by a caller programmatically, not
      only by a reader. Nothing previously claimed is withdrawn.
    acceptance_criteria_changes:
      add:
      - 'Reading an unchanged draft repeatedly assembles it once: the site''s write
        version is read from the database on every read and is what decides reuse,
        so a write made through any other handle or process is seen on the next read,
        and a draft that has not moved costs no re-validation.'
      - 'The retained assembled value cannot outlive or be misattributed to its site:
        forgetting a site drops it, a read of a site the store no longer holds drops
        it, and two accounts holding a site of the same name never see each other''s.'
      modify:
      - 'AC-1387 — an unknown or inactive account is refused when the handle is asked
        for: extend so the typed refusal carries the reason as a value a caller can
        branch on, not only as distinguishable prose. Registering an unregistered
        account is a decision a caller may make; reopening a deactivated one is not,
        and a caller cannot tell them apart from a message.'
      remove: []
  - index: 2
    component: Builder Workspace Origin — deployment bootstrap
    item_type: upgrade
    story_points: 2
    dependencies:
    - 1
    description: A freshly deployed workspace serves rather than failing. The deployment
      registers the one account its own configuration names, on the first read that
      needs it, through the single store opener every route now uses — the separate
      import-only opener is gone. A deployment that names no account is still a configuration
      failure, and an account that exists and is deactivated is still refused.
    justification: 'This directly supersedes half of an existing criterion of STORY-99
      (Builder Workspace): AC-965 asserts that a deployment naming an account the
      store does not hold is reported as an explanatory failure. The landed code makes
      that case serve instead, deliberately — it is the state every new deployment
      and every new database is in, and reporting it was the outage. The other two
      cases AC-965 covers (no account named; account named but inactive) are unchanged,
      so this is a modification of an existing criterion inside an existing capability
      bucket, not a new one. AC-1402 (the copy path runs through the same store the
      workspace serves from) is now literally true where it previously described two
      openers, and is worth restating rather than leaving as an accident. No new screen,
      route or command is introduced: the import route lost its private opener and
      joined the one that already existed.'
    story_uid: null
    target_story_ids:
    - story-e674c60a
    intent_delta_summary: AC-965 is narrowed to the two cases that are still failures
      and gains a companion criterion for the case that is now a successful cold start.
      AC-1402 is restated so 'the same store the workspace serves from' names a single
      opener rather than describing a coincidence.
    acceptance_criteria_changes:
      add:
      - 'A workspace deployed against a database holding only the schema serves: the
        first read that needs the store registers the one account the deployment''s
        own configuration names, the site list answers successfully and empty rather
        than as a service failure, and exactly that account exists afterwards and
        no other.'
      modify:
      - 'AC-965 — remove the ''names an account the store does not hold'' case, which
        now succeeds, and keep the two that remain distinct failures: a deployment
        naming no account reports the missing setting, and a deployment naming an
        account that exists and is deactivated is refused and stays deactivated. The
        criterion''s load-bearing properties (the failure keeps its own status, and
        is never confused with a refused caller) are unchanged.'
      - AC-1402 — state that the copy path opens the store through the same single
        opener as every other route, so the account registration is not something
        only an import can perform.
      remove: []
  - index: 3
    component: Operator Access Gate — automation credential
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: Automation can actually reach the gated builder. The push command
      presents a service token as the client-id/client-secret pair the gateway accepts,
      never the assertion header the gateway itself sets on the forwarded request;
      half a credential is refused before a request is sent; a bounce to the sign-in
      page is reported as an authentication refusal rather than surfacing as a parse
      error; and the token is provisioned by a documented command that persists no
      secret and records the granted identity in the repository.
    justification: 'STORY-120 already owns ''only granted identities reach the builder,
      on every address it answers on'', and already admits an automation service identity
      (AC-1376) and requires the granted identities be recorded in the repository
      (AC-1384). What was missing is the other half of that same claim: what an automation
      caller must present to be admitted, and what it is told when it is not. That
      is the same capability bucket — who may reach the builder — approached from
      the client rather than from the gate, and it is not behind the gate, so it does
      not collide with the story''s out-of-scope boundary. No parallel credential
      path is introduced: the header that never worked against a deployed target is
      deleted rather than kept as a fallback, and there is one credential shape.'
    story_uid: null
    target_story_ids:
    - story-182e8cb9
    intent_delta_summary: STORY-120 gains the automation caller's side of admission
      — what is presented, what a partial or absent credential does, and how a redirect
      to the sign-in page is reported — plus the provisioning command that mints the
      identity AC-1384 records. AC-1376 is extended so the automation identity is
      stated as a pair the gateway exchanges, closing the gap that let a caller send
      the gateway's own forwarded assertion header and be silently bounced.
    acceptance_criteria_changes:
      add:
      - Pushing a site to a gated deployment presents the service token as the client-id
        and client-secret pair, and never the assertion header the gateway sets on
        the request it forwards; a push to a local, ungated origin sends no credential
        at all.
      - Half a credential is refused before any request is sent, naming both halves
        and the command that provisions them; the same refusal guards the production
        publish path before the first site moves, so a run cannot half-succeed.
      - 'A push that is bounced to a sign-in page is reported as an authentication
        refusal naming the credential to set: the redirect is not followed, and neither
        a redirect status nor an opaque response is allowed to read as success.'
      - The provisioning command mints or rotates the service token from an API credential,
        ensures the deployment's access application carries a policy including it,
        prints the secret once and writes it nowhere in the repository.
      modify:
      - AC-1376 — state the automation service identity as the credential pair the
        gateway exchanges for the forwarded assertion, so 'accepted from an automation
        service identity' cannot be read as accepting the assertion header from a
        client.
      remove: []
  - index: 4
    component: Platform Deploy Configuration — invocation logs
    item_type: upgrade
    story_points: 1
    dependencies: []
    description: The operator surface retains a log of every invocation, declared
      at the top level and repeated for the named production environment, with no
      sampling — and the declaration is placed so that it cannot silently swallow
      the production route it is written beneath.
    justification: 'STORY-119 already owns the deployment-configuration rule that
      a named environment repeats every top-level declaration (AC-1341), and already
      owns the class of failure this belongs to: configuration that is wrong only
      under the production environment, failing silently. This extends that rule to
      a key that is on the tool''s inheritable list — the repeat is redundant today
      and is written anyway, which is the rule stated rather than a new one — and
      adds the retention requirement itself, whose absence is what made this bundle''s
      own diagnosis an inference chain instead of a log read. No new capability bucket:
      this is a property of the same configuration files and the same check surface.
      It is one point because it is one declaration with one placement hazard, not
      a subsystem.'
    story_uid: null
    target_story_ids:
    - story-d5167ced
    intent_delta_summary: STORY-119 gains a criterion that the operator surface's
      invocation logs are retained unsampled and declared for every environment it
      deploys to, including the placement property that keeps the declaration from
      capturing the route list above it. AC-1341's rule is restated to cover inheritable
      keys explicitly rather than implicitly.
    acceptance_criteria_changes:
      add:
      - 'The operator surface retains every invocation''s log: retention is declared
        at the top level and again for the named production environment, with no sampling,
        and the production declaration is placed after that environment''s bare keys
        so the production route survives it — asserted against the parsed configuration,
        because the broken form still parses and still deploys.'
      - 'The retention declaration is not a binding: it does not join the set of bindings
        the environment-repetition check counts.'
      modify:
      - AC-1341 — state that the repetition rule covers every top-level declaration
        including ones the tool would inherit, so the rule does not depend on anyone
        remembering which keys inherit.
      remove: []
  - index: 5
    component: AI Site Assistant — session resolution
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: A conversation identifier resolves against durable, account-scoped
      storage rather than against whatever the process that issued it happened to
      remember, so a turn runs on a host process that never opened the session and
      the transcript continues as one conversation across processes. An identifier
      naming no site the account holds is still refused, and starts nothing.
    justification: 'STORY-103 already owns what a conversation identifier is, what
      refusing one means (AC-1055) and the claim that the same host serves the conversation
      from the operator''s machine and from the deployed edge runtime over one session
      model. The landed code does not add a capability — it makes an existing claim
      true where it was false, and in doing so contradicts AC-1055''s own verification,
      which requires that an identifier of the form the origin derives for an EXISTING
      site be refused. That is now the accepted case, deliberately: it is the only
      thing a client holds between two requests. The authority property AC-1055 exists
      to protect survives and is strengthened, so this is a modification of an existing
      criterion, not a new bucket. No parallel resolution path: the per-process registry
      is deleted rather than kept as a fast path.'
    story_uid: null
    target_story_ids:
    - story-a58a0974
    intent_delta_summary: 'AC-1055''s authority test changes from ''this process issued
      it'' to ''it names a site this account holds'', which is what makes the existing
      cross-host claim hold. A companion criterion asserts the property the change
      bought: a turn runs, and the conversation continues as one transcript, on a
      host process that did not open the session.'
    acceptance_criteria_changes:
      add:
      - A turn runs on a host process that never opened the session, from the identifier
        the client is still holding and without re-opening, and successive turns served
        by different processes read back afterwards as one conversation in order.
      modify:
      - 'AC-1055 — restate the refusal as ''the identifier does not name a site this
        account holds'': an identifier of the form the origin derives for a site that
        exists resolves and is answered, while a fabricated identifier, one naming
        no such site, one with no derivable site, and one carrying path-traversal
        characters are each refused as a plain answer that starts no conversation,
        creates no transcript and writes no site. The refusal is now made against
        storage and is account-scoped, which a per-process registry could not check
        at all.'
      remove: []
---

# Reconciliation Plan — BUNDLE-21 (BUG-36 + BUG-37 + BUG-38)

**Mode**: commits
**Anchor**: bundle-78f4e2fe (BUNDLE-21)
**Source**: 5 free-coded commits on `reconcile-BUNDLE-21`

## Intent, as the operator stated it

Three independent production defects, bundled:

- **BUG-36** — a freshly deployed builder answered 503 to every read because nothing
  created the account row. Two store openers disagreed about whether the configured
  account existed; only the import route registered it, so the builder was dead until
  someone published from a laptop. Scope was then explicitly widened by the operator
  (approved 2026-08-23, recorded in the ticket body) to a second finding met while
  verifying the first: `bin/publish --production` could not authenticate at all,
  because it sent the header the gateway *sets on the forwarded request* rather than
  the credential the edge accepts.
- **BUG-37** — Edit mode returned Error 1102. The confirmed cause was the account's
  10 ms free-plan CPU ceiling against a ~78 ms preview request; the plan upgrade
  removed the outage. The ticket then closes the waste rather than the outage: ~95%
  of the request was re-validating the whole definition on every preview byte. A
  second defect (the router's dead render cache) is named and **deliberately not
  fixed** — re-keying it would read through an account check predating the request.
  Observability was added because its absence is why the diagnosis needed a billing
  page instead of a log line.
- **BUG-38** — every chat turn in the cloud answered "that conversation is no longer
  open", because the session-id-to-site binding lived in a module-level map and the
  two routes are two requests with no promise of the same isolate.

Declared scope boundaries the operator set, and this plan honours:

- The dead `PREVIEWS` cache stays dead. No plan item.
- `NODE_USE_ENV_PROXY` is a property of one caller's network, deliberately left out
  of `bin/publish`. No plan item.
- One REQ-149 assertion is knowingly superseded (see Step 3b below).

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded commits: ea48502d, 2058a164, 0fe586d1, 999579b3, 63df97c9"
  entry_files:
    - "apps/control-app/src/store.ts"
    - "apps/control-app/src/router.ts"
    - "apps/control-app/wrangler.toml"
    - "tools/generate/src/store/d1r2-store.ts"
    - "tools/generate/src/cli/push.ts"
    - "tools/generate/src/cli/index.ts"
    - "tools/generate/src/cli/builder.ts"
    - "tools/generate/src/cli/ai/host-core.ts"
    - "bin/publish"
    - "bin/access-token"
    - "apps/control-app/ACCESS.md"
  features:
    - name: "storeFor — the one store opener (BUG-36)"
      description: >-
        The Worker's per-request store opener registers the account named by its own
        TENANT_ID on the cold path and retries once. storeForImport is deleted and the
        router's importStore seam with it, so the import route opens the store exactly
        as every other route does. An unset TENANT_ID is still a configuration error
        with no name to register.
      behaviors:
        - "A database holding schema and no rows serves GET /api/sites as 200 [] rather than 503"
        - "Exactly one account exists afterwards — the configured one, active — and no other"
        - "An import lands on a fresh database through the same opener, not a private one"
        - "A deactivated account is still refused and is still deactivated afterwards"
        - "An unset/blank TENANT_ID is a configuration failure naming the setting"
        - "Warm path unchanged: one primary-key lookup, no write per request"
      entry_point: "storeFor (apps/control-app/src/store.ts)"
    - name: "UnknownTenantError.reason (BUG-36)"
      description: >-
        The store's account refusal carries a machine-readable discriminant,
        'unknown' or 'inactive', so a caller that owns the deployment configuration
        can heal the first and never the second. createTenant is INSERT OR IGNORE, so
        an inactive row would have survived a blind retry — the reason is checked
        explicitly rather than relied on to fail again.
      behaviors:
        - "A refusal for an unregistered account reports reason 'unknown'"
        - "A refusal for a deactivated account reports reason 'inactive'"
      entry_point: "UnknownTenantError (tools/generate/src/store/d1r2-store.ts)"
    - name: "Assembled-draft memo (BUG-37)"
      description: >-
        loadDraft holds the assembled (validated) draft per isolate, keyed
        (tenantId, slug), as { version, result }. siteRow still runs on every call and
        its version decides reuse; readPages + assembleSite are skipped on a hit. The
        map is REPLACED on a version change rather than accumulated, so it holds at
        most one entry per site. It caches data, never a handle, so forTenant still
        runs per request.
      behaviors:
        - "An unchanged draft is assembled once across repeated reads"
        - "A write bumps the version and invalidates the memo"
        - "A write through another handle or process invalidates it too — the check is a live read"
        - "Two accounts holding a site of the same name do not share a memo"
        - "forget(slug) drops the memo first; loadDraft of an absent site drops it too"
        - "The edit channel serves current bytes after a save"
        - "Measured: warm preview ~77ms -> 2-5ms CPU; 12-request burst 890ms -> 18ms"
      entry_point: "loadDraft / forget (tools/generate/src/store/d1r2-store.ts)"
    - name: "Invocation-log retention (BUG-37)"
      description: >-
        [observability] enabled with head_sampling_rate = 1, declared at the top level
        and again under [env.production] — redundant today because the key inherits,
        written anyway because losing it fails silently. The production table is
        placed AFTER routes, because a TOML table header ends the table above it.
      behaviors:
        - "Both declarations present; enabled twice; sampling rate 1 twice"
        - "The production route and name survive the new table (asserted on the parse)"
        - "The block declares no binding, so the environment-repetition binding count is unchanged"
      entry_point: "apps/control-app/wrangler.toml"
    - name: "Push credential (BUG-36, approved scope addition)"
      description: >-
        pushSite sends CF-Access-Client-Id and CF-Access-Client-Secret; the
        cf-access-jwt-assertion header is deleted, not kept as a fallback, because it
        never worked against a deployed target — it is what the gateway sets on the
        request it forwards. redirect is 'manual', so an unauthenticated push reports
        the bounce instead of parsing a login page as JSON.
      behaviors:
        - "The pair is sent; the assertion header is never sent"
        - "A local push sends no credential"
        - "Half a credential is refused before the request, naming both halves"
        - "A 3xx, or an opaque status 0, reads as an Access refusal naming the fix"
        - "The redirect is not followed"
        - "bin/publish refuses --production without both halves, before the first site moves"
        - "--token / CF_ACCESS_TOKEN removed; --client-id/--client-secret default from env"
        - "bin/access-token provisions and rotates from CLOUDFLARE_API_TOKEN, prints the secret once, writes none to disk"
      entry_point: "pushSite (tools/generate/src/cli/push.ts); bin/publish; bin/access-token"
    - name: "Durable session resolution (BUG-38)"
      description: >-
        The module-level minted map is deleted. A session id is resolved by stripping
        the derivable 'site-' prefix and confirming the slug against
        SiteStore.hasDraft — durable and account-scoped. openSession records nothing.
      behaviors:
        - "A turn runs on a process that never opened the session"
        - "Successive turns on different processes read back as one transcript, in order"
        - "An id naming no site, an unprefixed id, and a bare 'site-' are each refused"
        - "The authority check survives, made against storage rather than memory"
      entry_point: "slugForSession / streamPrompt (tools/generate/src/cli/ai/host-core.ts)"
    - name: "Version bump (999579b3)"
      description: "package.json 0.2.12 -> 0.2.13. Bookkeeping for the free-coded gate."
      behaviors: []
      entry_point: "package.json"
```

## FC tests found on disk

The prompt's `fc_tests` list arrived empty, but five FC files for this bundle's
tickets are present in `tests/` and are treated here as binding evidence. Every one
of their 28 assertions is claimed by an item below, so `check_fc_orphans` has a
formal AC to rename each into.

| FC file | UATs | Claimed by |
|---|---|---|
| `test_UAT_FC_BUG-36_tenant_bootstrap.workers.test.ts` | 5 | item 2 |
| `test_UAT_FC_BUG-36_publish_credential.test.ts` | 10 | item 3 |
| `test_UAT_FC_BUG-37_preview_assemble_memo.workers.test.ts` | 6 | item 1 |
| `test_UAT_FC_BUG-37_observability.test.ts` | 4 | item 4 |
| `test_UAT_FC_BUG-38_chat_session_survives_isolate_churn.workers.test.ts` | 3 | item 5 |

One mapping is worth stating: `..._tenant_bootstrap_..._a_deactivated_tenant_stays_refused`
is evidence for item 2's modified AC-965, and the discriminant that makes it hold is
item 1's sharpened AC-1387. That is the dependency recorded between them.

## Coverage Map

```yaml
coverage_map:
  - feature: "storeFor registers the configured account on the cold path"
    status: partial
    existing_stories: ["story-e674c60a"]
    existing_acs: ["AC-965", "AC-1402"]
    gaps:
      - "AC-965 asserts the OPPOSITE for the case that now succeeds: it requires a
         deployment naming an account the store does not hold to be reported as an
         explanatory failure. That is every fresh deployment, and reporting it was
         the outage."
      - "No AC states that a database holding only the schema serves, or that exactly
         the configured account and no other is registered."
      - "AC-1402 says the copy path runs 'through the same store the workspace serves
         from'. True today by coincidence of two openers; now true by construction."
    notes:
      - "Explicit supersession (Step 3b case 2): the operator's ticket names the
         REQ-149 assertion it retires and why."
  - feature: "UnknownTenantError carries a reason"
    status: partial
    existing_stories: ["story-fde7370b"]
    existing_acs: ["AC-1387"]
    gaps:
      - "AC-1387 requires only that the two refusals be distinguishable in their
         MESSAGE. A caller cannot branch on prose, and the whole safety argument for
         the bootstrap is that it heals one reason and never the other."
  - feature: "Assembled-draft memo"
    status: uncovered
    existing_stories: ["story-fde7370b"]
    existing_acs: ["AC-1033"]
    gaps:
      - "No AC in CAP-101 says anything about repeated reads of an unchanged draft,
         nor about anything retained between them."
      - "No AC covers the misattribution hazard the retention creates: a site
         recreated under the same slug restarts at version 0."
    notes:
      - "AC-1033 (a definition changed outside the workspace is shown on the next
         request) is the freshness property the memo must not break. It is the
         workspace's AC and is unchanged; the new criterion is its store-layer
         counterpart, including the cross-process case AC-1033 does not reach."
      - "Filed against CAP-101 rather than CAP-85 because the behaviour is entirely
         inside the store adapter and is asserted through the store, not the UI."
  - feature: "Invocation-log retention and its placement hazard"
    status: partial
    existing_stories: ["story-d5167ced"]
    existing_acs: ["AC-1341"]
    gaps:
      - "AC-1341 covers variables and bindings. Retention is neither — it is an
         inheritable key, which is exactly the case the rule's own justification
         ('nothing depends on remembering which keys inherit') was written for."
      - "No AC covers retention itself, nor the TOML ordering hazard that silently
         drops the production route."
  - feature: "Push presents a service-token pair; bounces read as refusals"
    status: partial
    existing_stories: ["story-182e8cb9"]
    existing_acs: ["AC-1376", "AC-1384"]
    gaps:
      - "AC-1376 says the gate ACCEPTS an automation service identity. Nothing says
         what a caller must PRESENT, which is how a client came to send the gateway's
         own forwarded assertion header and be bounced for a year of wall time."
      - "Nothing covers a partial credential, an unfollowed redirect, or provisioning."
    notes:
      - "Considered story-e674c60a (AC-1402 owns the copy path) and story-d5167ced
         (AC-1342 owns deploy secrets). Rejected both: the subject is who may reach
         the builder, which is CAP-3606e35b's whole claim, and STORY-120 already
         holds both the automation-identity AC and the repository policy record the
         provisioner writes into."
  - feature: "Session id resolves against the store"
    status: partial
    existing_stories: ["story-a58a0974"]
    existing_acs: ["AC-1055", "AC-1057"]
    gaps:
      - "AC-1055's verification explicitly requires that an identifier 'of the form
         the origin derives for an existing site' be REFUSED. That is now the
         accepted case and must be restated, or regression pins the bug."
      - "No AC asserts a turn survives the process that opened the session, which is
         the property the change bought and the one the outage was."
    notes:
      - "STORY-103 already claims one session model across the local and deployed
         hosts. The fix makes that claim true; it does not add a capability."
  - feature: "Version bump 0.2.13"
    status: covered
    existing_stories: []
    existing_acs: []
    gaps: []
    notes:
      - "No behaviour. No plan item, by design."
```

## Step 3b — Intent scope vs implementation footprint

**Case 2 (explicit supersession), twice, and both are named by the operator:**

1. `test_UAT_FC_REQ-149_publish_in_the_cloud.workers.test.ts` had a companion
   assertion that `GET /api/sites` under `TENANT_ID: 'nobody'` answers 503. The
   commit moves that probe to `TENANT_ID: ''`. In the matrix that assertion is
   AC-965's second case, which item 2 modifies. REQ-149's own claim — build artifacts
   serve without opening a store, carried by AC-1400 — is untouched, and the probe's
   companion property (deferring the store must not change what an unopenable one
   means) survives on the case that is still genuinely unopenable.
2. AC-1055's verification is contradicted by BUG-38 (item 5). The operator's ticket
   states the intent directly: the registry's authority job survives, made against
   storage instead of memory.

**Case 3 (code outside the declared intent): none found that needs absorbing.**
Every file in the five commits traces to a stated intent. Two deliberate
non-changes are recorded rather than reconciled:

- The router's `PREVIEWS` WeakMap is still dead, and BUG-37 argues at length for
  leaving it so. There is no behaviour to document and no AC should claim one.
- `NODE_USE_ENV_PROXY` was deliberately not baked into `bin/publish`.

**Commit 999579b3** is a `package.json` version bump with no behaviour, produced by
the free-coded gate. No plan item, deliberately — a story here would document
bookkeeping.

## Plan Items

| # | Component | Type | Points | Deps | Target story | Description |
|---|-----------|------|--------|------|--------------|-------------|
| 1 | Cloud Site Store (D1 + R2 adapter) | upgrade | 3 | - | story-fde7370b (STORY-121) | Refusal reason a caller can branch on; assembled draft held per process, current by live version read, bounded and never misattributed |
| 2 | Builder Workspace Origin — deployment bootstrap | upgrade | 2 | 1 | story-e674c60a (STORY-99) | One opener; a fresh deployment registers its own configured account and serves; unset stays a config error, deactivated stays refused |
| 3 | Operator Access Gate — automation credential | upgrade | 2 | - | story-182e8cb9 (STORY-120) | Push presents the service-token pair; half a credential and a sign-in bounce are legible refusals; provisioning writes no secret |
| 4 | Platform Deploy Configuration — invocation logs | upgrade | 1 | - | story-d5167ced (STORY-119) | Unsampled retention declared for every environment, placed so the production route survives it, counted as no binding |
| 5 | AI Site Assistant — session resolution | upgrade | 2 | - | story-a58a0974 (STORY-103) | An id resolves against account-scoped storage, so a turn runs on a process that did not open the session; an id naming no site is still refused |

**Totals**: 5 items — 0 feature, 5 upgrade — 10 story points.

## Observations

- **Every item is an upgrade, and that is the finding, not an accident of bias.**
  Three of the five bugs are a capability the matrix already claims failing to hold
  in the deployed runtime: the workspace claims it serves, the assistant claims one
  session model across both hosts, the gate claims it admits an automation identity.
  Each fix makes an existing claim true. The remaining two — the memo and log
  retention — are new properties of surfaces that already have stories. Nothing in
  these five commits introduces a capability bucket that did not exist.

- **Two existing ACs assert the behaviour these commits deliberately reversed.**
  AC-965 requires a named-but-absent account to be reported as a failure; AC-1055
  requires a well-formed identifier for an existing site to be refused. Left alone,
  regression would hold the matrix against the fix and pin both bugs. They are the
  two most important edits in this plan, and both are explicit supersessions the
  operator argued for in the ticket bodies rather than drift discovered here.

- **A judgement call: where the memo lives.** Its user-visible payoff is the edit
  channel responding promptly (CAP-85 / CAP-25f7e486 territory), but the behaviour
  is wholly inside the store adapter and every one of its six UATs drives the store
  or the Worker's own fetch. Filed against CAP-101, with the note that AC-1033 —
  the workspace's freshness criterion — is the property it must not break, and that
  the new criterion is its store-layer counterpart including the cross-process case
  AC-1033 does not reach.

- **A judgement call: the publish credential is an access-gate item, not a
  publish item.** It arrived in the same commit as the tenant fix and touches
  `push.ts`, so CAP-101's copy path (AC-1402) or CAP-102's secret mechanism
  (AC-1342) both look plausible. Neither is about identity. STORY-120 already owns
  both the automation-identity criterion and the repository policy record the
  provisioner writes into, and 'only granted identities reach the builder' is
  incomplete while nothing says what a granted automation caller presents.

- **Item 1 bundles two behaviours, and I considered splitting it.** The refusal
  reason is a one-field refinement; on its own it would be a 1-point item
  documenting almost nothing user-visible, which is the granularity inflation this
  process warns about. Both are properties of the same adapter answering the same
  storage questions, so they are one item against one story. The dependency from
  item 2 records why the refinement exists at all.

- **The FC test list arrived empty and was wrong.** Five FC files for this bundle's
  tickets are on disk with 28 UATs between them. They are treated as binding here.
  If the planner had trusted the empty list, `check_fc_orphans` would have failed
  the run at the far end with no formal AC to rename any of them into.

- **Uncertainty worth stating.** BUG-37's own confirmed root cause — the free-plan
  CPU ceiling — was resolved by an account upgrade, not by code, and nothing in this
  plan asserts it. That is correct: the matrix cannot hold a billing plan. What the
  plan does assert is the waste the ticket then removed, which is measurable in the
  Workers runtime and is what makes the ceiling irrelevant rather than merely
  raised. The superseded first hypothesis (memory exhaustion via the dead render
  cache) generates no criterion, deliberately — it was falsified by measurement.