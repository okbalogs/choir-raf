import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUPABASE_URL = "https://qpkmrrrjtvktdnoibhsx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwa21ycnJqdHZrdGRub2liaHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODYzOTQsImV4cCI6MjA5MTY2MjM5NH0.ZfdJ9z2SOo-2dWtA29P0nQU6ucQCiEQzo-oYS0HXM6s";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
