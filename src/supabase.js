import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl !== "YOUR_SUPABASE_URL";

if (!isConfigured) {
  console.warn(
    "Supabase credentials are not set. Please update your .env file.",
  );
}

// Only create dummy client if not configured to prevent crash
export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : { 
      from: () => ({ 
        select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }), 
        insert: () => Promise.resolve({ error: new Error('Supabase not configured') }) 
      }),
      channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }) }),
      removeChannel: () => {}
    };

