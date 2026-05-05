import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentLayout from "../../components/StudentLayout";
import { api } from "../../services/api";
import { useSearchParams } from "react-router-dom";

const StudyPlan = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    studyType: "daily",
    daily_time_minutes: 30,
    preferredTime: "evening",
    examDate: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get("subjectId");

  useEffect(() => {
    fetchTopic();
  }, [topicId]);

  const fetchTopic = async () => {
    try {
      const data = await api.topic(topicId);
      setTopic(data);
    } catch (err) {
      console.error("Failed to fetch topic:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!subjectId) {
    alert("Missing subject. Please go back and select again.");
    return;
  }
  const handleSubmit = async () => {
    if (!topic) return;

    try {
      setSubmitting(true);

      // ✅ 1. Create study plan (ONLY if needed)
      await api.createStudyPlan({
        subjectId,
        daily_time_minutes: Number(form.daily_time_minutes),
        examDate: form.studyType === "exam" ? form.examDate : null,
        preferredTime: form.preferredTime,
      });

      // ✅ 2. Start session
      const session = await api.startSession({
        topicId,
        sessionType: form.studyType,
      });

      // ✅ 3. Go to learning
      navigate(`/student/learn/${topicId}?session=${session.sessionId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to start learning");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="text-center py-20 text-gray-400">
          Loading study setup...
        </div>
      </StudentLayout>
    );
  }

  if (!topic) {
    return (
      <StudentLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold mb-3">Topic not found</h2>
          <button
            onClick={() => navigate("/student/subjects")}
            className="text-blue-400"
          >
            Back to subjects
          </button>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-xl mx-auto mt-10 space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold">Plan your study</h1>
          <p className="text-gray-400 mt-1">{topic.title}</p>
        </div>

        {/* STUDY TYPE */}
        <div>
          <label className="block mb-2 text-gray-400">Study Goal</label>
          <select
            value={form.studyType}
            onChange={(e) => setForm({ ...form, studyType: e.target.value })}
            className="w-full bg-[#1f2937] p-3 rounded-xl"
          >
            <option value="daily">Daily Study</option>
            <option value="exam">Exam Preparation</option>
          </select>
        </div>

        {/* DAILY TIME */}
        <div>
          <label className="block mb-2 text-gray-400">Daily Study Time</label>
          <select
            value={form.daily_time_minutes}
            onChange={(e) =>
              setForm({
                ...form,
                daily_time_minutes: Number(e.target.value),
              })
            }
            className="w-full bg-[#1f2937] p-3 rounded-xl"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
          </select>
        </div>

        {/* PREFERRED TIME */}
        <div>
          <label className="block mb-2 text-gray-400">
            Preferred Study Time
          </label>
          <select
            value={form.preferredTime}
            onChange={(e) =>
              setForm({ ...form, preferredTime: e.target.value })
            }
            className="w-full bg-[#1f2937] p-3 rounded-xl"
          >
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </select>
        </div>

        {/* EXAM DATE */}
        {form.studyType === "exam" && (
          <div>
            <label className="block mb-2 text-gray-400">Exam Date</label>
            <input
              type="date"
              value={form.examDate}
              onChange={(e) => setForm({ ...form, examDate: e.target.value })}
              className="w-full bg-[#1f2937] p-3 rounded-xl"
            />
          </div>
        )}

        {/* BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold"
        >
          {submitting ? "Starting..." : "Start Learning"}
        </button>
      </div>
    </StudentLayout>
  );
};

export default StudyPlan;
