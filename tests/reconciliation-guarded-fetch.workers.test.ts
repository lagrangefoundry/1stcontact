import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import {
  MAX_MATERIAL_BYTES,
  NotRepublishableError,
  promoteToSiteAsset,
} from '../apps/control-app/src/material'
import { guardedFetch, MAX_REDIRECTS } from '../apps/control-app/src/fetch-guard'
import { applySchema, makeD1Site } from './support/d1-site-factory'

/**
 * Reconciliation UATs for story-77f8fc9e — **guarded retrieval: material fetched
 * on the client's behalf, and what it is recorded as**.
 *
 * WHAT MAKES THIS EVIDENCE. Every claim is made through the Worker's own route
 * table (`route()`), at the retrieval entry point `POST /api/material/fetch`,
 * against a real D1 database and two real R2 buckets supplied by
 * `@cloudflare/vitest-pool-workers`. The guard, the ingestion pipeline, the
 * ticket store and the classification are all the production code; nothing here
 * reimplements a rule in order to assert it. The ceiling and the redirect bound
 * are read from `MAX_MATERIAL_BYTES` and `MAX_REDIRECTS` rather than restated as
 * a second opinion about them.
 *
 * ONE DOUBLE, AT THE ONE BOUNDARY THAT IS NOT OURS — the network. `RouterDeps.fetch`
 * exists for exactly this reason and the guard's own module note says so: the
 * claims in this story are about WHICH ADDRESSES ARE REACHED and which are
 * refused, and a suite that had to stand up a redirecting server to make them
 * would be testing the server. The double therefore does more than stand in — it
 * RECORDS every address it is asked for, which is what turns "the refused hop is
 * never retrieved" from an inference into a direct observation.
 *
 * The vision seam is stubbed for the same reason the ingestion suite stubs it: no
 * criterion here is about the quality of a description, and miniflare has no
 * Workers AI to reach. Textual documents are described by the production
 * text-decode path with no model at all.
 *
 * WHERE THE RECORDED VALUES ARE READ BACK FROM. The criteria about what the
 * material IS re-open the store with `ticketStoreFor` and read the record by the
 * identifier the response gave, rather than trusting the response envelope: an
 * envelope that echoed its own input would satisfy a weaker test while proving
 * nothing about what was stored.
 */

const APPLIED = applySchema()

const TENANT = 'story77f8fc9e'

/** The Worker's own bindings, as this route table's env. */
function routerEnv(tenantId = TENANT): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: tenantId,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

/**
 * A controlled responder that RECORDS every address it is asked for.
 *
 * `reached` is the load-bearing half. Several criteria are about an address that
 * must never be requested at all, and the only direct way to observe "never
 * requested" is to hold the list of what was.
 */
interface Responder {
  fetch: typeof fetch
  reached: string[]
}

function responder(answer: (url: string) => Response): Responder {
  const reached: string[] = []
  const impl = async (input: unknown): Promise<Response> => {
    const url =
      typeof input === 'string' ? input : String((input as { url?: string }).url ?? input)
    reached.push(url)
    return answer(url)
  }
  return { fetch: impl as unknown as typeof fetch, reached }
}

/** A responder that must never be called — every refusal test uses this one. */
function never(): Responder {
  return responder((url) => {
    throw new Error(`the guard reached an address it should have refused: ${url}`)
  })
}

/** A responder that serves one document at whatever address it is asked for. */
function serves(body: string, contentType = 'text/html; charset=utf-8'): Responder {
  return responder(() => new Response(body, { status: 200, headers: { 'content-type': contentType } }))
}

/** Router deps with the network double wired and the vision seam stubbed. */
function deps(r: Responder): RouterDeps {
  return {
    index: async () => async () => {},
    describeImage: async () => ({ text: 'A thing\n\nSomething depicted.', model: 'stub/vision-1' }),
    fetch: r.fetch,
  }
}

/** A retrieval through the entry point, exactly as the surface sends one. */
async function retrieve(
  url: string,
  r: Responder,
  extra: Record<string, unknown> = {},
): Promise<Response> {
  return route(
    new Request('https://app.test/api/material/fetch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url, ...extra }),
    }),
    routerEnv(),
    deps(r),
  )
}

/** An upload through the other entry point, for the inversion comparison. */
async function upload(bytes: Uint8Array, filename: string, contentType: string): Promise<Response> {
  const form = new FormData()
  form.append('file', new File([bytes as unknown as BlobPart], filename, { type: contentType }))
  return route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(),
    deps(never()),
  )
}

/** How many pieces of material this account holds right now. */
async function materialCount(): Promise<number> {
  const store = await ticketStoreFor(routerEnv())
  return (await store.list({ type: 'material', limit: 'all' })).tickets.length
}

/** Every stored blob key for this account, so "no bytes left behind" is enumerated. */
async function blobKeys(): Promise<string[]> {
  const out: string[] = []
  let cursor: string | undefined
  for (;;) {
    const page = await (env.BLOBS as R2Bucket).list({ prefix: `t/${TENANT}/`, cursor })
    for (const object of page.objects) out.push(object.key)
    if (!page.truncated) break
    cursor = page.cursor
  }
  return out.sort()
}

/** The guard's own megabyte rendering, so the message assertions are not a second opinion. */
function mb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')
}

/** A body of `chunks` megabytes, produced lazily so the cap can stop it mid-flight. */
function streamOf(chunks: number): ReadableStream<Uint8Array> {
  let sent = 0
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent >= chunks) {
        controller.close()
        return
      }
      sent += 1
      controller.enqueue(new Uint8Array(1024 * 1024))
    },
  })
}

/** One more megabyte than the ceiling admits. */
const OVER_CEILING_CHUNKS = Math.ceil(MAX_MATERIAL_BYTES / (1024 * 1024)) + 1

beforeAll(async () => {
  await APPLIED
})

describe('story-77f8fc9e — guarded retrieval, and what the retrieved material is recorded as', () => {
  it('test_UAT_AC1700_material_is_retrieved_only_over_a_secure_web_address', async () => {
    // THE ALLOWLIST, NOT A DENYLIST (AC-1700). Every scheme that is not `https`
    // is refused through one rule, and the refusal is the CALLER's error — not a
    // server failure and not a permission the caller could be granted.
    const before = await materialCount()

    const wrongScheme = [
      { url: 'http://example.test/report.html', scheme: 'http' },
      { url: 'file:///etc/passwd', scheme: 'file' },
      { url: 'data:text/plain;base64,aGk=', scheme: 'data' },
    ]
    for (const { url, scheme } of wrongScheme) {
      const r = never()
      const response = await retrieve(url, r)
      expect(response.status).toBe(400)
      // Not a server failure, and not the forbidden a rights refusal produces.
      expect(response.status).toBeLessThan(500)
      expect(response.status).not.toBe(403)
      const body = (await response.json()) as Record<string, unknown>
      expect(String(body.error)).toContain('Only https addresses can be fetched')
      // The scheme that was rejected is NAMED, so the client can see what was
      // wrong with the address they supplied.
      expect(String(body.error)).toContain(scheme)
      // The refusal carries the address that was refused.
      expect(body.url).toBe(url)
      // NOTHING WAS REACHED. In particular the `https` form of the same address
      // was never fetched — the refusal is not a silent upgrade.
      expect(r.reached).toEqual([])
    }

    // A string that is not an address at all is refused in its own words, quoting
    // what was supplied.
    const nonsense = 'definitely not a web address'
    const r = never()
    const response = await retrieve(nonsense, r)
    expect(response.status).toBe(400)
    const body = (await response.json()) as Record<string, unknown>
    expect(String(body.error)).toContain('does not look like a web address')
    expect(String(body.error)).toContain(nonsense)
    expect(body.url).toBe(nonsense)
    expect(r.reached).toEqual([])

    // Nothing above became material.
    expect(await materialCount()).toBe(before)

    // And a secure address on an ordinary public host is NOT refused by this
    // rule — it proceeds to the remaining checks and through the pipeline.
    const ok = serves('<p>An ordinary public document.</p>')
    const permitted = await retrieve('https://example.test/report.html', ok)
    expect(permitted.status).toBe(200)
    expect(ok.reached).toEqual(['https://example.test/report.html'])
  })

  it('test_UAT_AC1701_addresses_that_mean_something_only_inside_the_platforms_network_are_refused', async () => {
    // EVERY FAMILY, NAMED (AC-1701). The link-local entry is the reason the list
    // exists — 169.254.169.254 is where the cloud metadata service lives — and
    // the IPv4-mapped entry is the one that stops a loopback being smuggled past
    // the rule in IPv6 clothing.
    const refused: Array<{ url: string; host: string }> = [
      { url: 'https://127.0.0.1:8788/admin', host: '127.0.0.1' },
      { url: 'https://0.0.0.0/', host: '0.0.0.0' },
      { url: 'https://10.0.0.1/internal', host: '10.0.0.1' },
      { url: 'https://172.16.0.1/internal', host: '172.16.0.1' },
      { url: 'https://192.168.1.1/router', host: '192.168.1.1' },
      { url: 'https://169.254.169.254/latest/meta-data/', host: '169.254.169.254' },
      { url: 'https://100.64.0.1/', host: '100.64.0.1' },
      { url: 'https://239.255.255.250/', host: '239.255.255.250' },
      { url: 'https://[::1]/admin', host: '::1' },
      { url: 'https://[::]/', host: '::' },
      { url: 'https://[fd00::1]/', host: 'fd00::1' },
      { url: 'https://[fe80::1]/', host: 'fe80::1' },
      // The mapped form of an address already refused above.
      { url: 'https://[::ffff:127.0.0.1]/admin', host: '' },
      { url: 'https://localhost:8788/', host: 'localhost' },
      { url: 'https://printer.local/status', host: 'printer.local' },
      { url: 'https://db.internal/dump', host: 'db.internal' },
    ]

    for (const { url, host } of refused) {
      const r = never()
      const response = await retrieve(url, r)
      expect(response.status, `${url} should be refused`).toBe(400)
      const body = (await response.json()) as Record<string, unknown>
      expect(String(body.error), `${url} should be refused as private`).toContain(
        'is on a private network',
      )
      if (host !== '') expect(String(body.error)).toContain(host)
      expect(body.url).toBe(url)
      // NO NETWORK RETRIEVAL WAS ATTEMPTED — the refusal precedes the reach.
      expect(r.reached, `${url} must never be fetched`).toEqual([])
    }

    // ORDINARY PUBLIC ADDRESSES ARE NOT REFUSED BY THIS RULE — a public hostname,
    // a public IPv4 literal, and a public IPv6 literal alike.
    const permitted = [
      'https://research.example.test/annual.html',
      'https://93.184.216.34/annual.html',
      'https://[2606:2800:220:1:248:1893:25c8:1946]/annual.html',
    ]
    for (const url of permitted) {
      const r = serves('<p>A public document.</p>')
      const response = await retrieve(url, r)
      expect(response.status, `${url} should be permitted`).toBe(200)
      expect(r.reached).toEqual([url])
    }
  })

  it('test_UAT_AC1702_every_redirect_hop_is_revalidated_and_a_refused_hop_is_never_retrieved', async () => {
    // THE LOAD-BEARING CASE (AC-1702). A guard applied only to the address the
    // client typed is not a guard: a public address is free to redirect to the
    // metadata service. `reached` is what proves the destination was never asked
    // for, rather than asked for and discarded.
    const FIRST = 'https://news.example.test/report'
    const METADATA = 'https://169.254.169.254/latest/meta-data/'

    const absolute = responder((url) => {
      if (url === FIRST) {
        return new Response(null, { status: 302, headers: { location: METADATA } })
      }
      throw new Error(`the guard fetched a refused hop: ${url}`)
    })
    const first = await retrieve(FIRST, absolute)
    expect(first.status).toBe(400)
    const firstBody = (await first.json()) as Record<string, unknown>
    // The message the refused FAMILY produces, naming the host it refused.
    expect(String(firstBody.error)).toContain('is on a private network')
    expect(String(firstBody.error)).toContain('169.254.169.254')
    // The refusal reports the address the CLIENT supplied — the one they will
    // recognise — not the hop that failed.
    expect(firstBody.url).toBe(FIRST)
    // ONLY THE FIRST ADDRESS WAS EVER REACHED.
    expect(absolute.reached).toEqual([FIRST])

    // A RELATIVE DESTINATION IS RESOLVED AGAINST THE HOP IT CAME FROM, BEFORE
    // being checked — so it cannot escape the rules by being relative.
    const relative = responder((url) => {
      if (url === FIRST) {
        return new Response(null, {
          status: 302,
          headers: { location: '//169.254.169.254/latest/meta-data/' },
        })
      }
      throw new Error(`the guard fetched a refused hop: ${url}`)
    })
    const second = await retrieve(FIRST, relative)
    expect(second.status).toBe(400)
    const secondBody = (await second.json()) as Record<string, unknown>
    expect(String(secondBody.error)).toContain('is on a private network')
    expect(String(secondBody.error)).toContain('169.254.169.254')
    expect(secondBody.url).toBe(FIRST)
    expect(relative.reached).toEqual([FIRST])
  })

  it('test_UAT_AC1703_a_redirect_chain_is_bounded_at_a_fixed_limit', async () => {
    // BOUNDED, NOT MERELY FINITE (AC-1703). The responder redirects forever; what
    // must hold is that the cost is a fixed, small number of retrievals — counted
    // here rather than inferred from the fact that the call returned at all.
    let hop = 0
    const forever = responder(() => {
      hop += 1
      return new Response(null, {
        status: 302,
        headers: { location: `https://hop${hop}.example.test/next` },
      })
    })

    const before = await materialCount()
    const response = await retrieve('https://start.example.test/report', forever)
    expect(response.status).toBe(400)
    const body = (await response.json()) as Record<string, unknown>
    expect(String(body.error)).toContain(`redirected more than ${MAX_REDIRECTS} times`)
    expect(String(body.error)).toContain('stopped')

    // THE LIMIT PLUS THE INITIAL RETRIEVAL — not unbounded, and not an arbitrary
    // larger number.
    expect(forever.reached).toHaveLength(MAX_REDIRECTS + 1)
    expect(await materialCount()).toBe(before)
  })

  it('test_UAT_AC1704_a_body_past_the_ceiling_is_refused_even_when_the_server_understated_it', async () => {
    // THE DECLARED SIZE IS THE REMOTE SERVER'S CLAIM ABOUT ITSELF (AC-1704), so
    // all three shapes are exercised: an honest oversize declaration, no
    // declaration at all, and a declaration that lies low. The middle one is the
    // load-bearing half — a guard that only reads `content-length` fails it.
    const before = await materialCount()
    const limit = `the limit is ${mb(MAX_MATERIAL_BYTES)}MB`

    // 1. Declared above the ceiling — refused WITHOUT pulling the body.
    let pulled = false
    const declaredOversize = responder(
      () =>
        new Response(
          new ReadableStream<Uint8Array>(
            {
              pull(controller) {
                pulled = true
                controller.enqueue(new Uint8Array(1024))
                controller.close()
              },
            },
            // highWaterMark 0 is what makes `pulled` mean anything. Under the
            // default strategy the runtime pulls once EAGERLY to fill the queue,
            // the moment the stream is constructed — so the flag would be true
            // before the guard had even seen the response, and the assertion
            // below would be unfalsifiable. At zero, `pull` fires only when
            // something actually reads, which is the claim being made.
            { highWaterMark: 0 },
          ),
          {
            status: 200,
            headers: {
              'content-type': 'application/pdf',
              'content-length': String(MAX_MATERIAL_BYTES * 2),
            },
          },
        ),
    )
    const honest = await retrieve('https://big.example.test/report.pdf', declaredOversize)
    expect(honest.status).toBe(400)
    const honestBody = (await honest.json()) as Record<string, unknown>
    // The message states BOTH sizes in megabytes and offers a remedy.
    expect(String(honestBody.error)).toContain(`${mb(MAX_MATERIAL_BYTES * 2)}MB`)
    expect(String(honestBody.error)).toContain(limit)
    expect(String(honestBody.error)).toContain('Try a smaller version')
    expect(pulled).toBe(false)
    expect(await materialCount()).toBe(before)

    // 2. NO declared size, and a body above the ceiling — the load-bearing half.
    const undeclared = responder(
      () =>
        new Response(streamOf(OVER_CEILING_CHUNKS), {
          status: 200,
          headers: { 'content-type': 'application/pdf' },
        }),
    )
    const silent = await retrieve('https://silent.example.test/report.pdf', undeclared)
    expect(silent.status).toBe(400)
    expect(String(((await silent.json()) as Record<string, unknown>).error)).toContain(limit)
    expect(await materialCount()).toBe(before)

    // 3. Declared WITHIN the ceiling, then sends more than that.
    const understated = responder(
      () =>
        new Response(streamOf(OVER_CEILING_CHUNKS), {
          status: 200,
          headers: { 'content-type': 'application/pdf', 'content-length': '1024' },
        }),
    )
    const lying = await retrieve('https://lying.example.test/report.pdf', understated)
    expect(lying.status).toBe(400)
    expect(String(((await lying.json()) as Record<string, unknown>).error)).toContain(limit)
    expect(await materialCount()).toBe(before)
  })

  it('test_UAT_AC1705_a_permitted_retrieval_yields_the_bytes_the_bare_type_and_the_final_address', async () => {
    // THE PROVENANCE IS THE LAST HOP (AC-1705). Naming an address we were
    // redirected away from would be a provenance record that is quietly wrong, so
    // the recorded source is asserted against the SECOND address specifically —
    // and the requested one is asserted to be reported separately rather than
    // discarded.
    const REQUESTED = 'https://reports.example.test/2026/outlook'
    const FINAL = 'https://cdn.example.test/2026/outlook.html'
    const DOC = '<h1>Outlook</h1><p>The kitchen opens at six and the bread is baked overnight.</p>'

    const chain = (): Responder =>
      responder((url) => {
        if (url === REQUESTED) {
          return new Response(null, { status: 301, headers: { location: FINAL } })
        }
        if (url === FINAL) {
          // A content type CARRYING A PARAMETER, which is what the bare-type
          // claim is about.
          return new Response(DOC, {
            status: 200,
            headers: { 'content-type': 'text/html; charset=utf-8' },
          })
        }
        throw new Error(`unexpected address: ${url}`)
      })

    // What a permitted retrieval yields, as the guard returns it.
    const direct = chain()
    const fetched = await guardedFetch(REQUESTED, MAX_MATERIAL_BYTES, { fetch: direct.fetch })
    expect(new TextDecoder().decode(fetched.bytes)).toBe(DOC)
    // THE BARE TYPE — the charset is stripped, so the downstream classification
    // of what kind of file this is matches on the type alone.
    expect(fetched.contentType).toBe('text/html')
    expect(fetched.finalUrl).toBe(FINAL)
    // The address the caller asked for is still reported, separately.
    expect(fetched.requestedUrl).toBe(REQUESTED)
    expect(direct.reached).toEqual([REQUESTED, FINAL])

    // And the material created from the same retrieval records the FINAL address.
    const response = await retrieve(REQUESTED, chain())
    expect(response.status).toBe(200)
    const body = (await response.json()) as Record<string, unknown>
    const attachment = body.attachment as Record<string, unknown>
    expect(attachment.content_type).toBe('text/html')
    expect(attachment.size).toBe(new TextEncoder().encode(DOC).length)

    const store = await ticketStoreFor(routerEnv())
    const { ticket } = await store.get({ uid: String(body.uid) })
    expect(ticket.fields.source_url).toBe(FINAL)
    expect(ticket.fields.source_url).not.toBe(REQUESTED)
  })

  it('test_UAT_AC1706_retrieved_material_lands_third_party_unpublishable_exportable_and_as_background', async () => {
    // INFERRED FROM PROVENANCE, NEVER ASKED (AC-1706). All five values are read
    // off the STORED record rather than the response envelope, and the
    // non-republishable marking is then shown to be EFFECTIVE rather than merely
    // recorded by putting it in front of the promotion gate.
    const DOC = '<p>Bakeries in the region grew by a tenth this year.</p>'
    const bytes = new TextEncoder().encode(DOC)

    const plain = await retrieve('https://industry.example.test/reports/outlook.html', serves(DOC))
    expect(plain.status).toBe(200)
    const fetchedBody = (await plain.json()) as Record<string, unknown>

    const store = await ticketStoreFor(routerEnv())
    const { ticket } = await store.get({ uid: String(fetchedBody.uid) })
    expect(ticket.fields.origin).toBe('fetched')
    expect(ticket.fields.rights).toBe('third_party')
    expect(ticket.fields.republishable).toBe(false)
    expect(ticket.fields.exportable).toBe(true)
    expect(ticket.fields.role).toBe('reference')

    // THE TWO DISTRIBUTION BITS INVERT relative to a client upload of the same
    // bytes, and neither is derived from the other.
    const uploaded = await upload(bytes, 'outlook.html', 'text/html')
    expect(uploaded.status).toBe(200)
    const uploadedBody = (await uploaded.json()) as Record<string, unknown>
    const { ticket: uploadedTicket } = await store.get({ uid: String(uploadedBody.uid) })
    expect(uploadedTicket.fields.origin).toBe('uploaded')
    expect(uploadedTicket.fields.republishable).toBe(true)
    expect(uploadedTicket.fields.exportable).toBe(false)
    expect(uploadedTicket.fields.republishable).not.toBe(ticket.fields.republishable)
    expect(uploadedTicket.fields.exportable).not.toBe(ticket.fields.exportable)

    // A REQUEST THAT ASKS FOR SOMETHING ELSE CHANGES NOTHING. Rights are not
    // accepted from the caller.
    const claimed = await retrieve(
      'https://industry.example.test/reports/second.html',
      serves(DOC),
      { role: 'site', rights: 'owned', republishable: true, owned: true, exportable: false },
    )
    expect(claimed.status).toBe(200)
    const claimedBody = (await claimed.json()) as Record<string, unknown>
    const { ticket: claimedTicket } = await store.get({ uid: String(claimedBody.uid) })
    expect(claimedTicket.fields.origin).toBe('fetched')
    expect(claimedTicket.fields.rights).toBe('third_party')
    expect(claimedTicket.fields.republishable).toBe(false)
    expect(claimedTicket.fields.exportable).toBe(true)
    expect(claimedTicket.fields.role).toBe('reference')

    // EFFECTIVE, NOT MERELY RECORDED: promoting it into a site's asset library is
    // refused by the gate, which reads the marking off the ticket.
    const site = await makeD1Site({ tenantId: TENANT, slug: 'ac1706-site' })
    await expect(
      promoteToSiteAsset(store, site.store, {
        uid: String(fetchedBody.uid),
        slug: site.slug,
        name: 'outlook.html',
      }),
    ).rejects.toBeInstanceOf(NotRepublishableError)
  })

  it('test_UAT_AC1707_a_retrieval_that_brings_back_nothing_usable_creates_no_material', async () => {
    // THREE REAL OUTCOMES OF POINTING AT A REAL ADDRESS (AC-1707), each refused in
    // the client's own words, each leaving the account exactly as it was.
    const beforeCount = await materialCount()
    const beforeBlobs = await blobKeys()

    // An error status rather than a document.
    const missing = responder(
      () => new Response('not found', { status: 404, statusText: 'Not Found' }),
    )
    const gone = await retrieve('https://news.example.test/moved', missing)
    expect(gone.status).toBe(400)
    const goneBody = (await gone.json()) as Record<string, unknown>
    expect(String(goneBody.error)).toContain('404')
    expect(String(goneBody.error)).toContain('nothing to store')
    expect(await materialCount()).toBe(beforeCount)
    expect(await blobKeys()).toEqual(beforeBlobs)

    // A redirect that names no destination.
    const nowhere = responder(() => new Response(null, { status: 302 }))
    const lost = await retrieve('https://news.example.test/loop', nowhere)
    expect(lost.status).toBe(400)
    const lostBody = (await lost.json()) as Record<string, unknown>
    expect(String(lostBody.error)).toContain('redirected without saying where to')
    expect(String(lostBody.error)).toContain('302')
    expect(await materialCount()).toBe(beforeCount)
    expect(await blobKeys()).toEqual(beforeBlobs)

    // A success carrying an empty document.
    const empty = responder(
      () => new Response('', { status: 200, headers: { 'content-type': 'text/plain' } }),
    )
    const blank = await retrieve('https://news.example.test/empty.txt', empty)
    expect(blank.status).toBe(400)
    const blankBody = (await blank.json()) as Record<string, unknown>
    expect(String(blankBody.error)).toContain('empty document')
    expect(String(blankBody.error)).toContain('nothing to store')
    expect(await materialCount()).toBe(beforeCount)
    expect(await blobKeys()).toEqual(beforeBlobs)
  })

  it('test_UAT_AC1708_a_refused_address_never_becomes_material_and_the_refusal_is_the_callers_error', async () => {
    // NOTHING TO CLEAN UP AND NOTHING FOR A LATER SWEEP TO FIND (AC-1708). Both
    // the record count AND the stored bytes are enumerated around each refusal,
    // because a count-only assertion would miss an orphaned blob and a
    // blob-only one would miss an orphaned record.
    const beforeCount = await materialCount()
    const beforeBlobs = await blobKeys()

    const REDIRECTING = 'https://news.example.test/story'
    const refusals: Array<{ url: string; r: Responder }> = [
      { url: 'https://169.254.169.254/latest/meta-data/', r: never() },
      { url: 'https://10.1.2.3/internal', r: never() },
      {
        url: REDIRECTING,
        r: responder((url) => {
          if (url === REDIRECTING) {
            return new Response(null, {
              status: 302,
              headers: { location: 'https://127.0.0.1:8788/admin' },
            })
          }
          throw new Error(`the guard fetched a refused hop: ${url}`)
        }),
      },
    ]

    for (const { url, r } of refusals) {
      const response = await retrieve(url, r)
      // THE CALLER'S ERROR: a client-side refusal, not a server failure — the
      // platform is working correctly when it refuses.
      expect(response.status, url).toBe(400)
      expect(response.status).toBeLessThan(500)
      // And NOT the forbidden that a rights refusal produces, which is a
      // different answer to a different question.
      expect(response.status).not.toBe(403)
      const body = (await response.json()) as Record<string, unknown>
      // The guard's own wording, carrying the address that was refused.
      expect(String(body.error)).toContain('is on a private network')
      expect(body.url).toBe(url)
      // A guard refusal names an ADDRESS; a rights refusal names a ticket.
      expect(body.uid).toBeUndefined()

      expect(await materialCount(), url).toBe(beforeCount)
      expect(await blobKeys(), url).toEqual(beforeBlobs)
    }

    // THE OTHER REFUSAL, FOR CONTRAST. Promoting retrieved material into a
    // site's asset library is refused as a matter of RIGHTS — a different error
    // carrying a different payload, which the route table answers `403` while
    // every refusal above is `400`.
    const store = await ticketStoreFor(routerEnv())
    const retrieved = await retrieve(
      'https://industry.example.test/reports/contrast.html',
      serves('<p>Somebody else’s report.</p>'),
    )
    expect(retrieved.status).toBe(200)
    const uid = String(((await retrieved.json()) as Record<string, unknown>).uid)
    const site = await makeD1Site({ tenantId: TENANT, slug: 'ac1708-site' })
    const rights = await promoteToSiteAsset(store, site.store, {
      uid,
      slug: site.slug,
      name: 'contrast.html',
    }).catch((err: unknown) => err)
    expect(rights).toBeInstanceOf(NotRepublishableError)
    expect((rights as NotRepublishableError).uid).toBe(uid)
    expect((rights as NotRepublishableError).message).toContain('cannot be published on a site')
  })
})
