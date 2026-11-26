import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  PanResponder,
  StyleSheet,
  AccessibilityInfo,
} from "react-native";
import { piece, colour, fits } from "../../shared/engine";
import type { Game } from "../../shared/engine";
import { themes, palettes, motionSpec } from "./design";
import type { Settings } from "./design";
import { animate } from "./motion";
import { Txt } from "./ui";
type Props = {
  game: Game;
  settings: Settings;
  selected: number;
  setSelected: (s: number) => void;
  anchor: [number, number] | null;
  setAnchor: (p: [number, number] | null) => void;
  disabled?: boolean;
  onDragging?: (b: boolean) => void;
  small?: boolean;
};
const symbols = ["", "●", "╱", "◆", "＋", "•", "╳"];
const boardInset = 8;
export function MiniPiece({
  seed,
  index,
  beginner,
  settings,
  size = 18,
}: {
  seed: number;
  index: number;
  beginner?: boolean;
  settings: Settings;
  size?: number;
}) {
  const shape = piece(seed, index, beginner),
    w = Math.max(...shape.map((p) => p[1])) + 1,
    h = Math.max(...shape.map((p) => p[0])) + 1,
    color = palettes[settings.palette][colour(seed, index) - 1];
  return (
    <View pointerEvents="none" style={{ width: w * size, height: h * size }}>
      {shape.map(([r, c]) => (
        <View
          key={`${r}-${c}`}
          style={{
            position: "absolute",
            left: c * size,
            top: r * size,
            width: size - 2,
            height: size - 2,
            backgroundColor: color,
            borderRadius: 4,
            borderTopWidth: 2,
            borderTopColor: "#FFFFFF66",
            borderBottomWidth: 2,
            borderBottomColor: "#00000018",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {settings.patterns && (
            <Text
              style={{ fontSize: Math.max(8, size * 0.55), color: "#152A32" }}
            >
              {symbols[colour(seed, index)]}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}
function TrayPiece({
  i,
  index,
  game,
  settings,
  selected,
  select,
  drag,
  disabled,
}: {
  i: number;
  index: number | null;
  game: Game;
  settings: Settings;
  selected: number;
  select: (i: number) => void;
  drag: (x: number, y: number, active: boolean, s: number) => void;
  disabled?: boolean;
}) {
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: (_, g) =>
          !disabled && Math.abs(g.dx) + Math.abs(g.dy) > 6,
        onPanResponderGrant: () => select(i),
        onPanResponderMove: (_, g) => drag(g.moveX, g.moveY, true, i),
        onPanResponderRelease: (_, g) => drag(g.moveX, g.moveY, false, i),
        onPanResponderTerminate: () => drag(0, 0, false, i),
      }),
    [disabled, drag, i, select],
  );
  const [lift] = useState(() => new Animated.Value(0));
  const chosen = selected === i && index !== null;
  const motion = settings.motion && !settings.lowEffects;
  useLayoutEffect(() => {
    if (!motion) {
      lift.setValue(0);
      return;
    }
    const animation = animate(lift, chosen ? 1 : 0, motionSpec.release);
    animation.start();
    return () => animation.stop();
  }, [chosen, lift, motion]);
  const t = themes[settings.theme];
  return (
    <Pressable
      testID={`piece-${i}`}
      accessibilityRole="button"
      accessibilityLabel={`Piece ${i + 1}${index === null ? ", used" : `, ${piece(game.seed, index, game.beginner).length} cells`}`}
      accessibilityState={{
        selected: selected === i,
        disabled: disabled || index === null,
      }}
      disabled={disabled || index === null}
      onPress={() => select(i)}
      {...(index !== null ? pan.panHandlers : {})}
      style={[
        styles.slot,
        {
          borderColor: chosen ? t.brand : t.border,
          backgroundColor: chosen ? t.soft : t.surface,
          opacity: index === null ? 0.68 : 1,
          borderWidth: chosen ? 2 : 1,
        },
      ]}
    >
      {index === null ? (
        <Text style={{ color: t.muted }}>✓</Text>
      ) : (
        <Animated.View
          pointerEvents="none"
          style={{
            transform: motion
              ? [
                  {
                    translateY: lift.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -3],
                    }),
                  },
                ]
              : [],
          }}
        >
          <MiniPiece
            seed={game.seed}
            index={index}
            beginner={game.beginner}
            settings={settings}
            size={16}
          />
        </Animated.View>
      )}
      {!chosen && index !== null ? null : (
        <Txt
          size={11}
          bold
          style={{
            color: chosen ? t.brand : t.muted,
            marginTop: 4,
            textAlign: "center",
          }}
        >
          {index === null ? "Placed" : "Selected"}
        </Txt>
      )}
    </Pressable>
  );
}
export function Board({
  game,
  settings,
  selected,
  setSelected,
  anchor,
  setAnchor,
  disabled,
  onDragging,
  small,
}: Props) {
  const t = themes[settings.theme],
    board = useRef<React.ElementRef<typeof View>>(null),
    bounds = useRef({ x: 0, y: 0, w: 320 }),
    [width, setWidth] = useState(320);
  const [settle] = useState(() => new Animated.Value(1));
  const [clear] = useState(() => new Animated.Value(1));
  const [animatedMove, setAnimatedMove] = useState<string>();
  const steps = game.moves.length;
  const lastMove = game.moves.at(-1);
  const moveId = lastMove?.id;
  const cleared = game.last.cleared.length;
  const seed = game.seed;
  const previous = useRef({ seed, steps, id: moveId });
  const enabled = settings.motion && !settings.lowEffects && !small;
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = { seed, steps, id: moveId };
    if (
      !moveId ||
      !enabled ||
      before.seed !== seed ||
      steps !== before.steps + 1 ||
      moveId === before.id
    )
      return;
    settle.setValue(0);
    clear.setValue(0);
    setAnimatedMove(moveId);
    const animation = Animated.parallel([
      animate(settle, 1, motionSpec.settle),
      ...(cleared ? [animate(clear, 1, motionSpec.clear)] : []),
    ]);
    animation.start(({ finished }) => {
      if (finished) setAnimatedMove(undefined);
    });
    return () => {
      animation.stop();
      clear.setValue(1);
      settle.setValue(1);
    };
  }, [clear, cleared, enabled, seed, moveId, settle, steps]);
  const active =
    enabled && animatedMove !== undefined && animatedMove === moveId;
  const preview =
    selected >= 0 && game.tray[selected] != null && anchor
      ? piece(game.seed, game.tray[selected]!, game.beginner).map(([r, c]) => [
          r + anchor[0],
          c + anchor[1],
        ])
      : [];
  const valid = anchor && fits(game, selected, anchor[0], anchor[1]);
  const select = useCallback(
    (slot: number) => {
      board.current?.measureInWindow(
        (x, y, w) => (bounds.current = { x, y, w }),
      );
      setSelected(slot);
      setAnchor(null);
    },
    [setAnchor, setSelected],
  );
  const drag = useCallback(
    (x: number, y: number, active: boolean, slot: number) => {
      onDragging?.(active);
      if (active || x || y) {
        const b = bounds.current;
        const c = Math.floor(
            (x - b.x - boardInset) / ((b.w - 2 * boardInset) / 8),
          ),
          r = Math.floor((y - b.y - boardInset) / ((b.w - 2 * boardInset) / 8));
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
          setSelected(slot);
          setAnchor([r, c]);
        }
      }
    },
    [onDragging, setAnchor, setSelected],
  );
  const cell = (width - 2 * boardInset) / 8;
  return (
    <View style={{ gap: 16 }}>
      <View
        ref={board}
        testID="game-board"
        accessibilityLabel="8 by 8 puzzle board"
        onLayout={(e) => {
          setWidth(e.nativeEvent.layout.width);
          board.current?.measureInWindow(
            (x, y, w) => (bounds.current = { x, y, w }),
          );
        }}
        style={[
          styles.board,
          { backgroundColor: t.board, borderColor: t.boardBorder },
        ]}
      >
        {Array.from({ length: 8 }, (_, r) => (
          <View key={r} style={{ flexDirection: "row" }}>
            {Array.from({ length: 8 }, (_, c) => {
              const i = r * 8 + c,
                v = game.board[i],
                ghost = preview.some(([a, b]) => a === r && b === c),
                just = active && v > 0 && game.last.cells.includes(i),
                isClear = active && game.last.cleared.includes(i);
              const wave =
                isClear && lastMove
                  ? Math.min(
                      0.32,
                      (Math.abs(lastMove.row - r) +
                        Math.abs(lastMove.col - c)) *
                        0.027,
                    )
                  : 0;
              return (
                <Pressable
                  key={c}
                  testID={`cell-${r}-${c}`}
                  disabled={disabled || small}
                  accessibilityRole="button"
                  accessibilityLabel={`Row ${r + 1}, column ${c + 1}, ${v ? "occupied" : "empty"}${ghost ? (valid ? ", fits" : ", does not fit") : ""}`}
                  onPress={() => {
                    if (selected < 0)
                      AccessibilityInfo.announceForAccessibility(
                        "Select a piece first",
                      );
                    setAnchor([r, c]);
                  }}
                  style={{ width: cell, height: cell, padding: 1.25 }}
                >
                  <Animated.View
                    style={{
                      flex: 1,
                      borderRadius: 5,
                      backgroundColor: ghost
                        ? valid
                          ? t.valid
                          : t.invalid
                        : v
                          ? palettes[settings.palette][v - 1]
                          : t.empty,
                      borderWidth: ghost ? 2 : 1,
                      borderColor: ghost
                        ? valid
                          ? t.onValid
                          : t.onInvalid
                        : v
                          ? "#00000018"
                          : t.boardEdge,
                      borderTopWidth: v && !ghost ? 2 : ghost ? 2 : 1,
                      borderTopColor:
                        v && !ghost
                          ? "#FFFFFF60"
                          : ghost
                            ? valid
                              ? t.onValid
                              : t.onInvalid
                            : t.boardEdge,
                      alignItems: "center",
                      justifyContent: "center",
                      transform: just
                        ? [
                            {
                              scaleY: settle.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: [0.78, 1.045, 1],
                              }),
                            },
                            {
                              scaleX: settle.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: [1.04, 0.99, 1],
                              }),
                            },
                          ]
                        : [],
                    }}
                  >
                    {(settings.patterns || settings.theme === "contrast") &&
                      v > 0 &&
                      !ghost && (
                        <Text
                          style={{
                            color: "#152A32",
                            fontSize: cell * 0.42,
                            fontWeight: "800",
                          }}
                        >
                          {symbols[v]}
                        </Text>
                      )}
                    {ghost && (
                      <Text
                        style={{
                          color: valid ? t.onValid : t.onInvalid,
                          fontWeight: "900",
                        }}
                      >
                        {" "}
                        {valid ? "+" : "×"}{" "}
                      </Text>
                    )}
                  </Animated.View>
                  {isClear && (
                    <Animated.View
                      testID="line-clear-wave"
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        inset: 2,
                        backgroundColor: t.clear,
                        borderRadius: 5,
                        opacity: clear.interpolate({
                          inputRange: [
                            0,
                            wave + 0.02,
                            wave + 0.16,
                            wave + 0.58,
                            1,
                          ],
                          outputRange: [0, 0, 0.82, 0, 0],
                        }),
                        transform: [
                          {
                            scaleY: clear.interpolate({
                              inputRange: [0, wave + 0.16, wave + 0.58, 1],
                              outputRange: [0.76, 1, 0.1, 0.1],
                            }),
                          },
                        ],
                      }}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      {!small && (
        <View style={{ flexDirection: "row", gap: 10 }}>
          {game.tray.map((idx, i) => (
            <TrayPiece
              key={`${i}-${idx}`}
              i={i}
              index={idx}
              game={game}
              settings={settings}
              selected={selected}
              disabled={disabled}
              select={select}
              drag={drag}
            />
          ))}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  board: {
    padding: boardInset - 1,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  slot: {
    flex: 1,
    minHeight: 76,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    padding: 7,
  },
});
