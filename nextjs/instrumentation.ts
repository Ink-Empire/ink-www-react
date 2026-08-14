/**
 * Next.js Instrumentation
 *
 * This file is loaded once when the Next.js server starts.
 * Used to initialize MSW for server-side request mocking in tests.
 */

export async function register() {
  if (process.env.NEXT_PUBLIC_MSW_ENABLED === 'true') {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      const { server } = await import('./mocks/server');
      server.listen({
        onUnhandledRequest: 'bypass',
      });
      console.log('[MSW] Server-side mocking enabled');
    }
  }
}
