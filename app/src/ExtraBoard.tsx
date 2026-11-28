import React, { useState } from "react";
import { View } from "react-native";
import { fits, hint, place, replay, legalMoves } from "../../shared/engine";
import type { Game } from "../../shared/engine";
import { puzzleSolved } from "../../shared/puzzles";
import type { Puzzle } from "../../shared/puzzles";
import { Board } from "./Board";
import { space } from "./design";
import type { Settings } from "./design";
import { ScoreBeat } from "./GameFeedback";
import { Button, Card, Row, Txt } from "./ui";

export function ExtraBoard({
  game,
  settings,
  puzzle,
  opponentScore,
  update,
  onDragging,
}: {
  game: Game;
  settings: Settings;
  puzzle?: Puzzle;
  opponentScore?: number;
  update: (game: Game, assisted?: boolean) => void;
  onDragging: (dragging: boolean) => void;
}) {
  const [selected, setSelected] = useState(-1);
  const [anchor, setAnchor] = useState<[number, number] | null>(null);
  const [notice, setNotice] = useState("");
  const valid = anchor && fits(game, selected, ...anchor);
  const count = game.limit - game.moves.length;
  return (
    <>
      <Card style={{ padding: space.md, gap: space.sm }}>
        <Row style={{ justifyContent: "space-between" }}>
          <Row style={{ gap: space.xs }}>
            <ScoreBeat
              score={game.score}
              step={game.moves.length}
              size={26}
              enabled={settings.motion}
            />
            <Txt muted size={13}>
              pts
            </Txt>
          </Row>
          <Txt muted>
            {game.lines} {game.lines === 1 ? "line" : "lines"}
            {game.limit < 100 ? ` · ${count} left` : ""}
          </Txt>
        </Row>
        {opponentScore !== undefined && (
          <Txt muted size={13}>
            CPU · {opponentScore.toLocaleString()} pts
          </Txt>
        )}
        {puzzle && <Txt>{puzzle.brief}</Txt>}
      </Card>
      <Board
        game={game}
        settings={settings}
        selected={selected}
        setSelected={setSelected}
        anchor={anchor}
        setAnchor={setAnchor}
        onDragging={onDragging}
      />
      <Button
        title="Confirm placement"
        testID="extra-confirm"
        disabled={!valid}
        onPress={() => {
          if (!anchor || !valid) return;
          const next = place(game, {
            slot: selected,
            row: anchor[0],
            col: anchor[1],
            seq: game.moves.length,
            id: "play-" + game.moves.length,
          });
          setAnchor(null);
          setSelected(-1);
          setNotice("");
          update(next);
        }}
      />
      <Row>
        {anchor && (
          <Button
            secondary
            title="Cancel preview"
            onPress={() => setAnchor(null)}
          />
        )}
        {puzzle && (
          <Button
            secondary
            title="Hint"
            onPress={() => {
              const suggested = puzzle.solution[game.moves.length];
              const followsSolution = game.moves.every((move, i) => {
                const step = puzzle.solution[i];
                return (
                  step &&
                  step.slot === move.slot &&
                  step.row === move.row &&
                  step.col === move.col
                );
              });
              const available =
                suggested &&
                followsSolution &&
                fits(game, suggested.slot, suggested.row, suggested.col)
                  ? suggested
                  : (legalMoves(game).find((move) =>
                      puzzleSolved(
                        puzzle,
                        place(game, {
                          ...move,
                          seq: game.moves.length,
                          id: "hint",
                        }),
                      ),
                    ) ?? hint(game));
              if (available) {
                setSelected(available.slot);
                setAnchor([available.row, available.col]);
                setNotice(
                  `Try piece ${available.slot + 1} at row ${available.row + 1}, column ${available.col + 1}.`,
                );
                update(game, true);
              }
            }}
          />
        )}
      </Row>
      <Txt accessibilityLiveRegion="polite" muted size={14}>
        {notice ||
          (anchor
            ? valid
              ? "This placement fits."
              : "Pick an open position or another piece."
            : "Pick a piece, then a cell to preview it.")}
      </Txt>
    </>
  );
}

export function CpuReplay({
  game,
  settings,
  label,
}: {
  game: Game;
  settings: Settings;
  label: string;
}) {
  const [step, setStep] = useState(0);
  const stage = replay(game.seed, game.moves.slice(0, step), game.limit);
  return (
    <View style={{ gap: 12 }}>
      <Txt size={22} bold>
        {label} replay
      </Txt>
      <Txt accessibilityLiveRegion="polite">
        {step} of {game.moves.length} placements · {stage.score} points
      </Txt>
      <Board
        game={stage}
        settings={settings}
        selected={-1}
        setSelected={() => {}}
        anchor={null}
        setAnchor={() => {}}
        small
      />
      <Row>
        <Button
          secondary
          title="Previous placement"
          disabled={!step}
          onPress={() => setStep(step - 1)}
        />
        <Button
          secondary
          title="Next placement"
          disabled={step >= game.moves.length}
          onPress={() => setStep(step + 1)}
        />
      </Row>
    </View>
  );
}
