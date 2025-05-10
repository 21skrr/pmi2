import {
  Task,
  Event,
  Course,
  OnboardingMetrics,
  AttentionItem,
  Activity,
  TeamOverview,
  PendingReview,
  ManagerEvent,
  PerformanceMetric,
  SupervisorTeamMember,
  SupervisorEvaluation,
  SupervisorEvent,
  SupervisorMetrics,
} from "../types/dashboard";
import { AppUser } from "../types/user";

const API_BASE = "http://localhost:3000";

// 🟢 Used in EmployeeDashboard
export const fetchTasks = async (): Promise<Task[]> => {
  const res = await fetch(`${API_BASE}/tasks`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
};

export const fetchEvents = async (): Promise<Event[]> => {
  const res = await fetch(`${API_BASE}/events`);
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
};

export const fetchTrainingCourses = async (): Promise<Course[]> => {
  const res = await fetch(`${API_BASE}/trainingCourses`);
  if (!res.ok) throw new Error("Failed to fetch training courses");
  return res.json();
};

// 🟡 Used in HRDashboard
export const fetchHRMetrics = async (): Promise<OnboardingMetrics> => {
  const res = await fetch(`${API_BASE}/hrMetrics`);
  if (!res.ok) throw new Error("Failed to fetch HR metrics");
  return res.json();
};

export const fetchAttentionItems = async (): Promise<AttentionItem[]> => {
  const res = await fetch(`${API_BASE}/attentionItems`);
  if (!res.ok) throw new Error("Failed to fetch attention items");
  return res.json();
};

export const fetchRecentActivities = async (): Promise<Activity[]> => {
  const res = await fetch(`${API_BASE}/recentActivities`);
  if (!res.ok) throw new Error("Failed to fetch recent activities");
  return res.json();
};

// 🔵 Used in ManagerDashboard
export const fetchTeamOverview = async (): Promise<TeamOverview> => {
  const res = await fetch(`${API_BASE}/teamOverview`);
  if (!res.ok) throw new Error("Failed to fetch team overview");
  return res.json();
};

export const fetchPendingReviews = async (): Promise<PendingReview[]> => {
  const res = await fetch(`${API_BASE}/pendingReviews`);
  if (!res.ok) throw new Error("Failed to fetch pending reviews");
  return res.json();
};

export const fetchManagerEvents = async (): Promise<ManagerEvent[]> => {
  const res = await fetch(`${API_BASE}/upcomingEvents`);
  if (!res.ok) throw new Error("Failed to fetch manager events");
  return res.json();
};

export const fetchPerformanceMetrics = async (): Promise<
  PerformanceMetric[]
> => {
  const res = await fetch(`${API_BASE}/performanceMetrics`);
  if (!res.ok) throw new Error("Failed to fetch performance metrics");
  return res.json();
};
export const fetchUserOnboarding = async (): Promise<AppUser> => {
  const res = await fetch(`${API_BASE}/userOnboarding`);
  if (!res.ok) throw new Error("Failed to fetch user onboarding");
  return res.json();
};

// 🟣 Used in SupervisorDashboard
export const fetchSupervisorTeam = async (): Promise<
  SupervisorTeamMember[]
> => {
  const res = await fetch(`${API_BASE}/supervisorTeam`);
  if (!res.ok) throw new Error("Failed to fetch supervisor team");
  return res.json();
};

export const fetchSupervisorEvaluations = async (): Promise<
  SupervisorEvaluation[]
> => {
  const res = await fetch(`${API_BASE}/supervisorEvaluations`);
  if (!res.ok) throw new Error("Failed to fetch evaluations");
  return res.json();
};

export const fetchSupervisorEvents = async (): Promise<SupervisorEvent[]> => {
  const res = await fetch(`${API_BASE}/supervisorEvents`);
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
};

export const fetchSupervisorMetrics = async (): Promise<SupervisorMetrics> => {
  const res = await fetch(`${API_BASE}/supervisorMetrics`);
  if (!res.ok) throw new Error("Failed to fetch supervisor metrics");
  return res.json();
};
