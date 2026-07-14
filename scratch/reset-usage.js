const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  try {
    console.log("Resetting daily usage count for all profiles to 0...");
    const { data, error } = await adminClient
      .from("profiles")
      .update({ daily_usage_count: 0 })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // matches all rows
      
    if (error) {
      console.error("Error resetting usage count:", error);
      return;
    }
    
    console.log("Successfully reset all daily usage counts!");
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
