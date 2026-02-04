-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('Free', 'Pro', 'Unlimited');

-- Step 1: Add temporary columns for the new types
ALTER TABLE "User" ADD COLUMN "tier_new" "Tier";
ALTER TABLE "User" ADD COLUMN "credits_new" INTEGER;

-- Step 2: Migrate data from String tier to Tier enum
-- Convert existing tier values to enum, defaulting to 'Free' for invalid/null values
UPDATE "User" 
SET "tier_new" = CASE 
  WHEN LOWER(TRIM("tier")) = 'free' THEN 'Free'::"Tier"
  WHEN LOWER(TRIM("tier")) = 'pro' THEN 'Pro'::"Tier"
  WHEN LOWER(TRIM("tier")) = 'unlimited' THEN 'Unlimited'::"Tier"
  ELSE 'Free'::"Tier"
END;

-- Step 3: Migrate data from String credits to Int
-- Parse string credits to integer, defaulting to 10 for invalid/null values
UPDATE "User" 
SET "credits_new" = CASE 
  WHEN "credits" IS NULL OR "credits" = '' THEN 10
  WHEN "credits" ~ '^[0-9]+$' THEN CAST("credits" AS INTEGER)
  ELSE 10
END;

-- Step 4: Drop old columns
ALTER TABLE "User" DROP COLUMN "tier";
ALTER TABLE "User" DROP COLUMN "credits";

-- Step 5: Rename new columns to original names
ALTER TABLE "User" RENAME COLUMN "tier_new" TO "tier";
ALTER TABLE "User" RENAME COLUMN "credits_new" TO "credits";

-- Step 6: Set NOT NULL constraints and defaults
ALTER TABLE "User" ALTER COLUMN "tier" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "tier" SET DEFAULT 'Free';
ALTER TABLE "User" ALTER COLUMN "credits" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "credits" SET DEFAULT 10;
