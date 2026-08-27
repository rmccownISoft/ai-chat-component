import type { RequestHandler } from '@sveltejs/kit'
import { createUIMessageStreamResponse } from 'ai'
import { createChatStream } from './core.js'

// SvelteKit adapter. Reads the messages off the Web `Request` and returns a Web
// `Response`. This is the behavior the old server/index.ts had, now sitting on the
// shared core. Import this from a SvelteKit `+server.ts` route.
export function createStreamHandler(config: { apiKey: string }): RequestHandler {
	const toStream = createChatStream(config)
	return async event => {
		const { messages } = await event.request.json()
		return createUIMessageStreamResponse({ stream: await toStream(messages) })
	}
}
