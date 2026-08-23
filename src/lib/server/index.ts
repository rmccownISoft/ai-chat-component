import { convertToModelMessages, createUIMessageStreamResponse, streamText, toUIMessageStream } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import type { RequestHandler } from '@sveltejs/kit'

export const createStreamHandler = (config: { apiKey: string }): RequestHandler => {
	// build the provider from config.apiKey  → createAnthropic(...)
	const anthropic = createAnthropic({ apiKey: config.apiKey })
	return async event => {
		// call streamText with the model + a hardcoded prompt
		const result = streamText({
			model: anthropic('claude-sonnet-5'),
			//messages: await convertToModelMessages(messages),
			prompt: 'Say hello',
		})
		// return result.toUIMessageStreamResponse()
		return createUIMessageStreamResponse({
			stream: toUIMessageStream({ stream: result.stream }),
		})
	} // ← this inner function is your RequestHandler
}
