---
uid: report-9a7011f7
id: REPORT-4184
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T00:26:37.782760+00:00'
updated_at: '2026-09-14T00:26:37.782760+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

Cherry-picking 8b484d5832 ("Merge branch 'free-BUG-40' into xgd-working",
authored 2026-09-01) onto reconcile-BUNDLE-27. Six conflicted paths: four UU
test files, two DU test files.

## Files resolved

- `tests/reconciliation-assistant-conversation.test.ts` — **UU**, rule 2c.2
  (combine) + 2f (keep both). Both sides rewrote the single AC-1055 test for the
  same BUG-38 inversion (identifiers resolve against the store, not a per-isolate
  `minted` map). HEAD's rewrite is a superset of incoming's: it covers every
  refusal case incoming lists, adds a second account to make "scoped to the
  account" checkable, and asserts the held-over id now RESOLVES (200 +
  event-stream) more strongly than incoming does. Kept HEAD's function and
  grafted in the one case incoming had that HEAD lacked — `site-../${SLUG}`,
  the traversal that would reach a REAL site if the id were ever joined onto a
  path. Net staged diff: that one case plus its comment.

- `tests/reconciliation-builder-workspace-origin.test.ts` — **UU**, resolved to
  HEAD; incoming hunk dropped under the BUG-1301 precedence exception (detailed
  below). Net staged diff: none.

- `tests/reconciliation-copy-edit-parameter-sheet.test.ts` — **UU**, two hunks.
  - Hunk 1 (the parameter-shape assertion): rule 2c.3c, INCOMING WINS. HEAD
    "fixed" the exact-set assertion by adding `'color'` to it; incoming replaced
    equality with containment and argued in-line why an exact set is the
    assertion that strands the next shape the derivation grows — naming the
    colour parameter as the shape that already stranded it. Mutually exclusive
    approaches to the same defect; took incoming's exactly as authored.
  - Hunk 2 (the painted panel's sheet): rule 2c.2 + 2c.3b. HEAD's block is
    additive beyond the conflict — it carries an entire further section ("never
    by the region's KIND", the `AN_IMAGE` picture assertions) that incoming does
    not touch. Kept all of it, and replaced HEAD's hardcoded
    `expect(panelSheet).toBeTruthy()` with incoming's derived biconditional
    (`Boolean(panelSheet)` === `panelParameters.length > 0`), which is incoming's
    intent and subsumes HEAD's claim on the post-REQ-140 tree.

- `tests/reconciliation-platform-build-deploy-smoke.test.ts` — **UU**, twelve
  hunks. Both sides independently implemented the same REQ-147 control-app smoke
  checks, under different identifier names. Standardised on HEAD's names
  (`PUBLIC_CHECKS` / `CONTROL_CHECKS` / `ALL_CHECKS`) since a non-conflicted
  hunk already references `ALL_CHECKS`; naming is not an intent, so this
  discards nothing.
  - Check-list declarations: kept HEAD's names, merged incoming's docstrings,
    and ADDED incoming's `FAKE_CONTROL_ORIGIN` / `FAKE_WORKERS_DEV_ORIGIN`
    constants — required, because incoming's auto-merged `correctOrigin()`
    entries and its AC-1336 argv both reference them and HEAD defines neither.
  - AC-1331 `--skip-preflight`: rule 2c.2 (combine). Both sides split the leg
    into an incomplete run then a complete one; their assertions are
    complementary. Kept HEAD's naming and BOTH assertion sets — HEAD's
    (no `==> Preflight`, no preflight refusal text, exit != ENVIRONMENT, reaches
    `==> Control-app assets`) and incoming's (exit != 0, output names
    `webui-shell`, no `==> Bundle `, no `npx|` in the shim log).
  - AC-1336: rule 2c.3c, INCOMING WINS. HEAD weakened the criterion to
    "every APPLICABLE check passes and each skip is named"; incoming kept the
    AC's own "nothing skipped" claim by actually supplying `--control-origin`
    and `--workers-dev-origin`. Took incoming's. This is also what makes the
    auto-merged `correctOrigin()` control entries and the origin-keyed
    `FETCH_HOOK` live rather than dead — they exist only to serve this test.
  - AC-1337 / AC-1338 (five hunks): resolved to HEAD, which is a superset at
    every one. HEAD asserts the control checks skip in the no-draft leg too
    (incoming does not), and HEAD's skip-reason assertion,
    `toMatch(/--(control|workers-dev)-origin/)`, is strictly more specific than
    incoming's `toContain('origin given')` — both hold against the real
    `smoke.mjs` reasons, so incoming's intent is preserved by a stronger check.
  - AC-1341: resolved to HEAD. Incoming DELETED the `BUILDER_ORIGIN` assertions
    against the real `apps/control-app/wrangler.toml` because REQ-145 removed
    that var; HEAD had already deleted the same assertions and replaced them
    with `TENANT_ID` / `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD`. Verified against the
    real file: `BUILDER_ORIGIN` is absent, the three HEAD names are present both
    at top level and under `[env.production]`. Incoming's deletion is satisfied.
  - AC-1342: rule 2c.2 (combine). HEAD added a README assertion, incoming added
    hook-file assertions. Kept both; verified both strings exist
    (`bin/deploy.d/secrets/README.md:78`,
    `bin/deploy.d/secrets/10-anthropic-api-key:93,106`).

- `tests/test_UAT_FC_REQ-158_system_kb.workers.test.ts` — **DU**, `git rm`.
- `tests/test_UAT_FC_REQ-159_project_kb.workers.test.ts` — **DU**, `git rm`.
  These are NOT a HEAD-side deletion. Neither file has ever existed on this
  branch: `git log -- <path>` is empty on HEAD, and the only commit that creates
  them, `2745001058 feat(kb): the system knowledge base reaches the Worker
  [FREE-CODED]` (authored 2026-08-31 18:22), is not in BUNDLE-27's cherry-pick
  set — its cherry-picked twin `700f06214b` lives on `reconcile-BUNDLE-23`. The
  exclusion is deliberate bundle scoping, not "not yet reached": BUNDLE-27 has
  already applied `5f65959253` (authored 2026-08-31 18:30), a LATER commit.
  Restoring via `git checkout --theirs` would make this commit add two whole UAT
  files for another bundle's feature. `git rm` on a DU path whose HEAD side has
  no entry simply leaves the path untouched by this commit — no test is removed
  from the repository, because none is there.

## Incoming changes preserved

- `reconciliation-assistant-conversation.test.ts` — incoming's six intents:
  re-aim the criterion from "not issued by this process" to "names no site"
  (present, HEAD states it at greater length); refuse `site-no-such-site`
  (present as `site-ghost`); refuse `site-` (present); refuse `../../etc/passwd`
  (present); refuse `site-../${SLUG}` (**grafted in** — this was the one case
  HEAD lacked); held-over id now returns 200 + event-stream (present, and HEAD
  additionally asserts the model was sent the slug). All present.
- `reconciliation-copy-edit-parameter-sheet.test.ts` — incoming's containment
  loop, its `not.toContain('string')` guard, its derived `panelWords` /
  `panelParameters` split and its biconditional sheet assertion are all present
  verbatim or as written. All present.
- `reconciliation-platform-build-deploy-smoke.test.ts` — incoming's
  `correctOrigin()` control entries, origin-keyed `FETCH_HOOK`, the two
  `FAKE_*_ORIGIN` constants, the separate control-check list, `ALL_CHECKS`, the
  AC-1336 full-input run asserting `0 skipped`, the `ACCESS_DEV_OPEN` exemption
  filter, the `BUILDER_ORIGIN` removal, the `10-anthropic-api-key` entry in the
  scanned-files list and the four hook assertions are all present. The only
  incoming text not carried is its choice of identifier names
  (`SITE_CHECKS` / `ACCESS_CHECKS`), which HEAD already expresses as
  `PUBLIC_CHECKS` / `CONTROL_CHECKS`.

### Hunks dropped under the BUG-1301 precedence exception

`tests/reconciliation-builder-workspace-origin.test.ts` — the whole incoming
hunk, which rewrote the admitted-preview assertions inside `test_UAT_AC964_*`
around `worker.fetch(previewUrl('alpha','draft'), {headers: admitted})`.

- **HEAD-side commit that removed the target**: `7a17bd8cd9` ("Workflow
  fix_uat_validation completed: done", `xgd-kind: structural_validation`). It
  deleted the `unstable_dev` worker from that `describe` entirely — `worker`,
  `builder`, `cwd` and `applyLocalD1Schema` are all gone — and replaced them with
  the Worker's own `fetch` driven in-process against a `workerEnv()` whose D1 and
  R2 bindings are Proxies that THROW the moment they are touched.
- **Why that removal is a legitimate refactor, not a resolution shortcut**: it is
  documented in the file it changed and it RELOCATED the assertion rather than
  dropping it. `workerEnv()`'s own docstring states that no route this leg
  sweeps may open a store and names where the store-backed half went; the
  surviving comment above the conflict says "That the address is SERVED needs a
  store, and is asserted over one in the workers-pool leg named above." I
  verified the destination exists and is stronger:
  `tests/reconciliation-workspace-admission.workers.test.ts` seeds a real site
  into D1/R2 in `beforeAll` and sweeps `/preview/${slug}/draft/` at 200 admitted
  / 401 unadmitted. The cache-control directive incoming also asserts is pinned
  in `tests/test_UAT_FC_REQ-145_builder_in_workerd.workers.test.ts:192`, again
  over a real store.
- **Why it cannot be integrated**: incoming's code references `worker` and there
  is no such binding in HEAD's `describe`, so applying it as authored does not
  compile. Translating it to HEAD's `call()` helper would drive a store-backed
  route through the unreachable-binding Proxy, which throws by construction.
- **Why incoming's intent is nevertheless satisfied**: incoming's stated purpose,
  in its own comment, is to stop asserting `200` on a route whose answer depends
  on whether a site happens to be in the local miniflare D1 — "which is how this
  line passed on a checkout that had one and failed on a fresh one". HEAD's
  refactor removes that dependency outright rather than working around it, and
  seeds the site in the pool that can hold one. HEAD also covers strictly more
  here: it checks `previewUrl` for both the `draft` and `edit` channels, where
  incoming checks only `draft`. The unadmitted-401 assertion is identical on
  both sides and is retained.
- **Consequence to note for review**: this file's resolution nets to no diff vs
  HEAD. Per STEP 4 that is not a failure, and STEP 3 distinguishes it from a
  discard — the incoming commit's key change is present in HEAD by a different
  and stronger route, not absent.

One cosmetic loss, recorded rather than resolved: the incoming commit also
rewords a doc comment in the two REQ-158/159 files from
`` `@lagrangefoundry/knowledge` component `` to "shared knowledge component".
Those files are out of this bundle's scope (above), and BUNDLE-23's copy
(`700f06214b`) still carries the old wording, so the rename will need
reapplying when BUNDLE-23 lands. No assertion depends on it.

## Verification performed

Ran individually with `vitest run -t <name>`, all PASS against the resolved
tree:

- `test_UAT_AC1336_every_check_passes_with_nothing_skipped_and_the_command_exits_zero`
- `test_UAT_AC1337_each_breakage_fails_naming_the_check_and_what_it_expected`
- `test_UAT_AC1338_missing_inputs_are_reported_skipped_with_the_reason_and_counted`
- `test_UAT_AC1341_named_environments_repeat_top_level_vars_and_bindings_found_structurally`
- `test_UAT_AC1342_no_credential_shape_is_committed_and_the_documented_push_echoes_only_the_name`

All four resolved files parse and scope-check clean under `tsc --noEmit
--noResolve` (no TS1xxx syntax errors, no redeclarations, no unresolved local
bindings).

NOT executed in this session, and flagged for the regression run:

- `test_UAT_AC1123_words_open_in_the_box_and_parameters_in_a_bounded_sheet_staging_into_one_save`
  and the AC-964 / AC-1055 legs — these bind loopback sockets, which this
  sandbox refuses (`EPERM: listen 0.0.0.0`). Not a defect in the resolution;
  they simply cannot run here.
- `test_UAT_AC1331_build_bundles_every_discovered_worker_against_production_after_preflight`
  — a 600s leg that shells out to `bin/build` and `npx`. The assertions merged
  into it are incoming's own, applied to the identical scenario (same shims,
  same `UAT_HIDDEN_SPECS`, same hook), so they carry incoming's warrant, but
  they were not executed here.

Note: `xgd quality run --tests <name>` did not honour the filter — it ran the
full suite under coverage, hit the 300s coverage timeout and reported an
`executed 0 tests` infrastructure error. The spot-checks above were therefore
run with `vitest run -t` directly. No full-suite run was performed.
