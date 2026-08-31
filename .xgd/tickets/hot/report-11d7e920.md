---
uid: report-11d7e920
id: REPORT-3019
type: report
title: 'Fix reconciliation review: bundle-78f4e2fe'
created_by: xgd
created_at: '2026-08-31T18:06:44.296317+00:00'
updated_at: '2026-08-31T18:06:44.296317+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-78f4e2fe
  needs_more_work: false
  progress_made: true
---

## Stories created

None. The review's intent-fidelity, behavioural-coverage and plan-item sections
all passed; the failure was entirely Step 5b, evidence sufficiency.

## Stories modified

- **story-182e8cb9** (STORY-120) — one `## Reconciliation Decisions` bullet
  added: *"The provisioning command gained a management-API base-URL seam"*. It
  records why AC-1453's verification moved from reading `bin/access-token`'s
  source to driving it, and states that the override is not a credential and
  grants nothing. Nothing else in the body was touched.

- **AC-1453** (`acceptance_criterion-996ba9b5`) — Verification rewritten. It
  previously licensed the source inspection the review objected to ("Read its
  source and the policy record"). It now requires the command to be **run**
  against a stub standing where the management interface stands, and enumerates
  the seven request-level observations the new UAT makes. Reading the policy
  record survives, with a sentence saying why that one *is* an observation
  rather than a substitute for one. A `## Reconciliation note` states the seam
  and restates the one explicit non-guarantee (live-edge admission, which needs
  a deploy). The Criterion itself is unchanged — it was never wrong.

No `uat_coverage` field was set on any ticket: that field belongs to
check/fix_uat_coverage, and setting it here would manufacture progress.

## Stories deleted

None.

## FC orphans renamed/deleted

None — deliberately. There is no `fc_orphan_check` report for
`bundle-78f4e2fe` (the only one in the store is for `bundle-b3b7c399`), so per
the fixer's own instruction category 3 was skipped; this call was triggered by
the matrix review.

Flagged for whoever runs that gate next: five FC files for this bundle's tickets
are still on disk, alongside their reconciled AC-named counterparts —
`test_UAT_FC_BUG-36_publish_credential.test.ts`,
`test_UAT_FC_BUG-36_tenant_bootstrap.workers.test.ts`,
`test_UAT_FC_BUG-37_observability.test.ts`,
`test_UAT_FC_BUG-37_preview_assemble_memo.workers.test.ts`,
`test_UAT_FC_BUG-38_chat_session_survives_isolate_churn.workers.test.ts`. They
pass, and the review's coverage map credits the `reconciliation-*` files rather
than these, so they read as redundant duplicates rather than as evidence
anything depends on. (Forty-odd FC files from earlier bundles sit beside them,
so this is the store's standing state, not a new condition.)

## Code changes

### `tests/reconciliation-assistant-conversation.test.ts` — Evidence Gap #1 (BLOCKING)

`test_UAT_AC1055_...` rewritten and renamed to
`test_UAT_AC1055_an_identifier_is_answered_only_when_it_names_a_site_this_account_holds`.

The old UAT asserted the pre-BUG-38 behaviour — `site-<held slug>` → 404, and a
held-over id after `resetAiHost()` → 404, citing the deleted `minted` map — and
would have failed against the landed code. It now asserts the restated AC-1055:

- six refusal shapes, each refused as a plain not-found answer and never as an
  event stream: a fabricated id, one naming a site that does not exist, the bare
  site name unprefixed, the prefix with nothing after it, and path traversal both
  unprefixed and behind the prefix;
- **the account-scoped refusal** the review named as unasserted: a second
  workspace with its own `startBuilder` (a second account, holding a different
  site) refuses the very identifier the first account answers. Same string, two
  accounts, two answers — which is what makes the resolution account-scoped
  rather than name-scoped;
- after every refusal: nothing reached the model, no transcript storage appeared
  on either account, and neither site was written;
- **and the case the criterion says must resolve**: the derivable identifier for
  a held site, submitted without opening a conversation first, is answered as a
  200 event stream and the model is reached for that site.

That last assertion reads what the model was *sent*, not what it replied. The
reply and the draft write are AC-1054's subject; hanging AC-1055 on them would
make a resolution failure and a model failure indistinguishable, which is the one
thing this criterion exists to tell apart. It also happens to matter here — see
Confidence.

### `tests/reconciliation-cloudflare-site-store.workers.test.ts` — Evidence Gap #2 (BLOCKING)

`test_UAT_AC1387_...` extended. It asserted only that the two refusal *messages*
differ; `UnknownTenantError.reason` was read nowhere in `tests/`, so deleting the
field left the UAT green. Now:

- both `reason` values are asserted as typed values (`'unknown'` / `'inactive'`)
  and asserted to differ;
- and the discriminant is **exercised as a caller branches on it** — a local
  bootstrap written the way `apps/control-app/src/store.ts` writes it (register
  on `unknown`, rethrow anything else). The never-registered account is created
  and its handle opens; the deactivated one is refused and is still deactivated
  afterwards. Deleting `reason`, or collapsing the two cases back into one, now
  breaks this rather than passing quietly.

### `tests/reconciliation-workspace-tenant-bootstrap.workers.test.ts` — Evidence Gap #3

New `test_UAT_AC965_an_unnamed_and_a_deactivated_account_are_reported_distinguishably`.

AC-965's deactivated-account case was asserted only inside `test_UAT_AC1449`, and
nothing asserted AC-965's own load-bearing comparison — that the two responses are
distinguishable *from each other* without reading a log. The new UAT drives both
against the real Worker and real D1: the unnamed deployment names `TENANT_ID` and
`wrangler.toml` and creates nothing; the deactivated one names the account and is
still deactivated afterwards; neither is a success, neither is blank, the two
bodies differ, and neither carries the other's subject. It also covers AC-965's
last clause — the same failure, unchanged, from `/preview/<slug>/draft/`, which
is matched last in the table and opens the store deep inside its handling.

It lives in the workers file rather than beside the other AC-965 UAT because the
deactivated case needs an account row in a real database; `unstable_dev` gets a
fresh local D1 with no schema and no way to write one, so asserting it there
would assert a stub's opinion of a deactivated row — the class of assumption
BUG-36 was. The header comment says so, and says what AC-1449 asserts that this
does not (survival of the refusals, versus their distinguishability).

### `tests/reconciliation-builder-private-access-automation.test.ts` + `bin/access-token` — Evidence Gap #4

Took the review's first option: drive the script rather than narrow the criterion.

- `bin/access-token` — the management API base is now
  `CLOUDFLARE_API_BASE`-overridable (one line, plus the note explaining why it is
  a seam and why it grants nothing: setting it needs the same environment access
  as setting `CLOUDFLARE_API_TOKEN`). Unset — every operator invocation — it is
  Cloudflare. No other behaviour changed.
- `test_UAT_AC1453_...` — the five source regexes the review named
  (`len(accounts) == 1`, the domain match, `"decision": "non_identity"`, the
  `include` literal, `if not payload.get("success")`) and the rest of the
  pattern-matching are replaced by six runs against a real local HTTP stub
  standing in for the management API, asserting on the requests actually made:
  several accounts refused by name with nothing created; no application for the
  domain refused by name with nothing created; the mint, where the application is
  matched **by domain** against a decoy carrying the recognisable display name,
  every request scoped to the inferred account, and the policy posted as a new
  Service Auth rule including the token just minted with the operator's own rule
  neither edited nor removed; the reuse case creating nothing at all and naming
  the rotate command; `--rotate` rotating in place rather than minting a second
  token; and a refusal reported inside a `200 {success:false}` envelope failing
  rather than reporting a successful no-op.
- "writes no secret to any file" is now a filesystem observation: the mint runs
  with a writable working directory that is also its `HOME`, and both are still
  empty afterwards.
- The ACCESS.md policy-record assertions are kept unchanged (the record *is* the
  artifact), as is the one genuinely source-level claim — that the forwarded
  assertion header is never mentioned — now stated as one.

## Confidence

High for the review's four findings; each was verified running, not reasoned about.

Verified in this worktree (`npm test -- <file>`):

- `reconciliation-workspace-tenant-bootstrap.workers.test.ts` +
  `reconciliation-cloudflare-site-store.workers.test.ts` — **12 passed**, which
  covers the new AC-965 UAT and the AC-1387 additions.
- `reconciliation-builder-private-access-automation.test.ts` — **4 passed**. Also
  falsified: reverting `find_app` to match on display name instead of domain
  makes AC-1453 fail, and restoring it makes it pass again. The old regex
  version could not have caught that.
- `test_UAT_FC_BUG-36_publish_credential.test.ts` +
  `reconciliation-workspace-edge-origin.workers.test.ts` (the other two files
  that read `bin/access-token`) — **12 passed**, so the seam broke nothing.
- `reconciliation-assistant-conversation.test.ts` — the new AC-1055 UAT
  **passes**, including the second-account refusal and the resolution case.

**One thing the next reviewer should not misread.** Six of that file's eleven
tests fail in this worktree — AC-1052, 1054, 1056, 1057, 1059, 1060. They fail
identically with my change stashed, i.e. at HEAD, so this is pre-existing and not
caused by anything here. The cause is the file's model double: every turn dies on
`stream is not async iterable`, because the double answers with a finished
message while the installed AI library consumes the streaming wire protocol (the
workerd companion, `reconciliation-assistant-conversation-continuity.workers.test.ts`,
says in as many words that a finished-message double is a fiction). It is
plausibly a worktree artifact — `@lagrangefoundry/*` resolves only from the main
checkout — but I could not establish that from here, and it is outside this
fixer's scope either way. AC-1055 was deliberately written not to depend on the
model's *reply* so that it stands on either side of that question; it passes here
as it stands.

The one judgment call worth naming: AC-1453's Verification was rewritten rather
than the criterion narrowed. That is the stronger of the two options the review
offered, but it did mean a one-line production change to `bin/access-token`,
which is unusual for reconciliation. It is recorded as a Reconciliation Decision
on story-182e8cb9 rather than left implicit.
