---
uid: report-4af56400
id: REPORT-2342
type: report
title: 'Resync resolve conflicts: 7292af8f63220275216b82416fc441658a744e02'
created_by: xgd
created_at: '2026-08-20T03:12:48.660858+00:00'
updated_at: '2026-08-20T03:12:48.660858+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-db1949d9
---

## Files resolved

- `apps/control-app/wrangler.toml` — **UU**, config file, non-overlapping additions on
  both sides → **kept BOTH**. The conflict was confined to the tail of the file: HEAD
  (REQ-147, "Cloudflare Access gates the builder, twice") added `ACCESS_TEAM_DOMAIN` /
  `ACCESS_AUD` to `[env.production.vars]`; the incoming commit (REQ-143, the D1/R2
  SiteStore) appended `[[env.production.d1_databases]]` and `[[env.production.r2_buckets]]`.
  These touch different facts, so neither side wins — the resolution keeps HEAD's two
  Access vars inside the `[env.production.vars]` table and then opens the incoming's two
  array-of-tables blocks after them. Ordering matters in TOML: bare keys must precede the
  `[[...]]` headers or they would be reparented into the wrong table, so the composed
  order is the only correct one.

  Every other incoming hunk in this file (`migrations_dir`, the top-level `[[d1_databases]]`
  and `[[r2_buckets]]` blocks, and their comments) merged cleanly and is present.
  HEAD's `workers_dev = false` at both scopes — the REQ-147 security control — is also
  intact; the incoming side still carried `workers_dev = true`, and that hunk merged in
  HEAD's favour before the conflict region.

- `package.json` — **UU**, config file, **scalar** conflict on `version` alone → kept
  **HEAD's `0.1.59`**. The incoming commit bumps `0.1.52` → `0.1.53`; main has since
  moved to `0.1.59`, so the incoming value is stale bookkeeping rather than code, and
  taking it would move the version backwards. No other key conflicted. The staged result
  is byte-identical to HEAD, which is why the file no longer appears in `git status` —
  expected, not a lost resolution.

## Incoming changes preserved

Verified against `git show b71a8641182d62dd46b5fa6d0cf78a582cff4eb7 -- <file>`:

- `apps/control-app/wrangler.toml` — all four bindings the incoming commit adds are present
  in the resolved file: top-level `[[d1_databases]] binding = "DB"` and
  `[[r2_buckets]] binding = "SITES"`, and their required repeats under
  `[[env.production.d1_databases]]` / `[[env.production.r2_buckets]]` with the same
  `database_id` (`0434cd88-07e0-4eb2-a7d8-7370c333534c`) and `bucket_name`
  (`1stcontact-sites`). `migrations_dir = "../../db/migrations"` sits at the top level,
  outside `[vars]` — the placement REQ-144's parity UAT exists to catch. The commit's own
  stated requirement ("control-app declares `DB` and `SITES`, repeated under
  [env.production]") is therefore satisfied on both halves, which is what
  `tests/test_UAT_FC_REQ-143_store_bindings.test.ts` pins.

- `package.json` — the incoming change is purely the version scalar, deliberately
  superseded as described above. No implementation content from the incoming commit
  touches this file, so nothing developer-authored was discarded.

All 24 other paths from the incoming commit (the D1/R2 adapter, the catalog/worker split,
the migration, the contract suite and the three new UATs) applied without conflict and
remain staged.

## Flagged for post-merge review

`apps/control-app/wrangler.toml` — the intent metadata classified both sides as "intent
unknown", so per the resolution rule this file is flagged. The composition above is
believed correct on inspection (disjoint TOML tables, no competing values), but the
Access gate and the store bindings landed independently and have never been exercised
together: `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` remain empty, which REQ-147 defines as
DENY, so a deployed production Worker answers 503 to every request regardless of the new
bindings. That is the intended pre-configuration state, not a regression introduced here.
