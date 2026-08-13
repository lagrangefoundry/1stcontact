import { createModalShell, modalButton, modalFooter } from './modal.js'

/**
 * The palette popup (REQ-133 / DOC-28 §8) — **a component, not a screen**.
 *
 * One surface, two entry points:
 *
 * - **manage** — the toolbar's Colors action. Nobody is waiting for a value; the
 *   operator is here to change the palette.
 * - **pick** — a color field that needs one. The popup resolves to a palette
 *   reference and closes.
 *
 * Picking and editing live together deliberately: "this color is nearly right"
 * is then a one-gesture fix rather than a hunt for a different screen. The only
 * difference between the modes is whether anything is waiting for the answer.
 *
 * WHAT IT RETURNS, AND WHAT IT NEVER RETURNS. A pick resolves to a **palette
 * reference** — `{ ref }` or `{ ref, shade }` — never a hex. The caller writes it
 * into whatever axis it owns; this component never touches a page, which is the
 * boundary with the segment editor. `alpha` is not offered: it is an independent
 * axis and belongs to a different conversation.
 *
 * FREE HEX LIVES HERE AND ONLY HERE (DOC-28 §8). From a segment a user can only
 * pick from the palette; inventing a color is a *palette* edit, and that is what
 * bounds the incoherence risk. So this surface has a hex field and no segment
 * field does.
 *
 * WHERE THE RULES ARE. Not here. Delete's reference check and rename's collision
 * check are enforced by the origin against the definition on disk, because this
 * is a second *producer* of edits and not the authority on them — a tab left open
 * while the site changed underneath it must not be able to talk the store into an
 * orphaned reference. This module shows the reason a refusal came back; it does
 * not pre-empt one.
 */

/** The slider's resolution. Continuous — 2000 steps is below the eye's threshold on any real swatch. */
const SHADE_STEP = 0.001

/**
 * Open the popup.
 *
 * @param {object} spec
 * @param {Element} [spec.host] - inside the shell root; see `modal.js`
 * @param {string} spec.slug
 * @param {'manage'|'pick'} [spec.mode]
 * @param {{ref: string, shade?: number}|null} [spec.value] - what the caller currently holds
 * @param {{get: Function, write: Function}} spec.transport
 * @param {(hex: string, shade: number) => string} spec.shadeHex
 *   The renderer's own arithmetic, injected. It arrives from
 *   `/framework/site-schema-shade.js` — the SAME code that resolves a reference
 *   when the page is painted — so the swatch under the slider is the color the
 *   page will show rather than a second opinion about it.
 * @param {() => void} [spec.onChanged] - a write landed; the frame is now stale
 * @returns {Promise<{ref: string, shade?: number}|null>}
 *   The chosen reference, or `null` — which is what cancelling and the whole of
 *   manage mode resolve to.
 */
export function openPalettePopup(spec) {
  const { slug, mode = 'manage', value = null, transport, shadeHex, onChanged = () => {} } = spec

  return new Promise((resolve) => {
    let entries = []
    let selected = value?.ref ?? null
    let shade = value?.shade ?? 0
    /** Resolved once, on close, so every route out answers exactly once. */
    let answer = null

    const { panel, close, mount } = createModalShell({
      host: spec.host,
      title: mode === 'pick' ? 'Choose a color' : 'Colors',
      onClose: () => resolve(answer),
    })

    const heading = document.createElement('h2')
    heading.className = 'builder-modal__title'
    heading.textContent = mode === 'pick' ? 'Choose a color' : 'Colors'

    const list = document.createElement('div')
    list.className = 'builder-palette__list'
    // `radiogroup`, so the browser supplies arrow-key navigation, the
    // single-selection invariant and the announcement — the same reasoning as
    // the image picker's grid, and the same reason not to claim `listbox`.
    list.setAttribute('role', 'radiogroup')
    list.setAttribute('aria-label', 'Palette colors')

    const detail = document.createElement('div')
    detail.className = 'builder-palette__detail'

    const error = document.createElement('p')
    error.className = 'builder-modal__error'
    error.hidden = true

    const status = document.createElement('p')
    status.className = 'builder-palette__status'
    status.hidden = true

    panel.append(heading, list, detail, addForm(), status, error)

    const cancel = modalButton(mode === 'pick' ? 'Cancel' : 'Close', 'builder-modal__btn', close)
    const use = modalButton('Use this color', 'builder-modal__btn builder-modal__btn--primary', () => {
      if (!selected) return
      // The shade is omitted at zero rather than sent as `0`. They resolve
      // identically, but an absent shade is the reference a literal converts to
      // byte-for-byte, and writing `shade: 0` everywhere would put a rounding
      // path in front of colors that never needed one.
      answer = shade === 0 ? { ref: selected } : { ref: selected, shade }
      close()
    })
    panel.append(modalFooter(mode === 'pick' ? [cancel, use] : [cancel]))
    // The skeleton is complete, so mount it — the palette itself arrives below
    // and paints into a dialog the operator can already see. Waiting for the
    // load would leave the click that opened this doing nothing visible for as
    // long as the origin takes.
    mount()

    // ── rendering ────────────────────────────────────────────────────────────

    function say(message, kind = 'error') {
      const target = kind === 'error' ? error : status
      const other = kind === 'error' ? status : error
      target.textContent = message
      target.hidden = !message
      other.hidden = true
    }

    function entryOf(name) {
      return entries.find((e) => e.name === name) ?? null
    }

    /** The color a pick would actually produce: the entry, at the slider. */
    function previewHex() {
      const entry = entryOf(selected)
      if (!entry) return null
      return shade === 0 ? entry.value : shadeHex(entry.value, shade)
    }

    function renderList() {
      list.replaceChildren()
      if (!entries.length) {
        // AN EMPTY PALETTE IS A LEGITIMATE STATE, not a broken one — two of the
        // four stored sites have no palette at all, because their colors are
        // still literals. So it reads as an invitation rather than an error.
        const empty = document.createElement('p')
        empty.className = 'builder-palette__empty'
        empty.textContent = `${slug} has no colors yet. Add one below.`
        list.append(empty)
        return
      }
      for (const entry of entries) list.append(swatch(entry))
    }

    function swatch(entry) {
      const label = document.createElement('label')
      label.className = `builder-palette__swatch${entry.name === selected ? ' is-selected' : ''}`
      label.dataset.name = entry.name

      const input = document.createElement('input')
      input.type = 'radio'
      input.className = 'builder-palette__swatch-input'
      input.name = `palette-${slug}`
      input.value = entry.name
      input.checked = entry.name === selected
      input.addEventListener('change', () => {
        if (!input.checked) return
        selected = entry.name
        // The shade resets when the SELECTION moves, and not otherwise: a shade
        // is a position within one entry's family, so carrying it across to a
        // different entry would silently darken a color the operator picked by
        // its swatch.
        shade = entry.name === value?.ref ? (value?.shade ?? 0) : 0
        renderList()
        renderDetail()
      })

      const chip = document.createElement('span')
      chip.className = 'builder-palette__chip'
      chip.style.background = entry.value

      const name = document.createElement('span')
      name.className = 'builder-palette__name'
      name.textContent = entry.name

      // THE COUNT IS THE MOST USEFUL FACT ON THIS SURFACE. "primary, used 45
      // times" is what makes an edit predictable, and it is the number both the
      // delete rule and the rename confirmation are stated in.
      const count = document.createElement('span')
      count.className = 'builder-palette__count'
      count.textContent = `used ${entry.count}×`

      label.append(input, chip, name, count)
      return label
    }

    function renderDetail() {
      detail.replaceChildren()
      const entry = entryOf(selected)
      if (!entry) return

      const hex = previewHex()

      const preview = document.createElement('div')
      preview.className = 'builder-palette__preview'
      preview.style.background = hex
      const readout = document.createElement('span')
      readout.className = 'builder-palette__readout'
      readout.textContent = hex
      preview.append(readout)

      // The shade slider. In PICK mode it is part of the answer; in manage mode
      // it is a preview of the entry's light↔dark family — which is worth having
      // there, because an operator choosing a hex is choosing the whole family
      // and this is the only place to see what its ends look like. It writes
      // nothing either way: a shade lives on the *use*, never on the entry.
      const slider = document.createElement('input')
      slider.type = 'range'
      slider.className = 'builder-palette__shade'
      slider.min = '-1'
      slider.max = '1'
      slider.step = String(SHADE_STEP)
      slider.value = String(shade)
      slider.setAttribute('aria-label', `Shade of ${entry.name}`)
      slider.addEventListener('input', () => {
        shade = Number(slider.value)
        const next = previewHex()
        // The preview is updated in place rather than by re-rendering the
        // detail: a drag fires this per frame, and rebuilding the subtree would
        // take the slider's focus (and the drag) with it.
        preview.style.background = next
        readout.textContent = next
        shadeLabel.textContent = shadeText()
      })

      const shadeText = () =>
        shade === 0 ? 'the color itself' : shade < 0 ? `${Math.round(-shade * 100)}% darker` : `${Math.round(shade * 100)}% lighter`
      const shadeLabel = document.createElement('span')
      shadeLabel.className = 'builder-palette__shade-label'
      shadeLabel.textContent = shadeText()

      const row = document.createElement('div')
      row.className = 'builder-palette__shade-row'
      row.append(slider, shadeLabel)

      detail.append(preview, row, editRow(entry), renameRow(entry), deleteRow(entry))
    }

    /** Free hex on the entry — the one write that repaints every use at every shade. */
    function editRow(entry) {
      const row = document.createElement('div')
      row.className = 'builder-palette__row'

      const field = document.createElement('input')
      field.type = 'color'
      field.className = 'builder-palette__hex'
      field.value = entry.value
      field.setAttribute('aria-label', `Color for ${entry.name}`)

      const text = document.createElement('input')
      text.type = 'text'
      text.className = 'builder-palette__hex-text'
      text.value = entry.value
      text.setAttribute('aria-label', `Hex for ${entry.name}`)
      // The two controls are one value. The native picker cannot express every
      // hex form the schema accepts and the text field cannot be dragged, so
      // each mirrors the other and either may be the one submitted.
      field.addEventListener('input', () => {
        text.value = field.value
      })
      text.addEventListener('input', () => {
        if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(text.value)) field.value = text.value
      })

      const apply = modalButton('Change color', 'builder-modal__btn', () =>
        run('set', { name: entry.name, value: text.value }),
      )
      row.append(field, text, apply)
      return row
    }

    /** Rename — the count travels with it, from the same census the swatch shows. */
    function renameRow(entry) {
      const row = document.createElement('div')
      row.className = 'builder-palette__row'

      const field = document.createElement('input')
      field.type = 'text'
      field.className = 'builder-palette__rename'
      field.value = entry.name
      field.setAttribute('aria-label', `Rename ${entry.name}`)

      const apply = modalButton('Rename', 'builder-modal__btn', () => {
        const to = field.value.trim()
        if (to === entry.name) return
        run('rename', { name: entry.name, to }, to)
      })

      const note = document.createElement('span')
      note.className = 'builder-palette__note'
      note.textContent = `renames ${entry.count} use${entry.count === 1 ? '' : 's'}`

      row.append(field, apply, note)
      return row
    }

    /**
     * Delete — offered only when nothing references it.
     *
     * The button is disabled on a referenced entry AND the origin refuses one
     * anyway; the disable is an explanation, not the guard. Hiding the control
     * entirely would leave "why can't I delete this" unanswered, which is the
     * question the count exists to answer.
     */
    function deleteRow(entry) {
      const row = document.createElement('div')
      row.className = 'builder-palette__row'
      const btn = modalButton('Delete', 'builder-modal__btn', () => run('rm', { name: entry.name }, null))
      btn.disabled = entry.count > 0
      const note = document.createElement('span')
      note.className = 'builder-palette__note'
      note.textContent =
        entry.count > 0
          ? `used ${entry.count}× — ask the assistant to repoint those uses first`
          : 'unused, safe to delete'
      row.append(btn, note)
      return row
    }

    /** Add an entry. Always present, and the whole of the surface on an empty palette. */
    function addForm() {
      const row = document.createElement('div')
      row.className = 'builder-palette__row builder-palette__add'

      const name = document.createElement('input')
      name.type = 'text'
      name.className = 'builder-palette__new-name'
      name.placeholder = 'name'
      name.setAttribute('aria-label', 'New color name')

      const hex = document.createElement('input')
      hex.type = 'color'
      hex.className = 'builder-palette__hex'
      hex.value = '#000000'
      hex.setAttribute('aria-label', 'New color')

      const add = modalButton('Add color', 'builder-modal__btn', () =>
        run('add', { name: name.value.trim(), value: hex.value }, name.value.trim()),
      )
      row.append(name, hex, add)
      return row
    }

    // ── the write loop ───────────────────────────────────────────────────────

    /**
     * Post one operation, redraw from what came back, and say what happened.
     *
     * `select` is what the selection should be AFTER the write: the new name for
     * a rename or an add, `null` for a delete, and the current one otherwise. It
     * is passed rather than inferred because only the caller knows which — and
     * the alternative (leave the selection alone) points the detail panel at an
     * entry that no longer exists.
     */
    async function run(op, body, select = selected) {
      say('')
      try {
        const result = await transport.write({ slug, op, ...body })
        entries = result.entries ?? []
        selected = select && entryOf(select) ? select : null
        if (!selected) shade = 0
        renderList()
        renderDetail()
        // The origin has already written; `draft` and `edit` render at request
        // time (REQ-119), so there is nothing to re-render and everything to
        // reload. The caller is told, and decides.
        onChanged(result)
        say(humanFor(op, body, result), 'status')
      } catch (err) {
        // The refusal's own words, never a paraphrase: the origin's message says
        // WHICH rule refused and its hint says what to do instead, and both are
        // the only useful thing this surface can show.
        say([err.message, err.hint].filter(Boolean).join(' — '))
      }
    }

    function humanFor(op, body, result) {
      const n = result?.count
      if (op === 'set') return `Changed ${body.name} — ${n} use${n === 1 ? '' : 's'} repainted.`
      if (op === 'add') return `Added ${body.name}.`
      if (op === 'rm') return `Deleted ${body.name}.`
      return `Renamed ${body.name} → ${body.to} — ${n} reference${n === 1 ? '' : 's'} rewritten.`
    }

    // ── first paint ──────────────────────────────────────────────────────────

    void (async () => {
      try {
        const loaded = await transport.get(slug)
        entries = loaded.entries ?? []
        // A caller can open the picker holding a reference to an entry that has
        // since been deleted. Selecting nothing is the honest answer — the
        // alternative is a detail panel describing a color the site no longer
        // has.
        if (selected && !entryOf(selected)) selected = null
      } catch (err) {
        say(err.message)
      }
      renderList()
      renderDetail()
    })()
  })
}
