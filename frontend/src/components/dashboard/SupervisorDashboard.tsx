// SupervisorDashboard.tsx
import React, { useEffect, useState } from "react";
import { AppUser } from "../../types/user";
import {
  Users,
  Calendar,
  ClipboardCheck,
  MessageSquare,
  BarChart2,
} from "lucide-react";
import {
  SupervisorTeamMember,
  SupervisorEvaluation,
  SupervisorEvent,
  SupervisorMetrics,
} from "../../types/dashboard";
import {
  fetchSupervisorTeam,
  fetchSupervisorEvaluations,
  fetchSupervisorEvents,
  fetchSupervisorMetrics,
} from "../../api/api";

interface SupervisorDashboardProps {
  user: AppUser;
}

const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ user }) => {
  const [teamMembers, setTeamMembers] = useState<SupervisorTeamMember[]>([]);
  const [pendingEvaluations, setPendingEvaluations] = useState<
    SupervisorEvaluation[]
  >([]);
  const [upcomingEvents, setUpcomingEvents] = useState<SupervisorEvent[]>([]);
  const [metrics, setMetrics] = useState<SupervisorMetrics | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [team, evaluations, events, metricsData] = await Promise.all([
          fetchSupervisorTeam(),
          fetchSupervisorEvaluations(),
          fetchSupervisorEvents(),
          fetchSupervisorMetrics(),
        ]);
        setTeamMembers(team);
        setPendingEvaluations(evaluations);
        setUpcomingEvents(events);
        setMetrics(metricsData);
      } catch (error) {
        console.error("Failed to load supervisor dashboard data", error);
      }
    };

    loadData();
  }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const formatTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleTimeString("en-US", options);
  };

  const getStageClass = (stage: string) => {
    switch (stage) {
      case "prepare":
        return "bg-gray-100 text-gray-800";
      case "orient":
        return "bg-blue-100 text-blue-800";
      case "land":
        return "bg-yellow-100 text-yellow-800";
      case "integrate":
        return "bg-purple-100 text-purple-800";
      case "excel":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome, {user.name}!
        </h1>
        <p className="text-gray-600">
          You're supervising {teamMembers.length} employees across different
          early career programs.
        </p>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 text-white p-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-medium">Team Overview</h2>
          </div>
          <div className="p-4">
            <div className="flex justify-between mb-4">
              <div className="text-center">
                <span className="block text-2xl font-bold text-gray-900">
                  {teamMembers.length}
                </span>
                <span className="text-sm text-gray-500">Total</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl font-bold text-yellow-500">
                  {metrics?.newCount ?? 0}
                </span>
                <span className="text-sm text-gray-500">New</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl font-bold text-green-500">
                  {metrics?.completingCount ?? 0}
                </span>
                <span className="text-sm text-gray-500">Completing</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-green-600 text-white flex items-center">
            <BarChart2 className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-medium">Team Performance</h2>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Average Onboarding Progress
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {metrics?.onboardingProgress ?? 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-500 h-2.5 rounded-full"
                  style={{ width: `${metrics?.onboardingProgress ?? 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Evaluation Completion Rate
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {metrics?.evaluationRate ?? 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-500 h-2.5 rounded-full"
                  style={{ width: `${metrics?.evaluationRate ?? 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-indigo-600 text-white flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-medium">Feedback Summary</h2>
          </div>
          <div className="p-4 space-y-2">
            {metrics?.feedback?.map((item, i) => (
              <div className="flex justify-between" key={i}>
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-medium text-gray-700">
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-800 text-white flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-medium">Team Members</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamMembers.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{member.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.program}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStageClass(
                        member.stage
                      )}`}
                    >
                      {member.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.progress}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Evaluations */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-orange-500 text-white p-4 flex items-center">
          <ClipboardCheck className="h-5 w-5 mr-2" />
          <h2 className="text-lg font-medium">Pending Evaluations</h2>
        </div>
        <div className="p-4">
          {pendingEvaluations.length === 0 ? (
            <p className="text-gray-500 text-center py-2">
              No pending evaluations
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {pendingEvaluations.map((evaluation) => (
                <li key={evaluation.id} className="py-3">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {evaluation.employeeName}
                    </p>
                    <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                      {evaluation.type}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Due: {formatDate(evaluation.dueDate)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-purple-600 text-white p-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          <h2 className="text-lg font-medium">Upcoming Events</h2>
        </div>
        <div className="p-4">
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-2">No upcoming events</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {upcomingEvents.map((event) => (
                <li key={event.id} className="py-3">
                  <p className="text-sm font-medium text-gray-900">
                    {event.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(event.date)} at {formatTime(event.date)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
