/**
 * Database Migration Verification Tests
 * 
 * Feature: bug-fixes-and-deployment
 * Task: 7.5 Test database migrations
 * Requirements: 17.1, 17.3, 17.4
 * 
 * These tests verify that database migrations are correctly structured
 * and will maintain data integrity when applied.
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Database Migration Verification', () => {
  const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');

  describe('Migration 1: Add Tier Enum and Fix Credits Type', () => {
    const migrationDir = path.join(
      migrationsDir,
      '20260204181023_add_tier_enum_and_fix_credits_type'
    );

    it('should have migration.sql file', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      expect(fs.existsSync(migrationFile)).toBe(true);
    });

    it('should create Tier enum with correct values', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      const content = fs.readFileSync(migrationFile, 'utf-8');

      // Check enum creation
      expect(content).toContain('CREATE TYPE "Tier"');
      expect(content).toContain("'Free'");
      expect(content).toContain("'Pro'");
      expect(content).toContain("'Unlimited'");
    });

    it('should convert tier field from String to Tier enum', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      const content = fs.readFileSync(migrationFile, 'utf-8');

      // Check tier column conversion
      expect(content).toContain('tier_new');
      expect(content).toMatch(/tier.*Tier/i);
    });

    it('should convert credits field from String to Int', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      const content = fs.readFileSync(migrationFile, 'utf-8');

      // Check credits column conversion
      expect(content).toContain('credits_new');
      expect(content).toMatch(/credits.*INTEGER/i);
    });

    it('should have data migration logic for tier values', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      const content = fs.readFileSync(migrationFile, 'utf-8');

      // Check case-insensitive tier conversion
      expect(content).toMatch(/LOWER.*tier.*=.*'free'/i);
      expect(content).toMatch(/LOWER.*tier.*=.*'pro'/i);
      expect(content).toMatch(/LOWER.*tier.*=.*'unlimited'/i);
    });

    it('should have data migration logic for credits values', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      const content = fs.readFileSync(migrationFile, 'utf-8');

      // Check credits parsing with default fallback
      expect(content).toMatch(/CAST.*credits.*INTEGER/i);
      expect(content).toContain('10'); // Default value
    });

    it('should set NOT NULL constraints with defaults', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      const content = fs.readFileSync(migrationFile, 'utf-8');

      // Check NOT NULL constraints
      expect(content).toMatch(/tier.*NOT NULL/i);
      expect(content).toMatch(/credits.*NOT NULL/i);
      expect(content).toMatch(/DEFAULT.*'Free'/i);
      expect(content).toMatch(/DEFAULT.*10/);
    });

    it('should have verification SQL file', () => {
      const verifyFile = path.join(migrationDir, 'verify.sql');
      expect(fs.existsSync(verifyFile)).toBe(true);
    });

    it('should have README with rollback procedure', () => {
      const readmeFile = path.join(migrationDir, 'README.md');
      expect(fs.existsSync(readmeFile)).toBe(true);

      const content = fs.readFileSync(readmeFile, 'utf-8');
      expect(content).toContain('Rollback');
      expect(content).toContain('DROP TYPE');
    });
  });

  describe('Migration 2: Update LocalGoogleCredential Foreign Key', () => {
    const migrationDir = path.join(
      migrationsDir,
      '20260204181520_update_local_google_credential_foreign_key'
    );

    it('should have migration.sql file', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      expect(fs.existsSync(migrationFile)).toBe(true);
    });

    it('should drop old foreign key constraint', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      const content = fs.readFileSync(migrationFile, 'utf-8');

      expect(content).toMatch(/DROP CONSTRAINT.*LocalGoogleCredential_userId_fkey/i);
    });

    it('should change userId type from Int to String', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      const content = fs.readFileSync(migrationFile, 'utf-8');

      // Check for TEXT or VARCHAR type
      expect(content).toMatch(/userId_new.*TEXT/i);
    });

    it('should migrate data by joining with User table', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      const content = fs.readFileSync(migrationFile, 'utf-8');

      // Check for JOIN with User table to get clerkId
      expect(content).toMatch(/JOIN.*User/i);
      expect(content).toContain('clerkId');
    });

    it('should create new foreign key referencing clerkId', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      const content = fs.readFileSync(migrationFile, 'utf-8');

      // Check new foreign key references clerkId
      expect(content).toMatch(/FOREIGN KEY.*userId.*REFERENCES.*User.*clerkId/i);
    });

    it('should maintain UNIQUE constraint on userId', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      const content = fs.readFileSync(migrationFile, 'utf-8');

      expect(content).toMatch(/UNIQUE.*userId/i);
    });

    it('should have verification SQL file', () => {
      const verifyFile = path.join(migrationDir, 'verify.sql');
      expect(fs.existsSync(verifyFile)).toBe(true);
    });

    it('should have README with rollback procedure', () => {
      const readmeFile = path.join(migrationDir, 'README.md');
      expect(fs.existsSync(readmeFile)).toBe(true);

      const content = fs.readFileSync(readmeFile, 'utf-8');
      expect(content).toContain('Rollback');
    });
  });

  describe('Migration 3: Add Cascade Deletes to All Foreign Keys', () => {
    const migrationDir = path.join(
      migrationsDir,
      '20260204182104_add_cascade_deletes_to_all_foreign_keys'
    );

    it('should have migration.sql file', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      expect(fs.existsSync(migrationFile)).toBe(true);
    });

    it('should add ON DELETE CASCADE to all foreign keys', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      const content = fs.readFileSync(migrationFile, 'utf-8');

      // Count ON DELETE CASCADE occurrences
      const cascadeMatches = content.match(/ON DELETE CASCADE/gi);
      expect(cascadeMatches).toBeTruthy();
      expect(cascadeMatches!.length).toBeGreaterThan(10); // Should have many cascade deletes
    });

    it('should update LocalGoogleCredential foreign key', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      const content = fs.readFileSync(migrationFile, 'utf-8');

      expect(content).toContain('LocalGoogleCredential');
      expect(content).toContain('ON DELETE CASCADE');
      expect(content).toMatch(/LocalGoogleCredential[\s\S]*?userId[\s\S]*?ON DELETE CASCADE/);
    });

    it('should update DiscordWebhook foreign key', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      const content = fs.readFileSync(migrationFile, 'utf-8');

      expect(content).toContain('DiscordWebhook');
      expect(content).toMatch(/DiscordWebhook[\s\S]*?userId[\s\S]*?ON DELETE CASCADE/);
    });

    it('should update Slack foreign key', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      const content = fs.readFileSync(migrationFile, 'utf-8');

      expect(content).toContain('Slack');
      expect(content).toMatch(/Slack[\s\S]*?userId[\s\S]*?ON DELETE CASCADE/);
    });

    it('should update Notion foreign key', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      const content = fs.readFileSync(migrationFile, 'utf-8');

      expect(content).toContain('Notion');
      expect(content).toMatch(/Notion[\s\S]*?userId[\s\S]*?ON DELETE CASCADE/);
    });

    it('should update Workflows foreign key', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      const content = fs.readFileSync(migrationFile, 'utf-8');

      expect(content).toContain('Workflows');
      expect(content).toMatch(/Workflows[\s\S]*?userId[\s\S]*?ON DELETE CASCADE/);
    });

    it('should update Connections foreign keys', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      const content = fs.readFileSync(migrationFile, 'utf-8');

      // Connections has multiple foreign keys
      expect(content).toContain('Connections');
      expect(content).toMatch(/Connections[\s\S]*?ON DELETE CASCADE/);
    });

    it('should update ApiKey foreign key', () => {
      const migrationFile = path.join(migrationDir, 'migration.sql');
      const content = fs.readFileSync(migrationFile, 'utf-8');

      expect(content).toContain('ApiKey');
      expect(content).toMatch(/ApiKey[\s\S]*?userId[\s\S]*?ON DELETE CASCADE/);
    });

    it('should have verification SQL file', () => {
      const verifyFile = path.join(migrationDir, 'verify.sql');
      expect(fs.existsSync(verifyFile)).toBe(true);
    });

    it('should have README with cascade chain documentation', () => {
      const readmeFile = path.join(migrationDir, 'README.md');
      expect(fs.existsSync(readmeFile)).toBe(true);

      const content = fs.readFileSync(readmeFile, 'utf-8');
      expect(content).toContain('Cascade');
      expect(content).toContain('deleted');
    });
  });

  describe('Migration Consistency', () => {
    it('should have all three migrations in correct order', () => {
      const migrations = fs.readdirSync(migrationsDir);

      const migration1 = migrations.find((m) =>
        m.includes('add_tier_enum_and_fix_credits_type')
      );
      const migration2 = migrations.find((m) =>
        m.includes('update_local_google_credential_foreign_key')
      );
      const migration3 = migrations.find((m) =>
        m.includes('add_cascade_deletes_to_all_foreign_keys')
      );

      expect(migration1).toBeTruthy();
      expect(migration2).toBeTruthy();
      expect(migration3).toBeTruthy();

      // Check chronological order
      expect(migration1! < migration2!).toBe(true);
      expect(migration2! < migration3!).toBe(true);
    });

    it('should have README files for all migrations', () => {
      const migrationDirs = [
        '20260204181023_add_tier_enum_and_fix_credits_type',
        '20260204181520_update_local_google_credential_foreign_key',
        '20260204182104_add_cascade_deletes_to_all_foreign_keys',
      ];

      migrationDirs.forEach((dir) => {
        const readmeFile = path.join(migrationsDir, dir, 'README.md');
        expect(fs.existsSync(readmeFile)).toBe(true);
      });
    });

    it('should have verification SQL for all migrations', () => {
      const migrationDirs = [
        '20260204181023_add_tier_enum_and_fix_credits_type',
        '20260204181520_update_local_google_credential_foreign_key',
        '20260204182104_add_cascade_deletes_to_all_foreign_keys',
      ];

      migrationDirs.forEach((dir) => {
        const verifyFile = path.join(migrationsDir, dir, 'verify.sql');
        expect(fs.existsSync(verifyFile)).toBe(true);
      });
    });
  });
});
