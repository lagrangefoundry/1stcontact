---
uid: sprint-9006c5b0
id: SPRINT-1
type: sprint
title: 'Sprint 1: Move the shared UI component scope to @lagrangefoundry in lockstep,
  with one definition site'
created_by: xgd
created_at: '2026-08-07T23:21:51.679348+00:00'
updated_at: '2026-08-07T23:44:42.303695+00:00'
completed_at: null
last_field_updated: story_order
status: in_progress
fields:
  number: 1
  intent_uid: bug-5cabb340
  goals: 'Close the rebranding gap in the builder workspace: the shared UI components
    are consumed under the renamed scope @lagrangefoundry, declared in exactly one
    place, with the superseded scope removed outright rather than deprecated. Restore
    loud evidence in place of the silent green — consumption evidence (resolution,
    resolved package identity, generated-document and browser-source agreement) becomes
    unconditional so a one-sided rename fails by name instead of skipping. Single-story
    sprint: the whole delta lands on STORY-99''s scope-related acceptance criteria.'
  start_date: '2026-08-07'
  duration: 14
  task_count: 0
  task_specs: []
  story_uids:
  - story-e674c60a
  story_count: 1
  story_order:
  - index: 1
    story_uid: story-e674c60a
    story_kind: upgrade
    title: 'The builder workspace: one browser surface showing my real rendered site,
      with the controls that act on it, served from a single origin'
    dependencies: []
---

# Sprint Summary

**Intent**: bug-5cabb340 (BUG-32 — Rebranding gap: WEBUI_SCOPE still resolves @gendevlabs)

## Selected Stories

- STORY-99: 'The builder workspace: one browser surface showing my real rendered site, with the controls that act on it, served from a single origin' (upgrade)

STORY-99 is owned by bundle-15c1f647 and reaches this sprint via `fields.updated_by = [bug-5cabb340]`. Its `intent_uid` therefore does not equal this intent — expected for an upgrade routed in from another intent, not a reason to skip it.

## Story Order

| # | Story | Kind | Dependencies |
|---|-------|------|--------------|
| 1 | STORY-99: The builder workspace: one browser surface showing my real rendered site, with the controls that act on it, served from a single origin | upgrade | - |

## Goals

Move this repository's consumption of the shared UI components to the renamed scope `@lagrangefoundry` in lockstep with upstream, holding the one-definition rule: the scope is declared once, every generated reference composes it from that declaration, and the superseded scope appears as a literal in no tracked file — including generated artifacts checked in beside their generator, and including prose. Replace the silent-green failure mode with unconditional consumption evidence, so a half-completed rename fails and names the component it could not account for rather than reading as "not installed yet".

## Scope of the delta

This is an in-place upgrade of an already-implemented story. Only the acceptance criteria the intent review touched are in play; previously completed workspace behaviour (modes, toolbar, split persistence, freshness, confinement) is not re-implemented.

Delta acceptance criteria:

- **AC-960** — Every name the workspace shows for the site surface has exactly one definition site. Extended to cover the component scope: declared once, composed everywhere, superseded scope nowhere, with the browser-source exception declared and bounded rather than trusted.
- **AC-961** — The shared UI components are served byte-identical from an installed copy outside this repository. Extended so the *right* copy must resolve: the resolved package must declare itself under the scope in use, and this is asserted unconditionally rather than skipped.
- **AC-963** — The workspace document references each component through the entry point that component itself declares. Extended so every generated reference is under the scope in use, every consumed component has one, the set is non-empty, and no reference names the superseded scope.

## Notes and risks

- **Environment precondition, not a code defect.** The shared artifact store must be resolvable from wherever the evidence runs, including a detached working tree that does not inherit the main checkout's neighbours. A resolution failure should be read as a precondition failure.
- **The one bounded exception.** The builder's browser source (`apps/control-app/src/builder/*.js`) is served verbatim and can read no build-time value, so it names components directly. It is held in step by requiring every specifier it names to be a key the generated import map declares — otherwise the mismatch would surface only in a browser.
- **No fallback, no dual-scope detection.** Per the story's technical context and the project's no-legacy-modes rule, the old scope is deleted rather than deprecated. A half-completed rename is meant to be loud.
- **Pre-existing unrelated failures.** Six failures in `reconciliation-copy-edit-gesture-modal` (5) and `req115-builder-composition` (1, `open_in_new_tab_matches_the_iframe_exactly`) were confirmed present against the old scope as well. They are outside this sprint's scope and are not to be absorbed into it; the regression bar for this sprint is the scope-related criteria above.

## Composition check

No composition stories are in this sprint's backlog, so no composition ordering or cross-sprint deferral applies.