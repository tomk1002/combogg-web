import { unzip } from "fflate";
import { z } from "zod";

// ── manifest.json 스키마 ──────────────────────────────────────
const manifestSchema = z.object({
  version:       z.string(),
  id:            z.string(),
  title:         z.string(),
  game:          z.string(),
  character:     z.string(),
  difficulty:    z.enum(["easy", "medium", "hard"]),
  tags:          z.array(z.string()).default([]),
  duration_ms:   z.number().optional(),
  patch_version: z.string().optional(),
  author:        z.string().optional(),
  created_at:    z.string().optional(),
  key_bindings:  z.record(z.string(), z.string()).optional(),
  game_specific: z.record(z.string(), z.unknown()).default({}),
});

export type ParsedManifest = z.infer<typeof manifestSchema>;

export interface ParsedInput {
  t: number;
  category: string;
  ref?: string;
  slot?: number | string;
}

export interface ParsedStep {
  start: number;
  end: number;
  title: string;
  tip?: string;
}

export interface ParsedTutfile {
  manifest: ParsedManifest;
  inputs: ParsedInput[];
  steps: ParsedStep[];
  videoBuffer: Uint8Array | null;
}

// ── 파싱 (클라이언트/서버 모두 사용 가능) ─────────────────────
export function parseTutfile(buffer: ArrayBuffer): Promise<ParsedTutfile> {
  return new Promise((resolve, reject) => {
    unzip(new Uint8Array(buffer), (err, files) => {
      if (err) return reject(new Error("ZIP 파일을 열 수 없습니다"));

      const readJson = (name: string) => {
        const file = files[name];
        if (!file) throw new Error(`${name} 파일이 없습니다`);
        return JSON.parse(new TextDecoder().decode(file));
      };

      try {
        const manifestRaw = readJson("manifest.json");
        const manifest = manifestSchema.parse(manifestRaw);

        const inputsData = readJson("inputs.json");
        const stepsData  = readJson("steps.json");

        resolve({
          manifest,
          inputs: (inputsData.inputs ?? []) as ParsedInput[],
          steps:  (stepsData.steps  ?? []) as ParsedStep[],
          videoBuffer: files["video.mp4"] ?? null,
        });
      } catch (e) {
        reject(e);
      }
    });
  });
}

// ── inputs → inputSummary 변환 (카드 표시용 요약) ─────────────
export function buildInputSummary(inputs: ParsedInput[]) {
  return inputs.map(({ category, ref, slot }) => ({
    category,
    ...(ref  && { ref }),
    ...(slot !== undefined && { slot }),
  }));
}
