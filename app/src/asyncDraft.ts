import type { Game, Move } from "../../shared/engine";

export type AsyncDraft = {
  code: string;
  server: string;
  deadline: number;
  game: Game;
  queued: Move[];
  finish: boolean;
};

export function draftKey(server: string, code: string) {
  return JSON.stringify([server.replace(/\/$/, ""), code.toUpperCase()]);
}

export function awaitsSubmission(draft?: AsyncDraft): boolean {
  return !!draft && (draft.queued.length > 0 || draft.finish);
}
