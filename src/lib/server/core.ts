import { convertToModelMessages, streamText, toUIMessageStream } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

// The host-agnostic core. It knows nothing about SvelteKit or Express — it just
// takes the chat messages and returns a UI-message stream. Both server adapters
// (sveltekit.ts, express.ts) are built on top of this so the Anthropic/streamText
// logic lives in exactly one place.
export function createChatStream(config: { apiKey: string }) {
	const anthropic = createAnthropic({ apiKey: config.apiKey })
	return async (messages: unknown) => {
		const result = streamText({
			model: anthropic('claude-sonnet-5'),
			messages: await convertToModelMessages(messages as Parameters<typeof convertToModelMessages>[0]),
		})
		return toUIMessageStream({ stream: result.stream })
	}
}
