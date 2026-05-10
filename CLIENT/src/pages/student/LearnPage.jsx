import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import StudentLayout from "../../components/StudentLayout";
import {
  ArrowLeft,
  Play,
  BookOpen,
  ChevronRight,
  FileText,
  Video,
  MessageSquare,
  ThumbsUp,
  Share2,
  Bookmark,
} from "lucide-react";
import { api } from "../../services/api";
import { useLocation } from "react-router-dom"; 

const LearnPage = () => {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const { getTopicById, getSubjectById } = useApp();
  const [activeTab, setActiveTab] = useState("content");
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const taskId = searchParams.get('taskId');
  const sessionId = searchParams.get('session');

  const topic = getTopicById(topicId);
  const subject = topic
    ? getSubjectById(topic.subject_id || topic.subjectId || 1)
    : null;

    const handleCompleteTask = async () => {
      try {
        if (sessionId) await api.endSession({ session_id: sessionId, focus_score: 80 });
        if (taskId) await api.completeTask(taskId, { understanding_score: 85 });
        navigate("/student/dashboard");
      } catch (err) {
        alert("Failed to complete task");
      }
    };
  
  const fallbackContent = {
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
    text: `
      # Motion and Kinematics

      ## Introduction
      Motion is a fundamental concept in physics that describes how objects move through space and time. Understanding motion is essential for explaining everything from the movement of planets to the trajectory of a thrown ball.

      ## Key Concepts

      ### 1. Position
      Position refers to the location of an object relative to a reference point. It is typically measured in meters (m) and can be positive or negative depending on the chosen coordinate system.

      ### 2. Displacement
      Displacement is the change in position of an object. It is a vector quantity, meaning it has both magnitude and direction.

      **Formula:** Δx = x₂ - x₁

      ### 3. Velocity
      Velocity is the rate of change of displacement with respect to time. It tells us how fast an object is moving and in what direction.

      **Formula:** v = Δx/Δt

      ### 4. Acceleration
      Acceleration is the rate of change of velocity with respect to time. An object accelerates when it speeds up, slows down, or changes direction.

      **Formula:** a = Δv/Δt

      ## Real-World Applications
      - **Sports:** Understanding projectile motion helps athletes optimize their performance
      - **Transportation:** Engineers use kinematics to design safer vehicles
      - **Space Exploration:** Calculating trajectories for satellites and spacecraft

      ## Summary
      Kinematics provides the mathematical tools to describe motion. By understanding position, displacement, velocity, and acceleration, we can analyze and predict how objects move in the physical world.
          `,
          keyPoints: [
            "Position is the location relative to a reference point",
            "Displacement is a vector quantity with magnitude and direction",
            "Velocity is displacement divided by time",
            "Acceleration is the rate of change of velocity",
          ],
        };
  const [content, setContent] = useState(fallbackContent);

  useEffect(() => {
    api
      .content(topicId)
      .then((data) => {
        const contentPayload = data.content || data.primary || data;
        setContent({
          video:
            contentPayload.type === "video"
              ? contentPayload.video_url
              : fallbackContent.video,
          text:
            contentPayload.text_content ||
            contentPayload.content ||
            fallbackContent.text,
          keyPoints: fallbackContent.keyPoints,
        });
      })
      .catch(() => setContent(fallbackContent));
  }, [topicId]);

  if (!topic) {
    return (
      <StudentLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Topic not found</h2>
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
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back to Topics</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
              <div className="aspect-video bg-gray-900 relative">
                <iframe
                  src={content.video}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Lesson Video"
                ></iframe>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
              <div className="flex border-b border-white/5">
                {[
                  { id: "content", label: "Content", icon: FileText },
                  {
                    id: "discussion",
                    label: "Discussion",
                    icon: MessageSquare,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-all ${
                      activeTab === tab.id
                        ? "text-blue-400 border-b-2 border-blue-500 bg-blue-600/10"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <tab.icon size={18} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === "content" ? (
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                      {content.text}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare
                      className="text-gray-600 mx-auto mb-4"
                      size={48}
                    />
                    <p className="text-gray-400">
                      Discussion feature coming soon
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                <ThumbsUp size={18} />
                <span>Helpful</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                <Bookmark size={18} />
                <span>Save</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                <Share2 size={18} />
                <span>Share</span>
              </button>
              {(taskId || sessionId) && (
                <button 
                  onClick={handleCompleteTask}
                  className="ml-auto px-6 py-2 bg-green-600 hover:bg-green-500 rounded-xl font-bold transition-all"
                >
                  Mark as Complete
                </button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Topic Info */}
            <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                  <BookOpen className="text-blue-400" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{topic.title}</h2>
                  <p className="text-gray-400 text-sm">{subject?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded-lg">
                  {topic.difficulty}
                </span>
                <span>{topic.duration}</span>
              </div>
              <p className="text-gray-400 text-sm">{topic.description}</p>
            </div>

            {/* Key Points */}
            <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText size={18} className="text-blue-400" />
                Key Points
              </h3>
              <ul className="space-y-3">
                {content.keyPoints.map((point, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-300"
                  >
                    <span className="w-5 h-5 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 text-blue-400 text-xs mt-0.5">
                      {index + 1}
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quiz CTA */}
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-2xl p-6 text-center">
              <h3 className="font-semibold mb-2">Test Your Knowledge</h3>
              <p className="text-gray-400 text-sm mb-4">
                Take a quiz to reinforce what you've learned
              </p>
              <button
                onClick={() => navigate(`/student/quiz/${topicId}`)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                Start Quiz
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Progress */}
            <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Your Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Content watched</span>
                    <span className="text-white">75%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Notes taken</span>
                    <span className="text-white">3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default LearnPage;
