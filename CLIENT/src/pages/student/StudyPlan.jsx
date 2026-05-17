import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentLayout from "../../components/StudentLayout";
import { api } from "../../services/api";
import { UploadCloud } from "lucide-react";

const StudyPlan = () => {
  const { topicId } = useParams(); // ✅ FIXED (was missing logically)
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploads, setUploads] = useState({
    note: { file: null, status: "idle" },
    exam: { file: null, status: "idle" },
  });
  const [dragActive, setDragActive] = useState({ note: false, exam: false });

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    setUploads((prev) => ({ ...prev, [type]: { file, status: "uploading" } }));

    const data = new FormData();
    data.append("topicId", topicId);
    data.append("type", type);
    data.append("file", file);
    try {
      await api.uploadContent(data);
      setUploads((prev) => ({ ...prev, [type]: { file, status: "success" } }));
    } catch (err) {
      console.error(err);
      setUploads((prev) => ({ ...prev, [type]: { file, status: "error" } }));
    }
  };
  // Drag and Drop Handlers
  const handleDrag = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover")
      setDragActive((prev) => ({ ...prev, [type]: true }));
    else if (e.type === "dragleave")
      setDragActive((prev) => ({ ...prev, [type]: false }));
  };
  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive((prev) => ({ ...prev, [type]: false }));
    if (e.dataTransfer.files?.[0])
      handleFileUpload(e.dataTransfer.files[0], type);
  };

  const [form, setForm] = useState({
    studyType: "daily",
    daily_time_minutes: 30,
    startTime: "16:00",
    endTime: "19:00",
    examDate: "",
    file: null,
    uploadStatus: "idle",
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

  // Calculate difference in minutes between two times
  const calculateMinutes = (start, end) => {
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    let diff = endH * 60 + endM - (startH * 60 + startM);
    if (diff < 0) diff += 24 * 60; // Handle overnight study
    return diff;
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const planRes = await api.createStudyPlan({
        subjectId: topic.subject_id || topic.subjectId,
        topicId,
        // The AI now receives their total available time window!
        daily_time_minutes: calculateMinutes(form.startTime, form.endTime),
        // We still save the exact string (e.g. "16:00-19:00") so we can send calendar reminders later!
        preferred_time: `${form.startTime}-${form.endTime}`,
        examDate: form.studyType === "exam" ? form.examDate : null,
      });

      // Trigger AI Planner
      await api.generatePlanTasks(planRes.planId, {
        topicIds: [topicId],
      });

      navigate(`/student/dashboard`);
    } catch (err) {
      console.error(err);
      alert("Failed to create AI study plan");
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

        {/* ACTUAL STUDY TIME WINDOW */}
        <div>
          <label className="block mb-2 text-gray-400">Study Time Window</label>
          <div className="flex items-center gap-4">
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="flex-1 bg-[#1f2937] p-3 rounded-xl border border-white/10 focus:border-blue-500 outline-none"
            />
            <span className="text-gray-400 font-medium">to</span>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="flex-1 bg-[#1f2937] p-3 rounded-xl border border-white/10 focus:border-blue-500 outline-none"
            />
          </div>
          <p className="text-sm text-blue-400 mt-2">
            Total daily study time:{" "}
            {Math.floor(calculateMinutes(form.startTime, form.endTime) / 60)}h{" "}
            {calculateMinutes(form.startTime, form.endTime) % 60}m
          </p>
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

        {/* CUSTOM MATERIALS UPLOAD */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* NOTE UPLOADER */}
          <div>
            <label className="block mb-2 text-gray-400">
              Class Notes / Syllabus
            </label>
            <label
              onDragEnter={(e) => handleDrag(e, "note")}
              onDragLeave={(e) => handleDrag(e, "note")}
              onDragOver={(e) => handleDrag(e, "note")}
              onDrop={(e) => handleDrop(e, "note")}
              className={`w-full py-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer
                ${dragActive.note ? "border-blue-400 bg-blue-500/20" : uploads.note.status === "success" ? "border-green-500/50 bg-green-500/10 text-green-400" : uploads.note.status === "uploading" ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400" : "border-blue-500/50 hover:bg-blue-500/10 text-blue-400"}`}
            >
              <UploadCloud size={24} />
              <span className="font-semibold text-center text-sm px-2">
                {uploads.note.status === "uploading"
                  ? "Uploading..."
                  : uploads.note.status === "success"
                    ? `Loaded: ${uploads.note.file?.name}`
                    : dragActive.note
                      ? "Drop note here!"
                      : "Drag Note or Click"}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".txt"
                onChange={(e) => handleFileUpload(e.target.files?.[0], "note")}
              />
            </label>
          </div>

          {/* EXAM UPLOADER */}
          <div>
            <label className="block mb-2 text-gray-400">
              Past Exams / Quizzes
            </label>
            <label
              onDragEnter={(e) => handleDrag(e, "exam")}
              onDragLeave={(e) => handleDrag(e, "exam")}
              onDragOver={(e) => handleDrag(e, "exam")}
              onDrop={(e) => handleDrop(e, "exam")}
              className={`w-full py-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer
                ${dragActive.exam ? "border-purple-400 bg-purple-500/20" : uploads.exam.status === "success" ? "border-green-500/50 bg-green-500/10 text-green-400" : uploads.exam.status === "uploading" ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400" : "border-purple-500/50 hover:bg-purple-500/10 text-purple-400"}`}
            >
              <UploadCloud size={24} />
              <span className="font-semibold text-center text-sm px-2">
                {uploads.exam.status === "uploading"
                  ? "Uploading..."
                  : uploads.exam.status === "success"
                    ? `Loaded: ${uploads.exam.file?.name}`
                    : dragActive.exam
                      ? "Drop exam here!"
                      : "Drag Exam or Click"}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".txt"
                onChange={(e) => handleFileUpload(e.target.files?.[0], "exam")}
              />
            </label>
          </div>
        </div>

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
