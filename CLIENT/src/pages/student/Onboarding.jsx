import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import {
  Atom,
  Calculator,
  FlaskConical,
  Leaf,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const Onboarding = () => {
  const navigate = useNavigate();
  const { subjects } = useApp();
  const [selectedSubject, setSelectedSubject] = useState(null);

  const iconMap = {
    Atom: Atom,
    Calculator: Calculator,
    FlaskConical: FlaskConical,
    Leaf: Leaf,
  };

  const handleSelect = (subjectId) => {
    setSelectedSubject(subjectId);
    setTimeout(() => {
      navigate(`/student/subjects/${subjectId}`);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#080b14] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]"></div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
            ✓
          </div>
          <span className="text-sm text-gray-400">Account Created</span>
        </div>
        <div className="w-12 h-[2px] bg-blue-600"></div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
            2
          </div>
          <span className="text-sm text-white font-medium">Choose Subject</span>
        </div>
        <div className="w-12 h-[2px] bg-gray-700"></div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold">
            3
          </div>
          <span className="text-sm text-gray-400">Select Topic</span>
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-12 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full mb-6">
          <Sparkles size={16} className="text-blue-400" />
          <span className="text-sm text-blue-300">Let's get started</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Choose Your Path
        </h1>
        <p className="text-gray-400 max-w-md mx-auto">
          Select a natural subject to begin your discovery. You can always add
          more subjects later.
        </p>
      </div>

      {/* Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative z-10">
        {subjects.map((subject) => {
          const IconComponent = iconMap[subject.icon] || Atom;
          const isSelected = selectedSubject === subject.id;

          return (
            <div
              key={subject.id}
              onClick={() => handleSelect(subject.id)}
              className={`group p-8 bg-[#111827]/40 backdrop-blur-xl border ${
                isSelected ? "border-blue-500" : "border-white/10"
              } rounded-3xl hover:border-blue-500/50 transition-all cursor-pointer relative overflow-hidden`}
            >
              {isSelected && (
                <div className="absolute inset-0 bg-blue-600/10 animate-pulse"></div>
              )}
              <div className="relative z-10">
                <div
                  className={`w-16 h-16 bg-${subject.color}-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}
                >
                  <IconComponent
                    className={`text-${subject.color}-400`}
                    size={32}
                  />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-center">
                  {subject.name}
                </h2>
                <p className="text-gray-400 text-sm text-center mb-4">
                  {subject.description}
                </p>
                <div className="flex items-center justify-center gap-2 text-blue-400">
                  <span className="text-sm">Start Learning</span>
                  <ChevronRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Skip Option */}
      <button
        onClick={() => navigate("/student/dashboard")}
        className="mt-8 text-gray-500 hover:text-white transition-colors text-sm"
      >
        Skip for now →
      </button>
    </div>
  );
};

export default Onboarding;
