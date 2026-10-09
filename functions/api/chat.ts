import { handleChat, type ChatEnv } from "../lib/handle-chat";

const hits = new Map<string, number[]>();

export const onRequest: PagesFunction<ChatEnv> = async (context) =>
  handleChat({
    request: context.request,
    env: context.env,
    fetch: globalThis.fetch.bind(globalThis),
    hits,
  });
