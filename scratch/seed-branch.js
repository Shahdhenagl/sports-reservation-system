const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (key) => {
  const match = envContent.match(new RegExp(`${key}=(.*)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Seeding default branch...");
  
  // 1. Fetch existing branches
  const { data: existing, error: fetchErr } = await supabase.from('branches').select('*');
  if (fetchErr) {
    console.error("Error fetching branches:", fetchErr);
    return;
  }

  if (existing.length === 0) {
    const { data: inserted, error: insertErr } = await supabase.from('branches').insert([
      {
        name: 'الفرع الرئيسي',
        address: '123 شارع الرياضة، القاهرة',
        phone: '01000000000'
      }
    ]).select();

    if (insertErr) {
      console.error("Error inserting default branch:", insertErr);
    } else {
      console.log("Successfully seeded default branch:", inserted);
    }
  } else {
    console.log("Branches already exist:", existing);
  }
}

seed();
