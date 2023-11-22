import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  console.log('Hello from the server!');
  throw new Error('Random error');

  return new Response(
    JSON.stringify({
      greeting: 'Hello',
    }),
  );
};
