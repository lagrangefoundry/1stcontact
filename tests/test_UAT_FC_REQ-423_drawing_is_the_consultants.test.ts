import { describe, expect, it } from 'vitest'
import { L1_DECLARATION, L1_INSTANCES, readOnlyGrant } from '../tools/generate/src/cli/ai/toolbox-core'
import { LIBRARY_DECLARATION, libraryInstanceConfig } from '../tools/generate/src/cli/ai/library-core'
import { primingText } from '../tools/generate/src/cli/ai/roles'
import talker from '../tools/generate/src/cli/ai/talker.json'
import priming from '../tools/generate/src/cli/ai/priming.json'

/**
 * [[REQ-423]] — **drawing stays with the consultant**: what the role documents
 * say, read as they ship.
 *
 * The runtime half — what a delegated builder is actually offered, and a drawing
 * landing in the Library and on the site — is the `.workers` file beside this
 * one. This half is the declarations and the prose a session is primed with.
 */

type Group = { group: string; effect: string; operations: string[] }

describe('REQ-423 — no builder grant can draw', () => {
  it('test_UAT_FC_REQ-423_the_site_surface_composes_no_image_from_markup', () => {
    // `write_image` is gone, with its group: there is no site operation left
    // that writes an image from markup, so no grant of the site surface can.
    const ops = (L1_DECLARATION.operations as { op: string }[]).map((o) => o.op)
    expect(ops).not.toContain('write_image')
    const groups = (L1_DECLARATION.groups as Group[]).map((g) => g.group)
    expect(groups).not.toContain('DrawImages')
    for (const role of ['builder', 'consultant', 'coordinator']) {
      const granted = (L1_INSTANCES[role] as { l1: { groups: string[] } }).l1.groups
      expect(granted, role).not.toContain('DrawImages')
    }
  })

  it('test_UAT_FC_REQ-423_drawing_is_a_library_write_the_builders_read_only_grant_withholds', () => {
    const drawing = (LIBRARY_DECLARATION.groups as Group[]).find((g) =>
      g.operations.includes('draw_image'),
    )!
    expect(drawing.effect).toBe('write')
    // The consultant's travelling grant holds it...
    const consultant = libraryInstanceConfig() as { library: { groups: string[] } }
    expect(consultant.library.groups).toContain(drawing.group)
    // ...and the builder's — derived read-only from the same grant ([[REQ-387]]) —
    // does not, nor any other write.
    const builder = readOnlyGrant(libraryInstanceConfig(), [LIBRARY_DECLARATION]) as {
      library: { groups: string[] }
    }
    expect(builder.library.groups).not.toContain(drawing.group)
    expect(builder.library.groups).toEqual(['ReadLibrary'])
  })

  it('test_UAT_FC_REQ-423_the_talker_withholds_drawing', () => {
    // It changes assets the build uses ([[REQ-416]]): withheld, never allowed.
    expect(talker.withhold).toContain('draw_image')
    expect(talker.allow).not.toContain('draw_image')
    expect([...talker.withhold, ...talker.allow]).not.toContain('write_image')
  })
})

describe('REQ-423 — the method is in the priming', () => {
  it('test_UAT_FC_REQ-423_the_consultant_is_primed_wordmark_first_generate_illustration_look_before_use', () => {
    const conduct = primingText('conduct')
    expect(conduct).toContain('## A logo')
    // Wordmark first, in the page's own type.
    expect(conduct).toMatch(/Start with a wordmark/)
    expect(conduct).toMatch(/crisp\s+and editable/)
    // An illustrated mark is generated and iterated with the client, not plotted.
    expect(conduct).toMatch(/illustrated mark comes from generating a picture/)
    expect(conduct).toMatch(/never from paths plotted by hand/)
    // Hand drawing is for simple geometry only.
    expect(conduct).toMatch(/only simple geometric marks, icons and dividers/)
    // Look before using: alone, then at its real size in the header.
    expect(conduct).toMatch(/`screenshot` the item alone/)
    expect(conduct).toMatch(/at its real size/)
  })

  it('test_UAT_FC_REQ-423_commissioning_keeps_drawing_with_the_consultant', () => {
    const commissioning = (priming as { templates: Record<string, string> }).templates[
      'delegation-method-commissioning'
    ]
    expect(commissioning).toContain('draw_image')
    expect(commissioning).not.toMatch(/you do not draw the\s+pictures/)
  })

  it('test_UAT_FC_REQ-423_a_builder_asked_to_draw_refuses_and_points_back_to_the_consultant', () => {
    const builder = primingText('builder-role')
    expect(builder).toMatch(/You do not draw pictures/)
    expect(builder).toMatch(/If a brief asks you to draw or compose one, do not/)
    expect(builder).toMatch(/drawing is the consultant's/)
    // ...and how it uses one it is given.
    expect(builder).toMatch(/\/assets\//)
  })

  it('test_UAT_FC_REQ-423_the_drawing_operation_carries_the_method_and_the_envelope', () => {
    const op = (LIBRARY_DECLARATION.operations as { op: string; description: string }[]).find(
      (o) => o.op === 'draw_image',
    )!
    expect(op.description).toMatch(/starts as a WORDMARK/)
    expect(op.description).toMatch(/Look before you use it/)
    expect(op.description).toMatch(/no script, no event handler, no stylesheet/i)
  })
})
