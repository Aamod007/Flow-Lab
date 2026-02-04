/**
 * Database Migration Integration Tests
 * 
 * Feature: bug-fixes-and-deployment
 * Task: 7.5 Test database migrations
 * Example 18: Database Migration Foreign Key Consistency
 * Requirements: 17.1, 17.3, 17.4
 * 
 * These tests verify that migrations maintain data integrity and
 * cascade deletes work correctly.
 * 
 * NOTE: These tests require a test database connection.
 * Set TEST_DATABASE_URL environment variable to run these tests.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient, Tier } from '@prisma/client';

// Skip these tests if no test database is configured
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const describeIfDb = TEST_DATABASE_URL ? describe : describe.skip;

describeIfDb('Migration Integration Tests', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    if (TEST_DATABASE_URL) {
      prisma = new PrismaClient({
        datasources: {
          db: {
            url: TEST_DATABASE_URL,
          },
        },
      });
    }
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  describe('Migration 1: Tier Enum and Credits Type', () => {
    it('should have Tier enum with correct values', async () => {
      // Query to check enum values
      const result = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (
          SELECT oid FROM pg_type WHERE typname = 'Tier'
        )
        ORDER BY enumlabel;
      `;

      const enumValues = result.map((r) => r.enumlabel);
      expect(enumValues).toContain('Free');
      expect(enumValues).toContain('Pro');
      expect(enumValues).toContain('Unlimited');
      expect(enumValues.length).toBe(3);
    });

    it('should have tier column as Tier enum type', async () => {
      const result = await prisma.$queryRaw<
        Array<{ data_type: string; udt_name: string }>
      >`
        SELECT data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'User' AND column_name = 'tier';
      `;

      expect(result.length).toBe(1);
      expect(result[0].data_type).toBe('USER-DEFINED');
      expect(result[0].udt_name).toBe('Tier');
    });

    it('should have credits column as integer type', async () => {
      const result = await prisma.$queryRaw<Array<{ data_type: string }>>`
        SELECT data_type
        FROM information_schema.columns
        WHERE table_name = 'User' AND column_name = 'credits';
      `;

      expect(result.length).toBe(1);
      expect(result[0].data_type).toBe('integer');
    });

    it('should have NOT NULL constraints on tier and credits', async () => {
      const result = await prisma.$queryRaw<
        Array<{ column_name: string; is_nullable: string }>
      >`
        SELECT column_name, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'User' 
        AND column_name IN ('tier', 'credits');
      `;

      const tierColumn = result.find((r) => r.column_name === 'tier');
      const creditsColumn = result.find((r) => r.column_name === 'credits');

      expect(tierColumn?.is_nullable).toBe('NO');
      expect(creditsColumn?.is_nullable).toBe('NO');
    });

    it('should create users with default tier and credits', async () => {
      const testEmail = `test-${Date.now()}@example.com`;
      const testClerkId = `test_clerk_${Date.now()}`;

      const user = await prisma.user.create({
        data: {
          email: testEmail,
          clerkId: testClerkId,
        },
      });

      expect(user.tier).toBe(Tier.Free);
      expect(user.credits).toBe(10);

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should accept all valid tier values', async () => {
      const testCases = [
        { tier: Tier.Free, expected: Tier.Free },
        { tier: Tier.Pro, expected: Tier.Pro },
        { tier: Tier.Unlimited, expected: Tier.Unlimited },
      ];

      for (const testCase of testCases) {
        const testEmail = `test-${testCase.tier}-${Date.now()}@example.com`;
        const testClerkId = `test_clerk_${testCase.tier}_${Date.now()}`;

        const user = await prisma.user.create({
          data: {
            email: testEmail,
            clerkId: testClerkId,
            tier: testCase.tier,
            credits: 100,
          },
        });

        expect(user.tier).toBe(testCase.expected);
        expect(user.credits).toBe(100);

        // Cleanup
        await prisma.user.delete({ where: { id: user.id } });
      }
    });
  });

  describe('Migration 2: LocalGoogleCredential Foreign Key', () => {
    it('should have userId column as text type', async () => {
      const result = await prisma.$queryRaw<Array<{ data_type: string }>>`
        SELECT data_type
        FROM information_schema.columns
        WHERE table_name = 'LocalGoogleCredential' AND column_name = 'userId';
      `;

      expect(result.length).toBe(1);
      expect(['text', 'character varying']).toContain(result[0].data_type);
    });

    it('should have foreign key referencing User.clerkId', async () => {
      const result = await prisma.$queryRaw<
        Array<{
          constraint_name: string;
          column_name: string;
          foreign_table_name: string;
          foreign_column_name: string;
        }>
      >`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'LocalGoogleCredential'
        AND kcu.column_name = 'userId';
      `;

      expect(result.length).toBe(1);
      expect(result[0].foreign_table_name).toBe('User');
      expect(result[0].foreign_column_name).toBe('clerkId');
    });

    it('should maintain UNIQUE constraint on userId', async () => {
      const result = await prisma.$queryRaw<
        Array<{ constraint_type: string }>
      >`
        SELECT tc.constraint_type
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'LocalGoogleCredential'
        AND kcu.column_name = 'userId'
        AND tc.constraint_type = 'UNIQUE';
      `;

      expect(result.length).toBeGreaterThan(0);
    });

    it('should create LocalGoogleCredential with clerkId reference', async () => {
      const testEmail = `test-google-${Date.now()}@example.com`;
      const testClerkId = `test_clerk_google_${Date.now()}`;

      // Create user
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          clerkId: testClerkId,
        },
      });

      // Create LocalGoogleCredential
      const credential = await prisma.localGoogleCredential.create({
        data: {
          userId: testClerkId,
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          expiryDate: new Date(Date.now() + 3600000),
        },
      });

      expect(credential.userId).toBe(testClerkId);

      // Cleanup
      await prisma.localGoogleCredential.delete({ where: { id: credential.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('Migration 3: Cascade Deletes', () => {
    it('should have ON DELETE CASCADE on all foreign keys', async () => {
      const result = await prisma.$queryRaw<
        Array<{
          table_name: string;
          constraint_name: string;
          delete_rule: string;
        }>
      >`
        SELECT
          tc.table_name,
          tc.constraint_name,
          rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        ORDER BY tc.table_name;
      `;

      // All foreign keys should have CASCADE delete rule
      const nonCascadeKeys = result.filter((r) => r.delete_rule !== 'CASCADE');

      if (nonCascadeKeys.length > 0) {
        console.log('Foreign keys without CASCADE:', nonCascadeKeys);
      }

      expect(nonCascadeKeys.length).toBe(0);
    });

    it('should cascade delete LocalGoogleCredential when User is deleted', async () => {
      const testEmail = `test-cascade-google-${Date.now()}@example.com`;
      const testClerkId = `test_clerk_cascade_google_${Date.now()}`;

      // Create user
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          clerkId: testClerkId,
        },
      });

      // Create LocalGoogleCredential
      const credential = await prisma.localGoogleCredential.create({
        data: {
          userId: testClerkId,
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          expiryDate: new Date(Date.now() + 3600000),
        },
      });

      // Delete user
      await prisma.user.delete({ where: { id: user.id } });

      // Verify credential was cascade deleted
      const deletedCredential = await prisma.localGoogleCredential.findUnique({
        where: { id: credential.id },
      });

      expect(deletedCredential).toBeNull();
    });

    it('should cascade delete ApiKey when User is deleted', async () => {
      const testEmail = `test-cascade-apikey-${Date.now()}@example.com`;
      const testClerkId = `test_clerk_cascade_apikey_${Date.now()}`;

      // Create user
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          clerkId: testClerkId,
        },
      });

      // Create ApiKey
      const apiKey = await prisma.apiKey.create({
        data: {
          userId: testClerkId,
          provider: 'test-provider',
          key: 'test-key-value',
        },
      });

      // Delete user
      await prisma.user.delete({ where: { id: user.id } });

      // Verify apiKey was cascade deleted
      const deletedApiKey = await prisma.apiKey.findUnique({
        where: { id: apiKey.id },
      });

      expect(deletedApiKey).toBeNull();
    });

    it('should cascade delete Workflows when User is deleted', async () => {
      const testEmail = `test-cascade-workflow-${Date.now()}@example.com`;
      const testClerkId = `test_clerk_cascade_workflow_${Date.now()}`;

      // Create user
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          clerkId: testClerkId,
        },
      });

      // Create Workflow
      const workflow = await prisma.workflows.create({
        data: {
          userId: testClerkId,
          name: 'Test Workflow',
          description: 'Test Description',
          nodes: '[]',
          edges: '[]',
          publish: false,
        },
      });

      // Delete user
      await prisma.user.delete({ where: { id: user.id } });

      // Verify workflow was cascade deleted
      const deletedWorkflow = await prisma.workflows.findUnique({
        where: { id: workflow.id },
      });

      expect(deletedWorkflow).toBeNull();
    });

    it('should cascade delete multiple related records when User is deleted', async () => {
      const testEmail = `test-cascade-multi-${Date.now()}@example.com`;
      const testClerkId = `test_clerk_cascade_multi_${Date.now()}`;

      // Create user
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          clerkId: testClerkId,
        },
      });

      // Create multiple related records
      const apiKey = await prisma.apiKey.create({
        data: {
          userId: testClerkId,
          provider: 'test-provider',
          key: 'test-key',
        },
      });

      const workflow = await prisma.workflows.create({
        data: {
          userId: testClerkId,
          name: 'Test Workflow',
          description: 'Test',
          nodes: '[]',
          edges: '[]',
          publish: false,
        },
      });

      // Delete user
      await prisma.user.delete({ where: { id: user.id } });

      // Verify all related records were cascade deleted
      const deletedApiKey = await prisma.apiKey.findUnique({
        where: { id: apiKey.id },
      });
      const deletedWorkflow = await prisma.workflows.findUnique({
        where: { id: workflow.id },
      });

      expect(deletedApiKey).toBeNull();
      expect(deletedWorkflow).toBeNull();
    });
  });

  describe('Data Integrity After Migrations', () => {
    it('should not have any NULL tier values', async () => {
      const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM "User"
        WHERE tier IS NULL;
      `;

      expect(Number(result[0].count)).toBe(0);
    });

    it('should not have any NULL credits values', async () => {
      const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM "User"
        WHERE credits IS NULL;
      `;

      expect(Number(result[0].count)).toBe(0);
    });

    it('should not have any orphaned LocalGoogleCredential records', async () => {
      const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM "LocalGoogleCredential" lgc
        LEFT JOIN "User" u ON lgc."userId" = u."clerkId"
        WHERE u."clerkId" IS NULL;
      `;

      expect(Number(result[0].count)).toBe(0);
    });

    it('should not have any orphaned ApiKey records', async () => {
      const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM "ApiKey" ak
        LEFT JOIN "User" u ON ak."userId" = u."clerkId"
        WHERE u."clerkId" IS NULL;
      `;

      expect(Number(result[0].count)).toBe(0);
    });

    it('should not have any orphaned Workflows records', async () => {
      const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM "Workflows" w
        LEFT JOIN "User" u ON w."userId" = u."clerkId"
        WHERE u."clerkId" IS NULL;
      `;

      expect(Number(result[0].count)).toBe(0);
    });

    it('should have all User records with valid tier enum values', async () => {
      const users = await prisma.user.findMany({
        select: { tier: true },
      });

      const validTiers = [Tier.Free, Tier.Pro, Tier.Unlimited];

      users.forEach((user) => {
        expect(validTiers).toContain(user.tier);
      });
    });

    it('should have all User records with positive or zero credits', async () => {
      const users = await prisma.user.findMany({
        select: { credits: true },
      });

      users.forEach((user) => {
        expect(user.credits).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(user.credits)).toBe(true);
      });
    });
  });
});
