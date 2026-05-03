import React, { useEffect, useState } from "react";
import StudentLayout from "../../components/StudentLayout";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { CalendarDays, Target, Trash2, Wand2 } from "lucide-react";

const Planner = () => {
  const { subjects, topics } = useApp();
  const [plans, setPlans] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || "");
  const [dailyTimeMinutes, setDailyTimeMinutes] = useState(60);
  const [targetScore, setTargetScore] = useState(90);
  const [examDate, setExamDate] = useState("");
  const [message, setMessage] = useState("");

  const loadPlans = () =>
    api
      .planner()
      .then(setPlans)
      .catch(() => setPlans([]));

  useEffect(() => {
    loadPlans();
  }, []);

  const createPlan = async (event) => {
    event.preventDefault();
    try {
      const plan = await api.createPlan({
        subjectId: selectedSubject,
        dailyTimeMinutes,
        targetScore,
        examDate,
      });
      const topicIds = (topics[selectedSubject] || []).map((topic) => topic.id);
      if (topicIds.length)
        await api.generatePlanTasks(plan.planId, { topicIds });
      setMessage("Study plan created and daily tasks generated.");
      loadPlans();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deletePlan = async (planId) => {
    await api.deletePlan(planId).catch(() => null);
    loadPlans();
  };

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Study Planner</h1>
          <p className="text-gray-400">
            Generate a roadmap based on your exam date, daily time, and target
            score.
          </p>
        </div>

        <form
          onSubmit={createPlan}
          className="bg-[#111827]/40 border border-white/5 rounded-2xl p-6 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4"
        >
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
          />
          <input
            type="number"
            value={dailyTimeMinutes}
            onChange={(e) => setDailyTimeMinutes(e.target.value)}
            placeholder="Minutes/day"
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
          />
          <input
            type="number"
            value={targetScore}
            onChange={(e) => setTargetScore(e.target.value)}
            placeholder="Target score"
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
          />
          <button className="bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold flex items-center justify-center gap-2">
            <Wand2 size={18} /> Generate
          </button>
        </form>

        {message && (
          <div className="mb-6 text-blue-300 bg-blue-600/10 border border-blue-500/20 rounded-xl p-4">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg">
                    {plan.subject_name || "Study plan"}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {plan.total_tasks || 0} tasks, {plan.completed_tasks || 0}{" "}
                    completed
                  </p>
                </div>
                <button
                  onClick={() => deletePlan(plan.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div className="bg-white/5 rounded-xl p-3">
                  <CalendarDays size={16} className="text-blue-400 mb-1" />
                  {plan.exam_date || "No exam"}
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <Target size={16} className="text-green-400 mb-1" />
                  {plan.target_score || 85}% target
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  {plan.daily_time_minutes} min/day
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
};

export default Planner;
