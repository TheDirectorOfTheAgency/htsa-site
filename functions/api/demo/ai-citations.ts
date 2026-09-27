import { handleAiCitations, type CitationEnv } from "../../lib/ai-citations";
import { demoHits } from "../../lib/demo-http";

export const onRequestPost: PagesFunction<CitationEnv> = async (context) => {
  return handleAiCitations({
    request: context.request,
    env: context.env,
    fetch: globalThis.fetch.bind(globalThis),
    hits: demoHits,
  });
};

export const onRequest: PagesFunction<CitationEnv> = async (context) => {
  if (context.request.method === "POST") return onRequestPost(context);
  return handleAiCitations({
    request: context.request,
    env: context.env,
    fetch: globalThis.fetch.bind(globalThis),
    hits: demoHits,
  });
};
