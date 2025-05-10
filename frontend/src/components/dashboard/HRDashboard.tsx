import React, { useEffect, useState } from "react";
import { AppUser } from "../../types/user";
import {
  fetchHRMetrics,
  fetchAttentionItems,
  fetchRecentActivities,
} from "../../api/api";

import {
  UserPlus,
  Users,
  CalendarClock,
  ClipboardList,
  BarChart,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import type {
  OnboardingMetrics,
  AttentionItem,
  Activity,
  ProgramDistributionItem,
} from "../../types/dashboard";

interface HRDashboardProps {
  user: AppUser;
}

const HRDashboard: React.FC<HRDashboardProps> = ({ user }) => {
  const [metrics, setMetrics] = useState<OnboardingMetrics | null>(null);
  const [attention, setAttention] = useState<AttentionItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [m, a, r] = await Promise.all([
        fetchHRMetrics(),
        fetchAttentionItems(),
        fetchRecentActivities(),
      ]);
      setMetrics(m);
      setAttention(a);
      setActivities(r);
    };
    loadData();
  }, []);

  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome, {user.name}!
        </h1>
        <p className="text-gray-600">
          You have {attention.length} items requiring attention and{" "}
          {metrics.pendingOnboarding} pending onboarding processes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to="/admin/users/new"
          className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg flex items-center"
        >
          <div className="rounded-full bg-blue-100 p-3 mr-3">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Add New Employee</h3>
            <p className="text-sm text-gray-500">Create a new onboarding</p>
          </div>
        </Link>
        <Link
          to="/admin/roles"
          className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg flex items-center"
        >
          <div className="rounded-full bg-green-100 p-3 mr-3">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Manage Roles</h3>
            <p className="text-sm text-gray-500">Assign or update roles</p>
          </div>
        </Link>
        <Link
          to="/admin/programs"
          className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg flex items-center"
        >
          <div className="rounded-full bg-purple-100 p-3 mr-3">
            <ClipboardList className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Programs</h3>
            <p className="text-sm text-gray-500">Manage program details</p>
          </div>
        </Link>
        <Link
          to="/reports"
          className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg flex items-center"
        >
          <div className="rounded-full bg-orange-100 p-3 mr-3">
            <BarChart className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Reports</h3>
            <p className="text-sm text-gray-500">View analytics & data</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md">
          <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              <h2 className="text-lg font-medium">Onboarding Metrics</h2>
            </div>
            <Link
              to="/reports"
              className="text-sm text-blue-100 hover:text-white"
            >
              View All
            </Link>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <span className="block text-3xl font-bold text-gray-900">
                  {metrics.activeEmployees}
                </span>
                <span className="text-sm text-gray-500">Active Employees</span>
              </div>
              <div className="text-center">
                <span className="block text-3xl font-bold text-yellow-500">
                  {metrics.pendingOnboarding}
                </span>
                <span className="text-sm text-gray-500">
                  Pending Onboarding
                </span>
              </div>
              <div className="text-center">
                <span className="block text-3xl font-bold text-green-500">
                  {metrics.completedThisMonth}
                </span>
                <span className="text-sm text-gray-500">
                  Completed This Month
                </span>
              </div>
              <div className="text-center">
                <span className="block text-3xl font-bold text-blue-500">
                  {metrics.retentionRate}%
                </span>
                <span className="text-sm text-gray-500">Retention Rate</span>
              </div>
            </div>

            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Program Distribution
            </h3>
            <div className="space-y-3">
              {metrics.programDistribution.map(
                (program: ProgramDistributionItem) => (
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
                              (program.count / metrics.activeEmployees) * 100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="bg-red-600 p-4 text-white flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-medium">Needs Attention</h2>
          </div>
          <div className="p-4">
            {attention.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No items need attention
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {attention.map((item: AttentionItem) => (
                  <li key={item.id} className="py-4">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {item.employee}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          item.status === "overdue"
                            ? "bg-red-100 text-red-800"
                            : item.status === "delayed"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.description}
                    </p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Due: {item.dueDate}
                      </span>
                      <Link
                        to={`/admin/${item.type}/${item.id}`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-500"
                      >
                        Take action
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <Link
                to="/admin/attention"
                className="block w-full text-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                View All Items
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md">
          <div className="bg-gray-800 p-4 text-white flex items-center justify-between">
            <div className="flex items-center">
              <CalendarClock className="h-5 w-5 mr-2" />
              <h2 className="text-lg font-medium">Recent Activity</h2>
            </div>
            <Link
              to="/admin/activity"
              className="text-sm text-gray-300 hover:text-white"
            >
              View All
            </Link>
          </div>
          <div className="p-4">
            <ul className="divide-y divide-gray-200">
              {activities.map((activity: Activity) => (
                <li key={activity.id} className="py-3">
                  <div className="flex">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.activity}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {activity.details}
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>{activity.date}</p>
                      <p>{activity.time}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
