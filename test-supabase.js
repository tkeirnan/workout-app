const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('1. URL exists:', !!supabaseUrl);
console.log('2. Key exists:', !!supabaseKey);
if (supabaseUrl) {
  console.log('3. Project ID:', supabaseUrl.split('//')[1]?.split('.')[0]);
}
