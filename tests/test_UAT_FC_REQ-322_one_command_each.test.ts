import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { inDevPortBand, KNOWN_SERVICES, knownPort } from '../tools/generate/src/cli/ps'
import {
  DEV_SERVICES,
  devDown,
  devStateDir,
  devUp,
  formatUp,
  readDevPidfiles,
  type DevService,
} from '../tools/generate/src/cli/dev'
import {
  configPath,
  corpusDir,
  DOC_KIND_FIELD,
  kbBundle,
  kbEnsure,
  MEMBER_KIND,
  requireCoherentKb,
  SYSTEM_KB,
} from '../tools/generate/src/cli/kb'
import { writeKbModule } from '../tools/generate/src/cli/assets'
import { buildIndexesAndMap, STUB_MODEL } from './support/kb-fixture'

/**
 * [[REQ-322]] — **a step you have to remember is a step that will eventually be
 * forgotten**, applied to the two commands the operator types most.
 *
 * `bin/dev up` started four of the five services that make up the dev
 * environment, and the missing one was the DEPLOYED environment — the thing
 * [[REQ-318]] built. Nothing decided that: [[REQ-319]] named the watch builder
 * because the deployed port did not yet exist, and REQ-318 created the port and
 * deferred supervision back. Each named the other as the owner of the line "and
 * `up` starts it", and the line was never written.
 *
 * `bin/build` built every deployable artifact except the knowledge base, so
 * "build the thing" was two commands and which one you needed depended on
 * whether you happened to have edited a `system_kb` document. [[BUG-48]] is the
 * same lesson one level down, and `bin/kb-release` was its fix; it just was not
 * applied to the command the operator actually types.
 *
 * WHAT IS REAL HERE AND WHAT IS NOT. The processes are real — real detached
 * children, real pidfiles, a real `bin/access-sim` proxying a real HTTP origin,
 * and the KB stage running the real corpus resolution, the real index build and
 * the real inline. Three things are stood in for, each a boundary this repository
 * does not own: the embedding and describing models (`LAGRANGE_KM_EMBEDDER` /
 * `LAGRANGE_KM_DESCRIBER`, as REQ-123 and BUG-48 do it) and the ticketing CLI the
 * corpus export shells out to, so that the "document newer than the index" is a
 * document this file wrote rather than whatever the repository happens to hold.
 *
 * THE DEV PORTS THEMSELVES ARE NOT BOUND, deliberately and for the reason the
 * REQ-319 suite gives: a suite that listened on the real builder or dev port
 * would fight the operator's own running environment. What the real ports are is
 * asserted against {@link KNOWN_SERVICES}, which is the mechanism — the name and
 * the port come out of that table, and that is exactly what makes `down` and
 * `reap` cover a new service with no further change.
 */

const children: number[] = []
const tempRoots: string[] = []
const servers: http.Server[] = []

afterEach(() => {
  for (const pid of children.splice(0)) {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {
      /* already gone */
    }
  }
  for (const server of servers.splice(0)) server.close()
  for (const dir of tempRoots.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

function tempRoot(prefix = 'req322-'): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
  tempRoots.push(dir)
  return dir
}

/** A port inside the dev band that nothing currently holds. */
async function freeBandPort(from: number): Promise<number> {
  for (let port = from; port < 8900; port += 1) {
    const free = await new Promise<boolean>((resolve) => {
      const probe = net.createServer()
      probe.once('error', () => resolve(false))
      probe.once('listening', () => probe.close(() => resolve(true)))
      probe.listen(port, '127.0.0.1')
    })
    if (free) {
      expect(inDevPortBand(port)).toBe(true)
      return port
    }
  }
  throw new Error('no free port in the dev band')
}

/** A stand-in service: the real name, a free port, and a process that binds it. */
function standIn(service: DevService, port: number): DevService {
  return {
    ...service,
    port,
    argv: [process.execPath, '-e', `require('node:net').createServer().listen(${port}, '127.0.0.1')`],
  }
}

// ── 1 — `bin/dev up` starts the deployed environment ─────────────────────────

describe('bin/dev up — the whole dev environment, in one command', () => {
  it('test_UAT_FC_REQ-322_up_starts_both_servers_in_dependency_order', () => {
    const names = DEV_SERVICES.map((s) => s.name)

    // FIVE, AND THE NEW ONE IS THE DEPLOYED ENVIRONMENT. Before this ticket the
    // deployed dev environment was the one part of the dev environment `up` did
    // not start.
    expect(names).toEqual(['filing', 'builder', 'dev', 'public-site', 'access-sim'])

    const dev = DEV_SERVICES.find((s) => s.name === 'dev')
    expect(dev?.argv).toEqual(['bin/1c', 'dev', 'serve'])

    // BOTH SERVERS, NOT ONE (EPIC-16 §L1). §L1 requires the old path to keep
    // working until the replacement is proved, which means both up at once —
    // `serve` REPLACING `builder` in this list is the retirement step, and is a
    // later ticket.
    expect(names).toContain('builder')

    // `bin/access-sim` proxies to the server it fronts, so that server cannot be
    // started after it.
    expect(names.indexOf('dev')).toBeLessThan(names.indexOf('access-sim'))

    // EVERY NAME AND PORT COMES OUT OF THE ONE TABLE, which is the whole reason
    // `down` and `reap` need no change to cover a new service: the name is the
    // pidfile's stem and `1c ps` recognises the port because that table declares
    // it. A row that invented its own port would be managed by nothing.
    for (const service of DEV_SERVICES) {
      expect(KNOWN_SERVICES).toContainEqual(
        expect.objectContaining({ name: service.name, port: service.port }),
      )
    }

    // THE REPRO CONSOLE IS NOT STARTED, as asked: it boots its own Vite server
    // and runs each step as a fresh `1c` process, so it needs nothing here and
    // nothing here needs it. It stays in the known-port table, so `down` and
    // `reap` still see it.
    expect(names).not.toContain('repro-console')
    expect(KNOWN_SERVICES).toContainEqual(expect.objectContaining({ name: 'repro-console' }))
  })

  it('test_UAT_FC_REQ-322_up_records_all_five_and_down_frees_them', async () => {
    const root = tempRoot()
    const services: DevService[] = []
    let next = 8810
    for (const service of DEV_SERVICES) {
      const port = await freeBandPort(next)
      next = port + 1
      services.push(standIn(service, port))
    }

    const up = await devUp({ repoRoot: root, services, timeoutMs: 15_000 })
    for (const started of up.started) children.push(started.pid)
    expect(up.ok).toBe(true)
    expect(up.failed).toEqual([])
    // All five, in the order the list declares — including `dev`, which is the
    // service this ticket added.
    expect(up.started.map((s) => s.name)).toEqual([
      'filing',
      'builder',
      'dev',
      'public-site',
      'access-sim',
    ])

    // EACH WITH A PIDFILE, which is what makes it managed rather than merely
    // running: `down` reads these, and `reap` spares what they name.
    const recorded = readDevPidfiles(root)
    expect(recorded.map((p) => p.name).sort()).toEqual([
      'access-sim',
      'builder',
      'dev',
      'filing',
      'public-site',
    ])

    // …and `down` then covers the new service with no further change, which is
    // the property the shared name buys.
    const down = await devDown({ repoRoot: root })
    expect(down.ok).toBe(true)
    expect(down.stopped.map((s) => s.name).sort()).toEqual([
      'access-sim',
      'builder',
      'dev',
      'filing',
      'public-site',
    ])
    expect(down.stillListening).toEqual([])
    expect(readDevPidfiles(root)).toEqual([])
  })

  it('test_UAT_FC_REQ-322_a_refusal_is_not_reported_as_a_timeout', async () => {
    // `1c dev serve` DECLINES to start on a local D1 behind `db/migrations/`, and
    // `1c builder` on more than one resolvable `workerd` — each with a message
    // naming the repair. Detached, both look exactly like a server still warming
    // up: the port does not answer. Reported as a timeout, the operator reads
    // "slow" and waits, and the sentence that told them what to fix is sitting in
    // a log nobody has been pointed at.
    const root = tempRoot()
    const declinedPort = await freeBandPort(8840)
    const silentPort = await freeBandPort(declinedPort + 1)
    const outcome = await devUp({
      repoRoot: root,
      services: [
        {
          name: 'dev',
          port: declinedPort,
          argv: [
            process.execPath,
            '-e',
            "console.error('the local database is behind db/migrations/'); process.exit(3)",
          ],
          what: 'a service that declines, with a reason',
        },
        {
          name: 'silent',
          port: silentPort,
          argv: [process.execPath, '-e', 'setTimeout(() => {}, 30000)'],
          what: 'a process that is alive and binds nothing',
        },
      ],
      timeoutMs: 4000,
    })
    expect(outcome.ok).toBe(false)

    // A PROCESS THAT HAS EXITED IS A DECISION, NOT A DELAY — and it is reported
    // as one, with its exit code and with the log named, because the reason it
    // gave is already written there.
    const declined = outcome.failed.find((f) => f.name === 'dev')
    expect(declined?.kind).toBe('refused')
    expect(declined?.detail).toContain('exited with code 3')
    const log = path.join(devStateDir(root), 'dev.log')
    expect(declined?.detail).toContain(log)
    expect(fs.readFileSync(log, 'utf8')).toContain('db/migrations/')

    // The other one is still running and might yet answer, so nobody knows why —
    // which is a different sentence.
    const silent = outcome.failed.find((f) => f.name === 'silent')
    expect(silent?.kind).toBe('timeout')
    expect(silent?.detail).toContain('nothing answered')
    if (silent !== undefined) {
      const alive = readDevPidfiles(root).find((p) => p.name === 'silent')
      if (alive !== undefined) children.push(alive.pid)
    }

    // AND THE TWO ARE DIFFERENT WORDS IN THE REPORT, which is where the operator
    // reads them.
    const report = formatUp(outcome)
    expect(report).toContain('REFUSED')
    expect(report).toContain('FAILED')
  })
})

// ── the consequence that moved with it: access-sim's origin ───────────────────

describe('bin/access-sim — what `up` puts behind the gate', () => {
  /** Start the simulator and return everything it printed once it is answering. */
  async function sim(args: string[]): Promise<string> {
    const child = spawn('bin/access-sim', args, {
      cwd: process.cwd(),
      // Loopback must not go through the machine's proxy, or the simulator's own
      // forward would never reach the origin this test starts.
      env: { ...process.env, NO_PROXY: '127.0.0.1,localhost' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    if (child.pid !== undefined) children.push(child.pid)
    let out = ''
    child.stdout.on('data', (chunk: Buffer) => {
      out += chunk.toString()
    })
    const deadline = Date.now() + 15_000
    while (!out.includes('pair      ') && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return out
  }

  it('test_UAT_FC_REQ-322_access_sim_fronts_the_deployed_environment_by_default', async () => {
    // WHY THE DEFAULT HAD TO MOVE. `bin/dev up` starts this simulator with NO
    // argument, so once `up` also started the deployed environment the one server
    // reachable THROUGH ACCESS was the one being retired. That is not cosmetic:
    // `[env.dev.vars]` sets `ACCESS_DEV_OPEN = "1"`, so a direct connection to
    // the deployed port resolves every request to `TENANT_ID` and can only ever
    // reach one business. Work on any other arrives through here.
    const port = await freeBandPort(8850)
    const printed = await sim(['--port', String(port)])
    expect(printed).toContain(`builder   http://127.0.0.1:${knownPort('dev')}`)
    // …and NOT the watch builder, which is now the path that has to be named.
    expect(printed).not.toContain(`http://127.0.0.1:${knownPort('builder')}`)

    // Which is what `up` gets, because `up` passes no origin: the retiring path
    // is the one that now takes an argument, and that is the correct direction
    // for the inconvenience to run while both paths are alive.
    expect(DEV_SERVICES.find((s) => s.name === 'access-sim')?.argv).toEqual(['bin/access-sim'])
  })

  it('test_UAT_FC_REQ-322_a_page_fetched_through_access_sim_comes_from_the_origin_it_fronts', async () => {
    // The end of the claim: a request through the simulator's port is answered by
    // the server it fronts, so pointing it at the deployed environment is what
    // makes the deployed environment usable for a business other than `TENANT_ID`.
    const originPort = await freeBandPort(8860)
    const origin = http.createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/html' })
      res.end('<h1>the deployed snapshot</h1>')
    })
    servers.push(origin)
    await new Promise<void>((resolve) => origin.listen(originPort, '127.0.0.1', () => resolve()))

    const simPort = await freeBandPort(originPort + 1)
    const printed = await sim([
      '--port',
      String(simPort),
      '--builder',
      `http://127.0.0.1:${originPort}`,
    ])
    expect(printed).toContain(`builder   http://127.0.0.1:${originPort}`)

    const body = await new Promise<string>((resolve, reject) => {
      // SIGNED IN, because the simulator is the gate as well as the issuer: an
      // anonymous request is redirected to `/login` rather than forwarded, which
      // is the behaviour production has and the reason this stands in for it.
      const req = http.get(
        {
          host: '127.0.0.1',
          port: simPort,
          path: '/',
          timeout: 10_000,
          headers: { cookie: 'CF_Authorization=a-signed-in-browser' },
        },
        (res) => {
          let text = ''
          res.on('data', (chunk: Buffer) => {
            text += chunk.toString()
          })
          res.on('end', () => resolve(text))
        },
      )
      req.on('error', reject)
      req.on('timeout', () => req.destroy(new Error('timed out')))
    })
    expect(body).toContain('the deployed snapshot')
  })
})

// ── 2 — `bin/build` builds the knowledge base ────────────────────────────────

/**
 * The corpus this suite's KB is built over — two documents, as `doc` tickets.
 *
 * Supplied through a stand-in for the ticketing CLI rather than through the
 * repository's own store, so that "a `system_kb` document newer than the index"
 * is a document this file controls. The export itself is the real one.
 */
const TICKETS = [
  {
    uid: 'doc-req322-a',
    id: 'DOC-A322',
    title: 'Carousel behaviour module',
    body: '# Carousel behaviour module\n\nThe carousel rotates slides. Autoplay and interval are behavioural config.\n',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    fields: { [DOC_KIND_FIELD]: MEMBER_KIND },
  },
  {
    uid: 'doc-req322-b',
    id: 'DOC-B322',
    title: 'Storage and revisions',
    body: '# Storage and revisions\n\nPublishing snapshots the draft into a numbered revision and renders the output.\n',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    fields: { [DOC_KIND_FIELD]: MEMBER_KIND },
  },
]

/** A `doc` ticket only the rebuild is allowed to discover. */
const LATE = {
  uid: 'doc-req322-c',
  id: 'DOC-C322',
  title: 'The layout vocabulary',
  body: '# The layout vocabulary\n\nEvery field of every element kind, and how a spacer differs from a divider.\n',
  created_at: '2026-01-02T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
  fields: { [DOC_KIND_FIELD]: MEMBER_KIND },
}

/**
 * A `xgd` on `PATH` that answers `ticket list` with `tickets` and nothing else.
 *
 * THE ONE THIN MOCK IN THIS HALF, and it is at a true external boundary: the
 * corpus export reaches the ticket store by spawning the `xgd` CLI, which is
 * another program. Everything downstream of it — `corpusDocument`, the corpus
 * resolution, both index builds, the map, the bundle read and the inline — is the
 * real code path, unchanged and unaware.
 */
function fakeTicketStore(tickets: unknown[]): string {
  const dir = tempRoot('req322-bin-')
  const shim = path.join(dir, 'xgd')
  fs.writeFileSync(
    shim,
    `#!/bin/sh\ncat <<'JSON'\n${JSON.stringify({ items: tickets, next_cursor: null, truncated: false })}\nJSON\n`,
    { mode: 0o755 },
  )
  return dir
}

/** A KB root whose corpus is `tickets`, indexed, chunked and mapped for real. */
async function fixtureKb(tickets: typeof TICKETS): Promise<string> {
  const root = tempRoot('req322-kb-')
  const dir = corpusDir(root)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(
    configPath(root),
    JSON.stringify({
      knowledge_bases: {
        [SYSTEM_KB]: {
          description: 'Test system knowledge.',
          corpus: {},
          landscape: 'authored',
          source: 'shipped',
        },
      },
    }),
    'utf8',
  )
  for (const ticket of tickets) {
    fs.writeFileSync(
      path.join(dir, `${ticket.id}.md`),
      `---\nid: ${ticket.id}\ntype: doc\ntitle: ${ticket.title}\nfields:\n  ${DOC_KIND_FIELD}: ${MEMBER_KIND}\n---\n${ticket.body}`,
      'utf8',
    )
  }
  await buildIndexesAndMap(root)
  return root
}

/**
 * Write {@link LATE} into the corpus, after the last index build.
 *
 * Exactly how a tree goes stale, and the state the whole stage exists to notice:
 * the document is in the corpus text immediately and in the index never, so
 * retrieval — which searches the index — cannot see it while the bundle carries
 * it. Nothing is wrong with the file, the export, or the pipeline.
 */
function addLateDocument(root: string): void {
  fs.writeFileSync(
    path.join(corpusDir(root), `${LATE.id}.md`),
    `---\nid: ${LATE.id}\ntype: doc\ntitle: ${LATE.title}\nfields:\n  ${DOC_KIND_FIELD}: ${MEMBER_KIND}\n---\n${LATE.body}`,
    'utf8',
  )
}

/** A repo-shaped directory whose `kb/` is `root` — what `writeKbModule` walks. */
function repoAround(root: string): string {
  const repo = tempRoot('req322-repo-')
  fs.symlinkSync(root, path.join(repo, 'kb'), 'dir')
  return repo
}

describe('bin/build — building the thing is one command', () => {
  beforeAll(() => {
    process.env.LAGRANGE_KM_EMBEDDER = STUB_MODEL
    process.env.LAGRANGE_KM_DESCRIBER = STUB_MODEL
  })

  afterAll(() => {
    delete process.env.LAGRANGE_KM_EMBEDDER
    delete process.env.LAGRANGE_KM_DESCRIBER
  })

  it('test_UAT_FC_REQ-322_a_coherent_index_costs_no_credential_and_no_request', async () => {
    const root = await fixtureKb(TICKETS)

    // THE ENVIRONMENT CARRIES NO CREDENTIAL AT ALL, which is the assertion: a
    // stage that unconditionally built would have to read one, and would fail
    // here. Nearly every build touches no KB document, and paying a Workers AI
    // round trip for those would be a real regression.
    const spent: string[] = []
    const realFetch = globalThis.fetch
    globalThis.fetch = (async (...args: Parameters<typeof fetch>) => {
      spent.push(String(args[0]))
      throw new Error('the KB stage made a request it had no business making')
    }) as typeof fetch
    try {
      const outcome = await kbEnsure({ root, env: {} })
      expect(outcome.action).toBe('current')
      expect(outcome.report).toContain('nothing to build')
      expect(outcome.skew?.missing).toEqual([])
      expect(outcome.skew?.stale).toEqual([])
    } finally {
      globalThis.fetch = realFetch
    }
    expect(spent).toEqual([])
  }, 120_000)

  it('test_UAT_FC_REQ-322_a_stale_index_with_no_credential_fails_in_this_stage', async () => {
    const root = await fixtureKb(TICKETS)
    addLateDocument(root)
    const before = fs.readdirSync(path.join(corpusDir(root), 'index')).map((name) => {
      const file = path.join(corpusDir(root), 'index', name)
      return [name, fs.readFileSync(file).toString('base64')] as const
    })

    // REFUSED HERE, ONE STAGE EARLIER THAN `1c assets` WOULD REFUSE, and with the
    // fix named. The same refusal either way; the difference is that this one
    // says what to do about it and arrives before anything has been emitted.
    await expect(kbEnsure({ root, env: {} })).rejects.toThrow(/CLOUDFLARE_API_TOKEN/)
    // …and it carries the reason the build was needed, not merely the credential.
    await expect(kbEnsure({ root, env: {} })).rejects.toThrow(new RegExp(LATE.id))

    // NOTHING WAS WRITTEN. The refusal lands before the corpus is rewritten, so a
    // previously built tree is left exactly as it was — which is what makes it
    // safe to put this stage ahead of the assets rather than after them.
    const after = fs.readdirSync(path.join(corpusDir(root), 'index')).map((name) => {
      const file = path.join(corpusDir(root), 'index', name)
      return [name, fs.readFileSync(file).toString('base64')] as const
    })
    expect(after).toEqual(before)
  }, 120_000)

  it('test_UAT_FC_REQ-322_a_stale_index_is_rebuilt_and_the_bundle_then_covers_the_document', async () => {
    const root = await fixtureKb(TICKETS)
    addLateDocument(root)
    // The store holds it too, so the export the rebuild begins with keeps it
    // rather than sweeping it as a document no ticket claims.
    const bin = fakeTicketStore([...TICKETS, LATE])
    const realPath = process.env.PATH
    process.env.PATH = `${bin}${path.delimiter}${realPath ?? ''}`
    try {
      const outcome = await kbEnsure({ root, env: process.env })
      expect(outcome.action).toBe('built')
      // The skew that triggered it is CARRIED, so the report can say why it built
      // rather than only that it did.
      expect(outcome.skew?.missing).toContain(LATE.id)
      // The whole build ran, not only the index: `1c kb build` writes both
      // indexes and the map, and this stage is that verb rather than a subset of
      // it. A stage that built one of the three would leave the KB technically
      // present and practically useless.
      expect(outcome.report).toContain('index:')
      expect(outcome.report).toContain('chunks:')
      expect(outcome.report).toContain('map:')

      // THE INDEX NOW COVERS THE CORPUS, which is the whole point: the check that
      // triggered the build is the same check `1c assets` refuses on, so a build
      // that passes this stage cannot be refused by the next one.
      const bundle = await kbBundle(root)
      expect(bundle).not.toBeNull()
      await expect(requireCoherentKb(bundle!, root)).resolves.toBeTruthy()

      // …and the inline then carries the document, which is what the assistant
      // reads. Before this ticket the operator had to remember to run a second
      // command to get here.
      const repo = repoAround(root)
      const generated = path.join(repo, 'generated')
      fs.mkdirSync(generated, { recursive: true })
      const report = await writeKbModule(generated, repo)
      expect(report.built).toBe(true)
      const inlined = fs.readFileSync(path.join(generated, 'kb.js'), 'utf8')
      expect(inlined).toContain(LATE.id)
      expect(inlined).toContain('a spacer differs from a divider')
    } finally {
      process.env.PATH = realPath
    }
  }, 180_000)

  it('test_UAT_FC_REQ-322_force_skips_the_question_but_not_the_credential', async () => {
    // `bin/kb-release`'s entry, and the one difference between the two callers:
    // that command's subject IS the rebuild, so it does not ask whether the index
    // is behind — this index is perfectly coherent and it builds anyway. What it
    // does NOT skip is the credential, which it refuses on in the same place and
    // in the same words as the conditional entry. That shared refusal is the
    // property that makes one stage with two entries better than two stages.
    const root = await fixtureKb(TICKETS)
    await expect(kbEnsure({ root, force: true, env: {} })).rejects.toThrow(/CLOUDFLARE_API_TOKEN/)
  }, 120_000)

  it('test_UAT_FC_REQ-322_both_entry_points_run_the_one_stage', () => {
    // ASSERTED RATHER THAN OBSERVED. `bin/kb-release` remains the KB-only path —
    // rebuilding the index without a full preflight and typecheck is a real thing
    // to want — but it must be a CALLER of `bin/build`'s stage and not a second
    // spelling of it, on the argument `bin/deploy` already makes about
    // `--dry-run`: a rehearsal that took a different route would prove nothing
    // about the real thing.
    const build = fs.readFileSync('bin/build', 'utf8')
    const release = fs.readFileSync('bin/kb-release', 'utf8')

    expect(build).toMatch(/bin\/1c" kb ensure$/m)
    expect(release).toMatch(/bin\/1c" kb ensure --force$/m)

    // Neither reaches past the shared stage into what it wraps: two callers doing
    // that is how a shared stage stops being shared.
    expect(build).not.toMatch(/bin\/1c" kb build/)
    expect(release).not.toMatch(/bin\/1c" kb build/)

    // BEFORE THE ASSETS, which is BUG-48's ordering and the only one that works:
    // `1c assets` reads the corpus as a directory listing and the two manifests
    // as build artefacts, so it has to run after whatever brings them into step.
    const kbStage = build.search(/bin\/1c" kb ensure$/m)
    const assets = build.search(/bin\/1c" assets$/m)
    expect(kbStage).toBeGreaterThan(-1)
    expect(assets).toBeGreaterThan(kbStage)
  })
})
