/**
 * REQ-262 D9 — the browser-backed verbs are runnable by an agent session.
 *
 * WHAT WENT WRONG BEFORE THIS. An agent session's commands run inside a macOS
 * seatbelt sandbox, and Chromium's browser process registers a Mach port
 * rendezvous server to hand ports to its children. Seatbelt denies the
 * registration, Chromium dies before the first frame, and `1c gate`, `1c diff`,
 * `1c values-diff`, `1c capture` and `1c shot` are all unavailable — every
 * command that would let an implementing agent SEE the defect it was asked to
 * fix. It was very nearly written off as a fact of life.
 *
 * It is not. `--single-process` removes the children, so there is nothing to
 * register, and the whole instrument works: `1c gate` was run under it and
 * reproduced the first live round's numbers exactly.
 *
 * WHAT IS TESTED HERE is the seam, not the sandbox. Whether a given host denies
 * a Mach registration is a property of that host and cannot be asserted from
 * inside a test run on it; what CAN be asserted is that the flag reaches the
 * browser, that an unconfigured host is unaffected, and that every launch site
 * in this package goes through the one seam rather than three.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { LAUNCH_ARGS_ENV, browserLaunchOptions } from '../tools/generate/src/cli/capture/launch-args'

const ENGINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'tools', 'generate', 'src')

describe('REQ-262 D9 a browser launches inside an agent sandbox', () => {
  it('test_UAT_FC_REQ_262_the_single_process_flag_reaches_the_browser', () => {
    // The measured fix. `--single-process` is what makes `1c gate` run at all
    // where a Mach registration is denied.
    expect(browserLaunchOptions({ [LAUNCH_ARGS_ENV]: '--single-process' })).toEqual({
      args: ['--single-process'],
    })
    // More than one, because a host that needs this one may need another.
    expect(browserLaunchOptions({ [LAUNCH_ARGS_ENV]: '--single-process, --disable-gpu' })).toEqual({
      args: ['--single-process', '--disable-gpu'],
    })
  })

  it('test_UAT_FC_REQ_262_an_unconfigured_host_launches_exactly_what_it_did_before', () => {
    // OPT-IN, and this is the assertion that keeps it honest. `--single-process`
    // is not a supported upstream configuration and is slower and less isolated;
    // an operator's console has no sandbox and no reason to pay for it. An empty
    // or absent value must be indistinguishable from the code before the seam
    // existed — `{}`, not `{ args: [] }`, which Playwright treats differently.
    expect(browserLaunchOptions({})).toEqual({})
    expect(browserLaunchOptions({ [LAUNCH_ARGS_ENV]: '' })).toEqual({})
    expect(browserLaunchOptions({ [LAUNCH_ARGS_ENV]: '   ' })).toEqual({})
    expect(browserLaunchOptions({ [LAUNCH_ARGS_ENV]: ' , , ' })).toEqual({})
  })

  it('test_UAT_FC_REQ_262_every_launch_site_goes_through_the_one_seam', () => {
    // Requirement 15 is about every browser-backed verb, not about the two a
    // test happened to exercise — so a fourth `launch()` added later without the
    // seam would leave one verb broken in an agent session and be found only by
    // someone running it. This is the cheap way to notice.
    const sources = ['cli/capture/playwright-driver.ts', 'cli/aligned-crops.ts'].map((file) =>
      readFileSync(path.join(ENGINE, file), 'utf8'),
    )
    for (const source of sources) {
      // Counted rather than captured: the argument is itself a call, so a lazy
      // "everything up to the first `)`" group reads `browserLaunchOptions(`
      // and fails against code that is perfectly correct. Ask the question that
      // is actually being asked — is every launch seamed? — and count.
      const launches = source.match(/\.launch\(/g) ?? []
      const seamed = source.match(/\.launch\(browserLaunchOptions\(\)\)/g) ?? []
      expect(launches.length).toBeGreaterThan(0)
      expect(seamed.length).toBe(launches.length)
    }
  })
})
