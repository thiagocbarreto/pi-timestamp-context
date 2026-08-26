import assert from "node:assert/strict";
import test from "node:test";

import type { ContextEvent, ExtensionAPI } from "@earendil-works/pi-coding-agent";

import timestampContext, {
  attachTimestampContext,
  formatTimestampContext,
} from "../extensions/timestamp-context.ts";

test("formats an exact timestamp with a human-readable datetime", () => {
  assert.equal(
    formatTimestampContext(0, "UTC"),
    '<user_message_time unix_ms="0">Local datetime: Thursday, January 1, 1970 at 12:00:00.000 AM GMT+00:00</user_message_time>',
  );
});

test("adds time context to string and image user messages without changing stored messages", () => {
  const messages = [
    {
      role: "user",
      content: "First message",
      timestamp: 0,
    },
    {
      role: "user",
      content: [
        { type: "text", text: "Second message" },
        { type: "image", data: "abc", mimeType: "image/png" },
      ],
      timestamp: 1_000,
    },
  ] as ContextEvent["messages"];
  const original = structuredClone(messages);

  const result = attachTimestampContext(messages, "UTC");

  assert.deepEqual(messages, original);
  assert.deepEqual(result, [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: '<user_message_time unix_ms="0">Local datetime: Thursday, January 1, 1970 at 12:00:00.000 AM GMT+00:00</user_message_time>',
        },
        { type: "text", text: "First message" },
      ],
      timestamp: 0,
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: '<user_message_time unix_ms="1000">Local datetime: Thursday, January 1, 1970 at 12:00:01.000 AM GMT+00:00</user_message_time>',
        },
        { type: "text", text: "Second message" },
        { type: "image", data: "abc", mimeType: "image/png" },
      ],
      timestamp: 1_000,
    },
  ]);
});

test("leaves non-user messages and invalid timestamps unchanged", () => {
  const assistant = {
    role: "assistant",
    content: [],
    timestamp: 2_000,
  } as unknown as ContextEvent["messages"][number];
  const invalidUser = {
    role: "user",
    content: "Missing reliable time",
    timestamp: Number.NaN,
  } as ContextEvent["messages"][number];

  const result = attachTimestampContext([assistant, invalidUser], "UTC");

  assert.equal(result[0], assistant);
  assert.equal(result[1], invalidUser);
});

test("registers one context handler", () => {
  let eventName: string | undefined;
  let handler: ((event: ContextEvent) => { messages: ContextEvent["messages"] }) | undefined;
  const pi = {
    on(name: string, registered: typeof handler) {
      eventName = name;
      handler = registered;
    },
  } as unknown as ExtensionAPI;

  timestampContext(pi);

  assert.equal(eventName, "context");
  assert.ok(handler);
  const messages = [{ role: "user", content: "Hello", timestamp: 0 }] as ContextEvent["messages"];
  const result = handler({ type: "context", messages });
  const firstMessage = result.messages[0];
  assert.equal(firstMessage?.role, "user");
  assert.ok(firstMessage && firstMessage.role === "user" && Array.isArray(firstMessage.content));
  const firstBlock = firstMessage.content[0];
  assert.equal(firstBlock?.type, "text");
  assert.match(firstBlock.text, /^<user_message_time unix_ms="0">Local datetime:/);
});
