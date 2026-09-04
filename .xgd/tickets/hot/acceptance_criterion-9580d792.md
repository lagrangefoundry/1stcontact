---
uid: acceptance_criterion-9580d792
id: AC-1526
type: acceptance_criterion
title: A host missing what the knowledge base needs refuses by name rather than searching
  to nothing
created_by: xgd
created_at: '2026-09-04T03:20:12.951736+00:00'
updated_at: '2026-09-04T03:32:04.319903+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-bb91191c
  kind: behavior
  regression_only: false
---

## Criterion

Where the host is missing something the client's knowledge base cannot work without, opening it
fails immediately with a message naming what is missing and where to declare it — it never yields
a knowledge base whose searches quietly return nothing.

Two such cases:

- **No embedding capability configured**: the refusal names the missing capability, states that
  nothing can be indexed or searched without it, and names both places it must be declared — the
  local-development configuration and the production one, which does not inherit it.
- **No private store available for the index**: the refusal says the index has nowhere to live and
  names the store it needs, rather than failing later on an undefined value.

Both are configuration errors, distinguishable from an account that simply has no knowledge yet:
an unconfigured host refuses, whereas a new client's knowledge base opens and searches to an
empty result.

## Verification

Open the client's knowledge base on a host with no embedding capability configured: it refuses,
and the message names the capability and both declaration sites. Repeat with no private store
available: it refuses, naming the store. Then open it on a correctly configured host for an
account with no records: it opens, and a search returns an empty result rather than an error —
the two situations are not confusable.