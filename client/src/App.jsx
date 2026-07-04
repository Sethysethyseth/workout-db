import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { Layout } from "./components/Layout.jsx";
import { AuthLayout } from "./components/AuthLayout.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { MyTemplatesPage } from "./pages/MyTemplatesPage.jsx";
import { PublicTemplatesPage } from "./pages/PublicTemplatesPage.jsx";
import { CreateTemplatePage } from "./pages/CreateTemplatePage.jsx";
import { EditTemplatePage } from "./pages/EditTemplatePage.jsx";
import { EditBlockTemplatePage } from "./pages/EditBlockTemplatePage.jsx";
import { SessionsPage } from "./pages/SessionsPage.jsx";
import { AnalyticsPage } from "./pages/AnalyticsPage.jsx";
import { SessionDetailPage } from "./pages/SessionDetailPage.jsx";
import { StartLogWorkoutPage } from "./pages/StartLogWorkoutPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { AppearancePage } from "./pages/profile/AppearancePage.jsx";
import { SecurityPage } from "./pages/profile/SecurityPage.jsx";
import { FeedbackPage } from "./pages/profile/FeedbackPage.jsx";
import { DevFeedbackPage } from "./pages/DevFeedbackPage.jsx";
import { HelloPage } from "./pages/HelloPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<Layout />}>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <MyTemplatesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates/public"
          element={
            <ProtectedRoute>
              <PublicTemplatesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-template"
          element={
            <ProtectedRoute>
              <CreateTemplatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates/:id/edit"
          element={
            <ProtectedRoute>
              <EditTemplatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/blocks/:id/edit"
          element={
            <ProtectedRoute>
              <EditBlockTemplatePage />
            </ProtectedRoute>
          }
        />
        <Route path="/templates/new" element={<Navigate to="/create-template" replace />} />
        <Route
          path="/log-workout"
          element={
            <ProtectedRoute>
              <StartLogWorkoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sessions"
          element={
            <ProtectedRoute>
              <SessionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sessions/:id"
          element={
            <ProtectedRoute>
              <SessionDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/appearance"
          element={
            <ProtectedRoute>
              <AppearancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/security"
          element={
            <ProtectedRoute>
              <SecurityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/feedback"
          element={
            <ProtectedRoute>
              <FeedbackPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hello"
          element={
            <ProtectedRoute>
              <HelloPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev/feedback"
          element={
            <ProtectedRoute>
              <DevFeedbackPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
