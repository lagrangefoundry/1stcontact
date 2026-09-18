import type { InboundMessage } from '../../apps/control-app/src/inbound'

/**
 * One message on the wire, as the Email Worker would be handed it
 * ([[REQ-267]]).
 *
 * A FIXTURE AND NOT A MOCK OF THE PIPELINE. What it stands in for is the
 * PLATFORM — an SMTP delivery — and nothing else: the whole of `receiveMail`
 * runs for real, against a real D1 and a real R2 inside workerd, and every
 * assertion is on what it wrote. The alternative is a suite that can only be run
 * by sending actual mail, which is a suite nobody runs.
 *
 * IT RECORDS WHAT WAS DONE TO IT, because two of this ticket's claims are about
 * exactly that: a message is forwarded even when capture throws, and a message
 * in the reserved namespace is never forwarded at all. Neither is visible in the
 * database — the evidence is the call.
 *
 * AND IT RECORDS WHETHER THE BODY WAS READ, which is the only way to assert the
 * size bound means anything. A pipeline that read the stream and then discarded
 * it would leave a ticket indistinguishable from one that refused before
 * reading, while having spent exactly the memory the bound exists to protect.
 */
export interface FakeInbound extends InboundMessage {
  /** Every address this message was forwarded to, in order. */
  forwards: string[]
  /** The reason it was rejected with, when it was. */
  rejected: string | null
  /** Whether anything pulled on `raw`. */
  bodyRead: boolean
}

export function inboundMessage(spec: {
  from: string
  to: string
  raw: string
  /** The headers the delivering edge stamped — where the alignment verdict is. */
  headers?: Record<string, string>
  /** Claim a size other than the body's, to reach the bound without the bytes. */
  rawSize?: number
  /** Make the forward fail, which is half of the independence claim. */
  forwardThrows?: boolean
}): FakeInbound {
  const bytes = new TextEncoder().encode(spec.raw)
  const message: FakeInbound = {
    from: spec.from,
    to: spec.to,
    headers: new Headers(spec.headers ?? {}),
    rawSize: spec.rawSize ?? bytes.length,
    forwards: [],
    rejected: null,
    bodyRead: false,
    get raw(): ReadableStream<Uint8Array> {
      message.bodyRead = true
      return new Response(bytes).body as ReadableStream<Uint8Array>
    },
    setReject(reason: string): void {
      message.rejected = reason
    },
    async forward(rcptTo: string): Promise<void> {
      if (spec.forwardThrows) throw new Error('destination not verified')
      message.forwards.push(rcptTo)
    },
  }
  return message
}

/**
 * A message, composed as a mailer would compose it.
 *
 * CRLF THROUGHOUT, because that is what SMTP carries and the parser has to cope
 * with it — a fixture that used bare newlines would prove the parser works on
 * input it will never see.
 */
export function rawMessage(spec: {
  from: string
  to: string
  subject: string
  body: string
  headers?: Record<string, string>
  /** A `multipart/mixed` with one attached file, when given. */
  attachment?: { filename: string; type: string; content: string }
}): string {
  const headers: string[] = [
    `From: ${spec.from}`,
    `To: ${spec.to}`,
    `Subject: ${spec.subject}`,
    `Date: ${new Date('2026-09-17T09:00:00Z').toUTCString()}`,
    `Message-ID: <${Math.abs(hash(spec.subject))}@example.test>`,
    ...Object.entries(spec.headers ?? {}).map(([name, value]) => `${name}: ${value}`),
  ]
  if (!spec.attachment) {
    headers.push('Content-Type: text/plain; charset=utf-8')
    return `${headers.join('\r\n')}\r\n\r\n${spec.body}`
  }
  const boundary = 'b0undary'
  headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`)
  const parts = [
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    spec.body,
    `--${boundary}`,
    `Content-Type: ${spec.attachment.type}; name="${spec.attachment.filename}"`,
    `Content-Disposition: attachment; filename="${spec.attachment.filename}"`,
    'Content-Transfer-Encoding: base64',
    '',
    btoa(spec.attachment.content),
    `--${boundary}--`,
  ]
  return `${headers.join('\r\n')}\r\n\r\n${parts.join('\r\n')}`
}

/** A stable `Message-ID` per subject, so a suite can name one without a clock. */
function hash(text: string): number {
  let value = 0
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) | 0
  return value
}
