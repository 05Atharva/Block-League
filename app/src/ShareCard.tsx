import React, { forwardRef } from "react";
import { View, Text } from "react-native";
import { BrandMark } from "./brand";
import { brand, fonts, palette } from "./design";
import type { CardDetails } from "./share";
export const ShareCard = forwardRef<
  React.ElementRef<typeof View>,
  { card: CardDetails; width?: number }
>(({ card, width = 280 }, ref) => (
  <View
    ref={ref}
    collapsable={false}
    style={{
      width,
      minHeight: width * 1.25,
      backgroundColor: brand.ink,
      borderRadius: 18,
      padding: 24,
      justifyContent: "space-between",
      gap: 12,
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <BrandMark size={32} />
      <Text
        allowFontScaling={false}
        style={{ fontFamily: fonts.display, color: brand.paper, fontSize: 16 }}
      >
        Block League
      </Text>
    </View>
    <View>
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: fonts.display,
          color: brand.accent,
          fontSize: card.kind === "achievement" ? 29 : 48,
          fontVariant: ["tabular-nums"],
        }}
      >
        {card.headline}
      </Text>
      <Text
        allowFontScaling={false}
        style={{ fontFamily: fonts.body, color: brand.quiet, fontSize: 13 }}
      >
        {card.detail}
      </Text>
      <Text
        allowFontScaling={false}
        style={{ fontFamily: fonts.strong, color: brand.paper, fontSize: 14 }}
      >
        {card.alias}
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
        allowFontScaling={false}
        style={{ fontFamily: fonts.strong, color: brand.paper, fontSize: 16 }}
      >
        {card.caption}
      </Text>
      {card.footer && (
        <Text
          allowFontScaling={false}
          style={{ fontFamily: fonts.body, color: brand.quiet, fontSize: 10 }}
        >
          {card.footer}
        </Text>
      )}
    </View>
  </View>
));
ShareCard.displayName = "ShareCard";
