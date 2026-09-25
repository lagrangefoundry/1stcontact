import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { execFile, spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import {
  DEV_HOST,
  devEnvLayering,
  devUrl,
  devVarsLocalPath,
  devVarsPath,
  wranglerDevArgs,
} from '../tools/generate/src/cli/dev-env'
import { devServeArgs, snapshotSummary, type DevSnapshot } from '../tools/generate/src/cli/dev-snapshot'
import { resetJwksCache } from '../apps/control-app/src/access'
import worker from '../apps/control-app/src/index'

/**
 * BUG-146 — **`.dev.vars.local` is in the layering, so access-sim can sign
 * somebody in**.
 *
 * WHAT WAS WRONG, AND WHY IT LOOKED LIKE NOTHING. `bin/access-sim` has always
 * told the operator to write `.dev.vars.local`, because repointing
 * `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` at the simulator is exactly what makes
 * `isUnconfiguredLocalDev` false and switches the real Access path on. But
 * `devEnvLayering` composed two `--env-file` flags and neither was that file, so
 * for both `1c builder` and `1c dev serve` the documented way to LEAVE dev-open
 * mode had no effect. A valid minted token was then ignored — and an ignored
 * token and a working dev-open mode present identically: `person: null`, one
 * business named by its raw id, nothing in any log.
 *
 * SO THE EVIDENCE HAS TO CROSS THE WHOLE JOIN. Every leg below runs the real
 * simulator, asks it for the real `--print-env` output, writes it where the
 * recipe says, composes the real argv, derives the vars the way wrangler derives
 * them, and then hands those vars to the product's own gate. Asserting the argv
 * alone would pass on a Worker that ignored the file; asserting the gate alone
 * would pass on the workaround this ticket exists to retire.
 *
 * WHERE THIS STOPS, DELIBERATELY. The ticket's boundary is that
 * `isUnconfiguredLocalDev`, the dev-open branch and `admit` are all correct and
 * unchanged, so the new fact is the LAYERING reaching the gate — not what happens
 * behind it. The admitted path with a real database, a real grant and a resolved
 * person is proved in `test_UAT_FC_REQ-167_identity.workers.test.ts`, where there
 * are bindings for it; this node suite has none, which is why it proves the join
 * rather than approximating the far side of it.
 */

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SIM = path.join(REPO, 'bin', 'access-sim')
const AUD = 'bug146-local-aud'

/** The `[vars]` a real deployment sets and `.dev.vars` blanks, verbatim. */
const BLANKED = 'ACCESS_TEAM_DOMAIN = ""\nACCESS_AUD = ""\nPLATFORM_ADMINS = "martin@westhead.me"\n'

let sim: ChildProcess | undefined
let simOrigin = ''

/** A port nobody else is on, asked for rather than guessed. */
async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      server.close(() => resolve(port))
    })
  })
}

/** The simulator is up when its keys are readable — its half of the exchange. */
async function waitForCerts(url: string, attempts = 60): Promise<void> {
  for (let i = 0; i < attempts; i += 1) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      /* not listening yet */
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error(`access-sim did not answer ${url}`)
}

beforeAll(async () => {
  const port = await freePort()
  simOrigin = `http://${DEV_HOST}:${port}`
  sim = spawn(process.execPath, [SIM, '--port', String(port), '--aud', AUD], { stdio: 'ignore' })
  await waitForCerts(`${simOrigin}/cdn-cgi/access/certs`)
}, 30_000)

afterAll(() => {
  sim?.kill()
})

afterEach(() => {
  // The JWKS is cached for an hour, and every leg here points a fresh `env` at
  // the same loopback issuer. Left set, one leg's cache would answer the next.
  resetJwksCache()
})

const scratch: string[] = []

/**
 * A control app as the operator has one: `wrangler.toml`'s Access vars blanked by
 * `.dev.vars`, and whatever `.dev.vars.local` is supposed to be in this leg.
 *
 * THE BLANKS ARE THE POINT and are written rather than omitted. `.dev.vars`
 * SETTING both vars empty is the state `.dev.vars.local` has to override; a
 * fixture that simply left them unmentioned would prove nothing about the
 * override direction, which is the half that silently inverts.
 */
function appDirWith(local: string | null): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bug146-'))
  scratch.push(dir)
  fs.writeFileSync(devVarsPath(dir), BLANKED)
  if (local !== null) fs.writeFileSync(devVarsLocalPath(dir), local)
  return dir
}

/**
 * AND THE THIRD FILE IS ISOLATED TOO, which is not a detail.
 *
 * The secrets file is resolved from `$HOME`, so a suite that left it at the
 * machine's own would read whatever that operator has there — and on the machine
 * this was diagnosed on that file holds the RETIRED WORKAROUND: the same Access
 * vars, appended by hand. Every assertion below about a blanked pair or half a
 * pair would then be measuring the workaround rather than the fix, and would pass
 * or fail according to whose laptop ran it.
 */
function isolated(appDir: string): NodeJS.ProcessEnv {
  return { HOME: appDir }
}

afterAll(() => {
  for (const dir of scratch) fs.rmSync(dir, { recursive: true, force: true })
})

/** The layering as a launcher composes it, with the machine kept out of it. */
function layeringFor(appDir: string) {
  return devEnvLayering({ appDir, env: isolated(appDir) })
}

/** `--print-env`, from the same process the token will come from. */
async function printEnv(): Promise<string> {
  const port = new URL(simOrigin).port
  const { stdout } = await promisify(execFile)(process.execPath, [
    SIM,
    '--print-env',
    '--port',
    port,
    '--aud',
    AUD,
  ])
  return stdout
}

/**
 * The vars a Worker will see, DERIVED FROM AN ARGV the way wrangler derives them.
 *
 * INDEPENDENT OF `readDevEnv`, which is code under test here. `--env-file`
 * replaces wrangler's default `.dev.vars` lookup, later files win, and relative
 * arguments resolve against the config directory: that is the whole of wrangler's
 * contract, and restating it here is what makes the assertions about the composed
 * argv assertions about what a real server would load.
 */
function varsAWorkerWouldSee(argv: readonly string[], appDir: string): Record<string, string> {
  const envFiles: string[] = []
  for (let i = 0; i < argv.length; i += 1) if (argv[i] === '--env-file') envFiles.push(argv[i + 1])
  const vars: Record<string, string> = {}
  for (const file of envFiles.length ? envFiles : ['.dev.vars']) {
    const resolved = path.resolve(appDir, file)
    if (!fs.existsSync(resolved)) continue
    for (const line of fs.readFileSync(resolved, 'utf8').split('\n')) {
      const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line)
      if (!match) continue
      const value = match[2].trim()
      vars[match[1]] = /^(['"])(.*)\1$/.test(value) ? value.slice(1, -1) : value
    }
  }
  return vars
}

/** The order `--env-file` arguments appear in, which IS their load order. */
function envFilesOf(argv: readonly string[]): string[] {
  const files: string[] = []
  for (let i = 0; i < argv.length; i += 1) if (argv[i] === '--env-file') files.push(argv[i + 1])
  return files
}

const SNAPSHOT: DevSnapshot = {
  app: 'control-app',
  env: 'dev',
  worker: '1stcontact-control-app-dev',
  entry: 'worker/worker.js',
  assets: 'assets',
  deployedAt: '2026-09-25T00:00:00Z',
  commit: 'abc1234',
}

/**
 * The two launchers, as a table. The defect was a property of the LAYERING and
 * therefore of both, and a fix asserted against one of them is a fix that can be
 * half-applied without anything saying so.
 */
const LAUNCHERS = [
  {
    what: '1c builder',
    argv: (appDir: string) => wranglerDevArgs({ appDir, port: '8788', env: isolated(appDir) }),
  },
  {
    what: '1c dev serve',
    argv: (appDir: string) =>
      devServeArgs({ appDir, snapshot: SNAPSHOT, port: 8789, env: isolated(appDir) }),
  },
] as const

describe('BUG-146 — the local override is in the layering', () => {
  /**
   * The ordering claim, ASSERTED ON THE COMPOSED ARGV rather than observed in a
   * running server. Later files win, so an inverted order would leave
   * `.dev.vars`'s blanks on top — a silent return to the exact defect, and one
   * that a running-server observation would attribute to the simulator.
   */
  it.each(LAUNCHERS)(
    'test_UAT_FC_BUG-146_the_local_override_loads_after_dev_vars — $what',
    ({ argv }) => {
      const files = envFilesOf(argv(appDirWith('')))

      expect(files, 'the layering does not name .dev.vars.local at all').toContain('.dev.vars.local')
      expect(files.indexOf('.dev.vars')).toBeGreaterThanOrEqual(0)
      expect(
        files.indexOf('.dev.vars.local'),
        'the local override loads BEFORE .dev.vars, so the blanks win',
      ).toBeGreaterThan(files.indexOf('.dev.vars'))
      // LAST, not merely after: the workaround this retires put the same vars in
      // the secrets file, and the supported recipe has to beat a leftover rather
      // than lose to one.
      expect(files[files.length - 1]).toBe('.dev.vars.local')
    },
  )

  /**
   * And the vars really arrive, through the file the recipe writes. This is the
   * whole of fault 2: the values were correct, the file was correct, and nothing
   * read it.
   */
  it.each(LAUNCHERS)(
    'test_UAT_FC_BUG-146_print_env_reaches_the_worker_through_the_layering — $what',
    async ({ argv }) => {
      const appDir = appDirWith(await printEnv())

      const vars = varsAWorkerWouldSee(argv(appDir), appDir)

      expect(vars.ACCESS_TEAM_DOMAIN, 'the blanks in .dev.vars won').toBe(simOrigin)
      expect(vars.ACCESS_AUD).toBe(AUD)
      // The third key ([[BUG-59]]) travels the same road, so the service-token
      // half of the simulator is wired by the same act.
      expect(vars.SERVICE_TOKEN_IDENTITIES).toMatch(/=/)
      // …and the file it overrides is still loaded, which is what `--env-file`
      // replacing the default lookup makes a real question.
      expect(vars.PLATFORM_ADMINS).toBe('martin@westhead.me')
    },
  )

  /**
   * THE CLAIM ITSELF, END TO END: with the file in place a minted token is
   * verified by the product's own gate, and WITHOUT it the same anonymous request
   * is waved through instead.
   *
   * BOTH DIRECTIONS IN ONE TEST, because either alone is consistent with the
   * defect. "The token is accepted" passes on a build that accepts everything;
   * "dev-open is off" passes on a build that refuses everything. What the operator
   * lost was the difference between the two.
   */
  it.each(LAUNCHERS)(
    'test_UAT_FC_BUG-146_the_layering_switches_the_real_gate_on — $what',
    async ({ argv }) => {
      const configured = appDirWith(await printEnv())
      const devOpen = appDirWith(null)

      // `ACCESS_DEV_OPEN` is set in BOTH, exactly as `wrangler.toml` sets it for
      // every local run: what changes between the two is only whether the file
      // the recipe writes exists.
      const envFor = (appDir: string) => ({
        ...varsAWorkerWouldSee(argv(appDir), appDir),
        ACCESS_DEV_OPEN: '1',
      })

      const anonymous = new Request('http://127.0.0.1:8788/api/businesses')
      const refused = await worker.fetch(anonymous.clone(), envFor(configured))
      expect(refused.status, 'dev-open still applied, so the gate never ran').toBe(401)
      expect(await refused.text()).toMatch(/Access/)

      resetJwksCache()
      const token = (await (await fetch(`${simOrigin}/mint?email=martin@westhead.me`)).text()).trim()
      const admitted = await worker.fetch(
        new Request('http://127.0.0.1:8788/api/businesses', {
          headers: { cookie: `CF_Authorization=${token}` },
        }),
        envFor(configured),
      )
      // NOT A 200, AND THAT IS NOT A WEAKER CLAIM. What lies behind the gate needs
      // a database this suite has no binding for; what this ticket changed is that
      // the gate is no longer what stops the caller. Same division as REQ-147.
      expect(admitted.status, 'the minted token was refused by the gate').not.toBe(401)
      expect(await admitted.text()).not.toMatch(/Cloudflare Access rejected/)

      // And the before: no `.dev.vars.local`, both vars blank, dev-open applies
      // and the anonymous caller is NOT refused. This is the state every launch
      // was in before this ticket, whatever the operator had written.
      const open = await worker.fetch(anonymous.clone(), envFor(devOpen))
      expect(open.status, 'dev-open no longer opens an unconfigured loopback server').not.toBe(401)
    },
    30_000,
  )
})

describe('BUG-146 — a file that is not working says so', () => {
  /**
   * THREE SHAPES OF "NOT THERE", AND THEY WERE ONE SILENCE. Absent, 0-byte and
   * present-without-the-vars all left the Worker in dev-open mode; the machine
   * this was diagnosed on had the 0-byte case, and nothing anywhere distinguished
   * it from the file simply not being read. The distinction is most of the
   * diagnosis, so it is the assertion.
   */
  it('test_UAT_FC_BUG-146_absent_empty_and_incomplete_are_three_different_warnings', async () => {
    const warningFor = (local: string | null): string => {
      const dir = appDirWith(local)
      const lines = devEnvLayering({ appDir: dir, env: isolated(dir) }).warnings.filter((w) =>
        w.includes('.dev.vars.local'),
      )
      expect(lines, `no warning names .dev.vars.local for ${JSON.stringify(local)}`).toHaveLength(1)
      // The RESOLVED path in every shape: `.dev.vars.local` on its own does not
      // say which directory was searched, and that is the question being asked.
      expect(lines[0]).toContain(devVarsLocalPath(dir))
      // And what was lost, in the operator's terms rather than the file's.
      expect(lines[0]).toContain('access-sim cannot sign anyone in')
      expect(lines[0]).toContain('dev-open')
      return lines[0].replace(devVarsLocalPath(dir), '<path>')
    }

    const absent = warningFor(null)
    const empty = warningFor('')
    const incomplete = warningFor('SERVICE_TOKEN_IDENTITIES="local-dev=someone@example.com"\n')

    expect(new Set([absent, empty, incomplete]).size, 'two of the three read alike').toBe(3)
    expect(absent).toMatch(/^\s*no /)
    expect(empty).toContain('EMPTY')
    // Named, not counted: the file holds something, and which key is missing is
    // the difference between a stale file and a wrong one.
    expect(incomplete).toContain('ACCESS_TEAM_DOMAIN')
    expect(incomplete).toContain('ACCESS_AUD')

    // A POPULATED FILE IS SILENT. A warning that fired either way would be a
    // second thing to ignore rather than the thing that answers the question.
    const good = layeringFor(appDirWith(await printEnv()))
    expect(good.warnings.filter((w) => w.includes('.dev.vars.local'))).toEqual([])
  })

  /**
   * THE STATE THAT IS WORSE THAN DEV-OPEN, and the one the retired workaround
   * actually produced. Appending `--print-env` to a secrets file that ended
   * without a newline fused two settings into one line, leaving `ACCESS_AUD` set
   * and `ACCESS_TEAM_DOMAIN` undefined. `isUnconfiguredLocalDev` needs BOTH
   * empty, so half a pair switches the real gate on — and `guardAccess` then
   * refuses every request 503. The only symptom was a builder that had stopped
   * answering, with nothing connecting it to the edit.
   *
   * ASKED OF THE COMPOSED RESULT, because no single file is wrong in that state.
   */
  it.each([
    { what: 'the team domain alone', local: `ACCESS_TEAM_DOMAIN="http://127.0.0.1:8799"\n` },
    { what: 'the audience alone', local: 'ACCESS_AUD="local-dev-aud"\n' },
  ])('test_UAT_FC_BUG-146_half_an_access_pair_is_reported — $what', async ({ local }) => {
    const appDir = appDirWith(local)

    const layering = layeringFor(appDir)
    const incoherent = layering.warnings.filter((w) => w.includes('503'))

    expect(incoherent, 'half a configured pair passed without comment').toHaveLength(1)
    expect(incoherent[0]).toMatch(/ACCESS_(TEAM_DOMAIN|AUD) is set but ACCESS_(TEAM_DOMAIN|AUD) is not/)

    // AND IT IS THE TRUTH, not a guess: the Worker really does refuse everything
    // in that state, which is why saying so at launch is worth a line.
    const vars = { ...varsAWorkerWouldSee(wranglerDevArgs({ appDir, port: '8788', env: isolated(appDir) }), appDir), ACCESS_DEV_OPEN: '1' }
    const response = await worker.fetch(new Request('http://127.0.0.1:8788/api/businesses'), vars)
    expect(response.status).toBe(503)

    // A COMPLETE PAIR IS SILENT, or the line would fire on every working setup.
    const whole = layeringFor(appDirWith(await printEnv()))
    expect(whole.warnings.filter((w) => w.includes('503'))).toEqual([])
  })
})

describe('BUG-146 — the recipe and the banners name what they mean', () => {
  /**
   * The third trap on the same path. `CF_Authorization` is scoped by HOST and
   * ignores the port, so a cookie the simulator sets on `127.0.0.1` is not sent
   * to `localhost` — a different cookie host. Once the two faults above are
   * fixed, an operator who opens the URL a banner printed is logged out again,
   * for a third and unrelated-looking reason.
   *
   * PINNED TO THE SIMULATOR'S OWN HOST rather than to the literal `127.0.0.1`,
   * because the constraint is agreement between the two processes and not the
   * value they agree on. `access-sim` is plain JS that this cannot import, so the
   * host is read out of the interface it publishes: the issuer in `--print-env`,
   * which is the very string the Worker will verify `iss` against.
   */
  it('test_UAT_FC_BUG-146_the_printed_urls_name_access_sims_cookie_host', async () => {
    const printed = await printEnv()
    const issuer = /^ACCESS_TEAM_DOMAIN="([^"]+)"$/m.exec(printed)?.[1]
    expect(issuer, `--print-env published no issuer: ${printed}`).toBeTruthy()
    const cookieHost = new URL(issuer!).hostname

    expect(DEV_HOST, 'the dev banners and the simulator disagree about the cookie host').toBe(cookieHost)
    expect(devUrl(8789)).toBe(`http://${cookieHost}:8789`)

    // `1c dev serve`'s banner, through the function that composes it.
    const banner = snapshotSummary(SNAPSHOT, 8789)
    expect(banner).toContain(devUrl(8789))
    expect(banner, 'the dev environment banner still names the other cookie host').not.toContain('localhost')

    // `1c builder`'s printed URL. Its banner is a `console.log` inside a command
    // that goes on to spawn wrangler, so the assertion is that it interpolates
    // the shared helper rather than a literal — the property that keeps it in
    // step with the line above.
    const cli = fs.readFileSync(path.join(REPO, 'tools', 'generate', 'src', 'cli', 'index.ts'), 'utf8')
    const line = cli.split('\n').find((l) => l.includes('Builder (wrangler dev) on '))
    expect(line, 'the builder banner has moved or gone').toBeTruthy()
    expect(line!).toContain('${devUrl(port)}')
    expect(line!).not.toContain('localhost')
  })

  /**
   * AND THE RECIPE NAMES A FILE THE LAUNCHERS READ. This is the documentation
   * half of the defect, and the half that made it a mystery rather than an error:
   * `bin/access-sim` printed a path, the operator wrote it, and nothing loaded
   * it. Every script in the repository that prints the redirect is checked,
   * because a second spelling is the same defect waiting to recur.
   */
  it('test_UAT_FC_BUG-146_every_printed_recipe_names_the_file_the_layering_loads', () => {
    // WHAT THE LAYERING LOADS, expressed the way an operator types it: relative
    // to the repository root, which is where every `./bin/…` line is run from.
    const expected = path.relative(REPO, devVarsLocalPath(path.join(REPO, 'apps', 'control-app')))

    const scripts = ['access-sim', 'seed']
    let found = 0
    for (const name of scripts) {
      const text = fs.readFileSync(path.join(REPO, 'bin', name), 'utf8')
      for (const match of text.matchAll(/--print-env\s*>+\s*(\S+)/g)) {
        found += 1
        // A template reference resolves to the same path by construction — that
        // is what makes it the better spelling — so it is accepted as itself.
        if (match[1].includes('${')) continue
        expect(match[1], `bin/${name} redirects --print-env somewhere nothing reads`).toBe(expected)
      }
      // And no script may advise Access configuration into the secrets file: it
      // is read last-but-one, holds a personal key, and the append that put the
      // three vars there is what corrupted a line on the operator's machine.
      expect(text, `bin/${name} advises --print-env into the secrets file`).not.toMatch(
        /--print-env[^\n]*1c\.dev\.env/,
      )
    }
    expect(found, 'no script prints the recipe any more — it is the only documentation of it').toBeGreaterThan(0)
  })
})
