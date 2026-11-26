import React, { forwardRef } from "react";
import { View, Text } from "react-native";
import { BrandMark } from "./brand";
import { brand, fonts, palette } from "./design";
export const ShareCard = forwardRef<
  React.ElementRef<typeof View>,
  { score: number; mode: string; seed: number; width?: number }
>(({ score, mode, seed, width = 280 }, ref) => (
  <View
    ref={ref}
    collapsable={false}
    style={{
      width,
      height: width * 1.25,
      backgroundColor: brand.ink,
      borderRadius: 18,
      padding: 24,
      justifyContent: "space-between",
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <BrandMark size={32} />
      <Text
        style={{ fontFamily: fonts.display, color: brand.paper, fontSize: 16 }}
      >
        Block League
      </Text>
    </View>
    <View>
      <Text
        style={{
          fontFamily: fonts.display,
          color: brand.accent,
          fontSize: 48,
          fontVariant: ["tabular-nums"],
        }}
      >
        {score.toLocaleString()}
      </Text>
      <Text
        style={{ fontFamily: fonts.body, color: brand.quiet, fontSize: 13 }}
      >
        {mode}
      </Text>
    </View>
    <View
      style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", width: 108 }}
    >
      {palette.map((c) => (
        <View
          key={c}
          style={{
            width: 30,
            height: 30,
            borderRadius: 5,
            backgroundColor: c,
          }}
        />
      ))}
    </View>
    <View>
      <Text
        style={{ fontFamily: fonts.strong, color: brand.paper, fontSize: 16 }}
      >
        Same blocks. Your move.
      </Text>
      <Text
        style={{ fontFamily: fonts.body, color: brand.quiet, fontSize: 10 }}
      >
        Practice challenge · seed {seed}
      </Text>
    </View>
  </View>
));
ShareCard.displayName = "ShareCard";
