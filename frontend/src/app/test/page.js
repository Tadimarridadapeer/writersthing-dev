'use client'

import { supabase } from '@/lib/supabase'

export default function TestPage() {

  console.log(supabase)

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontSize: '2rem',
      fontFamily: 'sans-serif'
    }}>
      Supabase Connected ✅
    </div>
  )
}
