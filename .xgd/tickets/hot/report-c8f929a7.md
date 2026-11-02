---
uid: report-c8f929a7
id: REPORT-8206
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:41:19.331576+00:00'
updated_at: '2026-11-02T01:41:19.331576+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

Cherry-pick of 532bcc5dd3 "merge xgd-working into free-REQ-194" (incoming, committed 2026-09-06) onto HEAD (wrangler.toml / baseline test last touched by 2c23da50b7, 2026-11-01).

- `tests/test_UAT_FC_REQ-190_baseline.test.ts`: UAT test file (2c/2f). Both sides made separate, compatible changes, so I combined them. HEAD added `accounts` and `ticket_change_floor` (keyed on `tenant_id`). Incoming added `user_names` and `contact_events`. The table list in the comment now names all 11 tables; the count comment changed from "TEN, NOT NINE" to "TWELVE, NOT ELEVEN". Both sides' explanatory paragraphs are kept, including incoming's REQ-193/REQ-195 text. The expected `TEXT PRIMARY KEY` list is now 10x `id` + `tenant_id` + `uid`, which matches `db/migrations/0001_baseline.sql`. No test function was removed.
- `apps/control-app/wrangler.toml`: config (2g). Applied the enrichment rule (take the more recent commit by timestamp) per fact. Top-level `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD`: kept HEAD's empty values. HEAD's commit is from 2026-11-01 and the incoming one from 2026-09-06. HEAD's comment block in the same file also says the top-level emptiness is deliberate: it keeps `ACCESS_DEV_OPEN` / `1c builder` working on the loopback dev server. The real values remain under `[env.production.vars]`. `MAIL_FROM = "no-reply@1stcontact.io"`: incoming's addition does not overlap HEAD's change and is kept. FLAG FOR POST-MERGE REVIEW.
- `apps/control-app/src/system-knowledge.ts`: code (2c). HEAD's side of the hunk was empty, so I took incoming's comment above `export { SYSTEM_KB, SHIPPED_SOURCE }` (BUG-55 rationale) as-is.
- `.xgd/tickets/hot/request-{3a032190,704fe21e,920e1a2c,9bfe910a,bce2b6f9,ddd47be3}.md`: intent/bookkeeping tickets (2e). Kept HEAD (ours) for all six. HEAD is the more recent side (updated_at 2026-11-01, status `bundled`, `bundled_in: bundle-5052a63c`, commit lists). It is also a superset of incoming, which is an older 2026-09-06 snapshot with status draft/free_coding/free_coded. For 9bfe910a, HEAD also carries extra body sections that incoming lacks. ddd47be3 differs on the incoming side only by line wrapping. These paths are outside the sparse checkout, so I resolved them in the index (stage 2 promoted to stage 0) and restored skip-worktree. FLAG FOR POST-MERGE REVIEW per the enrichment rule.

## Incoming changes preserved

- system-knowledge.ts: incoming comment present.
- REQ-190 baseline test: incoming `user_names` / `contact_events` tables, REQ-193/REQ-195 rationale, and the extra `id` entries are all present.
- wrangler.toml: incoming `MAIL_FROM` is present at top level, and also under production, where it was already present. Not kept: incoming's populated top-level ACCESS_TEAM_DOMAIN/ACCESS_AUD values. These lost to the newer HEAD side under the enrichment's timestamp rule, and HEAD's in-file documentation supports that.
- Spot checks: `test_UAT_FC_REQ-190_baseline.test.ts` (6/6 pass) and `test_UAT_FC_REQ-196_mail_configuration.test.ts` (6/6 pass).

## Arbitration of last resort (BUG-1460)

Not fired. All files were resolved by the per-file rules plus the enrichment's timestamp rule.
