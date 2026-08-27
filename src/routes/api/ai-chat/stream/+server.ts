import { createStreamHandler } from '$lib/server/sveltekit.js'
import { ANTHROPIC_API_KEY } from '$env/static/private'

export const POST = createStreamHandler({ apiKey: ANTHROPIC_API_KEY })
