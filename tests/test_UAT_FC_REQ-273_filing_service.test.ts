import { afterEach, describe, expect, it } from 'vitest'

import {
  FILING_OPS,
  FILING_TOKEN_VAR,
  FILING_URL_VAR,
  dispatchFiling,
  startFilingService,
  type FilingProject,
  type FilingService,
} from '../tools/generate/src/cli/filing'
import { developmentFor, httpProject } from '../apps/control-app/src/development'

/**
 * [[REQ-273]] — **how a Worker reaches the project that builds it**.
 *
 * THE SUBSTANTIVE PIECE OF WORK, and the one the ticket named as such. Granting
 * the surface is a line; giving it somewhere to write is the problem. The
 * builder assistant runs in workerd both deployed and under `wrangler dev`; the
 * project that builds this product is an xgd project on a disk, reached by
 * spawning its CLI; and `node:child_process` does not exist in workerd — which
 * is why upstream splits that reach behind a `./node` subpath that a Workers
 * build fails on.
 *
 * SO THE SUBPROCESS HAPPENS IN THE ONE NODE PROCESS THAT IS ALREADY THERE.
 * `1c builder` starts `wrangler dev` and waits on it; the filing service is a
 * loopback listener in that same process, holding upstream's real `XgdProject`.
 * The Worker holds an HTTP client to it. This suite is the seam between the two.
 *
 * WHAT IS REAL HERE. A real `node:http` listener on a real loopback socket, and
 * the Worker's real client speaking to it over a real request. What is scripted
 * is the PROJECT, for the reason the workers suite scripts it: the real one
 * writes tickets into this repository, and a suite that filed one every time it
 * ran would be a defect rather than a test.
 *
 * THE CLAIMS:
 *
 *  1. THE ROUND TRIP WORKS — the Worker's client, over a socket, reaches the
 *     project handle and gets upstream's shapes back.
 *  2. A DECLARED FAILURE SURVIVES THE WIRE with its own code, because only the
 *     project knows whether anything was filed.
 *  3. THE BEARER IS ENFORCED, and a wrong one reads as a setup fault rather
 *     than as a refusal.
 *  4. THE LISTENER IS LOOPBACK AND ITS VERBS ARE AN ALLOW LIST — three
 *     operations, no query, no way to name a project.
 *  5. THE ADDRESS REACHES THE WORKER under the names the Worker reads. (HOW it
 *     reaches the Worker changed in [[BUG-124]] — it was a `--var` composed by
 *     `1c builder` and is now a line in `.dev.vars` — so the case below asks the
 *     claim of the names themselves rather than of the composer that is gone.
 *     `tests/test_UAT_FC_BUG-124_filing_is_a_setting.test.ts` is where the change
 *     of mechanism is pinned.)
 */

let running: FilingService | null = null

afterEach(async () => {
  await running?.close()
  running = null
})

/** A project handle that records rather than writes. */
function recordingProject(): FilingProject & { calls: Array<Record<string, unknown>> } {
  const calls: Array<Record<string, unknown>> = []
  return {
    calls,
    async create(spec) {
      calls.push({ op: 'create', ...spec })
      return { ticket: { uid: 'bug-abc123', type: spec.type, title: spec.title, status: 'draft' }, humanId: 'BUG-7' }
    },
    async append(spec) {
      calls.push({ op: 'append', ...spec })
      return { ticket: { uid: spec.uid, type: 'bug', title: 'a defect', status: 'draft' }, humanId: 'BUG-7' }
    },
    async get(spec) {
      calls.push({ op: 'get', ...spec })
      return { ticket: { uid: spec.uid, type: 'bug', title: 'a defect', status: 'draft' }, humanId: 'BUG-7' }
    },
  }
}

async function serve(project: FilingProject): Promise<FilingService> {
  running = await startFilingService({ root: process.cwd(), project })
  return running
}

// ── AC1 — the round trip ───────────────────────────────────────────────────

describe('REQ-273 AC1 — the Worker reaches the project over a real socket', () => {
  it('test_UAT_FC_REQ-273_a_filing_travels_from_the_worker_client_to_the_project', async () => {
    // THE WHOLE SEAM IN ONE CASE. Everything between the surface calling
    // `project.create` and upstream's `XgdProject` receiving it is exercised
    // here: the request shape, the bearer, the JSON envelope, the dispatch and
    // the answer coming back in upstream's shape rather than a flattened one.
    const project = recordingProject()
    const service = await serve(project)
    const client = httpProject(service.url, service.token)

    const answer = await client.create({
      type: 'bug',
      title: 'Placing a picture answers 500',
      body: 'Called `place_picture`; expected the asset on the draft, got a 500.',
      status: 'draft',
    })

    expect(project.calls).toHaveLength(1)
    expect(project.calls[0]).toMatchObject({ op: 'create', type: 'bug', status: 'draft' })
    expect(answer.ticket.uid).toBe('bug-abc123')
    expect(answer.humanId).toBe('BUG-7')
  })

  it('test_UAT_FC_REQ-273_an_append_travels_the_same_path', async () => {
    const project = recordingProject()
    const service = await serve(project)
    const client = httpProject(service.url, service.token)
    await client.append({ uid: 'bug-abc123', body: 'Second sighting.' })
    expect(project.calls[0]).toMatchObject({ op: 'append', uid: 'bug-abc123' })
  })
})

// ── AC2 — a declared failure survives the wire ─────────────────────────────

describe('REQ-273 AC2 — the project keeps its own account of what happened', () => {
  it('test_UAT_FC_REQ-273_a_refusal_arrives_with_the_code_the_project_gave_it', async () => {
    // THE TRANSLATION IS NOT DUPLICATED. Upstream's `XgdProject` turns xgd's
    // error vocabulary into the declared one; this listener forwards the result
    // and invents nothing. So a `written_but_unreadable` — the one failure that
    // reports a SUCCESS the caller cannot see, and whose whole point is that
    // retrying would file a second ticket — reaches the model intact.
    const service = await serve({
      async create() {
        throw Object.assign(new Error('wrote BUG-7 (bug-abc123) but could not read it back'), {
          code: 'written_but_unreadable',
          detail: 'the ticket is BUG-7 (bug-abc123)',
        })
      },
      async append() {
        throw new Error('unused')
      },
      async get() {
        throw new Error('unused')
      },
    })
    const client = httpProject(service.url, service.token)
    await expect(client.create({ type: 'bug', title: 't', body: 'b' })).rejects.toMatchObject({
      code: 'written_but_unreadable',
      detail: 'the ticket is BUG-7 (bug-abc123)',
    })
  })

  it('test_UAT_FC_REQ-273_a_failure_with_no_code_is_this_services_fault_and_says_so', async () => {
    // AN ERROR CARRYING NO DECLARED CODE did not come from the project's own
    // vocabulary, so it is a fault in the listener rather than a judgement about
    // the ticket. `project_unreachable` is the code whose declared meaning is
    // exactly that — and it also says nothing was filed, which is the safe thing
    // to be wrong about in only one direction.
    const answer = await dispatchFiling(
      {
        async create() {
          throw new Error('something broke')
        },
        async append() {
          throw new Error('unused')
        },
        async get() {
          throw new Error('unused')
        },
      },
      { op: 'create', type: 'bug', title: 't', body: 'b' },
    )
    expect(answer).toMatchObject({ ok: false, error: { code: 'project_unreachable' } })
  })
})

// ── AC3 — the bearer ───────────────────────────────────────────────────────

describe('REQ-273 AC3 — a loopback listener still needs a bearer', () => {
  it('test_UAT_FC_REQ-273_a_wrong_bearer_files_nothing_and_reads_as_a_setup_fault', async () => {
    // LOOPBACK KEEPS OTHER MACHINES OUT; it does not keep out a page in the
    // operator's own browser, which can POST JSON cross-origin without ever
    // reading the answer — and what that page could do is file tickets into this
    // repository. One header closes it.
    const project = recordingProject()
    const service = await serve(project)
    const client = httpProject(service.url, 'not-the-token')
    await expect(client.create({ type: 'bug', title: 't', body: 'b' })).rejects.toMatchObject({
      code: 'project_unreachable',
    })
    expect(project.calls).toHaveLength(0)
  })
})

// ── AC4 — loopback, and three verbs ────────────────────────────────────────

describe('REQ-273 AC4 — the listener is small on purpose', () => {
  it('test_UAT_FC_REQ-273_the_service_listens_on_loopback_only', async () => {
    // A SERVICE THAT FILES TICKETS INTO SOMEBODY'S SOURCE REPOSITORY has no
    // business being reachable from the network the laptop is on.
    const service = await serve(recordingProject())
    expect(service.url.startsWith('http://127.0.0.1:')).toBe(true)
  })

  it('test_UAT_FC_REQ-273_the_service_dispatches_three_operations_and_no_others', async () => {
    // AN ALLOW LIST AND NOT A LOOKUP. This is not a ticket API: there is no
    // query, no list, no delete, and no parameter that could name a project —
    // the root is fixed when the service starts.
    expect([...FILING_OPS]).toEqual(['create', 'append', 'get'])
    const answer = await dispatchFiling(recordingProject(), { op: 'archive', uid: 'bug-abc123' })
    expect(answer).toMatchObject({ ok: false, error: { code: 'project_unreachable' } })
    expect(JSON.stringify(answer)).toContain('archive')
  })
})

// ── AC5 — the address reaches the Worker ───────────────────────────────────

describe('REQ-273 AC5 — the Worker is told where the project is', () => {
  it('test_UAT_FC_REQ-273_the_vars_are_the_names_the_worker_reads', () => {
    // THE ONLY CONTRACT BETWEEN A NODE PROCESS AND A WORKERD ONE, and the
    // failure mode of the two halves drifting is silent: no var, no surface, no
    // error anywhere. The names are declared once in `filing.ts` — which is the
    // side that writes them — and asserted here against the side that reads
    // them, by composing the surface from an env built out of those names alone.
    const composed = developmentFor({
      [FILING_URL_VAR]: 'http://127.0.0.1:1234/',
      [FILING_TOKEN_VAR]: 'abc',
    })
    expect(composed).not.toBeNull()

    // AND A TYPO IN EITHER IS STILL SILENT, which is why the names are constants
    // rather than literals at each site: an env carrying neither composes
    // nothing at all, with no error anywhere to say why.
    expect(developmentFor({ DEVELOPMENT_TICKET_URL: 'http://127.0.0.1:1234/' } as never)).toBeNull()
  })
})
