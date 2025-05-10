export interface Task {
  id: number;
  title: string;
  dueDate: string;
  isCompleted: boolean;
  priority: "high" | "medium" | "low";
}

export interface Event {
  id: number;
  title: string;
  date: string;
  type: "meeting" | "training" | "event";
}

export interface Course {
  id: number;
  title: string;
  progress: number;
  modulesCompleted: number;
  totalModules: number;
}

export interface ProgramDistributionItem {
  program: string;
  count: number;
  color: string;
}

export interface OnboardingMetrics {
  activeEmployees: number;
  pendingOnboarding: number;
  completedThisMonth: number;
  retentionRate: number;
  programDistribution: ProgramDistributionItem[];
}

export interface AttentionItem {
  id: string;
  type: string;
  employee: string;
  dueDate: string;
  status: string;
  description: string;
}

export interface Activity {
  id: string;
  activity: string;
  details: string;
  date: string;
  time: string;
}

export interface TeamOverview {
  totalEmployees: number;
  inOnboarding: number;
  completedOnboarding: number;
  programDistribution: ProgramDistributionItem[];
}

export interface PendingReview {
  id: string;
  employeeName: string;
  evaluationType: string;
  dueDate: string;
  supervisorName: string;
}

export interface ManagerEvent {
  id: string;
  title: string;
  date: string;
  type: "meeting" | "training" | "event" | "planning";
}

export interface PerformanceMetric {
  category: string;
  value: number;
  target: number;
  unit: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  programType?: string;
  onboardingStage?: OnboardingStage;
  onboardingProgress?: number;
}

export type OnboardingStage =
  | "prepare"
  | "orient"
  | "land"
  | "integrate"
  | "excel";

// Used in Supervisor Dashboard
export interface SupervisorTeamMember {
  id: string;
  name: string;
  role: string;
  program: string;
  stage: string;
  progress: number;
  daysInProgram: number;
  avatar: string;
}

export interface SupervisorEvaluation {
  id: string;
  employeeName: string;
  employeeId: string;
  type: string;
  dueDate: string;
}

export interface SupervisorEvent {
  id: string;
  title: string;
  date: string;
  attendees: number;
}
export interface SupervisorMetrics {
  newCount: number;
  completingCount: number;
  onboardingProgress: number;
  evaluationRate: number;
  feedback: {
    label: string;
    value: number;
  }[];
}
