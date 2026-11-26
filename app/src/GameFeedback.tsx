import React, { useLayoutEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";
import { brand, motionSpec, space } from "./design";
import { Txt } from "./ui";
import { animate } from "./motion";

export function ScoreBeat({
  score,
  step,
  size = 44,
  enabled,
}: {
  score: number;
  step: number;
  size?: number;
  enabled: boolean;
}) {
  const [beat] = useState(() => new Animated.Value(1));
  const previous = useRef({ score, step });
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = { score, step };
    if (!enabled || score <= before.score || step !== before.step + 1) {
      beat.setValue(1);
      return;
    }
    beat.setValue(0);
    const animation = animate(beat, 1, motionSpec.score);
    animation.start();
    return () => animation.stop();
  }, [beat, enabled, score, step]);
  return (
    <Animated.View
      testID="score-beat"
      style={{
        alignSelf: "flex-start",
        transform: enabled
          ? [
              {
                translateY: beat.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [0, -4, 0],
                }),
              },
            ]
          : [],
      }}
    >
      <Txt
        display
        size={size}
        style={{ fontVariant: ["tabular-nums"], letterSpacing: -1.2 }}
      >
        {score.toLocaleString()}
      </Txt>
    </Animated.View>
  );
}

export function ResultMark({ enabled }: { enabled: boolean }) {
  const [progress] = useState(() => new Animated.Value(enabled ? 0 : 1));
  useLayoutEffect(() => {
    if (!enabled) {
      progress.setValue(1);
      return;
    }
    const animation = animate(progress, 1, motionSpec.result);
    animation.start();
    return () => animation.stop();
  }, [enabled, progress]);
  const tile = {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: brand.tile,
  };
  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      pointerEvents="none"
      style={{
        padding: space.md,
        borderRadius: 17,
        backgroundColor: brand.ink,
        gap: 3,
      }}
    >
      <View style={{ flexDirection: "row", gap: 3 }}>
        <View style={tile} />
        <Animated.View
          testID="result-mark-tile"
          style={{
            ...tile,
            backgroundColor: brand.accent,
            opacity: enabled
              ? progress.interpolate({
                  inputRange: [0, 0.16, 0.45, 1],
                  outputRange: [0.45, 0.5, 1, 1],
                })
              : 1,
            transform: enabled
              ? [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 0.22, 0.71, 1],
                      outputRange: [-10, -12, 1, 0],
                    }),
                  },
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 0.22, 1],
                      outputRange: [7, 8, 0],
                    }),
                  },
                  {
                    rotate: progress.interpolate({
                      inputRange: [0, 0.71, 1],
                      outputRange: ["15deg", "-3deg", "0deg"],
                    }),
                  },
                ]
              : [],
          }}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 3 }}>
        <View style={tile} />
        <View style={tile} />
      </View>
    </View>
  );
}
