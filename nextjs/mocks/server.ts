import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW Server for Node.js
 *
 * This intercepts server-side requests (SSR, API routes, etc.)
 * Used during testing when Next.js makes requests from the server.
 */
export const server = setupServer(...handlers);
