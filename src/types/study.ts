// Study Progress Tracker - Type Definitions

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type ResourceType = 'video' | 'document';

export interface Resource {
  id: string;
  description: string;
  link: string;
  summary: string;
  status: ProgressStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Objective {
  id: string;
  title: string;
  summary: string;
  resources: Resource[];
  status: ProgressStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  summary: string;
  projectQuestions: string;
  goals: string[];
  goalAnswers: string[];
  objectives: Objective[];
  status: ProgressStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  summary: string;
  goals: string[];
  goalAnswers: string[];
  lessons: Lesson[];
  status: ProgressStatus;
  createdAt: string;
  updatedAt: string;
}

// Helper type for creating new items
export type CreateCourse = Omit<Course, 'id' | 'lessons' | 'createdAt' | 'updatedAt'>;
export type CreateLesson = Omit<Lesson, 'id' | 'objectives' | 'createdAt' | 'updatedAt'>;
export type CreateObjective = Omit<Objective, 'id' | 'resources' | 'createdAt' | 'updatedAt'>;
export type CreateResource = Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>;
