-- ============================================================================
-- Remove type column from resources table
-- ============================================================================
-- This script removes the type column from the resources table in Supabase.
-- Run this script in the Supabase SQL Editor.
-- ============================================================================

-- Drop the type column from resources table
ALTER TABLE resources 
DROP COLUMN IF EXISTS type;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
-- The type column has been removed from the resources table.
-- ============================================================================

