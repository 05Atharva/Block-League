import { useLayoutEffect, useState } from "react";
import { Animated, Easing } from "react-native";
import { motionSpec } from "./design";

export const curves = {
  settle: Easing.bezier(0.22, 0.8, 0.28, 1),
  exit: Easing.bezier(0.55, 0, 0.9, 0.6),
};

export function animate(
  value: Animated.Value,
  toValue: number,
  duration: number,
  easing = curves.settle,
) {
  return Animated.timing(value, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  });
}

export function useScreenArrival(screen: string, enabled: boolean) {
  const [progress] = useState(() => new Animated.Value(1));

  useLayoutEffect(() => {
    if (!enabled) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = animate(progress, 1, motionSpec.screen);
    animation.start();
    return () => animation.stop();
  }, [enabled, progress, screen]);

  return {
    opacity: enabled ? progress : 1,
    transform:
      enabled && screen !== "game"
        ? [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [6, 0],
              }),
            },
          ]
        : [],
  };
}
