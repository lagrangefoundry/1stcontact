---
uid: report-06aa9519
id: REPORT-11255
type: report
title: 'Reconciliation Review: commits (BUNDLE-39: BUG-59 + BUG-63 + REQ-204 + BUG-58
  + BUG-64)'
created_by: xgd
created_at: '2026-11-08T03:25:48.596534+00:00'
updated_at: '2026-11-08T03:25:48.596534+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-4164b433
  anchor_uid: bundle-4164b433
  overrides_audited: 0
  trust_boundary_overrides: 0
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: (none; commits mode)
**Anchor**: bundle-4164b433
**Stories Reviewed**: 7 (STORY-120, STORY-170, STORY-119, STORY-149, STORY-171, STORY-146, STORY-104)

0 overrides audited, 0 touched a trust boundary (no mode_override, blocked_by_handoff or aligned_to_tip reports were injected).

## Intent read

All five source sections of BUNDLE-39 were read in full, including the later sections that supersede earlier ones: BUG-59 part two ("And the simulator stops deviating") supersedes part one's email-bound service token, and REQ-204's "Revision" supersedes "Why it is conditional". Every story documents the final, superseding intent, not the retracted one.

## Behavior Inventory

27 behaviours identified across the intent and the landed code.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | A mapped service token is admitted as the person, under that person's memberships, grants, terms and revocation | Covered | STORY-120 | AC-2358 |
| 2 | Casefolded mapping on both sides; mapped address with no user is refused no_user, nothing provisioned | Covered | STORY-120 | AC-2358; whitespace trimming recorded under Reconciliation Decisions |
| 3 | Unmapped or empty mapping is refused no_email; a human's own email always wins | Covered | STORY-120, STORY-146 | AC-2359, AC-1755 (narrowed) |
| 4 | SERVICE_TOKEN_IDENTITIES is declared for every environment, never read from the request | Covered | STORY-120 | AC-2360 |
| 5 | ACCESS.md records the token-to-person mapping and its rules | Covered | STORY-120 | AC-1384 |
| 6 | Session-cookie admission never consults the mapping | Covered (decision) | STORY-120 | Recorded under Reconciliation Decisions |
| 7 | access-sim reverse-proxies to --builder; its own paths take priority | Covered | STORY-170 | AC-2361, AC-2362 |
| 8 | A matching pair is exchanged for a minted assertion and the pair is stripped; method, path, query and body survive the hop | Covered | STORY-170 | AC-2361 |
| 9 | --print-token and --client-id/--client-secret defaults | Covered | STORY-170 | AC-2361; export form recorded as a decision |
| 10 | Complete pair with no address to act as: 403 naming both remedies | Covered | STORY-170 | AC-2361 + decision |
| 11 | Wrong pair: 403; half a pair treated as no pair; cookie forwarded byte-for-byte; no credential: 302 to /login | Covered | STORY-170 | AC-2362 + decisions |
| 12 | Service token minted as common_name with no email; passes the real verifier | Covered | STORY-170 | AC-2318 (modified) |
| 13 | --print-env emits the mapping line; address from --service-email, otherwise PLATFORM_ADMINS (.dev.vars ahead of wrangler.toml) | Covered | STORY-170 | AC-2317 (modified) |
| 14 | Simulator /cdn-cgi/access/logout clears the cookie; returnTo only to the builder origin | Covered | STORY-170 | AC-2363 |
| 15 | Secret scan exempts the mapping from the name-matched shape only, self-checks name=address, still applies value shapes | Covered | STORY-119 | AC-1342; named-list (not suffix) reading recorded as decision 15 |
| 16 | Priming order: system, landscape, purpose, mechanism (mechanism last); no 'Your purpose' heading or trigger sentence | Covered | STORY-149 | AC-1795 (modified) |
| 17 | Every host actually sends the model the full priming and reminder, as a string or cache-split blocks | Covered | STORY-149 | AC-2364 |
| 18 | No-KB host primes with the system prompt plus manual and no KM sections | Covered | STORY-149 | AC-2364 |
| 19 | Change signal and corpus delta only when there is something to report | Covered (elsewhere) | STORY-149 / REQ-131 story | AC-1799 plus existing change-signal ACs |
| 20 | Describer role primes with the digest instruction only | Covered (elsewhere) | existing describer ACs | Located by search; out of this bundle's stories |
| 21 | Generated bridge shim names the KM providers, not KnowledgeDocs, as an explicit list | Uncovered (acceptable) | — | See Judgment Calls |
| 22 | Account dialog always shows a Sign out form beside Close | Covered | STORY-171 | AC-2365 |
| 23 | Sign-out with an Access credential: 303 to team-domain logout, returnTo from own origin; holding both credentials, Access wins; no team domain: /sign-in | Covered | STORY-171 | AC-2366 |
| 24 | Sign-out always ends our session and clears our cookie; no Access credential: /sign-in; /api/businesses has no session field | Covered | STORY-171 | AC-2351 (modified), AC-2365 |
| 25 | Invite composer fields lie inside the dialog panel at desktop and narrow widths | Covered | STORY-146 | AC-2367 |
| 26 | Origin reports live only while a turn is open (settled and empty both not live; false, true, false across a turn) | Covered | STORY-104 | AC-2094 (modified) |
| 27 | Settled conversation opens an idle composer; a typed message is sent and answered; a real live turn still gates | Covered | STORY-104 | AC-2368 |

## Ungrounded Stories

None. Behaviour the intent leaves open (403 for a wrong pair, 502 when the builder does not answer, query string and Set-Cookie preserved through the proxy, only POST signing out, sign-out on a deployment with no sessions, the named-list exemption) is recorded under each story's Reconciliation Decisions with its rationale. None of it contradicts the intent.

## Supersession Check (Step 4c)

PASS. REQ-204's revision explicitly supersedes the conditional Sign out control and the `session` field. No active AC pins either: a search of all AC tickets finds no AC asserting a conditional control or a `session` payload field, and AC-2365 asserts the opposite. BUG-59 part two supersedes part one's email-bound token: AC-2318 was rewritten to the common_name shape, and STORY-170 records the supersession. No sibling AC is left active on retracted behaviour.

## Evidence Sufficiency (Step 5b)

Every new and modified AC has a named UAT, and all of them passed in the scoped quality report REPORT-11254 (169 passed, 0 failed, 0 skipped; nothing has changed since its commit except report bookkeeping): AC-2358/2359/2360 (workers, real D1 and real gate, real signed JWTs; only Cloudflare's JWKS fetch is stubbed), AC-1755, AC-1384, AC-1342 (two suites), AC-2317/2318/2361/2362/2363 (a real spawned bin/access-sim in front of a recording stub builder), AC-1795, AC-2364 (Node and Worker hosts, model double only), AC-2351/2366 (workers; including hostile returnTo via query and body, both credentials held, and no team domain), AC-2365 (real DOM, plus a Worker payload check), AC-2367, AC-2094 (real session origin plus the pane), AC-2368 (real webui-chat; the stubbed fetch is the pane's HTTP boundary to the origin, paired with the real-origin workers suite). No internal module is mocked. The assertions are specific, and none would pass with the behaviour removed; for example, AC-2094 rules out both constant answers by asserting false, then true, then false across one turn.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Access gate / admission | STORY-120, STORY-146 | ✓ AC-2358, AC-2359, AC-2360 added; AC-1755, AC-1384 modified |
| 2. access-sim acts as the edge | STORY-170 | ✓ AC-2361, AC-2362, AC-2363 added; AC-2317, AC-2318 modified |
| 3. Committed-secret scan exemption | STORY-119 | ✓ AC-1342 modified, decision 15 |
| 4. Assistant priming | STORY-149 | ✓ AC-2364 added; AC-1795 modified |
| 5. Sign out | STORY-171 | ✓ AC-2365, AC-2366 added; AC-2351 modified |
| 6. Invite composer | STORY-146 | ✓ AC-2367 added |
| 7. Assistant pane rejoin | STORY-104 | ✓ AC-2368 added; AC-2094 modified |

## Judgment Calls

- **Bridge-shim export list (BUG-63) left without an AC: acceptable, but STORY-149's note is inaccurate.** The intent says `1c assets` writes the shim from an explicit list that names the KM providers and not KnowledgeDocs. A UAT exists for it (test_UAT_FC_BUG-63_the_generated_bridge_shim_names_the_km_providers_and_not_the_deleted_class), but no AC owns it. STORY-149's Reconciliation Decision says it is "left to the matrix entries that own them", yet no AC in the matrix covers it. It is not material. The behaviour a user could notice (the providers are reachable, so the priming reaches the model) is pinned by AC-2364, which fails if the shim stops exporting them. The explicit-list-rather-than-wildcard choice is build hygiene. Suggested follow-up, not blocking: correct that sentence in STORY-149 to say the shim export list is unpinned build hygiene, evidenced only by the FC test.
- **'Host mutates no role' (BUG-63) has no AC: acceptable.** It is an internal implementation constraint; what it protects (the reminder reaches the model) is AC-2364.
- **ACCESS.md's one-off terms-acceptance step for a first push (BUG-59) has no AC: acceptable.** It is operator guidance. AC-2358 already pins that the terms gate applies to the automation as it does to the person.
- **AC-2367's browser measurement skips loudly when no Chromium is available.** Without a browser, the UAT rests on its stylesheet-text check, which is source inspection. The intent's test plan specifies exactly this design ("a missing browser skips loudly"), and BUG-58 was verified red-then-green in a real browser on this machine. The quality report records the test as passed with 0 skipped, but its output does not say whether the measurement ran or the skip path was taken. A re-run from this reviewer's sandbox could not settle it: binding a local port is refused (EPERM), so the builder origin cannot start here. This is recorded, not failed. The quality runner should keep a launchable Chromium, so that the AC's real evidence is the measurement.
- **AC-2364, AC-2365, AC-2366 and AC-2367 are still `status: pending`**, although their UATs pass. AC lifecycle is structural validation's concern, not this review's. Noted so it is not missed.
- **STORY-149 records that the priming entries are built inline in host-core.ts rather than in the commit message's `kmPrimingEntries` in roles.ts.** Entry names are never rendered into the prompt, and the order matches the intent, so this is not an intent divergence.

## Verdict

PASS: Stories accurately and completely document the behaviour surface of BUNDLE-39's final intent. Superseded intent (BUG-59 part one, REQ-204's conditional control) is not absorbed. Intent-silent choices are recorded as Reconciliation Decisions. All seven plan items produced story and AC changes, and every active AC in scope has a passing UAT that distinguishes correct behaviour from broken. A developer reading only these stories would have an accurate picture of what the operator intended to build.
