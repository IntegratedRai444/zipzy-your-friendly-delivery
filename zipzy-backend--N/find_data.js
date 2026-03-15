const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wezzkfolnfcryyuetjwm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlenprZm9sbmZjcnl5dWV0andtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU2ODQxOSwiZXhwIjoyMDg5MTQ0NDE5fQ.hhsJTn_bMyvhkgptTpTT7yI7ui9OOCMLg1xn19Xolqo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findAnyUser() {
  const tables = ['users', 'wallets', 'requests', 'deliveries', 'messages'];
  for (const table of tables) {
    console.log(`Checking ${table}...`);
    const { data, error } = await supabase.from(table).select('*').limit(5);
    if (error) {
      console.log(`  Error or No access: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`  Found ${data.length} records in ${table}`);
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log(`  Table ${table} is empty.`);
    }
  }
}

findAnyUser();
