import { useState, useEffect, useCallback } from 'react';
import type { Course, Lesson, Objective, Resource, CreateCourse, CreateLesson, CreateObjective, CreateResource, ProgressStatus } from '@/types/study';

const STORAGE_KEY = 'study-progress-data';

const generateId = () => crypto.randomUUID();
const now = () => new Date().toISOString();

// Load initial data from localStorage
const loadData = (): Course[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save data to localStorage
const saveData = (courses: Course[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
};

export function useStudyStore() {
  const [courses, setCourses] = useState<Course[]>(loadData);

  // Persist changes
  useEffect(() => {
    saveData(courses);
  }, [courses]);

  // Course operations
  const addCourse = useCallback((data: CreateCourse): Course => {
    const newCourse: Course = {
      ...data,
      id: generateId(),
      lessons: [],
      createdAt: now(),
      updatedAt: now(),
    };
    setCourses(prev => [...prev, newCourse]);
    return newCourse;
  }, []);

  const updateCourse = useCallback((courseId: string, updates: Partial<CreateCourse>) => {
    setCourses(prev => prev.map(course => 
      course.id === courseId 
        ? { ...course, ...updates, updatedAt: now() }
        : course
    ));
  }, []);

  const deleteCourse = useCallback((courseId: string) => {
    setCourses(prev => prev.filter(course => course.id !== courseId));
  }, []);

  const getCourse = useCallback((courseId: string): Course | undefined => {
    return courses.find(c => c.id === courseId);
  }, [courses]);

  // Lesson operations
  const addLesson = useCallback((courseId: string, data: CreateLesson): Lesson | undefined => {
    const newLesson: Lesson = {
      ...data,
      id: generateId(),
      objectives: [],
      createdAt: now(),
      updatedAt: now(),
    };
    setCourses(prev => prev.map(course =>
      course.id === courseId
        ? { ...course, lessons: [...course.lessons, newLesson], updatedAt: now() }
        : course
    ));
    return newLesson;
  }, []);

  const updateLesson = useCallback((courseId: string, lessonId: string, updates: Partial<CreateLesson>) => {
    setCourses(prev => prev.map(course =>
      course.id === courseId
        ? {
            ...course,
            lessons: course.lessons.map(lesson =>
              lesson.id === lessonId
                ? { ...lesson, ...updates, updatedAt: now() }
                : lesson
            ),
            updatedAt: now(),
          }
        : course
    ));
  }, []);

  const deleteLesson = useCallback((courseId: string, lessonId: string) => {
    setCourses(prev => prev.map(course =>
      course.id === courseId
        ? { ...course, lessons: course.lessons.filter(l => l.id !== lessonId), updatedAt: now() }
        : course
    ));
  }, []);

  const getLesson = useCallback((courseId: string, lessonId: string): Lesson | undefined => {
    const course = courses.find(c => c.id === courseId);
    return course?.lessons.find(l => l.id === lessonId);
  }, [courses]);

  // Objective operations
  const addObjective = useCallback((courseId: string, lessonId: string, data: CreateObjective): Objective | undefined => {
    const newObjective: Objective = {
      ...data,
      id: generateId(),
      resources: [],
      createdAt: now(),
      updatedAt: now(),
    };
    setCourses(prev => prev.map(course =>
      course.id === courseId
        ? {
            ...course,
            lessons: course.lessons.map(lesson =>
              lesson.id === lessonId
                ? { ...lesson, objectives: [...lesson.objectives, newObjective], updatedAt: now() }
                : lesson
            ),
            updatedAt: now(),
          }
        : course
    ));
    return newObjective;
  }, []);

  const updateObjective = useCallback((courseId: string, lessonId: string, objectiveId: string, updates: Partial<CreateObjective>) => {
    setCourses(prev => prev.map(course =>
      course.id === courseId
        ? {
            ...course,
            lessons: course.lessons.map(lesson =>
              lesson.id === lessonId
                ? {
                    ...lesson,
                    objectives: lesson.objectives.map(obj =>
                      obj.id === objectiveId
                        ? { ...obj, ...updates, updatedAt: now() }
                        : obj
                    ),
                    updatedAt: now(),
                  }
                : lesson
            ),
            updatedAt: now(),
          }
        : course
    ));
  }, []);

  const deleteObjective = useCallback((courseId: string, lessonId: string, objectiveId: string) => {
    setCourses(prev => prev.map(course =>
      course.id === courseId
        ? {
            ...course,
            lessons: course.lessons.map(lesson =>
              lesson.id === lessonId
                ? { ...lesson, objectives: lesson.objectives.filter(o => o.id !== objectiveId), updatedAt: now() }
                : lesson
            ),
            updatedAt: now(),
          }
        : course
    ));
  }, []);

  const getObjective = useCallback((courseId: string, lessonId: string, objectiveId: string): Objective | undefined => {
    const lesson = getLesson(courseId, lessonId);
    return lesson?.objectives.find(o => o.id === objectiveId);
  }, [getLesson]);

  // Resource operations
  const addResource = useCallback((courseId: string, lessonId: string, objectiveId: string, data: CreateResource): Resource | undefined => {
    const newResource: Resource = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    setCourses(prev => prev.map(course =>
      course.id === courseId
        ? {
            ...course,
            lessons: course.lessons.map(lesson =>
              lesson.id === lessonId
                ? {
                    ...lesson,
                    objectives: lesson.objectives.map(obj =>
                      obj.id === objectiveId
                        ? { ...obj, resources: [...obj.resources, newResource], updatedAt: now() }
                        : obj
                    ),
                    updatedAt: now(),
                  }
                : lesson
            ),
            updatedAt: now(),
          }
        : course
    ));
    return newResource;
  }, []);

  const updateResource = useCallback((courseId: string, lessonId: string, objectiveId: string, resourceId: string, updates: Partial<CreateResource>) => {
    setCourses(prev => prev.map(course =>
      course.id === courseId
        ? {
            ...course,
            lessons: course.lessons.map(lesson =>
              lesson.id === lessonId
                ? {
                    ...lesson,
                    objectives: lesson.objectives.map(obj =>
                      obj.id === objectiveId
                        ? {
                            ...obj,
                            resources: obj.resources.map(res =>
                              res.id === resourceId
                                ? { ...res, ...updates, updatedAt: now() }
                                : res
                            ),
                            updatedAt: now(),
                          }
                        : obj
                    ),
                    updatedAt: now(),
                  }
                : lesson
            ),
            updatedAt: now(),
          }
        : course
    ));
  }, []);

  const deleteResource = useCallback((courseId: string, lessonId: string, objectiveId: string, resourceId: string) => {
    setCourses(prev => prev.map(course =>
      course.id === courseId
        ? {
            ...course,
            lessons: course.lessons.map(lesson =>
              lesson.id === lessonId
                ? {
                    ...lesson,
                    objectives: lesson.objectives.map(obj =>
                      obj.id === objectiveId
                        ? { ...obj, resources: obj.resources.filter(r => r.id !== resourceId), updatedAt: now() }
                        : obj
                    ),
                    updatedAt: now(),
                  }
                : lesson
            ),
            updatedAt: now(),
          }
        : course
    ));
  }, []);

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

    return {
      totalLessons,
      completedLessons,
      totalObjectives,
      completedObjectives,
      totalResources,
      completedResources,
      progressPercent: totalResources > 0 ? Math.round((completedResources / totalResources) * 100) : 0,
    };
  }, []);

  return {
    courses,
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
