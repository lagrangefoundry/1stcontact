-- REQ-192 — the development fixture. The DOC-42 §1 cast, as rows.
--
-- WHAT THIS IS FOR. REQ-190 replaced nine migrations with one baseline and wiped
-- the database rather than migrating it, so a fresh clone comes up with a schema
-- and no people and there is nothing in the builder to look at. What used to be
-- in the local D1 arrived from a migration that has since been deleted, a test
-- fixture, and a series of `wrangler d1 execute` statements typed into a terminal
-- during CHAT-23 — none of it repeatable, none of it written down. This file is
-- the written-down version, and `bin/seed` applies it.
--
-- IT IS NOT A MIGRATION AND MUST NEVER BE ONE. `db/migrations/` is applied to
-- every environment forever, which is exactly the defect REQ-190 removed from
-- `0005_operator_membership.sql`: one personal address baked into a path that
-- runs in production. This file sits beside the migrations and runs only when
-- somebody types `bin/seed`, which is local by default and needs `--remote` said
-- out loud.
--
-- IT IS DIRECT SQL, AND THAT IS A DECISION RATHER THAN A SHORTCUT (REQ-192,
-- amended 2026-09-06). The ticket originally required the seed to go through the
-- product's own entry points — the invite, `provisionBusiness`, `openGrant` — on
-- the argument that a seed which succeeds is then evidence those paths work. The
-- argument is right and the price is wrong: it buys a two-phase command needing a
-- running Worker, a minted Access token, a bootstrapped operator and an
-- in-process D1 binding held by a second process, all so that a laptop fixture
-- can be written once. Evidence about a route belongs in that route's own suite,
-- and REQ-180, REQ-186 and REQ-188 each have one. What is left here is data.
--
-- THE KEYS ARE FIXED, WHICH IS WHERE THIS FILE PARTS COMPANY WITH THE BASELINE.
-- `0001_baseline.sql` requires every primary key to be 128 bits from a CSPRNG,
-- and these were: minted once with `newId`, then written down. It is the MINTING
-- that is fixed, not the shape — the values still carry no meaning, are still
-- never parsed, and still say which table they came from. Fixing them is what
-- makes `INSERT OR IGNORE` the whole of this file's idempotence: with random ids
-- every statement would need a `WHERE NOT EXISTS` naming the columns that make
-- the row a duplicate, and `entitlements` deliberately has no unique index to
-- name (see the baseline's header on that table).
--
-- IT SEEDS NO PLATFORM OPERATOR, and that absence is load-bearing. REQ-185's
-- `PLATFORM_ADMINS` writes the tenant, the user, the address, the membership and
-- the entitlement from configuration at admission time, without hardcoding
-- anybody. Two ways to create the same rows is the legacy path CLAUDE.md forbids,
-- so there is one, and it is not this file. Nothing below sets
-- `platform_operator` or writes a membership on the deployment's own business.
--
-- NO SITES ARE SEEDED. These are identity fixtures, not a demo corpus: the
-- businesses come up empty and `1c push <slug>` puts a site in one. The `xgd`
-- site lives in the file-backed store at `storage/sites/xgd/` and is restored the
-- same way, which is why CHAT-23's wipe did not lose it.

-- ---------------------------------------------------------------------------
-- The businesses
-- ---------------------------------------------------------------------------
--
-- THREE, ALL ALICE'S, AND THE THIRD IS THE POINT. One business would exercise
-- nothing the deployment's own business does not. The second is REQ-178's
-- several-businesses-per-account, which is the case that deleted the singular
-- `accountId`. The third has a grant that ended, which is the state DOC-42 §10.1
-- made reachable and nothing a human looks at currently covers — a business
-- present in the switcher that cannot be opened.
--
-- The deployment's OWN business is not created here. `0001_baseline.sql` seeds
-- it, because `TENANT_ID` names it and `forTenant` refuses an unregistered
-- tenant. Seeding it twice would be the duplication this file's header refuses.
INSERT OR IGNORE INTO tenants (id, name, status, config, created_at) VALUES
  ('acct_c1f0a4b7e2d84936ab5107cc9e3f2d61', 'Alice''s Plumbing', 'active', '{}',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('acct_7b93de5140fa4c28bd06e91a7c4f83b2', 'Alice''s Lettings', 'active', '{}',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('acct_2e58ca6f9d074b13a8fe30dd51b6947c', 'Alice''s Old Salon', 'active', '{}',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

-- ---------------------------------------------------------------------------
-- The people
-- ---------------------------------------------------------------------------
--
-- ALICE'S ROW LIVES IN THE DEPLOYMENT'S OWN BUSINESS AND SHE HOLDS NO MEMBERSHIP
-- ON IT. That pairing is DOC-42 §4's correction stated as data: an earlier draft
-- mapped "may log in" onto `memberships`, and the schema says otherwise —
-- `tenant_id` is where a person is KNOWN, memberships are what they may OPERATE,
-- and Alice is known to 1st Contact while operating only her own businesses. A
-- seed that gave her a membership here would make the wrong reading pass.
--
-- THE OTHER THREE ARE ALICE'S PLUMBING'S OWN PEOPLE, and they differ from each
-- other only in which stamps are set. That is the whole of DOC-44 §3's two axes
-- written out: contacts and members are one population (DOC-40's reason for one
-- table), access is `tos_accepted_at` and pipeline is `pipeline_stage`, and the
-- two are independent — so these are states rather than stages of one sequence.
-- A fixture holding only Bob would let a single three-valued reading pass
-- unnoticed, which is the shape REQ-188 had to correct.
--
--   Bob    invited, and came    — `invited` + terms accepted
--   Carol  invited, never came  — `invited`, no terms. REQ-188's middle state
--   Dave   never invited        — `lead`, no `invited_at`. The Contact state
--
-- NONE OF THE THREE CAN SIGN IN TO THE BUILDER, and that is the product's answer
-- rather than a defect in the fixture. `admit` resolves a person against the
-- deployment's own business, so a row in Alice's Plumbing gets `no_user` — Bob's
-- login reaches no app because Alice's Plumbing does not have one (DOC-42 §1).
-- They are here to be looked at in Alice's Users tab and her CRM, and
-- `bin/access-sim` still offers them so the refusal is seen rather than assumed.
--
-- NO MEMBERSHIPS AND NO ENTITLEMENTS FOR ANY OF THEM. The Portal is what
-- membership IS (DOC-42 §5), and a grant here would be that section's named
-- falsifier — an entitlement row created for every member and revoked for none.
--
-- `tos_accepted_at` IS SET FOR ALICE AND BOB, which is what makes them members on
-- the access axis (DOC-44 §3) rather than merely known. Without it `guardTerms`
-- serves Alice the interstitial and refuses every API call behind it, so a
-- fixture that omitted it would look broken at the first click.
--
-- AND `tos_version` HAS TO BE THE CURRENT ONE. `needsAcceptance` compares the
-- stored version against `TERMS_VERSION`, not merely the presence of a stamp, so
-- a seed carrying an older string produces somebody who is signed up and still
-- refused — which reads as a broken fixture rather than as the re-acceptance it
-- actually is. `test_UAT_FC_REQ-192_seeded_members_have_accepted_the_current_terms`
-- pins the two together, because bumping the terms is exactly when this rots.
--
-- `created_at` IS WHEN EACH PERSON ENTERED THE SYSTEM, staggered rather than all
-- stamped `now`. It is the honest value, and it is also what gives the fixture a
-- stable order: `bin/access-sim`'s login list sorts by it, and four rows sharing
-- one timestamp come back in whatever order SQLite feels like — so the list of
-- people to sign in as would reshuffle between runs for no reason a reader could
-- see.
--
-- `first_seen_at` AND `last_seen_at` ARE LEFT NULL FOR EVERYBODY. `admit` stamps
-- them on the first request that reaches the door, and writing them here would
-- claim a visit that never happened — the one pair of fields in the row a seed
-- has no business inventing.
--
-- THE TENANT LITERAL BELOW IS `TENANT_ID` FROM `apps/control-app/wrangler.toml`.
-- Nothing about the value is derivable, so nothing could notice the two
-- disagreeing except a check that compares them, and
-- `test_UAT_FC_REQ-192_the_seed_names_the_configured_tenant` is that check.
INSERT OR IGNORE INTO users
  (id, tenant_id, status, platform_operator, tos_version,
   tos_accepted_at, invited_at, pipeline_stage, first_seen_at, last_seen_at,
   created_at, updated_at, fields)
VALUES
  ('usr_4a1cb8e07f3d492ea60b25d8fc19e73a',
   'acct_51a6746495c8057e886ff98d4208e6b9', 'active', 0,
   '2026-09-01', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-120 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-121 days'), 'invited', NULL, NULL,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-121 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), '{}'),
  ('usr_b62f8d40a1e74c93bf5017ce8a2d6b39',
   'acct_c1f0a4b7e2d84936ab5107cc9e3f2d61', 'active', 0,
   '2026-09-01', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-20 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-21 days'), 'invited', NULL, NULL,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-21 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), '{}'),
  ('usr_07ce39b5f8a2416d9e40bc71d3ab8f52',
   'acct_c1f0a4b7e2d84936ab5107cc9e3f2d61', 'active', 0,
   NULL, NULL,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-14 days'), 'invited', NULL, NULL,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-14 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), '{}'),
  ('usr_d13a5e8c26f04b7793ca0f61e8b47205',
   'acct_c1f0a4b7e2d84936ab5107cc9e3f2d61', 'active', 0,
   NULL, NULL,
   NULL, 'lead', NULL, NULL,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), '{}');

-- THE ADDRESSES, AND ALICE HAS TWO (REQ-191).
--
-- THE SECOND ONE IS THE FIXTURE'S REASON FOR EXISTING, not decoration. REQ-191
-- moved the address off `users` precisely so that one human could hold several,
-- and the claim it makes is that the PERSON is the key: reached at either
-- address, Alice is the same `usr_4a1c…` row, holding the same three businesses.
-- Nothing reachable by clicking produces that state today, so without a seed it
-- is asserted by the schema and demonstrated by nothing.
--
-- `is_primary` IS 0 ON THE SECOND, which is the half that is easy to get wrong:
-- `idx_user_emails_one_primary` is a partial unique index, so two primaries is a
-- constraint violation and zero primaries is legal but shows the oldest address
-- instead. One flagged and one not is the state the detail panel is built to
-- render, and it is the one being seeded.
--
-- `alice@oldsalon.example` REFERS TO THE LAPSED BUSINESS BELOW, so the fixture
-- reads as one story: she traded as a salon, that grant ended, and the address
-- she signed up with is still hers. Nothing in the code relates the two — this is
-- prose, and it is here because a fixture nobody can hold in their head gets
-- edited into nonsense.
--
-- EVERY ADDRESS IS ALREADY CASEFOLDED. `user_emails.email` carries
-- `CHECK (email = lower(trim(email)))`, so an unnormalised literal here fails at
-- the write rather than quietly at somebody's next login.
INSERT OR IGNORE INTO user_emails
  (id, user_id, tenant_id, email, is_primary, created_at, updated_at)
VALUES
  ('eml_3f8a2c61d0e94b57ac82f19b6d40e735', 'usr_4a1cb8e07f3d492ea60b25d8fc19e73a',
   'acct_51a6746495c8057e886ff98d4208e6b9', 'alice@plumbing.example', 1,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-121 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('eml_c05d7e394ab8412f9673ba1ecd82605f', 'usr_4a1cb8e07f3d492ea60b25d8fc19e73a',
   'acct_51a6746495c8057e886ff98d4208e6b9', 'alice@oldsalon.example', 0,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('eml_86b1f0d2597c43ae8025ecb37f4a9d18', 'usr_b62f8d40a1e74c93bf5017ce8a2d6b39',
   'acct_c1f0a4b7e2d84936ab5107cc9e3f2d61', 'bob@example.com', 1,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-21 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('eml_2d94a7c8103e4b6fbe57018da6c3f92b', 'usr_07ce39b5f8a2416d9e40bc71d3ab8f52',
   'acct_c1f0a4b7e2d84936ab5107cc9e3f2d61', 'carol@example.com', 1,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-14 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('eml_59e0c31b7f2a48d6ba94ef073c81e072', 'usr_d13a5e8c26f04b7793ca0f61e8b47205',
   'acct_c1f0a4b7e2d84936ab5107cc9e3f2d61', 'dave@example.com', 1,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

-- ---------------------------------------------------------------------------
-- The names (REQ-193)
-- ---------------------------------------------------------------------------
--
-- FOUR PEOPLE, FOUR DIFFERENT SHAPES OF NAME, because a fixture where everybody
-- is `Firstname Lastname` demonstrates one row of the table seven times and
-- proves nothing about the six columns that are allowed to be empty.
--
--   Alice — the full record, and the one the operator curated. A title she
--           actually holds, a `known_as` that is not derivable from the parts,
--           and a former name below.
--   Bob   — `known_as` doing its real job: nobody alive calls Robert Robert.
--   Carol — a MONONYM. No given name, no family name, and the acceptance
--           criterion that a required `family_name` would have made
--           unrepresentable.
--   Dave  — parts and no `known_as`, so the greeting falls through to
--           `given_name` and the fallback chain is exercised by the fixture
--           rather than only by a test.
--
-- `display_name` IS AUTHORED AND NOT ASSEMBLED. Alice's reads `Dr Alice Nowak`
-- because that is what she is shown as; nothing concatenates `title` onto the
-- parts to produce it, and Carol's proves the concatenation is not happening.
--
-- `superseded_at` IS NULL ON ALL FOUR — these are the current names, one per
-- person, which the partial unique index requires.
INSERT OR IGNORE INTO user_names
  (id, user_id, display_name, known_as, title, given_name, middle_names,
   family_name, suffix, created_at, updated_at, superseded_at, superseded_reason)
VALUES
  ('nam_18c74e0b39a5426fbd82071ea6c53d94', 'usr_4a1cb8e07f3d492ea60b25d8fc19e73a',
   'Dr Alice Nowak', 'Ali', 'Dr', 'Alice', 'Maria', 'Nowak', NULL,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-90 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
   NULL, NULL),
  ('nam_6a2f95d3081b47ce9d4207fb1e8c360a', 'usr_b62f8d40a1e74c93bf5017ce8a2d6b39',
   'Robert Fenwick', 'Bob', NULL, 'Robert', NULL, 'Fenwick', NULL,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-21 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
   NULL, NULL),
  ('nam_c397be5024fd41a8b60e7cf9251d83a6', 'usr_07ce39b5f8a2416d9e40bc71d3ab8f52',
   'Carol', NULL, NULL, NULL, NULL, NULL, NULL,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-14 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
   NULL, NULL),
  ('nam_45b0e8137c9a46d2ae51cf30d7629b84', 'usr_d13a5e8c26f04b7793ca0f61e8b47205',
   'Dave Okonkwo', NULL, NULL, 'Dave', NULL, 'Okonkwo', NULL,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
   NULL, NULL);

-- THE HISTORY, AND IT IS THE POINT OF THE TABLE.
--
-- ALICE HAS TWO SUPERSEDED ROWS AND THEY ARE NOT THE SAME KIND OF FACT, which is
-- the distinction nothing reachable by clicking produces today:
--
--   `changed`   — she was Alice Kowalczyk. A real former name: searchable, and
--                 drawn in the list as *formerly Alice Kowalczyk*. Searching the
--                 Users tab for `Kowalczyk` finds her, and that is only true
--                 because history is a table rather than an audit log.
--   `corrected` — `Alise Nowak`, a typo somebody fixed at the keyboard. Kept for
--                 audit, and it must NOT appear in either place. If a seeded
--                 search for `Alise` ever starts returning her, the filter has
--                 regressed in exactly the direction that surfaces a deadname.
--
-- ONE SUPERSEDED ROW HAS A NULL REASON — Bob's `Robert Fennwick` — because a
-- supersession recorded with no reason at all is read as a correction, and the
-- default is worth having a fixture for. It is unsearchable and undisplayed for
-- the same reason the explicit correction above is.
--
-- SUPERSEDED ROWS CARRY THE SAME `user_id` AND A DIFFERENT `id`. That is the
-- claim the table exists to make: a name changing moves no key, so every
-- membership, entitlement and address still points at the same person.
INSERT OR IGNORE INTO user_names
  (id, user_id, display_name, known_as, title, given_name, middle_names,
   family_name, suffix, created_at, updated_at, superseded_at, superseded_reason)
VALUES
  ('nam_92e14ab7c50d43f6893b2ce07fa1685d', 'usr_4a1cb8e07f3d492ea60b25d8fc19e73a',
   'Alice Kowalczyk', NULL, NULL, 'Alice', 'Maria', 'Kowalczyk', NULL,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-121 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-95 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-95 days'), 'changed'),
  ('nam_7d3c60fa298e4b15a7e01db64c93f280', 'usr_4a1cb8e07f3d492ea60b25d8fc19e73a',
   'Alise Nowak', NULL, 'Dr', 'Alise', 'Maria', 'Nowak', NULL,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-95 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-90 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-90 days'), 'corrected'),
  ('nam_0b58fe2a4c67419d83ba15e70cd249f3', 'usr_b62f8d40a1e74c93bf5017ce8a2d6b39',
   'Robert Fennwick', NULL, NULL, 'Robert', NULL, 'Fennwick', NULL,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-21 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-20 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-20 days'), NULL);

-- ---------------------------------------------------------------------------
-- What Alice may operate
-- ---------------------------------------------------------------------------
--
-- Owner on all three, which is what lets her invite into them: `ownsBusiness`
-- reads `memberships.role` off the admission, and the invite gate is that
-- function and emphatically not `ownsPlatformBusiness` (DOC-42 §7).
--
-- `granted_at` IS ORDERED DELIBERATELY. `businessesFor` sorts by it and
-- `resolveScope` with no target answers with the first SELECTABLE business, so
-- the offsets below decide which business Alice lands in when she signs in with
-- no `/b/<id>/` prefix. Plumbing is first because it is the one DOC-42 §1 names.
INSERT OR IGNORE INTO memberships
  (id, user_id, business_id, role, status, granted_by, granted_at, expires_at, revoked_at)
VALUES
  ('mem_9d20fb6c48e7415f8a3e1c07b95da2f4', 'usr_4a1cb8e07f3d492ea60b25d8fc19e73a',
   'acct_c1f0a4b7e2d84936ab5107cc9e3f2d61', 'owner', 'active', 'dev-seed',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-90 days'), NULL, NULL),
  ('mem_5c7e13a9f0b64d82be91470ac6d3f85e', 'usr_4a1cb8e07f3d492ea60b25d8fc19e73a',
   'acct_7b93de5140fa4c28bd06e91a7c4f83b2', 'owner', 'active', 'dev-seed',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-60 days'), NULL, NULL),
  ('mem_e84f2b071da54c69ac30fd5be2917c6d', 'usr_4a1cb8e07f3d492ea60b25d8fc19e73a',
   'acct_2e58ca6f9d074b13a8fe30dd51b6947c', 'owner', 'active', 'dev-seed',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days'), NULL, NULL);

-- THE GRANTS, AND THE THIRD IS WHY THIS FILE EXISTS.
--
-- Two open-ended, one that ended a week ago. Membership admits and entitlement
-- does not (DOC-42 §4, §5), so the Old Salon leaves Alice signed in with a
-- business she can see and cannot open — `selectable` false, and `lapseFor`
-- explaining why.
--
-- `revoked_at` IS NULL ON THE LAPSED ONE. Expiry and revocation are different
-- acts with different remedies — one is fixed by paying and the other by talking
-- to us — and `lapseFor` reports them apart. A fixture that conflated them would
-- leave one of those branches untested by inspection.
--
-- `account_id` IS NULL ON ALL THREE, which is the grant `provisionBusiness`
-- writes: a per-business capacity with no subject (REQ-184). It is an empty chair
-- and is correctly labelled as one — REQ-194 is what fills it. There is no
-- `email` column to name a subject by any more (REQ-191): a grant says whose it
-- is by key or not at all.
INSERT OR IGNORE INTO entitlements
  (id, business_id, account_id, plan, source, status, starts_at, ends_at,
   revoked_at, subscription_ref, granted_by, note, created_at, updated_at)
VALUES
  ('ent_1f6bd903c5a8427e91d47ab0e836c2f5', 'acct_c1f0a4b7e2d84936ab5107cc9e3f2d61',
   NULL, 'pro', 'admin_grant', 'active',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-90 days'), NULL, NULL, NULL, 'dev-seed',
   'Development fixture (REQ-192).',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('ent_a70c48eb2d914f35bc6810de9f27a3b1', 'acct_7b93de5140fa4c28bd06e91a7c4f83b2',
   NULL, 'pro', 'admin_grant', 'active',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-60 days'), NULL, NULL, NULL, 'dev-seed',
   'Development fixture (REQ-192).',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('ent_36e9051ac7bd48f2803e1b6ad5c4f907', 'acct_2e58ca6f9d074b13a8fe30dd51b6947c',
   NULL, 'pro', 'admin_grant', 'active',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days'),
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 days'), NULL, NULL, 'dev-seed',
   'Development fixture (REQ-192) — a grant that ended, so the business is present and unselectable.',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
