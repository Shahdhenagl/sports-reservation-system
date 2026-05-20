const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gkrnetehaqpdasloqjaw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrcm5ldGVoYXFwZGFzbG9xamF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODA5NjksImV4cCI6MjA5NDE1Njk2OX0.S5v6KI611CM_I5CwLlDryQRmZvmEjujHi-lfyS0gJ8k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // 1. Get branches
  const { data: branches } = await supabase.from('branches').select('*');
  if (!branches || branches.length === 0) {
    console.log("No branches found.");
    return;
  }
  const branch1 = branches[0];
  const branch2 = branches[1] || branch1;

  // 2. Get activities
  const { data: activities } = await supabase.from('activities').select('*');
  if (!activities || activities.length === 0) {
    console.log("No activities found.");
    return;
  }
  const football = activities.find(a => a.name_ar === 'كرة قدم') || activities[0];
  const padel = activities.find(a => a.name_ar === 'باديل') || activities[0];
  const ps = activities.find(a => a.name_ar === 'بلاي استيشن') || activities[0];

  // 3. Create or get customer
  let customerId;
  const { data: customers } = await supabase.from('customers').select('*');
  if (customers && customers.length > 0) {
    customerId = customers[0].id;
  } else {
    const { data: newCust, error: cErr } = await supabase.from('customers').insert([{
      full_name: 'محمد علي',
      phone: '01012345678',
      phone_code: '+20',
      whatsapp: '01012345678',
      whatsapp_code: '+20',
      total_payments: 250
    }]).select().single();
    if (cErr) {
      console.log("Error creating customer:", cErr);
      return;
    }
    customerId = newCust.id;
  }

  // 4. Create dummy bookings for 2026-05-20 (today)
  const today = '2026-05-20';
  const dummyBookings = [
    {
      booking_ref: 'BK-FOOT1',
      customer_id: customerId,
      branch_id: branch1.id,
      activity_id: football.id,
      activity_name: football.name_ar,
      booking_date: today,
      booking_time: '18:00, 19:00',
      duration: 120,
      players_count: 2,
      total_price: 200,
      amount_paid: 200,
      payment_type: 'full',
      payment_method: 'instapay',
      status: 'approved',
      special_requests: 'حجز ملعب خماسي كرة قدم'
    },
    {
      booking_ref: 'BK-PADL2',
      customer_id: customerId,
      branch_id: branch1.id,
      activity_id: padel.id,
      activity_name: padel.name_ar,
      booking_date: today,
      booking_time: '20:00',
      duration: 60,
      players_count: 2,
      total_price: 100,
      amount_paid: 50,
      payment_type: 'partial',
      payment_method: 'wallet',
      status: 'partially_paid',
      special_requests: 'مطلوب كرات ومضرب'
    },
    {
      booking_ref: 'BK-PLAY3',
      customer_id: customerId,
      branch_id: branch2.id,
      activity_id: ps.id,
      activity_name: ps.name_ar,
      booking_date: today,
      booking_time: '16:00',
      duration: 30,
      players_count: 1,
      total_price: 50,
      amount_paid: 0,
      payment_type: 'partial',
      payment_method: 'cash',
      status: 'pending',
      special_requests: 'ذراع تحكم إضافي'
    }
  ];

  console.log("Seeding bookings...");
  for (const b of dummyBookings) {
    const { data: existing } = await supabase.from('bookings').select('id').eq('booking_ref', b.booking_ref).single();
    if (existing) {
      console.log(`Booking ${b.booking_ref} already exists.`);
      continue;
    }
    const { error: insErr } = await supabase.from('bookings').insert([b]);
    if (insErr) {
      console.log(`Error inserting ${b.booking_ref}:`, insErr);
    } else {
      console.log(`Successfully seeded booking ${b.booking_ref}`);
    }
  }

  console.log("Seeding complete!");
}

main();
