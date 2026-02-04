-- ============================================================================
-- Add goal_answers column to courses and lessons tables
-- ============================================================================
-- This script adds a goal_answers column to store answers for each goal.
-- Run this script in the Supabase SQL Editor.
-- ============================================================================

-- Add goal_answers column to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS goal_answers TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add goal_answers column to lessons table
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS goal_answers TEXT[] DEFAULT ARRAY[]::TEXT[];

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
-- The goal_answers columns have been added to both courses and lessons tables.
-- ============================================================================

