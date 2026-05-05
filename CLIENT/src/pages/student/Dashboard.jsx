import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../../components/StudentLayout";
import { api } from "../../services/api";
import { useApp } from "../../context/AppContext";

import {
  BookOpen,
  Trophy,
  TrendingUp,
  Flame,
  Clock,
  Calendar,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await api.dashboard();
        setDashboard(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const subjects = dashboard?.subjects || [];
  const recentActivity = dashboard?.recentActivity || [];
  const weeklyGoal = dashboard?.weeklyGoal || { completed: 0, target: 5 };
  const activeSession = dashboard?.activeSession;

  const stats = [
    {
      icon: BookOpen,
      label: "Subjects Enrolled",
      value: subjects.length,
      color: "blue",
    },
    {
      icon: Trophy,
      label: "Quizzes",
      value: dashboard?.quizzesCompleted || 0,
      color: "yellow",
    },
    {
      icon: TrendingUp,
      label: "Avg Score",
      value: `${dashboard?.averageScore || 0}%`,
      color: "green",
    },
    {
      icon: Flame,
      label: "Streak",
      value: `${dashboard?.streak || 0} days`,
      color: "orange",
    },
  ];

  if (loading) {
    return (
      <StudentLayout>
        <div className="text-center py-20 text-gray-400">Loading...</div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Welcome back, {currentUser?.name?.split(" ")[0] || "Student"} 👋
          </h1>
          <p className="text-gray-400">
            Ready to continue your learning journey?
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 hover:border-blue-500/20 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 bg-${stat.color}-600/20 rounded-xl flex items-center justify-center`}
                >
                  <stat.icon className={`text-${stat.color}-400`} size={24} />
                </div>
                <span className="text-xs text-gray-500">{stat.change}</span>
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {activeSession && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Continue Learning
                </h2>

                <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-6">
                  <h3 className="font-semibold">{activeSession.topicName}</h3>

                  <p className="text-gray-400 text-sm">
                    {activeSession.subjectName} • {activeSession.duration || 0}{" "}
                    min
                  </p>

                  {/* progress */}
                  <div className="w-full bg-gray-700 h-2 rounded-full mt-3">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${activeSession.progress || 0}%` }}
                    />
                  </div>

                  <button
                    onClick={() =>
                      navigate(`/student/learn/${activeSession.topicId}`)
                    }
                    className="mt-4 px-4 py-2 bg-blue-600 rounded-xl"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* SUBJECTS PREVIEW */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex justify-between">
                Your Subjects
                <span
                  onClick={() => navigate("/student/subjects")}
                  className="text-blue-400 text-sm cursor-pointer"
                >
                  View All
                </span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {subjects.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => navigate(`/student/subjects/${s.id}`)}
                    className="bg-[#111827]/40 p-5 rounded-2xl border border-white/5 hover:border-blue-500/30 cursor-pointer"
                  >
                    <h3 className="font-semibold">{s.name}</h3>
                    <p className="text-gray-500 text-sm">
                      {s.topicsCount || 0} topics
                    </p>

                    <div className="mt-3 h-2 bg-gray-700 rounded-full">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: `${s.progress || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-6">
            {/* WEEKLY GOAL */}
            <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 p-5 rounded-2xl">
              <h2 className="font-semibold mb-3">Weekly Goal</h2>
              <div className="text-3xl font-bold text-yellow-400">
                {weeklyGoal.completed}/{weeklyGoal.target}
              </div>
              <p className="text-sm text-gray-300 mt-2">
                Keep going! You're doing great.
              </p>
            </div>

            {/* RECENT ACTIVITY */}
            <div className="bg-[#111827]/40 p-5 rounded-2xl border border-white/5">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Clock size={18} /> Recent Activity
              </h2>

              {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-sm">No activity yet.</p>
              ) : (
                recentActivity.map((a, i) => (
                  <div key={i} className="mb-3">
                    <p className="text-sm">{a.title}</p>
                    <p className="text-xs text-gray-500">
                      {a.score ? `Score: ${a.score}%` : "Learning session"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default Dashboard;
