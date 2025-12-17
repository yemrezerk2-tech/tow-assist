import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' }) // 👈 IMPORTANT

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase
    .from('assignments')
    .update({ status: 'assigned' })
    .eq('help_id', 'HLPR6PR-87')
    .select()

  if (error) {
    console.error('❌ Update failed:', error)
    process.exit(1)
  }

  console.log('✅ Updated assignment:', data)
}

run()