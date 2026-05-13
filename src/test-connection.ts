import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
    console.log("Login Successful! User ID:", data.user?.id);
  }
}

testLogin();
