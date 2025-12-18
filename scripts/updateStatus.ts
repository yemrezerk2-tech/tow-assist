import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' }) // 👈 IMPORTANT

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updatePhone() {
  const { error } = await supabase
    .from('drivers')
    .update({ phone: '+4915774585622' })
    .eq('name', 'Alex')

  if (error) {
    console.error('Update failed:', error)
  } else {
    console.log('✅ Driver phone updated successfully')
  }
}


updatePhone()