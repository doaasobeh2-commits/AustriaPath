import React, { Suspense, useCallback, useEffect, useState } from "react";
import PremiumScheduleScreen from "./screens/PremiumScheduleScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { AkademieScreen } from "./screens/AkademieScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { IntelligentExamScreen } from "./screens/IntelligentExamScreen";
import { SpeakingScreen } from "./screens/SpeakingScreen";
import LevelSelectScreen from "./screens/LevelSelectScreen";
import { PracticeScreen } from "./screens/PracticeScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import SubscriptionScreen from "./screens/SubscriptionScreen";
import AccountSettingsScreen from "./screens/AccountSettingsScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import AuthWelcomeScreen from "./screens/AuthWelcomeScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import { DatabaseScreen } from "./screens/DatabaseScreen";
import { WritingScreen } from "./screens/WritingScreen";
import { ImageTrainingScreen } from "./screens/ImageTrainingScreen";
import { PlanningScreen } from "./screens/PlanningScreen";
import { LesenScreen } from "./screens/LesenScreen";
import { PremiumExamScreen } from "./screens/PremiumExamScreen.jsx";
import { HorenScreen } from "./screens/HorenScreen";
import { B2ModelScreen } from "./screens/B2ModelsScreen";
import WeeklyPlanSetupScreen from "./screens/WeeklyPlanSetupScreen.jsx";
import PlacementTestScreen from "./screens/PlacementTestScreen";
import AISessionScreen from "./screens/AISessionScreen";
import PremiumExamSessionScreen from "./screens/PremiumExamSessionScreen";
import { isAdminAccount } from "../config/authConfig";
import {
  getSafeTab,
  isAdminPreviewAllowed,
} from "../security/routeGuard";
import { readJsonStorage } from "../security/secureStorage";
import {
  clearSession,
  purgeLegacyAuthStorage,
  resolveSessionUser,
  syncSessionUser,
  validateSessionFromBackend,
} from "./userAccess";
import { useBackend } from "../api/useBackend.js";
import { scheduleBackendHydration } from "../api/hydrateBackend.js";
import { verifyEmail } from "../api/repositories/index.js";
import LegalPageScreen from "./components/LegalPageScreen";
import LegalConsentScreen from "./screens/LegalConsentScreen";
import { needsLegalConsent, saveLegalConsent } from "../legal/consent.js";
import {
  AI_SESSION_STORAGE_KEY,
  LEGACY_AI_SESSION_STORAGE_KEY,
} from "../constants/storageKeys.js";
import TrialExpiredScreen from "./screens/TrialExpiredScreen";
import MessagesScreen from "./screens/MessagesScreen.jsx";
import { isTrialExpiredUser } from "../utils/accessStatus.js";
import { isOnboardingComplete, markOnboardingComplete } from "../utils/userPreferences.js";

const AdminScreen = React.lazy(() =>
  import("./screens/AdminScreen").then((module) => ({ default: module.AdminScreen }))
);
const UserManagementScreen = React.lazy(() =>
  import("./screens/UserManagementScreen")
);
const ExaminerLabScreen = React.lazy(() =>
  import("./screens/ExaminerLabScreen")
);
const AIPrueferScreen = React.lazy(() =>
  import("./screens/AIPrueferScreen")
);

function AdminRouteFallback() {
  return null;
}

function getInitialTab(user) {
  return isAdminAccount(user) ? "admin" : "home";
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [levelTarget, setLevelTarget] = useState(null);
  const [selectedWritingModel, setSelectedWritingModel] = useState(null);
  const [authScreen, setAuthScreen] = useState("welcome");
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboardingComplete());
  const [legalView, setLegalView] = useState(null);
  const [, setConsentUpdated] = useState(0);
  const [authTokenAction, setAuthTokenAction] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get("resetPassword");
    const verifyToken = params.get("verifyEmail");
    if (resetToken) return { type: "reset", token: resetToken };
    if (verifyToken) return { type: "verify", token: verifyToken };
    return null;
  });
  const [authTokenMessage, setAuthTokenMessage] = useState(null);

  const isAdmin = isAdminAccount(currentUser);

  const isAdminPreview =
    isAdminPreviewAllowed(currentUser) &&
    localStorage.getItem("isAdminPreview") === "true";

  const setActiveTabGuarded = useCallback(
    (tab) => {
      setActiveTab((current) => {
        const requested = typeof tab === "function" ? tab(current) : tab;
        return getSafeTab(requested, currentUser);
      });
    },
    [currentUser]
  );

  const completeLogin = (authenticatedUser) => {
    const resolved = authenticatedUser || resolveSessionUser();

    if (!resolved) {
      handleLogout();
      return;
    }

    syncSessionUser(resolved);
    const sessionUser = resolveSessionUser();

    if (!sessionUser) {
      handleLogout();
      return;
    }

    setCurrentUser(sessionUser);
    setIsLoggedIn(true);
    setActiveTab(isAdminAccount(sessionUser) ? "admin" : "home");
    scheduleBackendHydration({ includeAdmin: isAdminAccount(sessionUser) });
  };

  useEffect(() => {
    if (!useBackend() || !authTokenAction || authTokenAction.type !== "verify") return;

    verifyEmail(authTokenAction.token)
      .then(() => {
        setAuthTokenMessage("E-Mail erfolgreich bestätigt. Sie können sich jetzt anmelden.");
        setAuthTokenAction(null);
        window.history.replaceState({}, "", window.location.pathname);
      })
      .catch(() => {
        setAuthTokenMessage("Bestätigungslink ungültig oder abgelaufen.");
        setAuthTokenAction(null);
        window.history.replaceState({}, "", window.location.pathname);
      });
  }, [authTokenAction]);

  useEffect(() => {
    let cancelled = false;

    purgeLegacyAuthStorage();

    if (!useBackend()) {
      setIsLoggedIn(false);
      setCurrentUser(null);
      return () => {
        cancelled = true;
      };
    }

    validateSessionFromBackend()
      .then((resolved) => {
        if (cancelled) return;

        const sessionUser = resolveSessionUser() || resolved;
        if (!sessionUser) {
          setIsLoggedIn(false);
          setCurrentUser(null);
          return;
        }

        setCurrentUser(sessionUser);
        setIsLoggedIn(true);
        setActiveTab((tab) =>
          isAdminAccount(sessionUser) ? "admin" : getSafeTab(tab, sessionUser)
        );
      })
      .catch(() => {
        if (cancelled) return;
        const sessionUser = resolveSessionUser();
        if (sessionUser) {
          setCurrentUser(sessionUser);
          setIsLoggedIn(true);
          return;
        }
        setIsLoggedIn(false);
        setCurrentUser(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const safeTab = getSafeTab(activeTab, currentUser);
    if (safeTab !== activeTab) {
      setActiveTab(safeTab);
    }
  }, [activeTab, currentUser]);

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

  const handleNotifications = () => {
    setActiveTabGuarded("messages");
  };

  const openWithLevel = (target) => {
    setLevelTarget(target);
    setSelectedLevel(null);
    setSelectedWritingModel(null);
    setActiveTab("levelSelect");
  };

  const guardedTab = getSafeTab(activeTab, currentUser);

  if (legalView) {
    return (
      <LegalPageScreen
        pageId={legalView}
        onBack={() => setLegalView(null)}
      />
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingScreen
        onFinish={() => {
          markOnboardingComplete();
          setShowOnboarding(false);
        }}
      />
    );
  }

  if (needsLegalConsent()) {
    return (
      <LegalConsentScreen
        onAccept={() => {
          saveLegalConsent();
          setConsentUpdated((value) => value + 1);
        }}
        onOpenLegal={setLegalView}
      />
    );
  }

  if (!isLoggedIn) {
    if (authTokenAction?.type === "reset") {
      return (
        <ResetPasswordScreen
          token={authTokenAction.token}
          onBack={() => {
            setAuthTokenAction(null);
            window.history.replaceState({}, "", window.location.pathname);
            setAuthScreen("login");
          }}
          onSuccess={() => {
            setAuthTokenAction(null);
            window.history.replaceState({}, "", window.location.pathname);
          }}
        />
      );
    }

    if (authScreen === "forgot") {
      return (
        <ForgotPasswordScreen onBack={() => setAuthScreen("login")} />
      );
    }

    if (authScreen === "login") {
      return (
        <>
          {authTokenMessage && (
            <div
              style={{
                position: "fixed",
                top: 16,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 9999,
                background: "#ecfdf5",
                color: "#166534",
                border: "1px solid #bbf7d0",
                borderRadius: 12,
                padding: "12px 16px",
                maxWidth: 420,
                textAlign: "center",
              }}
            >
              {authTokenMessage}
            </div>
          )}
          <LoginScreen
          onLogin={completeLogin}
          onRegister={() => setAuthScreen("register")}
          onForgotPassword={() => setAuthScreen("forgot")}
          onBack={() => setAuthScreen("welcome")}
        />
        </>
      );
    }

    if (authScreen === "register") {
      return (
        <RegisterScreen
          onBack={() => setAuthScreen("welcome")}
          onLogin={() => setAuthScreen("login")}
          onRegisterSuccess={completeLogin}
          onOpenLegal={setLegalView}
        />
      );
    }

    return (
      <AuthWelcomeScreen
        onLogin={() => setAuthScreen("login")}
        onRegister={() => setAuthScreen("register")}
        onOpenLegal={setLegalView}
      />
    );
  }

  if (isLoggedIn && isTrialExpiredUser(currentUser)) {
    return <TrialExpiredScreen onSignOut={handleLogout} />;
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
                setActiveTabGuarded("admin");
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
            <button
              type="button"
              onClick={handleNotifications}
              style={notificationButtonStyle}
              aria-label="Benachrichtigungen"
            >
              🔔
            </button>
            <button onClick={handleLogout} style={logoutButtonStyle}>
              🚪
            </button>
          </div>
        </div>

        <main style={mainStyle}>
          <Suspense fallback={<AdminRouteFallback />}>
          {guardedTab === "home" && (
            <HomeScreen setActiveTab={setActiveTabGuarded} />
          )}

          {guardedTab === "messages" && (
            <MessagesScreen setActiveTab={setActiveTabGuarded} />
          )}

          {guardedTab === "examinerLab" &&
            (isAdmin ? (
              <ExaminerLabScreen setActiveTab={setActiveTabGuarded} />
            ) : (
              <HomeScreen setActiveTab={setActiveTabGuarded} />
            ))}

          {guardedTab === "aiPruefer" &&
            (isAdmin ? (
              <AIPrueferScreen setActiveTab={setActiveTabGuarded} />
            ) : (
              <HomeScreen setActiveTab={setActiveTabGuarded} />
            ))}

          {guardedTab === "levelSelect" && (
            <LevelSelectScreen
              onSelectLevel={(level) => {
                localStorage.setItem("userLevel", level);
                setSelectedLevel(level);
                setActiveTabGuarded(levelTarget || "practice");
              }}
            />
          )}

          {guardedTab === "akademie" && (
            <AkademieScreen
              setActiveTab={setActiveTabGuarded}
              selectedLevel={selectedLevel}
            />
          )}

          {guardedTab === "admin" &&
            (isAdmin ? (
              <AdminScreen setActiveTab={setActiveTabGuarded} />
            ) : (
              <HomeScreen setActiveTab={setActiveTabGuarded} />
            ))}

          {guardedTab === "userManagement" &&
            (isAdmin ? (
              <UserManagementScreen
                setActiveTab={setActiveTabGuarded}
                backTab={isAdmin ? "admin" : "profile"}
              />
            ) : (
              <HomeScreen setActiveTab={setActiveTabGuarded} />
            ))}

          {guardedTab === "exams" && (
            <IntelligentExamScreen
              level={selectedLevel}
              onBackToLevels={() => openWithLevel("exams")}
            />
          )}

          {guardedTab === "practice" && (
            <PracticeScreen
              setActiveTab={setActiveTabGuarded}
              selectedLevel={selectedLevel}
              setSelectedLevel={setSelectedLevel}
              setSelectedWritingModel={setSelectedWritingModel}
              userLevel={selectedLevel || localStorage.getItem("userLevel") || "B1"}
            />
          )}

          {guardedTab === "b2model" && (
            <B2ModelScreen
              model={selectedWritingModel}
              setActiveTab={setActiveTabGuarded}
            />
          )}

          {guardedTab === "lesen" && (
            <LesenScreen setActiveTab={setActiveTabGuarded} selectedLevel={selectedLevel} />
          )}

          {guardedTab === "horen" && (
            <HorenScreen setActiveTab={setActiveTabGuarded} selectedLevel={selectedLevel} />
          )}

          {guardedTab === "writing" && (
            <WritingScreen
              selectedWritingModel={selectedWritingModel}
              selectedLevel={selectedLevel}
              setActiveTab={setActiveTabGuarded}
            />
          )}

          {guardedTab === "images" && (
            <ImageTrainingScreen
              setActiveTab={setActiveTabGuarded}
              selectedLevel={selectedLevel}
            />
          )}

          {guardedTab === "planning" && (
            <PlanningScreen setActiveTab={setActiveTabGuarded} selectedLevel={selectedLevel} />
          )}

          {guardedTab === "speaking" && (
            <SpeakingScreen setActiveTab={setActiveTabGuarded} selectedLevel={selectedLevel} />
          )}

          {guardedTab === "database" && (
            <DatabaseScreen
              setActiveTab={setActiveTabGuarded}
              onOpenWriting={() => setActiveTabGuarded("writing")}
            />
          )}

          {guardedTab === "profile" && (
            <ProfileScreen onLogout={handleLogout} setActiveTab={setActiveTabGuarded} />
          )}

          {guardedTab === "accountSettings" && (
            <AccountSettingsScreen
              setActiveTab={setActiveTabGuarded}
              onLogout={handleLogout}
              onOpenLegal={setLegalView}
            />
          )}

          {guardedTab === "premium" && (
            <SubscriptionScreen
              setActiveTab={setActiveTabGuarded}
              onOpenPremiumExam={() => setActiveTabGuarded("premiumExam")}
            />
          )}

          {guardedTab === "premiumSchedule" && (
            <PremiumScheduleScreen setActiveTab={setActiveTabGuarded} />
          )}

          {guardedTab === "placementTest" && (
            <PlacementTestScreen setActiveTab={setActiveTabGuarded} />
          )}

          {guardedTab === "premiumExam" && (
            <PremiumExamScreen setActiveTab={setActiveTabGuarded} />
          )}

          {guardedTab === "weeklyPlanSetup" && (
            <WeeklyPlanSetupScreen setActiveTab={setActiveTabGuarded} />
          )}

          {guardedTab === "weeklySession" && (
            <AISessionScreen
              sessionType="weekly_plan"
              mode="weekly_plan"
              title="KI-Wochentraining"
              level="B1"
              onBack={() => setActiveTabGuarded("profile")}
              onFinish={() => {
                alert("Training beendet");
                setActiveTabGuarded("profile");
              }}
            />
          )}

          {guardedTab === "aiSession" &&
            (() => {
              const session =
                readJsonStorage(AI_SESSION_STORAGE_KEY, null) ??
                readJsonStorage(LEGACY_AI_SESSION_STORAGE_KEY, null);

              if (!session) {
                return <ProfileScreen setActiveTab={setActiveTabGuarded} />;
              }

              return (
                <AISessionScreen
                  sessionType={session.sessionType || "weekly_plan"}
                  mode={session.mode || "weekly_plan"}
                  title={session.title || "KI-Wochentraining"}
                  level={session.level || "B1"}
                  parts={session.parts || []}
                  onBack={() => setActiveTabGuarded("profile")}
                  onFinish={(report) => {
                    const savedPlan = readJsonStorage("austriaPathWeeklyPlan", null);

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
                    setActiveTabGuarded("profile");
                  }}
                />
              );
            })()}

          {guardedTab === "premiumExamSession" && (
            <PremiumExamSessionScreen setActiveTab={setActiveTabGuarded} />
          )}
          </Suspense>
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
                  setActiveTabGuarded(tab.id);
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

const notificationButtonStyle = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: "18px",
  lineHeight: 1,
  padding: 0,
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
