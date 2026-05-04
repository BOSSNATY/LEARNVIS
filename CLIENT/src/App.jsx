import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./styles/responsive.css";

// Auth Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";

// Student Pages
import StudentDashboard from "./pages/student/Dashboard";
import StudentOnboarding from "./pages/student/Onboarding";
import StudentSubjects from "./pages/student/Subjects";
import StudentTopicSelection from "./pages/student/TopicSelection";
import StudentLearnPage from "./pages/student/LearnPage";
import StudentQuiz from "./pages/student/Quiz";
import StudentQuizResult from "./pages/student/QuizResult";
import StudentResults from "./pages/student/Results";
import StudentAnalytics from "./pages/student/Analytics";
import StudentRecommendations from "./pages/student/Recommendations";
import StudentProfile from "./pages/student/Profile";
import StudentSettings from "./pages/student/Settings";
import StudentPlanner from "./pages/student/Planner";
import StudentCalendar from "./pages/student/Calendar";
import StudentContentUpload from "./pages/student/ContentUpload";
import StudentRevision from "./pages/student/Revision";
import StudentMistakes from "./pages/student/Mistakes";
import Prediction from "./pages/student/Prediction";
import StudentMockExam, {
  MockExamResult,
  MockExamTake,
} from "./pages/student/MockExam";
import StudentMastery from "./pages/student/Mastery";
import StudentRetry from "./pages/student/Retry";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminSubjects from "./pages/admin/Subjects";
import AdminTopics from "./pages/admin/Topics";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminSettings from "./pages/admin/Settings";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

// Context
import { AppProvider } from "./context/AppContext";

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* ================= PUBLIC ROUTES ================= */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <Landing />
              </PublicRoute>
            }
          />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* ================= STUDENT FLOW ================= */}

          {/* DASHBOARD */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* ONBOARDING */}
          <Route
            path="/student/onboarding"
            element={
              <ProtectedRoute>
                <StudentOnboarding />
              </ProtectedRoute>
            }
          />

          {/* STEP 1: SUBJECT SELECTION */}
          <Route
            path="/student/subjects"
            element={
              <ProtectedRoute>
                <StudentSubjects />
              </ProtectedRoute>
            }
          />

          {/* STEP 2: TOPIC SELECTION */}
          <Route
            path="/student/subjects/:subjectId"
            element={
              <ProtectedRoute>
                <StudentTopicSelection />
              </ProtectedRoute>
            }
          />

          {/* STEP 3: LEARNING */}
          <Route
            path="/student/learn/:topicId"
            element={
              <ProtectedRoute>
                <StudentLearnPage />
              </ProtectedRoute>
            }
          />

          {/* OPTIONAL: CONTENT UPLOAD */}
          <Route
            path="/student/learn/:topicId/upload"
            element={
              <ProtectedRoute>
                <StudentContentUpload />
              </ProtectedRoute>
            }
          />

          {/* ================= QUIZ FLOW ================= */}
          <Route
            path="/student/quiz/:topicId"
            element={
              <ProtectedRoute>
                <StudentQuiz />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/quiz/:topicId/start"
            element={
              <ProtectedRoute>
                <StudentQuiz />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/quiz/:quizId/result"
            element={
              <ProtectedRoute>
                <StudentQuizResult />
              </ProtectedRoute>
            }
          />

          {/* ================= ANALYTICS ================= */}
          <Route
            path="/student/results"
            element={
              <ProtectedRoute>
                <StudentResults />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/analytics"
            element={
              <ProtectedRoute>
                <StudentAnalytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/mistakes"
            element={
              <ProtectedRoute>
                <StudentMistakes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/prediction"
            element={
              <ProtectedRoute>
                <Prediction />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/recommendations"
            element={
              <ProtectedRoute>
                <StudentRecommendations />
              </ProtectedRoute>
            }
          />

          {/* ================= STUDY SYSTEM ================= */}
          <Route path="/student/planner" element={<StudentPlanner />} />
          <Route path="/student/calendar" element={<StudentCalendar />} />

          <Route path="/student/revision" element={<StudentRevision />} />

          <Route
            path="/student/revision/:topicId"
            element={<StudentRevision />}
          />

          {/* ================= MOCK EXAM ================= */}
          <Route path="/student/mock-exam" element={<StudentMockExam />} />
          <Route path="/student/mock-exam/:id" element={<MockExamTake />} />
          <Route
            path="/student/mock-exam/:id/result"
            element={<MockExamResult />}
          />

          {/* ================= PROFILE ================= */}
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/settings" element={<StudentSettings />} />

          <Route
            path="/student/mastery/:topicId"
            element={<StudentMastery />}
          />

          <Route path="/student/retry/:attemptId" element={<StudentRetry />} />

          {/* ================= ADMIN ================= */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/:userId" element={<AdminUsers />} />
          <Route path="/admin/subjects" element={<AdminSubjects />} />
          <Route path="/admin/topics" element={<AdminTopics />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/settings" element={<AdminSettings />} />

          {/* ================= FALLBACK ================= */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
