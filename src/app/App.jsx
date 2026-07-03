import React, { useEffect, useState } from "react";
import PremiumScheduleScreen from "./screens/PremiumScheduleScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { AdminScreen } from "./screens/AdminScreen";
import { AkademieScreen } from "./screens/AkademieScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { IntelligentExamScreen } from "./screens/IntelligentExamScreen";
import { SpeakingScreen } from "./screens/SpeakingScreen";
import LevelSelectScreen from "./screens/LevelSelectScreen";
import { PracticeScreen } from "./screens/PracticeScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import SubscriptionScreen from "./screens/SubscriptionScreen";
import AccountSettingsScreen from "./screens/AccountSettingsScreen";
import ExaminerLabScreen from "./screens/ExaminerLabScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import AuthWelcomeScreen from "./screens/AuthWelcomeScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import { DatabaseScreen } from "./screens/DatabaseScreen";
import { WritingScreen } from "./screens/WritingScreen";
import { ImageTrainingScreen } from "./screens/ImageTrainingScreen";
import { PlanningScreen } from "./screens/PlanningScreen";
import { LesenScreen } from "./screens/LesenScreen";
import { PremiumExamScreen } from "./screens/PremiumExamScreen.jsx";
import { HorenScreen } from "./screens/HorenScreen";
import { B2ModelScreen } from "./screens/B2ModelsScreen";
import WeeklyPlanSetupScreen from "./screens/WeeklyPlanSetupScreen.jsx";
import UserManagementScreen from "./screens/UserManagementScreen";
import PlacementTestScreen from "./screens/PlacementTestScreen";
import AISessionScreen from "./screens/AISessionScreen";
import PremiumExamSessionScreen from "./screens/PremiumExamSessionScreen";
import { isAdminAccount } from "../config/authConfig";
import {
  clearSession,
  resolveSessionUser,
  syncSessionUser,
  validateSessionOnStartup,
} from "./userAccess";

const initialSessionUser = validateSessionOnStartup();

function getInitialTab(user) {
  return isAdminAccount(user) ? "admin" : "home";
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(initialSessionUser);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(initialSessionUser));
  const [activeTab, setActiveTab] = useState(() =>
    getInitialTab(initialSessionUser)
  );
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [levelTarget, setLevelTarget] = useState(null);
  const [selectedWritingModel, setSelectedWritingModel] = useState(null);
  const [authScreen, setAuthScreen] = useState("welcome");
  const [showOnboarding, setShowOnboarding] = useState(true);

  const isAdmin = isAdminAccount(currentUser);

  const isAdminPreview =
    localStorage.getItem("isAdminPreview") === "true";

  const completeLogin = () => {
    localStorage.setItem("isLoggedIn", "true");

    const resolved = resolveSessionUser();

    if (!resolved) {
      handleLogout();
      return;
    }

    syncSessionUser(resolved);
    setCurrentUser(resolved);
    setIsLoggedIn(true);
    setActiveTab(isAdminAccount(resolved) ? "admin" : "home");
  };

  useEffect(() => {
    const resolved = validateSessionOnStartup();

    if (!resolved) {
      setIsLoggedIn(false);
      setCurrentUser(null);
      return;
    }

    setCurrentUser(resolved);
    setIsLoggedIn(true);

    if (!isAdminAccount(resolved)) {
      setActiveTab((tab) =>
        tab === "admin" || tab === "userManagement" ? "home" : tab
      );
    }
  }, []);

  const handleLogout = () => {
    clearSession();

    setIsLoggedIn(false);
    setCurrentUser(null);
    setActiveTab("home");
    setSelectedLevel(null);
    setLevelTarget(null);
    setSelectedWritingModel(null);
    setAuthScreen("welcome");
  };

  const openWithLevel = (target) => {
    setLevelTarget(target);
    setSelectedLevel(null);
    setSelectedWritingModel(null);
    setActiveTab("levelSelect");
  };

  if (showOnboarding) {
    return <OnboardingScreen onFinish={() => setShowOnboarding(false)} />;
  }

  if (!isLoggedIn) {
    if (authScreen === "forgot") {
      return (
        <ForgotPasswordScreen onBack={() => setAuthScreen("login")} />
      );
    }

    if (authScreen === "login") {
      return (
        <LoginScreen
          onLogin={completeLogin}
          onRegister={() => setAuthScreen("register")}
          onForgotPassword={() => setAuthScreen("forgot")}
          onBack={() => setAuthScreen("welcome")}
        />
      );
    }

    if (authScreen === "register") {
      return (
        <RegisterScreen
          onBack={() => setAuthScreen("welcome")}
          onLogin={() => setAuthScreen("login")}
          onRegisterSuccess={completeLogin}
        />
      );
    }

    return (
      <AuthWelcomeScreen
        onLogin={() => setAuthScreen("login")}
        onRegister={() => setAuthScreen("register")}
      />
    );
  }

  return (
    <div style={pageStyle}>
      <div style={mobileAppStyle}>
        {isAdminPreview && (
          <div
            style={{
              background: "#fff3cd",
              border: "1px solid #ffe69c",
              color: "#664d03",
              padding: 12,
              borderRadius: 10,
              marginBottom: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: 700,
            }}
          >
            <span>👤 Admin Preview – {currentUser?.name}</span>

            <button
              onClick={() => {
                localStorage.removeItem("isAdminPreview");
                window.location.reload();
              }}
              style={{
                border: "none",
                background: "#2563eb",
                color: "#fff",
                padding: "8px 14px",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Zurück zum Admin
            </button>
          </div>
        )}

        <div style={topBarStyle}>
          <span style={brandStyle}>AustriaPath</span>

          <div style={{ display: "flex", gap: "16px", color: "#64748b" }}>
            <span>🔔</span>
            <button onClick={handleLogout} style={logoutButtonStyle}>
              🚪
            </button>
          </div>
        </div>

        <main style={mainStyle}>
          {activeTab === "home" && <HomeScreen setActiveTab={setActiveTab} />}

          {activeTab === "examinerLab" && (
            <ExaminerLabScreen setActiveTab={setActiveTab} />
          )}

          {activeTab === "levelSelect" && (
            <LevelSelectScreen
              onSelectLevel={(level) => {
                localStorage.setItem("userLevel", level);
                setSelectedLevel(level);
                setActiveTab(levelTarget || "practice");
              }}
            />
          )}

          {activeTab === "akademie" && (
            <AkademieScreen
              setActiveTab={setActiveTab}
              selectedLevel={selectedLevel}
            />
          )}

          {activeTab === "admin" &&
            (isAdmin ? (
              <AdminScreen setActiveTab={setActiveTab} />
            ) : (
              <HomeScreen setActiveTab={setActiveTab} />
            ))}

          {activeTab === "userManagement" &&
            (isAdmin ? (
              <UserManagementScreen setActiveTab={setActiveTab} />
            ) : (
              <HomeScreen setActiveTab={setActiveTab} />
            ))}

          {activeTab === "exams" && (
            <IntelligentExamScreen
              level={selectedLevel}
              onBackToLevels={() => openWithLevel("exams")}
            />
          )}

          {activeTab === "practice" && (
            <PracticeScreen
              setActiveTab={setActiveTab}
              selectedLevel={selectedLevel}
              setSelectedLevel={setSelectedLevel}
              setSelectedWritingModel={setSelectedWritingModel}
              userLevel={selectedLevel || localStorage.getItem("userLevel") || "B1"}
            />
          )}

          {activeTab === "b2model" && (
            <B2ModelScreen
              model={selectedWritingModel}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "lesen" && (
            <LesenScreen setActiveTab={setActiveTab} selectedLevel={selectedLevel} />
          )}

          {activeTab === "horen" && (
            <HorenScreen setActiveTab={setActiveTab} selectedLevel={selectedLevel} />
          )}

          {activeTab === "writing" && (
            <WritingScreen
              selectedWritingModel={selectedWritingModel}
              selectedLevel={selectedLevel}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "images" && (
            <ImageTrainingScreen
              setActiveTab={setActiveTab}
              selectedLevel={selectedLevel}
            />
          )}

          {activeTab === "planning" && (
            <PlanningScreen setActiveTab={setActiveTab} selectedLevel={selectedLevel} />
          )}

          {activeTab === "speaking" && (
            <SpeakingScreen setActiveTab={setActiveTab} selectedLevel={selectedLevel} />
          )}

          {activeTab === "database" && (
            <DatabaseScreen
              setActiveTab={setActiveTab}
              onOpenWriting={() => setActiveTab("writing")}
            />
          )}

          {activeTab === "profile" && (
            <ProfileScreen onLogout={handleLogout} setActiveTab={setActiveTab} />
          )}

          {activeTab === "accountSettings" && (
            <AccountSettingsScreen
              setActiveTab={setActiveTab}
              onLogout={handleLogout}
            />
          )}

          {activeTab === "premium" && (
            <SubscriptionScreen
              setActiveTab={setActiveTab}
              onOpenPremiumExam={() => setActiveTab("premiumExam")}
            />
          )}

          {activeTab === "premiumSchedule" && (
            <PremiumScheduleScreen setActiveTab={setActiveTab} />
          )}

          {activeTab === "placementTest" && (
            <PlacementTestScreen setActiveTab={setActiveTab} />
          )}

          {activeTab === "premiumExam" && (
            <PremiumExamScreen setActiveTab={setActiveTab} />
          )}

          {activeTab === "weeklyPlanSetup" && (
            <WeeklyPlanSetupScreen setActiveTab={setActiveTab} />
          )}

          {activeTab === "weeklySession" && (
            <AISessionScreen
              sessionType="weekly_plan"
              mode="weekly_plan"
              title="KI-Wochentraining"
              level="B1"
              onBack={() => setActiveTab("profile")}
              onFinish={() => {
                alert("Training beendet");
                setActiveTab("profile");
              }}
            />
          )}

          {activeTab === "aiSession" &&
            (() => {
              const session = JSON.parse(
                localStorage.getItem("austriaPathAiSession") || "null"
              );

              if (!session) {
                return <ProfileScreen setActiveTab={setActiveTab} />;
              }

              return (
                <AISessionScreen
                  sessionType={session.sessionType || "weekly_plan"}
                  mode={session.mode || "weekly_plan"}
                  title={session.title || "KI-Wochentraining"}
                  level={session.level || "B1"}
                  parts={session.parts || []}
                  onBack={() => setActiveTab("profile")}
                  onFinish={(report) => {
                    const savedPlan = JSON.parse(
                      localStorage.getItem("austriaPathWeeklyPlan") || "null"
                    );

                    if (savedPlan) {
                      const updatedPlan = {
                        ...savedPlan,
                        sessionReports: [
                          ...(savedPlan.sessionReports || []),
                          {
                            ...report,
                            finishedAt: new Date().toISOString(),
                          },
                        ],
                      };

                      localStorage.setItem(
                        "austriaPathWeeklyPlan",
                        JSON.stringify(updatedPlan)
                      );
                    }

                    alert("Training beendet. Bericht wurde im Profil gespeichert.");
                    setActiveTab("profile");
                  }}
                />
              );
            })()}

          {activeTab === "premiumExamSession" && (
            <PremiumExamSessionScreen setActiveTab={setActiveTab} />
          )}
        </main>

        <nav style={navStyle}>
          {[
            { id: "home", label: "Home", icon: "🏠" },
            { id: "practice", label: "Üben", icon: "🎯", needsLevel: true },
            { id: "akademie", label: "Akademie", icon: "🎓", needsLevel: true },
            { id: "database", label: "Datenbank", icon: "📚" },
            { id: "profile", label: "Profil", icon: "👤" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.needsLevel) {
                  openWithLevel(tab.id);
                } else {
                  setSelectedLevel(null);
                  setLevelTarget(null);
                  setSelectedWritingModel(null);
                  setActiveTab(tab.id);
                }
              }}
              style={{
                ...navButtonStyle,
                color: activeTab === tab.id ? "#2563eb" : "#94a3b8",
                fontWeight: activeTab === tab.id ? "bold" : "normal",
              }}
            >
              <span style={{ fontSize: "18px" }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  backgroundColor: "#ffffff",
};

const mobileAppStyle = {
  position: "relative",
  width: "100%",
  maxWidth: "430px",
  minHeight: "100vh",
  backgroundColor: "#f8fafc",
  boxShadow: "0 0 30px rgba(15, 23, 42, 0.18)",
  overflowX: "hidden",
  fontFamily: "system-ui, sans-serif",
};

const topBarStyle = {
  position: "sticky",
  top: 0,
  zIndex: 100,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 20px",
  backgroundColor: "#ffffff",
  borderBottom: "1px solid #f1f5f9",
};

const brandStyle = {
  fontWeight: "bold",
  fontSize: "18px",
  color: "#0f172a",
};

const logoutButtonStyle = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
};

const mainStyle = {
  width: "100%",
  paddingBottom: "90px",
  boxSizing: "border-box",
};

const navStyle = {
  position: "sticky",
  bottom: 0,
  left: 0,
  right: 0,
  display: "flex",
  backgroundColor: "#ffffff",
  borderTop: "1px solid #e2e8f0",
  padding: "8px 4px",
  zIndex: 1000,
};

const navButtonStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
  border: "none",
  backgroundColor: "transparent",
  cursor: "pointer",
  fontSize: "10px",
};