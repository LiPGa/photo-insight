import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Auth features will be disabled.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Database types
export interface DbPhotoEntry {
  id: string;
  user_id: string;
  title: string | null;
  image_url: string;
  date: string | null;
  location: string | null;
  notes: string | null;
  tags: string[] | null;
  params: Record<string, any> | null;
  scores: Record<string, any>;
  analysis: Record<string, any> | null;
  created_at: string;
}

export interface DbUsageStats {
  id: string;
  user_id: string;
  date: string;
  analysis_count: number;
}

export interface DbUserSettings {
  user_id: string;
  theme: string;
  language: string;
  preferences: Record<string, any>;
  updated_at: string;
}
