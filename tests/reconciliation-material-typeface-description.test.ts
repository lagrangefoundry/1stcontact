import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe as suite, expect, it } from 'vitest'
import { describe as describeMaterial } from '../apps/control-app/src/describe'

/**
 * STORY-724e4e8c — **a typeface is read from the names its own file carries**.
 *
 * WHY THIS ONE CRITERION IS HERE AND NOT IN THE WORKERS SUITE. Its whole claim
 * is that the family, the style and the designer's own sentence are LIFTED FROM
 * THE FILE rather than guessed — which is only provable against a real font, and
 * the real font is a checked-in `.ttf` that has to be read off a filesystem.
 * workerd has none, so this file runs in the node project by the repository's
 * own routing convention (`vitest.config.mts`: anything without the `.workers`
 * marker). Its nine siblings, which need real D1 and R2, are in
 * `reconciliation-material-description.workers.test.ts`.
 *
 * NOTHING IS FAKED. `heading-font.ttf` is a genuine SFNT whose `name` table
 * really does carry `codicon` and `The icon font for Visual Studio Code`, and
 * the parser under test walks its table directory byte by byte. A synthesised
 * font would only prove that the parser accepts what this file wrote for it.
 */

const FONT = readFileSync(path.join(__dirname, 'fixtures', 'capture', 'heading-font.ttf'))

suite('a typeface is described from its own embedded names', () => {
  it('test_UAT_AC1553_typeface_is_read_from_its_own_name_table', async () => {
    // A DESCRIBER IS SUPPLIED, and counted. "No model is consulted for a typeface
    // that carries its own names" is only sayable if something was there to be
    // consulted — a run with no describer would prove nothing about restraint.
    const looks: string[] = []
    const description = await describeMaterial(
      {
        bytes: new Uint8Array(FONT),
        kind: 'font',
        contentType: 'font/ttf',
        filename: 'heading-font.ttf',
      },
      {
        describeImage: async (_bytes, contentType) => {
          looks.push(contentType)
          return { text: 'a model guessed at some bytes', model: 'stub/vision-1' }
        },
      },
    )

    // THE FAMILY, from the file's own name records.
    expect(description.body).toContain('codicon')
    // THE DESIGNER'S OWN SENTENCE ABOUT WHAT THE FACE IS FOR, verbatim — the
    // thing a model could only have invented.
    expect(description.body).toContain('The icon font for Visual Studio Code')
    // The style the file declares, alongside the family.
    expect(description.body).toContain('codicon Regular')

    // A REAL DESCRIPTION, and a producer naming the EMBEDDED-NAMES route rather
    // than a model — which is what a later re-describe pass reads to know this
    // record needs nothing from it.
    expect(description.status).toBe('ok')
    expect(description.describer).toBe('sfnt-name-table')

    // THE TITLE IS THE FAMILY. `codicon` declares the plain style, so the style
    // is not appended — a Library row reading "codicon Regular" would be noise.
    expect(description.title).toBe('codicon')

    // VARIABLE ONLY WHERE THE FILE SAYS SO. This face declares no `fvar` table,
    // so it is described as a typeface and not as a variable one — the note is
    // read off the file rather than asserted of every font.
    expect(description.body).toContain('a typeface.')
    expect(description.body).not.toContain('variable typeface')

    // AND NOTHING WAS ASKED OF THE MODEL. Guessing a family from the bytes would
    // cost a call to produce something worse than what the file already says.
    expect(looks).toEqual([])
  })
})
