import React, { useEffect, useState } from "react";
import { User } from "../../types/user";
import {
  fetchTeamOverview,
  fetchPendingReviews,
  fetchManagerEvents,
  fetchPerformanceMetrics,
} from "../../api/api";
import {
  Users,
  ClipboardCheck,
  Calendar,
  BarChart2,
  MessageSquare,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  TeamOverview,
  PendingReview,
  ManagerEvent,
  PerformanceMetric,
} from "../../types/dashboard";

interface ManagerDashboardProps {
  user: User;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ user }) => {
  const [teamOverview, setTeamOverview] = useState<TeamOverview | null>(null);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<ManagerEvent[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<
    PerformanceMetric[]
  >([]);

  useEffect(() => {
    const loadData = async () => {
      const [teamData, reviewsData, eventsData, metricsData] =
        await Promise.all([
          fetchTeamOverview(),
          fetchPendingReviews(),
          fetchManagerEvents(),
          fetchPerformanceMetrics(),
        ]);
      setTeamOverview(teamData);
      setPendingReviews(reviewsData);
      setUpcomingEvents(eventsData);
      setPerformanceMetrics(metricsData);
    };
    loadData();
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getColor = (val: number, tgt: number) =>
    val >= tgt
      ? "text-green-600"
      : val >= tgt * 0.9
      ? "text-yellow-600"
      : "text-red-600";

  const getEventTypeClass = (type: string) =>
    ({
      meeting: "bg-blue-100 text-blue-800",
      event: "bg-green-100 text-green-800",
      planning: "bg-purple-100 text-purple-800",
    }[type] || "bg-gray-100 text-gray-800");

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome, {user.name}!
        </h1>
        <p className="text-gray-600">
          You have {pendingReviews.length} evaluations awaiting your review and{" "}
          {upcomingEvents.length} upcoming events.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
          <div className="rounded-full bg-blue-100 p-3 mb-3">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <span className="text-2xl font-bold text-gray-900">
            {teamOverview?.totalEmployees ?? 0}
          </span>
          <span className="text-sm text-gray-500">Total Team Members</span>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
          <div className="rounded-full bg-yellow-100 p-3 mb-3">
            <ClipboardCheck className="h-6 w-6 text-yellow-600" />
          </div>
          <span className="text-2xl font-bold text-gray-900">
            {teamOverview?.inOnboarding ?? 0}
          </span>
          <span className="text-sm text-gray-500">In Onboarding</span>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
          <div className="rounded-full bg-green-100 p-3 mb-3">
            <ClipboardCheck className="h-6 w-6 text-green-600" />
          </div>
          <span className="text-2xl font-bold text-gray-900">
            {teamOverview?.completedOnboarding ?? 0}
          </span>
          <span className="text-sm text-gray-500">Completed Onboarding</span>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
          <div className="rounded-full bg-purple-100 p-3 mb-3">
            <MessageSquare className="h-6 w-6 text-purple-600" />
          </div>
          <span className="text-2xl font-bold text-gray-900">
            {pendingReviews.length}
          </span>
          <span className="text-sm text-gray-500">Pending Reviews</span>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center">
            <BarChart2 className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-medium">Team Performance</h2>
          </div>
          <Link
            to="/reports"
            className="text-sm text-blue-100 hover:text-white"
          >
            View Reports
          </Link>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  {metric.category}
                </h3>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-2xl font-bold ${getColor(
                      metric.value,
                      metric.target
                    )}`}
                  >
                    {metric.value}
                    {metric.unit}
                  </span>
                  <span className="text-sm text-gray-500">
                    Target: {metric.target}
                    {metric.unit}
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${
                      metric.value >= metric.target
                        ? "bg-green-500"
                        : metric.value >= metric.target * 0.9
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    } h-2 rounded-full`}
                    style={{
                      width: `${(metric.value / (metric.target * 1.2)) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Program Distribution
          </h3>
          <div className="space-y-3">
            {teamOverview?.programDistribution.map((program) => (
              <div key={program.program} className="flex items-center">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {program.program}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {program.count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`${program.color} h-2.5 rounded-full`}
                      style={{
                        width: `${
                          (program.count /
                            (teamOverview?.totalEmployees || 1)) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evaluations to Review */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-orange-500 p-4 text-white flex items-center">
          <ClipboardCheck className="h-5 w-5 mr-2" />
          <h2 className="text-lg font-medium">Evaluations to Review</h2>
        </div>
        <div className="p-4">
          {pendingReviews.length === 0 ? (
            <p className="text-center text-gray-500 py-2">No pending reviews</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {pendingReviews.map((review) => (
                <li key={review.id} className="py-3">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {review.employeeName}
                    </p>
                    <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                      {review.evaluationType}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Supervisor: {review.supervisorName}
                  </p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Due: {review.dueDate}
                    </span>
                    <Link
                      to={`/evaluations/review/${review.id}`}
                      className="text-xs font-medium text-blue-600 hover:text-blue-500"
                    >
                      Review
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-purple-600 p-4 text-white flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          <h2 className="text-lg font-medium">Upcoming Events</h2>
        </div>
        <div className="p-4">
          {upcomingEvents.length === 0 ? (
            <p className="text-center text-gray-500 py-2">No upcoming events</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {upcomingEvents.map((event) => (
                <li key={event.id} className="py-3">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {event.title}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getEventTypeClass(
                        event.type
                      )}`}
                    >
                      {event.type}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    {formatDate(event.date)} at {formatTime(event.date)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick Team Overview */}
      {teamOverview && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gray-800 p-4 text-white flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              <h2 className="text-lg font-medium">Quick Team Overview</h2>
            </div>
            <Link to="/team" className="text-sm text-gray-300 hover:text-white">
              View All
            </Link>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {teamOverview.programDistribution.map((program) => (
                <div
                  key={program.program}
                  className="bg-gray-50 rounded-lg p-4 border"
                >
                  <h3
                    className={`font-medium mb-2 ${program.color.replace(
                      "bg-",
                      "text-"
                    )}`}
                  >
                    {program.program}
                  </h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Team Members:</span>
                    <span className="font-medium text-gray-700">
                      {program.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
