export type InboxItem = {
  id: string;
  kind: "break" | "result" | "deadline";
  at: number;
  code?: string;
  read?: boolean;
};

export type ToastMessage = {
  id: number;
  text: string;
  tone: "info" | "success" | "error";
};

export function quietNow(quiet: boolean, until = 0, now = Date.now()) {
  return quiet || now < until;
}

export function addInboxItem(inbox: InboxItem[] = [], item: InboxItem) {
  return inbox.some((existing) => existing.id === item.id)
    ? inbox
    : [item, ...inbox].slice(0, 30);
}
