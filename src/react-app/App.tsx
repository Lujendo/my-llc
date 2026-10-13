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
import type { Entity } from "./types";

function App() {
  const { user, signup, login, logout } = useAuth();
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [activeEntity, setActiveEntity] = useState<Entity | null>(null);
  const [showEntityManager, setShowEntityManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { entities } = useEntities(user?.id);

  // Initialize first entity on first login or set active entity
  useEffect(() => {
    if (user && entities.length > 0 && !activeEntity) {
      setActiveEntity(entities[0]);
    }
  }, [user, entities, activeEntity]);

  // If not authenticated, show auth forms
  if (!user) {
    return (
      <AuthForms
        onSignup={signup}
        onLogin={login}
        onAuthSuccess={() => setCurrentView("dashboard")}
      />
    );
  }

  // After login, show main app
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Navigation */}
      <Navigation
        user={user}
        currentView={currentView}
        onNavigate={setCurrentView}
        entities={entities}
        activeEntity={activeEntity}
        onEntityChange={setActiveEntity}
        onLogout={logout}
        onShowEntityManager={() => setShowEntityManager(true)}
        onShowSettings={() => setShowSettings(true)}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      {/* Entity Manager Modal */}
      {showEntityManager && (
        <EntityManager
          entities={entities}
          userId={user?.id}
          onClose={() => setShowEntityManager(false)}
          onEntityAdded={(entity) => {
            setActiveEntity(entity);
            setShowEntityManager(false);
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <Settings user={user} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default App;
