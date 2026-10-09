const BLOCKED_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.google",
]);

export function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, "").replace(/^\[|\]$/g, "");
}

export function ipv4Parts(host: string): number[] | null {
  const parts = host.split(".");
  if (parts.length !== 4) return null;
  if (parts.some((part) => !/^\d{1,3}$/.test(part))) return null;
  if (parts.some((part) => part.length > 1 && part.startsWith("0"))) return null;
  const nums = parts.map((part) => Number(part));
  if (nums.some((n) => n > 255)) return null;
  return nums;
}

export function isPrivateAddress(host: string): boolean {
  const name = normalizeHost(host);
  if (!name) return true;
  if (name === "::" || name === "::1") return true;
  if (name.startsWith("::ffff:")) return isPrivateAddress(name.slice(7));

  const v4 = ipv4Parts(name);
  if (v4) {
    const [a, b] = v4;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 192 && b === 0) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a >= 224) return true;
    return false;
  }

  if (name.includes(":")) {
    const head = name.split(":")[0] || "";
    if (head.startsWith("fc") || head.startsWith("fd")) return true;
    if (/^fe[89ab]/i.test(head)) return true;
    if (/^fe[cdef]/i.test(head)) return true;
    if (head.startsWith("ff")) return true;
    return false;
  }

  return false;
}

export function isBlockedHostname(hostname: string): boolean {
  const host = normalizeHost(hostname);
  if (!host) return true;
  if (BLOCKED_HOSTS.has(host)) return true;
  if (host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return true;
  if (/^\d+$/.test(host)) return true;
  if (/^(?:\d+\.){3}\d+$/.test(host) && ipv4Parts(host) === null) return true;
  if (host.startsWith("0x") || host.includes("0x")) return true;
  if (isPrivateAddress(host)) return true;
  return false;
}

export type PublicUrl = { ok: true; url: URL } | { ok: false; error: "blocked_url" | "bad_request" };

export function inspectUrl(raw: string): PublicUrl {
  let parsed: URL;
  try {
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^https?:/i.test(raw)) {
      return { ok: false, error: "blocked_url" };
    }
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    parsed = new URL(withProto);
  } catch {
    return { ok: false, error: "bad_request" };
  }
  if (parsed.username || parsed.password) return { ok: false, error: "blocked_url" };
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return { ok: false, error: "blocked_url" };
  if (parsed.port && parsed.port !== "80" && parsed.port !== "443") return { ok: false, error: "blocked_url" };
  if (isBlockedHostname(parsed.hostname)) return { ok: false, error: "blocked_url" };
  return { ok: true, url: parsed };
}
