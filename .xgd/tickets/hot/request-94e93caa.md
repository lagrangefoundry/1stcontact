---
uid: request-94e93caa
id: REQ-153
type: request
title: Reserve locale-shaped page slugs
created_by: xgd
created_at: '2026-08-20T21:59:29.784434+00:00'
updated_at: '2026-08-20T21:59:29.784434+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: low
  story_points: 1
  auto_merge_back: true
  needs_review: false
---

# Reserve locale-shaped page slugs

## Why

`pageSchema.slug` is an unconstrained `z.string()`
(`packages/site-schema/src/schema.ts:540`). Nothing stops a page being slugged `de` or `fr`.

If a locale path prefix (`/de/about`) is ever adopted — the conventional and most likely
shape, and the one [[DOC-34]] §9 leaves open — a page already published at `/de` becomes
structurally ambiguous with the locale segment. Because published URLs are what inbound
links, search rankings and anything a customer has printed or shared all point at, that
ambiguity is awkward to resolve after the fact rather than merely untidy.

This is **cheap insurance, not a must**. Multilingual sites are explicitly deferred
([[DOC-34]] §9), and if a subdomain or query-parameter shape is chosen instead the concern
disappears entirely. It is proposed only because the guard costs about half an hour now and
removes a class of collision permanently.

## What to change

Add a refinement to `pageSchema.slug` rejecting bare ISO-639-1 two-letter language codes,
and the `xx-XX` language-region form. The error must say **why** the slug is refused and
suggest an alternative (`de` → `de-services`, `about-de`), because a validation failure
that reads as arbitrary is worse than no validation.

Existing sites must be checked before this lands — a slug that already violates the rule
would break validation for a stored site. Neither current site has one, but the check
belongs in the implementation rather than in this ticket's assumptions.

## Acceptance criteria (provisional)

1. A page slugged `de`, `fr` or `pt-BR` is a validation error with a machine-readable path
   and an actionable message.
2. A page slugged `design`, `deals` or `delivery` validates — the rule matches *only* the
   exact locale forms, never a prefix.
3. Both existing sites still validate.

## Test approach

UATs named `test_UAT_FC_REQ-<id>_*` covering AC 1–3, with AC 2 parameterized over
near-miss slugs that begin with a language code. Regression scope is the site-schema
validation suite.

## Why free-coded

A single validation refinement with no dependencies.

## Origin

[[CHAT-26]] · [[DOC-34]] §9 — FR-5 of that session's foundational review, explicitly
flagged there as discretionary.
