const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wezzkfolnfcryyuetjwm.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_PagjMO8b1TF4UCDoNwYVXw__RYQQ-vs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name')
    .limit(2);
    
  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
}

getUsers();
