---
uid: report-47493afa
id: REPORT-11181
type: report
title: 'Report: aligned_to_tip for report-05835b4c'
created_by: xgd
created_at: '2026-11-07T21:49:33.085143+00:00'
updated_at: '2026-11-07T21:49:33.085143+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: aligned_to_tip
  subject_uid: report-05835b4c
  anchor_ticket: bundle-7988e925
  rule: ''
  batch_index: 0
  acs:
  - AC-2208
  ruling_reason: AC-2208 asks that a pipeline-stage migration backfill existing contacts
    by their invite stamp; the REQ-190 rebaseline folded every prior migration into
    0001_baseline.sql with pipeline_stage as a baseline column, and the bundle states
    the database was wiped rather than migrated, so no intent in scope requires a
    backfill and the reference has none to test.
  reference_ref: reconcile-src-BUNDLE-38
  tip_evidence:
  - file: db/migrations/0001_baseline.sql
    lines: 419-449
    snippet: |-
      CREATE TABLE IF NOT EXISTS users (
        id             TEXT PRIMARY KEY,
        tenant_id      TEXT NOT NULL,
        -- THE ACCOUNT THIS CONTACT BELONGS TO (REQ-194). NOT NULL, because every
        -- contact belongs to one: `invitePerson` and `ensurePlatformOperator` mint an
        -- account alongside the person, so there is no row here that names none and no
        -- reader has a missing case to handle.
        --
        -- MANY-TO-ONE, DEFAULTING TO ONE-TO-ONE. v1 puts exactly one contact on each
        -- account and nothing adds a second — but a second is a `users` row carrying an
        -- `account_id` that already exists, which is why this is a column on the person
        -- rather than a person on the account. Adding the second person later is a row,
        -- not a migration, and that is the whole of what REQ-194 buys.
        --
        -- SO NOTHING MAY READ IT AS ONE-TO-ONE. A `LIMIT 1` over an account's people,
        -- or a foreign key pointing at a person where the payer is meant, is the defect
        -- this column exists to remove — see `provisionBusiness`, which writes a
        -- membership for EVERY person on the owning account.
        account_id     TEXT NOT NULL,
        status         TEXT NOT NULL DEFAULT 'active',
        -- Entry to a business without a membership (DOC-40 §6, REQ-185). The ownership
        -- half is `memberships.role`; these are two independent facts and are asked by
        -- two different readers.
        platform_operator INTEGER NOT NULL DEFAULT 0,
        tos_version    TEXT,
        tos_accepted_at TEXT,
        invited_at     TEXT,
        -- WHERE THE RELATIONSHIP STANDS (DOC-44 §4, REQ-188), stored and not derived
        -- from which timestamps happen to be set. No CHECK: the set grows, and adding
        -- a stage must be a code change rather than a migration.
        pipeline_stage TEXT NOT NULL DEFAULT 'lead',
  - file: apps/control-app/src/identity.ts
    lines: 1228-1260
    snippet: |-
      export async function ensurePlatformOperator(env: IdentityEnv, email: string): Promise<void> {
        const platformTenant = requirePlatformTenant(env)
        const normalised = normaliseEmail(email)
        if (normalised === '') throw new Error('A platform operator needs an email address.')
        const now = new Date().toISOString()

        // The business itself, in case this is a database being brought up from empty.
        // `forTenant` refuses an unregistered tenant, so a membership pointing at one
        // would be a row that can never be used — and `businessesFor`'s join drops it,
        // so the operator would be refused `no_membership` with the row sitting there.
        //
        // THE NAME IS NOT THE ID ([[REQ-190]]). It used to be `name: platformTenant`,
        // which was harmless while `TENANT_ID` was the word `1stcontact` and is a
        // business called `biz_51a6…` now that it is a key. The baseline seeds this
        // row with its real name; `INSERT OR IGNORE` leaves that alone, and this
        // constant is only what an empty database would otherwise be left showing.
        await d1r2SiteStore(env).createTenant({ id: platformTenant, name: PLATFORM_BUSINESS_NAME })

        // The person, and their address, which are one fact in two rows ([[REQ-191]]).
        //
        // THE ID IS RESOLVED FIRST AND THEN BOUND, where this used to be an
        // `INSERT ... WHERE NOT EXISTS` over `users.email`. There is no address on
        // `users` to test any more, and the two rows have to agree on a key that is
        // minted in JavaScript — so the existence question is asked once, of the table
        // that now answers it, and both inserts are bound to the same id. They go as a
        // BATCH: a person written without an address is a person nothing can find,
        // which is worse than the write having failed.
        //
        // IT IS STILL IDEMPOTENT, which is the property that matters here — every
        // admission by a holder runs this function, so "cheap when there is nothing to
        // do" is a requirement. A concurrent second run loses to
        // `idx_user_emails_tenant_email` rather than producing a second person, which
        // is the same outcome the old `WHERE NOT EXISTS` had against its index.
  intent_ticket: bundle-7988e925
  intent_sentence: There is no separate migration, because the database has been wiped
    rather than migrated and a baseline that has never been applied is not re-based
    by editing it.
  tests:
  - story-0ea74f39 — the one-time pipeline backfill test_UAT_AC2208_existing_contacts_backfilled_by_invite_stamp_and_operator_seeded_invited
---

## Aligned to running code (REQ-895)

AC-2208 asks that a pipeline-stage migration backfill existing contacts by their invite stamp; the REQ-190 rebaseline folded every prior migration into 0001_baseline.sql with pipeline_stage as a baseline column, and the bundle states the database was wiped rather than migrated, so no intent in scope requires a backfill and the reference has none to test.

- **ACs retired or rewritten**: AC-2208
- **Failing tests covered**: story-0ea74f39 — the one-time pipeline backfill test_UAT_AC2208_existing_contacts_backfilled_by_invite_stamp_and_operator_seeded_invited
- **Tip evidence** (read at `reconcile-src-BUNDLE-38`):
  - `db/migrations/0001_baseline.sql` lines 419-449
  - `apps/control-app/src/identity.ts` lines 1228-1260
- **Intent** `bundle-7988e925`: "There is no separate migration, because the database has been wiped rather than migrated and a baseline that has never been applied is not re-based by editing it."
