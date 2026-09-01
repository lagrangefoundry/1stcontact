---
uid: request-8c5c0bb6
id: REQ-168
type: request
title: The tenant comes from the identity, not from the configuration
created_by: xgd
created_at: '2026-09-01T00:51:05.648749+00:00'
updated_at: '2026-09-01T00:51:05.648749+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
---

# The tenant comes from the identity, not from the configuration

## The gap

`TENANT_ID` is a deployment variable. Every logged-in person is served the same
tenant, which means two onboarded users would edit each other's sites.

`store.ts` already names this ticket in its own header:

> Deriving the tenant from the verified Access claims is where this ends up —
> the gate already proves who the caller is (`access.ts`) — but that mapping is a
> piece of account modelling with no second account to model against yet. A var
> is the honest interim. Cross-tenant admin arrives with the ticket that needs
> it.

[[REQ-167]] supplies the second account and the mapping. This is that ticket.

**This is the critical path for onboarding.** Nothing else on the list is
load-bearing for isolation; without this, invites hand several people the same
tenant.

## The four reads

`env.TENANT_ID` is read in four places, and all four move behind one resolver:

| Site | What it scopes |
| --- | --- |
| `apps/control-app/src/store.ts` | the site store handle |
| `apps/control-app/src/router.ts` | the tenant handed to `workerHost` |
| `apps/control-app/src/knowledge.ts` | the project KB's R2 index prefixes |
| `apps/control-app/src/ai.ts` | the chat transcript archive and audit prefixes |

The plumbing beneath each already takes a `tenantId` parameter, so this is a
change of *where the value comes from*, not a re-architecture. A UAT asserts
`env.TENANT_ID` has no remaining reader outside the resolver — the failure mode
is one site left behind, quietly serving the platform tenant's data into a
customer's session.

## The scope is a value, not a string

```ts
type Scope =
  | { kind: 'tenant'; id: string }
  | { kind: 'platform' }
```

`resolveScope(env, identity)` returns the first form. **The second is declared
and throws.** It is not implemented and is not wanted here.

It exists in the type because [[DOC-40]] §7 parks a platform-scope operations
assistant, and a `Scope` introduced later as a widening of `string` would mean
revisiting every call site this ticket touches. Declaring the variant now costs
one unreachable branch. A UAT asserts constructing a platform scope throws, so
the placeholder cannot quietly become a capability.

**`forTenant` is not modified.** The tenant barrier stays structural: the site
store's root can still do exactly one thing, and the ticket store's scoped
handle stays terminal. Whatever the platform variant eventually becomes, it is a
separate construction path — [[DOC-40]] §7.

## What `TENANT_ID` becomes

It names the **platform's own** tenant — where `users` rows for builder users
live, and where the admin console operates. It stops being the answer to "whose
site am I editing". It keeps failing loud when unset, for the reason `store.ts`
records: a defaulted tenant id is a misconfigured Worker with write access to
whichever account happens to carry that name.

## Authorisation is re-checked on resume

Chat sessions are resumable by id and their transcripts live at
`chat/<tenant>/<sessionId>.md`. If a session bound its scope at open time, a
membership that expired on Sunday would still be live inside a session opened on
Friday.

So: the session records **which account it operates on**, and the resume path
re-runs the same membership and entitlement check as the initial request. A UAT
opens a session, expires the membership, and asserts the resume is refused.

Cheap now, near-impossible to retrofit safely once sessions exist in the wild.

## The platform admin bypass

A user with `platform_admin` set resolves a scope for any account without a
membership row. This is [[DOC-40]] §6 — ambient by design, so it works before any
membership exists and cannot lock its holder out.

The bypass is over the *membership* check only. It does not skip entitlement
(an admin operating an expired account should see what the customer sees) and it
does not grant platform scope.

## Interaction with the knowledge-base work

`knowledge.ts` is being actively edited by [[REQ-158]] / [[REQ-159]] / [[REQ-160]].
The collision is textual, not conceptual: the KMS work is about *what the
assistant knows*, this is about *whose data it is*. The project KB is already
tenant-scoped by prefix ([[REQ-159]]), so per-user tenants need no change there —
each new account simply starts with an empty project KB and the shared system KB.

Sequence this after the in-flight KMS tickets reconcile, or expect a small merge
in one file.
