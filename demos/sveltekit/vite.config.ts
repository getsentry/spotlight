import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit(), sentrySvelteKit({ autoUploadSourceMaps: false })],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
