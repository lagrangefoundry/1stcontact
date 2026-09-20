---
uid: bug-141e4bf5
id: BUG-129
type: bug
title: 'Priming ceiling: the builder refuses to open because the cap was sized against
  a manual that has since trebled'
created_by: EPIC-19
created_at: '2026-09-20T20:00:55.786011+00:00'
updated_at: '2026-09-20T20:07:06.282718+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  priority: high
  severity: critical
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: f39a431275452d7c9656250c075eb31ae317f726
    reconcile_sha: null
    main_sha: null
  version: 0.2.291
  story_points: 2
---

## Symptom

Every builder session refused to open. The chat pane returned, verbatim:

> Assembled priming exceeds the 60000-character budget at entry `"km-mechanism"`
> (65925 characters so far). Shorten that entry, or raise `'maxPrimingChars'` for
> this host.

Not a degradation — a total outage of the consultant, on every site, with no
partial mode. Observed 2026-09-20 in the Lagrange Foundry builder.

## Root cause

**The constant is 1stcontact's own override, and its arithmetic expired.**
`MAX_PRIMING_CHARS = 60_000` in `tools/generate/src/cli/ai/host-core.ts` was
chosen against a stated input: *"the three static entries are 4,851 characters
together and the projected manual summary is about 11,000, so a session with a
corpus primes at roughly 16,000 today."* That was true when it was written. The
surfaces this deployment grants now project roughly **30,000** characters of
manual, so assembly reaches 65,925 at `km-mechanism` and stops. The framework's
own `DEFAULT_MAX_PRIMING_CHARS` is 200,000; 1c overrode it downward for a reason
that no longer holds.

**And nothing could have caught it.** The ceiling is exercised by exactly one
assertion — `test_UAT_FC_REQ-182_the_assembled_priming_fits_the_declared_cap_with_headroom`
— and that test opens a session through the **CLI** host, whose grant is the L1
surface plus knowledge. The deployment's grant is larger: `router.ts` adds
fidelity, image, library, ledger, settings and dns on top. So the projected
manual under test is a fraction of the projected manual in production, and the
constant could go under water in the Worker with the whole suite green. That gap
is the second half of this bug and the half a test has to close.

## Fix

`MAX_PRIMING_CHARS`: **60,000 → 200,000**, the framework's own default.

**Why raising is right rather than shrinking the priming.** The `cache_boundary`
entry is LAST in `priming.json`, so the whole seed — manual and landscape
included — sits in the cached prefix, and `_seedForTurn` re-assembles only the
entries past that marker. The seed is therefore built once per session and read
from cache at `DEFAULT_CACHE_TTL` (one hour) thereafter. 66,000 characters is
~17,000 tokens, paid once, against Opus 5's 1M window. The ceiling was throttling
something that is neither per-turn nor scarce.

**Why the framework's default rather than a new local guess.** The old comment
declined `DEFAULT_MAX_PRIMING_CHARS` on the grounds that *"a limit nobody chose is
a limit nobody notices being approached"* — and then nobody noticed this one being
approached either, because **a constant cannot warn**. A backstop is the right
role for this value; noticing belongs to the occupancy gauge (lagrange-framework
REQ-169), which reports what a request actually costs.

**What does not change.** Overflow is still a loud failure naming the entry, with
no truncation path. That property is why a backstop is safe: a landscape that
genuinely runs away is a message, not a priming quietly missing its last section.

## Test plan

**New UAT** — `test_UAT_FC_BUG-129_a_deployment_grant_primes_inside_the_ceiling`,
in `tests/test_UAT_FC_BUG-129_priming_fits_the_deployment_grant.workers.test.ts`,
because the workers suite is the only place the real grant exists. It opens a
chat session through the Worker's own `fetch` against real D1 and R2 with the
scripted model client, reads the system prompt off the request the backend
actually built, and asserts three things:

1. **the session opens at all** — the budget is enforced during assembly, so an
   overflow is not a smaller priming, it is no session, and that is the symptom
   the operator saw;
2. **the grant is really in the manual** — `add_page`, `capture_site`,
   `write_image` and `list_assets`, four surfaces from four plugins. Without
   this the ceiling assertions pass on an empty manual, which is the exact way
   the CLI-side test stayed green while production could not start. The test env
   therefore binds `BROWSER` and `OPENAI_API_KEY` — a surface is composed only
   where its binding exists, and nothing in the case calls either, so neither has
   to work;
3. **it fits, with headroom** — under `MAX_PRIMING_CHARS`, and under half of it.

**The headroom factor is what carries it, and the ticket should say so.** This
runtime primes at about **41,700** characters where production reached 65,925 —
the knowledge landscape here is a seeded tenant's, not a working client's. A
case asserting only `< MAX_PRIMING_CHARS` would have gone green against the very
constant that shut the builder down. Doubling is the margin that makes the
assertion bite at this runtime's scale, and it is the same margin the CLI-side
test uses for the same reason. Verified both ways: green at 200,000, red at
60,000.

**Regression**: `test_UAT_FC_REQ-182_priming_is_configuration` and
`test_UAT_FC_BUG-65_priming_names_no_documents` — the two suites that import the
constant. Both assert `toBeLessThan(MAX_PRIMING_CHARS)` rather than a literal
60000, so both still hold and still mean what they meant. 20 tests, green.
