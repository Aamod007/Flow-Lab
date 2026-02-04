#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Run this before deploying to ensure all required variables are set
 * 
 * Usage: node scripts/validate-env.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Required environment variables
const REQUIRED_VARS = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'DATABASE_URL',
  'STRIPE_SECRET',
  'NEXT_PUBLIC_URL',
];

// Optional environment variables
const OPTIONAL_VARS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'OAUTH2_REDIRECT_URI',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'NOTION_API_SECRET',
  'NOTION_CLIENT_ID',
  'SLACK_CLIENT_ID',
  'SLACK_CLIENT_SECRET',
  'SLACK_SIGNING_SECRET',
];

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log('\n⚠️  Warning: .env.local file not found', 'yellow');
    log('   Create one by copying .env.example:', 'yellow');
    log('   cp .env.example .env.local\n', 'cyan');
    return {};
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

function validateEnvironment() {
  log('\n🔍 Validating Environment Variables...\n', 'cyan');

  const env = loadEnvFile();
  const missing = [];
  const present = [];
  const optionalPresent = [];
  const optionalMissing = [];

  // Check required variables
  REQUIRED_VARS.forEach(varName => {
    if (env[varName] && env[varName].trim() !== '') {
      present.push(varName);
      log(`✅ ${varName}`, 'green');
    } else {
      missing.push(varName);
      log(`❌ ${varName} - MISSING`, 'red');
    }
  });

  log('\n📦 Optional Variables:\n', 'cyan');

  // Check optional variables
  OPTIONAL_VARS.forEach(varName => {
    if (env[varName] && env[varName].trim() !== '') {
      optionalPresent.push(varName);
      log(`✅ ${varName}`, 'green');
    } else {
      optionalMissing.push(varName);
      log(`⚪ ${varName} - Not set (optional)`, 'yellow');
    }
  });

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('📊 Summary', 'cyan');
  log('='.repeat(60), 'blue');
  log(`\nRequired Variables: ${present.length}/${REQUIRED_VARS.length}`, 'cyan');
  log(`Optional Variables: ${optionalPresent.length}/${OPTIONAL_VARS.length}`, 'cyan');

  if (missing.length > 0) {
    log('\n❌ Validation Failed!', 'red');
    log('\nMissing required variables:', 'red');
    missing.forEach(varName => {
      log(`  - ${varName}`, 'red');
    });
    log('\nPlease add these variables to your .env.local file', 'yellow');
    log('See .env.example for reference\n', 'yellow');
    process.exit(1);
  }

  log('\n✅ All required variables are set!', 'green');
  
  if (optionalMissing.length > 0) {
    log('\n⚠️  Optional variables not set:', 'yellow');
    optionalMissing.forEach(varName => {
      log(`  - ${varName}`, 'yellow');
    });
    log('\nThese are only needed if you use the corresponding integrations', 'yellow');
  }

  log('\n🚀 Environment is ready for deployment!\n', 'green');
  process.exit(0);
}

// Run validation
validateEnvironment();
