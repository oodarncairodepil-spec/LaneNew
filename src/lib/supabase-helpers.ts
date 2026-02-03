import { supabase } from './supabase';
import type { Course, Lesson, Objective, Resource, CreateCourse, CreateLesson, CreateObjective, CreateResource } from '@/types/study';

// Transform database row to app format
const transformCourse = (row: any): Course => ({
  id: row.id,
  title: row.title,
  description: row.description || '',
  summary: row.summary || '',
  goals: row.goals || [],
  lessons: [], // Will be populated separately
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const transformLesson = (row: any): Lesson => ({
  id: row.id,
  title: row.title,
  summary: row.summary || '',
  projectQuestions: row.project_questions || '',
  goals: row.goals || [],
  objectives: [], // Will be populated separately
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const transformObjective = (row: any): Objective => ({
  id: row.id,
  title: row.title || '',
  summary: row.summary || '',
  resources: [], // Will be populated separately
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const transformResource = (row: any): Resource => ({
  id: row.id,
  description: row.description,
  link: row.link || '',
  summary: row.summary || '',
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Load all data and build nested structure
export const loadAllData = async (): Promise<Course[]> => {
  try {
    // Load courses
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (coursesError) throw coursesError;
    if (!coursesData) return [];

    // Load lessons
    const { data: lessonsData, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .order('created_at', { ascending: true });

    if (lessonsError) throw lessonsError;

    // Load objectives
    const { data: objectivesData, error: objectivesError } = await supabase
      .from('objectives')
      .select('*')
      .order('created_at', { ascending: true });

    if (objectivesError) throw objectivesError;

    // Load resources
    const { data: resourcesData, error: resourcesError } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: true });

    if (resourcesError) throw resourcesError;

    // Build nested structure
    const courses = coursesData.map(transformCourse);
    const lessons = (lessonsData || []).map(transformLesson);
    const objectives = (objectivesData || []).map(transformObjective);
    const resources = (resourcesData || []).map(transformResource);

    // Create maps for efficient lookup
    // Map resources to objectives
    const resourcesByObjectiveId = new Map<string, Resource[]>();
    (resourcesData || []).forEach(resourceRow => {
      if (resourceRow.objective_id) {
        const resource = resources.find(r => r.id === resourceRow.id);
        if (resource) {
          if (!resourcesByObjectiveId.has(resourceRow.objective_id)) {
            resourcesByObjectiveId.set(resourceRow.objective_id, []);
          }
          resourcesByObjectiveId.get(resourceRow.objective_id)!.push(resource);
        }
      }
    });

    // Map objectives to lessons
    const objectivesByLessonId = new Map<string, Objective[]>();
    (objectivesData || []).forEach(objectiveRow => {
      if (objectiveRow.lesson_id) {
        const objective = objectives.find(o => o.id === objectiveRow.id);
        if (objective) {
          if (!objectivesByLessonId.has(objectiveRow.lesson_id)) {
            objectivesByLessonId.set(objectiveRow.lesson_id, []);
          }
          const objectiveWithResources: Objective = {
            ...objective,
            resources: resourcesByObjectiveId.get(objectiveRow.id) || [],
          };
          objectivesByLessonId.get(objectiveRow.lesson_id)!.push(objectiveWithResources);
        }
      }
    });

    // Map lessons to courses
    const lessonsByCourseId = new Map<string, Lesson[]>();
    (lessonsData || []).forEach(lessonRow => {
      if (lessonRow.course_id) {
        const lesson = lessons.find(l => l.id === lessonRow.id);
        if (lesson) {
          if (!lessonsByCourseId.has(lessonRow.course_id)) {
            lessonsByCourseId.set(lessonRow.course_id, []);
          }
          const lessonWithObjectives: Lesson = {
            ...lesson,
            objectives: objectivesByLessonId.get(lessonRow.id) || [],
          };
          lessonsByCourseId.get(lessonRow.course_id)!.push(lessonWithObjectives);
        }
      }
    });

    // Attach lessons to courses
    courses.forEach(course => {
      course.lessons = lessonsByCourseId.get(course.id) || [];
    });

    return courses;
  } catch (error) {
    console.error('Error loading data from Supabase:', error);
    return [];
  }
};

// Course operations
export const createCourse = async (data: CreateCourse): Promise<Course | null> => {
  try {
    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        title: data.title,
        description: data.description || null,
        summary: data.summary || null,
        goals: data.goals || [],
        status: data.status || 'not_started',
      })
      .select()
      .single();

    if (error) throw error;
    return course ? transformCourse(course) : null;
  } catch (error) {
    console.error('Error creating course:', error);
    return null;
  }
};

export const updateCourse = async (courseId: string, updates: Partial<CreateCourse>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('courses')
      .update({
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description || null }),
        ...(updates.summary !== undefined && { summary: updates.summary || null }),
        ...(updates.goals !== undefined && { goals: updates.goals || [] }),
        ...(updates.status !== undefined && { status: updates.status }),
      })
      .eq('id', courseId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating course:', error);
    return false;
  }
};

export const deleteCourse = async (courseId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting course:', error);
    return false;
  }
};

// Lesson operations
export const createLesson = async (courseId: string, data: CreateLesson): Promise<Lesson | null> => {
  try {
    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert({
        course_id: courseId,
        title: data.title,
        summary: data.summary || null,
        project_questions: data.projectQuestions || null,
        goals: data.goals || [],
        status: data.status || 'not_started',
      })
      .select()
      .single();

    if (error) throw error;
    return lesson ? transformLesson(lesson) : null;
  } catch (error) {
    console.error('Error creating lesson:', error);
    return null;
  }
};

export const updateLesson = async (lessonId: string, updates: Partial<CreateLesson>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('lessons')
      .update({
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.summary !== undefined && { summary: updates.summary || null }),
        ...(updates.projectQuestions !== undefined && { project_questions: updates.projectQuestions || null }),
        ...(updates.goals !== undefined && { goals: updates.goals || [] }),
        ...(updates.status !== undefined && { status: updates.status }),
      })
      .eq('id', lessonId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating lesson:', error);
    return false;
  }
};

export const deleteLesson = async (lessonId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return false;
  }
};

// Objective operations
export const createObjective = async (lessonId: string, data: CreateObjective): Promise<Objective | null> => {
  try {
    const { data: objective, error } = await supabase
      .from('objectives')
      .insert({
        lesson_id: lessonId,
        title: data.title,
        summary: data.summary || null,
        status: data.status || 'not_started',
      })
      .select()
      .single();

    if (error) throw error;
    return objective ? transformObjective(objective) : null;
  } catch (error) {
    console.error('Error creating objective:', error);
    return null;
  }
};

export const updateObjective = async (objectiveId: string, updates: Partial<CreateObjective>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('objectives')
      .update({
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.summary !== undefined && { summary: updates.summary || null }),
        ...(updates.status !== undefined && { status: updates.status }),
      })
      .eq('id', objectiveId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating objective:', error);
    return false;
  }
};

export const deleteObjective = async (objectiveId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('objectives')
      .delete()
      .eq('id', objectiveId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting objective:', error);
    return false;
  }
};

// Resource operations
export const createResource = async (objectiveId: string, data: CreateResource): Promise<Resource | null> => {
  try {
    const { data: resource, error } = await supabase
      .from('resources')
      .insert({
        objective_id: objectiveId,
        description: data.description,
        link: data.link || null,
        summary: data.summary || null,
        status: data.status || 'not_started',
      })
      .select()
      .single();

    if (error) throw error;
    return resource ? transformResource(resource) : null;
  } catch (error) {
    console.error('Error creating resource:', error);
    return null;
  }
};

export const updateResource = async (resourceId: string, updates: Partial<CreateResource>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('resources')
      .update({
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.link !== undefined && { link: updates.link || null }),
        ...(updates.summary !== undefined && { summary: updates.summary || null }),
        ...(updates.status !== undefined && { status: updates.status }),
      })
      .eq('id', resourceId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating resource:', error);
    return false;
  }
};

export const deleteResource = async (resourceId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', resourceId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting resource:', error);
    return false;
  }
};

