import React, { useContext } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import { brand, radius, space, strings, themes } from "./design";
import type { Profile } from "./storage";
import { BrandBoard } from "./brand";
import { Button, Card, Design, Row, Txt } from "./ui";

function ModeLink({
  title,
  detail,
  symbol,
  label,
  onPress,
}: {
  title: string;
  detail: string;
  symbol: string;
  label?: string;
  onPress: () => void;
}) {
  const t = themes[useContext(Design).theme];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? title}
      accessibilityHint={detail}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: 228,
        minHeight: 80,
        backgroundColor: pressed ? t.soft : t.surface,
        borderColor: t.border,
        borderWidth: 1,
        borderRadius: radius.card,
        flexDirection: "row",
        alignItems: "center",
        padding: space.md,
        gap: space.md,
      })}
    >
      <View
        aria-hidden
        style={{
          alignItems: "center",
          justifyContent: "center",
          width: 44,
          height: 44,
          borderRadius: 13,
          backgroundColor: t.soft,
        }}
      >
        <Txt style={{ color: t.brand }} size={21} bold>
          {symbol}
        </Txt>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Txt size={17} bold>
          {title}
        </Txt>
        <Txt size={13} muted>
          {detail}
        </Txt>
      </View>
      <Txt
        accessibilityElementsHidden
        aria-hidden
        size={17}
        style={{ color: t.brand }}
      >
        ↗
      </Txt>
    </Pressable>
  );
}

export function PlayHome({
  profile,
  onSolo,
  onFriends,
  onClub,
  onLearn,
  onPractice,
  onFamily,
}: {
  profile: Profile;
  onSolo: () => void;
  onFriends: () => void;
  onClub: () => void;
  onLearn: () => void;
  onPractice: () => void;
  onFamily: () => void;
}) {
  const settings = useContext(Design);
  const t = themes[settings.theme];
  const s = strings[settings.language];
  const { width } = useWindowDimensions();
  const showArt = settings.textSize < 1.25 && width >= 350;
  const showRecord = profile.best > 0 || profile.stars > 0;
  const heroInk = settings.theme === "contrast" ? t.text : brand.paper;
  const heroQuiet = settings.theme === "contrast" ? t.muted : brand.quiet;
  const artSize = Math.min(188, Math.max(112, width * 0.35));
  return (
    <>
      <Card
        style={{
          backgroundColor:
            settings.theme === "contrast" ? t.surface : brand.ink,
          borderColor: settings.theme === "contrast" ? t.border : brand.seam,
          borderRadius: radius.hero,
          padding: width < 420 ? space.lg : space.xl,
          overflow: "hidden",
          gap: space.lg,
        }}
      >
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}
        >
          <View
            aria-hidden
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor:
                settings.theme === "contrast" ? t.brand : brand.accent,
            }}
          />
          <Txt size={12} bold style={{ color: heroQuiet, letterSpacing: 1.1 }}>
            {profile.saved ? "SAVED SOLO GAME" : "SOLO · UNTIMED"}
          </Txt>
        </View>
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}
        >
          <View style={{ flex: 1, minWidth: 0, gap: space.sm }}>
            <Txt
              display
              size={width < 420 ? 34 : 42}
              style={{ color: heroInk, letterSpacing: -0.9 }}
            >
              {profile.saved ? "Your board is waiting." : "Make your move."}
            </Txt>
            <Txt size={15} style={{ color: heroQuiet }}>
              {profile.saved
                ? `${profile.saved.score.toLocaleString()} points · saved on this device`
                : "Clear lines and beat your best."}
            </Txt>
          </View>
          {showArt && <BrandBoard size={artSize} />}
        </View>
        <Button
          testID="play-solo"
          title={profile.saved ? s.resume : s.solo}
          indicator="→"
          onPress={onSolo}
        />
      </Card>
      {showRecord && (
        <Row
          style={{
            paddingVertical: space.xs,
            justifyContent: "space-between",
            gap: space.lg,
          }}
        >
          <View style={{ flex: 1, minWidth: 112 }}>
            <Txt muted size={13}>
              Solo best
            </Txt>
            <Txt display size={25} style={{ fontVariant: ["tabular-nums"] }}>
              {profile.best.toLocaleString()}
            </Txt>
          </View>
          <View style={{ flex: 1, minWidth: 112 }}>
            <Txt muted size={13}>
              Earned stars
            </Txt>
            <Txt display size={25} style={{ fontVariant: ["tabular-nums"] }}>
              ✦ {profile.stars.toLocaleString()}
            </Txt>
          </View>
        </Row>
      )}
      <Row style={{ alignItems: "stretch" }}>
        <ModeLink
          title={s.faceoff}
          detail="Private live or async matches"
          symbol="⊞"
          label="Play with friends ↗"
          onPress={onFriends}
        />
        <ModeLink
          title={s.league}
          detail="Teams, fixtures and standings"
          symbol="◇"
          onPress={onClub}
        />
      </Row>
      <Row>
        <Button secondary title={s.learn} onPress={onLearn} />
        <Button secondary title={s.practice} onPress={onPractice} />
        <Button secondary title={s.family} onPress={onFamily} />
      </Row>
    </>
  );
}
