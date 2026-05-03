// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useApp } from "../../context/AppContext";
// import StudentLayout from "../../components/StudentLayout";
// import { api } from "../../services/api";

// import {
//   BookOpen,
//   Clock,
//   TrendingUp,
//   Trophy,
//   ChevronRight,
//   Play,
//   Target,
//   Flame,
//   Calendar,
// } from "lucide-react";

// const Dashboard = () => {
//   const navigate = useNavigate();
//   const { subjects, currentUser } = useApp();

//   const [dashboard, setDashboard] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchDashboard = async () => {
//       try {
//         const data = await api.dashboard();
//         setDashboard(data);
//       } catch (err) {
//         console.error("Dashboard error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDashboard();
//   }, []);

//   const stats = [
//     {
//       icon: BookOpen,
//       label: "Subjects Enrolled",
//       value: dashboard?.subjectsCount || 0,
//       color: "blue",
//       change: "Active learning",
//     },
//     {
//       icon: Trophy,
//       label: "Quizzes Completed",
//       value: dashboard?.quizzesCompleted || 0,
//       color: "yellow",
//       change: "Keep going",
//     },
//     {
//       icon: TrendingUp,
//       label: "Average Score",
//       value: `${dashboard?.averageScore || 0}%`,
//       color: "green",
//       change: "Based on performance",
//     },
//     {
//       icon: Flame,
//       label: "Learning Streak",
//       value: `${dashboard?.streak || 0} days`,
//       color: "orange",
//       change: "Consistency matters",
//     },
//   ];

//   const recentActivity = dashboard?.recentActivity || [];

//   const recommendedTopics = dashboard?.recommendedTopics || [];

//   const weeklyGoal = dashboard?.weeklyGoal || { completed: 0, target: 5 };

//   return (
//     <StudentLayout>
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold mb-2">
//             Welcome back,{" "}
//             <span className="text-blue-400">
//               {currentUser?.name?.split(" ")[0] || "Student"}
//             </span>
//             ! 👋
//           </h1>
//           <p className="text-gray-400">
//             {loading
//               ? "Loading your progress..."
//               : "Ready to continue learning?"}
//           </p>
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
//           {stats.map((stat, index) => (
//             <div
//               key={index}
//               className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 hover:border-blue-500/20 transition-all"
//             >
//               <div className="flex items-start justify-between mb-4">
//                 <div
//                   className={`w-12 h-12 bg-${stat.color}-600/20 rounded-xl flex items-center justify-center`}
//                 >
//                   <stat.icon className={`text-${stat.color}-400`} size={24} />
//                 </div>
//                 <span className="text-xs text-gray-500">{stat.change}</span>
//               </div>

//               <div className="text-2xl font-bold mb-1">{stat.value}</div>
//               <div className="text-gray-400 text-sm">{stat.label}</div>
//             </div>
//           ))}
//         </div>

//         {/* Main Layout */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* LEFT */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* Continue Learning */}
//             <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
//               <div className="flex items-center gap-2 mb-4">
//                 <Play className="text-blue-400" size={20} />
//                 <h2 className="text-xl font-semibold">Continue Learning</h2>
//               </div>

//               <div className="bg-[#0d1117]/50 rounded-xl p-4 flex items-center gap-4">
//                 <div className="w-16 h-16 bg-blue-600/20 rounded-xl flex items-center justify-center">
//                   <BookOpen className="text-blue-400" size={28} />
//                 </div>

//                 <div className="flex-1">
//                   <h3 className="font-semibold text-lg">
//                     Work, Energy, and Power
//                   </h3>
//                   <p className="text-gray-400 text-sm">
//                     Physics • Intermediate • 55 min
//                   </p>

//                   <div className="flex items-center gap-3 mt-2">
//                     <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
//                       <div className="w-[45%] h-full bg-blue-500 rounded-full"></div>
//                     </div>
//                     <span className="text-sm text-gray-400">45%</span>
//                   </div>
//                 </div>

//                 <button
//                   onClick={() => navigate("/student/learn/3")}
//                   className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-all flex items-center gap-2"
//                 >
//                   Continue <ChevronRight size={18} />
//                 </button>
//               </div>
//             </div>

//             {/* Subjects */}
//             <div>
//               <h2 className="text-xl font-semibold mb-4">Your Subjects</h2>

//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 {subjects?.slice(0, 4).map((subject) => (
//                   <div
//                     key={subject.id}
//                     onClick={() => navigate(`/student/subjects/${subject.id}`)}
//                     className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 cursor-pointer hover:border-blue-500/30 transition-all"
//                   >
//                     <h3 className="font-semibold">{subject.name}</h3>
//                     <p className="text-gray-500 text-sm">
//                       {subject.topicsCount} topics
//                     </p>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* RIGHT */}
//           <div className="space-y-6">
//             {/* Recommended */}
//             <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5">
//               <div className="flex items-center gap-2 mb-4">
//                 <Target className="text-purple-400" size={20} />
//                 <h2 className="text-lg font-semibold">Recommended</h2>
//               </div>

//               <div className="space-y-3">
//                 {recommendedTopics.map((item, index) => (
//                   <div key={index} className="p-3 bg-white/5 rounded-xl">
//                     <h4 className="font-medium text-sm">{item.topic}</h4>
//                     <p className="text-xs text-gray-500">{item.subject}</p>
//                     <p className="text-xs text-blue-400">{item.reason}</p>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Activity */}
//             <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5">
//               <div className="flex items-center gap-2 mb-4">
//                 <Clock className="text-green-400" size={20} />
//                 <h2 className="text-lg font-semibold">Recent Activity</h2>
//               </div>

//               <div className="space-y-3">
//                 {recentActivity.map((item, index) => (
//                   <div key={index} className="p-3 bg-white/5 rounded-xl">
//                     <h4 className="text-sm font-medium">{item.title}</h4>
//                     <p className="text-xs text-gray-500">
//                       {item.score ? `Score: ${item.score}%` : "Activity"}
//                     </p>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Weekly Goal */}
//             <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/20 rounded-2xl p-5">
//               <div className="flex items-center gap-2 mb-4">
//                 <Calendar className="text-yellow-400" size={20} />
//                 <h2 className="text-lg font-semibold">Weekly Goal</h2>
//               </div>

//               <div className="text-center mb-3">
//                 <div className="text-4xl font-bold text-yellow-400">
//                   {weeklyGoal.completed}/{weeklyGoal.target}
//                 </div>
//               </div>

//               <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
//                 <div
//                   className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
//                   style={{
//                     width: `${(weeklyGoal.completed / weeklyGoal.target) * 100}%`,
//                   }}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </StudentLayout>
//   );
// };

// export default Dashboard;
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import StudentLayout from "../../components/StudentLayout";
import { api } from "../../services/api";

import {
  BookOpen,
  Clock,
  TrendingUp,
  Trophy,
  Target,
  Flame,
  Calendar,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { subjects, currentUser } = useApp();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await api.dashboard();
        setDashboard(data);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // 🔥 Detect new user properly
  const isNewUser =
    (!subjects || subjects.length === 0) &&
    (!dashboard || dashboard.quizzesCompleted === 0);

  // 🟢 EMPTY STATE (NEW USER)
  if (isNewUser && !loading) {
    return (
      <StudentLayout>
        <div className="max-w-3xl mx-auto text-center mt-20">
          <h1 className="text-3xl font-bold mb-4">Welcome to LearnVis 👋</h1>

          <p className="text-gray-400 mb-8">
            Let’s set up your learning journey in a few seconds.
          </p>

          <div className="bg-[#111827]/40 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-2">
              Step 1: Choose your subjects
            </h2>
            <p className="text-gray-500 text-sm">
              Select what you want to learn first to generate your study plan.
            </p>
          </div>

          <button
            onClick={() => navigate("/student/subjects")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold"
          >
            Get Started
          </button>
        </div>
      </StudentLayout>
    );
  }

  // 🧠 STATS (REAL + SAFE)
  const stats = [
    {
      icon: BookOpen,
      label: "Subjects",
      value: subjects?.length || 0,
      color: "blue",
      change: "Active learning",
    },
    {
      icon: Trophy,
      label: "Quizzes",
      value: dashboard?.quizzesCompleted || 0,
      color: "yellow",
      change: "Completed",
    },
    {
      icon: TrendingUp,
      label: "Average Score",
      value: `${dashboard?.averageScore || 0}%`,
      color: "green",
      change: "Performance",
    },
    {
      icon: Flame,
      label: "Streak",
      value: `${dashboard?.streak || 0} days`,
      color: "orange",
      change: "Consistency",
    },
  ];

  const recentActivity = dashboard?.recentActivity || [];
  const recommendedTopics = dashboard?.recommendedTopics || [];
  const weeklyGoal = dashboard?.weeklyGoal || { completed: 0, target: 5 };

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back,{" "}
            <span className="text-blue-400">
              {currentUser?.name?.split(" ")[0] || "Student"}
            </span>
            ! 👋
          </h1>

          <p className="text-gray-400">
            {loading
              ? "Loading your progress..."
              : "Here is your learning progress"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
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
            {/* Subjects */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Subjects</h2>

              {subjects?.length === 0 ? (
                <div className="bg-[#111827]/40 border border-white/10 p-6 rounded-2xl text-gray-400">
                  No subjects yet. Start by selecting your subjects.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {subjects?.slice(0, 4).map((subject) => (
                    <div
                      key={subject.id}
                      onClick={() =>
                        navigate(`/student/subjects/${subject.id}`)
                      }
                      className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 cursor-pointer hover:border-blue-500/30"
                    >
                      <h3 className="font-semibold">{subject.name}</h3>
                      <p className="text-gray-500 text-sm">
                        {subject.topicsCount} topics
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* Recommended */}
            <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="text-purple-400" size={20} />
                <h2 className="text-lg font-semibold">Recommended</h2>
              </div>

              {recommendedTopics.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Complete more activities to get recommendations.
                </p>
              ) : (
                <div className="space-y-3">
                  {recommendedTopics.map((item, index) => (
                    <div key={index} className="p-3 bg-white/5 rounded-xl">
                      <h4 className="font-medium text-sm">{item.topic}</h4>
                      <p className="text-xs text-gray-500">{item.subject}</p>
                      <p className="text-xs text-blue-400">{item.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity */}
            <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="text-green-400" size={20} />
                <h2 className="text-lg font-semibold">Recent Activity</h2>
              </div>

              {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No activity yet. Start learning to see progress here.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((item, index) => (
                    <div key={index} className="p-3 bg-white/5 rounded-xl">
                      <h4 className="text-sm font-medium">{item.title}</h4>
                      <p className="text-xs text-gray-500">
                        {item.score
                          ? `Score: ${item.score}%`
                          : "Learning session"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weekly Goal */}
            <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-yellow-400" size={20} />
                <h2 className="text-lg font-semibold">Weekly Goal</h2>
              </div>

              <div className="text-center mb-3">
                <div className="text-4xl font-bold text-yellow-400">
                  {weeklyGoal.completed}/{weeklyGoal.target}
                </div>
              </div>

              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                  style={{
                    width: `${(weeklyGoal.completed / weeklyGoal.target) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default Dashboard;
