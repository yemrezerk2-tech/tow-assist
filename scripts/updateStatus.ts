import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateAssignmentHelpId() {
  const { data, error } = await supabase
    .from('drivers')
    .update({ available: 'false' })      // ✅ correct column
    .eq('id', 'DRV1767730058182')     // ✅ target assignment
    .select()
    .single()

  if (error) {
    console.error('❌ Update failed:', error)
  } else {
    console.log('✅ Assignment updated:', data)
  }
}

updateAssignmentHelpId()
