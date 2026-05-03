import React, { useState } from "react";
import StudentLayout from "../../components/StudentLayout";
import { useApp } from "../../context/AppContext";
import { api, setSession } from "../../services/api";
import {
  Camera,
  Mail,
  Calendar,
  Award,
  BookOpen,
  Trophy,
  Edit2,
  Save,
  X,
} from "lucide-react";

const Profile = () => {
  const { currentUser, setCurrentUser, subjects, results } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    bio: "Passionate about learning physics and mathematics",
    school: "Learning Academy",
    grade: "12th Grade",
  });

  const achievements = [
    { name: "First Quiz", icon: Trophy, color: "yellow", date: "2024-01-15" },
    { name: "Perfect Score", icon: Award, color: "green", date: "2024-02-20" },
    { name: "7-Day Streak", icon: BookOpen, color: "blue", date: "2024-03-10" },
  ];

  const saveProfile = async () => {
    try {
      await api.updateMe({ name: formData.name, email: formData.email });
      const updated = {
        ...currentUser,
        name: formData.name,
        email: formData.email,
      };
      setCurrentUser(updated);
      setSession({ user: updated });
      setIsEditing(false);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile</h1>
          <p className="text-gray-400">
            Manage your account and view achievements
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden mb-6">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30"></div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-12 mb-4">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl font-bold border-4 border-[#080b14]">
                  {currentUser.name?.charAt(0) || "S"}
                </div>
                <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-500 transition-all">
                  <Camera size={16} />
                </button>
              </div>
              <div className="flex-1 pb-2">
                <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                <p className="text-gray-400">{currentUser.email}</p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl flex items-center gap-2 transition-all"
              >
                {isEditing ? <X size={18} /> : <Edit2 size={18} />}
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mb-6">
              <div>
                <div className="text-2xl font-bold">{subjects.length}</div>
                <div className="text-gray-400 text-sm">Subjects</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{results.length}</div>
                <div className="text-gray-400 text-sm">Quizzes</div>
              </div>
              <div>
                <div className="text-2xl font-bold">42h</div>
                <div className="text-gray-400 text-sm">Study Time</div>
              </div>
            </div>

            {/* Edit Form or Info */}
            {isEditing ? (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      School
                    </label>
                    <input
                      type="text"
                      value={formData.school}
                      onChange={(e) =>
                        setFormData({ ...formData, school: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Grade
                    </label>
                    <input
                      type="text"
                      value={formData.grade}
                      onChange={(e) =>
                        setFormData({ ...formData, grade: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  ></textarea>
                </div>
                <button
                  onClick={saveProfile}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold flex items-center gap-2 transition-all"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-3 text-gray-300">
                  <Mail size={18} className="text-gray-500" />
                  <span>{formData.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Calendar size={18} className="text-gray-500" />
                  <span>Joined January 2024</span>
                </div>
                <p className="text-gray-400">{formData.bio}</p>
              </div>
            )}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold mb-4">Achievements</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 bg-white/5 rounded-xl"
              >
                <div
                  className={`w-12 h-12 bg-${achievement.color}-600/20 rounded-xl flex items-center justify-center`}
                >
                  <achievement.icon
                    className={`text-${achievement.color}-400`}
                    size={24}
                  />
                </div>
                <div>
                  <div className="font-medium">{achievement.name}</div>
                  <div className="text-gray-500 text-sm">
                    {achievement.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enrolled Subjects */}
        <div className="bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Enrolled Subjects</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="p-4 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="text-2xl mb-2">📚</div>
                <div className="font-medium">{subject.name}</div>
                <div className="text-gray-500 text-sm">
                  {subject.progress}% complete
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default Profile;
