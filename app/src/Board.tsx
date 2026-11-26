import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  PanResponder,
  StyleSheet,
  AccessibilityInfo,
  Platform,
} from "react-native";
import { piece, colour, fits } from "../../shared/engine";
import type { Game } from "../../shared/engine";
import { themes, palettes, motionSpec } from "./design";
import type { Settings } from "./design";
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
  const ref = useRef({ drag, select, disabled });
  ref.current = { drag, select, disabled };
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !ref.current.disabled,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) + Math.abs(g.dy) > 6,
      onPanResponderGrant: () => ref.current.select(i),
      onPanResponderMove: (_, g) => ref.current.drag(g.moveX, g.moveY, true, i),
      onPanResponderRelease: (_, g) =>
        ref.current.drag(g.moveX, g.moveY, false, i),
      onPanResponderTerminate: () => ref.current.drag(0, 0, false, i),
    }),
  ).current;
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
          borderColor: selected === i ? t.brand : t.border,
          backgroundColor: selected === i ? t.soft : t.surface,
          opacity: index === null ? 0.45 : 1,
          borderWidth: selected === i ? 2 : 1,
        },
      ]}
    >
      {index === null ? (
        <Text style={{ color: t.muted }}>✓</Text>
      ) : (
        <MiniPiece
          seed={game.seed}
          index={index}
          beginner={game.beginner}
          settings={settings}
        />
      )}
      <Text style={{ fontSize: 11, color: t.muted, marginTop: 6 }}>
        {index === null ? "Placed" : selected === i ? "Selected" : `${i + 1}`}
      </Text>
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
  const settle = useRef(new Animated.Value(1)).current,
    clear = useRef(new Animated.Value(1)).current;
  const [clearCells, setClearCells] = useState<number[]>([]);
  const prev = useRef(-1);
  const enabled = settings.motion && !settings.lowEffects;
  useEffect(() => {
    if (prev.current === game.moves.length) return;
    prev.current = game.moves.length;
    if (!enabled) {
      setClearCells([]);
      return;
    }
    settle.setValue(0);
    clear.setValue(0);
    setClearCells(game.last.cleared);
    Animated.parallel([
      Animated.spring(settle, {
        toValue: 1,
        damping: 17,
        stiffness: 270,
        mass: 0.5,
        useNativeDriver: true,
      }),
      Animated.timing(clear, {
        toValue: 1,
        duration: motionSpec.clear,
        useNativeDriver: true,
      }),
    ]).start();
  }, [game.moves.length, enabled]);
  const preview =
    selected >= 0 && game.tray[selected] != null && anchor
      ? piece(game.seed, game.tray[selected]!, game.beginner).map(([r, c]) => [
          r + anchor[0],
          c + anchor[1],
        ])
      : [];
  const valid = anchor && fits(game, selected, anchor[0], anchor[1]);
  function drag(x: number, y: number, active: boolean, s: number) {
    onDragging?.(active);
    if (active || x || y) {
      const b = bounds.current;
      const c = Math.floor((x - b.x - 8) / ((b.w - 16) / 8)),
        r = Math.floor((y - b.y - 8) / ((b.w - 16) / 8));
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        setSelected(s);
        setAnchor([r, c]);
      }
    }
  }
  const cell = (width - 16) / 8;
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
        style={[styles.board, { backgroundColor: t.board }]}
      >
        {Array.from({ length: 8 }, (_, r) => (
          <View key={r} style={{ flexDirection: "row" }}>
            {Array.from({ length: 8 }, (_, c) => {
              const i = r * 8 + c,
                v = game.board[i],
                ghost = preview.some(([a, b]) => a === r && b === c),
                just = game.last.cells.includes(i),
                isClear = clearCells.includes(i);
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
                  style={{ width: cell, height: cell, padding: 1.5 }}
                >
                  <Animated.View
                    style={{
                      flex: 1,
                      borderRadius: 5,
                      backgroundColor: ghost
                        ? valid
                          ? "#BCF0D7"
                          : "#F3B4B1"
                        : v
                          ? palettes[settings.palette][v - 1]
                          : t.empty,
                      borderWidth: ghost
                        ? 2
                        : settings.theme === "contrast"
                          ? 1
                          : 0,
                      borderColor: ghost
                        ? valid
                          ? "#106344"
                          : "#912B28"
                        : "#666",
                      borderTopWidth: v ? 2 : ghost ? 2 : 0,
                      borderTopColor: v
                        ? "#FFFFFF60"
                        : ghost
                          ? "#106344"
                          : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                      transform:
                        just && enabled
                          ? [
                              {
                                scale: settle.interpolate({
                                  inputRange: [0, 0.65, 1],
                                  outputRange: [0.82, 1.06, 1],
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
                          color: valid ? "#106344" : "#912B28",
                          fontWeight: "900",
                        }}
                      >
                        {" "}
                        {valid ? "+" : "×"}{" "}
                      </Text>
                    )}
                  </Animated.View>
                  {isClear && enabled && (
                    <Animated.View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        inset: 2,
                        backgroundColor: "#FFE9A0",
                        borderRadius: 5,
                        opacity: clear.interpolate({
                          inputRange: [0, 0.3, 1],
                          outputRange: [0.9, 0.6, 0],
                        }),
                        transform: [
                          {
                            scale: clear.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 0.3],
                            }),
                          },
                          {
                            rotate: clear.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["0deg", "12deg"],
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
              select={(s: number) => {
                board.current?.measureInWindow(
                  (x, y, w) => (bounds.current = { x, y, w }),
                );
                setSelected(s);
                setAnchor(null);
              }}
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
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#172D36",
    overflow: "hidden",
  },
  slot: {
    flex: 1,
    minHeight: 104,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
});
