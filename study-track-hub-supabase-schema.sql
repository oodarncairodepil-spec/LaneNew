-- ============================================================================
-- Study Track Hub - Supabase Database Schema
-- ============================================================================
-- This script creates the complete database schema for the Study Track Hub
-- application. Run this script in the Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- SECTION 1: Create Enums
-- ============================================================================

-- Drop enums if they exist (for clean reinstall)
DROP TYPE IF EXISTS progress_status CASCADE;
DROP TYPE IF EXISTS resource_type CASCADE;

-- Create progress_status enum
CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed');

-- Create resource_type enum
CREATE TYPE resource_type AS ENUM ('video', 'document');

-- ============================================================================
-- SECTION 2: Create Tables
-- ============================================================================

-- Drop tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS objectives CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS courses CASCADE;

-- Create courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    summary TEXT,
    goals TEXT[] DEFAULT ARRAY[]::TEXT[],
    status progress_status DEFAULT 'not_started',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lessons table
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT,
    project_questions TEXT,
    goals TEXT[] DEFAULT ARRAY[]::TEXT[],
    status progress_status DEFAULT 'not_started',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create objectives table
CREATE TABLE objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status progress_status DEFAULT 'not_started',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create resources table
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objective_id UUID NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    link TEXT,
    type resource_type DEFAULT 'document',
    summary TEXT,
    status progress_status DEFAULT 'not_started',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 3: Create Indexes
-- ============================================================================

-- Indexes for foreign keys (for faster joins)
CREATE INDEX idx_lessons_course_id ON lessons(course_id);
CREATE INDEX idx_objectives_lesson_id ON objectives(lesson_id);
CREATE INDEX idx_resources_objective_id ON resources(objective_id);

-- Indexes for status columns (for faster filtering)
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_lessons_status ON lessons(status);
CREATE INDEX idx_objectives_status ON objectives(status);
CREATE INDEX idx_resources_status ON resources(status);

-- Indexes for timestamps (for sorting and filtering)
CREATE INDEX idx_courses_created_at ON courses(created_at);
CREATE INDEX idx_lessons_created_at ON lessons(created_at);
CREATE INDEX idx_objectives_created_at ON objectives(created_at);
CREATE INDEX idx_resources_created_at ON resources(created_at);

-- ============================================================================
-- SECTION 4: Create Trigger Function for Auto-update updated_at
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 5: Create Triggers
-- ============================================================================

-- Trigger for courses table
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for lessons table
CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for objectives table
CREATE TRIGGER update_objectives_updated_at
    BEFORE UPDATE ON objectives
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for resources table
CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 6: Enable Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 7: Create RLS Policies
-- ============================================================================

-- Policy: Allow all operations for authenticated users
-- Note: Adjust these policies based on your authentication requirements

-- Courses policies
CREATE POLICY "Users can view all courses" ON courses
    FOR SELECT
    USING (true);

CREATE POLICY "Users can insert courses" ON courses
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update courses" ON courses
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can delete courses" ON courses
    FOR DELETE
    USING (true);

-- Lessons policies
CREATE POLICY "Users can view all lessons" ON lessons
    FOR SELECT
    USING (true);

CREATE POLICY "Users can insert lessons" ON lessons
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update lessons" ON lessons
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can delete lessons" ON lessons
    FOR DELETE
    USING (true);

-- Objectives policies
CREATE POLICY "Users can view all objectives" ON objectives
    FOR SELECT
    USING (true);

CREATE POLICY "Users can insert objectives" ON objectives
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update objectives" ON objectives
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can delete objectives" ON objectives
    FOR DELETE
    USING (true);

-- Resources policies
CREATE POLICY "Users can view all resources" ON resources
    FOR SELECT
    USING (true);

CREATE POLICY "Users can insert resources" ON resources
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update resources" ON resources
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can delete resources" ON resources
    FOR DELETE
    USING (true);

-- ============================================================================
-- SECTION 8: Sample Data (Optional - for testing)
-- ============================================================================

-- Uncomment the following section to insert sample data for testing

/*
-- Insert sample course
INSERT INTO courses (title, description, summary, goals, status)
VALUES (
    'Introduction to Liberal Arts',
    'An introductory course exploring the foundations of liberal arts education',
    'This course covers the fundamental principles and applications of liberal arts in modern education.',
    ARRAY[
        'Addresses all of the following emphases: The Foundations of Liberal Arts, Interdisciplinary Insights, Critical Thinking and Problem Solving',
        'Clearly and effectively defends a position on the relevance of liberal arts in the modern world',
        'Project incorporates proper citations',
        'Project is free of major grammatical or syntax errors'
    ],
    'in_progress'
)
RETURNING id;

-- Insert sample lesson (replace the course_id with actual UUID from above)
INSERT INTO lessons (course_id, title, summary, project_questions, goals, status)
VALUES (
    (SELECT id FROM courses LIMIT 1),
    'Chapter 1: Foundations of Liberal Arts',
    'Understanding the historical and philosophical foundations of liberal arts education.',
    'What are the key principles that define liberal arts education? How do they apply in modern contexts?',
    ARRAY[
        'Understand the historical development of liberal arts',
        'Identify key philosophical principles',
        'Apply concepts to modern educational contexts'
    ],
    'not_started'
)
RETURNING id;

-- Insert sample objective (replace the lesson_id with actual UUID from above)
INSERT INTO objectives (lesson_id, description, status)
VALUES (
    (SELECT id FROM lessons LIMIT 1),
    'Understand core concepts of liberal arts and their relevance in the modern world',
    'not_started'
)
RETURNING id;

-- Insert sample resource (replace the objective_id with actual UUID from above)
INSERT INTO resources (objective_id, description, link, type, summary, status)
VALUES (
    (SELECT id FROM objectives LIMIT 1),
    'Video from Labyrinths on the liberal arts',
    'https://youtube.com/watch?v=example',
    'video',
    'This video explores the liberal arts as the arts that liberate. They liberate us to actualize our potential as human beings and to live a flourishing life.',
    'not_started'
);
*/

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
-- Schema creation complete!
-- You can now use these tables in your Supabase project.
-- ============================================================================

