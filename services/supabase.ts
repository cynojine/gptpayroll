import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';
import { Database } from '../types';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL and Anon Key must be provided in environment variables. See services/config.ts for more details.");
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
