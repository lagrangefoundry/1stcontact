export default {
  async fetch(): Promise<Response> {
    return new Response('Hello from app.1stcontact.io', {
      status: 200,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  },
} satisfies ExportedHandler
