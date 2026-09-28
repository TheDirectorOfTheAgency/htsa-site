import { handleVoiceToken } from "../lib/handle-voice-token";

const hits = new Map<string, number[]>();

interface Env {
  XAI_API_KEY: string;
  XAI_VOICE_AGENT_ID: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  return handleVoiceToken({
    request: context.request,
    env: context.env,
    fetch: globalThis.fetch.bind(globalThis),
    hits,
  });
};

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method === "POST") {
    return onRequestPost(context);
  }
  return handleVoiceToken({
    request: context.request,
    env: context.env,
    fetch: globalThis.fetch.bind(globalThis),
    hits,
  });
};
