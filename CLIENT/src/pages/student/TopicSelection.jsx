import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StudentLayout from "../../components/StudentLayout";
import { api } from "../../services/api";
import { useApp } from "../../context/AppContext";

import {
  ArrowLeft,
  Clock,
  Play,
  Plus,
  BookOpen,
  Brain,
  Lightbulb,
  Zap,
  Target,
  Layers,
} from "lucide-react";

const TopicSelection = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const { currentUser } = useApp();

  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  // create topic state
  const [newTopic, setNewTopic] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [creating, setCreating] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);

  const topicIcons = [Play, BookOpen, Brain, Lightbulb, Zap, Target, Layers];

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

      setTopics(
        (topicsData || []).map((t) => ({
          ...t,
          is_custom: Boolean(t.is_custom),
          created_by: Number(t.created_by),
        })),
      );
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
        subjectId,
        title: newTopic,
        description: newDescription,
        difficulty,
      });

      setNewTopic("");
      setNewDescription("");
      setDifficulty("intermediate");

      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to create topic");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTopic = async (topicId) => {
    try {
      await api.deleteTopic(topicId);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete topic");
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

        {/* TOGGLE ADD TOPIC */}
        <button
          onClick={() => setShowAddTopic(!showAddTopic)}
          className="mb-4 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm"
        >
          {showAddTopic ? "Close" : "+ Add Topic"}
        </button>

        {/* ADD TOPIC FORM */}
        {showAddTopic && (
          <div className="bg-[#111827]/40 border border-white/10 p-5 rounded-2xl mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Plus size={18} /> Add New Topic
            </h3>

            <input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Topic title..."
              className="w-full mb-3 bg-[#1f2937] border border-white/10 rounded-xl px-4 py-2"
            />

            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description..."
              className="w-full mb-3 bg-[#1f2937] border border-white/10 rounded-xl px-4 py-2"
            />

            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full mb-3 bg-[#1f2937] border border-white/10 rounded-xl px-4 py-2"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <button
              onClick={handleCreateTopic}
              disabled={creating}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-xl"
            >
              {creating ? "Adding..." : "Add Topic"}
            </button>
          </div>
        )}

        {/* TOPICS LIST */}
        {topics.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            No topics yet. Create one above to start learning.
          </div>
        ) : (
          <div className="space-y-4">
            {topics.map((topic) => {
              const Icon = topicIcons[topic.id % topicIcons.length];

              return (
                <div
                  key={topic.id}
                  className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 hover:border-blue-500/30"
                >
                  <div className="flex items-center gap-4">
                    {/* ICON */}
                    <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                      <Icon className="text-blue-400" size={22} />
                    </div>

                    {/* INFO */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold capitalize">
                        {topic.title}
                      </h3>

                      <p className="text-gray-500 text-sm mt-1">
                        {topic.description || "No description"}
                      </p>

                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-gray-500 text-sm flex items-center gap-1">
                          <Clock size={14} />
                          {topic.difficulty || "Beginner"}
                        </span>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          navigate(`/student/session-setup/${subjectId}`)
                        }
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold"
                      >
                        Start
                      </button>

                      {topic.is_custom === true &&
                        Number(topic.created_by) ===
                          Number(currentUser?.id) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTopic(topic.id);
                            }}
                            className="text-red-400 text-sm hover:text-red-300"
                          >
                            Delete
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default TopicSelection;
