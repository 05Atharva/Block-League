import React, { forwardRef } from "react";
import { View, Text } from "react-native";
export const ShareCard = forwardRef<
  React.ElementRef<typeof View>,
  { score: number; mode: string; seed: number }
>(({ score, mode, seed }, ref) => (
  <View
    ref={ref}
    collapsable={false}
    style={{
      width: 280,
      height: 350,
      backgroundColor: "#233942",
      borderRadius: 18,
      padding: 24,
      justifyContent: "space-between",
    }}
  >
    <Text
      style={{
        fontFamily: "NunitoBold",
        color: "#D6E7E4",
        fontSize: 12,
        letterSpacing: 2,
      }}
    >
      BLOCK LEAGUE
    </Text>
    <View>
      <Text
        style={{ fontFamily: "NunitoBold", color: "#FFFFFF", fontSize: 20 }}
      >
        A good little game.
      </Text>
      <Text
        style={{ fontFamily: "NunitoBold", color: "#C4B0F6", fontSize: 48 }}
      >
        {score.toLocaleString()}
      </Text>
      <Text style={{ fontFamily: "Nunito", color: "#D6E7E4", fontSize: 13 }}>
        {mode}
      </Text>
    </View>
    <View
      style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", width: 108 }}
    >
      {["#F17854", "#9C7CEC", "#46B9A7", "#E5AF41", "#64A7E7", "#DC79AC"].map(
        (c) => (
          <View
            key={c}
            style={{
              width: 30,
              height: 30,
              borderRadius: 5,
              backgroundColor: c,
            }}
          />
        ),
      )}
    </View>
    <View>
      <Text style={{ fontFamily: "NunitoBold", color: "white", fontSize: 16 }}>
        Same blocks. Your move.
      </Text>
      <Text style={{ fontFamily: "Nunito", color: "#B8CDCF", fontSize: 10 }}>
        Practice challenge · seed {seed}
      </Text>
    </View>
  </View>
));
