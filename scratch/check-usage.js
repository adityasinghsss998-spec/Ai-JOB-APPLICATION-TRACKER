const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  try {
    const { data: profiles, error } = await adminClient
      .from("profiles")
      .select("id, full_name, plan_name, plan_limit, daily_usage_count, last_usage_date");
      
    if (error) {
      console.error("Error fetching profiles:", error);
      return;
    }
    
    console.log("Current profiles usage status:");
    console.log(JSON.stringify(profiles, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
