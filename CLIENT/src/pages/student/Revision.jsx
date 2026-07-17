import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import StudentLayout from "../../components/StudentLayout";
import { api } from "../../services/api";
import { RefreshCcw, Brain, ArrowRight, Loader } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const Revision = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get("taskId");

  // State for General Revision
  const [dueItems, setDueItems] = useState([]);

  // State for Targeted Revision
  const [lessons, setLessons] = useState([]);
  const [quizId, setQuizId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  useEffect(() => {
    if (topicId) {
      // LOAD TARGETED REVISION
      const loadTargeted = async () => {
        try {
          const [revisionData, attemptData] = await Promise.all([
            api.targetedRevision(topicId),
            api.getLatestAttempt(topicId),
          ]);
          setLessons(revisionData.lessons || []);
          if (attemptData.attempt?.quiz_id) {
            setQuizId(attemptData.attempt.quiz_id);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      loadTargeted();
    } else {
      // LOAD GENERAL REVISION
      api
        .dueRevisions()
        .then((data) => {
          setDueItems(data.dueRevisions || data || []);
          setLoading(false);
        })
        .catch(() => {
          setDueItems([]);
          setLoading(false);
        });
    }
  }, [topicId]);

  const completeGeneral = async (id, quality = 2) => {
    await api.completeRevision(id, { quality }).catch(() => null);
    api
      .dueRevisions()
      .then((data) => setDueItems(data.dueRevisions || data || []));
  };

  const handleRemaster = async () => {
    if (!quizId) return alert("Quiz ID not found.");
    setGeneratingQuiz(true);
    try {
      await api.remasterQuiz(quizId);
      navigate(
        `/student/quiz/${topicId}/start?taskId=${taskId || ""}&isReview=true`,
      );
    } catch (err) {
      alert("Failed to generate remastered quiz.");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin text-blue-500 mr-3" />
          {topicId ? "Analyzing your mistakes..." : "Loading..."}
        </div>
      </StudentLayout>
    );
  }

  // ============== RENDER TARGETED REVISION ==============
  if (topicId) {
    return (
      <StudentLayout>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 p-6 rounded-2xl">
            <h1 className="text-2xl font-bold flex items-center gap-3 text-orange-400">
              <Brain /> Targeted Revision
            </h1>
            <p className="text-gray-300 mt-2">
              We analyzed your recent quiz. Here are personalized mini-lessons
              focusing exactly on what you missed.
            </p>
          </div>

          {lessons.length === 0 ? (
            <div className="text-center p-8 bg-[#1f2937] rounded-2xl border border-white/5">
              <p className="text-gray-400">
                No specific mistake patterns found. You're ready to try again!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {lessons.map((lesson, idx) => (
                <div
                  key={idx}
                  className="bg-[#1f2937] p-6 rounded-2xl border border-white/5"
                >
                  <h2 className="text-xl font-bold text-white mb-4">
                    <span className="text-orange-500 mr-2">#{idx + 1}</span>{" "}
                    {lesson.title}
                  </h2>
                  <div className="prose prose-invert max-w-none text-gray-300">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {lesson.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={handleRemaster}
              disabled={generatingQuiz}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all flex items-center gap-2"
            >
              {generatingQuiz ? (
                <Loader className="animate-spin" size={20} />
              ) : (
                "Take Remastered Quiz"
              )}{" "}
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // ============== RENDER GENERAL REVISION ==============
  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Daily Revision</h1>
        <p className="text-gray-400 mb-8">Spaced repetition tasks due today.</p>
        <div className="space-y-4">
          {dueItems.length === 0 && (
            <p className="text-gray-400">No revisions due today.</p>
          )}
          {dueItems.map((item) => (
            <div
              key={item.id}
              className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 flex justify-between gap-4"
            >
              <div>
                <h3 className="font-bold">{item.topic_title || item.title}</h3>
                <p className="text-gray-400 text-sm">
                  {item.subject_name || "Revision"}
                </p>
              </div>
              <button
                onClick={() => completeGeneral(item.id)}
                className="text-green-400 flex items-center gap-2"
              >
                <RefreshCcw size={18} /> Done
              </button>
            </div>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
};

export default Revision;
