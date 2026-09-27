/**
 * BUG-155 — a round authenticates as the operator, not as the launching shell.
 *
 * The console spawns `claude -p` and passed it no `env`, so the child inherited
 * the server's `process.env` verbatim — and the CLI prefers `ANTHROPIC_API_KEY`
 * over the subscription login it is signed in with. `bin/deploy` requires that
 * key to be exported, so a terminal used for a deploy and then for the console
 * is an ordinary sequence; when the exported value was stale, every attempt died
 * on a 401 after ten CLI retries, three minutes apiece.
 *
 * ASSERTED FROM A PURE FUNCTION, NOTHING SPAWNED — the point of the fix. The
 * guarantee the console most wants to be true of every round was a property of
 * the launching shell, which no test could reach; `claudeEnv` makes it one a
 * test can compute. That is why this file spends no token and starts no process.
 */
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  AI_ALLOWED_TOOLS,
  AI_COMMAND_ENV,
  AI_DISALLOWED_TOOLS,
  AI_MODEL_ENV,
  AI_PERMISSION_MODE,
  AI_SETTING_SOURCES,
  AI_STRIPPED_CREDENTIAL_ENV,
  claudeCommand,
  claudeEnv,
  spawnAiRunner,
} from '../tools/repro-console/src/ai'

/** A server environment of the shape the bug was observed in. */
const serverEnv = (): NodeJS.ProcessEnv => ({
  PATH: '/usr/local/bin:/usr/bin:/bin',
  HOME: '/Users/operator',
  // The stale export the operator's deploy alias left behind.
  ANTHROPIC_API_KEY: 'sk-ant-dead-key',
  ANTHROPIC_AUTH_TOKEN: 'bearer-also-dead',
  ANTHROPIC_BASE_URL: 'https://proxy.invalid',
  CLAUDE_CODE_USE_BEDROCK: '1',
  CLAUDE_CODE_USE_VERTEX: '1',
})

describe('BUG-155 — the round is given a stated environment, not an inherited one', () => {
  it('test_UAT_FC_BUG_155_credential_variables_are_removed_from_the_round', () => {
    // Behaviour 1. Every variable that would redirect the CLI away from the
    // operator's own login is gone from what the console hands `claude -p`.
    const given = claudeEnv(serverEnv())
    for (const name of AI_STRIPPED_CREDENTIAL_ENV) {
      expect(given, `${name} must not reach the round`).not.toHaveProperty(name)
    }
    // The five the ticket names, pinned here so a silent narrowing of the list
    // fails: each one on its own is enough to take a round off the subscription.
    expect([...AI_STRIPPED_CREDENTIAL_ENV].sort()).toEqual([
      'ANTHROPIC_API_KEY',
      'ANTHROPIC_AUTH_TOKEN',
      'ANTHROPIC_BASE_URL',
      'CLAUDE_CODE_USE_BEDROCK',
      'CLAUDE_CODE_USE_VERTEX',
    ])
    // AND THE SERVER'S OWN ENVIRONMENT IS NOT MUTATED. The console keeps running
    // after a round, and a later `claudeCommand` reads the same object.
    const server = serverEnv()
    claudeEnv(server)
    expect(server.ANTHROPIC_API_KEY).toBe('sk-ant-dead-key')
  })

  it('test_UAT_FC_BUG_155_operator_overrides_and_the_rest_of_the_environment_survive', () => {
    // Behaviour 2, and the reason this removes names rather than passing a
    // minimal environment: the round needs the machine it runs on.
    const given = claudeEnv({ ...serverEnv(), [AI_COMMAND_ENV]: 'my-claude', [AI_MODEL_ENV]: 'opus' })
    expect(given[AI_COMMAND_ENV]).toBe('my-claude')
    expect(given[AI_MODEL_ENV]).toBe('opus')
    // `node`, `git`, `xgd` and `1c` are found on PATH; the CLI's login under HOME.
    expect(given.PATH).toBe('/usr/local/bin:/usr/bin:/bin')
    expect(given.HOME).toBe('/Users/operator')

    // The overrides still SELECT the executable and the model — read from the
    // same environment, so stripping must not have reached them.
    const { command, args } = claudeCommand(given)
    expect(command).toBe('my-claude')
    expect(args).toContain('--model')
    expect(args[args.indexOf('--model') + 1]).toBe('opus')
  })

  it('test_UAT_FC_BUG_155_the_invocation_itself_is_unchanged', () => {
    /**
     * The last acceptance line: this ticket touches the environment and nothing
     * else. Asserted against the constants, never their values — what the policy
     * SAYS belongs to [[REQ-262]], and a UAT here that pinned `'manual'` or named
     * `Bash` would make this file a second place that ticket has to edit.
     */
    const env = serverEnv()
    const fresh = claudeCommand(env)
    const resumed = claudeCommand(env, { resume: 'session-aaaa' })
    expect(resumed.args).toEqual([...fresh.args, '--resume', 'session-aaaa'])
    expect(fresh.args).not.toContain('--resume')

    const policy = [
      '--permission-mode',
      AI_PERMISSION_MODE,
      '--setting-sources',
      AI_SETTING_SOURCES,
      '--allowedTools',
      ...AI_ALLOWED_TOOLS,
      '--disallowedTools',
      ...AI_DISALLOWED_TOOLS,
    ]
    for (const args of [fresh.args, resumed.args]) {
      const at = args.indexOf('--permission-mode')
      expect(at).toBeGreaterThan(-1)
      expect(args.slice(at, at + policy.length)).toEqual(policy)
    }
    // A credential variable in the environment changes no argument at all: the
    // fix is a subtraction from the environment, not an addition to the argv.
    expect(claudeCommand({ PATH: '/usr/bin' }).args).toEqual(fresh.args)
  })

  it('test_UAT_FC_BUG_155_the_spawned_round_is_given_the_sanitised_environment', async () => {
    /**
     * THE WIRING, NOT THE HELPER. The three assertions above hold of a pure
     * function that the spawn could simply not call — which is the whole of the
     * bug: `claudeCommand` was pure and asserted, and the environment beside it
     * was neither. So this one observes what a real child process actually
     * received.
     *
     * A STUB EXECUTABLE, NEVER A BILLED MODEL — reached through
     * {@link AI_COMMAND_ENV}, the operator override the console already has, the
     * same substitution this suite's siblings make for `claude`, `1c` and `git`.
     * It ignores the argv, records its own environment, and emits one `result`
     * event so the round ends the ordinary way.
     */
    const dir = mkdtempSync(path.join(tmpdir(), 'bug155-'))
    const seen = path.join(dir, 'child-env.json')
    const stub = path.join(dir, 'stub-claude')
    writeFileSync(
      stub,
      [
        '#!/bin/sh',
        'cat > /dev/null',
        `/usr/bin/env > ${JSON.stringify(seen)}`,
        // A round's final message, of the shape `parseOutcome` reads — so the
        // outcome below is a COMPLETE round, not a salvaged one.
        `echo '{"type":"result","result":"{\\"status\\":\\"no-gap\\"}"}'`,
        '',
      ].join('\n'),
    )
    chmodSync(stub, 0o755)

    const outcome = await spawnAiRunner({ ...serverEnv(), PATH: '/usr/bin:/bin', [AI_COMMAND_ENV]: stub })({
      cwd: dir,
      prompt: 'ignored by the stub',
      onLine: () => {},
    })
    // The round ran: the stub was found and its result was read back.
    expect(outcome.status).not.toBe('failed')

    const names = new Set(
      readFileSync(seen, 'utf8')
        .split('\n')
        .map((line) => line.split('=', 1)[0])
        .filter(Boolean),
    )
    for (const stripped of AI_STRIPPED_CREDENTIAL_ENV) {
      expect(names.has(stripped), `${stripped} reached the spawned round`).toBe(false)
    }
    // And the child still got the environment it needs to be a round at all.
    expect(names.has('PATH')).toBe(true)
    expect(names.has(AI_COMMAND_ENV)).toBe(true)
  })
})
