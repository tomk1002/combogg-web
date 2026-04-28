import { lolGameSpecificSchema } from "./lol/schema";
import type { ZodSchema } from "zod";

export const gameSchemas: Record<string, ZodSchema> = {
  lol: lolGameSpecificSchema,
};

export function validateGameSpecific(gameSlug: string, data: unknown) {
  const schema = gameSchemas[gameSlug];
  if (!schema) throw new Error(`지원하지 않는 게임: ${gameSlug}`);
  return schema.parse(data);
}
