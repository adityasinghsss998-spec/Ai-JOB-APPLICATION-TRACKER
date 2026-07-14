const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Supabase URL:", supabaseUrl);
  console.log("Signing in as a test user...");
  
  // Let's first get the user or authenticate if there is any active session, 
  // or we can test using service role key if available
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  
  try {
    console.log("Fetching profiles via Admin client...");
    const { data: profiles, error: err } = await adminClient.from("profiles").select("id, full_name, plan_name, daily_usage_count").limit(5);
    if (err) {
      console.error("Error fetching profiles:", err);
      return;
    }
    
    console.log("Profiles list:", profiles);
    if (profiles.length === 0) {
      console.log("No profiles found.");
      return;
    }
    
    const targetUser = profiles[0];
    console.log(`Calling increment_daily_usage RPC for user ${targetUser.full_name} (${targetUser.id})...`);
    
    const { data: result, error: rpcError } = await adminClient.rpc("increment_daily_usage", {
      p_user_id: targetUser.id,
      p_plan_limit: 3,
    });
    
    if (rpcError) {
      console.error("RPC failed with error:", rpcError);
    } else {
      console.log("RPC Succeeded! Result is:", result);
    }
  } catch (error) {
    console.error("Test script error:", error);
  }
}

main();
