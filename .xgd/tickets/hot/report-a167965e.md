---
uid: report-a167965e
id: REPORT-5759
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T18:15:03.558370+00:00'
updated_at: '2026-09-30T18:15:03.558370+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

Cherry-pick: `ebed879815` — *feat(dns): assistant DNS tools, guarded mutations, the card and undo [FREE-CODED]* (REQ-260).
Two `UU` conflicts, both code files. Both sides kept in full; nothing of incoming discarded.

- **`apps/control-app/src/builder/builder.css`** — UU, code file, rule 2c. Two
  conflict regions, both the same artefact: HEAD appended the inbound-mail
  section (REQ-267) and incoming appended the DNS-history/card section
  (REQ-260) at the same point in the file, and git matched them on their
  shared trailing declarations (`opacity: 0.5; cursor: default; }` in the
  first region, a bare `}` in the second). Purely non-overlapping additions,
  so **BOTH kept**: each side's final rule was given its own closing body and
  the two blocks placed one after the other. Verified by selector-set diff
  against the `:2:` (ours) stage — zero HEAD selectors lost — and all 12
  incoming selectors present (`.builder-dns-history__body`,
  `.builder-dns-change`, `__summary`, `__foot`, `__when`, `__undone`,
  `__undo`, `__undo:hover:not(:disabled)`, `__undo:disabled`, `__note`,
  `__note:empty`, `.builder-dns-card`). Brace count balanced (345/345).

- **`tests/support/d1-site-factory.ts`** — UU, test-support code file, rule 2c.
  Three conflict regions, all the recurring `MIGRATIONS` / `atHead` docblock
  pair:
  1. **The `MIGRATIONS` list** — non-overlapping additions, **BOTH kept**.
     HEAD's `0014_capture_gutter`, `0015_inbound_mail`, `0016_gutter_collection`
     retained; incoming's `0014_dns_changes` inserted in **filename order**
     (after `0014_capture_gutter.sql`, before `0015_inbound_mail.sql`), which
     is the order `wrangler d1 migrations apply` will run these in and the
     order this fixture exists to mirror. `0014_dns_changes.sql` is
     `CREATE TABLE IF NOT EXISTS` plus two `CREATE INDEX IF NOT EXISTS` with
     no dependency on `0015`/`0016`, so the position is safe as well as
     faithful.
  2. **The `atHead` docblock** — **HEAD kept**, and this is not a discard of
     incoming; see the next section.
  3. **The `atHead` bind value** — **HEAD kept** (`idx_users_synthetic`), same
     reason. Incoming's companion change to the same statement — the predicate
     moving from `type = 'trigger'` to `type = 'index'` — is *already present*
     in HEAD, so the resolved statement is byte-identical to what incoming
     wanted apart from the index name.

## Incoming changes preserved

`git show ebed879815 -- tests/support/d1-site-factory.ts` contains exactly
three changes, and all three are accounted for:

1. **Add `0014_dns_changes.sql` to `MIGRATIONS`** — the only substantive
   change to this file. **Present** in the resolved version, with incoming's
   full comment.
2. **Point `atHead` at `[[REQ-260]]`'s `idx_dns_changes_zone`** (docblock +
   `.bind(...)` + `type = 'index'`) — **deliberately not taken**, and this is
   not data loss. `atHead` is bookkeeping whose contract the docblock states
   itself: *"IT ASKS ABOUT THE LAST FILE IN THE LIST, WHICHEVER THAT IS"* and
   *"this marker MOVES WITH THE LIST"*. Incoming wrote `idx_dns_changes_zone`
   because `0014_dns_changes.sql` was last in *its* list. In the merged list it
   is not last — `0016_gutter_collection.sql` is, already integrated into HEAD
   by an earlier pick in this same resync queue — so taking incoming's marker
   would have made `atHead` answer "at head" for a database stopped at `0014`
   and silently skip `0015` and `0016`, which is precisely the hole the
   docblock's own prose says the marker exists to close. Keeping HEAD's
   `idx_users_synthetic` *honours* incoming's stated rule rather than
   overriding it. HEAD's docblock is also the strictly later revision of the
   same paragraph (it carries the corrected `0004_retire_site_slug` filename
   where incoming's still says `0005`, and the `ALTER TABLE ADD COLUMN`
   re-run hazard `0014_capture_gutter` introduced).
3. **Drop the stale `LAST IN THE LIST` line from the `0013` comment** —
   **already present**: HEAD had removed it too.

`git show ebed879815 -- apps/control-app/src/builder/builder.css` is 81
insertions and 0 deletions — a pure append. Every inserted line is present.

### One authored comment line, disclosed

Incoming's `0014_dns_changes` entry carried the trailing comment line
`// LAST IN THE LIST, which is what atHead below asks about.`, which the merge
makes false (it is no longer last). Rather than commit a comment that
contradicts the code three lines below it, that one line was replaced with a
note stating why the entry sits where it does (filename order = wrangler's
apply order). No code, test, or matrix content was authored; the substitution
is confined to that single comment line and is noted here because the rules
bar authoring.
