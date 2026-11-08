---
uid: acceptance_criterion-49223881
id: AC-2465
type: acceptance_criterion
title: A host that does not resolve is not retried. Exactly one www-alternate is tried,
  guard-checked first and never invented for IP literals, localhost or single-label
  names; a timeout earns no alternate
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T15:29:37.308534+00:00'
updated_at: '2026-11-08T15:29:37.308534+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
When a `capture_site` navigation fails because the hostname did not resolve (Chromium `net::ERR_NAME_NOT_RESOLVED`, or a Node resolver `ENOTFOUND` / `EAI_AGAIN` / `getaddrinfo` failure), that host is navigated **exactly once**. It does not use up the retry budget (default: 3 attempts).

After a resolution failure, **exactly one** alternate host is tried, made by changing only the hostname. Scheme, path and query stay the same:
- a host starting with `www.` is tried without it (`www.example.com` → `example.com`);
- a host with at least one dot and no `www.` is tried with it (`example.com` → `www.example.com`);
- **no alternate** exists for an IP literal (IPv4 or IPv6), `localhost` or any other private/loopback/local name, or a single-label host (`intranet`). These are attempted once and no second hostname is navigated.

The alternate is a URL the tool chose, not one the caller typed. It is checked against the same egress rule as the typed address **before** it is fetched, and an alternate the rule would refuse is never navigated. The alternate's own transient failures (timeouts, resets) are retried up to the normal attempt budget.

A **navigation timeout, connection reset or any other failure that is not a resolution failure** keeps the existing behaviour: the same host is retried up to the full attempt budget, and **no alternate host is tried**.

## Verification
Drive `capture_site` (or the capture pipeline it composes) with a browser double that records every navigated URL:
1. `www.<host>` raises `ERR_NAME_NOT_RESOLVED` and `<host>` succeeds: the capture succeeds, and `www.<host>` was navigated once, not three times.
2. Mirrored: bare `<host>` does not resolve and `www.<host>` succeeds.
3. Every navigation times out: the typed host is navigated to the attempt budget and no other hostname appears.
4. For `127.0.0.1`, `[::1]`, `localhost` and `intranet` with a resolution failure: one navigation, no second hostname.
5. An alternate that the egress rule refuses is never navigated.
