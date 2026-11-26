import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Animated,
  Text,
  View,
  Pressable,
  TextInput,
  Switch,
} from "react-native";
import { defaults, fonts, motionSpec, radius, space, themes } from "./design";
import type { Settings } from "./design";
import { translate } from "./locales";
import { animate, curves } from "./motion";
export const Design = createContext<Settings>(defaults);

function fontFamily(s: Settings, bold = false, display = false) {
  if (s.language !== "en") return "Devanagari";
  if (s.readable) return "Atkinson";
  if (display) return fonts.display;
  return bold ? fonts.strong : fonts.body;
}

export function Txt({
  children,
  size = 16,
  bold = false,
  display = bold && size >= 28,
  muted = false,
  style,
  ...props
}: any) {
  const s = useContext(Design),
    t = themes[s.theme];
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: fontFamily(s, bold, display),
          fontSize: size * s.textSize,
          lineHeight:
            size * s.textSize * (display && s.language === "en" ? 1.08 : 1.36),
          color: muted ? t.muted : t.text,
          flexShrink: 1,
        },
        style,
      ]}
    >
      {typeof children === "string"
        ? translate(children, s.language)
        : children}
    </Text>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  testID,
  style,
  indicator,
  destructive = false,
}: any) {
  const s = useContext(Design),
    t = themes[s.theme];
  const [press] = useState(() => new Animated.Value(1));
  const motion = s.motion && !s.lowEffects;
  const fill = destructive ? t.danger : secondary ? t.surface : t.action;
  const ink = destructive ? t.onDanger : secondary ? t.text : t.onAction;
  useEffect(() => {
    if (!motion || disabled) press.setValue(1);
    return () => press.stopAnimation();
  }, [disabled, motion, press]);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={
        motion
          ? () => animate(press, 0.96, motionSpec.press, curves.exit).start()
          : undefined
      }
      onPressOut={
        motion ? () => animate(press, 1, motionSpec.release).start() : undefined
      }
      style={({ pressed }) => [
        {
          minHeight: 52,
          maxWidth: "100%",
          flexShrink: 1,
          paddingHorizontal: space.lg,
          paddingVertical: space.md,
          borderRadius: radius.button,
          backgroundColor: fill,
          borderWidth: 1,
          borderColor: secondary && !destructive ? t.border : fill,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.48 : pressed ? 0.84 : 1,
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          maxWidth: "100%",
          flexDirection: "row",
          alignItems: "center",
          gap: space.sm,
          transform: motion ? [{ scale: press }] : [],
        }}
      >
        <Txt
          bold
          style={{
            color: ink,
            textAlign: "center",
          }}
        >
          {title}
        </Txt>
        {indicator && (
          <Txt accessibilityElementsHidden aria-hidden style={{ color: ink }}>
            {indicator}
          </Txt>
        )}
      </Animated.View>
    </Pressable>
  );
}
export function Card({ children, style }: any) {
  const s = useContext(Design),
    t = themes[s.theme];
  return (
    <View
      style={[
        {
          backgroundColor: t.surface,
          borderRadius: radius.card,
          padding: space.lg,
          borderWidth: 1,
          borderColor: t.border,
          gap: space.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Input({
  label,
  value,
  onChangeText,
  onFocus,
  onBlur,
  ...props
}: any) {
  const s = useContext(Design),
    t = themes[s.theme];
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Txt bold size={14}>
        {label}
      </Txt>
      <TextInput
        accessibilityLabel={translate(label, s.language)}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={t.muted}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...props}
        style={{
          minHeight: 52,
          borderRadius: radius.field,
          borderWidth: 1,
          borderColor: focused ? t.brand : t.border,
          backgroundColor: t.surface,
          padding: 14,
          color: t.text,
          fontSize: 16 * s.textSize,
          fontFamily: fontFamily(s),
        }}
      />
    </View>
  );
}
export function Row({ children, style }: any) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Toggle({
  label,
  description,
  value,
  onValueChange,
  disabled,
}: any) {
  const { theme, language } = useContext(Design);
  const t = themes[theme];
  return (
    <Row style={{ justifyContent: "space-between", paddingVertical: 10 }}>
      <View style={{ flex: 1, minWidth: 140 }}>
        <Txt bold>{label}</Txt>
        {description && (
          <Txt muted size={13}>
            {description}
          </Txt>
        )}
      </View>
      <Switch
        accessibilityLabel={translate(label, language)}
        value={value}
        trackColor={{ false: t.border, true: t.brand }}
        onValueChange={onValueChange}
        disabled={disabled}
      />
    </Row>
  );
}
export function Tag({ children }: any) {
  const s = useContext(Design),
    t = themes[s.theme];
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: t.soft,
        paddingHorizontal: space.sm,
        paddingVertical: space.xs,
        borderRadius: 8,
      }}
    >
      <Txt size={12} bold>
        {children}
      </Txt>
    </View>
  );
}
