-- ============================================================================
-- Remove description column from objectives table
-- ============================================================================
-- This script removes the description column from the objectives table in Supabase.
-- Run this script in the Supabase SQL Editor.
-- ============================================================================

-- Drop the description column from objectives table
ALTER TABLE objectives 
DROP COLUMN IF EXISTS description;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
-- The description column has been removed from the objectives table.
-- ============================================================================

