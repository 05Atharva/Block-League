import React, { useState } from "react";
import * as Clipboard from "expo-clipboard";
import { TAGS, TITLES } from "../../shared/puzzles";
import type { DisplayAwards } from "../../shared/puzzles";
import { Button, Card, Input, Row, Tag, Toggle, Txt } from "./ui";

export type Friends = {
  sharing: boolean;
  code: { value: string; expires: number } | null;
  friends: {
    id: string;
    alias: string;
    shared: { current: number; display: DisplayAwards } | null;
  }[];
};
export function FriendStreaks({
  state,
  busy,
  action,
  confirm,
  notify,
}: {
  state?: Friends;
  busy: boolean;
  action: (
    name: string,
    data?: Record<string, unknown>,
  ) => Promise<boolean | undefined>;
  confirm: (
    title: string,
    text: string,
    label: string,
    onConfirm: () => void,
  ) => void;
  notify: (message: string, tone?: "success" | "error") => void;
}) {
  const [code, setCode] = useState("");
  return (
    <>
      <Card>
        <Txt size={28} display>
          Friend streaks
        </Txt>
        <Txt muted>
          Connect by private invitation. Friends can see your current streak,
          selected verified awards and Weekly Board score when you turn on
          sharing.
        </Txt>
        {state && (
          <Toggle
            label="Share with connected friends"
            value={state.sharing}
            disabled={busy}
            onValueChange={(enabled: boolean) =>
              action("friends.sharing", { enabled })
            }
          />
        )}
        <Button
          secondary
          title="Refresh friend streaks"
          disabled={busy}
          onPress={() => action("friends.status")}
        />
      </Card>
      {state && (
        <>
          <Txt size={22} bold>
            Connected friends
          </Txt>
          {!state.friends.length && (
            <Txt muted>Connect with a friend to see them here.</Txt>
          )}
          {state.friends.map(({ id, alias, shared }) => (
            <Card key={id}>
              <Txt size={22} bold>
                {alias}
              </Txt>
              {shared ? (
                <>
                  <Txt>
                    {shared.current} {shared.current === 1 ? "day" : "days"} in
                    a row
                  </Txt>
                  <Row>
                    {TITLES.filter(
                      ([title]) => title === shared.display.title,
                    ).map(([title, name]) => (
                      <Tag key={title}>{name}</Tag>
                    ))}
                    {TAGS.filter(([tag]) =>
                      shared.display.tags.includes(tag),
                    ).map(([tag, name]) => (
                      <Tag key={tag}>{name}</Tag>
                    ))}
                  </Row>
                </>
              ) : (
                <Txt muted>Progress is private.</Txt>
              )}
              <Button
                secondary
                title={`Remove ${alias}`}
                disabled={busy}
                onPress={() =>
                  confirm(
                    `Remove ${alias}?`,
                    "This removes the connection and its sharing access for both players.",
                    "Remove friend",
                    () => action("friends.remove", { id }),
                  )
                }
              />
            </Card>
          ))}
          <Card>
            <Txt size={22} bold>
              Connect with a friend
            </Txt>
            <Txt muted>
              Give this one-use code to a friend you know. It expires in 24
              hours.
            </Txt>
            <Button
              secondary
              title="Create friend code"
              disabled={busy}
              onPress={() => action("friends.invite")}
            />
            {state.code && (
              <>
                <Txt
                  size={20}
                  bold
                  selectable
                  testID="friend-code"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {state.code.value.slice(0, 8)} {state.code.value.slice(8)}
                </Txt>
                <Button
                  secondary
                  title="Copy friend code"
                  onPress={async () => {
                    try {
                      await Clipboard.setStringAsync(state.code!.value);
                      notify("Friend code copied.");
                    } catch {
                      notify("Select and copy the friend code above.", "error");
                    }
                  }}
                />
              </>
            )}
            <Input
              label="Friend code"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              maxLength={18}
              testID="friend-code-input"
            />
            <Button
              title="Connect"
              disabled={busy || code.replace(/\s+/g, "").length !== 16}
              onPress={async () => {
                if (
                  await action("friends.join", {
                    code: code.replace(/\s+/g, ""),
                  })
                )
                  setCode("");
              }}
            />
          </Card>
        </>
      )}
    </>
  );
}
