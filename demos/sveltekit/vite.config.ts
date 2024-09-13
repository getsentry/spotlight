import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import spotlight from '@spotlightjs/spotlight/vite-plugin';

export default defineConfig({
	plugins: [
		sveltekit(),
		sentrySvelteKit({ autoUploadSourceMaps: false }),
		spotlight({ integrationNames: ['sentry', 'console'], debug: true })
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
