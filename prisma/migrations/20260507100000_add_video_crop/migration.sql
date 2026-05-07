-- Add videoCrop JSONB column to combos
-- Stores normalized crop region { x, y, w, h, ratio } for display-time video cropping.
ALTER TABLE "combos" ADD COLUMN "videoCrop" JSONB;
