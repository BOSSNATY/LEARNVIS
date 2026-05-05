import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentLayout from "../../components/StudentLayout";
import { api } from "../../services/api";

const StudyPlan = () => {
  const { topicId } = useParams(); // ✅ FIXED (was missing logically)
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    studyType: "daily",
    daily_time_minutes: 30,
    preferredTime: "evening",
    examDate: "",
  });

  // ✅ FETCH TOPIC
  useEffect(() => {
    const fetchTopic = async () => {
      try {
        setLoading(true);

        if (!topicId) return;

        const data = await api.topic(topicId);

        setTopic(data || null);
      } catch (err) {
        console.error("Failed to fetch topic:", err);
        setTopic(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
  }, [topicId]);

  // ❌ BLOCK INVALID STATE
  if (!topicId) {
    return (
      <StudentLayout>
        <div className="text-center py-20 text-red-400">
          Missing topic ID. Please select a topic again.
        </div>
      </StudentLayout>
    );
  }

  // 🔄 LOADING STATE
  if (loading) {
    return (
      <StudentLayout>
        <div className="text-center py-20 text-gray-400">
          Loading study setup...
        </div>
      </StudentLayout>
    );
  }

  // ❌ TOPIC NOT FOUND
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

  // ✅ SUBMIT
  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      await api.createStudyPlan({
        subjectId: topic.subject_id, // ✅ FIXED (comes from topic)
        topicId,
        daily_time_minutes: Number(form.daily_time_minutes),
        examDate: form.studyType === "exam" ? form.examDate : null,
        preferredTime: form.preferredTime,
        studyType: form.studyType,
      });

      const session = await api.startSession({
        topicId,
        sessionType: form.studyType,
      });

      navigate(`/student/learn/${topicId}?session=${session.sessionId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to start learning");
    } finally {
      setSubmitting(false);
    }
  };

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
