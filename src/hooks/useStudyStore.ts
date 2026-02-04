import { useState, useEffect, useCallback } from 'react';
import type { Course, Lesson, Objective, Resource, CreateCourse, CreateLesson, CreateObjective, CreateResource, ProgressStatus } from '@/types/study';
import {
  loadAllData,
  createCourse as supabaseCreateCourse,
  updateCourse as supabaseUpdateCourse,
  deleteCourse as supabaseDeleteCourse,
  createLesson as supabaseCreateLesson,
  updateLesson as supabaseUpdateLesson,
  deleteLesson as supabaseDeleteLesson,
  createObjective as supabaseCreateObjective,
  updateObjective as supabaseUpdateObjective,
  deleteObjective as supabaseDeleteObjective,
  createResource as supabaseCreateResource,
  updateResource as supabaseUpdateResource,
  deleteResource as supabaseDeleteResource,
} from '@/lib/supabase-helpers';

export function useStudyStore() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from Supabase on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await loadAllData();
        setCourses(data);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Reload data after mutations
  const reloadData = useCallback(async () => {
    try {
      const data = await loadAllData();
      setCourses(data);
    } catch (err) {
      console.error('Error reloading data:', err);
    }
  }, []);

  // Course operations
  const addCourse = useCallback(async (data: CreateCourse): Promise<Course | null> => {
    const newCourse = await supabaseCreateCourse(data);
    if (newCourse) {
      await reloadData();
      return newCourse;
    }
    return null;
  }, [reloadData]);

  const updateCourse = useCallback(async (courseId: string, updates: Partial<CreateCourse>) => {
    const success = await supabaseUpdateCourse(courseId, updates);
    if (success) {
      await reloadData();
    }
  }, [reloadData]);

  const deleteCourse = useCallback(async (courseId: string) => {
    const success = await supabaseDeleteCourse(courseId);
    if (success) {
      await reloadData();
    }
  }, [reloadData]);

  const getCourse = useCallback((courseId: string): Course | undefined => {
    return courses.find(c => c.id === courseId);
  }, [courses]);

  // Lesson operations
  const addLesson = useCallback(async (courseId: string, data: CreateLesson): Promise<Lesson | undefined> => {
    const newLesson = await supabaseCreateLesson(courseId, data);
    if (newLesson) {
      await reloadData();
      return newLesson;
    }
    return undefined;
  }, [reloadData]);

  const updateLesson = useCallback(async (courseId: string, lessonId: string, updates: Partial<CreateLesson>) => {
    const success = await supabaseUpdateLesson(lessonId, updates);
    if (success) {
      await reloadData();
    }
  }, [reloadData]);

  const deleteLesson = useCallback(async (courseId: string, lessonId: string) => {
    const success = await supabaseDeleteLesson(lessonId);
    if (success) {
      await reloadData();
    }
  }, [reloadData]);

  const getLesson = useCallback((courseId: string, lessonId: string): Lesson | undefined => {
    const course = courses.find(c => c.id === courseId);
    return course?.lessons.find(l => l.id === lessonId);
  }, [courses]);

  // Objective operations
  const addObjective = useCallback(async (courseId: string, lessonId: string, data: CreateObjective): Promise<Objective | undefined> => {
    const newObjective = await supabaseCreateObjective(lessonId, data);
    if (newObjective) {
      await reloadData();
      return newObjective;
    }
    return undefined;
  }, [reloadData]);

  const updateObjective = useCallback(async (courseId: string, lessonId: string, objectiveId: string, updates: Partial<CreateObjective>) => {
    const success = await supabaseUpdateObjective(objectiveId, updates);
    if (success) {
      await reloadData();
    }
  }, [reloadData]);

  const deleteObjective = useCallback(async (courseId: string, lessonId: string, objectiveId: string) => {
    const success = await supabaseDeleteObjective(objectiveId);
    if (success) {
      await reloadData();
    }
  }, [reloadData]);

  const getObjective = useCallback((courseId: string, lessonId: string, objectiveId: string): Objective | undefined => {
    const lesson = getLesson(courseId, lessonId);
    return lesson?.objectives.find(o => o.id === objectiveId);
  }, [getLesson]);

  // Resource operations
  const addResource = useCallback(async (courseId: string, lessonId: string, objectiveId: string, data: CreateResource): Promise<Resource | undefined> => {
    const newResource = await supabaseCreateResource(objectiveId, data);
    if (newResource) {
      await reloadData();
      return newResource;
    }
    return undefined;
  }, [reloadData]);

  const updateResource = useCallback(async (courseId: string, lessonId: string, objectiveId: string, resourceId: string, updates: Partial<CreateResource>) => {
    const success = await supabaseUpdateResource(resourceId, updates);
    if (success) {
      await reloadData();
    }
  }, [reloadData]);

  const deleteResource = useCallback(async (courseId: string, lessonId: string, objectiveId: string, resourceId: string) => {
    const success = await supabaseDeleteResource(resourceId);
    if (success) {
      await reloadData();
    }
  }, [reloadData]);

  // Status helpers
  const updateCourseStatus = useCallback((courseId: string, status: ProgressStatus) => {
    updateCourse(courseId, { status });
  }, [updateCourse]);

  const updateLessonStatus = useCallback((courseId: string, lessonId: string, status: ProgressStatus) => {
    updateLesson(courseId, lessonId, { status });
  }, [updateLesson]);

  const updateObjectiveStatus = useCallback((courseId: string, lessonId: string, objectiveId: string, status: ProgressStatus) => {
    updateObjective(courseId, lessonId, objectiveId, { status });
  }, [updateObjective]);

  const updateResourceStatus = useCallback((courseId: string, lessonId: string, objectiveId: string, resourceId: string, status: ProgressStatus) => {
    updateResource(courseId, lessonId, objectiveId, resourceId, { status });
  }, [updateResource]);

  // Statistics
  const getCourseStats = useCallback((course: Course) => {
    const totalLessons = course.lessons.length;
    const completedLessons = course.lessons.filter(l => l.status === 'completed').length;
    const totalObjectives = course.lessons.reduce((acc, l) => acc + l.objectives.length, 0);
    const completedObjectives = course.lessons.reduce((acc, l) => 
      acc + l.objectives.filter(o => o.status === 'completed').length, 0
    );
    const totalResources = course.lessons.reduce((acc, l) => 
      acc + l.objectives.reduce((acc2, o) => acc2 + o.resources.length, 0), 0
    );
    const completedResources = course.lessons.reduce((acc, l) => 
      acc + l.objectives.reduce((acc2, o) => 
        acc2 + o.resources.filter(r => r.status === 'completed').length, 0
      ), 0
    );
    
    // Calculate goals completion (course-level goals + lesson-level goals)
    const courseGoalsTotal = course.goals?.length || 0;
    const courseGoalsCompleted = (course.goalAnswers || [])
      .slice(0, courseGoalsTotal)
      .filter((answer) => Boolean(answer && answer.trim().length > 0)).length;

    const lessonGoalsTotal = course.lessons.reduce((acc, lesson) => acc + (lesson.goals?.length || 0), 0);
    const lessonGoalsCompleted = course.lessons.reduce((acc, lesson) => {
      const total = lesson.goals?.length || 0;
      const completed = (lesson.goalAnswers || [])
        .slice(0, total)
        .filter((answer) => Boolean(answer && answer.trim().length > 0)).length;
      return acc + completed;
    }, 0);

    const totalGoals = courseGoalsTotal + lessonGoalsTotal;
    const completedGoals = courseGoalsCompleted + lessonGoalsCompleted;

    return {
      totalLessons,
      completedLessons,
      totalObjectives,
      completedObjectives,
      totalResources,
      completedResources,
      totalGoals,
      completedGoals,
      progressPercent: totalResources > 0 ? Math.round((completedResources / totalResources) * 100) : 0,
    };
  }, []);

  return {
    courses,
    loading,
    error,
    // Course
    addCourse,
    updateCourse,
    deleteCourse,
    getCourse,
    updateCourseStatus,
    // Lesson
    addLesson,
    updateLesson,
    deleteLesson,
    getLesson,
    updateLessonStatus,
    // Objective
    addObjective,
    updateObjective,
    deleteObjective,
    getObjective,
    updateObjectiveStatus,
    // Resource
    addResource,
    updateResource,
    deleteResource,
    updateResourceStatus,
    // Stats
    getCourseStats,
  };
}
