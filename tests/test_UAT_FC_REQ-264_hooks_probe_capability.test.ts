import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { secretHookHarness } from './support/secret-hook'

/**
 * [[REQ-264]] — **the hooks probe, and each one decides what a gap costs.**
 *
 * WHY THIS IS SEPARATE FROM THE PROBE SUITE. That one proves what a credential
 * can do; this one proves what the deploy DOES about it, which is a different
 * claim and lives in a different file. The split matters because the policy is
 * per-credential and deliberately asymmetric — the same *insufficient* verdict
 * warns on one hook and refuses on another — so a single suite would have to
 * restate the asymmetry to test it, and would be free to restate it wrongly.
 *
 * WHAT MAKES THIS EVIDENCE. It runs the SHIPPED hooks, the same files
 * `bin/deploy` sources, under a constructed environment where `npx` and `node`
 * are stubs. A test that grepped the scripts for the word `probe` would pass on
 * a script that printed it and pushed anyway.
 *
 * THE CLAIMS:
 *
 *  1. A SUPPLIED VALUE IS PROBED, and the probe happens BEFORE the push — so a
 *     credential that cannot do the job is caught before anything is uploaded.
 *  2. THE SAME VERDICT COSTS DIFFERENT THINGS. A sending-only Resend key warns
 *     and still deploys; a zone token that cannot read zones refuses.
 *  3. A REFUSED KEY IS NOT AN ABSENT KEY. Resend absent still warns ([[REQ-259]]
 *     ruled that ordinary); Resend refused fails, because the Worker would pick
 *     the Resend sender and error on every message.
 *  4. A STORED VALUE IS RECORDED AS UNPROBED, never as a pass — it cannot be
 *     read back, so nothing about it was established.
 *  5. EVERY OUTCOME WRITES A ROW, because a report with a hole in it is a report
 *     whose holes are indistinguishable from passes.
 *  6. A REHEARSAL PROBES TOO. Every request is a read, so `--dry-run` reaches
 *     the same verdict by the same route.
 */

const REPO = path.resolve(import.meta.dirname, '..')

const resend = secretHookHarness('bin/deploy.d/secrets/20-resend-api-key', 'RESEND_API_KEY')
const dns = secretHookHarness(
  'bin/deploy.d/secrets/40-cloudflare-dns-token',
  'CLOUDFLARE_DNS_TOKEN',
)
const anthropic = secretHookHarness(
  'bin/deploy.d/secrets/10-anthropic-api-key',
  'ANTHROPIC_API_KEY',
)
const openai = secretHookHarness('bin/deploy.d/secrets/30-openai-api-key', 'OPENAI_API_KEY')

afterAll(() => {
  resend.dispose()
  dns.dispose()
  anthropic.dispose()
  openai.dispose()
})

/** Probe exit codes, as `probe.mjs` defines them. */
const CAPABLE = 0
const INSUFFICIENT = 2
const INVALID = 3
const UNPROVEN = 9

const VALUE = 'do-not-print-me'

describe('REQ-264 — a supplied credential is probed before it is pushed', () => {
  it('test_UAT_FC_REQ-264_a_supplied_value_is_probed_and_a_capable_one_still_pushes', () => {
    const run = resend.run({ value: VALUE, stored: [], probeExit: CAPABLE })
    expect(run.code).toBe(0)
    expect(run.pushed).toBe(VALUE)
    expect(run.probes).toContain('probe RESEND_API_KEY')
    // AND THE VALUE IS STILL NEVER ECHOED, on the path that now makes a network
    // call with it as much as on the ones that do not.
    expect(run.out).not.toContain(VALUE)
  })

  it('test_UAT_FC_REQ-264_a_sending_only_key_warns_loudly_and_still_deploys', () => {
    // THE KEY THIS TICKET EXISTS FOR. It sends, so refusing to store it would
    // break the one capability it has; the deployment degrades exactly as one
    // with no key at all does, which [[REQ-259]] already ruled ordinary.
    const run = resend.run({ value: VALUE, stored: [], probeExit: INSUFFICIENT })
    expect(run.code).toBe(0)
    expect(run.pushed).toBe(VALUE)
    // DEGRADING IS ALLOWED; DEGRADING SILENTLY IS NOT — and what it says names
    // the surface a customer sees, not the API that refused.
    expect(run.out).toMatch(/only for SENDING/)
    expect(run.out).toMatch(/Your domain/)
    expect(run.out).toMatch(/Full access/)
  })

  it('test_UAT_FC_REQ-264_a_resend_key_the_provider_refuses_stops_the_deploy', () => {
    // NOT THE SAME AS ABSENT, and the asymmetry is the claim. An absent key is a
    // deliberate state — the local adapter is chosen and warns. A refused key is
    // an operator error: the Resend sender is selected and every send errors.
    const refused = resend.run({ value: VALUE, stored: [], probeExit: INVALID })
    expect(refused.code).toBe(1)
    expect(refused.pushed).toBeNull()
    expect(refused.out).toMatch(/does not recognise it/)

    const absent = resend.run({ stored: [] })
    expect(absent.code).toBe(0)
    expect(absent.out).toMatch(/RESEND_API_KEY is not set/)
  })

  it('test_UAT_FC_REQ-264_a_zone_token_that_cannot_do_the_job_refuses_the_deploy', () => {
    // [[REQ-259]]'S ARGUMENT, ARRIVED AT FROM THE OTHER DIRECTION: `Your domain`
    // ships whatever this token can do, so a token that cannot read the zones
    // draws a selector it cannot spend — the same broken section an absent token
    // gives. So *insufficient* and *invalid* are both refusals here, where
    // *insufficient* is a warning on the sending credential.
    for (const verdict of [INSUFFICIENT, INVALID]) {
      const run = dns.run({ value: VALUE, stored: [], probeExit: verdict })
      expect(run.code, `probe verdict ${verdict} did not stop the deploy`).toBe(1)
      expect(run.pushed).toBeNull()
      expect(run.out).toMatch(/cannot do the job/)
      expect(run.out).toMatch(/Nothing has been uploaded/)
    }
  })

  it('test_UAT_FC_REQ-264_a_refused_model_key_stops_the_deploy_on_both_model_hooks', () => {
    const claude = anthropic.run({ value: VALUE, stored: [], probeExit: INVALID })
    expect(claude.code).toBe(1)
    expect(claude.pushed).toBeNull()
    expect(claude.out).toMatch(/does not accept it/)

    // THE IMAGE KEY IS THE INTERESTING ONE. Having NO key is an ordinary state
    // and still is — the tool drops out cleanly. Having a key OpenAI refuses is
    // not that state: the tool is offered and every call fails.
    const dead = openai.run({ value: VALUE, stored: [], probeExit: INVALID })
    expect(dead.code).toBe(1)
    expect(dead.pushed).toBeNull()
    expect(dead.out).toMatch(/does not accept it/)

    const none = openai.run({ stored: [] })
    expect(none.code).toBe(0)
    expect(none.out).toMatch(/no image generation/)
  })

  it('test_UAT_FC_REQ-264_a_probe_that_proved_nothing_never_stops_a_deploy', () => {
    // A LOST NETWORK IS NOT A BROKEN KEY. Refusing here would make every deploy
    // hostage to a provider's availability, and the presence guard — which is
    // unchanged — is still the gate.
    for (const hook of [resend, dns, anthropic, openai]) {
      const run = hook.run({ value: VALUE, stored: [], probeExit: UNPROVEN })
      expect(run.code).toBe(0)
      expect(run.pushed).toBe(VALUE)
      expect(run.out).toMatch(/could not be probed/)
    }
  })

  it('test_UAT_FC_REQ-264_a_stored_value_is_recorded_as_unprobed_rather_than_passed', () => {
    // `wrangler secret list` ANSWERS WITH NAMES. The value on the Worker cannot
    // be read back, so a deploy that leaves it alone establishes nothing — and
    // the row it writes has to say that rather than imply a pass.
    const run = resend.run({ stored: ['RESEND_API_KEY'] })
    expect(run.code).toBe(0)
    expect(run.pushed).toBeNull()
    expect(run.probes).toContain('record RESEND_API_KEY stored')
    expect(run.probes).not.toContain('probe RESEND_API_KEY')
    expect(run.out).toMatch(/not probed/)
  })

  it('test_UAT_FC_REQ-264_every_outcome_writes_a_row_into_the_report', () => {
    // A REPORT WITH A HOLE IN IT IS WORSE THAN NO REPORT, because a hole and a
    // pass look the same. Each hook writes a row whichever branch it takes.
    expect(resend.run({ stored: [] }).probes).toContain('record RESEND_API_KEY absent')
    expect(resend.run({ listFails: true }).probes).toContain('record RESEND_API_KEY unreadable')
    expect(dns.run({ stored: [] }).probes).toContain('record CLOUDFLARE_DNS_TOKEN absent')
    expect(openai.run({ stored: [] }).probes).toContain('record OPENAI_API_KEY absent')
    expect(anthropic.run({ listFails: true }).probes).toContain(
      'record ANTHROPIC_API_KEY unreadable',
    )
  })

  it('test_UAT_FC_REQ-264_a_rehearsal_probes_by_the_same_route_and_reports_the_same_verdict', () => {
    // EVERY REQUEST A PROBE MAKES IS A READ, so a rehearsal can run them without
    // breaking its own promise — and that is what makes `bin/deploy --dry-run` a
    // way to check the credentials before committing to a deploy.
    const ok = resend.run({ value: VALUE, stored: [], dryRun: true, probeExit: CAPABLE })
    expect(ok.code).toBe(0)
    expect(ok.pushed).toBeNull()
    expect(ok.probes).toContain('probe RESEND_API_KEY')
    expect(ok.out).toMatch(/would push RESEND_API_KEY/)

    const broken = dns.run({ value: VALUE, stored: [], dryRun: true, probeExit: INSUFFICIENT })
    expect(broken.code).toBe(1)
    expect(broken.pushed).toBeNull()
  })

  it('test_UAT_FC_REQ-264_no_hook_carries_its_own_copy_of_the_mechanism', () => {
    // FOUR IDENTICAL COPIES OF `probe_store` LIVED IN FOUR HOOKS, and REQ-264
    // was about to add a fifth block to each. The mechanism is shared now and
    // only the decision table — which is the per-credential CLAIM — stays in the
    // hook. A copy reappearing here is a copy free to drift in silence.
    const hooks = [
      '10-anthropic-api-key',
      '20-resend-api-key',
      '30-openai-api-key',
      '40-cloudflare-dns-token',
    ]
    for (const name of hooks) {
      const text = readFileSync(path.join(REPO, 'bin', 'deploy.d', 'secrets', name), 'utf8')
      expect(text, `${name} still defines its own store probe`).not.toMatch(/probe_store\(\)/)
      expect(text, `${name} does not source the shared mechanism`).toMatch(/secret\.sh/)
      expect(text, `${name} never probes what it pushes`).toMatch(/capability_probe/)
    }
  })

  it('test_UAT_FC_REQ-264_a_whole_rehearsal_prints_the_rows_its_hooks_wrote', () => {
    // THE REPORT END TO END, through the real driver. The assertions below are
    // about the driver's SOURCE, which cannot tell a report that prints from one
    // that is composed and dropped — so this runs `bin/deploy --dry-run` over a
    // tree holding the real scripts and one fixture hook, and reads what a
    // deploy actually puts on an operator's screen.
    const root = mkdtempSync(path.join(tmpdir(), 'req264-deploy-'))
    try {
      mkdirSync(path.join(root, 'bin', 'deploy.d', 'lib'), { recursive: true })
      mkdirSync(path.join(root, 'bin', 'deploy.d', 'migrate'), { recursive: true })
      mkdirSync(path.join(root, 'bin', 'deploy.d', 'secrets'), { recursive: true })
      copyFileSync(path.join(REPO, 'bin', 'deploy'), path.join(root, 'bin', 'deploy'))
      chmodSync(path.join(root, 'bin', 'deploy'), 0o755)
      for (const file of ['probe.mjs', 'secret.sh']) {
        copyFileSync(
          path.join(REPO, 'bin', 'deploy.d', 'lib', file),
          path.join(root, 'bin', 'deploy.d', 'lib', file),
        )
      }
      // A HOOK THAT RECORDS AND NOTHING ELSE. What is being proved is the
      // driver's half — that a row a hook wrote reaches the operator.
      const hook = path.join(root, 'bin', 'deploy.d', 'secrets', '20-fixture')
      writeFileSync(
        hook,
        '#!/usr/bin/env bash\nset -euo pipefail\n' +
          'source "$(cd "$(dirname "${BASH_SOURCE[0]}")/../lib" && pwd)/secret.sh"\n' +
          'capability_record RESEND_API_KEY absent\n',
      )
      chmodSync(hook, 0o755)

      mkdirSync(path.join(root, 'apps', 'control-app'), { recursive: true })
      writeFileSync(
        path.join(root, 'apps', 'control-app', 'wrangler.toml'),
        'name = "fixture"\n[env.production]\nname = "fixture-prod"\n',
      )
      // `npx wrangler deploy --dry-run` uploads nothing anyway; the stub keeps
      // the rehearsal off the network entirely.
      mkdirSync(path.join(root, 'stub'), { recursive: true })
      writeFileSync(path.join(root, 'stub', 'npx'), '#!/usr/bin/env bash\nexit 0\n')
      chmodSync(path.join(root, 'stub', 'npx'), 0o755)

      const run = spawnSync('bash', [path.join(root, 'bin', 'deploy'), '--dry-run'], {
        encoding: 'utf8',
        env: {
          PATH: `${path.join(root, 'stub')}:${process.env.PATH}`,
          HOME: root,
          TMPDIR: root,
        },
      })
      const out = `${run.stdout}${run.stderr}`
      expect(run.status, out).toBe(0)
      expect(out).toMatch(/==> Capabilities/)
      // THE ROW THE HOOK WROTE, WITH WHAT IS OFF IN THE SHIPPED PRODUCT NAMED.
      expect(out).toMatch(/RESEND_API_KEY — absent/)
      expect(out).toMatch(/local mail adapter/)
      // AND THE EXPIRY LINE IS PRESENT EVEN HERE, because a blank one reads as
      // checked and fine.
      expect(out).toMatch(/expiry   not read/)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('test_UAT_FC_REQ-264_the_deploy_prints_the_capability_report_at_the_end', () => {
    // ONE PLACE, AT THE MOMENT THE OPERATOR IS LOOKING. Four scattered hook
    // lines the operator scrolled past are not a report, which is why the
    // driver — which still knows no secret's name — prints the rows together.
    const driver = readFileSync(path.join(REPO, 'bin', 'deploy'), 'utf8')
    expect(driver).toMatch(/step "Capabilities"/)
    expect(driver).toMatch(/probe\.mjs" report/)
    expect(driver).toMatch(/DEPLOY_CAPABILITY_REPORT="\$capability_report"/)
    // AND THE DRIVER STILL NAMES NO CREDENTIAL. It creates the file and prints
    // what the hooks wrote; knowing a secret's name here is what the hook
    // directory exists to prevent.
    for (const name of ['RESEND_API_KEY', 'ANTHROPIC_API_KEY', 'CLOUDFLARE_DNS_TOKEN']) {
      expect(driver, `bin/deploy learned the name ${name}`).not.toContain(name)
    }
  })
})
