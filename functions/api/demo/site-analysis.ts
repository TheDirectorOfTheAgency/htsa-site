import { handleSiteAnalysis } from "../../lib/site-analysis";
import { demoHits } from "../../lib/demo-http";

export const onRequestPost: PagesFunction = async (context) => {
  return handleSiteAnalysis({
    request: context.request,
    fetch: globalThis.fetch.bind(globalThis),
    hits: demoHits,
  });
};

export const onRequest: PagesFunction = async (context) => {
  if (context.request.method === "POST") return onRequestPost(context);
  return handleSiteAnalysis({
    request: context.request,
    fetch: globalThis.fetch.bind(globalThis),
    hits: demoHits,
  });
};
