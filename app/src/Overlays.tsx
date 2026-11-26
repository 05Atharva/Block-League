import React, { useContext, useEffect, useLayoutEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { brand, motionSpec, radius, space, themes } from "./design";
import { animate } from "./motion";
import type { InboxItem, ToastMessage } from "./notifications";
import { translate } from "./locales";
import { Button, Design, Row, Txt } from "./ui";

function useArrival(distance: number, horizontal = false) {
  const { motion, lowEffects } = useContext(Design);
  const enabled = motion && !lowEffects;
  const [value] = useState(() => new Animated.Value(enabled ? 0 : 1));
  useLayoutEffect(() => {
    if (!enabled) {
      value.setValue(1);
      return;
    }
    const animation = animate(value, 1, motionSpec.overlay);
    animation.start();
    return () => animation.stop();
  }, [enabled, value]);
  const offset = value.interpolate({
    inputRange: [0, 1],
    outputRange: [distance, 0],
  });
  return {
    opacity: enabled ? value : 1,
    transform: enabled
      ? horizontal
        ? [{ translateX: offset }]
        : [{ translateY: offset }]
      : [],
  };
}

export function Overlay({
  title,
  onClose,
  children,
  drawer = false,
  dismissBackdrop = true,
  opaque = false,
  closeLabel,
  headingDetail,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  drawer?: boolean;
  dismissBackdrop?: boolean;
  opaque?: boolean;
  closeLabel?: string;
  headingDetail?: string;
}) {
  const { theme, language } = useContext(Design);
  const t = themes[theme];
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const side = drawer && width >= 720;
  const motion = useArrival(drawer ? 28 : 8, side);
  const label = translate(title, language);
  return (
    <Modal
      visible
      transparent
      animationType="none"
      accessibilityLabel={label}
      onRequestClose={onClose}
      onShow={
        Platform.OS === "web"
          ? undefined
          : () => AccessibilityInfo.announceForAccessibility(label)
      }
    >
      <View
        style={[
          styles.veil,
          opaque && { backgroundColor: t.bg },
          {
            paddingTop: Math.max(space.lg, insets.top),
            paddingBottom: drawer
              ? insets.bottom + space.md
              : Math.max(space.lg, insets.bottom),
            paddingHorizontal: drawer ? space.md : space.lg,
            justifyContent: drawer && !side ? "flex-end" : "center",
            alignItems: side ? "flex-end" : "center",
          },
        ]}
      >
        <Pressable
          aria-hidden
          importantForAccessibility="no"
          accessible={false}
          focusable={false}
          onPress={dismissBackdrop ? onClose : undefined}
          style={StyleSheet.absoluteFill}
          testID="overlay-backdrop"
        />
        <Animated.View
          testID="overlay-panel"
          accessibilityViewIsModal
          style={[
            styles.panel,
            {
              backgroundColor: drawer ? t.bg : t.surface,
              borderColor: t.border,
              maxWidth: side ? 400 : drawer ? 600 : 480,
              height: side ? "100%" : undefined,
              boxShadow: drawer ? "0px 14px 48px #17131D54" : undefined,
            },
            motion,
          ]}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: space.lg, gap: space.lg }}
          >
            <Row
              style={{ flexWrap: "nowrap", justifyContent: "space-between" }}
            >
              <View style={{ flex: 1, minWidth: 0, gap: space.xs }}>
                <Txt
                  accessibilityRole="header"
                  display
                  size={drawer ? 30 : 27}
                  style={{ letterSpacing: -0.45 }}
                >
                  {title}
                </Txt>
                {headingDetail && (
                  <Txt muted bold size={12}>
                    {headingDetail}
                  </Txt>
                )}
              </View>
              {closeLabel && (
                <IconButton label={closeLabel} symbol="×" onPress={onClose} />
              )}
            </Row>
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

export type DialogContent = {
  title: string;
  body: string;
  action?: () => void;
  label?: string;
  cancel?: string;
  destructive?: boolean;
};

export function Dialog({
  content,
  close,
}: {
  content: DialogContent;
  close: () => void;
}) {
  return (
    <Overlay title={content.title} onClose={close}>
      <Txt muted>{content.body}</Txt>
      <Row style={{ justifyContent: "flex-end" }}>
        <Button
          secondary={!!content.action}
          title={content.action ? (content.cancel ?? "Cancel") : "Got it"}
          onPress={close}
        />
        {content.action && (
          <Button
            testID="confirm-dialog"
            destructive={content.destructive}
            title={content.label || "Continue"}
            onPress={() => {
              close();
              content.action?.();
            }}
          />
        )}
      </Row>
    </Overlay>
  );
}

const signals = {
  info: { symbol: "i", label: "Notice" },
  success: { symbol: "✓", label: "Success" },
  error: { symbol: "!", label: "Action needed" },
} as const;

export function Toast({
  message,
  close,
}: {
  message: ToastMessage;
  close: () => void;
}) {
  const t = themes[useContext(Design).theme];
  const motion = useArrival(-8);
  const signal = signals[message.tone];
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (focused || message.tone === "error") return;
    const timer = setTimeout(close, 9000);
    return () => clearTimeout(timer);
  }, [close, focused, message]);
  return (
    <Animated.View
      testID="toast"
      pointerEvents="box-none"
      style={[
        styles.toast,
        {
          backgroundColor: t.surface,
          borderColor: message.tone === "error" ? t.danger : t.border,
        },
        motion,
      ]}
    >
      <View
        aria-hidden
        pointerEvents="none"
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: message.tone === "error" ? t.notice : t.soft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Txt
          bold
          size={16}
          style={{ color: message.tone === "error" ? t.danger : t.brand }}
        >
          {signal.symbol}
        </Txt>
      </View>
      <View
        pointerEvents="none"
        role={message.tone === "error" ? "alert" : "status"}
        accessibilityLiveRegion={
          message.tone === "error" ? "assertive" : "polite"
        }
        style={{ flex: 1, minWidth: 0, gap: 1 }}
      >
        <Txt bold size={12} muted>
          {signal.label}
        </Txt>
        <Txt size={14}>{message.text}</Txt>
      </View>
      <IconButton
        label="Dismiss notification"
        symbol="×"
        onPress={close}
        onFocusChanged={setFocused}
      />
    </Animated.View>
  );
}

export function IconButton({
  label,
  symbol,
  onPress,
  unread = false,
  onFocusChanged,
}: {
  label: string;
  symbol: string;
  onPress: () => void;
  unread?: boolean;
  onFocusChanged?: (focused: boolean) => void;
}) {
  const { theme, language } = useContext(Design);
  const t = themes[theme];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={translate(label, language)}
      accessibilityHint={
        unread
          ? translate("You have unread notifications.", language)
          : undefined
      }
      onPress={onPress}
      onFocus={() => onFocusChanged?.(true)}
      onBlur={() => onFocusChanged?.(false)}
      style={({ pressed }) => ({
        width: 44,
        height: 48,
        borderRadius: radius.field,
        borderColor: t.border,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? t.soft : t.surface,
      })}
    >
      {symbol === "bell" ? (
        <View aria-hidden style={{ alignItems: "center", gap: 2 }}>
          <View
            style={{
              width: 14,
              height: 14,
              borderWidth: 1.6,
              borderColor: t.brand,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}
          />
          <View
            style={{
              width: 5,
              height: 2,
              borderRadius: 1,
              backgroundColor: t.brand,
            }}
          />
        </View>
      ) : (
        <Txt aria-hidden size={21} style={{ color: t.brand }}>
          {symbol}
        </Txt>
      )}
      {unread && (
        <View
          aria-hidden
          style={{
            position: "absolute",
            width: 8,
            height: 8,
            borderRadius: 4,
            right: 7,
            top: 7,
            backgroundColor: brand.tile,
          }}
        />
      )}
    </Pressable>
  );
}

export function NotificationDrawer({
  items,
  onClose,
  openMatch,
}: {
  items: InboxItem[];
  onClose: () => void;
  openMatch: (code: string) => void;
}) {
  const { theme, language } = useContext(Design);
  const t = themes[theme];
  const unread = items.filter((item) => !item.read).length;
  return (
    <Overlay
      title="Notifications"
      drawer
      onClose={onClose}
      closeLabel="Close notifications"
      headingDetail={
        unread
          ? translate("New notifications", language) +
            " · " +
            unread.toLocaleString(language)
          : undefined
      }
    >
      {items.length === 0 ? (
        <View
          style={[
            styles.inboxCard,
            { backgroundColor: t.surface, borderColor: t.border },
          ]}
        >
          <InboxGlyph kind="empty" />
          <View style={{ flex: 1, minWidth: 0, gap: space.xs }}>
            <Txt bold>You’re all caught up.</Txt>
            <Txt muted size={13}>
              Match results and reminders appear here.
            </Txt>
          </View>
        </View>
      ) : (
        <View style={{ gap: space.sm }}>
          {items.map((item) => {
            const title =
              item.kind === "break"
                ? "Break reminder"
                : item.kind === "result"
                  ? "Match result ready"
                  : "Challenge ends soon";
            const date = new Date(item.at).toLocaleString(language, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });
            const { code } = item;
            const content = (
              <>
                <InboxGlyph kind={item.kind} />
                <View style={{ flex: 1, minWidth: 0, gap: space.xs }}>
                  <Txt bold>{title}</Txt>
                  <Txt
                    size={13}
                    muted
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {code ? `${code} · ${date}` : date}
                  </Txt>
                  {item.kind === "break" && (
                    <Txt size={13}>
                      Your progress is safe. Take a break whenever you like.
                    </Txt>
                  )}
                </View>
                {code && (
                  <View
                    aria-hidden
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 9,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: t.soft,
                    }}
                  >
                    <Txt bold size={15} style={{ color: t.brand }}>
                      ↗
                    </Txt>
                  </View>
                )}
              </>
            );
            const style = [
              styles.inboxCard,
              {
                backgroundColor: t.surface,
                borderColor: item.read ? t.border : t.brand,
              },
            ];
            return code ? (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={translate("Open match", language)}
                accessibilityHint={`${translate(title, language)} · ${code}`}
                onPress={() => openMatch(code)}
                style={({ pressed }) => [
                  style,
                  pressed && { backgroundColor: t.soft },
                ]}
              >
                {content}
              </Pressable>
            ) : (
              <View key={item.id} style={style}>
                {content}
              </View>
            );
          })}
        </View>
      )}
    </Overlay>
  );
}

function InboxGlyph({ kind }: { kind: InboxItem["kind"] | "empty" }) {
  const { theme } = useContext(Design);
  const t = themes[theme];
  const ink = theme === "contrast" ? t.text : brand.ink;
  const fill =
    theme === "contrast"
      ? t.soft
      : kind === "result"
        ? brand.accent
        : kind === "deadline"
          ? brand.tile
          : "#C5B0F3";
  return (
    <View
      aria-hidden
      style={{
        width: 43,
        height: 43,
        borderRadius: 13,
        backgroundColor: fill,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {kind === "result" ? (
        <View style={{ width: 20, height: 20 }}>
          <View
            style={{
              position: "absolute",
              top: 1,
              left: 1,
              width: 8,
              height: 17,
              borderRadius: 2,
              backgroundColor: ink,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 2,
              left: 1,
              width: 17,
              height: 8,
              borderRadius: 2,
              backgroundColor: ink,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 2,
              right: 1,
              width: 7,
              height: 7,
              borderRadius: 2,
              borderColor: ink,
              borderWidth: 1.5,
              transform: [{ rotate: "10deg" }],
            }}
          />
        </View>
      ) : (
        <Txt aria-hidden bold size={20} style={{ color: ink }}>
          {kind === "deadline" ? "◷" : kind === "break" ? "Ⅱ" : "◇"}
        </Txt>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  veil: { flex: 1, backgroundColor: "#17131DAD" },
  panel: {
    width: "100%",
    maxHeight: "100%",
    borderRadius: radius.hero,
    borderWidth: 1,
    overflow: "hidden",
  },
  toast: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    padding: space.sm,
    gap: space.sm,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.card,
    borderWidth: 1,
    boxShadow: "0px 8px 24px #17131D29",
  },
  inboxCard: {
    minHeight: 72,
    padding: space.md,
    borderWidth: 1,
    borderRadius: 17,
    gap: space.md,
    flexDirection: "row",
    alignItems: "center",
  },
});
