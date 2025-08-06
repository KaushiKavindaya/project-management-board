import React, { useState } from "react";
import Board from "./components/Board";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [showLoginPage, setShowLoginPage] = useState(true);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setSelectedBoardId(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-page-container">
        {showLoginPage ? (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onSwitchToSignup={() => setShowLoginPage(false)}
          />
        ) : (
          <SignupPage
            onLoginSuccess={handleLoginSuccess}
            onSwitchToLogin={() => setShowLoginPage(true)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="app-layout">
      {selectedBoardId ? (
        <Board
          boardId={selectedBoardId}
          onBackToDashboard={() => setSelectedBoardId(null)}
        />
      ) : (
        <DashboardPage
          onSelectBoard={setSelectedBoardId}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
export default App;
