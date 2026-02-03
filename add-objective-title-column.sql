-- ============================================================================
-- Add title column to objectives table
-- ============================================================================
-- This script adds a title column to the objectives table in Supabase.
-- Run this script in the Supabase SQL Editor.
-- ============================================================================

-- Step 1: Add title column as nullable first (to handle existing data)
ALTER TABLE objectives 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Step 2: Update existing rows to use description as title, or set a default
-- (This handles migration of existing data)
UPDATE objectives 
SET title = COALESCE(
  NULLIF(description, ''), 
  'Untitled Objective'
)
WHERE title IS NULL;

-- Step 3: Set default value for future inserts
ALTER TABLE objectives 
ALTER COLUMN title SET DEFAULT '';

-- Step 4: Make title NOT NULL (after setting defaults for existing data)
ALTER TABLE objectives 
ALTER COLUMN title SET NOT NULL;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
-- The title column has been added to the objectives table.
-- ============================================================================

