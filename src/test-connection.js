const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic env parser
const envContent = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  console.log("Testing connection to:", supabaseUrl);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@gmail.com',
    password: '1234567890',
  });

  if (error) {
    console.error("Login Failed:", error.message);
  } else {
    console.log("Login Successful! User ID:", data.user.id);
  }
}

testLogin();
