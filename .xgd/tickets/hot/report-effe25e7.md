---
uid: report-effe25e7
id: REPORT-5513
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T08:15:12.073078+00:00'
updated_at: '2026-09-29T08:15:12.073078+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `tests/reconciliation-site-asset-listing.test.ts` — **UU**, code file under
  `tests/**` → rule 2c (incoming is authoritative). Three conflicting hunks,
  all in comment/docblock prose; no conflicting executable lines.

  The two sides were complementary, not competing:
  - **OURS** (`b8399b2fcf`, *"fix(uat): retire the superseded colour-retrofit
    UATs and stale wording"*) contributed only a vocabulary rename —
    "asset directory" → "asset store" — across three comment sites, after
    REQ-142 moved the filesystem behind the `SiteStore` port. No code.
  - **THEIRS** (`d46756fefa`, *"fix(assets): a site's assets are the bytes it
    holds [FREE-CODED]"*) rewrote the same comments substantively: the listing's
    single source is now the store, the declared `site.json` registry is gone,
    and the AC-1019 docblock withdrawal note was added. Plus all the code
    changes in the file.

  Resolution: took THEIRS wholesale (per 2c) and re-applied OURS' terminology
  rename on top, since the renamed term appears inside sentences THEIRS
  rewrote. The enrichment's stated fallback ("take the more recent commit by
  timestamp") was not needed — no fact was contested by both sides, so nothing
  had to be discarded and nothing is flagged for post-merge review on that
  basis.

## Incoming changes preserved

`git diff d46756fefa -- tests/reconciliation-site-asset-listing.test.ts` shows
**only** the three "directory"→"store" prose blocks. Zero executable-line
divergence from the incoming commit. Specifically confirmed present:

- the BUG-44 single-source docblock and its AC-1019 withdrawal note;
- `test_UAT_BUG-44_the_listing_reports_the_store_and_nothing_but_the_store`,
  including the stale-`assets`-array fixture, the `ghost` negative assertion,
  and the `not.toHaveProperty('alt')` loop;
- the narrowed `seedSite(cwd, slug, { files? })` signature and its
  `seedSite(cwd, 'undeclared')` call site (no `registry:` argument survives
  anywhere in the file);
- AC-1020's rewritten closing note explaining the withdrawn `https://`
  boundary case.

No BUG-1301 precedence exception was invoked; no hunk was dropped.

### Note on the AC-1019 test function (rule 2f)

`test_UAT_AC1019_a_declared_asset_contributes_its_identity_and_is_listed_with_no_file`
exists on the OURS side of this conflict and is absent from the resolved file.
This is **not** a deletion I chose. The incoming commit itself replaces that
`it(...)` block with its inverse — `test_UAT_BUG-44_the_listing_reports_the_store_and_nothing_but_the_store`
— and documents the withdrawal explicitly in its message ("Withdrawn with the
field they assert on: AC-1019 ... unreachable once nothing declares an asset").
The test slot is still occupied, with an inverted assertion; nothing was
dropped to make a conflict go away. Keeping OURS' opening lines was also not
an option mechanically: the common (non-conflicted) tail of that hunk is
BUG-44's body, so retaining OURS would have double-declared `const assets`.
This file is `tests/reconciliation-*.test.ts`, governed by 2c, not 2f's
`tests/**/test_UAT_*.py` scope.

### Verification run

`npx vitest run tests/reconciliation-site-asset-listing.test.ts` →
**5 passed**, 1 unhandled error. The error is environmental, not a resolution
defect: the second `describe` calls `startBuilder`, which dies on
`listen EPERM 0.0.0.0` because this sandbox forbids binding a port. Every
command-line test passes, including the resolved AC-1018 and the new BUG-44
test. AC-1023 (builder-origin) is unverified here and needs a run with network
permission.
