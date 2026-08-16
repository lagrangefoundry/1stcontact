---
uid: comment-554647a8
id: COMMENT-1024
type: comment
title: Claude response for overlap_survey report
created_by: xgd
created_at: '2026-08-16T00:14:51.623466+00:00'
updated_at: '2026-08-16T00:14:51.623466+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-540cf83a
  kind: note
---

Report created and verified.

## Cross-Capability Overlap Survey — complete

**`report-540cf83a` (REPORT-2024)** — kind `overlap_survey`, subject `report-7ef6a9ea`, result **fail** (7 clusters), 7 structured items in `fields.items`.

### Baseline
26 capabilities, 30 stories. Every story has a `capability_uid` and all resolve to one of the **13 active** capabilities — no orphans. The other 13 capabilities (5 `superseded`, 8 `deprecated`) hold zero stories and each carries a `merged_into` pointer, so I treated them as tombstones from the 2026-08-05 rebalance rather than competing claims, and excluded them.

Most active capabilities carry explicit **Out of scope** sections that already resolve their adjacent boundaries. I only flagged what stays ambiguous after reading those.

### The 7 clusters
1. **Field-edit vs element-replace** (`f753cecd` / `fe236246`) — strongest. `f753cecd` says its regions expose "plain words and nothing else", but its only story STORY-100 now writes typography, image selection, image treatment and panel backgrounds — verbatim `fe236246`'s scope sentence. The real discriminator is stated in neither body.
2. **Post-write re-render** (`12fee326` / `f753cecd` / `a994b8f3`) — `12fee326` bounds itself at the write path, yet STORY-101 is *"watch the page update in front of me"*. STORY-100 claims re-render for the write path, and `7e4714b7`'s out-of-scope independently agrees — contradicting `12fee326`'s own story.
3. **The palette** (`ae9d65d6` / `b4ac88fc` / `2d32662d`) — mechanism, retrofit migration, and authored setting, claimed three ways.
4. **Component catalog & vetted default look** (`2d32662d` / `ae9d65d6`) — the retired `ce902be4` merged the catalog into `ae9d65d6`, and per CLAUDE.md a default look is an L2 preset, making `2d32662d`'s claim the likelier misfit.
5. **Generated images vs asset inventory** (`2d32662d` / `b4ac88fc`) — nobody owns registering a generated image's handle and provenance.
6. **"Can only act on that site"** (`7e4714b7` / `00e77e55`) — the disclaimer resolves the *declaration*, not the *confinement guarantee* both stories assert.
7. **The local server** (`a12e557f` / `a994b8f3`) — both own a locally-running server serving rendered output; "preview" means different things in each.

The report body also records six boundaries I examined and deliberately **did not** flag (STORY-82, STORY-84/86, STORY-104, STORY-93, STORY-92, the tombstones), with the reasoning, so a resolver doesn't re-tread them.

Two notes on process: shell loops, heredocs and `cd` are blocked in this permission mode, so I issued the capability queries individually; and I wrote the report body via `.xgd/tmp/overlap_survey_7ef6a9ea.md` + `--body-file` rather than the prompt's `--stdin` heredoc form. No tickets were modified — survey only.
