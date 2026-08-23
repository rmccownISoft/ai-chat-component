//import { env } from '$env/dynamic/private'
import { ANTHROPIC_API_KEY } from '$env/static/private'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = () => {
	return json({
		hasKey: !!ANTHROPIC_API_KEY,
	})
}
