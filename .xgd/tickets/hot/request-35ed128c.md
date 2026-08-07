---
uid: request-35ed128c
id: REQ-124
type: request
title: 'webui-shell: expose typography as design tokens (font, fontMono) — hosts cannot
  set a font family'
created_by: xgd
created_at: '2026-08-07T23:40:43.511402+00:00'
updated_at: '2026-08-07T23:40:43.511402+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

# webui-shell: expose typography as a design token (`font`, `fontMono`)

**Raised by**: 1stcontact, ticket REQ-121 (copy-edit modal typography).
**Component**: `components/webui/shell/js/src/` — `shell.css`, `tokens.js`.

## The gap

`webui-shell` is the host's theming surface: `TOKEN_NAMES` in `tokens.js` is the
whole overridable vocabulary, and it is

    bg  fg  muted  accent  surface  border  overlay  radius  gap

— nine tokens, all colour/metric, **none typographic**. Meanwhile `shell.css`
pins the family outright:

    .shell {
      …
      font-family: system-ui, -apple-system, sans-serif;
    }

So a host cannot set the font family of its own application through the
component's own extension point. Everything downstream inherits — `webui-fields`
controls are `font: inherit`, `.shell-tab` is `font: inherit` — which means this
one declaration decides the typography of every consumer, and it is the only
declaration in the stylesheet a host has no token for.

The colour half of the problem is already solved correctly (`--shell-fg`,
`--shell-muted`), which is what makes the typographic half look like an
oversight rather than a decision.

## What is needed

A `font` token, and — since `fields.css` already hardcodes
`ui-monospace, SFMono-Regular, Menlo, monospace` in two places for hex/uid
display — a `fontMono` companion:

    // tokens.js
    export const TOKEN_NAMES = Object.freeze([… , 'font', 'fontMono'])

    /* shell.css */
    .shell {
      --shell-font: system-ui, -apple-system, sans-serif;
      --shell-font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
      …
      font-family: var(--shell-font);
    }

The current values become the defaults, so nothing changes for a host that
supplies neither.

## Why a token and not a host override

A host *can* out-specify `.shell { font-family }` from its own stylesheet by
load order. We do not want to, for the reason the component's own token design
already encodes: an override is invisible to the component, silently fragile
across upstream refactors of that selector, and it forks the decision about
where a consumer's look is configured. `bg` and `accent` are overridable for
exactly these reasons; family belongs in the same list.

## Note on themes (not a request, just the intent)

We will set `font` once at mount, not per theme — a theme swaps a palette, not
a typeface. The existing token path already supports both, since themes are
just token maps; no special handling is being asked for.

## Acceptance

- `font` and `fontMono` are accepted by `validateConfig` / `applyTokens` and
  land as `--shell-font` / `--shell-font-mono` on the shell root.
- `.shell` consumes `--shell-font`; the current stack is the default value.
- A shell mounted with no token overrides renders byte-identically to today.
- The two hardcoded mono stacks in `fields.css` (`.fields-swatch-text`,
  `.fields-control-color-text`) consume `--shell-font-mono` with the current
  stack as fallback.
