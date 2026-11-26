import React from "react";
import { Image, View } from "react-native";
import { brand } from "./design";

export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <Image
      source={require("../assets/brand-mark.png")}
      accessible={false}
      accessibilityElementsHidden
      style={{ width: size, height: size }}
    />
  );
}

const tiles = [
  [0, 2, brand.accent],
  [1, 0, brand.tile],
  [1, 2, "#B9A3FC"],
  [1, 3, "#B9A3FC"],
  [2, 0, brand.tile],
  [2, 1, brand.tile],
  [2, 3, "#B9A3FC"],
  [3, 1, "#65546F"],
  [3, 2, "#65546F"],
  [3, 3, "#65546F"],
] as const;

export function BrandBoard({ size }: { size: number }) {
  const pitch = size / 5;
  return (
    <View
      accessibilityElementsHidden
      aria-hidden
      pointerEvents="none"
      style={{
        width: pitch * 4,
        height: size,
        transform: [{ rotate: "13deg" }],
      }}
    >
      {Array.from({ length: 20 }, (_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: (i % 4) * pitch,
            top: Math.floor(i / 4) * pitch,
            width: pitch - 3,
            height: pitch - 3,
            borderWidth: 1,
            borderColor: brand.seam,
            borderRadius: 5,
          }}
        />
      ))}
      {tiles.map(([row, col, color]) => (
        <View
          key={row * 4 + col}
          style={{
            position: "absolute",
            top: (row + 0.24) * pitch,
            left: col * pitch,
            width: pitch - 3,
            height: pitch - 3,
            borderRadius: 5,
            backgroundColor: color,
            borderTopWidth: 2,
            borderTopColor: "#FFFFFF55",
            borderBottomWidth: 3,
            borderBottomColor: "#211A2B40",
            transform: row === 0 ? [{ rotate: "-12deg" }] : [],
          }}
        />
      ))}
    </View>
  );
}
