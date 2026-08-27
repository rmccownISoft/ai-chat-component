import type { ServerResponse } from 'node:http'
import { pipeUIMessageStreamToResponse } from 'ai'
import { createChatStream } from './core.js'

// Express adapter. Reads `req.body` (already parsed by the host's express.json()
// middleware) and pipes the stream straight into the Node response. `req` is typed
// loosely and `res` as Node's ServerResponse so this package never has to depend on
// `express`. Mount the returned handler on any Express POST route.
export function createExpressHandler(config: { apiKey: string }) {
	const toStream = createChatStream(config)
	return async (req: { body: { messages: unknown } }, res: ServerResponse) => {
		await pipeUIMessageStreamToResponse({ response: res, stream: await toStream(req.body.messages) })
	}
}
