-- Step 1: Drop the existing foreign key constraint
ALTER TABLE "LocalGoogleCredential" DROP CONSTRAINT IF EXISTS "LocalGoogleCredential_userId_fkey";

-- Step 2: Add a temporary column for the new userId type (String/clerkId)
ALTER TABLE "LocalGoogleCredential" ADD COLUMN "userId_new" TEXT;

-- Step 3: Migrate data from Int userId to String userId (clerkId)
-- This joins with the User table to get the clerkId for each userId
UPDATE "LocalGoogleCredential" lgc
SET "userId_new" = u."clerkId"
FROM "User" u
WHERE lgc."userId" = u."id";

-- Step 4: Drop the old userId column
ALTER TABLE "LocalGoogleCredential" DROP COLUMN "userId";

-- Step 5: Rename the new column to userId
ALTER TABLE "LocalGoogleCredential" RENAME COLUMN "userId_new" TO "userId";

-- Step 6: Set NOT NULL constraint and UNIQUE constraint
ALTER TABLE "LocalGoogleCredential" ALTER COLUMN "userId" SET NOT NULL;
CREATE UNIQUE INDEX "LocalGoogleCredential_userId_key" ON "LocalGoogleCredential"("userId");

-- Step 7: Add the new foreign key constraint referencing clerkId
ALTER TABLE "LocalGoogleCredential" 
ADD CONSTRAINT "LocalGoogleCredential_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;
