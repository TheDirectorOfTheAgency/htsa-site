import { handleMapPack } from "../../lib/map-pack";
import { demoHits } from "../../lib/demo-http";

interface Env {
  GOOGLE_MAPS_API_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  return handleMapPack({
    request: context.request,
    env: context.env,
    fetch: globalThis.fetch.bind(globalThis),
    hits: demoHits,
  });
};

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method === "POST") return onRequestPost(context);
  return handleMapPack({
    request: context.request,
    env: context.env,
    fetch: globalThis.fetch.bind(globalThis),
    hits: demoHits,
  });
};
