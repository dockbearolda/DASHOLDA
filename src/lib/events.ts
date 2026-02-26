/**
 * Global in-memory event emitters for real-time notifications via SSE.
 *
 * Uses a global singleton to survive hot-reloads in development.
 * Works correctly on a single-instance deployment (Railway).
 */
import { EventEmitter } from "events";

declare global {
  // eslint-disable-next-line no-var
  var __orderEvents: EventEmitter | undefined;
  // eslint-disable-next-line no-var
  var __noteEvents: EventEmitter | undefined;
}

const orderEmitter = globalThis.__orderEvents ?? new EventEmitter();
orderEmitter.setMaxListeners(200); // support many concurrent SSE clients
globalThis.__orderEvents = orderEmitter;

const noteEmitter = globalThis.__noteEvents ?? new EventEmitter();
noteEmitter.setMaxListeners(200); // support many concurrent SSE clients
globalThis.__noteEvents = noteEmitter;

export const orderEvents = orderEmitter;
export const noteEvents = noteEmitter;
