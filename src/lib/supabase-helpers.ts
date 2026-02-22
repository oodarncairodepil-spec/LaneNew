import { supabase } from './supabase';
import type { Course, Lesson, Objective, Resource, CreateCourse, CreateLesson, CreateObjective, CreateResource, ProgressStatus } from '@/types/study';

// Helper function to calculate objective status based on resources
export const calculateObjectiveStatus = (resources: Resource[]): ProgressStatus => {
  if (resources.length === 0) {
    return 'not_started';
  }

  const hasInProgressOrCompleted = resources.some(r => r.status === 'in_progress' || r.status === 'completed');
  const allCompleted = resources.every(r => r.status === 'completed');

  let status: ProgressStatus;
  if (allCompleted) {
    status = 'completed';
  } else if (hasInProgressOrCompleted) {
    status = 'in_progress';
  } else {
    status = 'not_started';
  }

  console.log('Calculating objective status:', {
    resourcesCount: resources.length,
    resourceStatuses: resources.map(r => r.status),
    calculatedStatus: status
  });

  return status;
};

// Helper function to calculate lesson status based on objectives and goals
export const calculateLessonStatus = (
  objectives: Objective[],
  goals?: string[],
  goalAnswers?: string[]
): ProgressStatus => {
  // Calculate goals completion
  const totalGoals = goals?.length || 0;
  const completedGoals = totalGoals > 0 && goalAnswers 
    ? goalAnswers.filter((answer, index) => {
        return answer && answer.trim().length > 0 && index < totalGoals;
      }).length 
    : 0;
  const allGoalsCompleted = totalGoals > 0 && completedGoals === totalGoals;
  const hasGoalProgress = completedGoals > 0 && completedGoals < totalGoals;

  // Calculate objectives completion
  const totalObjectives = objectives.length;
  const completedObjectives = objectives.filter(o => o.status === 'completed').length;
  const inProgressObjectives = objectives.filter(o => o.status === 'in_progress').length;
  const allObjectivesCompleted = totalObjectives > 0 && completedObjectives === totalObjectives;
  const hasObjectiveProgress = completedObjectives > 0 || inProgressObjectives > 0;

  // Determine status
  // If everything is completed, status is 'completed'
  const allCompleted = (totalGoals === 0 || allGoalsCompleted) && (totalObjectives === 0 || allObjectivesCompleted);
  
  // If there's any progress (goals or objectives), status is 'in_progress'
  const hasAnyProgress = hasGoalProgress || hasObjectiveProgress || 
    (completedGoals > 0 && totalGoals > 0) || 
    (completedObjectives > 0 || inProgressObjectives > 0);

  let status: ProgressStatus;
  if (allCompleted && (totalGoals > 0 || totalObjectives > 0)) {
    status = 'completed';
  } else if (hasAnyProgress) {
    status = 'in_progress';
  } else {
    status = 'not_started';
  }


  return status;
};

// Transform database row to app format
const transformCourse = (row: any): Course => ({
  id: row.id,
  title: row.title,
  description: row.description || '',
  summary: row.summary || '',
  goals: row.goals || [],
  goalAnswers: row.goal_answers || [],
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
  goalAnswers: row.goal_answers || [],
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
  status: row.status || 'not_started',
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

    // Map lessons to courses and recalculate status
    const lessonsByCourseId = new Map<string, Lesson[]>();
    (lessonsData || []).forEach(lessonRow => {
      if (lessonRow.course_id) {
        const lesson = lessons.find(l => l.id === lessonRow.id);
        if (lesson) {
          // Recalculate lesson status based on current goals and objectives
          const lessonObjectives = objectivesByLessonId.get(lessonRow.id) || [];
          const recalculatedStatus = calculateLessonStatus(
            lessonObjectives,
            lesson.goals,
            lesson.goalAnswers
          );
          // Update lesson with recalculated status and objectives
          const lessonWithObjectives: Lesson = {
            ...lesson,
            status: recalculatedStatus,
            objectives: lessonObjectives,
          };
          
          if (!lessonsByCourseId.has(lessonRow.course_id)) {
            lessonsByCourseId.set(lessonRow.course_id, []);
          }
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
        goal_answers: data.goalAnswers || [],
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
        ...(updates.goalAnswers !== undefined && { goal_answers: updates.goalAnswers || [] }),
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
        goal_answers: data.goalAnswers || [],
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
        ...(updates.goalAnswers !== undefined && { goal_answers: updates.goalAnswers || [] }),
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

    // Auto-update lesson status based on objectives
    const { data: allObjectives, error: objectivesError } = await supabase
      .from('objectives')
      .select('status')
      .eq('lesson_id', lessonId);

    if (objectivesError) {
      console.error('Error fetching objectives for lesson status update:', objectivesError);
    } else if (allObjectives) {
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('goals, goal_answers')
        .eq('id', lessonId)
        .single();

      const objectives: Objective[] = allObjectives.map((o: any) => ({
        id: '',
        title: '',
        summary: '',
        resources: [],
        status: o.status,
        createdAt: '',
        updatedAt: '',
      }));

      const newStatus = calculateLessonStatus(
        objectives,
        lessonData?.goals || [],
        lessonData?.goal_answers || []
      );
      const { error: lessonUpdateError } = await supabase
        .from('lessons')
        .update({ status: newStatus })
        .eq('id', lessonId);

      if (lessonUpdateError) {
        console.error('Error updating lesson status:', lessonUpdateError);
      } else {
        console.log('Lesson status updated successfully (createObjective):', {
          lessonId,
          newStatus
        });
      }
    }

    return objective ? transformObjective(objective) : null;
  } catch (error) {
    console.error('Error creating objective:', error);
    return null;
  }
};

export const updateObjective = async (objectiveId: string, updates: Partial<CreateObjective>): Promise<boolean> => {
  try {
    // Get lesson_id before updating
    const { data: objectiveData } = await supabase
      .from('objectives')
      .select('lesson_id')
      .eq('id', objectiveId)
      .single();

    const { error } = await supabase
      .from('objectives')
      .update({
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.summary !== undefined && { summary: updates.summary || null }),
        ...(updates.status !== undefined && { status: updates.status }),
      })
      .eq('id', objectiveId);

    if (error) throw error;

    // Auto-update lesson status based on objectives and goals
    if (objectiveData?.lesson_id) {
      const { data: allObjectives, error: objectivesError } = await supabase
        .from('objectives')
        .select('status')
        .eq('lesson_id', objectiveData.lesson_id);

      const { data: lessonData } = await supabase
        .from('lessons')
        .select('goals, goal_answers')
        .eq('id', objectiveData.lesson_id)
        .single();

      if (objectivesError) {
        console.error('Error fetching objectives for lesson status update:', objectivesError);
      } else if (allObjectives) {
        const objectives: Objective[] = allObjectives.map((o: any) => ({
          id: '',
          title: '',
          summary: '',
          resources: [],
          status: o.status,
          createdAt: '',
          updatedAt: '',
        }));

        const newStatus = calculateLessonStatus(
          objectives,
          lessonData?.goals || [],
          lessonData?.goal_answers || []
        );
        const { error: lessonUpdateError } = await supabase
          .from('lessons')
          .update({ status: newStatus })
          .eq('id', objectiveData.lesson_id);

        if (lessonUpdateError) {
          console.error('Error updating lesson status:', lessonUpdateError);
        } else {
          console.log('Lesson status updated successfully (updateObjective):', {
            lessonId: objectiveData.lesson_id,
            newStatus
          });
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating objective:', error);
    return false;
  }
};

export const deleteObjective = async (objectiveId: string): Promise<boolean> => {
  try {
    // Get lesson_id before deleting
    const { data: objectiveData } = await supabase
      .from('objectives')
      .select('lesson_id')
      .eq('id', objectiveId)
      .single();

    const { error } = await supabase
      .from('objectives')
      .delete()
      .eq('id', objectiveId);

    if (error) throw error;

    // Auto-update lesson status based on remaining objectives
    if (objectiveData?.lesson_id) {
      const { data: allObjectives, error: objectivesError } = await supabase
        .from('objectives')
        .select('status')
        .eq('lesson_id', objectiveData.lesson_id);

      if (objectivesError) {
        console.error('Error fetching objectives for lesson status update:', objectivesError);
      } else if (allObjectives && allObjectives.length > 0) {
        const { data: lessonData } = await supabase
          .from('lessons')
          .select('goals, goal_answers')
          .eq('id', objectiveData.lesson_id)
          .single();

        const objectives: Objective[] = allObjectives.map((o: any) => ({
          id: '',
          title: '',
          summary: '',
          resources: [],
          status: o.status,
          createdAt: '',
          updatedAt: '',
        }));

        const newStatus = calculateLessonStatus(
          objectives,
          lessonData?.goals || [],
          lessonData?.goal_answers || []
        );
        const { error: lessonUpdateError } = await supabase
          .from('lessons')
          .update({ status: newStatus })
          .eq('id', objectiveData.lesson_id);

        if (lessonUpdateError) {
          console.error('Error updating lesson status:', lessonUpdateError);
        } else {
          console.log('Lesson status updated successfully (deleteObjective):', {
            lessonId: objectiveData.lesson_id,
            newStatus
          });
        }
      } else {
        // No objectives left, set to not_started
        const { error: lessonUpdateError } = await supabase
          .from('lessons')
          .update({ status: 'not_started' })
          .eq('id', objectiveData.lesson_id);

        if (lessonUpdateError) {
          console.error('Error updating lesson status to not_started:', lessonUpdateError);
        } else {
          console.log('Lesson status set to not_started (no objectives):', {
            lessonId: objectiveData.lesson_id
          });
        }
      }
    }

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

    // Auto-update objective status based on resources
    const { data: allResources, error: resourcesError } = await supabase
      .from('resources')
      .select('status')
      .eq('objective_id', objectiveId);

    if (resourcesError) {
      console.error('Error fetching resources for objective status update:', resourcesError);
    } else if (allResources) {
      const resources: Resource[] = allResources.map((r: any) => ({
        id: '',
        description: '',
        link: '',
        summary: '',
        status: r.status,
        createdAt: '',
        updatedAt: '',
      }));

        const newStatus = calculateObjectiveStatus(resources);
        const { error: objectiveUpdateError } = await supabase
          .from('objectives')
          .update({ status: newStatus })
          .eq('id', objectiveId);

        if (objectiveUpdateError) {
          console.error('Error updating objective status:', objectiveUpdateError);
        } else {
          console.log('Objective status updated successfully (createResource):', {
            objectiveId,
            newStatus
          });

          // Auto-update lesson status based on objectives
          const { data: objectiveRow } = await supabase
            .from('objectives')
            .select('lesson_id')
            .eq('id', objectiveId)
            .single();

          if (objectiveRow?.lesson_id) {
            const { data: allObjectives, error: objectivesError } = await supabase
              .from('objectives')
              .select('status')
              .eq('lesson_id', objectiveRow.lesson_id);

            if (objectivesError) {
              console.error('Error fetching objectives for lesson status update:', objectivesError);
            } else if (allObjectives) {
              const objectives: Objective[] = allObjectives.map((o: any) => ({
                id: '',
                title: '',
                summary: '',
                resources: [],
                status: o.status,
                createdAt: '',
                updatedAt: '',
              }));

              const { data: lessonData } = await supabase
                .from('lessons')
                .select('goals, goal_answers')
                .eq('id', objectiveRow.lesson_id)
                .single();

              const lessonStatus = calculateLessonStatus(
                objectives,
                lessonData?.goals || [],
                lessonData?.goal_answers || []
              );
              const { error: lessonUpdateError } = await supabase
                .from('lessons')
                .update({ status: lessonStatus })
                .eq('id', objectiveRow.lesson_id);

              if (lessonUpdateError) {
                console.error('Error updating lesson status:', lessonUpdateError);
              } else {
                console.log('Lesson status updated successfully (createResource):', {
                  lessonId: objectiveRow.lesson_id,
                  newStatus: lessonStatus
                });
              }
            }
          }
        }
    }

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

    // Auto-update objective status based on resources
    const { data: resourceData } = await supabase
      .from('resources')
      .select('objective_id')
      .eq('id', resourceId)
      .single();

      if (resourceData?.objective_id) {
      const { data: allResources, error: resourcesError } = await supabase
        .from('resources')
        .select('status')
        .eq('objective_id', resourceData.objective_id);

      if (resourcesError) {
        console.error('Error fetching resources for objective status update:', resourcesError);
      } else if (allResources) {
        const resources: Resource[] = allResources.map((r: any) => ({
          id: '',
          description: '',
          link: '',
          summary: '',
          status: r.status,
          createdAt: '',
          updatedAt: '',
        }));

        const newStatus = calculateObjectiveStatus(resources);
        const { error: objectiveUpdateError } = await supabase
          .from('objectives')
          .update({ status: newStatus })
          .eq('id', resourceData.objective_id);

        if (objectiveUpdateError) {
          console.error('Error updating objective status:', objectiveUpdateError);
        } else {
          console.log('Objective status updated successfully (updateResource):', {
            objectiveId: resourceData.objective_id,
            newStatus
          });

          // Auto-update lesson status based on objectives
          const { data: objectiveRow } = await supabase
            .from('objectives')
            .select('lesson_id')
            .eq('id', resourceData.objective_id)
            .single();

          if (objectiveRow?.lesson_id) {
            const { data: allObjectives, error: objectivesError } = await supabase
              .from('objectives')
              .select('status')
              .eq('lesson_id', objectiveRow.lesson_id);

            if (objectivesError) {
              console.error('Error fetching objectives for lesson status update:', objectivesError);
            } else if (allObjectives) {
              const objectives: Objective[] = allObjectives.map((o: any) => ({
                id: '',
                title: '',
                summary: '',
                resources: [],
                status: o.status,
                createdAt: '',
                updatedAt: '',
              }));

              const { data: lessonData } = await supabase
                .from('lessons')
                .select('goals, goal_answers')
                .eq('id', objectiveRow.lesson_id)
                .single();

              const lessonStatus = calculateLessonStatus(
                objectives,
                lessonData?.goals || [],
                lessonData?.goal_answers || []
              );
              const { error: lessonUpdateError } = await supabase
                .from('lessons')
                .update({ status: lessonStatus })
                .eq('id', objectiveRow.lesson_id);

              if (lessonUpdateError) {
                console.error('Error updating lesson status:', lessonUpdateError);
              } else {
                console.log('Lesson status updated successfully (updateResource):', {
                  lessonId: objectiveRow.lesson_id,
                  newStatus: lessonStatus
                });
              }
            }
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating resource:', error);
    return false;
  }
};

export const deleteResource = async (resourceId: string): Promise<boolean> => {
  try {
    // Get objective_id before deleting
    const { data: resourceData } = await supabase
      .from('resources')
      .select('objective_id')
      .eq('id', resourceId)
      .single();

    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', resourceId);

    if (error) throw error;

    // Auto-update objective status based on remaining resources
    if (resourceData?.objective_id) {
      const { data: allResources, error: resourcesError } = await supabase
        .from('resources')
        .select('status')
        .eq('objective_id', resourceData.objective_id);

      if (resourcesError) {
        console.error('Error fetching resources for objective status update:', resourcesError);
      } else if (allResources && allResources.length > 0) {
        const resources: Resource[] = allResources.map((r: any) => ({
          id: '',
          description: '',
          link: '',
          summary: '',
          status: r.status,
          createdAt: '',
          updatedAt: '',
        }));

        const newStatus = calculateObjectiveStatus(resources);
        const { error: objectiveUpdateError } = await supabase
          .from('objectives')
          .update({ status: newStatus })
          .eq('id', resourceData.objective_id);

        if (objectiveUpdateError) {
          console.error('Error updating objective status:', objectiveUpdateError);
        } else {
          console.log('Objective status updated successfully (deleteResource):', {
            objectiveId: resourceData.objective_id,
            newStatus
          });

          // Auto-update lesson status based on objectives
          const { data: objectiveRow } = await supabase
            .from('objectives')
            .select('lesson_id')
            .eq('id', resourceData.objective_id)
            .single();

          if (objectiveRow?.lesson_id) {
            const { data: allObjectives, error: objectivesError } = await supabase
              .from('objectives')
              .select('status')
              .eq('lesson_id', objectiveRow.lesson_id);

            if (objectivesError) {
              console.error('Error fetching objectives for lesson status update:', objectivesError);
            } else if (allObjectives) {
              const objectives: Objective[] = allObjectives.map((o: any) => ({
                id: '',
                title: '',
                summary: '',
                resources: [],
                status: o.status,
                createdAt: '',
                updatedAt: '',
              }));

              const { data: lessonData } = await supabase
                .from('lessons')
                .select('goals, goal_answers')
                .eq('id', objectiveRow.lesson_id)
                .single();

              const lessonStatus = calculateLessonStatus(
                objectives,
                lessonData?.goals || [],
                lessonData?.goal_answers || []
              );
              const { error: lessonUpdateError } = await supabase
                .from('lessons')
                .update({ status: lessonStatus })
                .eq('id', objectiveRow.lesson_id);

              if (lessonUpdateError) {
                console.error('Error updating lesson status:', lessonUpdateError);
              } else {
                console.log('Lesson status updated successfully (deleteResource):', {
                  lessonId: objectiveRow.lesson_id,
                  newStatus: lessonStatus
                });
              }
            }
          }
        }
      } else {
        // No resources left, set to not_started
        const { error: objectiveUpdateError } = await supabase
          .from('objectives')
          .update({ status: 'not_started' })
          .eq('id', resourceData.objective_id);

        if (objectiveUpdateError) {
          console.error('Error updating objective status to not_started:', objectiveUpdateError);
        } else {
          console.log('Objective status set to not_started (no resources):', {
            objectiveId: resourceData.objective_id
          });

          // Auto-update lesson status based on objectives
          const { data: objectiveRow } = await supabase
            .from('objectives')
            .select('lesson_id')
            .eq('id', resourceData.objective_id)
            .single();

          if (objectiveRow?.lesson_id) {
            const { data: allObjectives, error: objectivesError } = await supabase
              .from('objectives')
              .select('status')
              .eq('lesson_id', objectiveRow.lesson_id);

            if (objectivesError) {
              console.error('Error fetching objectives for lesson status update:', objectivesError);
            } else if (allObjectives) {
              const objectives: Objective[] = allObjectives.map((o: any) => ({
                id: '',
                title: '',
                summary: '',
                resources: [],
                status: o.status,
                createdAt: '',
                updatedAt: '',
              }));

              const { data: lessonData } = await supabase
                .from('lessons')
                .select('goals, goal_answers')
                .eq('id', objectiveRow.lesson_id)
                .single();

              const lessonStatus = calculateLessonStatus(
                objectives,
                lessonData?.goals || [],
                lessonData?.goal_answers || []
              );
              const { error: lessonUpdateError } = await supabase
                .from('lessons')
                .update({ status: lessonStatus })
                .eq('id', objectiveRow.lesson_id);

              if (lessonUpdateError) {
                console.error('Error updating lesson status:', lessonUpdateError);
              } else {
                console.log('Lesson status updated successfully (deleteResource - no resources):', {
                  lessonId: objectiveRow.lesson_id,
                  newStatus: lessonStatus
                });
              }
            }
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error deleting resource:', error);
    return false;
  }
};

