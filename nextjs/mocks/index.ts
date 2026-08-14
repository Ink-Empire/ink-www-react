/**
 * MSW Initialization
 *
 * Conditionally starts MSW based on environment.
 * Only enabled when NEXT_PUBLIC_MSW_ENABLED=true
 */

export async function initMocks() {
  if (process.env.NEXT_PUBLIC_MSW_ENABLED !== 'true') {
    return;
  }

  if (typeof window === 'undefined') {
    // Server-side
    const { server } = await import('./server');
    server.listen({
      onUnhandledRequest: 'bypass', // Don't error on unhandled requests
    });
    console.log('[MSW] Server mocking enabled');
  } else {
    // Client-side
    const { worker } = await import('./browser');
    await worker.start({
      onUnhandledRequest: 'bypass',
      quiet: true, // Don't log every request
    });
    console.log('[MSW] Browser mocking enabled');
  }
}
