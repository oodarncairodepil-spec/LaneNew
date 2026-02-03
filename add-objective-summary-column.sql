-- ============================================================================
-- Add summary column to objectives table
-- ============================================================================
-- This script adds a summary column to the objectives table in Supabase.
-- Run this script in the Supabase SQL Editor.
-- ============================================================================

-- Add summary column to objectives table (nullable, optional field)
ALTER TABLE objectives 
ADD COLUMN IF NOT EXISTS summary TEXT;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
-- The summary column has been added to the objectives table.
-- ============================================================================

