import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixDriverAndAssignments() {
  const driverId = 'DRV1767730058182'

  // 1️⃣ Reset assignments for this driver
  const { error: assignmentError } = await supabase
    .from('assignments')
    .update({ phone: '+491703814443' })
    .eq('driver_id', driverId)

  if (assignmentError) {
    console.error('❌ Assignment update failed:', assignmentError)
    return
  }

  // 2️⃣ Mark driver available (BOOLEAN!)
  const { data, error: driverError } = await supabase
    .from('drivers')
    .update({ available: true })
    .eq('id', driverId)
    .select()
    .single()

  if (driverError) {
    console.error('❌ Driver update failed:', driverError)
  } else {
    console.log('✅ Driver fixed:', data)
  }
}

fixDriverAndAssignments()
