import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  admit,
  provisionBusiness,
  type Admission,
  type IdentityEnv,
  STARTER_SLUG,
} from '../apps/control-app/src/identity'
import { inviteAccount } from './support/invite-account'
import {
  resolveScope,
  ScopeRefusedError,
  splitBusinessPrefix,
  TenantNotConfiguredError,
  type Scope,
} from '../apps/control-app/src/scope'
import { route, resetChatHost, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { storeFor } from '../apps/control-app/src/store'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-168 — **the tenant comes from the identity, not from the configuration.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case runs inside workerd against a real D1
 * database with the deployed migrations applied, and every business is
 * provisioned through the shipped entry points rather than seeded by hand. The
 * scope is resolved by the same `resolveScope` the Worker's `fetch` calls, and
 * the routes are driven through the same `route` — so what is proved is what a
 * request actually resolves to, not a fixture's idea of it.
 *
 * THE FAILURE THIS FILE IS WRITTEN AGAINST is not an exception; it is a request
 * that succeeds and answers with the wrong business's data. Every assertion below
 * therefore names WHICH business answered, rather than merely that something did.
 */

const PLATFORM = 'req168-platform'

function identityEnv(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM, ...overrides }
}

function routerEnv(overrides: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: {
      fetch: async (request: Request | string) =>
        new Response(
          `asset:${new URL(typeof request === 'string' ? request : request.url).pathname}`,
          { status: 200 },
        ),
    } as unknown as Fetcher,
    ...overrides,
  } as RouterEnv
}

let seq = 0
const anEmail = (): string => `req168-${(seq += 1)}@example.test`

/** Push a business's grant into the past — the "card expired" shape. */
async function lapse(businessId: string): Promise<void> {
  await env.DB.prepare('UPDATE entitlements SET ends_at = ? WHERE business_id = ?')
    .bind(new Date(Date.now() - 1_000).toISOString(), businessId)
    .run()
}

/** An `ok` admission, or fail loudly rather than silently skipping the case. */
async function admitted(email: string): Promise<Extract<Admission, { ok: true }>> {
  const result = await admit(identityEnv(), email)
  if (!result.ok) throw new Error(`expected an admitted account, got ${result.reason}`)
  return result
}

/** One site in a business, written through the same opener a route uses. */
async function siteIn(scope: Scope, slug: string): Promise<void> {
  const store = await storeFor(routerEnv(), scope)
  await store.createDraft(slug)
}

const listSites = async (scope: Scope, prefix = ''): Promise<string[]> => {
  const response = await route(
    new Request(`https://app.test${prefix}/api/sites`),
    routerEnv(),
    scope,
  )
  const body = (await response.json()) as Array<{ slug: string }>
  return body.map((s) => s.slug).sort()
}

beforeAll(async () => {
  await applySchema()
})

beforeEach(() => {
  resetChatHost()
})

describe('REQ-168 — the scope is resolved from the identity', () => {
  /**
   * THE HEADLINE CLAIM, and the one the ticket calls the critical path for
   * onboarding: two people, or one person with two businesses, must not be able
   * to read each other's sites.
   *
   * Driven through `route` rather than through `storeFor` directly, because the
   * thing that used to be wrong was not the store — it was that every route
   * reached the same one. A store-level assertion would have passed before this
   * ticket as easily as after it.
   */
  it('test_UAT_FC_REQ-168_two_businesses_resolve_to_two_stores', async () => {
    const email = anEmail()
    const first = await inviteAccount(identityEnv(), { email, accountName: 'Salon', endsAt: null })
    const second = await provisionBusiness(identityEnv(), {
      accountId: first.user.account_id,
      name: 'Studio',
    })

    const a: Scope = { businessId: first.businessId }
    const b: Scope = { businessId: second.businessId }
    await siteIn(a, 'salon-only')
    await siteIn(b, 'studio-only')

    // Each business sees its own starter site and its own addition, and NEVER
    // the other's — including the starter, which provisioning creates for both
    // and which would be the first thing to bleed through a shared handle.
    //
    // BOTH STARTERS ARE CALLED `home`, and that is the sharper form of the same
    // claim ([[REQ-190]]). The starter slug used to be the business id, so two
    // businesses' sites could never collide by name and this assertion held
    // partly by accident. A slug is unique only inside its business now, so two
    // lists that both contain `home` and differ in everything else is the
    // barrier being proved rather than a naming coincidence standing in for it.
    expect(await listSites(a)).toEqual(['salon-only', STARTER_SLUG])
    expect(await listSites(b)).toEqual(['studio-only', STARTER_SLUG])
  })

  /**
   * The same claim, reached the way a real request reaches it: through the path
   * prefix, resolved by `resolveScope`, with nothing in the test choosing the
   * scope by hand.
   */
  it('test_UAT_FC_REQ-168_the_path_prefix_selects_the_business', async () => {
    const email = anEmail()
    const first = await inviteAccount(identityEnv(), { email, accountName: 'One', endsAt: null })
    const second = await provisionBusiness(identityEnv(), {
      accountId: first.user.account_id,
      name: 'Two',
    })
    await siteIn({ businessId: second.businessId }, 'second-only')

    const admission = await admitted(email)
    const path = `/b/${second.businessId}/api/sites`
    const scope = await resolveScope(
      identityEnv(),
      admission,
      splitBusinessPrefix(path).businessId,
    )

    expect(scope.businessId).toBe(second.businessId)
    // And the prefix does not reach the route table: `/api/sites` answered, not
    // a 404 for a path with `/b/<id>` still on the front of it.
    expect(await listSites(scope, `/b/${second.businessId}`)).toEqual([
      'second-only',
      STARTER_SLUG,
    ])
  })

  /**
   * THE PROPERTY THE PREFIX WAS CHOSEN FOR. A rendered preview references its own
   * assets document-relative, so the sub-resource request inherits the prefix
   * from the document — which a query string would not have done, and a header
   * could not have carried at all.
   */
  it('test_UAT_FC_REQ-168_a_preview_sub_resource_keeps_its_business', async () => {
    // The rendered page lives at `/b/<id>/preview/<slug>/draft/`, so the browser
    // resolves `assets/logo.png` against that directory. Reproducing that
    // resolution here is the whole test: the URL the browser would build must
    // still name the business.
    const business = 'req168-preview'
    const documentPath = `/b/${business}/preview/site-a/draft/`
    const subResource = new URL('assets/logo.png', `https://app.test${documentPath}`).pathname

    expect(subResource).toBe(`/b/${business}/preview/site-a/draft/assets/logo.png`)

    const split = splitBusinessPrefix(subResource)
    expect(split.businessId).toBe(business)
    expect(split.path).toBe('/preview/site-a/draft/assets/logo.png')
  })
})

describe('REQ-168 — resolution authorises the target', () => {
  /**
   * A FALLBACK HERE WOULD BE THE WORST OUTCOME, which is why this is asserted as
   * a refusal and not as "resolves to something sensible". Silently substituting
   * a business the caller *can* reach turns an authorisation failure into a
   * builder that looks right and is not.
   */
  it('test_UAT_FC_REQ-168_an_unauthorised_target_is_refused_not_substituted', async () => {
    const mine = anEmail()
    const theirs = anEmail()
    const owner = await inviteAccount(identityEnv(), { email: mine, endsAt: null })
    const stranger = await inviteAccount(identityEnv(), { email: theirs, endsAt: null })

    const admission = await admitted(mine)
    const refusal = await resolveScope(identityEnv(), admission, stranger.businessId).then(
      (scope) => scope,
      (err: unknown) => err,
    )

    expect(refusal).toBeInstanceOf(ScopeRefusedError)
    expect((refusal as ScopeRefusedError).reason).toBe('not_a_member')
    // Emphatically NOT the caller's own business, which is what a fallback would
    // have produced and what nothing downstream could have detected.
    expect((refusal as ScopeRefusedError).businessId).not.toBe(owner.businessId)
  })

  /**
   * A lapsed grant is refused SEPARATELY from a missing membership. They are
   * different things to tell an operator reading the log — one is "pay us", the
   * other is "you were never here" — even though the caller is told the same
   * sentence either way.
   */
  it('test_UAT_FC_REQ-168_a_lapsed_target_is_refused_as_entitlement_not_membership', async () => {
    const email = anEmail()
    const first = await inviteAccount(identityEnv(), { email, accountName: 'Live', endsAt: null })
    const second = await provisionBusiness(identityEnv(), {
      accountId: first.user.account_id,
      name: 'Lapsed',
    })
    await lapse(second.businessId)

    const admission = await admitted(email)
    const refusal = await resolveScope(identityEnv(), admission, second.businessId).catch(
      (err: unknown) => err,
    )

    expect(refusal).toBeInstanceOf(ScopeRefusedError)
    expect((refusal as ScopeRefusedError).reason).toBe('no_entitlement')
  })

  /**
   * NO TARGET IS THE FALLBACK, AND "FIRST" MEANS FIRST SELECTABLE. The list is
   * ordered by `granted_at` and carries lapsed businesses so a switcher can show
   * them — so an account whose OLDEST business lapsed would otherwise resolve to
   * the one thing it cannot open.
   */
  it('test_UAT_FC_REQ-168_no_target_resolves_to_the_first_admissible_business', async () => {
    const email = anEmail()
    const oldest = await inviteAccount(identityEnv(), { email, accountName: 'Oldest', endsAt: null })
    const newer = await provisionBusiness(identityEnv(), {
      accountId: oldest.user.account_id,
      name: 'Newer',
    })
    await lapse(oldest.businessId)

    const scope = await resolveScope(identityEnv(), await admitted(email))
    expect(scope.businessId).toBe(newer.businessId)
    // And never the platform's own business, which is the failure the whole
    // ticket exists to prevent.
    expect(scope.businessId).not.toBe(PLATFORM)
  })
})

describe('REQ-168 — the platform admin bypass', () => {
  const makeAdmin = async (userId: string): Promise<void> => {
    await env.DB.prepare('UPDATE users SET platform_operator = 1 WHERE id = ?').bind(userId).run()
  }

  /**
   * [[DOC-40]] §6 — ambient by design, so it works before any membership row
   * exists. That is the property being asserted: the admin holds NO membership on
   * the customer's business and still resolves it.
   */
  it('test_UAT_FC_REQ-168_a_platform_admin_resolves_a_business_it_holds_no_membership_for', async () => {
    const adminEmail = anEmail()
    const customerEmail = anEmail()
    const admin = await inviteAccount(identityEnv(), { email: adminEmail, endsAt: null })
    const customer = await inviteAccount(identityEnv(), { email: customerEmail, endsAt: null })
    await makeAdmin(admin.user.id)

    const admission = await admitted(adminEmail)
    // The premise: the bypass is doing the work, not a membership nobody noticed.
    expect(admission.businesses.map((b) => b.businessId)).not.toContain(customer.businessId)

    const scope = await resolveScope(identityEnv(), admission, customer.businessId)
    expect(scope.businessId).toBe(customer.businessId)
  })

  /**
   * THE BYPASS IS OVER MEMBERSHIP ONLY. An administrator operating an expired
   * account must see what the customer sees — otherwise the support call ends
   * with the wrong answer, because the two parties are looking at different
   * systems.
   */
  it('test_UAT_FC_REQ-168_the_admin_bypass_does_not_skip_entitlement', async () => {
    const adminEmail = anEmail()
    const customerEmail = anEmail()
    const admin = await inviteAccount(identityEnv(), { email: adminEmail, endsAt: null })
    const customer = await inviteAccount(identityEnv(), { email: customerEmail, endsAt: null })
    await makeAdmin(admin.user.id)
    await lapse(customer.businessId)

    const refusal = await resolveScope(
      identityEnv(),
      await admitted(adminEmail),
      customer.businessId,
    ).catch((err: unknown) => err)

    expect(refusal).toBeInstanceOf(ScopeRefusedError)
    expect((refusal as ScopeRefusedError).reason).toBe('no_entitlement')
  })
})

describe('REQ-168 — a deactivated business is not offered', () => {
  /**
   * `businessesFor` used to join `tenants` without checking `status`, so a
   * deactivated business came back selectable and then 503'd at `forTenant` when
   * it was picked. Invisible with one always-active tenant; with a switcher it is
   * an entry that fails when clicked.
   */
  it('test_UAT_FC_REQ-168_a_deactivated_business_leaves_the_admissible_set', async () => {
    const email = anEmail()
    const live = await inviteAccount(identityEnv(), { email, accountName: 'Live', endsAt: null })
    const dead = await provisionBusiness(identityEnv(), {
      accountId: live.user.account_id,
      name: 'Suspended',
    })
    await env.DB.prepare('UPDATE tenants SET status = ? WHERE id = ?')
      .bind('suspended', dead.businessId)
      .run()

    const admission = await admitted(email)
    expect(admission.businesses.map((b) => b.businessId)).toEqual([live.businessId])

    // And naming it explicitly is a refusal rather than a 503 from the store —
    // the grant is still live, so nothing else would have caught it.
    const refusal = await resolveScope(identityEnv(), admission, dead.businessId).catch(
      (err: unknown) => err,
    )
    expect(refusal).toBeInstanceOf(ScopeRefusedError)
  })
})

describe('REQ-168 — the branch with no identity', () => {
  /**
   * Unconfigured local dev has no token, no verified email and no admission, so
   * there is nothing for a fallback to choose FROM. `TENANT_ID` is the answer
   * there and only there — and this is the one read of that var left outside
   * `identity.ts`.
   */
  it('test_UAT_FC_REQ-168_no_admission_resolves_to_the_configured_platform_business', async () => {
    const scope = await resolveScope(identityEnv(), null)
    expect(scope.businessId).toBe(PLATFORM)
  })

  /** A target is IGNORED there: there is no identity to authorise it against. */
  it('test_UAT_FC_REQ-168_no_admission_ignores_a_named_target', async () => {
    const scope = await resolveScope(identityEnv(), null, 'req168-somebody-elses-business')
    expect(scope.businessId).toBe(PLATFORM)
  })

  /**
   * It still fails loud when unset. A defaulted tenant id is a misconfigured
   * Worker with write access to whichever account happens to carry that name —
   * the argument `store.ts` made, which moved here with the read.
   */
  it('test_UAT_FC_REQ-168_an_unset_tenant_id_is_refused_rather_than_defaulted', async () => {
    await expect(resolveScope(identityEnv({ TENANT_ID: '' }), null)).rejects.toBeInstanceOf(
      TenantNotConfiguredError,
    )
    await expect(resolveScope(identityEnv({ TENANT_ID: '' }), null)).rejects.toThrow(/TENANT_ID/)
  })
})

describe('REQ-168 — the chat host is per business', () => {
  /**
   * THE LEAK THIS CLOSES. The host was one per ISOLATE, holding a site store, a
   * ticket store and an opened project KB bound to whichever business asked
   * first. Two businesses through one isolate shared all three.
   *
   * ASSERTED ON THE OPENER, not on a transcript, and deliberately. The claim is
   * about which store the host was built over, and the store factory is the
   * only place that fact exists before a turn is taken — so this proves the
   * partition without needing an API key, an embedder or a completed turn, none
   * of which the claim depends on.
   */
  it('test_UAT_FC_REQ-168_two_businesses_do_not_share_one_chat_host', async () => {
    const opened: string[] = []
    const deps: RouterDeps = {
      store: async (env_, scope) => {
        opened.push(scope.businessId)
        return storeFor(env_, scope)
      },
      knowledge: async () => null,
    }

    const chat = async (scope: Scope): Promise<void> => {
      await route(
        new Request('https://app.test/api/ai/session', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ slug: 'anything' }),
        }),
        routerEnv(),
        scope,
        deps,
      ).catch(() => undefined)
    }

    await chat({ businessId: 'req168-chat-a' })
    await chat({ businessId: 'req168-chat-b' })

    // TWO HOSTS, ONE PER BUSINESS. Before this ticket the second call reused the
    // first's cached host and the factory ran once, which is exactly the leak.
    expect(opened).toEqual(['req168-chat-a', 'req168-chat-b'])

    // AND THE CACHE STILL WORKS WITHIN A BUSINESS, which is the property the
    // per-isolate host existed for: a second turn must not rebuild the store, or
    // the conversation resets every time.
    await chat({ businessId: 'req168-chat-a' })
    expect(opened).toEqual(['req168-chat-a', 'req168-chat-b'])
  })
})

/**
 * REQ-168's OPERATOR SEED IS GONE, AND ITS PROPERTY MOVED ([[REQ-190]]).
 *
 * Two tests lived here. Both were about `0005_operator_membership.sql`: that a
 * named operator resolved to the platform business after the scope moved onto
 * the caller's identity, and that re-applying the migration wrote no second
 * membership or grant. `0005` no longer exists — the rebaseline dropped it,
 * because `ensurePlatformOperator` ([[REQ-185]]) writes the same four rows from
 * `PLATFORM_ADMINS`, works before any row exists, and does not hardcode one
 * personal address into a migration that runs in every environment forever.
 *
 * WHAT THE FIRST TEST PROVED IS UNCHANGED AND PROVED ELSEWHERE: that an operator
 * with a membership on the platform business resolves to it is
 * `test_UAT_FC_REQ-168_no_admission_resolves_to_the_configured_platform_business`
 * above and REQ-185's own suite, which drives the bootstrap that now writes the
 * membership. The second test's idempotence is `ensurePlatformOperator`'s
 * `WHERE NOT EXISTS`, asserted in `test_UAT_FC_REQ-185_platform_operator`.
 *
 * They are deleted rather than rewritten because a test whose subject file has
 * been deleted is not a test with a gap in it.
 */
