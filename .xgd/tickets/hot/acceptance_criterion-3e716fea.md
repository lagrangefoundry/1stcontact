---
uid: acceptance_criterion-3e716fea
id: AC-1437
type: acceptance_criterion
title: Slugs that merely resemble or extend a language code still validate
created_by: xgd
created_at: '2026-08-31T12:28:45.983189+00:00'
updated_at: '2026-08-31T12:28:45.983189+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-17ba490e
  kind: behavior
  regression_only: false
---

## Criterion

The reservation matches only whole, exact locale segments whose language part is
a real ISO 639-1 code. A slug that merely begins with, resembles or extends a
language code validates and can be authored.

These all validate: `design`, `deals`, `delivery`, `french-lessons`, `portfolio`,
`english`, `pt-brazil` (a language code with a non-region tail), `zz` and `qq`
(locale-shaped but not real languages — reserving shapes that could never become
a locale is a tax with no collision behind it), `no-fee`, `de-luxe`, `no-cost`,
`it-team` (ordinary English words whose tails are four letters), and `zh-Hans`
(the script subtag form is deliberately not reserved, for the same reason).

The slugs the platform's existing stored sites already use validate.

## Verification

Validate a site definition whose page carries each of the listed slugs in turn
and observe each is valid. Include the slugs in use by the platform's stored
sites, read at verification time rather than named.
