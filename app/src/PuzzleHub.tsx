import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import { adEligible, BADGES } from "../../shared/competition";
import { createGame, finish } from "../../shared/engine";
import type { Game } from "../../shared/engine";
import {
  CPU_POLICY,
  CPU_TIERS,
  DAY,
  DIFFICULTIES,
  JOURNEY,
  TAGS,
  TITLES,
  cpuMove,
  dailyPuzzle,
  dayNumber,
  puzzleSolved,
  restoreDailyPuzzle,
  streakStats,
  weekNumber,
  weeklyGame,
} from "../../shared/puzzles";
import type { DisplayAwards, Puzzle, Tier } from "../../shared/puzzles";
import { RequestError, request } from "./api";
import { CpuReplay, ExtraBoard } from "./ExtraBoard";
import { FriendStreaks } from "./FriendStreaks";
import type { Friends } from "./FriendStreaks";
import { DailyTileStamp, ResultMark } from "./GameFeedback";
import { brand, radius, space, themes } from "./design";
import type { Settings } from "./design";
import { emptyProgress } from "./playProgress";
import type {
  DailyRun,
  PlayProgress,
  PuzzleRun,
  WeeklyRun,
} from "./playProgress";
import type { Profile } from "./storage";
import { storeBuild } from "./storage";
import { Button, Card, Row, Tag, Txt } from "./ui";

const sections = {
  daily: "Daily Puzzle",
  journey: "Journey",
  weekly: "Weekly Board",
  friends: "Friend streaks",
  awards: "Collection",
  cpu: "CPU Duel",
  open: "Open Table",
};
export type ExtraPanel = keyof typeof sections;
type Round =
  "daily" | "weekly" | "weekPractice" | "journey" | "cpu" | "open" | "practice";
type Stats = ReturnType<typeof streakStats>;
type Weekly = {
  week: number;
  deadline: number;
  game: Game;
  score: number | null;
  friends: { id: string; alias: string; score: number }[];
};
const blankStats = streakStats([], 0);
const seed = () => Math.floor(Math.random() * 0x100000000);
const date = (day: number) =>
  new Date(day * DAY).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
const cutoff = (at: number) =>
  new Date(at).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export function PuzzleHub({
  profile,
  panel,
  settings,
  server,
  now,
  update,
  online,
  navigate,
  onDragging,
  confirm,
  notify,
  themesPage,
  scrollToTop,
}: {
  profile: Profile;
  panel: ExtraPanel;
  settings: Settings;
  server: string;
  now: number;
  update: (data: PlayProgress) => void;
  online: () => Promise<string>;
  navigate: (panel: ExtraPanel) => void;
  onDragging: (active: boolean) => void;
  confirm: (
    title: string,
    text: string,
    label: string,
    onConfirm: () => void,
  ) => void;
  notify: (message: string, tone?: "success" | "error" | "info") => void;
  themesPage: () => void;
  scrollToTop: () => void;
}) {
  const progress = profile.extras ?? emptyProgress;
  const latest = useRef(progress);
  const mounted = useRef(false);
  const pending = useRef(false);
  const [round, setRound] = useState<Round>();
  const [journeyId, setJourneyId] = useState("");
  const [tier, setTier] = useState<Tier>(progress.cpu?.tier ?? "Starter");
  const [verified, setVerified] = useState(progress.verifiedDaily);
  const [mapPage, setMapPage] = useState(0);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [weekly, setWeekly] = useState<Weekly>();
  const [friends, setFriends] = useState<Friends>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [replaySide, setReplaySide] = useState<"You" | "CPU">();
  const t = themes[settings.theme];
  const { width } = useWindowDimensions();
  const mapTileWidth =
    settings.textSize >= 1.5 ? "30%" : width < 386 ? "24%" : "13.5%";
  const today = verified?.day ?? dayNumber(now);
  const stats = verified?.stats ?? blankStats;
  const localDay = dayNumber(now);
  const practiceStats = streakStats(progress.localDaily ?? [], localDay);
  const personalBest = Math.max(stats.best, practiceStats.best);
  const currentWeek = weekly?.week ?? weekNumber(today);
  const verifiedDays = new Set(stats.recent);
  const solvedJourney = JOURNEY.filter((puzzle) => {
    const run = progress.journey[puzzle.id];
    return run && puzzleSolved(run.puzzle, run.game);
  }).length;
  const verifiedFaceoff = !!profile.user?.badges?.includes("clean-duel");
  const hasCross =
    !!progress.crossing || profile.badges.includes("cross-clear");
  const adult = adEligible(profile.age);
  const onlineDaily =
    profile.age !== "7-12" || (!storeBuild && !!profile.user?.social);
  const verifiedOverview = !!profile.token && onlineDaily;
  const visibleStats = verifiedOverview ? stats : practiceStats;

  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  function save(patch: Partial<PlayProgress>) {
    if (!mounted.current) return;
    const next = { ...latest.current, ...patch };
    latest.current = next;
    update(next);
  }
  const onlineDay = dayNumber(now);
  const saveDailyStatus = useRef(
    (day: number, stats: Stats, archive: Record<number, string>) => {
      setVerified({ day, stats });
      const cached = latest.current.verifiedDaily;
      if (
        !cached ||
        cached.day !== day ||
        cached.stats.total !== stats.total ||
        cached.stats.current !== stats.current
      )
        save({
          verifiedDaily: { day, stats },
          dailyArchive: { ...latest.current.dailyArchive, ...archive },
        });
    },
  ).current;

  const { token } = profile;
  useEffect(() => {
    if (!token) return;
    let active = true;
    const call = (action: string) => request(server, token, action);
    if (onlineDaily && (panel === "daily" || panel === "awards"))
      call("puzzle.status")
        .then((result) => {
          if (active) {
            saveDailyStatus(result.today, result.stats, result.archive);
          }
        })
        .catch(() => {});
    if (adult && panel === "friends")
      call("friends.status")
        .then((result) => {
          if (active) setFriends(result);
        })
        .catch(() => {});
    if (adult && panel === "weekly")
      call("weekly.status")
        .then((result) => {
          if (active) setWeekly(result);
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [server, token, panel, adult, onlineDaily, onlineDay, saveDailyStatus]);

  const cpu = progress.cpu;
  function updateCpu(
    game: Game,
    opponent: Game,
    crossing = latest.current.crossing,
  ) {
    const current = latest.current;
    if (!current.cpu) return;
    const firstWin =
      !current.cpuWin &&
      game.done &&
      opponent.done &&
      game.score > opponent.score;
    const earnedAt = current.earnedAt ?? {};
    save({
      crossing,
      cpu: { ...current.cpu, game, cpu: opponent, firstWin },
      cpuWin: current.cpuWin || firstWin,
      earnedAt: {
        ...earnedAt,
        ...(firstWin && { cpu: Date.now() }),
        ...(!earnedAt.crossing && crossing && { crossing: Date.now() }),
      },
    });
    if (firstWin) notify("First CPU Win earned.");
  }
  useEffect(() => {
    if (
      round !== "cpu" ||
      !cpu ||
      cpu.cpu.done ||
      (!cpu.game.done && cpu.cpu.moves.length >= cpu.game.moves.length)
    )
      return;
    const timer = setTimeout(() => {
      const current = latest.current.cpu;
      if (current !== cpu) return;
      const opponent = cpuMove(current.cpu, current.tier);
      updateCpu(current.game, opponent);
    }, 20);
    return () => clearTimeout(timer);
  });

  async function perform(
    job: (
      call: (action: string, data?: unknown) => Promise<any>,
    ) => Promise<void>,
  ) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const session = await online();
      await job(async (action, data) => {
        if (!mounted.current) throw Error("The screen was closed.");
        const result = await request(server, session, action, data);
        if (!mounted.current) throw Error("The screen was closed.");
        return result;
      });
      return true;
    } catch (cause) {
      if (mounted.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "Online play is unavailable. Try again.",
        );
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  function openDaily(run: DailyRun) {
    const last = latest.current.daily;
    const archive = {
      ...latest.current.dailyArchive,
      [run.day]: run.puzzle.id,
    };
    if (last?.issued && (!archive[last.day] || last.day !== run.day))
      archive[last.day] = last.puzzle.id;
    const keys = Object.keys(archive)
      .map(Number)
      .sort((a, b) => b - a);
    save({
      daily: run,
      dailyArchive: Object.fromEntries(
        keys.slice(0, 91).map((day) => [day, archive[day]]),
      ),
    });
    setRound("daily");
  }
  function issueDaily() {
    void perform(async (call) => {
      const issued = await call("puzzle.issue", {
        difficulty: latest.current.difficulty,
      });
      saveDailyStatus(issued.day, issued.stats, issued.archive);
      const prior = latest.current.daily;
      const puzzle: Puzzle = issued.puzzle;
      if (issued.credited && prior?.puzzle.id !== puzzle.id) {
        save({ practice: { puzzle, game: puzzle.game } });
        setRound("practice");
        return;
      }
      openDaily({
        ...(prior?.issued && prior.puzzle.id === puzzle.id
          ? prior
          : { puzzle, game: puzzle.game }),
        day: issued.day,
        deadline: issued.deadline,
        issued: true,
        ...(issued.credited ? { credit: "verified" as const } : {}),
      });
    });
  }
  function dailyPractice(day: number, forToday = false) {
    const current = latest.current.daily;
    const puzzle =
      current?.day === day
        ? current.puzzle
        : (restoreDailyPuzzle(latest.current.dailyArchive[day]) ??
          dailyPuzzle(profile.id, day, latest.current.difficulty));
    save({
      practice: {
        puzzle,
        game: puzzle.game,
        ...(forToday && { practiceDay: day }),
      },
    });
    setRound("practice");
  }
  function submitDaily(run: DailyRun) {
    void perform(async (call) => {
      try {
        const result = await call("puzzle.complete", {
          day: run.day,
          id: run.puzzle.id,
          moves: run.game.moves,
        });
        save({ daily: { ...run, credit: "verified" } });
        saveDailyStatus(result.today, result.stats, result.archive);
      } catch (cause) {
        if (
          cause instanceof RequestError &&
          cause.message.includes("deadline passed")
        )
          save({ daily: { ...run, credit: "practice" } });
        throw cause;
      }
    });
  }
  function refreshWeekly(start: boolean) {
    void perform(async (call) => {
      const result: Weekly = await call("weekly.status");
      setWeekly(result);
      if (!start) return;
      const prior = latest.current.weekly;
      if (result.score !== null) {
        weeklyPractice(result.week);
        return;
      }
      save({
        weekly:
          prior?.week === result.week && !prior.practice
            ? prior
            : {
                week: result.week,
                deadline: result.deadline,
                game: result.game,
                practice: result.score !== null,
              },
      });
      setRound("weekly");
    });
  }
  function weeklyPractice(week: number) {
    const existing = latest.current.weeklyPractice;
    if (!existing || existing.week !== week || existing.game.done)
      save({
        weeklyPractice: {
          game: weeklyGame(week),
          week,
          deadline: (week + 7) * DAY,
          practice: true,
        },
      });
    setRound("weekPractice");
  }
  function submitWeekly(run: WeeklyRun) {
    void perform(async (call) => {
      try {
        const result = await call("weekly.submit", {
          week: run.week,
          moves: run.game.moves,
        });
        save({ weekly: { ...run, verified: result.score } });
        setWeekly((current) =>
          current?.week === run.week
            ? { ...current, score: result.score }
            : current,
        );
      } catch (cause) {
        if (
          cause instanceof RequestError &&
          cause.message.includes("board has closed")
        )
          save({ weekly: { ...run, practice: true } });
        throw cause;
      }
    });
  }
  function friendAction(action: string, data?: Record<string, unknown>) {
    return perform(async (call) => {
      if (action !== "friends.status") await call(action, data);
      setFriends(await call("friends.status"));
      if (action === "friends.join") notify("Friend connected.");
      if (action === "friends.remove") notify("Friend removed.");
    });
  }
  function chooseDisplay(display: DisplayAwards) {
    save({ equipped: display });
  }
  function startCpu(nextTier: Tier) {
    const game = createGame(seed(), 30);
    save({
      cpu: {
        game,
        cpu: createGame(game.seed, 30),
        tier: nextTier,
        policy: CPU_POLICY,
      },
    });
    setReplaySide(undefined);
    setRound("cpu");
  }
  function startOpen() {
    if (!latest.current.open)
      save({ open: { game: createGame(seed()), chapters: 0, lines: 0 } });
    setRound("open");
  }
  function nextChapter() {
    const previous = latest.current.open;
    if (!previous) return;
    save({
      open: {
        game: createGame(seed()),
        chapters: previous.chapters + 1,
        lines: previous.lines + previous.game.lines,
        history: [
          ...(previous.history ?? []),
          { score: previous.game.score, lines: previous.game.lines },
        ].slice(-12),
      },
    });
  }
  function updateGame(game: Game, assisted?: boolean) {
    const current = latest.current;
    const crossing = current.crossing || game.cross;
    const earnedAt = { ...current.earnedAt };
    if (
      !current.crossing &&
      game.cross &&
      !profile.badges.includes("cross-clear")
    )
      notify("Monsoon Tile unlocked.");
    if (!current.crossing && game.cross) earnedAt.crossing = Date.now();
    if (round === "cpu" && current.cpu) {
      updateCpu(game, current.cpu.cpu, crossing);
    } else if (round === "open" && current.open) {
      save({ crossing, earnedAt, open: { ...current.open, game } });
    } else if (round === "weekly" && current.weekly) {
      save({ crossing, earnedAt, weekly: { ...current.weekly, game } });
    } else if (round === "weekPractice" && current.weeklyPractice) {
      save({
        crossing,
        earnedAt,
        weeklyPractice: { ...current.weeklyPractice, game },
      });
    } else if (round === "journey") {
      const prior = current.journey[journeyId];
      const completed =
        !puzzleSolved(prior.puzzle, prior.game) &&
        puzzleSolved(prior.puzzle, game);
      if (completed && solvedJourney === JOURNEY.length - 1) {
        earnedAt.journey ??= Date.now();
        notify("Trailblazer and Kiln & Clay unlocked.");
      }
      save({
        crossing,
        earnedAt,
        journey: {
          ...current.journey,
          [journeyId]: { ...prior, game, assisted: prior.assisted || assisted },
        },
      });
    } else if (round === "daily" && current.daily) {
      save({
        crossing,
        earnedAt,
        daily: {
          ...current.daily,
          game,
          assisted: current.daily.assisted || assisted,
        },
      });
    } else if (round === "practice" && current.practice) {
      const day = current.practice.practiceDay;
      const days = current.localDaily ?? [];
      const earnedPractice =
        day === localDay &&
        !days.includes(day) &&
        puzzleSolved(current.practice.puzzle, game);
      save({
        crossing,
        earnedAt,
        ...(earnedPractice && { localDaily: [...days, day] }),
        practice: {
          ...current.practice,
          game,
          assisted: current.practice.assisted || assisted,
        },
      });
    }
  }
  function resetPuzzle(run: PuzzleRun) {
    const current = latest.current;
    setAttempt((previous) => previous + 1);
    if (round === "daily" && current.daily && !current.daily.credit) {
      if (!puzzleSolved(run.puzzle, run.game)) {
        save({
          daily: { ...current.daily, game: run.puzzle.game, assisted: false },
        });
        return;
      }
    }
    const practiceDay =
      round === "practice" && !puzzleSolved(run.puzzle, run.game)
        ? run.practiceDay
        : undefined;
    save({
      practice: { puzzle: run.puzzle, game: run.puzzle.game, practiceDay },
    });
    if (round === "journey" && !puzzleSolved(run.puzzle, run.game))
      save({
        journey: {
          ...current.journey,
          [journeyId]: { puzzle: run.puzzle, game: run.puzzle.game },
        },
      });
    else setRound("practice");
  }

  const run =
    round === "journey"
      ? progress.journey[journeyId]
      : round === "daily"
        ? progress.daily
        : round === "practice"
          ? progress.practice
          : undefined;
  const weeklyRun =
    round === "weekPractice" ? progress.weeklyPractice : progress.weekly;
  const game =
    run?.game ??
    (round === "cpu"
      ? cpu?.game
      : round === "weekly" || round === "weekPractice"
        ? weeklyRun?.game
        : round === "open"
          ? progress.open?.game
          : undefined);
  const solved = !!run && puzzleSolved(run.puzzle, run.game);
  const result = solved || !!game?.done;
  useLayoutEffect(() => {
    scrollToTop();
  }, [panel, round, result, game?.seed, scrollToTop]);
  const daily = progress.daily;
  const open = progress.open;
  const errorMessage = error ? (
    <Txt accessibilityRole="alert" style={{ color: t.danger }}>
      {error}
    </Txt>
  ) : null;
  if (round && game) {
    const title =
      run?.puzzle.title ??
      (round === "cpu"
        ? `${cpu?.tier} CPU`
        : round === "weekPractice"
          ? "Weekly Board"
          : round === "practice"
            ? "Puzzle practice"
            : sections[round]);
    const backLabel = `Back to ${sections[panel]}`;
    const leaveRound = () => {
      setRound(undefined);
      setReplaySide(undefined);
      setError("");
    };
    const label =
      round === "cpu"
        ? "CPU PRACTICE"
        : round === "open"
          ? `CHAPTER ${(open?.chapters ?? 0) + 1}`
          : round === "practice" || round === "weekPractice"
            ? "PRACTICE"
            : "";
    return (
      <>
        <Row style={{ flexWrap: "nowrap", alignItems: "center" }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            onPress={leaveRound}
            disabled={busy}
            style={({ pressed }) => ({
              minWidth: 48,
              minHeight: 48,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.button,
              borderWidth: 1,
              borderColor: t.border,
              backgroundColor: pressed ? t.soft : t.surface,
            })}
          >
            <Txt bold size={19} aria-hidden>
              ←
            </Txt>
          </Pressable>
          <View style={{ flex: 1, minWidth: 0, gap: space.xs }}>
            {!!label && <Tag>{label}</Tag>}
            <Txt display size={26}>
              {title}
            </Txt>
          </View>
        </Row>
        {(round === "weekly" || round === "weekPractice") && weeklyRun && (
          <Txt muted>
            {weeklyRun.practice
              ? `Practice · Week of ${date(weeklyRun.week)}`
              : `Submit by ${cutoff(weeklyRun.deadline)}`}
          </Txt>
        )}
        {round === "daily" && daily && !daily.credit && (
          <Txt muted>Submit by {cutoff(daily.deadline)} (local time).</Txt>
        )}
        {errorMessage}
        {result ? (
          <Card>
            <Row style={{ justifyContent: "space-between" }}>
              <Txt display size={30}>
                {solved
                  ? "Puzzle solved."
                  : round === "cpu" && cpu
                    ? !cpu.cpu.done
                      ? "CPU is finishing…"
                      : game.score === cpu.cpu.score
                        ? "An even match."
                        : game.score > cpu.cpu.score
                          ? "You won."
                          : "CPU wins."
                    : round === "open"
                      ? "Chapter complete."
                      : run
                        ? "Try a new approach."
                        : "Board complete."}
              </Txt>
              {(solved || round !== "cpu" || cpu?.cpu.done) && (
                <ResultMark enabled={settings.motion} />
              )}
            </Row>
            <Txt>
              {game.score.toLocaleString()} points · {game.lines}{" "}
              {game.lines === 1 ? "line" : "lines"}
            </Txt>
            {round === "cpu" && cpu && (
              <>
                <Txt accessibilityLiveRegion="polite">
                  {cpu.tier} CPU · {cpu.cpu.score.toLocaleString()} points
                </Txt>
                {cpu.cpu.done && (
                  <>
                    {cpu.firstWin && <Tag>FIRST CPU WIN · EARNED</Tag>}
                    <Txt muted size={13}>
                      Opponent policy {cpu.policy}
                    </Txt>
                    <Row>
                      <Button
                        secondary
                        title="Review my moves"
                        onPress={() => setReplaySide("You")}
                      />
                      <Button
                        secondary
                        title="Review CPU moves"
                        onPress={() => setReplaySide("CPU")}
                      />
                      <Button
                        title="Rematch"
                        onPress={() => startCpu(cpu.tier)}
                      />
                    </Row>
                    {replaySide && (
                      <CpuReplay
                        key={replaySide}
                        game={replaySide === "CPU" ? cpu.cpu : game}
                        settings={settings}
                        label={replaySide}
                      />
                    )}
                  </>
                )}
              </>
            )}
            {run?.assisted && <Tag>ASSIST USED</Tag>}
            {round === "daily" &&
              solved &&
              daily &&
              (daily.credit === "verified" ? (
                <DailyTileStamp settings={settings} day={date(daily.day)} />
              ) : daily.credit === "practice" ? (
                <Txt>Saved as practice.</Txt>
              ) : (
                <Button
                  title={busy ? "Verifying…" : "Verify my solve"}
                  disabled={busy}
                  onPress={() => submitDaily(daily)}
                />
              ))}
            {round === "journey" && solved && (
              <Txt bold>Journey tile earned.</Txt>
            )}
            {round === "practice" &&
              solved &&
              run?.practiceDay !== undefined &&
              progress.localDaily?.includes(run.practiceDay) && (
                <Txt bold accessibilityLiveRegion="polite">
                  Practice tile earned.
                </Txt>
              )}
            {run && (
              <Button
                secondary
                title={solved ? "Replay as practice" : "Try again"}
                disabled={busy}
                onPress={() => resetPuzzle(run)}
              />
            )}
            {(round === "weekly" || round === "weekPractice") &&
              weeklyRun &&
              (weeklyRun.practice ? (
                <Txt>Practice score saved on this board.</Txt>
              ) : weeklyRun.verified !== undefined ? (
                <Txt bold accessibilityLiveRegion="polite">
                  Verified score · {weeklyRun.verified.toLocaleString()}
                </Txt>
              ) : (
                <Button
                  title={busy ? "Verifying…" : "Verify weekly score"}
                  disabled={busy}
                  onPress={() => submitWeekly(weeklyRun)}
                />
              ))}
            {round === "open" && (
              <Button title="Start next chapter" onPress={nextChapter} />
            )}
          </Card>
        ) : (
          <>
            <ExtraBoard
              key={`${round}-${game.seed}-${attempt}`}
              game={game}
              settings={settings}
              puzzle={run?.puzzle}
              opponentScore={round === "cpu" ? cpu?.cpu.score : undefined}
              update={updateGame}
              onDragging={onDragging}
            />
            {run && (
              <Button
                secondary
                title="Restart puzzle"
                onPress={() =>
                  confirm(
                    "Restart this puzzle?",
                    "Placements for this attempt will be cleared.",
                    "Restart puzzle",
                    () => resetPuzzle(run),
                  )
                }
              />
            )}
            {round === "open" && (
              <Button
                secondary
                title="Close this chapter"
                disabled={game.moves.length === 0}
                onPress={() =>
                  confirm(
                    "Close this chapter?",
                    "This chapter’s points and lines will be saved. You can start another board from the result.",
                    "Close chapter",
                    () => updateGame(finish(game)),
                  )
                }
              />
            )}
          </>
        )}
      </>
    );
  }

  return (
    <>
      {panel !== "cpu" && panel !== "open" && (
        <View style={{ gap: space.sm }}>
          {settings.textSize >= 1.5 && (
            <Button
              secondary
              title={
                modeMenuOpen ? "Close puzzle modes" : "Browse puzzle modes"
              }
              onPress={() => setModeMenuOpen((open) => !open)}
            />
          )}
          {(settings.textSize < 1.5 || modeMenuOpen) &&
            (
              [
                ["daily", "journey", "weekly"],
                ["friends", "awards"],
              ] as ExtraPanel[][]
            ).map((group) => (
              <Row key={group[0]} style={{ gap: space.sm }}>
                {group
                  .filter(
                    (item) =>
                      adult || (item !== "friends" && item !== "weekly"),
                  )
                  .map((item) => {
                    const active = item === panel;
                    return (
                      <Pressable
                        key={item}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        disabled={busy && !active}
                        onPress={() => {
                          if (!active) {
                            setError("");
                            setModeMenuOpen(false);
                            navigate(item);
                          }
                        }}
                        style={({ pressed }) => ({
                          flexGrow: group.length === 3 ? 1 : 0,
                          flexShrink: 1,
                          minHeight: 48,
                          justifyContent: "center",
                          alignItems: "center",
                          paddingVertical: space.sm,
                          paddingHorizontal: space.md,
                          borderRadius: radius.field,
                          backgroundColor: active
                            ? t.action
                            : pressed
                              ? t.soft
                              : t.surface,
                          borderWidth: 1,
                          borderColor: active ? t.action : t.border,
                        })}
                      >
                        <Txt
                          bold
                          size={14}
                          style={{
                            textAlign: "center",
                            color: active ? t.onAction : t.text,
                          }}
                        >
                          {sections[item]}
                        </Txt>
                      </Pressable>
                    );
                  })}
              </Row>
            ))}
        </View>
      )}
      {errorMessage}
      {panel === "daily" && (
        <>
          <Card
            style={{
              backgroundColor:
                settings.theme === "contrast" ? t.surface : brand.ink,
              borderColor:
                settings.theme === "contrast" ? t.border : brand.seam,
              borderRadius: radius.hero,
              padding: space.xl,
            }}
          >
            <Txt
              display
              size={36}
              style={{
                color: settings.theme === "contrast" ? t.text : brand.paper,
              }}
            >
              Daily Puzzle
            </Txt>
            <Txt
              style={{
                color: settings.theme === "contrast" ? t.muted : brand.quiet,
              }}
            >
              A short, untimed puzzle picked for you. Solve with or without
              hints to earn a map tile.
            </Txt>
            <Txt
              size={12}
              bold
              style={{
                color: settings.theme === "contrast" ? t.muted : brand.quiet,
              }}
            >
              {verifiedOverview ? "Verified progress" : "Practice progress"}
            </Txt>
            <Row style={{ gap: space.lg }}>
              {[
                [visibleStats.current, "Current streak"],
                [visibleStats.best, "Best streak"],
                [visibleStats.total, "Days solved"],
              ].map(([value, label]) => (
                <View key={label} style={{ flexGrow: 1, minWidth: 76 }}>
                  <Txt
                    display
                    size={30}
                    style={{
                      color:
                        settings.theme === "contrast" ? t.brand : brand.accent,
                    }}
                  >
                    {value}
                  </Txt>
                  <Txt
                    size={13}
                    style={{
                      color:
                        settings.theme === "contrast" ? t.text : brand.paper,
                    }}
                  >
                    {label}
                  </Txt>
                </View>
              ))}
            </Row>
            {onlineDaily && (
              <Button
                title={
                  busy
                    ? "Opening…"
                    : verifiedDays.has(today)
                      ? "Review today’s puzzle"
                      : "Open today’s puzzle"
                }
                disabled={busy}
                onPress={() => {
                  issueDaily();
                }}
              />
            )}
            {daily?.issued &&
              (daily.credit !== "verified" || daily.day !== today) && (
                <Button
                  secondary
                  title="Resume saved daily puzzle"
                  disabled={busy}
                  onPress={() => setRound("daily")}
                />
              )}
            <Button
              secondary
              title="Play today in practice"
              disabled={busy}
              onPress={() => dailyPractice(localDay, true)}
            />
            {progress.practice?.puzzle.id.startsWith("daily/") &&
              !progress.practice.game.done &&
              !puzzleSolved(
                progress.practice.puzzle,
                progress.practice.game,
              ) && (
                <Button
                  secondary
                  title="Resume daily practice"
                  disabled={busy}
                  onPress={() => setRound("practice")}
                />
              )}
            {verifiedOverview && practiceStats.total > 0 && (
              <Txt
                size={13}
                style={{
                  color: settings.theme === "contrast" ? t.muted : brand.quiet,
                }}
              >
                Practice · {practiceStats.current} day streak ·{" "}
                {practiceStats.total} puzzles solved
              </Txt>
            )}
          </Card>
          <Card>
            <Txt size={22} bold>
              Daily map
            </Txt>
            <Txt muted>
              {onlineDaily
                ? "Verify one solve before midnight UTC to earn a tile. Tap an earlier day for practice."
                : "Solve today’s practice board to earn a local tile. Tap an earlier day to explore."}
            </Txt>
            <Row style={{ gap: 2 }}>
              {Array.from(
                { length: 7 },
                (_, i) => today - 6 - mapPage * 7 + i,
              ).map((day) => {
                const earned = verifiedDays.has(day);
                const practised = practiceStats.recent.includes(day);
                return (
                  <Pressable
                    key={day}
                    accessibilityRole="button"
                    accessibilityLabel={`${date(day)}${earned ? ", verified" : practised ? ", practice solved" : day === today ? ", today" : ", archived practice"}`}
                    disabled={busy}
                    onPress={() => {
                      if (day === today && onlineDaily) {
                        if (daily?.day === today && daily.issued)
                          setRound("daily");
                        else issueDaily();
                      } else
                        dailyPractice(day, day === localDay && day === today);
                    }}
                    style={({ pressed }) => ({
                      flexBasis: mapTileWidth,
                      minWidth: 44,
                      minHeight: 58,
                      padding: space.xs,
                      borderRadius: radius.field,
                      borderWidth: day === today ? 2 : 1,
                      borderColor: day === today ? t.brand : t.border,
                      backgroundColor: earned
                        ? t.action
                        : pressed
                          ? t.soft
                          : practised
                            ? t.soft
                            : t.surface,
                      justifyContent: "center",
                      alignItems: "center",
                    })}
                  >
                    <Txt
                      aria-hidden
                      bold
                      style={{ color: earned ? t.onAction : t.text }}
                    >
                      {earned
                        ? "✓"
                        : practised
                          ? "◇"
                          : day === today
                            ? "◆"
                            : "·"}
                    </Txt>
                    <Txt
                      size={12}
                      style={{ color: earned ? t.onAction : t.text }}
                    >
                      {new Date(day * DAY).getUTCDate()}
                    </Txt>
                  </Pressable>
                );
              })}
            </Row>
            <Txt muted size={13}>
              {date(today - 6 - mapPage * 7)} – {date(today - mapPage * 7)} · ✓
              Verified · ◇ Practice
            </Txt>
            <Row>
              <Button
                secondary
                title="Earlier days"
                disabled={mapPage === 12}
                onPress={() => setMapPage((value) => value + 1)}
              />
              {mapPage > 0 && (
                <Button
                  secondary
                  title="Recent days"
                  onPress={() => setMapPage((value) => value - 1)}
                />
              )}
            </Row>
          </Card>
          <Card>
            <Txt size={22} bold>
              Puzzle difficulty
            </Txt>
            <Txt muted>
              Your choice applies to the next puzzle issued to you.
            </Txt>
            <Row>
              {DIFFICULTIES.map((label, difficulty) => (
                <Button
                  key={label}
                  title={label}
                  secondary={progress.difficulty !== difficulty}
                  onPress={() => save({ difficulty })}
                  disabled={busy}
                />
              ))}
            </Row>
          </Card>
        </>
      )}
      {panel === "journey" && (
        <>
          <Txt size={36} display>
            Journey
          </Txt>
          <Txt muted>
            Six untimed boards for learning new ways to clear space.{" "}
            {solvedJourney} of {JOURNEY.length} complete.
          </Txt>
          {JOURNEY.map((puzzle, i) => {
            const prior = progress.journey[puzzle.id];
            const complete = prior && puzzleSolved(puzzle, prior.game);
            return (
              <Card key={puzzle.id}>
                <Tag>{complete ? "COMPLETED" : `PUZZLE ${i + 1}`}</Tag>
                <Txt size={23} bold>
                  {puzzle.title}
                </Txt>
                <Txt muted>{puzzle.brief}</Txt>
                <Button
                  secondary={!!complete}
                  title={
                    complete
                      ? `Replay ${puzzle.title}`
                      : prior
                        ? `Resume ${puzzle.title}`
                        : `Play ${puzzle.title}`
                  }
                  onPress={() => {
                    if (complete) {
                      save({ practice: { puzzle, game: puzzle.game } });
                      setRound("practice");
                    } else {
                      if (!prior)
                        save({
                          journey: {
                            ...latest.current.journey,
                            [puzzle.id]: { puzzle, game: puzzle.game },
                          },
                        });
                      setJourneyId(puzzle.id);
                      setRound("journey");
                    }
                  }}
                />
              </Card>
            );
          })}
        </>
      )}
      {panel === "friends" && adult && (
        <FriendStreaks
          state={friends}
          busy={busy}
          action={friendAction}
          confirm={confirm}
          notify={notify}
        />
      )}
      {panel === "weekly" && adult && (
        <>
          <Card>
            <Txt size={34} display>
              Weekly Board
            </Txt>
            <Txt muted>
              Everyone gets the same pieces and 30 placements. Each player can
              verify one result before the new board arrives on Monday at
              midnight UTC.
            </Txt>
            {weekly && (
              <Txt>Closes {cutoff(weekly.deadline)} (local time).</Txt>
            )}
            {weekly?.score != null && (
              <Tag>{`VERIFIED · ${weekly.score.toLocaleString()} POINTS`}</Tag>
            )}
            <Button
              title={
                busy
                  ? "Opening…"
                  : weekly?.score != null
                    ? "Replay current board"
                    : "Open this week’s board"
              }
              disabled={busy}
              onPress={() => refreshWeekly(true)}
            />
            {weeklyRun && (
              <Button
                secondary
                title="Resume saved Weekly Board"
                disabled={busy}
                onPress={() => setRound("weekly")}
              />
            )}
            {progress.weeklyPractice && (
              <Button
                secondary
                title="Resume weekly practice"
                disabled={busy}
                onPress={() => setRound("weekPractice")}
              />
            )}
            <Button
              secondary
              title="Refresh Weekly Board"
              disabled={busy}
              onPress={() => refreshWeekly(false)}
            />
          </Card>
          <Card>
            <Txt size={22} bold>
              Friends this week
            </Txt>
            {weekly?.friends.length ? (
              weekly.friends.map((friend) => (
                <Row
                  key={friend.id}
                  style={{ justifyContent: "space-between" }}
                >
                  <Txt bold>{friend.alias}</Txt>
                  <Txt>{friend.score.toLocaleString()} pts</Txt>
                </Row>
              ))
            ) : (
              <Txt muted>Shared scores from connected friends appear here.</Txt>
            )}
          </Card>
          <Card>
            <Txt size={22} bold>
              Past boards
            </Txt>
            <Txt muted>Replay last month’s boards at your own pace.</Txt>
            <Row>
              {[1, 2, 3, 4].map((offset) => {
                const week = currentWeek - offset * 7;
                return (
                  <Button
                    key={week}
                    secondary
                    title={`Week of ${date(week)}`}
                    onPress={() => weeklyPractice(week)}
                    disabled={busy}
                  />
                );
              })}
            </Row>
          </Card>
        </>
      )}
      {panel === "awards" && (
        <>
          <Card>
            <Txt size={34} display>
              Your collection
            </Txt>
            <Txt muted>
              Equip one title and up to two tags. Choose which verified awards
              to share with connected friends.
            </Txt>
            <Row>
              {TITLES.filter(([id]) => progress.equipped.title === id).map(
                ([id, label]) => (
                  <Tag key={id}>{label}</Tag>
                ),
              )}
              {TAGS.filter(([id]) => progress.equipped.tags.includes(id)).map(
                ([id, label]) => (
                  <Tag key={id}>{label}</Tag>
                ),
              )}
            </Row>
            {token && adult && (
              <Button
                secondary
                title={busy ? "Saving…" : "Save awards for friends"}
                disabled={busy}
                onPress={() => {
                  void perform(async (call) => {
                    await call("friends.display", latest.current.equipped);
                    notify("Verified awards updated for friend sharing.");
                  });
                }}
              />
            )}
            <Button
              secondary
              title="Open cosmetic studio"
              onPress={themesPage}
            />
          </Card>
          <Txt size={24} bold>
            Titles
          </Txt>
          {TITLES.map(([id, name, brief]) => {
            const target =
              id === "journey" ? JOURNEY.length : id === "week" ? 7 : 30;
            const value = id === "journey" ? solvedJourney : personalBest;
            const equipped = progress.equipped.title === id;
            const earned =
              id === "journey"
                ? progress.earnedAt?.journey
                : id === "week"
                  ? (stats.seven ?? practiceStats.seven) == null
                    ? undefined
                    : (stats.seven ?? practiceStats.seven)! * DAY
                  : (stats.thirty ?? practiceStats.thirty) == null
                    ? undefined
                    : (stats.thirty ?? practiceStats.thirty)! * DAY;
            return (
              <Card key={id}>
                <Txt size={22} bold>
                  {name}
                </Txt>
                <Txt muted>{brief}</Txt>
                <Tag>
                  {value >= target
                    ? id === "journey"
                      ? "EARNED · JOURNEY"
                      : stats.best >= target
                        ? "EARNED · VERIFIED"
                        : "EARNED · PRACTICE"
                    : `${value}/${target}`}
                </Tag>
                {earned !== undefined && (
                  <Txt muted size={13}>
                    Earned {date(dayNumber(earned))}
                  </Txt>
                )}
                {value >= target && (
                  <Button
                    secondary
                    title={`${equipped ? "Remove" : "Equip"} ${name}`}
                    onPress={() =>
                      chooseDisplay({
                        ...progress.equipped,
                        title: equipped ? "" : id,
                      })
                    }
                  />
                )}
              </Card>
            );
          })}
          <Txt size={24} bold>
            Tags
          </Txt>
          {TAGS.map(([id, name, brief]) => {
            const unlocked =
              id === "streak"
                ? personalBest >= 7
                : id === "cpu"
                  ? progress.cpuWin
                  : verifiedFaceoff;
            const equipped = progress.equipped.tags.includes(id);
            return (
              <Card key={id}>
                <Txt size={22} bold>
                  {name}
                </Txt>
                <Txt muted>{brief}</Txt>
                <Tag>
                  {unlocked
                    ? id === "cpu" || (id === "streak" && stats.best < 7)
                      ? "EARNED · PRACTICE"
                      : "EARNED · VERIFIED"
                    : "IN PROGRESS"}
                </Tag>
                {unlocked && (
                  <Button
                    secondary
                    title={`${equipped ? "Remove" : "Equip"} ${name}`}
                    disabled={!equipped && progress.equipped.tags.length >= 2}
                    onPress={() =>
                      chooseDisplay({
                        ...progress.equipped,
                        tags: equipped
                          ? progress.equipped.tags.filter((tag) => tag !== id)
                          : [...progress.equipped.tags, id],
                      })
                    }
                  />
                )}
              </Card>
            );
          })}
          <Txt size={24} bold>
            Achievements
          </Txt>
          {[
            ...BADGES.map(
              ([id, name, brief]) =>
                [
                  name,
                  brief,
                  id === "cross-clear"
                    ? hasCross
                    : profile.badges.includes(id) ||
                      profile.user?.badges?.includes(id),
                  id === "cross-clear"
                    ? progress.earnedAt?.crossing
                    : undefined,
                ] as const,
            ),
            [
              "Mapmaker",
              "Verify your first daily solve.",
              stats.total > 0,
              stats.first == null ? undefined : stats.first * DAY,
            ] as const,
            [
              "First CPU Win",
              "Finish a CPU Duel with a higher score.",
              progress.cpuWin,
              progress.earnedAt?.cpu,
            ] as const,
            [
              "Trail complete",
              "Finish every Journey board. Unlocks Kiln & Clay.",
              solvedJourney === JOURNEY.length,
              progress.earnedAt?.journey,
            ] as const,
          ].map(([name, brief, unlocked, earned]) => (
            <Card key={name}>
              <Txt size={21} bold>
                {name}
              </Txt>
              <Txt muted>{brief}</Txt>
              <Tag>{unlocked ? "EARNED" : "IN PROGRESS"}</Tag>
              {earned !== undefined && (
                <Txt muted size={13}>
                  Earned {date(dayNumber(earned))}
                </Txt>
              )}
            </Card>
          ))}
        </>
      )}
      {panel === "cpu" && (
        <Card>
          <Tag>OFFLINE PRACTICE</Tag>
          <Txt size={34} display>
            CPU Duel
          </Txt>
          <Txt muted>
            Play an untimed match against a CPU on separate boards. You receive
            the same pieces, with up to 30 placements each. Equal scores draw.
          </Txt>
          {cpu && (
            <Button
              secondary
              title={cpu.game.done ? "Review last CPU Duel" : "Resume CPU Duel"}
              onPress={() => setRound("cpu")}
            />
          )}
          <Txt size={20} bold>
            Choose an opponent
          </Txt>
          <Row>
            {CPU_TIERS.map((item) => (
              <Button
                key={item}
                title={item}
                secondary={tier !== item}
                onPress={() => setTier(item)}
              />
            ))}
          </Row>
          <Txt muted>
            {tier === "Starter"
              ? "Makes simple legal placements."
              : tier === "Planner"
                ? "Looks for immediate points and clears."
                : "Keeps placements compact and protects room for the rest of the tray."}
          </Txt>
          <Button
            title={`Play ${tier} CPU`}
            onPress={() => {
              if (cpu && !cpu.game.done && cpu.game.moves.length)
                confirm(
                  "Start a new CPU Duel?",
                  "This replaces your current CPU match.",
                  "Start new match",
                  () => startCpu(tier),
                );
              else startCpu(tier);
            }}
          />
        </Card>
      )}
      {panel === "open" && (
        <Card>
          <Tag>UNTIMED · UNRANKED</Tag>
          <Txt size={34} display>
            Open Table
          </Txt>
          <Txt muted>
            Play as many chapters as you like. Each starts with an empty board
            and carries forward your chapter and line totals. You can leave and
            resume anytime.
          </Txt>
          <Txt bold>
            {(open?.chapters ?? 0) + Number(!!open?.game.done)} chapters ·{" "}
            {(open?.lines ?? 0) + (open?.game.lines ?? 0)} lines
          </Txt>
          <Button
            title={
              open?.game.done
                ? "View chapter result"
                : open
                  ? "Resume Open Table"
                  : "Start Open Table"
            }
            onPress={startOpen}
          />
          {!!open?.history?.length && (
            <>
              <Txt size={22} bold>
                Recent chapters
              </Txt>
              {open.history
                .slice()
                .reverse()
                .map((chapter, i) => (
                  <Row key={i} style={{ justifyContent: "space-between" }}>
                    <Txt>Chapter {open.chapters - i}</Txt>
                    <Txt>
                      {chapter.score.toLocaleString()} pts · {chapter.lines}{" "}
                      lines
                    </Txt>
                  </Row>
                ))}
            </>
          )}
        </Card>
      )}
    </>
  );
}
