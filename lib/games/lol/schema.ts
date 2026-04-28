import { z } from "zod";

export const lolGameSpecificSchema = z.object({
  required_level: z.number().int().min(1).max(18).optional(),
  ability_haste_min: z.number().int().min(0).optional(),
  attack_speed_min: z.number().min(0).optional(),
  required_items: z.array(z.string()).optional(),
  summoner_spells: z.array(z.string()).optional(),
  runes: z.record(z.string(), z.unknown()).optional(),
});

export type LolGameSpecific = z.infer<typeof lolGameSpecificSchema>;
