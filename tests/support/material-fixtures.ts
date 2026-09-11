/**
 * The bytes REQ-163's ingestion suites feed the pipeline.
 *
 * SHARED BECAUSE BOTH RUNTIMES NEED THEM. The node suite proves the describers
 * and the fetch guard; the workerd suite proves the routes and the store against
 * real D1 and R2. They must describe the SAME bytes, or "the pipeline stores what
 * the describer described" is two claims about two files.
 *
 * BUILT RATHER THAN CHECKED IN, for the PDF. A committed binary fixture is a
 * fixture nobody can read in a diff, and the interesting property here is that
 * the file genuinely contains a sentence — which a generator states in one line
 * and a checked-in blob hides. The font is checked in already
 * (`tests/fixtures/capture/heading-font.ttf`) because a real SFNT name table is
 * exactly the thing that cannot be usefully faked.
 */

/**
 * A minimal, real PDF carrying `text`, and a `/Title` in its info dictionary.
 *
 * REAL, NOT A STUB. pdf.js parses this: the xref table is computed from actual
 * byte offsets, the content stream declares its own length, and the page tree is
 * complete. A fixture that only LOOKED like a PDF would prove nothing about
 * `unpdf`, which is the dependency the ticket asks to be justified.
 */
export function minimalPdf(text: string, title = 'Brand guidelines'): Uint8Array {
  const content = `BT /F1 24 Tf 72 700 Td (${text}) Tj ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ' +
      '/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Title (${title}) >>`,
  ]
  let body = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((object, i) => {
    offsets.push(body.length)
    body += `${i + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = body.length
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets) body += `${String(offset).padStart(10, '0')} 00000 n \n`
  body +=
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>\n` +
    `startxref\n${xref}\n%%EOF\n`
  return new TextEncoder().encode(body)
}

/**
 * A PDF with a page and no text at all — the scanned case.
 *
 * A real scan is a page-sized image and this is an empty page, but what the
 * pipeline observes is identical: extraction runs, succeeds, and yields nothing.
 * That is the branch under test, and a 4MB photograph of a page would prove the
 * same thing more slowly.
 */
export function scannedPdf(): Uint8Array {
  return minimalPdf('', 'Scan')
}

/** Whatever the caller says, as bytes. */
export function bytesOf(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}


/**
 * A HEIC photograph's leading bytes — REQ-221.
 *
 * REAL WHERE IT MATTERS AND NOWHERE ELSE. What `isHeic` reads is the `ftyp` box:
 * four bytes of length, the four-character type, then the MAJOR BRAND. That
 * structure is reproduced exactly, because it is the whole of what detection
 * depends on. What follows it is filler, because nothing in this repository ever
 * decodes a HEIC — the Images binding does, at the door, and every suite here
 * substitutes a double for it. A real 3MB iPhone photograph checked in would
 * make the same claims more slowly and would still be decoded by nothing.
 *
 * THE BRAND IS A PARAMETER because the brand is the interesting axis. A real
 * iPhone photograph carries `heic` or the generic HEIF `mif1` depending on how
 * it was produced, and AVIF sits in the identical container under `avif` — so
 * the fixture has to be able to produce the file that must NOT be converted as
 * easily as the one that must.
 */
export function isoMediaBytes(brand: string, filler = 64): Uint8Array {
  // `0000` is a placeholder: the length field is a big-endian u32 rather than
  // ASCII, and is written over it below.
  const header = new TextEncoder().encode(`0000ftyp${brand}    mif1`)
  const total = header.length + filler
  const bytes = new Uint8Array(total)
  bytes.set(header, 0)
  bytes[0] = (header.length >>> 24) & 0xff
  bytes[1] = (header.length >>> 16) & 0xff
  bytes[2] = (header.length >>> 8) & 0xff
  bytes[3] = header.length & 0xff
  // Filler that is deliberately not zeroes, so a test asserting "these exact
  // bytes were stored" is asserting something.
  for (let i = header.length; i < total; i += 1) bytes[i] = (i * 7) % 256
  return bytes
}

/** The commonest form of the file REQ-221 is about. */
export function heicBytes(filler = 64): Uint8Array {
  return isoMediaBytes('heic', filler)
}

/** A PNG's signature, and enough after it to be a distinguishable byte string. */
export function pngBytes(): Uint8Array {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  const bytes = new Uint8Array(signature.length + 32)
  bytes.set(signature, 0)
  for (let i = signature.length; i < bytes.length; i += 1) bytes[i] = (i * 11) % 256
  return bytes
}
