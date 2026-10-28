---
uid: acceptance_criterion-7db0225c
id: AC-2047
type: acceptance_criterion
title: capture_site refuses a non-http(s), credentialed, private, loopback, link-local
  or local-name address with REFUSED before any browser is leased
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T21:19:20.522734+00:00'
updated_at: '2026-10-28T04:07:34.197337+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
`capture_site` refuses the typed address under the declared `REFUSED` error before any browser is leased, and records no reference, when the address:
- is not a URL, or uses a scheme other than http/https (e.g. `file:`, `data:`, `javascript:`);
- carries a username or password (refused, not stripped);
- names private, loopback, link-local, unique-local, CGNAT, "this network", IETF-reserved or multicast/reserved space. This includes `169.254.169.254` as a bare IPv4 literal, as `[::ffff:169.254.169.254]` and as `[::ffff:a9fe:a9fe]`; `127.0.0.1`, `10.x`, `172.16–31.x`, `192.168.x`, `100.64–127.x`, `::1`, `fe80::/10` and `fc00::/7`;
- names this machine or its network by word: `localhost`, or a name ending `.local`, `.localhost`, `.internal` or `.home.arpa`.

The error text gives a reason the client could act on. For address-space refusals it names the refused address (its host). For scheme refusals it names the scheme (or says the input is not a URL). For credential refusals it says a URL carrying a username or password is not fetched, and it **never echoes the URL**, so the secret is not repeated. Ordinary public names and addresses (`example.com`, `notlocalhost.com`, `8.8.8.8`) are not refused by this rule.

> Aligned to code per fix_plan iteration 6 ruling (aligned_to_tip).

## Verification
For each listed address, drive `capture_site` through the composed surface with a browser double that records whether it was leased. Assert a `REFUSED` error: it contains the address for address-space refusals, the scheme for scheme refusals, and "username or password" without the secret for credential refusals. Assert that the browser was never leased, nothing was fetched, and `list_references` is unchanged. For the public examples, assert no pre-flight refusal.