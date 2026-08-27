import { convertToModelMessages, createUIMessageStreamResponse, streamText, toUIMessageStream } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import type { RequestHandler } from '@sveltejs/kit'

export const createStreamHandler = (config: { apiKey: string }): RequestHandler => {
	// Setup the provider from config.apiKey  → createAnthropic(...)
	const anthropic = createAnthropic({ apiKey: config.apiKey })
	return async event => {
		const { messages } = await event.request.json()
		// call streamText with the model + a hardcoded prompt
		const result = streamText({
			model: anthropic('claude-sonnet-5'),
			messages: await convertToModelMessages(messages),
		})
		return createUIMessageStreamResponse({
			stream: toUIMessageStream({ stream: result.stream }),
		})
	} // ← this inner function is your RequestHandler
}
