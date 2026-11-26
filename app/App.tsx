import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Animated,
  Pressable,
  Modal,
  ActivityIndicator,
  AccessibilityInfo,
  AppState,
  Platform,
  Share,
  Linking,
  useWindowDimensions,
  StatusBar,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque/800ExtraBold";
import { InstrumentSans_400Regular } from "@expo-google-fonts/instrument-sans/400Regular";
import { InstrumentSans_600SemiBold } from "@expo-google-fonts/instrument-sans/600SemiBold";
import { AtkinsonHyperlegible_400Regular } from "@expo-google-fonts/atkinson-hyperlegible/400Regular";
import { NotoSansDevanagari_400Regular } from "@expo-google-fonts/noto-sans-devanagari/400Regular";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Board } from "./src/Board";
import { Design, Txt, Button, Card, Input, Row, Toggle, Tag } from "./src/ui";
import {
  brand,
  defaults,
  themes,
  strings,
  palettes,
  radius,
  space,
  fonts,
} from "./src/design";
import type { Settings } from "./src/design";
import { BrandMark } from "./src/brand";
import { PlayHome } from "./src/PlayHome";
import { ResultMark, ScoreBeat } from "./src/GameFeedback";
import { useScreenArrival } from "./src/motion";
import { load, persist, newProfile } from "./src/storage";
import type { Local, Profile } from "./src/storage";
import { request } from "./src/api";
import { exportCard } from "./src/share";
import { ShareCard } from "./src/ShareCard";
import {
  createGame,
  place,
  finish,
  hint,
  fits,
  replay,
  badgeIds,
} from "../shared/engine";
import type { Game, Move } from "../shared/engine";
import { BADGES, REACTIONS, adEligible } from "../shared/competition";
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const randomSeed = () => Math.floor(Math.random() * 0xffffffff);
const earnedStars = (game: Game) =>
  game.moves.length >= 3 ? Math.max(1, Math.floor(game.lines / 2)) : 0;
const ageGroups = [
  "7-12",
  "13-17",
  "18-24",
  "25-44",
  "45-65",
  "65+",
  "unknown",
];
type Mode = "solo" | "practice" | "learn" | "family" | "challenge" | "online";
export default function App() {
  return (
    <SafeAreaProvider>
      <GameApp />
    </SafeAreaProvider>
  );
}
function GameApp() {
  const shareRef = useRef<React.ElementRef<typeof View>>(null);
  const [sharePreview, setSharePreview] = useState(false);
  const onlineToken = useRef<{ profile: string; token: string } | null>(null),
    acceptedRoom = useRef<any>(null);
  const syncRevision = useRef<Record<string, number>>({});
  const [fontsLoaded, fontError] = useFonts({
    [fonts.body]: InstrumentSans_400Regular,
    [fonts.strong]: InstrumentSans_600SemiBold,
    [fonts.display]: BricolageGrotesque_800ExtraBold,
    Atkinson: AtkinsonHyperlegible_400Regular,
    Devanagari: NotoSansDevanagari_400Regular,
  });
  const [local, setLocal] = useState<Local>({
      profiles: [],
      active: "",
      server: process.env.EXPO_PUBLIC_API_URL || "http://localhost:8787",
    }),
    [loaded, setLoaded] = useState(false);
  const profile = local.profiles.find((p) => p.id === local.active);
  const settings = profile?.settings || defaults,
    t = themes[settings.theme],
    s = strings[settings.language];
  const [screen, setScreen] = useState("home"),
    [mode, setMode] = useState<Mode>("solo"),
    [game, setGame] = useState<Game>(createGame(1)),
    [selected, setSelected] = useState(-1),
    [anchor, setAnchor] = useState<[number, number] | null>(null),
    [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false),
    busyRef = useRef(false),
    [notice, setNotice] = useState(""),
    [savedError, setSavedError] = useState(false),
    [dialog, setDialog] = useState<{
      title: string;
      body: string;
      action?: () => void;
      label?: string;
    } | null>(null);
  const [form, setForm] = useState<Record<string, string>>({
    alias: "",
    age: "unknown",
    code: "",
    name: "",
    pin: "",
    recovery: "",
    window: "24",
  });
  const [room, setRoom] = useState<any>(null),
    [roomCode, setRoomCode] = useState(""),
    [connected, setConnected] = useState(true),
    [rooms, setRooms] = useState<any[]>([]),
    [teams, setTeams] = useState<any[]>([]),
    [leagues, setLeagues] = useState<any[]>([]),
    [team, setTeam] = useState<any>(null),
    [league, setLeague] = useState<any>(null);
  const [replayStep, setReplayStep] = useState(0),
    [familyFirst, setFamilyFirst] = useState<Game | null>(null),
    [handoff, setHandoff] = useState(false),
    [familySecond, setFamilySecond] = useState(false),
    [offer, setOffer] = useState<any>(null),
    [newSoloBest, setNewSoloBest] = useState(false);
  const [seconds, setSeconds] = useState(0),
    [systemReduce, setSystemReduce] = useState(true),
    reminded = useRef(0),
    [undo, setUndo] = useState<Game | null>(null),
    [resultMode, setResultMode] = useState(""),
    [sessionBadges, setSessionBadges] = useState<string[]>([]);
  const { width } = useWindowDimensions();
  const effective = {
    ...settings,
    motion: settings.motion && !systemReduce && !settings.lowEffects,
  };
  const screenArrival = useScreenArrival(screen, effective.motion);
  function updateProfile(patch: Partial<Profile>) {
    setLocal((l) => ({
      ...l,
      profiles: l.profiles.map((p) =>
        p.id === l.active ? { ...p, ...patch } : p,
      ),
    }));
  }
  function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    updateProfile({ settings: { ...settings, [key]: value } });
  }
  function field(key: string, label: string, props: any = {}) {
    return (
      <Input
        label={label}
        value={form[key] || ""}
        onChangeText={(v: string) => setForm((f) => ({ ...f, [key]: v }))}
        {...props}
      />
    );
  }
  function info(title: string, body: string) {
    setDialog({ title, body });
  }
  function go(next: string) {
    setScreen(next);
    setNotice("");
  }
  async function run(fn: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : "Something went wrong. Try again.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    load()
      .then((l) => {
        setLocal(l);
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(true);
        setNotice(
          "Saved profiles could not be read. Start a new local profile.",
        );
      });
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setSystemReduce)
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setSystemReduce,
    );
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (loaded)
      persist(local)
        .then(() => setSavedError(false))
        .catch(() => setSavedError(true));
  }, [local, loaded]);
  const cloudPayload = profile
    ? JSON.stringify({
        best: profile.best,
        practiceBest: profile.practiceBest,
        stars: profile.stars,
        settings: profile.settings,
        saved: profile.saved,
        history: profile.history,
        badges: profile.badges,
      })
    : "";
  useEffect(() => {
    if (!profile?.token) return;
    let active = true;
    const p = profile;
    const timer = setTimeout(() => {
      request(local.server, p.token!, "progress.sync", {
        revision: syncRevision.current[p.id] ?? p.cloudRevision ?? 0,
        progress: JSON.parse(cloudPayload),
      })
        .then((r) => {
          syncRevision.current[p.id] = r.revision;
          if (active) updateProfile({ cloudRevision: r.revision });
        })
        .catch((e) => {
          if (active && !String(e.message).includes("fetch"))
            setNotice("Cloud save: " + e.message);
        });
    }, 1200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [profile?.id, profile?.token, cloudPayload, local.server]);

  useEffect(() => {
    const id = setInterval(() => {
      if (AppState.currentState === "active" || Platform.OS === "web")
        setSeconds((v) => v + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (
      settings.reminder &&
      !settings.quiet &&
      Math.floor(seconds / (settings.reminder * 60)) > reminded.current
    ) {
      reminded.current = Math.floor(seconds / (settings.reminder * 60));
      info(
        "A little pause?",
        `You have played for ${Math.floor(seconds / 60)} minutes this session. Your progress is safe. Take a break whenever you like.`,
      );
    }
  }, [seconds, settings.reminder, settings.quiet]);
  useEffect(() => {
    if (!loaded) return;
    function open(url: string) {
      const m = url.match(/[?&]challenge=(\d+)/);
      if (m) {
        setGame(createGame(Number(m[1]), 30));
        setMode("challenge");
        setSelected(-1);
        setAnchor(null);
        setScreen("game");
      }
    }
    Linking.getInitialURL().then((u) => u && open(u));
    const sub = Linking.addEventListener("url", ({ url }) => open(url));
    return () => sub.remove();
  }, [loaded]);
  async function api(
    action: string,
    data: unknown = {},
    token = profile?.token || "",
  ) {
    return request(local.server, token, action, data);
  }
  async function ensureOnline() {
    if (profile?.token) return profile.token;
    if (profile && onlineToken.current?.profile === profile.id)
      return onlineToken.current.token;
    if (!profile) throw Error("Create a profile first");
    const res = await api("register", {
      alias: profile.alias,
      age: profile.age,
    });
    onlineToken.current = { profile: profile.id, token: res.token };
    updateProfile({ token: res.token, user: res.user, recovery: res.recovery });
    return res.token;
  }
  async function refreshClub() {
    const token = await ensureOnline();
    const [ts, ls] = await Promise.all([
      api("teams", {}, token),
      api("leagues", {}, token),
    ]);
    setTeams(ts);
    setLeagues(ls);
    setTeam((current: any) =>
      current ? ts.find((x: any) => x.id === current.id) || null : null,
    );
    setLeague((current: any) =>
      current ? ls.find((x: any) => x.id === current.id) || null : null,
    );
  }
  function receiveRoom(r: any) {
    const prev = acceptedRoom.current;
    if (
      prev?.code === r.code &&
      (prev.game.moves.length > r.game.moves.length ||
        (prev.status === "final" && r.status !== "final"))
    )
      return;
    acceptedRoom.current = r;
    setRoom(r);
    setGame(r.game);
    setConnected(true);
  }
  async function enterRoom(code: string) {
    const r = await api("room.get", { code });
    setRoomCode(r.code);
    receiveRoom(r);
    setMode("online");
    setSelected(-1);
    setAnchor(null);
    go("game");
  }
  useEffect(() => {
    if (!roomCode || !profile?.token || mode !== "online" || screen !== "game")
      return;
    let alive = true,
      inFlight = false;
    const token = profile.token;
    const poll = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const r = await request(local.server, token, "room.get", {
          code: roomCode,
        });
        if (alive) receiveRoom(r);
      } catch {
        if (alive) setConnected(false);
      } finally {
        inFlight = false;
      }
    };
    poll();
    const id = setInterval(poll, 1500);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [roomCode, profile?.token, mode, screen, local.server]);
  useEffect(() => {
    if (mode === "online" && room?.status === "final" && screen === "game") {
      setResultMode("Verified Face-Off");
      setSessionBadges(badgeIds(room.game, true));
      api("me")
        .then((user) => updateProfile({ user }))
        .catch(() => {});
    }
  }, [room?.status]);
  function start(m: Mode, resume = false) {
    setMode(m);
    setRoomCode("");
    setRoom(null);
    setGame(
      resume && profile?.saved
        ? profile.saved
        : createGame(
            randomSeed(),
            m === "learn" ? 3 : ["family", "challenge"].includes(m) ? 30 : 1e9,
            m === "learn" || m === "practice",
          ),
    );
    setSelected(-1);
    setAnchor(null);
    setUndo(null);
    setFamilyFirst(null);
    setFamilySecond(false);
    setSessionBadges([]);
    setResultMode("");
    setNewSoloBest(false);
    go("game");
  }
  function completeLocal(g: Game) {
    const label =
      mode === "practice"
        ? "Assisted practice"
        : mode === "learn"
          ? "Learning"
          : mode === "challenge"
            ? "Unranked seed challenge"
            : mode === "family"
              ? "Local family duel"
              : "Unassisted Solo";
    setResultMode(label);
    setNewSoloBest(mode === "solo" && g.score > (profile?.best ?? 0));
    const earned = badgeIds(g);
    setSessionBadges(earned.filter((id) => !profile?.badges.includes(id)));
    if (profile) {
      const competitiveLocal = mode === "solo";
      updateProfile({
        saved: competitiveLocal ? null : profile.saved,
        best: competitiveLocal ? Math.max(profile.best, g.score) : profile.best,
        practiceBest:
          mode === "practice"
            ? Math.max(profile.practiceBest, g.score)
            : profile.practiceBest,
        stars: profile.stars + earnedStars(g),
        badges: [
          ...new Set([
            ...profile.badges,
            ...earned.filter((x) => x !== "clean-duel"),
          ]),
        ],
        history: [
          ...profile.history,
          { score: g.score, mode: label, at: Date.now() },
        ].slice(-40),
      });
    }
    if (mode === "family" && !familySecond) {
      setFamilyFirst(g);
      setHandoff(true);
    } else go("result");
  }
  function commit() {
    if (!anchor || selected < 0) return;
    run(async () => {
      const m: Move = {
        slot: selected,
        row: anchor[0],
        col: anchor[1],
        seq: game.moves.length,
        id: uid(),
      };
      if (mode === "online") {
        const r = await api("room.move", { code: roomCode, move: m });
        receiveRoom(r);
      } else {
        const next = place(game, m);
        setUndo(game);
        setGame(next);
        if (mode === "solo") updateProfile({ saved: next });
        if (next.done) completeLocal(next);
      }
      setSelected(-1);
      setAnchor(null);
      if (settings.haptics && !systemReduce && Platform.OS !== "web")
        Haptics.selectionAsync().catch(() => {});
    });
  }
  function end() {
    setDialog({
      title: mode === "online" ? "Finish your attempt?" : "Finish this round?",
      body:
        mode === "online"
          ? "Your confirmed score will stand. Your friend can finish their remaining placements."
          : "Your earned progress stays saved. You can start a fresh round whenever you like.",
      label: "Finish round",
      action: () => {
        run(async () => {
          if (mode === "online")
            receiveRoom(await api("room.finish", { code: roomCode }));
          else {
            const g = finish(game);
            setGame(g);
            completeLocal(g);
          }
        });
      },
    });
  }
  async function shareResult(card = false) {
    if (profile?.age === "7-12" && !profile.user?.sharing)
      throw Error("A guardian must approve external sharing in Profile.");
    if (profile?.age === "unknown")
      throw Error("Choose a known-age profile before external sharing.");
    if (mode === "online" && room?.status !== "final")
      throw Error("Wait for the official result");
    const label =
      mode === "online"
        ? "Server-validated Face-Off"
        : resultMode || "Unranked practice";
    if (card) setSharePreview(true);
    else {
      const origin =
        Platform.OS === "web" ? window.location.origin : "blockleague://";
      await Share.share({
        message: `Block League · ${label} · ${game.score} points. Try the same pieces in unranked practice: ${origin}/?challenge=${game.seed}`,
      });
    }
  }
  function newLocalProfile() {
    if (form.alias.trim().length < 2) {
      setNotice("Choose an alias of at least two characters.");
      return;
    }
    const p = newProfile(form.alias.trim().slice(0, 24), form.age);
    setLocal((l) => ({ ...l, profiles: [...l.profiles, p], active: p.id }));
    setForm((f) => ({ ...f, alias: "" }));
    go("home");
  }
  const pageTitle: Record<string, string> = {
    home: "Block League",
    game:
      mode === "online"
        ? "Face-Off"
        : mode === "practice"
          ? "Beginner practice"
          : mode === "learn"
            ? "Learn to play"
            : mode === "family"
              ? "Family duel"
              : mode === "challenge"
                ? "Seed challenge"
                : "Solo puzzle",
    club: "The clubhouse",
    profile: "Your corner",
    settings: s.settings,
    rooms: "Play with friends",
    team: team?.name || "Team",
    league: league?.name || "League",
    result: "Results",
    replay: "The replay room",
    reward: "Cosmetic studio",
    help: s.learn,
    newprofile: "New local profile",
  };
  if (!loaded || (!fontsLoaded && !fontError))
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: t.bg,
        }}
      >
        <ActivityIndicator color={t.brand} size="large" />
        <Txt>Opening your club…</Txt>
      </SafeAreaView>
    );
  const gutter = width < 450 ? space.lg : space.xl;
  const boardWidth = Math.min(width - 2 * gutter, 424);
  const official = mode === "online",
    gameDisabled =
      busy ||
      game.done ||
      (official && (!connected || room?.status !== "playing"));
  const canPlace =
    anchor && selected >= 0 && fits(game, selected, anchor[0], anchor[1]);
  const starsEarned = earnedStars(game);
  const lineSummary = `${game.lines} ${game.lines === 1 ? "line" : "lines"}`;
  function roomResult() {
    if (!room?.result) return "Waiting for your friend";
    if (room.result.winner === null) return "An even match";
    return room.result.winner === profile?.user?.id
      ? "You won this one!"
      : "Well played. A new lesson.";
  }
  function matchResult() {
    return (
      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <Tag>Official result · final</Tag>
          <ResultMark enabled={effective.motion} />
        </Row>
        <Txt size={28} display>
          {roomResult()}
        </Txt>
        <Txt muted>
          Final scores {room.result?.scores.join(" : ")}. Free rematches, equal
          rules.
        </Txt>
        <Button
          title="Review both attempts"
          onPress={() => {
            setReplayStep(0);
            go("replay");
          }}
        />
        <Button
          secondary
          title="Free rematch"
          onPress={() =>
            run(async () => {
              const r = await api("room.rematch", { code: roomCode });
              setRoomCode(r.code);
              receiveRoom(r);
            })
          }
        />
        <Row>
          <Button
            secondary
            title="Share result"
            onPress={() => run(() => shareResult())}
          />
          <Button
            secondary
            title="Save card"
            onPress={() => run(() => shareResult(true))}
          />
        </Row>
      </Card>
    );
  }
  function roomActions() {
    return (
      <>
        <Row>
          {REACTIONS.map((text) => (
            <Button
              key={text}
              secondary
              title={text}
              onPress={() =>
                run(async () =>
                  receiveRoom(
                    await api("room.react", { code: roomCode, text }),
                  ),
                )
              }
            />
          ))}
        </Row>
        {room?.reactions?.slice(-1).map((r: any) => (
          <Txt key={r.at} muted size={13}>
            {r.by}: {r.text}
          </Txt>
        ))}
      </>
    );
  }
  const back = () => {
    if (screen === "game" && official && room?.status === "playing") {
      setDialog({
        title: "Leave the match screen?",
        body: "Your opponent and the match clock keep running. Return within 60 seconds in a live match; asynchronous matches use the displayed deadline.",
        label: "Go home",
        action: () => go("home"),
      });
    } else go("home");
  };
  return (
    <Design.Provider value={effective}>
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <StatusBar
          barStyle={
            settings.theme === "dark" ? "light-content" : "dark-content"
          }
        />
        <View
          style={{
            flex: 1,
            width: "100%",
            maxWidth: 1040,
            alignSelf: "center",
          }}
        >
          <Row
            style={{
              paddingHorizontal: gutter,
              paddingVertical: space.sm,
              justifyContent: "space-between",
              borderBottomWidth: 1,
              borderColor: t.border,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Home"
              onPress={back}
              style={{
                minHeight: 48,
                justifyContent: "center",
                flex: 1,
                minWidth: 0,
              }}
            >
              <Row style={{ width: "100%", flexWrap: "nowrap", gap: space.md }}>
                <BrandMark />
                <Txt
                  display
                  size={22}
                  style={{ flex: 1, minWidth: 0, letterSpacing: -0.45 }}
                >
                  {screen === "home" || !profile
                    ? "Block League"
                    : pageTitle[screen] || "Block League"}
                </Txt>
              </Row>
            </Pressable>
            {profile && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Profile and settings"
                onPress={() => go("profile")}
                style={{
                  minWidth: 48,
                  minHeight: 48,
                  borderRadius: 14,
                  backgroundColor: t.soft,
                  borderWidth: 1,
                  borderColor: t.border,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Txt bold>{profile.alias.slice(0, 2).toUpperCase()}</Txt>
              </Pressable>
            )}
          </Row>
          <Animated.ScrollView
            key={screen}
            testID="screen-content"
            style={screenArrival}
            scrollEnabled={!dragging}
            contentContainerStyle={{
              paddingHorizontal: gutter,
              paddingTop: screen === "game" ? space.md : space.xl,
              paddingBottom: 40,
              gap: space.lg,
              width: "100%",
              maxWidth:
                screen === "replay"
                  ? 960
                  : ["home", "club", "profile", "settings", "league"].includes(
                        screen,
                      )
                    ? 800
                    : 560,
              alignSelf: "center",
            }}
            keyboardShouldPersistTaps="handled"
          >
            {notice !== "" && (
              <Pressable
                accessibilityRole="alert"
                onPress={() => setNotice("")}
                style={{
                  backgroundColor: t.notice,
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <Txt>{notice}</Txt>
                <Txt size={12} muted>
                  Tap to dismiss
                </Txt>
              </Pressable>
            )}
            {savedError && (
              <Card>
                <Txt>Could not save on this device. Keep this page open.</Txt>
                <Button
                  title="Retry saving"
                  onPress={() =>
                    run(async () => {
                      await persist(local);
                      setSavedError(false);
                    })
                  }
                />
              </Card>
            )}
            {busy && (
              <ActivityIndicator accessibilityLabel="Working" color={t.brand} />
            )}
            {!profile || screen === "newprofile" ? (
              <>
                <Txt size={40} display style={{ letterSpacing: -1 }}>
                  Welcome to the club.
                </Txt>
                <Txt muted>
                  No real name needed. Your solo progress stays on this device.
                  Online play is private.
                </Txt>
                <Card>
                  {field("alias", "Choose an alias", {
                    maxLength: 24,
                    autoCapitalize: "none",
                    testID: "alias-input",
                  })}
                  <Txt bold>Age group</Txt>
                  <Row>
                    {ageGroups.map((age) => (
                      <Button
                        key={age}
                        title={age === "unknown" ? "Prefer not to say" : age}
                        secondary={form.age !== age}
                        onPress={() => setForm((f) => ({ ...f, age }))}
                      />
                    ))}
                  </Row>
                  <Txt size={13} muted>
                    Under 18 and unknown-age profiles have no ad offers.
                    Children need guardian approval for online play and sharing.
                    This pilot uses self-declared age groups.
                  </Txt>
                  <Button
                    title="Let’s play"
                    testID="create-profile"
                    onPress={newLocalProfile}
                  />
                </Card>
              </>
            ) : screen === "home" ? (
              <PlayHome
                profile={profile}
                onSolo={() => start("solo", !!profile.saved)}
                onFriends={() => go("rooms")}
                onClub={() => {
                  go("club");
                  run(refreshClub);
                }}
                onLearn={() => start("learn")}
                onPractice={() => start("practice")}
                onFamily={() => start("family")}
              />
            ) : screen === "game" ? (
              <>
                {official && room?.status === "waiting" ? (
                  <Card>
                    <Tag>PRIVATE ROOM</Tag>
                    <Txt size={36} bold selectable>
                      {roomCode}
                    </Txt>
                    <Txt>
                      Up to 30 placements each.{" "}
                      {room.kind === "live"
                        ? "15-minute live window; 60-second reconnect grace."
                        : "24-hour asynchronous window. You do not need to play together."}{" "}
                      Equal scores are a draw.
                    </Txt>
                    <Button
                      secondary
                      title="Copy invite code"
                      onPress={() =>
                        run(async () => {
                          await Clipboard.setStringAsync(roomCode);
                          setNotice("Invite code copied.");
                        })
                      }
                    />
                    {room.players.map((p: any) => (
                      <Row key={p.id}>
                        <Txt bold>{p.alias}</Txt>
                        <Tag>{p.ready ? "Ready" : "Not ready"}</Tag>
                      </Row>
                    ))}
                    <Button
                      title="I’m ready"
                      disabled={
                        busy ||
                        room.players.find((p: any) => p.id === profile.user?.id)
                          ?.ready
                      }
                      onPress={() =>
                        run(async () =>
                          receiveRoom(
                            await api("room.ready", { code: roomCode }),
                          ),
                        )
                      }
                    />
                    {room.host === profile.user?.id &&
                      room.players.length === 2 && (
                        <Button
                          secondary
                          title="Remove unstarted guest"
                          onPress={() =>
                            run(async () =>
                              receiveRoom(
                                await api("room.remove", { code: roomCode }),
                              ),
                            )
                          }
                        />
                      )}
                  </Card>
                ) : (
                  <>
                    {official && !connected && (
                      <Card>
                        <Txt bold>Reconnecting…</Txt>
                        <Txt>
                          Moves are paused until your confirmed board returns.
                          The server clock keeps running.
                        </Txt>
                      </Card>
                    )}
                    {official && (
                      <>
                        <Row style={{ alignItems: "stretch" }}>
                          {room?.players.map((p: any) => (
                            <Card
                              key={p.id}
                              style={{
                                flex: 1,
                                minWidth: 140,
                                padding: 16,
                                borderColor:
                                  p.id === profile.user?.id
                                    ? t.brand
                                    : t.border,
                              }}
                            >
                              <Txt muted size={13}>
                                {p.id === profile.user?.id ? "YOU" : p.alias}
                              </Txt>
                              <ScoreBeat
                                score={p.score}
                                step={p.moves}
                                size={30}
                                enabled={
                                  effective.motion && p.id === profile.user?.id
                                }
                              />
                              <Txt muted size={12}>
                                {p.moves}/30 placed ·{" "}
                                {p.done
                                  ? "Finished"
                                  : p.connected
                                    ? "Here"
                                    : "Away"}
                              </Txt>
                            </Card>
                          ))}
                        </Row>
                        <Txt size={13} muted>
                          {room?.kind === "live"
                            ? `${Math.max(0, Math.ceil((room.deadline - Date.now()) / 1000))} seconds left`
                            : `Finish by ${new Date(room?.deadline).toLocaleString()}`}{" "}
                          ·{" "}
                          {room?.status === "final"
                            ? "Result final"
                            : "Official result pending"}
                        </Txt>
                      </>
                    )}
                    {!official && (
                      <Row
                        style={{
                          justifyContent: "space-between",
                          alignItems: "flex-end",
                          paddingBottom: space.xs,
                        }}
                      >
                        <View>
                          <Txt
                            size={12}
                            bold
                            muted
                            style={{ letterSpacing: 0.65 }}
                          >
                            {mode === "practice"
                              ? "ASSISTED · UNRANKED"
                              : mode === "family"
                                ? `LOCAL · PLAYER ${familySecond ? 2 : 1}`
                                : mode === "challenge"
                                  ? "UNRANKED CHALLENGE"
                                  : mode === "learn"
                                    ? "GUIDED · THREE MOVES"
                                    : "SOLO · UNTIMED"}
                          </Txt>
                          <ScoreBeat
                            score={game.score}
                            step={game.moves.length}
                            enabled={effective.motion}
                          />
                        </View>
                        <View>
                          <Txt muted size={13}>
                            {game.limit < 1e9
                              ? `${game.moves.length} / ${game.limit}`
                              : `${game.moves.length} placed`}
                          </Txt>
                          <Txt size={13} muted>
                            {lineSummary} cleared
                          </Txt>
                        </View>
                      </Row>
                    )}
                    {mode === "learn" && (
                      <Card style={{ padding: 14 }}>
                        <Txt bold>
                          Step {Math.min(3, game.moves.length + 1)} of 3
                        </Txt>
                        <Txt>
                          {
                            [
                              "Tap a piece below. Tap a board cell to preview its top-left corner.",
                              "Check the full shape. It must fit inside the board without overlapping.",
                              "Place the third piece. Full rows and columns clear together.",
                            ][Math.min(2, game.moves.length)]
                          }
                        </Txt>
                        <Button
                          secondary
                          title="Show a fitting move"
                          onPress={() => {
                            const h = hint(game);
                            if (h) {
                              setSelected(h.slot);
                              setAnchor([h.row, h.col]);
                            }
                          }}
                        />
                      </Card>
                    )}
                    <View
                      style={{
                        width: "100%",
                        maxWidth: boardWidth,
                        alignSelf: "center",
                      }}
                    >
                      <Board
                        game={game}
                        settings={effective}
                        selected={selected}
                        setSelected={setSelected}
                        anchor={anchor}
                        setAnchor={setAnchor}
                        disabled={gameDisabled}
                        onDragging={setDragging}
                      />
                    </View>
                    <Txt
                      accessibilityLiveRegion="polite"
                      size={14}
                      muted
                      style={{ textAlign: "center" }}
                    >
                      {game.done
                        ? game.reason
                        : anchor && selected >= 0
                          ? canPlace
                            ? `✓ Fits at row ${anchor[0] + 1}, column ${anchor[1] + 1}`
                            : "× Does not fit. Choose another cell."
                          : selected >= 0
                            ? "Tap where the top-left corner should go."
                            : "Choose a piece to begin."}
                    </Txt>
                    {game.last.lines > 0 && (
                      <Txt
                        bold
                        size={14}
                        accessibilityLiveRegion="polite"
                        style={{ color: t.brand, textAlign: "center" }}
                      >
                        {`${game.last.lines} ${game.last.lines === 1 ? "line" : "lines"} cleared · +${game.last.gain}${game.streak > 1 ? ` · ${game.streak} clears in a row` : ""}`}
                      </Txt>
                    )}
                    {!game.done && (
                      <Row>
                        <Button
                          secondary
                          title={s.cancel}
                          style={{ flex: 1 }}
                          onPress={() => {
                            setSelected(-1);
                            setAnchor(null);
                          }}
                        />
                        <Button
                          testID="confirm-place"
                          title={s.confirm}
                          disabled={!canPlace || gameDisabled}
                          style={{ flex: 2 }}
                          onPress={commit}
                        />
                      </Row>
                    )}
                    {!game.done && (
                      <Row>
                        <Button
                          secondary
                          title="? Help"
                          onPress={() => info(s.learn, s.help)}
                        />
                        {mode === "practice" && (
                          <>
                            <Button
                              secondary
                              title={s.hint}
                              onPress={() => {
                                const h = hint(game);
                                if (h) {
                                  setSelected(h.slot);
                                  setAnchor([h.row, h.col]);
                                }
                              }}
                            />
                            <Button
                              secondary
                              title="Undo"
                              disabled={!undo}
                              onPress={() => {
                                if (undo) {
                                  setGame(undo);
                                  setUndo(null);
                                  setSelected(-1);
                                  setAnchor(null);
                                }
                              }}
                            />
                          </>
                        )}
                        <Button
                          secondary
                          title={s.end}
                          disabled={
                            busy || (official && room?.status !== "playing")
                          }
                          onPress={end}
                        />
                      </Row>
                    )}
                    {official && room?.status === "final" ? (
                      matchResult()
                    ) : official && game.done ? (
                      <Card>
                        <Txt bold>Your attempt is complete.</Txt>
                        <Txt>
                          Waiting for your friend. Your score is saved; the
                          winner is not final yet.
                        </Txt>
                        <Button
                          secondary
                          title="Go home"
                          onPress={() => go("home")}
                        />
                      </Card>
                    ) : null}
                    {official && roomActions()}
                  </>
                )}
              </>
            ) : screen === "result" ? (
              <>
                <Txt size={38} display style={{ letterSpacing: -0.8 }}>
                  {mode === "learn"
                    ? "You’re ready to play."
                    : "Round complete."}
                </Txt>
                <Card
                  style={{
                    padding: space.xl,
                    borderRadius: radius.hero,
                    backgroundColor:
                      settings.theme === "contrast" ? t.surface : brand.ink,
                    borderColor:
                      settings.theme === "contrast" ? t.border : brand.seam,
                  }}
                >
                  <Row style={{ justifyContent: "space-between" }}>
                    <View style={{ flexShrink: 1 }}>
                      <Txt
                        size={12}
                        bold
                        style={{
                          color:
                            settings.theme === "contrast"
                              ? t.muted
                              : brand.quiet,
                          letterSpacing: 0.75,
                        }}
                      >
                        {resultMode || "Your score"}
                      </Txt>
                    </View>
                    <ResultMark enabled={effective.motion} />
                  </Row>
                  <Txt
                    size={62}
                    display
                    style={{
                      color:
                        settings.theme === "contrast" ? t.text : brand.accent,
                      fontVariant: ["tabular-nums"],
                      letterSpacing: -1.8,
                    }}
                  >
                    {game.score.toLocaleString()}
                  </Txt>
                  {newSoloBest && (
                    <Txt
                      bold
                      size={14}
                      style={{
                        color:
                          settings.theme === "contrast"
                            ? t.brand
                            : brand.accent,
                      }}
                    >
                      New solo best
                    </Txt>
                  )}
                  <Txt
                    style={{
                      color:
                        settings.theme === "contrast" ? t.text : brand.paper,
                    }}
                  >
                    {lineSummary} · {game.moves.length}{" "}
                    {game.moves.length === 1 ? "placement" : "placements"} ·{" "}
                    {game.reason}
                  </Txt>
                  {mode === "family" && familyFirst && (
                    <>
                      <Txt
                        bold
                        style={{
                          color:
                            settings.theme === "contrast"
                              ? t.text
                              : brand.paper,
                        }}
                      >
                        Player 1: {familyFirst.score} · Player 2: {game.score}
                      </Txt>
                      <Txt
                        style={{
                          color:
                            settings.theme === "contrast"
                              ? t.text
                              : brand.paper,
                        }}
                      >
                        {familyFirst.score === game.score
                          ? "A friendly draw"
                          : familyFirst.score > game.score
                            ? "Player 1 wins this round"
                            : "Player 2 wins this round"}
                      </Txt>
                      <Tag>Local, unranked · identical pieces</Tag>
                    </>
                  )}
                  <Txt
                    bold
                    style={{
                      color:
                        settings.theme === "contrast" ? t.text : brand.paper,
                    }}
                  >
                    ✦ Progress saved. {starsEarned}{" "}
                    {starsEarned === 1 ? "star" : "stars"} earned.
                  </Txt>
                </Card>
                {sessionBadges.map((id) => (
                  <Card key={id}>
                    <Txt bold>✧ {BADGES.find((b) => b[0] === id)?.[1]}</Txt>
                    <Txt muted>{BADGES.find((b) => b[0] === id)?.[2]}</Txt>
                  </Card>
                ))}
                <Button
                  title="Play again"
                  onPress={() => start(mode === "learn" ? "solo" : mode)}
                />
                <Row>
                  <Button
                    secondary
                    title="Share result"
                    onPress={() => run(() => shareResult())}
                  />
                  <Button
                    secondary
                    title="Save result card"
                    onPress={() => run(() => shareResult(true))}
                  />
                </Row>
                <Button
                  secondary
                  title="Review my moves"
                  onPress={() => {
                    setReplayStep(0);
                    go("replay");
                  }}
                />
                <Button
                  secondary
                  title="That’s enough for now"
                  onPress={() => go("home")}
                />
                <Txt muted size={13}>
                  Your rewards stay yours. Come back whenever you like.
                </Txt>
              </>
            ) : screen === "rooms" ? (
              <>
                <Txt size={32} bold>
                  Better with a friend.
                </Txt>
                <Txt muted>
                  Private invitations only. No public matchmaking or open chat.
                </Txt>
                <Card>
                  <Tag>LIVE · 15 MINUTES</Tag>
                  <Txt size={23} bold>
                    Face-Off
                  </Txt>
                  <Txt>
                    30 placements each. Same pieces, independent boards. Highest
                    validated score wins.
                  </Txt>
                  <Button
                    title="Create live room"
                    onPress={() =>
                      run(async () => {
                        const token = await ensureOnline();
                        const r = await api(
                          "room.create",
                          { kind: "live" },
                          token,
                        );
                        receiveRoom(r);
                        setRoomCode(r.code);
                        setMode("online");
                        go("game");
                      })
                    }
                  />
                </Card>
                <Card>
                  <Tag>ASYNC · 24 HOURS</Tag>
                  <Txt size={23} bold>
                    Your schedules. One challenge.
                  </Txt>
                  <Button
                    secondary
                    title="Create asynchronous challenge"
                    onPress={() =>
                      run(async () => {
                        const token = await ensureOnline();
                        const r = await api(
                          "room.create",
                          { kind: "async" },
                          token,
                        );
                        receiveRoom(r);
                        setRoomCode(r.code);
                        setMode("online");
                        go("game");
                      })
                    }
                  />
                </Card>
                <Card>
                  {field("code", "Invitation code", {
                    autoCapitalize: "characters",
                    maxLength: 8,
                  })}
                  <Button
                    title="Join private room"
                    onPress={() =>
                      run(async () => {
                        const token = await ensureOnline();
                        const r = await api(
                          "room.join",
                          { code: form.code },
                          token,
                        );
                        receiveRoom(r);
                        setRoomCode(r.code);
                        setMode("online");
                        go("game");
                      })
                    }
                  />
                </Card>
                <Button
                  secondary
                  title="Refresh my matches"
                  onPress={() =>
                    run(async () => {
                      const token = await ensureOnline();
                      setRooms(await api("rooms", {}, token));
                    })
                  }
                />
                {rooms.map((r) => (
                  <Card key={r.code}>
                    <Txt bold>
                      {r.kind} · {r.code}
                    </Txt>
                    <Txt>
                      {r.status} · {new Date(r.deadline).toLocaleString()}
                    </Txt>
                    <Button
                      secondary
                      title="Open match"
                      onPress={() => run(() => enterRoom(r.code))}
                    />
                  </Card>
                ))}
                <Button
                  secondary
                  title={s.family + " — one phone"}
                  onPress={() => start("family")}
                />
              </>
            ) : screen === "club" ? (
              <>
                <Tag>SMALL TEAMS. BIG MOMENTS.</Tag>
                <Txt size={34} bold>
                  Make it a club thing.
                </Txt>
                <Txt muted>
                  Three people per team. Private invites. Every result earned on
                  the board.
                </Txt>
                <Button
                  secondary
                  title="Refresh club"
                  onPress={() => run(refreshClub)}
                />
                <Row>
                  {teams.map((t) => (
                    <Card key={t.id} style={{ flex: 1, minWidth: 240 }}>
                      <Tag>{t.locked ? "ROSTER LOCKED" : "YOUR TEAM"}</Tag>
                      <Txt size={24} bold>
                        {t.name}
                      </Txt>
                      <Txt muted>{t.members.length}/3 approved players</Txt>
                      <Button
                        secondary
                        title="Open team"
                        onPress={() => {
                          setTeam(t);
                          go("team");
                        }}
                      />
                    </Card>
                  ))}
                </Row>
                <Card>
                  <Txt size={22} bold>
                    Create or join a team
                  </Txt>
                  {field("name", "Original team name", { maxLength: 24 })}
                  <Button
                    title="Create team"
                    onPress={() =>
                      run(async () => {
                        const token = await ensureOnline();
                        await api("team.create", { name: form.name }, token);
                        await refreshClub();
                      })
                    }
                  />
                  {field("teamCode", "Team invite code", {
                    autoCapitalize: "characters",
                  })}
                  <Button
                    secondary
                    title="Request to join"
                    onPress={() =>
                      run(async () => {
                        const token = await ensureOnline();
                        const r = await api(
                          "team.request",
                          { code: form.teamCode },
                          token,
                        );
                        setNotice(r.message);
                      })
                    }
                  />
                </Card>
                <Txt size={26} bold>
                  Private seasons
                </Txt>
                {leagues.map((l) => (
                  <Card key={l.id}>
                    <Tag>{l.status}</Tag>
                    <Txt size={23} bold>
                      {l.name}
                    </Txt>
                    <Txt>
                      {l.teams.length}/{l.size} teams · {l.windowHours}-hour
                      fixture windows
                    </Txt>
                    <Button
                      secondary
                      title="View season"
                      onPress={() => {
                        setLeague(l);
                        go("league");
                      }}
                    />
                  </Card>
                ))}
                <Card>
                  <Txt size={22} bold>
                    Start a season
                  </Txt>
                  {field("leagueName", "Season name", { maxLength: 24 })}
                  {field("window", "Fixture window in hours (1–168)", {
                    keyboardType: "numeric",
                  })}
                  <Button
                    title="Create 4-team Mini League"
                    onPress={() =>
                      run(async () => {
                        const token = await ensureOnline();
                        setLeague(
                          await api(
                            "league.create",
                            {
                              name: form.leagueName,
                              size: 4,
                              windowHours: Number(form.window),
                            },
                            token,
                          ),
                        );
                        await refreshClub();
                        go("league");
                      })
                    }
                  />
                  <Button
                    secondary
                    title="Create 8-team Championship"
                    onPress={() =>
                      run(async () => {
                        const token = await ensureOnline();
                        setLeague(
                          await api(
                            "league.create",
                            {
                              name: form.leagueName,
                              size: 8,
                              windowHours: Number(form.window),
                            },
                            token,
                          ),
                        );
                        await refreshClub();
                        go("league");
                      })
                    }
                  />
                  {field("leagueCode", "Season invitation code", {
                    autoCapitalize: "characters",
                  })}
                  {teams
                    .filter((t) => t.captain === profile.user?.id && !t.locked)
                    .map((t) => (
                      <Button
                        key={t.id}
                        secondary
                        title={`Enter ${t.name} & lock roster`}
                        onPress={() =>
                          run(async () => {
                            setLeague(
                              await api("league.enter", {
                                code: form.leagueCode,
                                team: t.id,
                              }),
                            );
                            await refreshClub();
                            go("league");
                          })
                        }
                      />
                    ))}
                </Card>
              </>
            ) : screen === "team" && team ? (
              <>
                <Tag>PRIVATE TEAM</Tag>
                <Txt size={34} bold>
                  {team.name}
                </Txt>
                <Card>
                  <Txt>Invite code: {team.code}</Txt>
                  <Button
                    secondary
                    title="Copy team code"
                    onPress={() =>
                      run(async () => {
                        await Clipboard.setStringAsync(team.code);
                        setNotice("Copied. Share only with people you know.");
                      })
                    }
                  />
                  {team.members.map((id: string) => (
                    <Row key={id}>
                      <Txt bold>
                        {team.people?.[id] || id.slice(0, 8)}{" "}
                        {id === team.captain ? "· Captain" : ""}
                      </Txt>
                      {profile.user?.id === team.captain &&
                        !team.locked &&
                        id !== team.captain && (
                          <Button
                            secondary
                            title="Remove"
                            onPress={() =>
                              run(async () => {
                                await api("team.remove", {
                                  id: team.id,
                                  member: id,
                                });
                                await refreshClub();
                              })
                            }
                          />
                        )}
                    </Row>
                  ))}
                  <Tag>
                    {team.locked
                      ? "LOCKED · NO MID-SEASON SUBSTITUTIONS"
                      : "ROSTER OPEN"}
                  </Tag>
                </Card>
                {profile.user?.id === team.captain &&
                  team.requests.map((id: string) => (
                    <Card key={id}>
                      <Txt>{team.people?.[id]} wants to join</Txt>
                      <Button
                        title="Approve player"
                        disabled={team.locked || team.members.length >= 3}
                        onPress={() =>
                          run(async () => {
                            await api("team.approve", {
                              id: team.id,
                              member: id,
                            });
                            await refreshClub();
                          })
                        }
                      />
                      <Button
                        secondary
                        title="Decline"
                        onPress={() =>
                          run(async () => {
                            await api("team.remove", {
                              id: team.id,
                              member: id,
                            });
                            await refreshClub();
                          })
                        }
                      />
                    </Card>
                  ))}
                <Card>
                  {field("report", "Report a team-name concern", {
                    multiline: true,
                  })}
                  <Button
                    secondary
                    title="Submit private report"
                    onPress={() =>
                      run(async () => {
                        const r = await api("report", {
                          kind: "team",
                          target: team.id,
                          reason: form.report,
                        });
                        setNotice("Report recorded: " + r.id.slice(0, 8));
                      })
                    }
                  />
                </Card>
                <Button
                  secondary
                  title="Back to clubhouse"
                  onPress={() => go("club")}
                />
              </>
            ) : screen === "league" && league ? (
              <>
                <Tag>{league.status.toUpperCase()}</Tag>
                <Txt size={34} bold>
                  {league.name}
                </Txt>
                <Card>
                  <Txt bold>{league.size} teams · 3 players each</Txt>
                  <Txt>
                    Registration closes{" "}
                    {new Date(league.deadline).toLocaleString()}. Fixtures allow{" "}
                    {league.windowHours} hours from scheduling. No mid-season
                    substitutions. Unplayed attempts score zero.
                  </Txt>
                  <Txt selectable>Invitation: {league.code}</Txt>
                  <Button
                    secondary
                    title="Copy league code"
                    onPress={() =>
                      run(async () => {
                        await Clipboard.setStringAsync(league.code);
                        setNotice("Copied league code.");
                      })
                    }
                  />
                  <Button
                    secondary
                    title="Refresh season"
                    onPress={() =>
                      run(async () =>
                        setLeague(await api("league.get", { id: league.id })),
                      )
                    }
                  />
                  {league.owner === profile.user?.id &&
                    league.status === "registration" && (
                      <Button
                        title="Lock entries & start season"
                        disabled={league.teams.length !== league.size}
                        onPress={() =>
                          run(async () =>
                            setLeague(
                              await api("league.start", { id: league.id }),
                            ),
                          )
                        }
                      />
                    )}
                </Card>
                {league.champion && (
                  <Card>
                    <Txt size={30} bold>
                      ✦ {league.teamNames[league.champion]}
                    </Txt>
                    <Txt>League champions. Earned together.</Txt>
                  </Card>
                )}
                <Card>
                  <Txt size={22} bold>
                    Standings
                  </Txt>
                  <Txt size={13} muted>
                    League points → head-to-head → individual duel wins →
                    qualification decider. Tied knockout fixtures get fresh-seed
                    captain duels.
                  </Txt>
                  {league.standings.map((r: any, i: number) => (
                    <Row
                      key={r.id}
                      style={{
                        justifyContent: "space-between",
                        borderTopWidth: 1,
                        borderColor: t.border,
                        paddingTop: 12,
                      }}
                    >
                      <Txt bold>
                        {i + 1}. {league.teamNames[r.id]}
                      </Txt>
                      <Txt>
                        {r.points} pts · {r.played} played
                      </Txt>
                    </Row>
                  ))}
                </Card>
                {league.status === "qualification-tied" && (
                  <Card>
                    <Txt>
                      Qualification is tied. The organiser schedules captain
                      deciders; no hidden seeding tie-break is applied.
                    </Txt>
                    {league.owner === profile.user?.id && (
                      <Button
                        title="Schedule qualification deciders"
                        onPress={() =>
                          run(async () =>
                            setLeague(
                              await api("league.deciders", { id: league.id }),
                            ),
                          )
                        }
                      />
                    )}
                  </Card>
                )}
                {league.status === "deciding" &&
                  league.owner === profile.user?.id && (
                    <Button
                      title="Apply completed deciders"
                      onPress={() =>
                        run(async () =>
                          setLeague(
                            await api("league.resolve", { id: league.id }),
                          ),
                        )
                      }
                    />
                  )}
                <Txt size={24} bold>
                  Your fixture attempts
                </Txt>
                {league.myRooms.map((c: string) => (
                  <Button
                    key={c}
                    secondary
                    title={`Play / review fixture ${c}`}
                    onPress={() => run(() => enterRoom(c))}
                  />
                ))}
                <Txt size={24} bold>
                  Fixtures & bracket
                </Txt>
                {league.fixtures.map((f: any) => (
                  <Card key={f.id}>
                    <Tag>{f.phase.replaceAll("-", " ").toUpperCase()}</Tag>
                    <Txt bold>
                      {league.teamNames[f.a]} vs {league.teamNames[f.b]}
                    </Txt>
                    <Txt>
                      {f.winner === undefined
                        ? "Open fixture"
                        : f.winner === null
                          ? "Draw"
                          : `Winner: ${league.teamNames[f.winner]}`}
                      {f.points ? " · " + f.points.join("–") : ""}
                    </Txt>
                  </Card>
                ))}
                <Button
                  secondary
                  title="Back to clubhouse"
                  onPress={() => go("club")}
                />
              </>
            ) : screen === "replay" ? (
              <>
                <Tag>LEARN FROM THE MOVES</Tag>
                <Txt size={30} bold>
                  Two paths. Same pieces.
                </Txt>
                <Txt muted>
                  Original rules version. Opponent replays unlock only after
                  both attempts are final.
                </Txt>
                <Row>
                  <Button
                    secondary
                    title="← Previous"
                    disabled={replayStep === 0}
                    onPress={() => setReplayStep((n) => n - 1)}
                  />
                  <Txt bold>Move {replayStep}</Txt>
                  <Button
                    secondary
                    title="Next →"
                    disabled={
                      replayStep >=
                      Math.max(
                        game.moves.length,
                        ...(room?.replays?.map(
                          (r: any) => r.game.moves.length,
                        ) || [0]),
                      )
                    }
                    onPress={() => setReplayStep((n) => n + 1)}
                  />
                </Row>
                <Button
                  secondary
                  title="Jump to my biggest clear"
                  onPress={() => {
                    let best = 0,
                      gain = -1;
                    for (let i = 1; i <= game.moves.length; i++) {
                      const g = replay(
                        game.seed,
                        game.moves.slice(0, i),
                        game.limit,
                        game.beginner,
                      );
                      if (g.last.gain > gain) {
                        gain = g.last.gain;
                        best = i;
                      }
                    }
                    setReplayStep(best);
                  }}
                />
                <Row style={{ alignItems: "flex-start" }}>
                  {(official
                    ? room?.replays || []
                    : [{ alias: profile.alias, game }]
                  ).map((r: any, i: number) => {
                    const g = replay(
                      r.game.seed,
                      r.game.moves.slice(0, replayStep),
                      r.game.limit,
                      r.game.beginner,
                    );
                    return (
                      <Card key={i} style={{ flex: 1, minWidth: 260 }}>
                        <Row style={{ justifyContent: "space-between" }}>
                          <Txt bold>{r.alias}</Txt>
                          <Txt>
                            {g.score} points · +{g.last.gain}
                          </Txt>
                        </Row>
                        <Board
                          small
                          game={g}
                          settings={effective}
                          selected={-1}
                          setSelected={() => {}}
                          anchor={null}
                          setAnchor={() => {}}
                        />
                      </Card>
                    );
                  })}
                </Row>
                <Button
                  secondary
                  title="Back to result"
                  onPress={() => go(official ? "game" : "result")}
                />
                {official && (
                  <Card>
                    {field("report", "Report a suspicious result", {
                      multiline: true,
                    })}
                    <Button
                      secondary
                      title="Submit private report"
                      onPress={() =>
                        run(async () => {
                          await api("report", {
                            kind: "room",
                            target: roomCode,
                            reason: form.report,
                          });
                          setNotice("Report recorded for review.");
                        })
                      }
                    />
                  </Card>
                )}
              </>
            ) : screen === "profile" ? (
              <>
                <Tag>PRIVATE BY DEFAULT</Tag>
                <Txt size={34} bold>
                  {profile.alias}’s corner
                </Txt>
                <Card>
                  <Txt bold>Your progress</Txt>
                  <Txt>
                    Unassisted Solo: {profile.best} · Assisted practice:{" "}
                    {profile.practiceBest}
                  </Txt>
                  <Txt>
                    Verified competitive: {profile.user?.best || 0} · Stars:{" "}
                    {profile.stars}
                  </Txt>
                  <Button
                    secondary
                    title="Accessibility & appearance"
                    onPress={() => go("settings")}
                  />
                  <Button
                    secondary
                    title="Cosmetic studio"
                    onPress={() => go("reward")}
                  />
                </Card>
                <Txt size={23} bold>
                  Skill collection
                </Txt>
                {BADGES.map(([id, title, desc]) => {
                  const verified = profile.user?.badges?.includes(id),
                    earned = profile.badges.includes(id);
                  return (
                    <Card key={id}>
                      <Txt bold>
                        {verified || earned ? "✦" : "○"} {title}
                      </Txt>
                      <Txt muted>{desc}</Txt>
                      <Tag>
                        {verified
                          ? "SERVER VERIFIED"
                          : earned
                            ? "EARNED LOCALLY"
                            : "NOT YET EARNED"}
                      </Tag>
                    </Card>
                  );
                })}
                <Card>
                  <Txt bold>Recent personal rounds</Txt>
                  {profile.history.length ? (
                    profile.history
                      .slice(-5)
                      .reverse()
                      .map((r, i) => (
                        <Txt key={i} size={14}>
                          {r.score} · {r.mode} ·{" "}
                          {new Date(r.at).toLocaleDateString()}
                        </Txt>
                      ))
                  ) : (
                    <Txt muted>Your next round starts your story.</Txt>
                  )}
                </Card>
                <Card>
                  <Txt size={23} bold>
                    Family profiles
                  </Txt>
                  {local.profiles.map((p) => (
                    <Button
                      key={p.id}
                      secondary={p.id !== profile.id}
                      title={`${p.alias} · ${p.age}`}
                      onPress={() => {
                        setLocal((l) => ({ ...l, active: p.id }));
                        setRoomCode("");
                        setRoom(null);
                        setTeam(null);
                        setLeague(null);
                        setTeams([]);
                        setLeagues([]);
                        setRooms([]);
                        setSeconds(0);
                        reminded.current = 0;
                        go("home");
                      }}
                    />
                  ))}
                  <Button
                    secondary
                    title="Add local profile"
                    onPress={() => go("newprofile")}
                  />
                  <Txt size={12} muted>
                    Separate progress and preferences. Local profile switching
                    is a family convenience, not a secure parental identity
                    boundary.
                  </Txt>
                </Card>
                <Card>
                  <Txt size={23} bold>
                    Online account & recovery
                  </Txt>
                  <Txt muted>
                    Solo works offline. Connect for private matches. Keep your
                    recovery key private; it restores this pilot account on a
                    second device.
                  </Txt>
                  <Input
                    label="Game server URL"
                    value={local.server}
                    onChangeText={(server: string) =>
                      setLocal((l) => ({ ...l, server }))
                    }
                    autoCapitalize="none"
                  />
                  <Button
                    title={
                      profile.token
                        ? "Refresh online progress"
                        : "Create private online account"
                    }
                    onPress={() =>
                      run(async () => {
                        const token = await ensureOnline();
                        updateProfile({ user: await api("me", {}, token) });
                        setNotice("Online account connected.");
                      })
                    }
                  />
                  {profile.recovery && (
                    <Button
                      secondary
                      title="Copy my private recovery key"
                      onPress={() =>
                        run(async () => {
                          await Clipboard.setStringAsync(profile.recovery!);
                          setNotice(
                            "Copied. Store it privately; anyone with this key can access this account.",
                          );
                        })
                      }
                    />
                  )}
                  <Txt size={13} muted>
                    Recovery creates a separate local profile and never merges
                    another family member’s progress.
                  </Txt>
                  {field("recovery", "Private recovery key", {
                    secureTextEntry: true,
                    autoCapitalize: "none",
                  })}
                  <Button
                    secondary
                    title="Recover into a separate profile"
                    onPress={() =>
                      run(async () => {
                        const r = await api("recover", {
                          recovery: form.recovery,
                        });
                        const p = newProfile(r.user.alias, r.user.age);
                        Object.assign(p, r.user.cloud?.progress || {});
                        p.settings = { ...defaults, ...p.settings };
                        p.cloudRevision = r.user.cloud?.revision || 0;
                        p.token = r.token;
                        p.user = r.user;
                        p.recovery = form.recovery;
                        setLocal((l) => ({
                          ...l,
                          profiles: [...l.profiles, p],
                          active: p.id,
                        }));
                        setForm((f) => ({ ...f, recovery: "" }));
                        go("home");
                      })
                    }
                  />
                </Card>
                {profile.age === "7-12" && (
                  <Card>
                    <Txt size={23} bold>
                      Guardian controls
                    </Txt>
                    <Txt muted>
                      A guardian sets a six-digit PIN on the online account.
                      Private social access and external sharing begin disabled.
                      This pilot does not verify guardian identity.
                    </Txt>
                    {field("pin", "Guardian PIN (6 digits)", {
                      secureTextEntry: true,
                      keyboardType: "numeric",
                      maxLength: 6,
                    })}
                    <Button
                      secondary
                      title={
                        profile.user?.hasGuardian
                          ? "Enable private social play"
                          : "Set guardian PIN"
                      }
                      onPress={() =>
                        run(async () => {
                          const token = await ensureOnline();
                          updateProfile({
                            user: await api(
                              profile.user?.hasGuardian
                                ? "guardian.update"
                                : "guardian.setup",
                              profile.user?.hasGuardian
                                ? {
                                    pin: form.pin,
                                    social: true,
                                    sharing: !!profile.user?.sharing,
                                  }
                                : { pin: form.pin },
                              token,
                            ),
                          });
                        })
                      }
                    />
                    {profile.user?.hasGuardian && (
                      <>
                        <Button
                          secondary
                          title={
                            profile.user.sharing
                              ? "Disable external sharing"
                              : "Approve external sharing"
                          }
                          onPress={() =>
                            run(async () =>
                              updateProfile({
                                user: await api("guardian.update", {
                                  pin: form.pin,
                                  social: profile.user.social,
                                  sharing: !profile.user.sharing,
                                }),
                              }),
                            )
                          }
                        />
                        <Button
                          secondary
                          title="Disable social access"
                          onPress={() =>
                            run(async () =>
                              updateProfile({
                                user: await api("guardian.update", {
                                  pin: form.pin,
                                  social: false,
                                  sharing: false,
                                }),
                              }),
                            )
                          }
                        />
                      </>
                    )}
                  </Card>
                )}
                <Card>
                  <Txt size={22} bold>
                    Notifications & time
                  </Txt>
                  <Txt>
                    {Math.floor(seconds / 60)} minutes in this session.
                    Reminders appear only while the app is open.
                  </Txt>
                  <Toggle
                    label="Quiet mode"
                    description="Silence in-app break reminders. No urgency notifications."
                    value={settings.quiet}
                    onValueChange={(v: boolean) => setSetting("quiet", v)}
                  />
                  <Row>
                    {[0, 10, 20, 30].map((v) => (
                      <Button
                        key={v}
                        secondary={settings.reminder !== v}
                        title={v ? `${v} min` : "No reminder"}
                        onPress={() => {
                          if (profile.age === "7-12") {
                            run(async () => {
                              const user = await api("guardian.update", {
                                pin: form.pin,
                                social: profile.user?.social,
                                sharing: profile.user?.sharing,
                                reminder: v,
                              });
                              updateProfile({
                                user,
                                settings: { ...settings, reminder: v },
                              });
                            });
                          } else {
                            reminded.current = Math.floor(
                              seconds / (Math.max(v, 1) * 60),
                            );
                            setSetting("reminder", v);
                          }
                        }}
                      />
                    ))}
                  </Row>
                </Card>
              </>
            ) : screen === "settings" ? (
              <>
                <Txt size={30} bold>
                  A game that fits you.
                </Txt>
                <Card>
                  <Txt bold>Theme</Txt>
                  <Row>
                    {Object.keys(themes).map((k) => (
                      <Button
                        key={k}
                        title={
                          k === "contrast"
                            ? "High contrast"
                            : k === "dark"
                              ? "Night Club"
                              : "Club Light"
                        }
                        secondary={settings.theme !== k}
                        onPress={() =>
                          setSetting("theme", k as Settings["theme"])
                        }
                      />
                    ))}
                  </Row>
                  <Toggle
                    label="Patterned blocks"
                    description="Shapes and marks, not just colour."
                    value={settings.patterns}
                    onValueChange={(v: boolean) => setSetting("patterns", v)}
                  />
                  <Toggle
                    label="Readable typeface"
                    description="Atkinson Hyperlegible for Latin text."
                    value={settings.readable}
                    onValueChange={(v: boolean) => setSetting("readable", v)}
                  />
                  <Txt bold>Text size</Txt>
                  <Row>
                    {[1, 1.25, 1.5, 2].map((v) => (
                      <Button
                        key={v}
                        title={`${v * 100}%`}
                        secondary={settings.textSize !== v}
                        onPress={() => setSetting("textSize", v)}
                      />
                    ))}
                  </Row>
                </Card>
                <Card>
                  <Txt bold>Motion & feedback</Txt>
                  <Toggle
                    label="Custom animations"
                    description={
                      systemReduce
                        ? "Your device requests reduced motion; motion stays off."
                        : "Tile placement, line sweeps, score feedback and screen transitions."
                    }
                    value={settings.motion && !systemReduce}
                    disabled={systemReduce}
                    onValueChange={(v: boolean) => setSetting("motion", v)}
                  />
                  <Toggle
                    label="Low effects"
                    description="Disable animated effects for simpler rendering."
                    value={settings.lowEffects}
                    onValueChange={(v: boolean) => setSetting("lowEffects", v)}
                  />
                  <Toggle
                    label="Gentle vibration"
                    description="Optional; never needed to play."
                    value={settings.haptics}
                    onValueChange={(v: boolean) => setSetting("haptics", v)}
                  />
                </Card>
                <Card>
                  <Txt bold>Menu & learning language</Txt>
                  <Row>
                    {[
                      ["en", "English"],
                      ["hi", "हिन्दी"],
                      ["mr", "मराठी"],
                    ].map(([k, n]) => (
                      <Button
                        key={k}
                        title={n}
                        secondary={settings.language !== k}
                        onPress={() =>
                          setSetting("language", k as Settings["language"])
                        }
                      />
                    ))}
                  </Row>
                  <Txt muted size={13}>
                    Core navigation and placement help are translated. Account,
                    league and server messages remain English in this
                    development release.
                  </Txt>
                </Card>
                <Button
                  secondary
                  title="Replay the tutorial"
                  onPress={() => start("learn")}
                />
              </>
            ) : screen === "reward" ? (
              <>
                <Tag>APPEARANCE ONLY</Tag>
                <Txt size={34} bold>
                  Every colour, your way.
                </Txt>
                <Txt muted>
                  Colours vary for each new piece. Existing blocks keep their
                  colour within the chosen palette. Colours never change scoring
                  or piece generation.
                </Txt>
                {Object.entries(palettes).map(([key, colors]) => {
                  const unlocked =
                    key === "club" ||
                    (key === "garden" && profile.stars >= 5) ||
                    (key === "aurora" &&
                      profile.user?.rewards?.includes("aurora"));
                  return (
                    <Card key={key}>
                      <Txt size={23} bold>
                        {key === "club"
                          ? "Club confetti"
                          : key === "garden"
                            ? "Garden party"
                            : "Aurora"}
                      </Txt>
                      <Row>
                        {colors.map((c) => (
                          <View
                            key={c}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              backgroundColor: c,
                            }}
                          />
                        ))}
                      </Row>
                      <Txt muted>
                        {key === "garden"
                          ? "Earn 5 stars. Finish a round with at least 3 placements for a star. No ad or purchase."
                          : key === "aurora"
                            ? "Adult-only reward-provider development preview."
                            : "Yours from the first move."}
                      </Txt>
                      <Button
                        secondary
                        title={
                          unlocked
                            ? "Use palette"
                            : key === "garden"
                              ? `${profile.stars}/5 stars`
                              : "Locked"
                        }
                        disabled={!unlocked}
                        onPress={() =>
                          setSetting("palette", key as Settings["palette"])
                        }
                      />
                    </Card>
                  );
                })}
                {adEligible(profile.age) && (
                  <Card>
                    <Txt bold>Optional cosmetic reward · developer test</Txt>
                    <Txt>
                      No live ads are integrated. These controls simulate
                      completed, skipped and failed delivery. Scoring is
                      unchanged. The server must explicitly enable test rewards.
                    </Txt>
                    <Button
                      secondary
                      title="Request cosmetic test offer"
                      onPress={() =>
                        run(async () => {
                          const token = await ensureOnline();
                          setOffer(await api("reward.offer", {}, token));
                        })
                      }
                    />
                    {offer && (
                      <>
                        <Txt>Reward: {offer.reward}</Txt>
                        <Row>
                          {["completed", "skipped", "failed"].map((outcome) => (
                            <Button
                              key={outcome}
                              secondary
                              title={`Simulate ${outcome}`}
                              onPress={() =>
                                run(async () => {
                                  const r = await api("reward.complete", {
                                    offer: offer.offer,
                                    outcome,
                                  });
                                  updateProfile({ user: await api("me") });
                                  setNotice(`Test reward ${r.state}.`);
                                  setOffer(null);
                                })
                              }
                            />
                          ))}
                        </Row>
                        <Button
                          secondary
                          title="No thanks — keep playing"
                          onPress={() => {
                            setOffer(null);
                            go("home");
                          }}
                        />
                      </>
                    )}
                  </Card>
                )}
                <Card>
                  <Txt bold>Automatic ads: none in this build</Txt>
                  <Txt>
                    Store purchases and restoration require a configured billing
                    provider. No payment is requested.
                  </Txt>
                  <Button
                    secondary
                    title="Check purchase restoration"
                    onPress={() =>
                      run(async () => {
                        const token = await ensureOnline();
                        const r = await api("purchase.restore", {}, token);
                        setNotice(r.message);
                      })
                    }
                  />
                </Card>
              </>
            ) : (
              <Card>
                <Txt>{s.help}</Txt>
                <Button title="Play" onPress={() => go("home")} />
              </Card>
            )}
          </Animated.ScrollView>
          {profile && screen !== "game" && (
            <Row
              style={{
                justifyContent: "space-around",
                borderTopWidth: 1,
                borderColor: t.border,
                padding: space.sm,
                gap: space.xs,
                backgroundColor: t.surface,
              }}
            >
              {[
                ["home", s.play, "▦"],
                ["club", s.club, "◇"],
                ["profile", s.you, "○"],
              ].map(([key, label, icon]) => (
                <Pressable
                  key={key}
                  accessibilityRole="tab"
                  accessibilityLabel={label}
                  accessibilityState={{ selected: screen === key }}
                  onPress={() => {
                    go(key);
                    if (key === "club") run(refreshClub);
                  }}
                  style={{
                    minHeight: 52,
                    flex: 1,
                    minWidth: 64,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 14,
                    backgroundColor: screen === key ? t.soft : "transparent",
                    paddingVertical: space.xs,
                    paddingHorizontal: space.xs,
                  }}
                >
                  <Txt
                    size={16}
                    accessibilityElementsHidden
                    aria-hidden
                    style={{ color: screen === key ? t.brand : t.muted }}
                  >
                    {icon}
                  </Txt>
                  <Txt size={13} bold style={{ textAlign: "center" }}>
                    {label}
                  </Txt>
                </Pressable>
              ))}
            </Row>
          )}
        </View>
        <Modal
          visible={!!dialog}
          transparent
          animationType={effective.motion ? "fade" : "none"}
          onRequestClose={() => setDialog(null)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "#10202B88",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <View
              accessibilityViewIsModal
              style={{ width: "100%", maxWidth: 480, alignSelf: "center" }}
            >
              <Card>
                <Txt size={25} bold>
                  {dialog?.title}
                </Txt>
                <Txt>{dialog?.body}</Txt>
                {dialog?.action && (
                  <Button
                    title={dialog.label || "Continue"}
                    onPress={() => {
                      const fn = dialog.action;
                      setDialog(null);
                      fn?.();
                    }}
                  />
                )}
                <Button
                  secondary
                  title={dialog?.action ? "Cancel" : "Got it"}
                  onPress={() => setDialog(null)}
                />
              </Card>
            </View>
          </View>
        </Modal>
        <Modal
          visible={sharePreview}
          transparent
          animationType={effective.motion ? "fade" : "none"}
          onRequestClose={() => setSharePreview(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "#10202BDD",
              justifyContent: "center",
              alignItems: "center",
              padding: 12,
              gap: 14,
            }}
          >
            <ShareCard
              ref={shareRef}
              score={game.score}
              mode={
                official
                  ? "Server-validated Face-Off"
                  : resultMode || "Unranked practice"
              }
              seed={game.seed}
            />
            <Button
              title="Save / share PNG"
              onPress={() =>
                run(async () => {
                  await exportCard(
                    game.score,
                    official
                      ? "Server-validated Face-Off"
                      : resultMode || "Unranked practice",
                    game.seed,
                    shareRef,
                  );
                  setSharePreview(false);
                })
              }
            />
            <Button
              secondary
              title="Close preview"
              onPress={() => setSharePreview(false)}
            />
          </View>
        </Modal>
        <Modal visible={handoff} transparent={false} onRequestClose={() => {}}>
          <Design.Provider value={effective}>
            <SafeAreaView
              style={{
                flex: 1,
                backgroundColor: t.bg,
                justifyContent: "center",
                padding: 28,
              }}
            >
              <Card>
                <Tag>LOCAL FAMILY DUEL</Tag>
                <Txt size={32} bold>
                  Pass the phone.
                </Txt>
                <Txt>
                  Player 1’s attempt is saved and hidden. Player 2 gets a fresh
                  board with the same pieces. This is unranked family play.
                </Txt>
                <Button
                  title="Player 2 — I’m ready"
                  onPress={() => {
                    setGame(createGame(familyFirst!.seed, 30));
                    setFamilySecond(true);
                    setHandoff(false);
                    setSelected(-1);
                    setAnchor(null);
                  }}
                />
              </Card>
            </SafeAreaView>
          </Design.Provider>
        </Modal>
      </SafeAreaView>
    </Design.Provider>
  );
}
