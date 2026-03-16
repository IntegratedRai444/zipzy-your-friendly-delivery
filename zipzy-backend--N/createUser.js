const { supabase } = require('./config/supabaseClient');

async function createUser() {
  try {
    console.log('Creating user profile in users table...');
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: '10a8e985-e9c3-49ad-8b7b-ed299b94d2c5',
        email: 'test@zipzy.com',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
    } else {
      console.log('✅ User created successfully:', data);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

createUser();
