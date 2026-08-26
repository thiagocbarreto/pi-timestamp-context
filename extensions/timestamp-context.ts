import type { ContextEvent, ExtensionAPI } from "@earendil-works/pi-coding-agent";

const formatterOptions: Intl.DateTimeFormatOptions = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  fractionalSecondDigits: 3,
  timeZoneName: "longOffset",
};

const localFormatter = new Intl.DateTimeFormat("en-US", formatterOptions);

export function formatTimestampContext(timestamp: number, timeZone?: string): string {
  const formatter = timeZone
    ? new Intl.DateTimeFormat("en-US", { ...formatterOptions, timeZone })
    : localFormatter;
  const localDatetime = formatter.format(new Date(timestamp));

  return `<user_message_time unix_ms="${timestamp}">Local datetime: ${localDatetime}</user_message_time>`;
}

export function attachTimestampContext(
  messages: ContextEvent["messages"],
  timeZone?: string,
): ContextEvent["messages"] {
  return messages.map((message) => {
    if (message.role !== "user" || !Number.isFinite(message.timestamp)) return message;

    const timestampContext = {
      type: "text" as const,
      text: formatTimestampContext(message.timestamp, timeZone),
    };
    const content =
      typeof message.content === "string"
        ? [timestampContext, { type: "text" as const, text: message.content }]
        : [timestampContext, ...message.content];

    return { ...message, content };
  });
}

export default function timestampContext(pi: ExtensionAPI): void {
  pi.on("context", (event) => ({
    messages: attachTimestampContext(event.messages),
  }));
}
