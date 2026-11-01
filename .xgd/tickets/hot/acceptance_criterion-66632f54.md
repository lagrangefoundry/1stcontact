---
uid: acceptance_criterion-66632f54
id: AC-2229
type: acceptance_criterion
title: createDraft reports whether it created the site, and provisioning a business
  whose starter slug already holds a site leaves its definition and pages unchanged
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:29:49.527312+00:00'
updated_at: '2026-11-01T20:29:49.527312+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

Creating a draft site **reports whether it actually created it**: the first
creation of a slug in an account answers true, and a second creation of the same
slug answers false and changes nothing about the site already there. The answer
comes from the store's own record of whether the creation wrote a row, not from a
separate read, so a concurrent creator cannot make it claim a creation it did not
make.

Provisioning a business scaffolds its starter site **only when that creation
answered true**. A business whose starter slug already holds a site has that
site left entirely alone: its definition, its pages, its write version and its
change count are unchanged — not merged with the starter, not repaired.

## Verification

Create a draft for a slug and assert true; create it again and assert false.

Store a site with an authored definition and a non-starter home page at the slug
provisioning will use, provision the business, and assert the stored definition
and every page are byte-identical to before, and that version and change count
did not move. Provision a business onto a fresh slug and assert the starter site
is written.
