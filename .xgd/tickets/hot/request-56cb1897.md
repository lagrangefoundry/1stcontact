---
uid: request-56cb1897
id: REQ-102
type: request
title: '1c new scaffolds no L1 document: authored sites start from nothing'
created_by: xgd
created_at: '2026-07-26T01:27:13.225254+00:00'
updated_at: '2026-08-06T04:55:00.468771+00:00'
completed_at: '2026-08-06T04:55:00.468771+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: low
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 885dd586b10a6466cc7078e23ade0c588ffc5e87
    reconcile_sha: null
    main_sha: null
  version: 0.0.223
  story_points: 2
  bundled_in: bundle-ee56a66e
  chat_comment: comment-dbad764d
---

## The gap

`1c new <slug>` scaffolds a page with `{ "modules": [] }` and **no `l1` block**:

```jsonc
{ "id": "home", "slug": "home", "title": "Home",
  "seoMeta": { … }, "modules": [] }
```

So authoring a site begins by hand-writing the entire L1 document from nothing —
the `widths` ladder, `background`, `resources`, and the `root` container — before
a single pixel exists. Every authored site pays this, and every author must know
the ladder convention by heart or copy it from an unrelated site.

Confirmed while authoring xgd.dev ([[request-d41fd017]], REQ-95), which
anticipated this as a candidate gap in its Dependencies section.

## Proposed change

`1c new` scaffolds a **minimal valid L1 document** by default — not behind a
`--l1` flag. L1 is now *the* way to author a site; a flag would be exactly the
mode-detection that `CLAUDE.md` forbids ("Do NOT auto-detect which mode to use
between old and new implementations").

Minimum useful skeleton: the standard `widths` ladder, a `background`, and a
`root` stack container with `align: center` and one placeholder text leaf — i.e.
something that **renders** immediately, so `1c render` / `1c shot` work on a
fresh site with no editing.

## One check before implementing

Confirm `1c repro <slug> --ref <bundle>` **overwrites** rather than merges the
page document. Its help text says "idempotent — re-import rebuilds", which
suggests overwrite, but verify: a scaffolded skeleton must not be able to
contaminate a reproduction import.

## Acceptance

- `1c new <slug>` produces a page whose `l1` block validates against
  `l1DocumentSchema`.
- `1c render <slug>` and `1c shot <slug>` succeed immediately on a fresh site
  with no hand editing.
- `1c repro` over a freshly scaffolded slug yields the same result as over a
  slug that never had a skeleton.
- No flag, no mode detection, no legacy path.

-