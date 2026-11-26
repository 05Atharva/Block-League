import React, { createContext, useContext } from "react";
import {
  Text,
  View,
  Pressable,
  TextInput,
  Switch,
  StyleSheet,
} from "react-native";
import { defaults, themes } from "./design";
import type { Settings } from "./design";
import { translate } from "./locales";
export const Design = createContext<Settings>(defaults);
export function Txt({
  children,
  size = 16,
  bold = false,
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
          fontFamily:
            s.language !== "en"
              ? "Devanagari"
              : s.readable
                ? "Atkinson"
                : bold
                  ? "NunitoBold"
                  : "Nunito",
          fontSize: size * s.textSize,
          lineHeight: size * s.textSize * 1.4,
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
}: any) {
  const s = useContext(Design),
    t = themes[s.theme];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 52,
          maxWidth: "100%",
          flexShrink: 1,
          paddingHorizontal: 18,
          paddingVertical: 12,
          borderRadius: 16,
          backgroundColor: secondary ? t.soft : t.brand,
          borderWidth: 1,
          borderColor: secondary ? t.border : t.brand,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.4 : pressed ? 0.78 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      <Txt
        bold
        style={{
          color: secondary
            ? t.text
            : s.theme === "light" || s.theme === "contrast"
              ? "#FFFFFF"
              : "#14222B",
          textAlign: "center",
        }}
      >
        {title}
      </Txt>
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
          borderRadius: 24,
          padding: 22,
          borderWidth: 1,
          borderColor: t.border,
          gap: 12,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Input({ label, value, onChangeText, ...props }: any) {
  const s = useContext(Design),
    t = themes[s.theme];
  return (
    <View style={{ gap: 6 }}>
      <Txt bold size={14}>
        {label}
      </Txt>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={t.muted}
        {...props}
        style={{
          minHeight: 52,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: t.border,
          backgroundColor: t.surface,
          padding: 14,
          color: t.text,
          fontSize: 16 * s.textSize,
          fontFamily: "Nunito",
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
        accessibilityLabel={label}
        value={value}
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
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
      }}
    >
      <Txt size={12} bold>
        {children}
      </Txt>
    </View>
  );
}
