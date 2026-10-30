---
uid: report-7fd27484
id: REPORT-5658
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T05:39:44.122796+00:00'
updated_at: '2026-09-30T05:39:44.122796+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

Pick: `d9b6443c6e` — *feat(store): the D1 store addresses a site by its key
[FREE-CODED]* (REQ-236, author 2026-09-13 17:04:24). HEAD `ac74437e8f`; apply
target `9ac98712a708888db67f8aff21f22b16bd98094e`; anchor `report-377b581e`;
`prior_stage_failure` empty. Three `UU` paths, all materialised, four conflict
regions total — plus one auto-merged file that needed repair (below).

**The decisive evidence for this pick is the developer's own merge of this exact
collision.** `d9b6443c6e` was authored on `free-REQ-236`, whose parent line does
not contain REQ-243 (`7665f4edba`, 13 minutes earlier) — which is what HEAD's tip
`5ef74ab75f` replays, and why the two collide. xgd-working then merged the branch
itself an hour later: `b6a695ae50` *"Merge branch 'free-REQ-236' into xgd-working
[FREE-CODED]"*, parents `d396ec3d80` + `d9b6443c6e`. That commit is a byte-level
oracle for this resolution, not a heuristic, and it was used as one.

## Files resolved

- **`apps/control-app/src/router.ts`** — `UU`, code file, §2c.1 (non-overlapping
  → keep both). Base `f97c684480` / ours `6159027975` (+27/−5) / theirs
  `4fc9c6ffcb` (+174/−116). Only 2 of theirs' many hunks conflicted; the rest
  auto-merged. Both regions are the same shape: ours (REQ-243) adds
  `templateRefusal` to `publishSite`'s options object, theirs (REQ-236) renames
  the positional site handle `slug` → `site`. Options and positional argument are
  disjoint, so both are kept — and theirs' rename is *required*, because the
  merged body's binding is `const site = body.site` and there is no `slug` in
  scope any more. Resolved to
  `publishSite(store, site, { message, ladder, templateRefusal, onLadderProgress })`
  and `publishSite(store, site, { message, ladder, templateRefusal })`, the second
  in the wrapped `json(200, …)` form.
  **Graded against the oracle:** `git diff :apps/control-app/src/router.ts
  b6a695ae50:apps/control-app/src/router.ts` is exactly one hunk, and it is not in
  either conflict region — HEAD's own `personName` → `accountName` rename in
  `businessesPayload`, which postdates the merge and is kept per §2c.1. Both
  conflict regions are byte-identical to the developer's own resolution.

- **`package.json`** — `UU`, config file, §2g (scalar → incoming wins). Base
  `0.2.184` / ours `0.2.188` / theirs `0.2.189`; `version` is the only differing
  line. Took theirs. Incoming is also the *higher* value here, so this is not the
  rollback case: nothing of ours is lost.

- **`tests/support/d1-site-factory.ts`** — `UU`, code/fixture file, §2c.1
  (non-overlapping → keep both). One region, and it is a collision inside the
  `MIGRATIONS` array: ours appends REQ-240's
  `0004_user_acceptances.sql`, theirs appends REQ-236's
  `0004_retire_site_slug.sql`. Two different migrations at the same array
  position — disjoint in effect, so **both entries kept**, ours first (REQ-240
  landed first) then theirs, each with its own comment verbatim. Theirs' large
  auto-merged additions (`atHead()`, the non-re-runnable `applySchema` gate,
  `seedTenantSite`, `makeD1Site` minting the key) all landed untouched.
  **Graded against the oracle:** the remaining delta to
  `b6a695ae50:tests/support/d1-site-factory.ts` is *only that merge's own
  follow-up work* — it renumbers theirs' file to `0005_retire_site_slug.sql`
  (because two files sharing `0004` is an ordering `wrangler d1 migrations apply`
  never declared), updates three prose references from `0004` to `0005`, and
  changes "the two above" to "the three above". That renaming is
  `b6a695ae50`'s content, not this pick's; it is not pre-applied here, and it
  will arrive when that merge is itself picked. See *Noted for post-merge* below.

- **`tools/generate/src/store/d1r2-store.ts`** — **not a conflict**, but a broken
  auto-merge, repaired. Git took theirs' signature change (`async write(slug, …)`
  → `async write(site, …)`) together with ours' asset-name partitioning block,
  leaving `` `[site-store] ${slug}: refused …` `` referencing a binding that no
  longer exists — a hard TS error (`slug` survives in that file only inside
  comments and as the object property `slug: site`). Retargeted to `${site}`, the
  direct analogue of the parameter theirs renamed. Nothing else in the file
  changed; theirs' hunks are all present.

## Incoming changes preserved

Verified per path, and for the whole commit rather than the conflicted subset.
`git diff --cached --numstat d9b6443c6e` restricted to the commit's own source
directories leaves nine of its paths differing from the pick; every one was
investigated and every difference is ours-ahead content, not a dropped incoming
hunk:

- `router.ts` — theirs' `body.site` / `const site = body.site` /
  `publicSiteUrl(site)` / the REQ-236 doc paragraphs are all in the staged blob;
  no bare `slug` binding remains in the publish route.
- `tests/support/lead-site.ts` (+97/−20 vs the pick) — theirs' entire delta
  landed: `const siteKey = await store.createDraft()` (no argument),
  `store.write(siteKey, …)`, `store.writeRevision(siteKey, …)`, `slug` dropped
  from `SeededSite`, `return { siteKey, instanceId }`. The `−20` is ours' REQ-243
  restructure of the same fixture — xgd-working's own *later* commit, so
  working-vs-working precedence points at ours for those lines.
- `db/migrations/0001_baseline.sql` — the pick's own delta here is +8 comment
  lines ("BOTH THE COLUMN AND THAT INDEX ARE RETIRED BY
  `0004_retire_site_slug.sql`"), present at `:104`. The `−16` is baseline prose
  that exists on xgd-working and not on main's side; the pick did not author it
  (`git diff d9b6443c6e~1:… d9b6443c6e:…` does not contain it), so nothing of
  this commit is lost.
- `tests/support/site-store-contract.ts` — the one paragraph ours lacks was not
  added by the pick either; same check, same conclusion.
- `apps/control-app/src/identity.ts` — differs by one line's wrapping only, and
  the pick does not touch that line.
- `tools/generate/src/cli/ai/host-core.ts` — ours' `let seen = await
  store.counter(slug)` still resolves: theirs kept `slug` as the parameter name
  in `streamPrompt`. No dangling reference.
- `apps/control-app/src/ai.ts` (+5/−0) and `tests/support/d1-site-factory.ts`
  (+4/−0) — ours is a strict superset on those paths.
- `tools/generate/src/store/d1r2-store.ts` — see above.

The commit's other ~135 paths are byte-identical to the pick, including all
eleven `builder/*.js` files, `portal.ts`, `public-url.ts`, `scope.ts`,
`shot.ts`, `boot-guard.ts`, `onboarding.ts`, `site-store.ts`, `import-site.ts`,
`assemble.ts` and `cli/index.ts`. Theirs' deletion of
`tests/test_UAT_FC_BUG-90_site_named_after_business.workers.test.ts` was accepted
(2a's UD rule — incoming deletes, and the commit message states why: the site id
no longer derives from the business name), and
`tests/test_UAT_FC_REQ-236_provisioning_mints_a_site_key.workers.test.ts` plus
`db/migrations/0004_retire_site_slug.sql` were added. No UAT function was deleted
by *this* resolution, so 2f is not engaged and neither is the BUG-1301 precedence
exception — no incoming hunk was dropped on that ground or any other.

Staged: 144 files, +2403/−1734. Staged path count equals
`git show --numstat d9b6443c6e | wc -l` (144 == 144), so nothing outside the
commit's own diff was staged and nothing inside it was missed. No conflict
markers remain (`grep -rn '^<<<<<<<' apps packages tools tests db package.json`
is empty); `git status --porcelain` carries no conflict class; `CHERRY_PICK_HEAD`
is intact at `d9b6443c6e`. A code pick stages a real net change, so
zero-net-change is not the success signal here.

Verification stops at read level: this session is a caretaker (no `test_fix`) and
the workerd/wrangler suites are unrunnable in a headless role. Nothing here
implies the suite was run.

## Arbitration of last resort (BUG-1460)

Not applicable — STEP 3h never fired. Every region resolved by integration, and
the developer's own merge of the same collision confirms two of the four
byte-for-byte.

## Noted for post-merge

1. **Two migrations numbered `0004`.** `db/migrations/` now holds both
   `0004_user_acceptances.sql` (REQ-240, already on HEAD) and
   `0004_retire_site_slug.sql` (added by this pick). Inside the fixture's
   `MIGRATIONS` array the order is explicit, so the test path is correct; the
   exposure is `wrangler d1 migrations apply`, which orders by filename. The
   developer resolved this in `b6a695ae50` by renumbering the second to
   `0005_retire_site_slug.sql`, and that renumbering is that commit's own content
   — it should arrive when the merge is picked. No production code references
   either filename by name.
2. **Two main-only suites now call a verb the pick removed.** The pick deletes
   `slugs()` and `siteKey(slug)` from the `SiteStore` port.
   `tests/reconciliation-cloudflare-site-store.workers.test.ts` and
   `tests/reconciliation-published-site-serving.test.ts` still call `.slugs()`;
   both are absent from xgd-working entirely (main's automated-workflow suites),
   the pick never touched them, and repairing them would mean authoring test
   content outside the commit's diff — so they are left alone deliberately, not
   overlooked. `tests/test_UAT_FC_REQ-183_portal_pages.test.ts:419` calls
   `store.slugs()` too, but the developer's own merge carries that same line
   unchanged, so it is xgd-working's state and not a regression introduced here.

## Forecast for the remaining picks on these paths

The queue walks xgd-working in author order, so the next commit touching
`router.ts` is the merge `b6a695ae50` itself (09-13 18:05). **It is not
`--ours`:** it carries the developer's own resolution plus the `0005` renumbering
of `d1-site-factory.ts`, all of which is genuine new intent — accept its lines,
and expect the `0004` → `0005` rename of the migration file to come with it. Its
first parent `d396ec3d80` is on the mainline and may arrive first. After that,
`dc192d05e3` (09-13 19:30, business rename), `37c4036bc7` (portal acceptances),
`8cf16c5f86` (Settings tab) and `4b10b9dc9f` (the `1stc.site` hostname) all touch
`router.ts` with new intent; none is a bookkeeping waypoint, so the
ticket-file `--ours` reflex does not apply to any of them.
