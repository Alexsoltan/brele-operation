import fs from "node:fs";
import path from "node:path";

export function loadScriptEnv() {
  for (const file of [".env", ".env.local"]) {
    const fullPath = path.join(process.cwd(), file);

    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, "utf8");

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) continue;

      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);

      if (!match) continue;

      const [, key, rawValue] = match;

      if (process.env[key] !== undefined) continue;

      let value = rawValue.trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  }
}

export function getDateArg(defaultDate: Date) {
  const explicit = process.argv.find((arg) => arg.startsWith("--date="));
  const value = explicit?.slice("--date=".length);

  if (!value) return defaultDate;

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid --date value: ${value}. Expected YYYY-MM-DD.`);
  }

  return date;
}

export function getYesterday() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  date.setHours(0, 0, 0, 0);

  return date;
}

export function getStringArg(name: string) {
  const prefix = `--${name}=`;
  const explicit = process.argv.find((arg) => arg.startsWith(prefix));

  return explicit?.slice(prefix.length);
}
