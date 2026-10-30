---
uid: report-bc680a3e
id: REPORT-4755
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T15:12:00.306854+00:00'
updated_at: '2026-09-21T15:12:00.306854+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

Incoming commit: e5d762332d "fix(tests): repair the suite — a stale asset build and
eleven superseded UATs [FREE-CODED]" (2026-09-01). HEAD tip: 2026-09-21 — 20 days later.

Five UU conflicts. In every case HEAD already carries a later, strictly broader
revision of the same change the incoming commit was making, so each resolution keeps
HEAD's text and verifies the incoming assertion survives in it.

## Files resolved

- **package.json** — 2g (config), scalar. Incoming bumps `version` 0.2.32 → 0.2.33;
  HEAD is at 0.2.40. Kept HEAD. 2g's blanket "incoming wins" would regress a
  monotonic counter; the file-level metadata rule (more recent commit by timestamp)
  and the counter's own semantics both give HEAD, which already contains that bump
  and seven more. No other key conflicted.

- **tests/reconciliation-assistant-conversation.test.ts** — 2c/2f (UAT). Both sides
  rewrite AC-1055 for the same reason (BUG-38 replaced the per-isolate `minted` map
  with a store read). Kept HEAD's
  `test_UAT_AC1055_an_identifier_is_answered_only_when_it_names_a_site_this_account_holds`
  (from a1680d56b6 `fix_uat_coverage` / BUG-40). No test function is lost: this is the
  same criterion under a renamed identifier, and HEAD's body is a strict superset —
  see below.

- **tests/reconciliation-builder-workspace-origin.test.ts** — 2c, BUG-1301 precedence.
  Kept HEAD. The incoming hunk's target no longer exists (detail below).

- **tests/reconciliation-copy-edit-parameter-sheet.test.ts** — 2c/2f (UAT). Two of the
  incoming commit's three hunks auto-merged (already byte-identical in HEAD). The third
  conflicted only because HEAD appends to it; kept HEAD's superset.

- **tests/reconciliation-platform-build-deploy-smoke.test.ts** — 2c/2f (UAT), eleven
  conflict regions, all kept HEAD. HEAD renamed the incoming commit's `SITE_CHECKS` →
  `PUBLIC_CHECKS` and `ACCESS_CHECKS` → `CONTROL_CHECKS`; taking HEAD consistently was
  also required for the file to compile, since the two naming schemes are interleaved
  across the conflict boundaries.

## Incoming changes preserved

**reconciliation-assistant-conversation.test.ts** — every case the incoming AC-1055
asserts has a counterpart in HEAD's version: `site-no-such-site` → `site-ghost`
(same claim: names a site that does not exist); `site-`, `../../etc/passwd` and
`site-../${SLUG}` verbatim; the post-refusal assertions (`client.seen` empty,
`sessionsDir` absent, both headlines untouched) verbatim; and the incoming commit's
inverted case — an id held across a restart now RESOLVES (200, `text/event-stream`,
model actually called) — as HEAD's "AND THE ONE THAT RESOLVES" block. HEAD adds
`conversation-42`, the bare unprefixed slug, `site-../../etc/passwd`, and a
second-account foreign-identifier refusal. Nothing incoming asserts is dropped.

**reconciliation-builder-workspace-origin.test.ts** — BUG-1301 PRECEDENCE EXCEPTION
APPLIES; one incoming hunk is intentionally absent. The hunk rewrites AC-964's
admitted-preview probe from `expect(status).toBe(200)` to `not.toBe(401)` plus a
cache-control check, driving the Worker through an `unstable_dev` handle named
`worker`. HEAD (REQ-147 work, last touched by a6d1b6b7bd) had already removed that
handle for AC-964: the test now calls the Worker's own `fetch` in-process via `call()`
with D1/R2 bound to proxies that throw on touch, and the store-backed half of the
criterion was relocated to `tests/reconciliation-workspace-admission.workers.test.ts`
(present in the tree; verified). The identifier `worker` is not in scope in HEAD's
`control-app front` describe, so the incoming hunk could not be applied at all.

This is a legitimate refactor, not a resolution shortcut: both sides independently
concluded the `200` assertion was wrong (the incoming commit's own message says it
"only held on a checkout carrying a site left behind in local miniflare state"), and
HEAD fixed it more thoroughly — by deleting the environment-dependent assertion
outright and moving the store-backed claim to a workers-pool suite that has real
bindings — rather than weakening it in place. No test function was deleted:
`test_UAT_AC964_the_admitted_split_holds_with_a_real_access_token` is intact, and its
unadmitted-401 assertion survives as `call(previewUrl('alpha','draft'), false)`.

**reconciliation-copy-edit-parameter-sheet.test.ts** — the incoming biconditional
`expect(Boolean(panel.querySelector('.builder-modal__props')), '...').toBe(panelParameters.length > 0)`
is present verbatim in HEAD, along with the `panelWords`/`panelParameters` derivation
and the containment-not-equality shape assertions from the other two hunks. HEAD adds
a per-row membership loop over the panel's non-image descriptors.

**reconciliation-platform-build-deploy-smoke.test.ts** — every incoming assertion is
present, most in expanded form:
- the two-half `--skip-preflight` claim (flag suppresses the check; the run still stops
  on the missing component; nothing bundled) — HEAD asserts both halves plus
  `not.toContain` the preflight refusal text and `not.toBe(EXIT_CODES.ENVIRONMENT)`;
- the `--control-origin` / `--workers-dev-origin` complete-run probe and the
  `ALL_CHECKS` coverage assertions;
- the control-surface skip-reason claim. One deliberate difference: incoming asserts
  `detail` contains the literal `'origin given'`; HEAD asserts
  `toMatch(/--(control|workers-dev)-origin/)`. Same property (the skip names its own
  option, not `--slug`), pinned to the flag name rather than to prose — strictly more
  specific, and HEAD keeps incoming's `not.toContain('--slug')` alongside it;
- removal of the dead `BUILDER_ORIGIN` production-var assertion — gone in HEAD too,
  replaced by a `TENANT_ID` / `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` check;
- the secrets-hook assertions, which survive verbatim outside the conflict region:
  the hook path added to the scanned-files list (line 1553) and
  `readFileSync(...10-anthropic-api-key)` with `toContain('would push …')`,
  `toContain('pushed …')`, `not.toMatch(/echo…\$THE_VALUE…/)` and
  `not.toMatch(/wrangler secret put …/)` (lines 1591–1596).

The incoming commit's `SITE_CHECKS`/`ACCESS_CHECKS` identifiers do not survive, having
been renamed in HEAD to `PUBLIC_CHECKS`/`CONTROL_CHECKS`; no assertion is lost with them.

## Staging

`git status --porcelain` shows no conflict classes. The only staged changes are the two
`.workers.test.ts` files the commit's AC-960 hunks auto-merged into (REQ-158/REQ-159 —
the org scope removed from prose). The five resolved files match HEAD, so they carry no
net diff; per STEP 4 they were staged and `--skip` was not called. CHERRY_PICK_HEAD is
intact at e5d762332d.

## Verification limits

A type-check was not possible: this is a sparse checkout at 11% of tracked files and
`tsconfig.json` is not present. The suite is unrunnable here regardless
(vitest-pool-workers needs to bind a socket; the sandbox denies it). Resolution was
verified by reading `git show e5d762332d -- <file>` against each resolved file and by
grepping for dangling identifiers from the dropped incoming side (`SITE_CHECKS`,
`ACCESS_CHECKS`, `skippedWithoutSlug`, `skippedBroken`, `later.`, `worker.fetch`) —
none are referenced anywhere in the resolved tree.
