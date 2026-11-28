import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { defaults } from "./design";
import type { Settings } from "./design";
import type { Game } from "../../shared/engine";
import type { InboxItem } from "./notifications";
import type { AsyncDraft } from "./asyncDraft";
import type { PlayProgress } from "./playProgress";
export type Profile = {
  id: string;
  alias: string;
  age: string;
  settings: Settings;
  saved: Game | null;
  best: number;
  practiceBest: number;
  stars: number;
  badges: string[];
  token?: string;
  user?: any;
  recovery?: string;
  cloudRevision?: number;
  guardianPin?: string;
  social?: boolean;
  sharing?: boolean;
  inbox?: InboxItem[];
  asyncDrafts?: Record<string, AsyncDraft>;
  extras?: PlayProgress;
  history: { score: number; mode: string; at: number }[];
};
export type Local = { profiles: Profile[]; active: string; server: string };
const KEY = "block-league-v3";
export const storeBuild = process.env.EXPO_PUBLIC_STORE_BUILD === "1";
export const defaultServer =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "web" && !__DEV__ && typeof window !== "undefined"
    ? window.location.origin
    : __DEV__
      ? "http://localhost:8787"
      : "");
export function newProfile(alias: string, age: string): Profile {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    alias,
    age,
    settings: { ...defaults },
    saved: null,
    best: 0,
    practiceBest: 0,
    stars: 0,
    badges: [],
    history: [],
  };
}
export async function load(): Promise<Local> {
  const s = await AsyncStorage.getItem(KEY);
  return s
    ? { ...JSON.parse(s), ...(storeBuild && { server: defaultServer }) }
    : {
        profiles: [],
        active: "",
        server: defaultServer,
      };
}
let queue = Promise.resolve();
export function persist(state: Local) {
  const snapshot = JSON.stringify(state);
  queue = queue.catch(() => {}).then(() => AsyncStorage.setItem(KEY, snapshot));
  return queue;
}
