import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log('[PIX] Function loaded successfully');

serve(async (req) => {
  console.log('[PIX] Request received:', req.method, req.url);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[PIX] CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  // Test response first
  console.log('[PIX] Sending test response');
  return new Response(
    JSON.stringify({ 
      success: false,
      error: 'Function is deployed but PIX_KEY_PROD not configured yet. Configure the secret first.' 
    }),
    { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );

})