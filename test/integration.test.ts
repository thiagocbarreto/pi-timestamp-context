import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";

import {
  type Api,
  type AssistantMessage,
  type Context,
  createAssistantMessageEventStream,
  InMemoryCredentialStore,
  type Model,
} from "@earendil-works/pi-ai";
import {
  createAgentSession,
  DefaultResourceLoader,
  ModelRuntime,
  SessionManager,
  SettingsManager,
} from "@earendil-works/pi-coding-agent";

const api = "pi-timestamp-context-test";
const provider = "pi-timestamp-context-test";

function assistantMessage(model: Model<Api>): AssistantMessage {
  return {
    role: "assistant",
    content: [],
    api: model.api,
    provider: model.provider,
    model: model.id,
    usage: {
      input: 1,
      output: 1,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 2,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
    },
    stopReason: "pending",
    timestamp: Date.now(),
  };
}

test("Pi sends timestamp metadata to the model without changing stored messages", async () => {
  const receivedContexts: Context[] = [];
  const modelRuntime = await ModelRuntime.create({
    credentials: new InMemoryCredentialStore(),
    modelsPath: null,
    refreshOnCreate: false,
  });
  modelRuntime.registerProvider(provider, {
    api,
    apiKey: "fixture",
    baseUrl: "http://127.0.0.1/unused",
    models: [
      {
        id: "deterministic",
        name: "Timestamp context integration test",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 32_000,
        maxTokens: 1_000,
      },
    ],
    streamSimple(model, context) {
      receivedContexts.push(structuredClone(context));
      const events = createAssistantMessageEventStream();
      const output = assistantMessage(model);

      queueMicrotask(() => {
        events.push({ type: "start", partial: output });
        output.content.push({ type: "text", text: "" });
        events.push({ type: "text_start", contentIndex: 0, partial: output });
        output.content[0] = { type: "text", text: "Received" };
        events.push({
          type: "text_delta",
          contentIndex: 0,
          delta: "Received",
          partial: output,
        });
        events.push({
          type: "text_end",
          contentIndex: 0,
          content: "Received",
          partial: output,
        });
        output.stopReason = "stop";
        events.push({ type: "done", reason: "stop", message: output });
        events.end();
      });

      return events;
    },
  });
  await modelRuntime.refresh({ allowNetwork: false });
  const model = modelRuntime.getModel(provider, "deterministic");
  assert.ok(model);

  const settingsManager = SettingsManager.inMemory({
    compaction: { enabled: false },
    retry: { enabled: false },
  });
  const resourceLoader = new DefaultResourceLoader({
    cwd: process.cwd(),
    agentDir: resolve("test/.pi-agent"),
    settingsManager,
    additionalExtensionPaths: [resolve("extensions/timestamp-context.ts")],
    agentsFilesOverride: () => ({ agentsFiles: [] }),
  });
  await resourceLoader.reload();

  const { session, extensionsResult } = await createAgentSession({
    model,
    modelRuntime,
    noTools: "all",
    resourceLoader,
    sessionManager: SessionManager.inMemory(process.cwd()),
    settingsManager,
  });

  try {
    assert.deepEqual(extensionsResult.errors, []);
    await session.prompt("When did I send this?");

    assert.equal(receivedContexts.length, 1);
    const sentUserMessage = receivedContexts[0]?.messages.find(
      (message) => message.role === "user",
    );
    assert.ok(sentUserMessage && Array.isArray(sentUserMessage.content));
    const timestampBlock = sentUserMessage.content[0];
    assert.ok(timestampBlock?.type === "text");
    assert.match(
      timestampBlock.text,
      /^<user_message_time unix_ms="\d+">Local datetime: .+<\/user_message_time>$/,
    );
    assert.deepEqual(sentUserMessage.content[1], {
      type: "text",
      text: "When did I send this?",
    });

    const storedUserMessage = session.messages.find((message) => message.role === "user");
    assert.ok(storedUserMessage);
    assert.doesNotMatch(JSON.stringify(storedUserMessage), /user_message_time/);
    assert.match(JSON.stringify(storedUserMessage), /When did I send this\?/);
  } finally {
    session.dispose();
  }
});
