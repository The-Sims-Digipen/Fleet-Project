import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

import { normalizePreset, presetFileVersion, type VehiclePreset } from "../src/vehicles/types.ts";

/** Route the running UI posts its preset library to. */
export const savePresetsRoute = "/__save-presets";

/** Only ever this one file: the path is never taken from the request. */
const seedFilePath = fileURLToPath(new URL("../src/vehicles/defaults.json", import.meta.url));

const maxBodyBytes = 1_000_000;

function readBody(stream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    stream.setEncoding("utf8");
    stream.on("data", (chunk: string) => {
      body += chunk;
      if (body.length > maxBodyBytes) reject(new Error("Payload too large."));
    });
    stream.on("end", () => resolve(body));
    stream.on("error", reject);
  });
}

/**
 * Validates an incoming library using the same `normalizePreset` the browser
 * uses, so the seed file can never be overwritten with something the app would
 * refuse to load. Catalog keys are not checked here because that would pull the
 * Three.js object catalog into the Vite config; the browser already rejects an
 * unknown modelId before sending, and `loadDefaultPresets` skips one on read.
 */
function validate(text: string): { ok: true; presets: VehiclePreset[] } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "Body is not valid JSON." };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return { ok: false, error: "Body is not a preset library." };
  const file = parsed as Record<string, unknown>;
  if (file.version !== presetFileVersion) return { ok: false, error: `Unsupported file version ${String(file.version)}; expected ${presetFileVersion}.` };
  if (!Array.isArray(file.presets)) return { ok: false, error: "Body has no preset list." };

  const presets: VehiclePreset[] = [];
  const seen = new Set<string>();
  for (const [index, record] of file.presets.entries()) {
    const preset = normalizePreset(record);
    if (!preset) return { ok: false, error: `Preset ${index + 1} is invalid. Nothing was written.` };
    if (seen.has(preset.id)) return { ok: false, error: `Preset ${index + 1} repeats id "${preset.id}". Nothing was written.` };
    seen.add(preset.id);
    presets.push(preset);
  }
  return { ok: true, presets };
}

/**
 * Dev-only endpoint letting the running UI write the seed preset file on disk,
 * so values tuned in the browser survive a reload without a manual download.
 *
 * `apply: "serve"` means this is never part of a production build — there is no
 * write endpoint in the shipped app.
 */
export function savePresets(): Plugin {
  return {
    name: "fleet:save-presets",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(savePresetsRoute, (request, response) => {
        const send = (status: number, body: Record<string, unknown>) => {
          response.statusCode = status;
          response.setHeader("content-type", "application/json");
          response.end(JSON.stringify(body));
        };

        if (request.method !== "POST") return send(405, { ok: false, error: "Use POST." });

        void readBody(request)
          .then(async (text) => {
            const result = validate(text);
            if (!result.ok) return send(400, result);
            const file = { version: presetFileVersion, presets: result.presets };
            await writeFile(seedFilePath, `${JSON.stringify(file, null, 2)}\n`, "utf8");
            server.config.logger.info(`  saved ${result.presets.length} presets to src/vehicles/defaults.json`);
            send(200, { ok: true, count: result.presets.length });
          })
          .catch((error: unknown) => send(500, { ok: false, error: error instanceof Error ? error.message : "Write failed." }));
      });
    },
  };
}
