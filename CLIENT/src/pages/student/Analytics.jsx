import React from "react";
import StudentLayout from "../../components/StudentLayout";
import { useApp } from "../../context/AppContext";
import ActivityTrackerCanvas from "../../components/ActivityTrackerCanvas";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Trophy,
  Calendar,
  BookOpen,
  Flame,
} from "lucide-react";

const Analytics = () => {
  const { subjects, results } = useApp();

  const weeklyData = [
    { day: "Mon", hours: 2.5, quizzes: 2 },
    { day: "Tue", hours: 1.8, quizzes: 1 },
    { day: "Wed", hours: 3.2, quizzes: 3 },
    { day: "Thu", hours: 2.0, quizzes: 2 },
    { day: "Fri", hours: 1.5, quizzes: 1 },
    { day: "Sat", hours: 4.0, quizzes: 3 },
    { day: "Sun", hours: 3.5, quizzes: 2 },
  ];

  const maxHours = Math.max(...weeklyData.map((d) => d.hours));

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-gray-400">
            Track your learning progress and performance
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <Clock className="text-blue-400" size={20} />
              </div>
              <span className="text-gray-400">Total Study Time</span>
            </div>
            <div className="text-3xl font-bold">42h 30m</div>
            <div className="text-green-400 text-sm mt-1">+5h this week</div>
          </div>
          <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-600/20 rounded-xl flex items-center justify-center">
                <Trophy className="text-yellow-400" size={20} />
              </div>
              <span className="text-gray-400">Quizzes Taken</span>
            </div>
            <div className="text-3xl font-bold">{results.length}</div>
            <div className="text-green-400 text-sm mt-1">+2 this week</div>
          </div>
          <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-600/20 rounded-xl flex items-center justify-center">
                <Target className="text-green-400" size={20} />
              </div>
              <span className="text-gray-400">Avg Score</span>
            </div>
            <div className="text-3xl font-bold">82%</div>
            <div className="text-green-400 text-sm mt-1">+8% improvement</div>
          </div>
          <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-600/20 rounded-xl flex items-center justify-center">
                <Flame className="text-orange-400" size={20} />
              </div>
              <span className="text-gray-400">Current Streak</span>
            </div>
            <div className="text-3xl font-bold">7 days</div>
            <div className="text-yellow-400 text-sm mt-1">Personal best!</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Activity */}
          <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <BarChart3 className="text-blue-400" size={20} />
              Weekly Study Hours
            </h2>
            <div className="flex items-end justify-between gap-2 h-48">
              {weeklyData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-500 hover:to-blue-300"
                    style={{ height: `${(data.hours / maxHours) * 100}%` }}
                  ></div>
                  <div className="mt-2 text-gray-400 text-xs">{data.day}</div>
                  <div className="text-white text-sm font-semibold">
                    {data.hours}h
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Progress */}
          <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <BookOpen className="text-purple-400" size={20} />
              Subject Progress
            </h2>
            <div className="space-y-4">
              {subjects.map((subject) => (
                <div key={subject.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300">{subject.name}</span>
                    <span className="text-gray-400">{subject.progress}%</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                      style={{ width: `${subject.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Trend */}
          <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="text-green-400" size={18} />
              Score Trend
            </h3>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-10 text-gray-500 text-sm">
                    {result.date.slice(5)}
                  </div>
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        result.score >= 80
                          ? "bg-green-500"
                          : result.score >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${result.score}%` }}
                    ></div>
                  </div>
                  <div className="w-12 text-right text-sm">{result.score}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Calendar */}
          <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="text-yellow-400" size={18} />
              Activity Tracker
            </h3>
            <ActivityTrackerCanvas />
          </div>

          {/* Goals Progress */}
          <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="text-blue-400" size={18} />
              Weekly Goals
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Quizzes</span>
                  <span>3/5</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="w-[60%] h-full bg-blue-500 rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Study Hours</span>
                  <span>8/10h</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="w-[80%] h-full bg-green-500 rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">New Topics</span>
                  <span>2/3</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="w-[66%] h-full bg-yellow-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default Analytics;
