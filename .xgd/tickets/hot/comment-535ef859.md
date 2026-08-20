---
uid: comment-535ef859
id: COMMENT-1406
type: comment
title: Comment on request REQ-7
created_by: xgd
created_at: '2026-08-20T21:35:55.892186+00:00'
updated_at: '2026-08-20T21:37:31.071101+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-9b70eeca
  kind: chat_transcript
---

<!-- xgd-turn id="d154357d-8ce0-4494-bfc2-620f921b0f66-user" -->

<!-- xgd-chat role="user" ts="2026-08-20T21:35:52.419091+00:00" -->
#### You
Is this ticket still relevant?

<!-- xgd-turn id="d154357d-8ce0-4494-bfc2-620f921b0f66-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-20T21:37:30.978778+00:00" -->
#### Claude
I'll read the ticket first.

Short answer: **no — it's been overtaken. Every deliverable in it has either landed in a different shape or moved to another ticket.**

What I found:

**Superseded by REQ-143** (`ready_to_reconcile`) — `db/migrations/0001_site_store.sql` is now the only migration, and it defines `tenants`, `sites`, `site_pages`, `site_assets`, `site_changes`. That's REQ-7's `accounts`/`sites` bones, but with a different model:
- tenancy is a **column on every row and part of every primary key**, not a `account_id` FK with a globally-unique slug — two accounts can both own `home` (DOC-10 §4.1)
- pages are rows (`site_pages`), not `draft_definition`/`published_definition` JSON blobs — which is exactly the per-page granularity REQ-7's own 2026-06-30 model note said it needed
- `accounts` became `tenants` (id/name/status only — no `email`/`plan_tier`)

**Moved to REQ-149** (`draft`, "Publish in the cloud: revisions, history and rendered output without a filesystem") — the `revisions` table. Today revision history lives in the R2 `manifest.json` per DOC-12 §7 phase 1; the D1 half is REQ-149's job.

**Obsolete outright:**
- the `0002`–`0005` migrations and the whole `db/migrations-down/` tree from the 2026-06-20 implementation note are gone — that work was erased by the framework pivot; commit `8ea7a82` isn't even reachable in this repo any more
- `005_seed_1stcontact.sql` — sites are authored file-backed under `storage/sites/` and migrated via the store, not via a seed migration
- the REQ-20 coordination note about `extractAccountId` — `apps/control-app/src/safety/` no longer exists
- the 2026-07-01 DOC-14 note (site-local module storage, publish-gates-on-hardening) — DOC-14 is itself superseded by DOC-25/DOC-26

**Genuinely unaddressed residue** (small, and not really schema work):
1. Account *identity* — `tenants` has no email, plan_tier, or magic-link path; tenants are provisioned implicitly by `INSERT OR IGNORE` in `d1r2-store.ts:149`. That's the auth REQ, which doesn't exist yet.
2. Reserved-slug list + `suggestAlternativeSlug` — `isValidSlug` exists in `apps/public-site/src/routes.ts:71` for URL routing, but there's no allocation-time reserved list or collision suggestions. Only matters once operators self-allocate slugs at signup, i.e. also the auth/onboarding REQ.

My recommendation: mark REQ-7 `abandoned` (or `wont_fix`) with a pointer to REQ-143 + REQ-149, and let the two residue items ride into a future auth/onboarding ticket rather than propping this one up. Those status transitions are yours to make — want me to record the supersession in the ticket body and set it, or leave it at `draft`?

<!-- xgd-chat-end -->