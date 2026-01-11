export enum JobType {
  SOMOSUM = 'SomosUm',
  VIBETEEN = 'Vibe Teen',
  IPE = 'IPE'
}

export enum Priority {
  HIGH = 'Alta',
  MEDIUM = 'Média',
  LOW = 'Baixa'
}

export enum Effort {
  EASY = 'Fácil',
  MEDIUM = 'Médio',
  HARD = 'Difícil'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  job: JobType;
  deadline: string; // ISO Date string YYYY-MM-DD
  priority: Priority;
  effort: Effort;
  completed: boolean;
  createdAt: number;
}

export type ViewMode = 'DASHBOARD' | JobType;

export interface SortOption {
  field: 'deadline' | 'priority' | 'effort';
  direction: 'asc' | 'desc';
}