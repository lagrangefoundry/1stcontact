---
uid: request-420e1a6e
id: REQ-170
type: request
title: 'The admin console: users, entitlements, and the invite that provisions an
  account'
created_by: xgd
created_at: '2026-09-01T00:51:42.772184+00:00'
updated_at: '2026-09-01T00:51:42.772184+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
---

# The admin console: users, entitlements, and the invite that provisions an account

## The gap

[[REQ-167]] puts users, memberships and entitlements in D1 and defines the invite
that provisions an account. Nothing can operate any of it. Without this ticket
onboarding is `wrangler d1 execute` against a production database, which is
survivable for three people and not for thirty.

This is the operator's tool. It is what makes the alpha runnable.

## The console

A `/admin` route in `apps/control-app`, gated by a **`PLATFORM_ADMINS` env var**
listing email addresses. [[DOC-40]] §6: an env var has no bootstrapping problem —
it works before any row exists and cannot lock its holder out of the system that
would grant them the flag. The `users.platform_admin` column is also honoured,
so the two agree; the env var is the seed.

The gate is checked in the Worker, after Access verification, before any admin
asset is served. Same rule as [[REQ-169]] and for the same reason.

## Two panes, from components that exist

`webui/split` beneath `webui/list-detail`, exactly as [[REQ-161]] uses them for
the Library — **users on the left, detail on the right.**

The detail pane is `mountFields` over the user's record. Initially: created,
modified, email, and when the terms were accepted. `mountFields` is generic and
origin-neutral by construction — it takes field descriptors and values and never
reaches for a store — so this is a descriptor list and a save callback, not a
new editing vocabulary.

**Dependency on the asset build.** `webui-list-detail` is not currently in
`apps/control-app/dist-assets/webui` — only `chat`, `fields`, `markdown`,
`shell` and `split` are. [[REQ-161]] adds it as part of the Library tab. If this
ticket lands first it owns that addition to `1c assets`; if [[REQ-161]] lands
first it is already done. A UAT asserts the built assets contain it either way,
so neither ordering leaves it out.

## Entitlements are editable

A second list, or a section of the user's detail, showing the account's grants:
`plan`, `source`, `status`, `starts_at`, `ends_at`, `note`.

The operator can **create a date-bounded grant** (`plan='pro'`,
`source='admin_grant'`) and **revoke** one. Revocation sets `revoked_at` and
`status='revoked'` rather than deleting the row — the history of what access was
given is the thing being kept.

Grants are displayed as a **list**, not as a single current value. An account
accumulates them ([[DOC-40]] §5) and a UI that shows one would misrepresent an
account holding two the moment billing lands.

## The invite

One action, taking an email address and an end date. It calls [[REQ-167]]'s
provisioning function — user, account, membership, entitlement — and creates the
starter site.

### The starter site

**A single blank page reading "Your 1stcontact site".** Not a template, not an
import. The point is that a person who logs in for the first time finds
something to edit rather than an empty tenant and a create-site flow that does
not exist yet.

A UAT asserts a freshly invited account has exactly one site and that it renders.

## Not in scope

Editing memberships, support-access grants, self-service anything, and the
payments funnel that an expired grant should eventually lead to.
