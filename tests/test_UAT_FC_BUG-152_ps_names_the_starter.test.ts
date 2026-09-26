import { afterEach, describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { KNOWN_SERVICES, inDevPortBand, type DevProcessTable } from '../tools/generate/src/cli/ps'
import {
  devDeploySkipped,
  devStateDir,
  devUp,
  removeDevPidfile,
  type DevService,
} from '../tools/generate/src/cli/dev'

/**
 * [[BUG-152]] §1 — **`1c ps` names the starter of every service `bin/dev` started.**
 *
 * [[BUG-147]] established that a service is not always the process `up` spawned:
 * `wrangler dev` forks `workerd` and it is the GRANDCHILD that holds the port, so a
 * pidfile records both pids and every reader has to match a LISTENER against both.
 * `devTable` was fixed to do that. The `ps` verb composed its own managed set out
 * of the spawned pid alone — so the two call sites disagreed about what "managed"
 * means, and the one an operator actually reads was the wrong one: `dev` (8789) and
 * `public-site` (8787) showed an empty `started` column while `filing` and
 * `access-sim` showed `bin/dev`, from pidfiles all written by the same `bin/dev up`.
 * That is the signal someone reads before reaching for `bin/dev reap`, which
 * escalates to SIGKILL.
 *
 * WHY THIS SUITE RUNS AGAINST THE REAL CHECKOUT and not a temporary root, unlike
 * [[BUG-147]]'s. The defect was IN THE VERB, not in `devTable` — BUG-147's suite
 * asserted against `devTable` and passed throughout, which is precisely how the
 * misreport survived. `repoRoot()` is source-anchored and cannot be pointed
 * elsewhere, so the only way to exercise the code path an operator runs is to run
 * `1c ps` as the real subprocess, here, with a real service `devUp` really started
 * and a real pidfile written by the production writer. The probe is a port nothing
 * else in the suite draws from, and its pidfile is removed again; nothing about the
 * operator's own services is touched.
 *
 * WHAT IS MOCKED: nothing. Real wrapper, real grandchild holding a real port, real
 * `lsof`, real pidfile, real CLI. The deploy step is declared skipped because this
 * starts one probe service and shipping a snapshot is not what is under test.
 */

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
/** Deliberately not a name `KNOWN_SERVICES` or `DEV_SERVICES` uses. */
const PROBE = 'bug152probe'

const strays: number[] = []

afterEach(() => {
  for (const pid of strays.splice(0)) {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {
      /* already gone */
    }
  }
  removeDevPidfile(REPO, PROBE)
  fs.rmSync(path.join(devStateDir(REPO), `${PROBE}.log`), { force: true })
})

/**
 * A free port in the dev band, from a range no sibling suite draws from.
 *
 * [[BUG-147]]'s suite takes 8744–8779 and [[REQ-319]]'s takes 8800 up; two suites
 * probing one port can both see it free before either binds. 8780–8798 is this
 * file's, and a port `KNOWN_SERVICES` names is skipped so a test can never bind
 * over the operator's own service.
 */
async function freeBandPort(): Promise<number> {
  for (let port = 8780; port < 8799; port += 1) {
    if (KNOWN_SERVICES.some((k) => k.port === port)) continue
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
  throw new Error('no free port in 8780–8798')
}

/**
 * The `wrangler dev` → `workerd` shape: the listener is the wrapper's child, so
 * the pid holding the port is not the pid `up` spawned. The arrangement the two
 * snapshot services really have, built for real rather than simulated.
 */
function wrapperService(port: number): DevService {
  const child = `require('node:net').createServer().listen(${port}, '127.0.0.1')`
  const wrapper =
    `const c = require('node:child_process').spawn(process.execPath, ['-e', ${JSON.stringify(child)}], ` +
    `{ stdio: 'ignore' }); c.unref(); setInterval(() => {}, 1000)`
  return {
    name: PROBE,
    port,
    argv: [process.execPath, '-e', wrapper],
    what: 'a wrapper whose grandchild holds the port, as wrangler dev is',
  }
}

function ps(): DevProcessTable {
  const stdout = execFileSync(process.execPath, ['tools/generate/bin/1c.mjs', 'ps', '--json'], {
    cwd: REPO,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  return JSON.parse(stdout) as DevProcessTable
}

describe('1c ps names the starter of every service bin/dev started', () => {
  it('test_UAT_FC_BUG-152_ps_calls_a_grandchild_listener_managed', async () => {
    const port = await freeBandPort()
    const up = await devUp({
      repoRoot: REPO,
      services: [wrapperService(port)],
      deploy: devDeploySkipped('this UAT starts one probe service'),
      timeoutMs: 20_000,
    })
    const started = up.started[0]
    expect(started).toBeDefined()
    strays.push(started.pid, started.listenerPid as number)

    // THE SHAPE UNDER TEST IS REALLY THERE. If the wrapper were its own listener
    // the assertion below would pass on the broken code too, so the premise is
    // measured rather than assumed.
    expect(started.listenerPid).not.toBeNull()
    expect(started.listenerPid).not.toBe(started.pid)

    const table = ps()
    expect(table.probed).toBe(true)
    const row = table.listeners.find((l) => l.port === port)
    expect(row).toBeDefined()
    // The row is the LISTENER's — the wrapper holds no socket.
    expect(row?.pid).toBe(started.listenerPid)
    // AND THE COLUMN AN OPERATOR READS SAYS `bin/dev`. This is the assertion that
    // failed before the fix: `managed` was false and `started` printed `-` for a
    // service `up` had started seconds earlier.
    expect(row?.managed).toBe(true)
    expect(row?.line).toContain('bin/dev')
  })

  it('test_UAT_FC_BUG-152_ps_composes_no_managed_set_of_its_own', () => {
    // ONE DEFINITION OF "MANAGED", NOT TWO THAT AGREE TODAY. The specific pid that
    // was dropped is not the defect — a second call site free to assemble its own
    // answer is, and it stayed wrong for as long as it existed while `devTable` was
    // right. The verb reaches the table through `devTable` and derives nothing.
    const src = fs.readFileSync(path.join(REPO, 'tools/generate/src/cli/index.ts'), 'utf8')
    const verb = src.slice(src.indexOf("case 'ps': {"))
    // COMMENTS STRIPPED, because the comment above the fix names the expression the
    // fix removed — and an assertion that forbade the words would forbid explaining
    // them. What must not come back is the CODE.
    const body = verb
      .slice(0, verb.indexOf("case 'dev': {"))
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n')
    expect(body).toContain('devTable({ repoRoot: repoRoot() })')
    expect(body).not.toContain('devProcessTable')
    expect(body).not.toContain('managedPids')
    expect(body).not.toContain('readDevPidfiles')
  })
})
