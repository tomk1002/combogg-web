-- Add videoTrim JSONB column to combos
-- Stores playback trim range { start, end } in seconds. No re-encoding —
-- the original file is kept; player limits playback to this range.
ALTER TABLE "combos" ADD COLUMN "videoTrim" JSONB;
