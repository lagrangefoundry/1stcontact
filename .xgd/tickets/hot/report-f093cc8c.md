---
uid: report-f093cc8c
id: REPORT-11215
type: report
title: 'Reconciliation Plan: free-coded (BUNDLE-39: BUG-59 + BUG-63 + REQ-204 + BUG-58
  + BUG-64)'
created_by: xgd
created_at: '2026-11-08T01:38:28.960420+00:00'
updated_at: '2026-11-08T03:05:18.580501+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-4164b433
  anchor_uid: bundle-4164b433
  items:
  - index: 1
    component: Operator Access Gate / Admission
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: 'Extends existing stories STORY-120 and STORY-146 (BUG-59, commit
      af80d078). A Cloudflare Access service token authenticates as a common_name
      with no email; SERVICE_TOKEN_IDENTITIES (deployment configuration in wrangler.toml,
      declared per environment, never caller input) maps that name to a person, who
      is then admitted under the same membership, entitlement, terms and revocation
      rules as a human. An empty mapping means nobody: an unmapped token is refused
      as no_email exactly as before. A human''s own email claim always wins, so no
      mapping can redirect someone who signed in. ACCESS.md documents the mapping.'
    justification: 'STORY-120 AC-1376 says the gate accepts an automation service
      identity, and STORY-146 AC-1755 says an identity with no email is refused. Together
      they described a token that passed the gate and was then refused at admission.
      The code now admits a mapped token as a person. No new capability bucket: this
      is the same gate-then-admission path, with the token resolved to an existing
      person.'
    story_uid: STORY-120
    target_story_ids:
    - STORY-120
    - STORY-146
    acceptance_criteria_changes:
      add:
      - 'STORY-120: A service token whose common_name is listed in SERVICE_TOKEN_IDENTITIES
        is admitted as the mapped person, under that person''s membership, entitlement,
        terms acceptance and revocation, with no second authorisation path.'
      - 'STORY-120: An unmapped service token, or any token when the mapping is empty,
        is refused exactly as an identity with no email; an identity that carries
        its own email is admitted as that email whatever the mapping says.'
      - 'STORY-120: SERVICE_TOKEN_IDENTITIES is declared for every environment the
        application deploys to, as name=address pairs, and is never read from the
        request.'
      modify:
      - 'AC-1755 (STORY-146): ''An identity carrying no email address is refused rather
        than failing'' becomes ''An identity carrying no email address, and no service-token
        mapping to a person, is refused rather than failing''.'
      - 'AC-1384 (STORY-120): the repository record of granted identities also records
        which service-token names map to which person.'
      remove: []
    intent_delta_summary: A service token now counts as the person whose automation
      it is, via a deployment-declared mapping. Without a mapping it is refused as
      before, and a human's own email always takes precedence.
  - index: 2
    component: 'Local Development Fixture: Access simulator'
    item_type: upgrade
    story_points: 3
    dependencies:
    - 1
    - 5
    description: 'Extends existing story STORY-170 (BUG-59 commit af80d078; REQ-204
      commit e58cc501). bin/access-sim now acts as the Access edge: it is a reverse
      proxy in front of its --builder origin. A matching service-token pair is exchanged
      for a minted cf-access-jwt-assertion on the forwarded request. A wrong pair,
      or only half a pair, is refused and the builder sees nothing. A CF_Authorization
      cookie is passed through untouched. An uncredentialed request gets a 302 to
      /login, as real Access gives a browser. /cdn-cgi/access/certs, /login and /mint
      stay the simulator''s own paths. Tokens are minted in the real shape (a service
      token carries a common_name and no email claim). --print-env also emits the
      SERVICE_TOKEN_IDENTITIES line. A new /cdn-cgi/access/logout path clears the
      cookie that /login set and redirects to returnTo only when returnTo is on the
      fronted builder''s origin; anything else falls back to the builder.'
    justification: STORY-170 covers the simulator's /login, its token minting and
      --print-env (AC-2317 to AC-2321), but not proxying, service-token exchange or
      logout. These extend the same local-dev fixture, which had no route for bin/publish
      through the simulator. No new capability bucket.
    story_uid: STORY-170
    target_story_ids:
    - STORY-170
    acceptance_criteria_changes:
      add:
      - 'bin/publish aimed at the simulator reaches the builder: a matching service-token
        pair is exchanged for a minted assertion, and the builder admits it as the
        mapped person.'
      - A wrong or half service-token pair is refused by the simulator and never reaches
        the builder; a CF_Authorization cookie is forwarded untouched; an uncredentialed
        request is answered 302 to /login.
      - The simulator's /cdn-cgi/access/logout clears the cookie /login set and redirects
        to returnTo only when it is on the fronted builder's origin, otherwise to
        the builder itself.
      modify:
      - 'AC-2317: bin/access-sim --print-env emits the Access settings that point
        the Worker at the simulator AND the SERVICE_TOKEN_IDENTITIES mapping line.'
      - 'AC-2318: a simulator-minted service token carries a common_name and no email
        claim, the same shape Cloudflare mints, and still passes the Worker''s real
        verifier.'
      remove: []
    intent_delta_summary: 'The simulator stops being only a token issuer beside the
      builder and becomes the edge in front of it: it proxies, exchanges service tokens,
      refuses bad pairs, and ends its own session on logout.'
  - index: 3
    component: 'Platform Build & Deploy: committed-secret scan'
    item_type: upgrade
    story_points: 1
    dependencies:
    - 1
    description: Extends existing story STORY-119 (BUG-59 commit dc99edda). The committed-secret
      scan's name-matched pattern (SECRET|TOKEN|API_KEY|PASSWORD on the left of an
      assignment holding a literal) now exempts *_IDENTITIES variables. Every entry
      in an exempted variable must follow the name=address grammar, otherwise the
      same run fails. The two value-shaped patterns (provider-prefixed keys, private
      keys) still scan exempted variables, so an sk--shaped value under an exempted
      name is still caught.
    justification: 'AC-1342 states that no secret value is committed. That guarantee
      now has one narrow, self-checking exception for identity mappings, which the
      AC must state, or it overstates the rule. No new capability bucket: the same
      AC under the same story.'
    story_uid: STORY-119
    target_story_ids:
    - STORY-119
    acceptance_criteria_changes:
      add: []
      modify:
      - 'AC-1342: No secret value is committed anywhere. A *_IDENTITIES variable is
        exempt from the name-matched pattern only, provided every entry is a name=address
        pair. Value-shaped secrets are still caught under any name, exempted names
        included. The documented push pipes the value and echoes only its name.'
      remove: []
    intent_delta_summary: The no-committed-secret rule gains a narrow, self-checking
      exemption for identity-mapping variables. Value-shaped secret detection is unchanged.
  - index: 4
    component: 'AI Site Assistant: conversation priming'
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: Extends existing story STORY-149 (BUG-63, commit 9e923515). Priming
      is now configured as an ordered list of named entries (consultant-system, km-landscape,
      purpose, km-mechanism), defined once in roles.ts (kmPrimingEntries) and shared
      by the Node host and both Worker paths. The per-turn reminder is a registered
      provider. In every host, the model is actually sent the consultant system prompt,
      the role purpose, the KM landscape, the KM mechanism and the per-turn reminder.
      Before this commit a framework change silently dropped all of them while the
      Worker still built. The system prompt may reach the wire as one string or as
      cache-split text blocks.
    justification: 'AC-1795 and AC-1807 pin the order of priming sections, but nothing
      pins that each host actually sends the system prompt, purpose and reminder to
      the model, which is the regression BUG-63 caught. No new capability bucket:
      this is the same priming behaviour, stated per host and checked on what is sent.'
    story_uid: STORY-149
    target_story_ids:
    - STORY-149
    acceptance_criteria_changes:
      add:
      - On the Node host and on both Worker paths, what the model is sent for a turn
        contains the consultant system prompt, then the knowledge landscape, then
        the role purpose, then how to search, plus that turn's site-change reminder,
        whether the system prompt is a single string or cache-split blocks.
      modify:
      - 'AC-1795: a cold conversation is primed, on every host, with the consultant
        system prompt followed by both maps in one landscape section (the client''s
        first), then purpose, then how to search.'
      remove: []
    intent_delta_summary: Priming is configured once and shared by every host, and
      the matrix now requires each host to actually send the system prompt, purpose,
      landscape, mechanism and reminder.
  - index: 5
    component: 'Passwordless sign-in: Sign out'
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: 'Extends existing story STORY-171 (REQ-204, commits 87c5e588 and
      e58cc501; final state is what e58cc501 leaves). The builder''s Account dialog
      always shows a Sign out control: a real <form method=post action=/sign-out>
      with a submit button in the footer beside Close. POST /sign-out picks its redirect
      from the credential the request carries. If an Access credential is present
      (the forwarded header or a CF_Authorization cookie), the redirect is 303 to
      the team domain''s /cdn-cgi/access/logout, with returnTo built only from the
      request''s own origin plus /sign-in. Otherwise the redirect is 303 to /sign-in.
      With no team domain configured the redirect falls back to /sign-in. Our own
      session row is ended and our cookie cleared in every case, and the endpoint
      still succeeds for a caller who is not signed in.'
    justification: 'AC-2351 covers ending our session and clearing our cookie, but
      not the Account dialog control or the Access-logout redirect. The first REQ-204
      commit (a session flag on /api/businesses and a control drawn only for sessions)
      was reversed by the second, so only the final behaviour is documented. No new
      capability bucket: this is the same sign-out endpoint and the same builder chrome.'
    story_uid: STORY-171
    target_story_ids:
    - STORY-171
    acceptance_criteria_changes:
      add:
      - The Account dialog always shows a Sign out control in its footer beside Close.
        The control is a form that POSTs to /sign-out, and the browser follows the
        server's 303 with no client-side branching.
      - A sign-out request carrying an Access credential (header or CF_Authorization
        cookie) is redirected to the team domain's /cdn-cgi/access/logout, with returnTo
        set to this request's own origin plus /sign-in. Our session is ended and our
        cookie cleared on the same response. With no team domain configured it lands
        on /sign-in.
      modify:
      - 'AC-2351: Signing out ends our session and clears our cookie whatever credential
        admitted the caller, succeeds for a caller who is not signed in, and lands
        on /sign-in when the request carries no Access credential.'
      remove: []
    intent_delta_summary: Sign out becomes visible in the Account dialog and also
      ends the edge's session for Access-admitted callers, so every operator can actually
      sign out.
  - index: 6
    component: 'Contacts tab: invite composer'
    item_type: upgrade
    story_points: 1
    dependencies: []
    description: Extends existing story STORY-146 (BUG-58, commit a8840e04). The invite
      composer is now on the modal's copy-width list and has dropped its min-width,
      so its Subject, To-List and Body fields stay inside the dialog panel. Before,
      they overflowed onto the backdrop, and in very narrow viewports the composer
      was wider than the panel.
    justification: AC-2337 and AC-2338 define the invite modal's fields and behaviour,
      but nothing requires the fields to be laid out inside the dialog. This adds
      a layout AC, checked in a real browser, to the same modal. No new capability
      bucket.
    story_uid: STORY-146
    target_story_ids:
    - STORY-146
    acceptance_criteria_changes:
      add:
      - The invite dialog's Subject, To-List and Body fields lie wholly within the
        dialog panel at desktop width and in narrow viewports, measured in a real
        browser against the source stylesheet.
      modify: []
      remove: []
    intent_delta_summary: The invite modal gains an explicit requirement that its
      composer fits inside the dialog at every viewport width.
  - index: 7
    component: 'Assistant Pane: rejoining a live turn'
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: Extends existing story STORY-104 (BUG-64, commit 6a35c37f). openSession's
      live flag is now taken from manager.transcript(), not re-derived (the old comparison
      was always true for any session with records). A session whose turns have all
      closed is reported as not live, so the pane does not rejoin and its composer
      stays idle (a Send button, not Stop). A message typed there is sent and answered
      rather than queued and dropped. A session with an open turn is still reported
      live and rejoined. A session with no records is not live.
    justification: AC-2094 already says a conversation with no live turn is not rejoined,
      but its tests only read the flag during a running turn, where an always-true
      value looks correct. The AC must cover a quiet session with past turns, both
      at the origin and at the panel. No new capability bucket.
    story_uid: STORY-104
    target_story_ids:
    - STORY-104
    acceptance_criteria_changes:
      add:
      - A pane opened on a site whose conversation has earlier, closed turns shows
        an idle composer, and a message typed there is sent and answered rather than
        queued.
      modify:
      - 'AC-2094: The origin reports a conversation live only while a turn is open.
        A conversation whose turns have all closed, and an empty one, is reported
        not live and is not rejoined. A failed rejoin leaves the pane usable, and
        a transport without rejoin support still mounts.'
      remove: []
    intent_delta_summary: AC-2094's 'not rejoined' promise is extended to cover quiet
      conversations that already have closed turns, at both the origin and the panel.
---

# Reconciliation Plan

**Mode**: commits
**Source**: free-coded commits of BUNDLE-39 (BUG-59, BUG-63, REQ-204, BUG-58, BUG-64)

## Behavior Inventory

```yaml
behavior_inventory:
  source: "commits af80d078 dc99edda 37ce222c 9e923515 2a30331f 87c5e588 a8840e04 62cadb14 e58cc501 6a35c37f 657affde"
  entry_files:
    - apps/control-app/src/identity.ts
    - apps/control-app/src/index.ts
    - apps/control-app/src/access.ts
    - apps/control-app/src/sign-in.ts
    - apps/control-app/wrangler.toml
    - apps/control-app/ACCESS.md
    - apps/control-app/src/builder/business.js
    - apps/control-app/src/builder/builder.css
    - bin/access-sim
    - tests/support/credential-scan.ts
    - tools/generate/src/cli/assets.ts
    - tools/generate/src/cli/ai/host-core.ts
  features:
    - name: Service-token identity mapping (BUG-59)
      behaviors:
        - SERVICE_TOKEN_IDENTITIES maps a token common_name to a person; that person is admitted under the normal rules
        - an unmapped token or an empty mapping is refused as no_email
        - a human's own email always takes precedence over the mapping
    - name: access-sim acts as the edge (BUG-59, REQ-204)
      behaviors:
        - reverse-proxies to --builder
        - exchanges a service-token pair for a minted assertion; refuses a wrong or half pair
        - passes the cookie through; sends an uncredentialed request 302 to /login
        - mints tokens in Cloudflare's shape; --print-env emits the mapping line
        - /cdn-cgi/access/logout clears the cookie, with an origin-checked returnTo
    - name: Committed-secret scan exemption (BUG-59)
      behaviors:
        - *_IDENTITIES exempt from the name-matched pattern only, provided entries follow name=address
        - value-shaped patterns still scan exempted variables
    - name: Priming configuration (BUG-63)
      behaviors:
        - four named entries in a fixed order, shared by the Node host and both Worker paths
        - reminder is a registered provider; the model is actually sent system prompt, purpose, landscape, mechanism and reminder
    - name: Sign out (REQ-204)
      behaviors:
        - Account dialog footer always shows a form POST /sign-out
        - a request carrying an Access credential goes to the team-domain logout with returnTo from the request's origin; otherwise /sign-in
        - our session and cookie are always ended
    - name: Invite composer fits its dialog (BUG-58)
      behaviors:
        - composer is on the copy-width list with no min-width; fields stay inside the panel
    - name: Quiet session is not live (BUG-64)
      behaviors:
        - live flag comes from manager.transcript(); a session with only closed turns is not live; composer idle; message sent rather than queued
```

## Coverage Map

```yaml
coverage_map:
  - feature: Service-token identity mapping
    status: partial
    existing_stories: [STORY-120, STORY-146]
    existing_acs: [AC-1376, AC-1384, AC-1755]
    gaps: [mapping-based admission, unmapped refusal, email precedence]
  - feature: access-sim acts as the edge
    status: partial
    existing_stories: [STORY-170]
    existing_acs: [AC-2317, AC-2318, AC-2320, AC-2321]
    gaps: [proxy, token exchange, bad-pair refusal, 302 to /login, logout endpoint]
  - feature: Committed-secret scan exemption
    status: partial
    existing_stories: [STORY-119]
    existing_acs: [AC-1342]
    gaps: [narrow self-checking exemption]
  - feature: Priming configuration
    status: partial
    existing_stories: [STORY-149]
    existing_acs: [AC-1795, AC-1807]
    gaps: [per-host requirement that the system prompt, purpose and reminder are sent]
  - feature: Sign out
    status: partial
    existing_stories: [STORY-171]
    existing_acs: [AC-2351]
    gaps: [Account dialog control, Access-logout redirect]
  - feature: Invite composer fits
    status: partial
    existing_stories: [STORY-146]
    existing_acs: [AC-2337, AC-2338]
    gaps: [layout containment]
  - feature: Quiet session is not live
    status: partial
    existing_stories: [STORY-104]
    existing_acs: [AC-2094]
    gaps: [quiet session with past turns, at origin and panel]
```

## Plan Items

| # | Component | Type | Points | Deps | Description |
|---|-----------|------|--------|------|-------------|
| 1 | Access gate / admission | upgrade | 2 | - | Service token mapped to a person (STORY-120, STORY-146) |
| 2 | Local dev Access simulator | upgrade | 3 | 1,5 | access-sim proxies, exchanges tokens, handles logout (STORY-170) |
| 3 | Committed-secret scan | upgrade | 1 | 1 | *_IDENTITIES exemption (STORY-119 AC-1342) |
| 4 | Assistant priming | upgrade | 2 | - | Every host sends the full priming (STORY-149) |
| 5 | Sign out | upgrade | 2 | - | Account dialog control plus Access logout (STORY-171) |
| 6 | Invite composer | upgrade | 1 | - | Composer fits its dialog (STORY-146) |
| 7 | Assistant pane rejoin | upgrade | 2 | - | Quiet session not live (STORY-104 AC-2094) |

## Observations

- REQ-204 had two commits. 87c5e588 added a `session` boolean to /api/businesses and drew Sign out only for sessions; e58cc501 removed both. Only the final behaviour is planned. The /api/businesses payload (REQ-180) and BUG-52's default are back to where they were, so they need no change.
- BUG-59's ticket body also describes an operator workaround (sign in at the simulator on 127.0.0.1, not localhost) and an empty sites table. Those are operator guidance and data state, not code behaviour, so they produce no ACs beyond item 2.
- BUG-63 also notes framework-upgrade consequences: the ReadKnowledge grant gained two read operations ('pins widened, grant unchanged') and provenance is now per-corpus with an untrusted default. These are upstream framework behaviour seen through pins, not intent of this bundle, so no STORY-105 change is planned. Test re-anchoring in REQ-122/158/160/174 suites follows the same priming behaviour.
- dc99edda also moved both suites' copy of the secret-scan rule into tests/support/credential-scan.ts. That is test structure, not behaviour.
- Version-bump commits (37ce222c, 2a30331f, 62cadb14, 657affde) carry no behaviour.
- No FC test files were reported; the commits do contain test_UAT_FC_BUG-59/63/58/64 and REQ-204 suites, and each is covered by an item above (BUG-59 -> 1,2; BUG-63 -> 4; REQ-204 -> 5,2; BUG-58 -> 6; BUG-64 -> 7).
- `xgd ticket search` failed in this sandbox (embedding model download and index write were blocked), so reuse targets were found by listing stories and their AC children by hand.