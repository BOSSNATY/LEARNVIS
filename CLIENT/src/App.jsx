import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState } from "react";

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

// Context
import { AppProvider } from "./context/AppContext";

function App() {
  const [user, setUser] = useState(null);

  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Signup setUser={setUser} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/planner" element={<StudentPlanner />} />
          <Route path="/student/calendar" element={<StudentCalendar />} />
          <Route path="/student/onboarding" element={<StudentOnboarding />} />
          <Route path="/student/onboarding/goal" element={<StudentPlanner />} />
          <Route path="/student/onboarding/time" element={<StudentPlanner />} />
          <Route path="/student/subjects" element={<StudentSubjects />} />
          <Route
            path="/student/subjects/:subjectId"
            element={<StudentTopicSelection />}
          />
          <Route
            path="/student/subjects/:subjectId/topics/:topicId"
            element={<StudentLearnPage />}
          />
          <Route
            path="/student/topics/:topicId"
            element={<StudentLearnPage />}
          />
          <Route
            path="/student/learn/:topicId"
            element={<StudentLearnPage />}
          />
          <Route
            path="/student/learn/:topicId/upload"
            element={<StudentContentUpload />}
          />
          <Route
            path="/student/quiz/:topicId/start"
            element={<StudentQuiz />}
          />
          <Route path="/student/quiz/:topicId" element={<StudentQuiz />} />
          <Route
            path="/student/quiz/:quizId/result"
            element={<StudentQuizResult />}
          />
          <Route
            path="/student/mastery/:topicId"
            element={<StudentMastery />}
          />
          <Route path="/student/retry/:attemptId" element={<StudentRetry />} />
          <Route path="/student/revision" element={<StudentRevision />} />
          <Route
            path="/student/revision/:topicId"
            element={<StudentRevision />}
          />
          <Route path="/student/mock-exam" element={<StudentMockExam />} />
          <Route path="/student/mock-exam/:id" element={<MockExamTake />} />
          <Route
            path="/student/mock-exam/:id/result"
            element={<MockExamResult />}
          />
          <Route path="/student/results" element={<StudentResults />} />
          <Route path="/student/analytics" element={<StudentAnalytics />} />
          <Route path="/student/mistakes" element={<StudentMistakes />} />
          <Route path="/student/prediction" element={<Prediction />} />
          <Route
            path="/student/recommendations"
            element={<StudentRecommendations />}
          />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/settings" element={<StudentSettings />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/:userId" element={<AdminUsers />} />
          <Route path="/admin/subjects" element={<AdminSubjects />} />
          <Route path="/admin/topics" element={<AdminTopics />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/settings" element={<AdminSettings />} />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
