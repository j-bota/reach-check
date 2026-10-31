const sensitiveKey = /authorization|proxy.authorization|cookie|api.?key|token|secret|password|passwd|credential|client.?secret|private.?key/i;
const knownCredential = /\b(?:sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9_]{8,}|xox[bpasr]-[A-Za-z0-9-]{8,}|AKIA[0-9A-Z]{12,}|AIza[0-9A-Za-z_-]{20,}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/g;

export function maskSecretsInText(text: string): string {
  return text.replace(knownCredential, "[REDACTED]")
    .replace(/\b(Bearer|Basic)\s+[A-Za-z0-9+/_=.-]+/gi, "$1 [REDACTED]")
    .replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi, "$1[REDACTED]@")
    .replace(/([?&](?:api[_-]?key|token|secret|password|access_token)=)[^&#\s]+/gi, "$1[REDACTED]")
    .replace(/((?:authorization|cookie|api[_-]?key|token|secret|password)\s*[:=]\s*)[^\n,;]+/gi, "$1[REDACTED]");
}

export function redact(value: unknown, key = ""): unknown {
  if (sensitiveKey.test(key) && value != null) return "[REDACTED]";
  if (typeof value === "string") return maskSecretsInText(value);
  if (Array.isArray(value)) return value.map((v) => redact(v, key));
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const headerName = obj["name"] ?? obj["key"];
    const secretPair = typeof headerName === "string" && sensitiveKey.test(headerName);
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k,
      (key === "env" || (secretPair && k === "value")) ? "[REDACTED]" : redact(v, k),
    ]));
  }
  return value;
}

export function excerpt(value: unknown): string {
  return JSON.stringify(redact(value), null, 2);
}