#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Simple test script to validate worker dependencies and connections
const testSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
})

async function runTests() {
  console.log('🧪 Running Visual Translator Worker Tests\n')

  // Test 1: Environment Variables
  console.log('1. Testing environment configuration...')
  const envResult = testSchema.safeParse(process.env)
  if (envResult.success) {
    console.log('   ✅ Environment variables valid')
  } else {
    console.log('   ❌ Environment variables invalid:')
    envResult.error.errors.forEach(error => {
      console.log(`      - ${error.path.join('.')}: ${error.message}`)
    })
    console.log('   📝 Please check your .env file')
    return
  }

  // Test 2: Supabase Connection
  console.log('\n2. Testing Supabase connection...')
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('ai_jobs')
      .select('count')
      .limit(1)

    if (error) {
      throw error
    }

    console.log('   ✅ Supabase connection successful')
  } catch (error) {
    console.log('   ❌ Supabase connection failed:', error.message)
    return
  }

  // Test 3: Gemini API
  console.log('\n3. Testing Gemini API...')
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Translate "Hello" to Spanish' }]
          }]
        })
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log('   ✅ Gemini API connection successful')
    } else {
      throw new Error('Invalid response format')
    }
  } catch (error) {
    console.log('   ❌ Gemini API test failed:', error.message)
    return
  }

  // Test 4: Database Schema
  console.log('\n4. Testing database schema...')
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check required tables exist
    const tables = ['ai_jobs', 'ai_results', 'assets']
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0)

      if (error) {
        throw new Error(`Table ${table} not accessible: ${error.message}`)
      }
    }

    console.log('   ✅ Database schema validation successful')
  } catch (error) {
    console.log('   ❌ Database schema test failed:', error.message)
    return
  }

  console.log('\n🎉 All tests passed! Worker is ready to run.')
  console.log('\n📋 Next steps:')
  console.log('   1. Start the worker: npm run dev')
  console.log('   2. Create a translation job via the API')
  console.log('   3. Monitor the worker logs for processing updates')
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Test runner failed:', error)
  process.exit(1)
})
