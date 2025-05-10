// src/components/dashboard/EmployeeDashboard.tsx
import React, { useEffect, useState } from "react";
import { Task, Event, Course } from "../../types/dashboard";
import { AppUser } from "../../types/user";
import {
  fetchTasks,
  fetchEvents,
  fetchTrainingCourses,
  fetchUserOnboarding,
} from "../../api/api";
import { Calendar, CheckSquare, Award, Clock } from "lucide-react";
import OnboardingProgress from "./OnboardingProgress";
import { Link } from "react-router-dom";

const EmployeeDashboard: React.FC = () => {
  const [employee, setEmployee] = useState<AppUser | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const userData = await fetchUserOnboarding();
      const tasksData = await fetchTasks();
      const eventsData = await fetchEvents();
      const coursesData = await fetchTrainingCourses();

      setEmployee(userData);
      setTasks(tasksData);
      setEvents(eventsData);
      setCourses(coursesData);
    };

    loadData();
  }, []);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!employee) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome, {employee.name}!
        </h1>
        <p className="text-gray-600">
          You're in the {employee.programType} program.
          {employee.onboardingStage && (
            <span>
              {" "}
              Currently in the{" "}
              <strong className="text-blue-600 capitalize">
                {employee.onboardingStage}
              </strong>{" "}
              stage of your onboarding journey.
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OnboardingProgress user={employee} />
        </div>

        <div className="space-y-6">
          {/* Events */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-blue-600 text-white flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              <h2 className="text-lg font-medium">Upcoming Events</h2>
            </div>
            <div className="p-4">
              {events.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No upcoming events
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {events.map((event) => (
                    <li key={event.id} className="py-3">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {event.title}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            event.type === "meeting"
                              ? "bg-blue-100 text-blue-800"
                              : event.type === "training"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {event.type}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Clock size={14} className="mr-1" />
                        {formatDate(event.date)} at {formatTime(event.date)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3">
                <Link
                  to="/calendar"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  View full calendar →
                </Link>
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-orange-500 text-white flex items-center">
              <CheckSquare className="w-5 h-5 mr-2" />
              <h2 className="text-lg font-medium">Tasks</h2>
            </div>
            <div className="p-4">
              {tasks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No tasks</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <li key={task.id} className="py-3 flex items-start">
                      <input
                        type="checkbox"
                        defaultChecked={task.isCompleted}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-3 flex-1">
                        <p
                          className={`text-sm font-medium ${
                            task.isCompleted
                              ? "text-gray-400 line-through"
                              : "text-gray-900"
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          Due: {formatDate(task.dueDate)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3">
                <Link
                  to="/checklists"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  View all tasks →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="p-4 bg-green-600 text-white flex items-center">
              <Award className="w-5 h-5 mr-2" />
              <h2 className="text-lg font-medium">{course.title}</h2>
            </div>
            <div className="p-4">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${course.progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress: {course.progress}%</span>
                <span>
                  {course.modulesCompleted}/{course.totalModules} Modules
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
