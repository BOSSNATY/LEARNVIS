import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StudentLayout from "../../components/StudentLayout";
import { api } from "../../services/api";

import { ArrowLeft, Clock, Play, Plus } from "lucide-react";

const TopicSelection = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams();

  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  // create topic state
  const [newTopic, setNewTopic] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [subjectId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const subjectData = await api.subjects();
      const found = subjectData.find((s) => String(s.id) === String(subjectId));

      setSubject(found || null);

      const topicsData = await api.topics(subjectId);
      setTopics(topicsData || []);
    } catch (err) {
      console.error("Topic selection error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopic.trim()) return;

    try {
      setCreating(true);

      await api.createTopic({
        title: newTopic,
        subject_id: subjectId,
        description: "Custom topic",
      });

      setNewTopic("");

      // 🔥 refresh data properly (NO reload)
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to create topic");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="text-center py-20 text-gray-400">Loading topics...</div>
      </StudentLayout>
    );
  }

  if (!subject) {
    return (
      <StudentLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Subject not found</h2>
          <button
            onClick={() => navigate("/student/subjects")}
            className="text-blue-400 hover:underline"
          >
            Back to subjects
          </button>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto">
        {/* BACK */}
        <button
          onClick={() => navigate("/student/subjects")}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft size={18} />
          Back to Subjects
        </button>

        {/* SUBJECT HEADER */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10 rounded-2xl p-6 mb-8">
          <h1 className="text-3xl font-bold">{subject.name}</h1>
          <p className="text-gray-400 mt-2">{subject.description}</p>
        </div>

        {/* ➕ CREATE TOPIC */}
        <div className="bg-[#111827]/40 border border-white/10 p-5 rounded-2xl mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Plus size={18} />
            Add New Topic
          </h3>

          <div className="flex gap-3">
            <input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Enter topic name..."
              className="flex-1 bg-[#1f2937] border border-white/10 rounded-xl px-4 py-2 text-white outline-none"
            />

            <button
              onClick={handleCreateTopic}
              disabled={creating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold"
            >
              {creating ? "Adding..." : "Add"}
            </button>
          </div>
        </div>

        {/* TOPICS LIST */}
        {topics.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            No topics yet. Create one above to start learning.
          </div>
        ) : (
          <div className="space-y-4">
            {topics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => navigate(`/student/learn/${topic.id}`)}
                className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 hover:border-blue-500/30 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {/* ICON */}
                  <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                    <Play className="text-blue-400" size={22} />
                  </div>

                  {/* INFO */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      {topic.title || topic.name}
                    </h3>

                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-gray-500 text-sm flex items-center gap-1">
                        <Clock size={14} />
                        {topic.duration || "—"}
                      </span>
                    </div>
                  </div>

                  {/* ACTION */}
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold">
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default TopicSelection;
