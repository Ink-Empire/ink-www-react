import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * MSW Browser Worker
 *
 * This intercepts client-side requests in the browser.
 * Used during testing when the app makes fetch requests from the client.
 */
export const worker = setupWorker(...handlers);
