import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'
import { aiCore, nodeOperations } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import {
  librarySurfaceFor,
  libraryInstanceConfig,
  type CatalogueItem,
  type LibraryDeps,
} from '../tools/generate/src/cli/ai/library-core'
import { PRODUCT_ENTRY, primingText } from '../tools/generate/src/cli/ai/roles'
import { fsSiteStore } from '../tools/generate/src/store'

/**
 * [[BUG-118]] — **the assistant can no longer reach the belief "I cannot see the
 * picture I just made"**, proved at the two places it reads before it decides.
 *
 * THE FAULT WAS A BELIEF AND NOT A REFUSAL, which is why the evidence is about
 * prose. A consultant generated a picture, looked for it in the site's assets,
 * found nothing, and told its client it was blind. Every tool worked; nothing was
 * ungranted; no call failed. What was missing was any sentence, at any moment the
 * assistant was certainly reading, saying which of this deployment's two stores
 * the bytes had landed in — so *"I looked and it is not there"* was a sound
 * inference from everything it had been given.
 *
 * THE PROJECTION IS THE ARTEFACT UNDER TEST, not a constant holding a copy of it.
 * `roles.ts` renders priming's tool guide as `box.manual({ level: 'summary' })`,
 * so that is what is rendered here, from a real Toolbox over the real
 * declarations with the Library surface composed the way `host-core.ts` composes
 * it. A test that asserted on the JSON file directly would pass against a
 * projection that dropped the line.
 *
 * WHICH ALSO CORRECTS THE TICKET'S OWN DIAGNOSIS, and the correction is asserted
 * rather than argued. [[BUG-118]] reasons that the Library's overview — which
 * explains this exact trap in as many words — *"is not in the default
 * projection"*. It is: the framework's renderer keeps a surface's overview whole
 * at both levels and drops only the per-operation reference. So the gap was never
 * that the paragraph was withheld; it was that the paragraph sits above a list of
 * one-liners which did not carry the distinction themselves, and that nothing at
 * all said where a *new* picture had gone. Both halves are what changed.
 *
 * THE CATALOGUE IS A STUB AND IS NEVER READ. What is under test is the manual a
 * session is handed before it calls anything, and composing the surface is what
 * puts its entries in that manual. `LibraryDeps` is the seam the host fills —
 * D1 in the Worker, nothing at all under `1c` — so filling it with an empty
 * catalogue here is supplying the port, not faking the behaviour.
 */

const SLUG = 'studio'
let cwd: string

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'bug118-'))
  cmdNew(SLUG, { cwd })
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

/** A catalogue the surface can be built over. Nothing below calls it. */
function emptyCatalogue(): LibraryDeps {
  return {
    slug: SLUG,
    list: async (): Promise<CatalogueItem[]> => [],
    read: async (name: string) => {
      throw new Error(`nothing in this catalogue is called '${name}'`)
    },
    place: async () => {
      throw new Error('this catalogue places nothing')
    },
  }
}

/** The tool guide a consultant session is primed with, Library included. */
async function summaryManual(): Promise<string> {
  const opts = { cwd }
  const store = fsSiteStore(ctxOf(opts))
  const lib = await aiCore()
  const box = await createL1Toolbox(SLUG, opts, {
    session: `site-${SLUG}`,
    lib,
    store,
    extraOps: nodeOperations(SLUG, { ...opts, store } as never),
    extraSurfaces: [
      {
        surface: await librarySurfaceFor(lib, emptyCatalogue()),
        granted: libraryInstanceConfig(),
      },
    ] as never,
  })
  return box.manual({ level: 'summary' }) as string
}

/** Prose with its authored line breaks collapsed, so a sentence reads as one. */
function flowed(text: string): string {
  return text.replace(/\s+/g, ' ')
}

/** The one line the guide gives for one tool, from the rendered projection. */
function oneLineFor(manual: string, tool: string): string {
  const line = manual.split('\n').find((l) => l.startsWith(`- **${tool}** —`))
  expect(line, `the summary manual has no entry for '${tool}'`).toBeTruthy()
  return line as string
}

describe('BUG-118 — where a picture lives is said where the assistant is looking', () => {
  it('test_UAT_FC_BUG-118_the_two_listings_name_each_other_at_the_point_of_choice', async () => {
    const manual = await summaryManual()

    // THE POINT OF CHOICE IS THE ONE-LINER AND NOTHING ELSE. A consultant
    // scanning its tool guide for "where are the pictures" reads these two lines
    // and picks between them. Before this ticket they were
    // "See what the client has given you — their files and your generated
    // pictures" and "List the images and fonts this site can use — all of them",
    // which are only distinguishable by someone who already holds the
    // distinction — so each now carries it.
    const library = oneLineFor(manual, 'list_library')
    expect(library).toContain('list_assets')
    expect(library.toLowerCase()).toContain('whether it is on the site or not')

    const assets = oneLineFor(manual, 'list_assets')
    expect(assets.toLowerCase()).toContain('not everything the client has given you')
    expect(assets.toLowerCase()).toContain('once it has been placed on the site')
  })

  it('test_UAT_FC_BUG-118_the_librarys_overview_is_in_the_projection_the_session_reads', async () => {
    const manual = await summaryManual()

    // THE TICKET'S PREMISE, CHECKED RATHER THAN TAKEN. The overview travels whole
    // at summary level, so the paragraph that draws the distinction was in front
    // of the assistant the entire time. Pinning that here is what stops a future
    // reader from "fixing" the same bug by promoting the overview into a
    // projection it is already in.
    expect(manual).toContain('This is not the same list as `list_assets`')
    expect(manual).toContain('one catalogue with a mark on some of its entries')

    // And the reference half is still absent, which is what makes the one-liner
    // the load-bearing surface at the moment of choice.
    expect(manual).not.toContain('(string, required)')
  })

  it('test_UAT_FC_BUG-118_the_priming_says_to_ask_when_you_are_unsure_where_a_thing_lives', () => {
    // AUTHORED AS LINES AND READ AS A PARAGRAPH. `priming.json` holds prose as a
    // list of lines because JSON has no block scalar, so a sentence that spans a
    // line break is one sentence to the model and two to a regular expression.
    const product = flowed(primingText(PRODUCT_ENTRY))

    // THE RULE DID NOT FIRE, AND THAT WAS THE DEFECT. It told the assistant to
    // fetch a fuller entry when unsure what a tool TAKES or what COMES BACK.
    // This assistant was sure of both and wrong about WHERE — an unlisted
    // condition, so nothing told it to look further.
    expect(product).toContain('where the thing it acts on actually lives')
    expect(product).toMatch(/two tools whose one lines sound like the same list/i)
    expect(product).not.toMatch(/guessing at what a tool takes or what comes back/i)
  })

  it('test_UAT_FC_BUG-118_the_priming_forbids_reporting_yourself_unable_on_one_empty_answer', () => {
    const product = flowed(primingText(PRODUCT_ENTRY))

    // THE BELIEF ITSELF IS NOW FORBIDDEN, which is the only guard that holds when
    // a future surface grows a third store nobody has written a one-liner about
    // yet. One tool answering nothing is not evidence of incapacity.
    expect(product).toMatch(/never report yourself unable/i)
    expect(product).toMatch(/on the strength of one tool answering nothing/i)
  })
})
