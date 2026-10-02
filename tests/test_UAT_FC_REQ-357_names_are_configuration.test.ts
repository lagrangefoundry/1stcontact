/**
 * [[REQ-357]] — the group chat's display names are configuration.
 *
 * `group-chat.json` is the ONE place a participant's display name is written.
 * Code, priming and surface text name roles (`consultant`, `assistant`), so a
 * rename is an edit to that file and nothing else. This reads the names out of
 * the config and refuses any other file the AI host or the builder's chat panes
 * are composed from that spells one of them.
 *
 * `platform-fonts.json` is the one exclusion and is not a hole: it is the font
 * catalogue, where a typeface may share a word with a name.
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import groupChat from '../tools/generate/src/cli/ai/group-chat.json'

const REPO = path.resolve(__dirname, '..')
const AI = path.join(REPO, 'tools/generate/src/cli/ai')
const BUILDER = path.join(REPO, 'apps/control-app/src/builder')

const NOT_SCANNED = new Set(['group-chat.json', 'platform-fonts.json'])

function scanned(): string[] {
  const ai = fs
    .readdirSync(AI)
    .filter((f) => /\.(ts|json)$/.test(f) && !NOT_SCANNED.has(f))
    .map((f) => path.join(AI, f))
  const builder = ['chat.js', 'debug.js', 'api.js', 'app.js', 'config.js'].map((f) =>
    path.join(BUILDER, f),
  )
  return [...ai, ...builder]
}

describe('REQ-357 — names are configuration', () => {
  it('test_UAT_FC_REQ-357_no_display_name_is_a_literal_in_source_priming_or_surface_json', () => {
    const names = groupChat.names as Record<string, string>
    const agents = [names.consultant, names.assistant]
    for (const name of agents) expect(name.trim()).not.toBe('')

    const files = scanned()
    // The scan reaches the files that matter, rather than passing on an empty list.
    for (const must of ['priming.json', 'host-core.ts', 'group-core.ts', 'roles.ts']) {
      expect(files.map((f) => path.basename(f))).toContain(must)
    }
    expect(files.some((f) => f.endsWith('-surface.json'))).toBe(true)

    const offenders: string[] = []
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8')
      for (const name of agents) {
        if (new RegExp(`\\b${name}\\b`).test(text)) {
          offenders.push(`${path.relative(REPO, file)}: ${name}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
