---
uid: report-229d151d
id: REPORT-5682
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T06:55:11.854564+00:00'
updated_at: '2026-09-30T06:55:11.854564+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

Picked commit `4b10b9dc9f` — *feat(hostname): the 1stc.site hostname, chosen once and
required to publish [FREE-CODED]* (REQ-238, author 2026-09-13 21:38:15). It touches 23
files; **21 auto-merged** and only 2 conflicted, both `UU` and both materialized with
markers.

- **`tests/support/d1-site-factory.ts`** — `UU`, 2 conflict regions. Rule: HARD RULES
  *"FOR CODE AND IMPLEMENTATION FILES … Non-overlapping changes: keep BOTH sides"* plus
  2c integration. Both sides are `[FREE-CODED]`; the two regions are disjoint in subject
  (ours renumbers earlier migrations, theirs appends a new one), so both were kept and no
  tie-break was needed.
  - Region 1 (the `0007_business_name_unique` comment): kept **ours'** `NUMBERED 0007 AND
    NOT 0006` renumbering rationale — a block theirs' base never contained, so theirs
    could not have had an opinion on it — and took **theirs'** removal of the trailing
    `LAST IN THE LIST, which is what atHead below asks about.` sentence. That removal is
    load-bearing, not cosmetic: theirs appends `0008_site_domains.sql` after this entry
    (auto-merged, index line 94), so `0007` is no longer last and ours' claim would have
    become false. The sentence is not lost — theirs re-states it verbatim on the new
    `0008` entry.
  - Region 2 (the `atHead` docblock): took **theirs'** "today `0008`'s unique index on
    `host`" pointer and kept **ours'** renumbering-aware history
    (`0004_retire_site_slug`, `0006_asset_grants`, `0007_business_name_unique`). Required
    for coherence, and ours' own stated invariant demands it: *"this marker MOVES WITH THE
    LIST"*. Theirs' functional counterpart — `.bind('idx_site_domains_host')` — had
    already auto-merged at index line 202, so keeping ours' `0007` prose would have left
    the docblock contradicting the code beneath it.

- **`tests/test_UAT_FC_REQ-243_publish_template_gate.workers.test.ts`** — `UU`, 1 conflict
  region, inside the `publishWith` helper. Rule: 2c integration; theirs' hunk was
  preserved in full and **adapted to ours' surrounding API**, which is the case HARD RULES
  call "integrate both where possible".
  - The collision is structural rather than semantic. Ours' side of this file has a single
    `const TENANT = 'req243-publish'` and `call(path, init)`; theirs' base carries the
    REQ-236 one-business-per-case scheme (`nextBusiness()`, `ensureTenant`,
    `call(tenant, path, init)`) that the resync branch has not received for this file. So
    theirs' literal lines — `await giveBusinessAnAddress(tenant)` and
    `call(tenant, '/api/publish', …)` — reference a `tenant` binding and a `call` arity
    that do not exist on ours, and taking them verbatim would not compile.
  - Resolved as `await giveBusinessAnAddress(TENANT)` followed by ours'
    `call('/api/publish', {`, with theirs' four-line `[[REQ-238]]` comment kept verbatim.
  - **This is incoming's own idiom, not authored content.** The same commit applies exactly
    this form in `tests/test_UAT_FC_REQ-149_publish_in_the_cloud.workers.test.ts` — a
    sibling publish suite that also has one `TENANT` constant and a tenant-less `call` —
    where it auto-merged as `await giveBusinessAnAddress(TENANT)` above
    `return call('/api/publish', {`. Incoming therefore already demonstrates the
    single-tenant spelling of this hunk; the resolution copies it rather than inventing
    one.
  - Placement is theirs' placement (after the `/api/import` assertion, before the
    publish), which also satisfies the helper's precondition: ours dropped the explicit
    `ensureTenant`, so the business exists only once the import has minted it.
  - `giveBusinessAnAddress` is documented idempotent per business, so a single shared
    `TENANT` across the suite's cases is a supported use — *"a fixture calling this twice
    for one business is asking 'make sure this business can publish'"*.

No UAT test function was deleted on either side, so 2f is not engaged and neither is the
BUG-1301 precedence exception.

## Incoming changes preserved

Verified from the **index** (`git show :<path>`), not the worktree. No conflict markers
remain in either file, and `git status --porcelain` shows no `UU`/`AA` lines.

`tests/support/d1-site-factory.ts` — every element of theirs' base→theirs diff is present:

- `() => import('../../db/migrations/0008_site_domains.sql?raw')` appended last in
  `MIGRATIONS` (index line 94), with theirs' full `[[REQ-238]]` comment including its
  `LAST IN THE LIST, which is what atHead below asks about.` (auto-merged).
- `atHead` binds `idx_site_domains_host` (index line 202) — theirs' value, replacing ours'
  `idx_tenants_owner_name` (auto-merged).
- The docblock's "today" pointer is theirs': `today 0008's unique index on host`
  (index line 186).
- Theirs' removal of the stale `LAST IN THE LIST` claim from the `0007` entry is honoured.

`tests/test_UAT_FC_REQ-243_publish_template_gate.workers.test.ts` — theirs' whole hunk is
present:

- `import { giveBusinessAnAddress } from './support/site-address'` (index line 9,
  auto-merged).
- Theirs' four-line `[[REQ-238]]` comment, verbatim.
- The call itself at index line 160, immediately before the publish at line 162.
- `git show :<path> | grep -n 'tenant'` returns nothing, confirming no dangling reference
  from theirs' per-tenant spelling.

Nothing from incoming was dropped, so the *"a resolution that keeps ONLY main's version is
data loss"* HARD RULE is not engaged on either file. Unlike this branch's recent ticket
picks, this resolution stages a **real net change** — the REQ-238 feature across all 23
files — which is the expected outcome for a code pick.

Ours-side content preserved alongside it: the migration renumbering
(`0004_retire_site_slug`, the `0007`-not-`0006` rationale) and this suite's single-tenant
harness.

## Arbitration of last resort (BUG-1460)

Not applicable — STEP 3h never fired. Both conflicts were resolved by integration under
the code-file HARD RULES, with no truly-incompatible hunk requiring an
incoming-wins tie-break and no mechanical failure.

## Notes for the next pick

- `db/migrations/` in the resolved tree holds `0001`, `0002`, `0003`,
  **`0004_retire_site_slug` and `0004_user_acceptances` (two files sharing `0004`)**,
  `0006`, `0007`, `0008`. The duplicate `0004` comes from ours' own renumbering commit
  and predates this pick — flagged for post-merge review, not resolved here, since
  renumbering a migration would be authoring new content. `0008` does not collide.
- The enrichment's fallback rule for both files — *"Intent unknown on one or both sides.
  Take the more recent commit by timestamp and flag this file for post-merge review"* —
  was **not** followed, and should not be on code files. Both sides are genuinely
  free-coded features; obeying it would have discarded one of them wholesale, against the
  HARD RULES and 2c. Read the enrichment for *which* features collide, then apply the
  code-file rules.
- If a later pick on `test_UAT_FC_REQ-243_publish_template_gate.workers.test.ts` brings
  the REQ-236 one-business-per-case refactor (`nextBusiness()`, `ensureTenant`,
  `call(tenant, path)`), theirs' original `giveBusinessAnAddress(tenant)` spelling becomes
  the correct one and this pick's `TENANT` adaptation should give way to it.
