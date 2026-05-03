import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Atom,
  BookOpen,
  Brain,
  ChevronRight,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Header from "../components/Header";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description:
        "Personalized quizzes and content tailored to your learning style",
      color: "blue",
    },
    {
      icon: Target,
      title: "Adaptive Difficulty",
      description:
        "Questions that adjust to your skill level for optimal growth",
      color: "green",
    },
    {
      icon: TrendingUp,
      title: "Progress Analytics",
      description: "Track your improvement with detailed performance insights",
      color: "purple",
    },
    {
      icon: Sparkles,
      title: "Smart Recommendations",
      description: "Get personalized suggestions for your learning journey",
      color: "yellow",
    },
  ];

  const subjects = [
    { name: "Physics", icon: Atom, color: "blue" },
    { name: "Chemistry", icon: BookOpen, color: "green" },
    { name: "Biology", icon: Zap, color: "emerald" },
    { name: "Mathematics", icon: Target, color: "purple" },
  ];

  return (
    <div className="landing-page min-h-screen bg-[#080b14] text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[150px]"></div>
      </div>

      <Header />

      {/* Hero Section */}
      <section className="landing-hero relative z-10 px-6 pt-20 pb-32">
        <div className="landing-container landing-hero-inner max-w-7xl mx-auto text-center">
          <div className="landing-badge inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full mb-8">
            <Sparkles size={16} className="text-blue-400" />
            <span className="text-sm text-blue-300">
              AI-Powered Education Platform
            </span>
          </div>

          <h1 className="landing-title text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              Learn Smarter,
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Not Harder
            </span>
          </h1>

          <p className="landing-copy text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Experience personalized learning with AI-generated quizzes, adaptive
            content, and comprehensive analytics designed to accelerate your
            education journey.
          </p>

          <div className="landing-cta-row flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => navigate("/signup")}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-2xl font-semibold text-lg transition-all shadow-xl shadow-blue-600/30 flex items-center gap-2"
            >
              Start Learning Free
              <ChevronRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-semibold text-lg transition-all"
            >
              I Have an Account
            </button>
          </div>

          {/* Stats */}
          <div className="landing-stats flex flex-wrap justify-center gap-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">10K+</div>
              <div className="text-gray-500 text-sm">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-gray-500 text-sm">Video Lessons</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">50K+</div>
              <div className="text-gray-500 text-sm">Quizzes Taken</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">95%</div>
              <div className="text-gray-500 text-sm">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-section relative z-10 px-6 py-24">
        <div className="landing-container max-w-7xl mx-auto">
          <div className="landing-section-heading text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Why Choose{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                LEARNVIS?
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Our platform combines cutting-edge AI technology with proven
              learning methodologies
            </p>
          </div>

          <div className="landing-feature-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="landing-card group p-6 bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-3xl hover:border-blue-500/30 transition-all hover:-translate-y-1"
              >
                <div
                  className={`w-14 h-14 bg-${feature.color}-600/20 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon
                    className={`text-${feature.color}-400`}
                    size={28}
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section className="landing-section relative z-10 px-6 py-24 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent">
        <div className="landing-container max-w-7xl mx-auto">
          <div className="landing-section-heading text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Explore Natural Sciences
            </h2>
            <p className="text-gray-400">
              Choose from a wide range of subjects to master
            </p>
          </div>

          <div className="landing-subject-grid grid grid-cols-2 md:grid-cols-4 gap-6">
            {subjects.map((subject, index) => (
              <div
                key={index}
                className="landing-card group p-8 bg-[#111827]/40 backdrop-blur-xl border border-white/5 rounded-3xl hover:border-blue-500/30 transition-all cursor-pointer text-center hover:-translate-y-1"
              >
                <div
                  className={`w-20 h-20 bg-${subject.color}-600/20 rounded-3xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform`}
                >
                  <subject.icon
                    className={`text-${subject.color}-400`}
                    size={40}
                  />
                </div>
                <h3 className="text-xl font-semibold">{subject.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-section relative z-10 px-6 py-24">
        <div className="landing-container max-w-7xl mx-auto">
          <div className="landing-section-heading text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400">
              Your journey to knowledge in 4 simple steps
            </p>
          </div>

          <div className="landing-steps-grid grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Sign Up",
                desc: "Create your free account in seconds",
              },
              {
                step: "02",
                title: "Choose Subject",
                desc: "Select the topic you want to master",
              },
              {
                step: "03",
                title: "Learn & Practice",
                desc: "Watch videos and take AI quizzes",
              },
              {
                step: "04",
                title: "Track Progress",
                desc: "Monitor your improvement over time",
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-blue-600/20 mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 right-0 w-1/2 h-[2px] bg-gradient-to-r from-blue-600/30 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-section relative z-10 px-6 py-24">
        <div className="landing-final-cta max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-gray-300 mb-8 max-w-xl mx-auto">
              Join thousands of students who are already learning smarter with
              LEARNVIS
            </p>
            <button
              onClick={() => navigate("/signup")}
              className="px-10 py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-100 transition-all shadow-xl"
            >
              Get Started for Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer relative z-10 px-6 py-12 border-t border-white/5">
        <div className="landing-container max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent"></div>
              </div>
              <span className="text-lg font-bold">LEARNVIS</span>
            </div>
            <div className="flex items-center gap-8 text-gray-400 text-sm">
              <span className="hover:text-white cursor-pointer transition-colors">
                About
              </span>
              <span className="hover:text-white cursor-pointer transition-colors">
                Privacy
              </span>
              <span className="hover:text-white cursor-pointer transition-colors">
                Terms
              </span>
              <span className="hover:text-white cursor-pointer transition-colors">
                Contact
              </span>
            </div>
            <div className="text-gray-500 text-sm">
              © 2024 LEARNVIS. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
