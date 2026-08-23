import { fileURLToPath } from 'node:url'
import { includeIgnoreFile } from '@eslint/compat'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import ts from 'typescript-eslint'
import svelteConfig from './svelte.config.js'

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url))

import isoftSvelteConfig from '@isoftdata/eslint-config-svelte'

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	...isoftSvelteConfig,
	{
		files: ['**/*.js', '**/*.cjs', '**/*.mjs', '**/*.jsx'],
		languageOptions: {
			parserOptions: {
				projectService: false,
			},
		},
		extends: [ts.configs.disableTypeChecked],
	},
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
		},
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',
		},
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig,
			},
		},
	},
	{
		rules: {
			'@typescript-eslint/prefer-promise-reject-errors': 'off',
			// Force script tags to use TypeScript
			'svelte/block-lang': [
				'error',
				{
					enforceScriptPresent: true,
					enforceStylePresent: false,
					script: ['ts'],
				},
			],
			'svelte/no-add-event-listener': 'error',
			'svelte/no-ignored-unsubscribe': 'error',
			'svelte/no-inspect': 'off',
		},
	},
)
