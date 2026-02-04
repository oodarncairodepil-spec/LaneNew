import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types matching our schema
export type Database = {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          summary: string | null;
          goals: string[];
          goal_answers: string[];
          status: 'not_started' | 'in_progress' | 'completed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          summary?: string | null;
          goals?: string[];
          status?: 'not_started' | 'in_progress' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          summary?: string | null;
          goals?: string[];
          goal_answers?: string[];
          status?: 'not_started' | 'in_progress' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
      };
      lessons: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          summary: string | null;
          project_questions: string | null;
          goals: string[];
          goal_answers: string[];
          status: 'not_started' | 'in_progress' | 'completed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          summary?: string | null;
          project_questions?: string | null;
          goals?: string[];
          goal_answers?: string[];
          status?: 'not_started' | 'in_progress' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          summary?: string | null;
          project_questions?: string | null;
          goals?: string[];
          goal_answers?: string[];
          status?: 'not_started' | 'in_progress' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
      };
      objectives: {
        Row: {
          id: string;
          lesson_id: string;
          title: string;
          summary: string | null;
          status: 'not_started' | 'in_progress' | 'completed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          title: string;
          summary?: string | null;
          status?: 'not_started' | 'in_progress' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          title?: string;
          summary?: string | null;
          status?: 'not_started' | 'in_progress' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
      };
      resources: {
        Row: {
          id: string;
          objective_id: string;
          description: string;
          link: string | null;
          summary: string | null;
          status: 'not_started' | 'in_progress' | 'completed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          objective_id: string;
          description: string;
          link?: string | null;
          summary?: string | null;
          status?: 'not_started' | 'in_progress' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          objective_id?: string;
          description?: string;
          link?: string | null;
          summary?: string | null;
          status?: 'not_started' | 'in_progress' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

