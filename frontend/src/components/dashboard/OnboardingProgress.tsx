import React from "react";
import { CheckCircle, Circle, Clock } from "lucide-react";
import type { AppUser, OnboardingStage } from "../../types/user";

interface OnboardingProgressProps {
  user: AppUser;
}

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ user }) => {
  const stages: OnboardingStage[] = [
    "prepare",
    "orient",
    "land",
    "integrate",
    "excel",
  ];
  const currentStageIndex = stages.findIndex(
    (stage) => stage === user.onboardingStage
  );

  const stageDetails = {
    prepare: {
      title: "Prepare",
      description:
        "Offer – Day 0: Completion of recruiting tasks and communication of start details.",
      tasks: [
        "Complete paperwork",
        "Review welcome materials",
        "Set up system access",
        "Complete pre-onboarding surveys",
      ],
    },
    orient: {
      title: "Orient",
      description:
        "Day 1: Induction, face-to-face training, system training, equipment handover, and team introduction.",
      tasks: [
        "Attend orientation session",
        "Meet your team",
        "Receive equipment",
        "Complete system training",
      ],
    },
    land: {
      title: "Land",
      description:
        "Day 2-6: Self-study activities, buddy program introduction, shadowing customer interactions, and system accesses.",
      tasks: [
        "Complete self-study modules",
        "Shadow team members",
        "Meet with your buddy",
        "Practice system usage",
      ],
    },
    integrate: {
      title: "Integrate",
      description:
        "Day 7-10: Reverse shadowing, system autonomy, self-study, and final knowledge assessment.",
      tasks: [
        "Begin handling tasks with supervision",
        "Complete knowledge assessment",
        "Attend process training",
        "Review initial feedback",
      ],
    },
    excel: {
      title: "Excel",
      description:
        "After Day 10: Focus on KPIs, performance, career development, coaching, feedback sessions, and on-the-job training.",
      tasks: [
        "Set performance goals",
        "Begin independent work",
        "Schedule regular feedback",
        "Plan career development",
      ],
    },
  };

  const getCompletedTaskCount = (index: number) => {
    if (index < currentStageIndex)
      return stageDetails[stages[index]].tasks.length;
    if (index > currentStageIndex) return 0;

    const taskCount = stageDetails[stages[index]].tasks.length;
    return Math.floor((user.onboardingProgress || 0) / (100 / taskCount));
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Onboarding Journey
        </h2>

        <div className="mb-6">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">
              Overall Progress
            </span>
            <span className="text-sm font-medium text-blue-600">
              {user.onboardingProgress || 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${user.onboardingProgress || 0}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-6">
          {stages.map((stage, index) => {
            const isCurrentStage = stage === user.onboardingStage;
            const isPastStage = index < currentStageIndex;
            const isFutureStage = index > currentStageIndex;

            const stageInfo = stageDetails[stage];
            const completedTaskCount = getCompletedTaskCount(index);
            const totalTaskCount = stageInfo.tasks.length;

            return (
              <div
                key={stage}
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  isCurrentStage
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    {isPastStage ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : isCurrentStage ? (
                      <Clock className="w-6 h-6 text-blue-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between">
                      <h3
                        className={`text-lg font-medium ${
                          isCurrentStage
                            ? "text-blue-700"
                            : isPastStage
                            ? "text-gray-700"
                            : "text-gray-500"
                        }`}
                      >
                        {stageInfo.title}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {completedTaskCount}/{totalTaskCount} Tasks
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {stageInfo.description}
                    </p>

                    {!isFutureStage && (
                      <div className="mt-3 space-y-2">
                        {stageInfo.tasks.map((task, taskIdx) => (
                          <div
                            key={taskIdx}
                            className="flex items-center text-sm"
                          >
                            <div className="flex-shrink-0 mr-2">
                              {taskIdx < completedTaskCount ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Circle className="w-4 h-4 text-gray-300" />
                              )}
                            </div>
                            <span
                              className={
                                taskIdx < completedTaskCount
                                  ? "text-gray-600"
                                  : "text-gray-400"
                              }
                            >
                              {task}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {isCurrentStage && (
                      <button className="mt-3 inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Continue Onboarding
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OnboardingProgress;
