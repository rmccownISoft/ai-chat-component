import { createStreamHandler } from '$lib/server/index.js'
import { ANTHROPIC_API_KEY } from '$env/static/private'

export const POST = createStreamHandler({ apiKey: ANTHROPIC_API_KEY })
