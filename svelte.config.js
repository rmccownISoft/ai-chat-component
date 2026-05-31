import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	compilerOptions: {
		experimental: {
			async: true,
		},
		sourcemap: true,
	},
	vitePlugin: {
		inspector: true,
	},
	kit: { adapter: adapter() }
};

export default config;
