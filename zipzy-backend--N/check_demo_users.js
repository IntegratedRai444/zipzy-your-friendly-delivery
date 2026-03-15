const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wezzkfolnfcryyuetjwm.supabase.co';
const supabaseKey = 'sb_publishable_PagjMO8b1TF4UCDoNwYVXw__RYQQ-vs';
const supabase = createClient(supabaseUrl, supabaseKey);

const DEMO_USER_ID = '12345678-1234-1234-1234-123456789012';
const DEMO_PARTNER_ID = '87654321-4321-4321-4321-210987654321';

async function checkUsers() {
  const { data: userA, error: errA } = await supabase.from('users').select('*').eq('id', DEMO_USER_ID).single();
  const { data: userB, error: errB } = await supabase.from('users').select('*').eq('id', DEMO_PARTNER_ID).single();
  
  console.log('User A exists:', !!userA, errA ? '(Error: ' + errA.message + ')' : '');
  console.log('User B exists:', !!userB, errB ? '(Error: ' + errB.message + ')' : '');
}

checkUsers();
