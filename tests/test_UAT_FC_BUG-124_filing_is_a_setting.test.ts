import { afterEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
  DEFAULT_FILING_PORT,
  FILING_TOKEN_VAR,
  FILING_URL_VAR,
  filingAddress,
  filingStatus,
  provisionFilingVars,
  startFilingService,
  type FilingProject,
  type FilingService,
} from '../tools/generate/src/cli/filing'
import { devVarsPath, readDevEnv, wranglerDevArgs } from '../tools/generate/src/cli/dev-env'
import { developmentFor, type DevelopmentProject } from '../apps/control-app/src/development'
import * as aiLib from '../apps/control-app/src/generated/ai-workers.js'

/**
 * [[BUG-124]] — **the filing address is a setting, not a launch artefact**.
 *
 * WHAT WAS WRONG, and it was not the design. [[REQ-273]] was built and wired
 * correctly: the `development` surface, the three verbs, the HTTP client, the
 * loopback listener. What was wrong was WHERE THE ADDRESS CAME FROM. The listener
 * bound port 0 and minted a fresh bearer per run, so both values were knowable
 * only by the process that had just minted them — `1c builder` — which handed
 * them to `wrangler dev` as `--var`. Being able to file a defect was therefore a
 * property of HOW THE DEV SERVER WAS LAUNCHED. Launch wrangler any other way and
 * the Worker saw no address, composed no surface, and the assistant silently had
 * no filing tool at all.
 *
 * HOW IT BIT. `bin/access-sim` is the only way to get a real identity locally and
 * its recipe launches `wrangler dev` by hand with a third `--env-file`, which
 * `1c builder` has no slot for. So the operator had to choose between a signed-in
 * session and a consultant that could file — and every defect that consultant
 * found reached us only because a person happened to be reading.
 *
 * THE FIX IS A REMOVAL. A fixed loopback port cannot go stale, so the address
 * lives in `.dev.vars` like every other var the Worker reads, `1c filing` starts
 * the listener without a dev server, and `--var` is gone. The security argument
 * survives: loopback still keeps other machines out, and a bearer minted ONCE
 * into a gitignored per-clone file is exactly as unreadable to a page in the
 * operator's browser as a new one every run.
 *
 * WHAT IS REAL HERE. A real `node:http` listener on a real loopback socket, the
 * Worker's real HTTP client, the real `Toolbox` and the real composition in
 * `development.ts`. What is scripted is the PROJECT, for the reason the two
 * REQ-273 suites script it: the real one writes tickets into this repository, and
 * a suite that filed one every time it ran would be a defect rather than a test.
 *
 * THE CLAIMS:
 *
 *  1. THE PORT IS FIXED AND OVERRIDABLE — an address that can be written down.
 *  2. THE ADDRESS IS WRITTEN ONCE INTO `.dev.vars` and kept, so the bearer
 *     survives a restart of either side.
 *  3. EVERY LAUNCH PATH SEES THE SAME ADDRESS — `1c builder` and a bare
 *     `wrangler dev`, the same assertion both ways round. This is the behaviour
 *     the ticket exists to create.
 *  4. A REPORT TRAVELS THE WHOLE PATH through a running service, from the tool
 *     the consultant actually calls to the project handle.
 *  5. AN ABSENT SERVICE IS LEGIBLE, and legible as a VALUE rather than as a line
 *     printed by the command that in the failing case was never run.
 *  6. THE FIXED BEARER IS STILL ENFORCED.
 */

/** The bridge is untyped JavaScript; the boundary is narrow and named here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any
const lib = aiLib as unknown as Untyped

let running: FilingService | null = null
const scratch: string[] = []

afterEach(async () => {
  await running?.close()
  running = null
  for (const dir of scratch.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

/** A clone-shaped scratch tree: an app dir, and a HOME with no secrets file. */
function clone(devVars?: string): { root: string; appDir: string; env: NodeJS.ProcessEnv } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bug124-'))
  scratch.push(root)
  const appDir = path.join(root, 'apps', 'control-app')
  fs.mkdirSync(appDir, { recursive: true })
  if (devVars !== undefined) fs.writeFileSync(path.join(appDir, '.dev.vars'), devVars, 'utf8')
  return { root, appDir, env: { HOME: root } }
}

/** A project handle that records rather than writes, in upstream's shapes. */
function recordingProject(): FilingProject &
  DevelopmentProject & { created: Array<Record<string, unknown>> } {
  const created: Array<Record<string, unknown>> = []
  let n = 0
  return {
    created,
    async create(spec) {
      created.push({ ...spec })
      n += 1
      return {
        ticket: { uid: `${spec.type}-0000${n}`, type: spec.type, title: spec.title, status: 'draft' },
        humanId: `${spec.type.toUpperCase()}-${n}`,
      }
    },
    async append(spec) {
      return { ticket: { uid: spec.uid, type: 'bug', title: 'a defect', status: 'draft' }, humanId: null }
    },
    async get(spec) {
      return { ticket: { uid: spec.uid, type: 'bug', title: 'a defect', status: 'draft' }, humanId: null }
    },
  }
}

// ── AC1 — a port that can be written down ──────────────────────────────────

describe('BUG-124 AC1 — the service binds a fixed default port', () => {
  it('test_UAT_FC_BUG-124_the_service_binds_its_fixed_default_port', async () => {
    // THE WHOLE DIFFERENCE FROM PORT 0. A port nobody can predict has to be told
    // to the Worker at launch, which is the coupling this ticket removes; a fixed
    // one can simply be written down, which is what makes `.dev.vars` an option
    // at all.
    running = await startFilingService({ root: process.cwd(), project: recordingProject() })
    expect(running.port).toBe(DEFAULT_FILING_PORT)
    expect(running.url).toBe(`http://127.0.0.1:${DEFAULT_FILING_PORT}/`)
  })

  it('test_UAT_FC_BUG-124_an_override_moves_it', async () => {
    // TWO CHECKOUTS WANTING TO RUN AT ONCE is the cost of a fixed port and the
    // override is the answer to it — so the default has to be a default and not
    // a constant the service enforces.
    running = await startFilingService({ root: process.cwd(), port: 8734, project: recordingProject() })
    expect(running.port).toBe(8734)

    // AND THE OVERRIDE REACHES THE RESOLVED ADDRESS, not only the socket: a
    // listener on a port the Worker is not told about is the original defect.
    expect(filingAddress({}, { port: 8734 }).url).toBe('http://127.0.0.1:8734/')
  })
})

// ── AC2 — written once, and kept ───────────────────────────────────────────

describe('BUG-124 AC2 — the address is provisioned into .dev.vars once', () => {
  it('test_UAT_FC_BUG-124_the_first_run_writes_both_vars_and_says_so', () => {
    // `.dev.vars` IS GITIGNORED AND PER-CLONE, which is what keeps the bearer
    // unreadable to a page in the operator's browser — and also means no clone
    // has these lines until something puts them there. A setup step nobody
    // performs is the same silence this ticket is about, one remove.
    const { appDir, env } = clone('ACCESS_TEAM_DOMAIN = ""\n')
    const provision = provisionFilingVars({
      devVarsPath: devVarsPath(appDir),
      vars: readDevEnv({ appDir, env }),
      mintToken: () => 'minted-once',
    })
    expect(provision.wrote).toBe(true)
    expect(provision.note).toContain(devVarsPath(appDir))

    const after = readDevEnv({ appDir, env })
    expect(after[FILING_URL_VAR]).toBe(`http://127.0.0.1:${DEFAULT_FILING_PORT}/`)
    expect(after[FILING_TOKEN_VAR]).toBe('minted-once')

    // AND THE OPERATOR'S OWN LINES ARE STILL THERE. The file is theirs; a tool
    // that reformatted it to add two lines would be trading their file for its
    // own idea of one.
    expect(after.ACCESS_TEAM_DOMAIN).toBe('')
  })

  it('test_UAT_FC_BUG-124_a_second_run_keeps_the_token_it_already_minted', () => {
    // THE POINT OF A SETTING. A value re-minted per run would put us back where
    // we started: the Worker would be pointed at a bearer that changed the moment
    // the listener restarted, and every restart would need the other side
    // restarting too.
    const { appDir, env } = clone('')
    provisionFilingVars({
      devVarsPath: devVarsPath(appDir),
      vars: readDevEnv({ appDir, env }),
      mintToken: () => 'minted-once',
    })
    const second = provisionFilingVars({
      devVarsPath: devVarsPath(appDir),
      vars: readDevEnv({ appDir, env }),
      mintToken: () => 'a-different-token',
    })
    expect(second.wrote).toBe(false)
    expect(second.address.token).toBe('minted-once')
    expect(fs.readFileSync(devVarsPath(appDir), 'utf8').match(/DEVELOPMENT_TICKETS_URL/g)).toHaveLength(1)
  })

  it('test_UAT_FC_BUG-124_no_dev_vars_file_is_told_rather_than_conjured', () => {
    // A CLONE WITH NO `.dev.vars` IS ALREADY A BROKEN LOCAL DEV — Access will
    // refuse every request and `devEnvLayering` says so — so writing one holding
    // only filing config would answer a question nobody asked while leaving the
    // one they did ask unanswered.
    const { appDir, env } = clone()
    const provision = provisionFilingVars({
      devVarsPath: devVarsPath(appDir),
      vars: readDevEnv({ appDir, env }),
      mintToken: () => 'minted-once',
    })
    expect(provision.wrote).toBe(false)
    expect(fs.existsSync(devVarsPath(appDir))).toBe(false)
    expect(provision.note).toContain(FILING_URL_VAR)
    expect(provision.note).toContain(FILING_TOKEN_VAR)
  })
})

// ── AC3 — the same address whichever way the dev server was started ────────

/**
 * The vars a Worker will see, derived from an argv the way wrangler derives them.
 *
 * WRITTEN AS A DERIVATION RATHER THAN AS TWO EXPECTATIONS, because the claim is
 * that the two launches AGREE, and a test that listed what each one should carry
 * would pass the day they drifted apart in the same direction.
 */
function varsAWorkerWouldSee(
  argv: string[],
  fallback: { appDir: string; env: NodeJS.ProcessEnv },
): Record<string, string> {
  const envFiles: string[] = []
  const vars: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--env-file') envFiles.push(argv[i + 1])
    if (argv[i] === '--var') {
      const [name, ...rest] = argv[i + 1].split(':')
      vars[name] = rest.join(':')
    }
  }
  // NO `--env-file` AT ALL is the bare `wrangler dev` case, and wrangler's own
  // default lookup is `.dev.vars` beside the config — which is precisely the
  // file `1c builder` names first.
  const files = envFiles.length ? envFiles : ['.dev.vars']
  const read: Record<string, string> = {}
  for (const file of files) {
    const resolved = path.resolve(fallback.appDir, file)
    if (!fs.existsSync(resolved)) continue
    for (const line of fs.readFileSync(resolved, 'utf8').split('\n')) {
      const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line)
      if (!match) continue
      const value = match[2].trim()
      read[match[1]] = /^(['"])(.*)\1$/.test(value) ? value.slice(1, -1) : value
    }
  }
  return { ...read, ...vars }
}

describe('BUG-124 AC3 — filing does not depend on how the dev server was started', () => {
  it('test_UAT_FC_BUG-124_the_builders_argv_carries_no_filing_var', () => {
    // THE REMOVAL ITSELF. `--var` was the whole mechanism by which a capability
    // became a property of a command line, and the assertion that matters is
    // that there is no longer one to carry.
    const { appDir, env } = clone('')
    const argv = wranglerDevArgs({ appDir, port: '8788', env })
    expect(argv).not.toContain('--var')
    expect(argv.join(' ')).not.toContain(FILING_URL_VAR)
  })

  it('test_UAT_FC_BUG-124_1c_builder_and_a_bare_wrangler_dev_reach_the_same_service', () => {
    // THE SAME ASSERTION BOTH WAYS ROUND, which is the behaviour this ticket
    // exists to create. Before the fix the left-hand side composed a surface and
    // the right-hand side composed `null`, and nothing anywhere said so.
    const { appDir, env } = clone('ACCESS_TEAM_DOMAIN = ""\n')
    provisionFilingVars({
      devVarsPath: devVarsPath(appDir),
      vars: readDevEnv({ appDir, env }),
      mintToken: () => 'minted-once',
    })

    const viaBuilder = varsAWorkerWouldSee(wranglerDevArgs({ appDir, port: '8788', env }), { appDir, env })
    const viaBareWrangler = varsAWorkerWouldSee(['wrangler', 'dev'], { appDir, env })

    expect(viaBuilder[FILING_URL_VAR]).toBe(viaBareWrangler[FILING_URL_VAR])
    expect(viaBuilder[FILING_TOKEN_VAR]).toBe(viaBareWrangler[FILING_TOKEN_VAR])

    // AND BOTH COMPOSE THE SURFACE, which is the fact an operator cares about:
    // not that two strings match, but that the consultant is offered the tool
    // either way. `developmentFor` is the single place that question is asked.
    expect(developmentFor(viaBuilder)).not.toBeNull()
    expect(developmentFor(viaBareWrangler)).not.toBeNull()
  })

  it('test_UAT_FC_BUG-124_a_deployment_with_no_dev_vars_still_composes_nothing', () => {
    // THE OTHER HALF, AND IT WAS ALWAYS RIGHT. A deployed builder has no project
    // on any disk to file into, so it must be offered no filing tool — the
    // honest alternative to a surface that refuses every call. Making the address
    // a setting must not make it a COMMITTED setting.
    const { appDir, env } = clone('ACCESS_TEAM_DOMAIN = ""\n')
    expect(developmentFor(readDevEnv({ appDir, env }))).toBeNull()
  })
})

// ── AC4 — the whole path, through a running service ────────────────────────

describe('BUG-124 AC4 — a report reaches the project through the running service', () => {
  it('test_UAT_FC_BUG-124_report_bug_travels_from_the_tool_call_to_the_project', async () => {
    // EVERY RUNG AT ONCE, and this is the case the original defect would have
    // failed at its very first step: the tool the consultant calls, the surface
    // this product composes, the HTTP client, a real loopback socket, the
    // listener, and the project handle at the far end.
    const project = recordingProject()
    running = await startFilingService({ root: process.cwd(), token: 'minted-once', project })

    const composed = developmentFor({
      DEVELOPMENT_TICKETS_URL: running.url,
      DEVELOPMENT_TICKETS_TOKEN: 'minted-once',
    })
    expect(composed).not.toBeNull()
    const box = new lib.Toolbox([composed!.surface], composed!.granted)

    const rendered = String(
      await box.run('ReportBug', {
        title: 'create_image silently ignores transparency',
        body: 'Asked for a transparent background; the picture came back opaque and nothing said so.',
      }),
    )

    expect(project.created).toHaveLength(1)
    expect(project.created[0].type).toBe('bug')
    expect(String(project.created[0].title)).toContain('transparency')
    expect(rendered).toContain('BUG-1')
  })
})

// ── AC5 — an absent service is legible ─────────────────────────────────────

describe('BUG-124 AC5 — the absence is a value, not a line nobody printed', () => {
  it('test_UAT_FC_BUG-124_no_configured_address_reads_as_unconfigured', async () => {
    // THE OLD SIGNAL WAS A BANNER PRINTED BY `1c builder` — which is to say,
    // printed by the command that in the failing case was never run. So this is
    // asserted on the STATE rather than on any rendering of it.
    const status = await filingStatus({ url: '', token: '', port: DEFAULT_FILING_PORT })
    expect(status.kind).toBe('unconfigured')
    expect(status.line).toContain(FILING_URL_VAR)
  })

  it('test_UAT_FC_BUG-124_a_configured_address_with_nothing_there_reads_as_unreachable', async () => {
    // THE DISTINCTION THE OPERATOR COULD NOT MAKE BEFORE: a capability this
    // product does not have, versus a dev server started the wrong way. They are
    // different sentences now because they are different values.
    const status = await filingStatus({
      url: 'http://127.0.0.1:8735/',
      token: 't',
      port: 8735,
    })
    expect(status.kind).toBe('unreachable')
    expect(status.line).toContain('1c filing')
  })

  it('test_UAT_FC_BUG-124_a_running_service_answers_the_probe_without_a_token', async () => {
    // WITHOUT A TOKEN, because the asker is sometimes a `1c` that has not read
    // the file holding the bearer — and "is anything listening" is not a question
    // a credential should be needed to ask.
    running = await startFilingService({ root: process.cwd(), token: 'minted-once', project: recordingProject() })
    const status = await filingStatus({ url: running.url, token: '', port: running.port })
    expect(status.kind).toBe('answering')
    expect(status.line).toContain(running.url)
  })
})

// ── AC6 — the fixed bearer is still a bearer ───────────────────────────────

describe('BUG-124 AC6 — a fixed token is still enforced', () => {
  it('test_UAT_FC_BUG-124_a_wrong_bearer_against_a_fixed_token_files_nothing', async () => {
    // WHAT THE TOKEN WAS EVER FOR. Loopback does not keep out a page in the
    // operator's own browser POSTing JSON cross-origin, and what that page could
    // do is file tickets into this repository. Freshness was never the thing
    // closing that hole — unreadability was, and a gitignored per-clone file is
    // as unreadable to that page as a uuid.
    const project = recordingProject()
    running = await startFilingService({ root: process.cwd(), token: 'minted-once', project })
    const composed = developmentFor({
      DEVELOPMENT_TICKETS_URL: running.url,
      DEVELOPMENT_TICKETS_TOKEN: 'not-the-token',
    })
    const box = new lib.Toolbox([composed!.surface], composed!.granted)
    const rendered = String(await box.run('ReportBug', { title: 't', body: 'b' }))
    expect(project.created).toHaveLength(0)
    expect(rendered.toLowerCase()).toMatch(/could not|unreachable|not filed/)
  })
})
