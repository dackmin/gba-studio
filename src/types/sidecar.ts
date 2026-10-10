/**
 * Line-delimited JSON protocol between the Tauri (Rust) shell and the Node sidecar.
 * One message per line on stdin/stdout; lines that are not valid JSON are ignored
 * by the shell, so stray child-process output cannot break the channel.
 *
 * `window` is the label of the window that issued the request; events and host
 * calls are routed back to it.
 */

/** Rust -> sidecar */
export type ShellMessage =
  | { type: 'invoke'; id: number; window: string; channel: string; args: unknown[] }
  | { type: 'host-result'; id: number; result?: unknown }
  | { type: 'host-error'; id: number; error: string };

/** Sidecar -> Rust */
export type SidecarMessage =
  | { type: 'ready' }
  | { type: 'result'; id: number; result?: unknown }
  | { type: 'error'; id: number; error: string }
  // Push event for the renderer (HostContext.send)
  | { type: 'event'; window: string; channel: string; payload?: unknown }
  // Reverse call into the shell (HostContext dialogs/shell/window), e.g. `dialogs.saveFile`
  | { type: 'host-call'; id: number; window: string; method: string; args: unknown[] };
