import { useState, useEffect } from "react";
import "./App.css";
import { useAuth } from "./hooks/useAuth";
import { useEntities } from "./hooks/useEntities";
import { AuthForms } from "./components/AuthForms";
import { Navigation } from "./components/Navigation";
import { Dashboard } from "./components/Dashboard";
import { Checklist } from "./components/Checklist";
import { Timeline } from "./components/Timeline";
import { TreatyAnalyzer } from "./components/TreatyAnalyzer";
import { DocumentGenerator } from "./components/DocumentGenerator";
import { EntityManager } from "./components/EntityManager";
import { Settings } from "./components/Settings";
import { LegalPage } from "./components/LegalPage";
import { Footer } from "./components/Footer";
import { CookieConsent } from "./components/CookieConsent";
import { TERMS_MARKDOWN, PRIVACY_MARKDOWN } from "./lib/legal";

type LegalView = "terms" | "privacy" | null;

function App() {
  const { user, signup, login, logout } = useAuth();
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [activeEntityId, setActiveEntityId] = useState<string | null>(null);
  const [showEntityManager, setShowEntityManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [legalView, setLegalView] = useState<LegalView>(null);
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);

  const { entities, createEntity, updateEntity, deleteEntity } = useEntities(user?.id);

  // Legal pages are real routes (/terms, /privacy) so links are shareable and
  // survive a reload. Read the pathname on load; keep the URL in sync on nav.
  useEffect(() => {
    const p = window.location.pathname;
    if (p === "/terms") setLegalView("terms");
    else if (p === "/privacy") setLegalView("privacy");
  }, []);

  const openLegal = (view: "terms" | "privacy") => {
    setLegalView(view);
    window.history.pushState({}, "", `/${view}`);
  };
  const closeLegal = () => {
    setLegalView(null);
    window.history.pushState({}, "", "/");
  };

  // Derive the active entity from the live list so edits/deletes stay in sync
  // (no stale copy held in state).
  const activeEntity =
    entities.find((e) => e.id === activeEntityId) ?? entities[0] ?? null;

  useEffect(() => {
    if (!user) return;
    if (!entities.some((e) => e.id === activeEntityId)) {
      setActiveEntityId(entities[0]?.id ?? null);
    }
  }, [user, entities, activeEntityId]);

  // Legal pages are reachable whether or not the user is signed in.
  if (legalView) {
    return (
      <LegalPage
        title={legalView === "terms" ? "Terms of Service" : "Privacy Policy"}
        markdown={legalView === "terms" ? TERMS_MARKDOWN : PRIVACY_MARKDOWN}
        onBack={closeLegal}
      />
    );
  }

  // If not authenticated, show auth forms
  if (!user) {
    return (
      <>
        <AuthForms
          onSignup={signup}
          onLogin={login}
          onAuthSuccess={() => setCurrentView("dashboard")}
          onOpenLegal={openLegal}
        />
        <Footer
          onOpenLegal={openLegal}
          onOpenCookieSettings={() => setCookieSettingsOpen(true)}
        />
        <CookieConsent
          forceOpen={cookieSettingsOpen}
          onClose={() => setCookieSettingsOpen(false)}
        />
      </>
    );
  }

  // After login, show main app
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors">
      {/* Navigation */}
      <Navigation
        user={user}
        currentView={currentView}
        onNavigate={setCurrentView}
        entities={entities}
        activeEntity={activeEntity}
        onEntityChange={(entity) => setActiveEntityId(entity.id)}
        onLogout={logout}
        onShowEntityManager={() => setShowEntityManager(true)}
        onShowSettings={() => setShowSettings(true)}
      />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === "dashboard" && (
          <Dashboard user={user} entity={activeEntity} onNavigate={setCurrentView} />
        )}

        {currentView === "checklist" && <Checklist entity={activeEntity} />}

        {currentView === "timeline" && <Timeline entity={activeEntity} />}

        {currentView === "treaty" && (
          <TreatyAnalyzer entity={activeEntity} user={user} />
        )}

        {currentView === "documents" && (
          <DocumentGenerator entity={activeEntity} user={user} />
        )}

        {/* Fallback for unknown views */}
        {!["dashboard", "checklist", "timeline", "treaty", "documents"].includes(
          currentView
        ) && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">View not found</p>
          </div>
        )}
      </main>

      <Footer
        onOpenLegal={openLegal}
        onOpenCookieSettings={() => setCookieSettingsOpen(true)}
      />

      {/* Entity Manager Modal */}
      {showEntityManager && (
        <EntityManager
          entities={entities}
          onCreate={createEntity}
          onUpdate={updateEntity}
          onDelete={deleteEntity}
          onClose={() => setShowEntityManager(false)}
          onEntityAdded={(entity) => {
            setActiveEntityId(entity.id);
            setShowEntityManager(false);
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <Settings user={user} onClose={() => setShowSettings(false)} />
      )}

      <CookieConsent
        forceOpen={cookieSettingsOpen}
        onClose={() => setCookieSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
