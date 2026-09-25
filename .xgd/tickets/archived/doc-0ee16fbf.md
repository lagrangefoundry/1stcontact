---
uid: doc-0ee16fbf
id: DOC-57
type: doc
title: The components a site can use
created_by: REQ-310
created_at: '2026-09-25T00:48:10.339080+00:00'
updated_at: '2026-09-25T00:48:10.339080+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  doc_kind: system_kb
  projected: true
  source: packages/framework/src/modules/catalog.ts
---

# The components a site can use

> Generated from the framework behavior catalogue. Do not edit: this document is rebuilt from its
> source on every build, and an edit here is lost without warning.

Every component the framework ships, with the settings it takes and the parts of
a page it fills. A site uses a component by naming it and its version; the
framework supplies the behaviour and the page supplies everything that is seen.

The catalogue holds 4 components.

## contact-form

The `contact-form` component, version 7.

Settings `contact-form` takes:

- `fields` — list; 1–8 item(s); required. Each item:
  - `name` — string; required
  - `label` — string; required
  - `labelMode` — enum; one of `visible`, `placeholder`; default `visible`; optional
  - `type` — enum; one of `text`, `email`, `tel`, `textarea`, `checkbox`; required
  - `required` — boolean; default `false`; optional
  - `acceptance` — enum; one of `newsletter`, `beta_requested`, `whitepapers`; optional
- `accepts` — list; at most 8 item(s); optional. Each item:
  - `key` — enum; one of `newsletter`, `beta_requested`, `whitepapers`; required
  - `wording` — string; required
- `assets` — list; at most 8 item(s); optional. Each item:
  - `key` — string; optional
  - `name` — string; optional
  - `url` — url; optional
- `template` — string; optional
- `successMessage` — string; optional
- `submitLabel` — string; default `Send`; optional

Parts of the page `contact-form` holds:

- `form`; one; required

Elements `contact-form` supplies for the page to style:

- `field` — an HTML `input` element; one per item of `fields`; the page must supply its appearance
- `submit` — an HTML `button` element; optional
- `label` — an HTML `label` element; painted by the component itself, never by the page; cannot be bound from L1, and is absent from the catalogue for that reason; visually hidden — clipped out of the visual flow; a `placeholder` field's words reach a visitor through its `labelMode` instead
- `honeypot` — an HTML `input` element; painted by the component itself, never by the page; cannot be bound from L1, and is absent from the catalogue for that reason; off-screen and out of the tab order — a bot fills it and a person never sees it, so a designer who could reveal it would break the check
- `turnstile` — an HTML `span` element; painted by the component itself, never by the page; cannot be bound from L1, and is absent from the catalogue for that reason; an empty mount the widget replaces; it must sit where the widget expects it, so nothing here is the page’s to move

`contact-form` is obliged to satisfy: `safety`, `security`, `x-browser`, `responsive`, `isolation`.

## carousel

The `carousel` component, version 3.

Settings `carousel` takes:

- `autoplay` — boolean; default `false`; optional
- `loop` — boolean; default `false`; optional

Parts of the page `carousel` holds:

- `slide`; one per item; 1–20 item(s); required
- `dots`; one; optional

Elements `carousel` supplies for the page to style:

- `dot` — an HTML `span` element; one per item of `slide`; optional

`carousel` is obliged to satisfy: `safety`, `security`, `x-browser`, `responsive`, `isolation`.

## account-portal

The `account-portal` component, version 1.

Settings `account-portal` takes:

- `account` — url; required
- `acceptances` — url; optional
- `revealLabel` — string; default `Delete account`; optional
- `dismissLabel` — string; default `Close`; optional
- `preferencesLabel` — string; default `Your preferences`; optional

Parts of the page `account-portal` holds:

- `body`; one; required
- `erasure`; one; required

Elements `account-portal` supplies for the page to style:

- `reveal` — an HTML `button` element; the page must supply its appearance
- `dismiss` — an HTML `button` element; optional
- `identity` — an HTML `span` element; painted by the component itself, never by the page; cannot be bound from L1, and is absent from the catalogue for that reason
- `holdings` — an HTML `span` element; painted by the component itself, never by the page; cannot be bound from L1, and is absent from the catalogue for that reason
- `preferences` — an HTML `ul` element; painted by the component itself, never by the page; cannot be bound from L1, and is absent from the catalogue for that reason; one row per acceptance the endpoint returned, in the order it returned them; the module supplies the list, the checkbox and nothing else, and every paint axis is inherited from the L1 around it

`account-portal` is obliged to satisfy: `safety`, `security`, `x-browser`, `responsive`, `isolation`.

## account-chrome

The `account-chrome` component, version 2.

Settings `account-chrome` takes:

- `signIn` — url; required
- `portal` — url; required
- `businesses` — url; required
- `signInLabel` — string; default `Sign in`; optional
- `portalLabel` — string; default `Your account`; optional
- `businessesLabel` — string; default `My businesses`; optional
- `emailLabel` — string; default `Email address`; optional
- `labelMode` — enum; one of `visible`, `placeholder`; default `visible`; optional
- `submitLabel` — string; default `Send me a link`; optional
- `dismissLabel` — string; default `Close`; optional

Parts of the page `account-chrome` holds:

- `signedOut`; one; required
- `signedIn`; one; required
- `businesses`; one; required
- `dialog`; one; required
- `sent`; one; required
- `error`; one; required

Elements `account-chrome` supplies for the page to style:

- `signIn` — an HTML `button` element; the page must supply its appearance
- `portal` — an HTML `a` element; the page must supply its appearance
- `businesses` — an HTML `a` element; the page must supply its appearance
- `email` — an HTML `input` element; the page must supply its appearance
- `submit` — an HTML `button` element; the page must supply its appearance
- `dismiss` — an HTML `button` element; optional
- `emailLabel` — an HTML `label` element; painted by the component itself, never by the page; cannot be bound from L1, and is absent from the catalogue for that reason; visually hidden — clipped to 1×1px so it neither paints nor displaces the L1 around it; the words reach a visitor through `config.labelMode`

`account-chrome` is obliged to satisfy: `safety`, `security`, `x-browser`, `responsive`, `isolation`.
