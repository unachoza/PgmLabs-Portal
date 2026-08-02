import { Routes, Route } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { useAuth } from './auth/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ParticipantProfilePage } from './features/participant/ParticipantProfilePage';
import { ParticipantCheckinsPage } from './features/participant/ParticipantCheckinsPage';
import { ParticipantSurveysPage } from './features/participant/ParticipantSurveysPage';
import { ParticipantHistoryPage } from './features/participant/ParticipantHistoryPage';
import { AdminParticipantsPage } from './features/admin/AdminParticipantsPage';
import { AdminCheckinsPage } from './features/admin/AdminCheckinsPage';
import { AdminSurveysPage } from './features/admin/AdminSurveysPage';
import { AdminResponsesPage } from './features/admin/AdminResponsesPage';
import { AdminFinancialsPage } from './features/admin/AdminFinancialsPage';
import { AdminFunderUpdatesPage } from './features/admin/AdminFunderUpdatesPage';
import { AdminCampaignsPage } from './features/admin/AdminCampaignsPage';
import { AdminKnowledgeBasePage } from './features/admin/AdminKnowledgeBasePage';
import { FunderDashboardPage } from './features/funder/FunderDashboardPage';
import { FunderUpdatesPage } from './features/funder/FunderUpdatesPage';

// The three roles share the same nav paths ("/", "/checkins", "/surveys")
// but render different pages. These small routers pick the right one.
function HomeRoute() {
  const { profile } = useAuth();
  if (profile?.role === 'admin') return <AdminParticipantsPage />;
  if (profile?.role === 'funder') return <FunderDashboardPage />;
  return <ParticipantProfilePage />;
}

function CheckinsRoute() {
  const { profile } = useAuth();
  return profile?.role === 'admin' ? <AdminCheckinsPage /> : <ParticipantCheckinsPage />;
}

function SurveysRoute() {
  const { profile } = useAuth();
  return profile?.role === 'admin' ? <AdminSurveysPage /> : <ParticipantSurveysPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        element={
          <ProtectedRoute allowed={['participant', 'admin', 'funder']}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomeRoute />} />
        <Route path="/checkins" element={<CheckinsRoute />} />
        <Route path="/surveys" element={<SurveysRoute />} />
        <Route path="/history" element={<ParticipantHistoryPage />} />
        <Route path="/responses" element={<AdminResponsesPage />} />
        <Route path="/financials" element={<AdminFinancialsPage />} />
        <Route path="/funder-updates" element={<AdminFunderUpdatesPage />} />
        <Route path="/campaigns" element={<AdminCampaignsPage />} />
        <Route path="/knowledge-base" element={<AdminKnowledgeBasePage />} />
        <Route path="/updates" element={<FunderUpdatesPage />} />
      </Route>
    </Routes>
  );
}

