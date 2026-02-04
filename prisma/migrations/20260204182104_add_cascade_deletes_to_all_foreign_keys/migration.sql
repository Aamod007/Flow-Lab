-- Migration: Add onDelete: Cascade to all foreign key relationships
-- This ensures that when a parent record is deleted, all related child records are automatically deleted
-- preventing orphaned records in the database.

-- LocalGoogleCredential -> User
ALTER TABLE "LocalGoogleCredential" DROP CONSTRAINT IF EXISTS "LocalGoogleCredential_userId_fkey";
ALTER TABLE "LocalGoogleCredential" 
ADD CONSTRAINT "LocalGoogleCredential_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

-- DiscordWebhook -> User
ALTER TABLE "DiscordWebhook" DROP CONSTRAINT IF EXISTS "DiscordWebhook_userId_fkey";
ALTER TABLE "DiscordWebhook" 
ADD CONSTRAINT "DiscordWebhook_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Slack -> User
ALTER TABLE "Slack" DROP CONSTRAINT IF EXISTS "Slack_userId_fkey";
ALTER TABLE "Slack" 
ADD CONSTRAINT "Slack_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Notion -> User
ALTER TABLE "Notion" DROP CONSTRAINT IF EXISTS "Notion_userId_fkey";
ALTER TABLE "Notion" 
ADD CONSTRAINT "Notion_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Connections -> DiscordWebhook
ALTER TABLE "Connections" DROP CONSTRAINT IF EXISTS "Connections_discordWebhookId_fkey";
ALTER TABLE "Connections" 
ADD CONSTRAINT "Connections_discordWebhookId_fkey" 
FOREIGN KEY ("discordWebhookId") REFERENCES "DiscordWebhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Connections -> Notion
ALTER TABLE "Connections" DROP CONSTRAINT IF EXISTS "Connections_notionId_fkey";
ALTER TABLE "Connections" 
ADD CONSTRAINT "Connections_notionId_fkey" 
FOREIGN KEY ("notionId") REFERENCES "Notion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Connections -> User
ALTER TABLE "Connections" DROP CONSTRAINT IF EXISTS "Connections_userId_fkey";
ALTER TABLE "Connections" 
ADD CONSTRAINT "Connections_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Connections -> Slack
ALTER TABLE "Connections" DROP CONSTRAINT IF EXISTS "Connections_slackId_fkey";
ALTER TABLE "Connections" 
ADD CONSTRAINT "Connections_slackId_fkey" 
FOREIGN KEY ("slackId") REFERENCES "Slack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Workflows -> User
ALTER TABLE "Workflows" DROP CONSTRAINT IF EXISTS "Workflows_userId_fkey";
ALTER TABLE "Workflows" 
ADD CONSTRAINT "Workflows_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

-- ApiKey -> User
ALTER TABLE "ApiKey" DROP CONSTRAINT IF EXISTS "ApiKey_userId_fkey";
ALTER TABLE "ApiKey" 
ADD CONSTRAINT "ApiKey_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

-- ExecutionLog -> User
ALTER TABLE "ExecutionLog" DROP CONSTRAINT IF EXISTS "ExecutionLog_userId_fkey";
ALTER TABLE "ExecutionLog" 
ADD CONSTRAINT "ExecutionLog_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

-- CostTracking -> User
ALTER TABLE "CostTracking" DROP CONSTRAINT IF EXISTS "CostTracking_userId_fkey";
ALTER TABLE "CostTracking" 
ADD CONSTRAINT "CostTracking_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

-- OllamaModel -> User
ALTER TABLE "OllamaModel" DROP CONSTRAINT IF EXISTS "OllamaModel_userId_fkey";
ALTER TABLE "OllamaModel" 
ADD CONSTRAINT "OllamaModel_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AIAgentConfig -> User
ALTER TABLE "AIAgentConfig" DROP CONSTRAINT IF EXISTS "AIAgentConfig_userId_fkey";
ALTER TABLE "AIAgentConfig" 
ADD CONSTRAINT "AIAgentConfig_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

-- BudgetSettings -> User
ALTER TABLE "BudgetSettings" DROP CONSTRAINT IF EXISTS "BudgetSettings_userId_fkey";
ALTER TABLE "BudgetSettings" 
ADD CONSTRAINT "BudgetSettings_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Note: Schedule and ExecutionLog -> Workflows already have CASCADE from previous migrations
