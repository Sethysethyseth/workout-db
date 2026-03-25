import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { Layout } from "./components/Layout.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { MyTemplatesPage } from "./pages/MyTemplatesPage.jsx";
import { PublicTemplatesPage } from "./pages/PublicTemplatesPage.jsx";
import { CreateTemplatePage } from "./pages/CreateTemplatePage.jsx";
import { EditTemplatePage } from "./pages/EditTemplatePage.jsx";
import { EditBlockTemplatePage } from "./pages/EditBlockTemplatePage.jsx";
import { SessionsPage } from "./pages/SessionsPage.jsx";
import { SessionDetailPage } from "./pages/SessionDetailPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

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
          path="/sessions"
          element={
            <ProtectedRoute>
              <SessionsPage />
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
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
