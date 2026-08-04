import React, { useEffect, useState } from "react";
import { getUserLanguage } from "../../utils/userPreferences";
import { fetchPlacementEntitlementView } from "../../utils/placementEntitlement.js";
import { fetchWeeklyPlanEntitlementView } from "../../utils/weeklyPlanEntitlement.js";

const COPY = {
  Deutsch: {
    title: "Premium-Angebote",
    subtitle: "Ausgewählte Lernprogramme — derzeit in der Pilotphase.",
    placementTitle: "Einstufungstest",
    placementText:
      "Persönliche Einstufung mit Lernempfehlungen. Wird freigeschaltet, sobald Ihr Zugang aktiv ist.",
    weeklyTitle: "KI-Wochenplan",
    weeklyText:
      "Strukturierter Wochenplan mit KI-Unterstützung. Wird freigeschaltet, sobald Ihr Zugang aktiv ist.",
    comingSoon: "Coming Soon",
    openPlacement: "Einstufungstest starten",
    openWeekly: "KI-Wochenplan öffnen",
    loading: "Wird geladen …",
  },
  العربية: {
    title: "عروض Premium",
    subtitle: "برامج تعليمية مختارة — في مرحلة تجريبية حالياً.",
    placementTitle: "اختبار تحديد المستوى",
    placementText: "تقييم شخصي مع توصيات تعليمية. يُفعّل عند تفعيل وصولك.",
    weeklyTitle: "خطة الأسبوع بالذكاء الاصطناعي",
    weeklyText: "خطة أسبوعية منظمة بدعم الذكاء الاصطناعي. تُفعّل عند تفعيل وصولك.",
    comingSoon: "قريباً",
    openPlacement: "بدء اختبار المستوى",
    openWeekly: "فتح خطة الأسبوع",
    loading: "جارٍ التحميل …",
  },
};

const PILOT_PRODUCTS = [
  { id: "placement", tab: "placementTest", titleKey: "placementTitle", textKey: "placementText", openKey: "openPlacement" },
  { id: "weekly_plan", tab: "weeklyPlanSetup", titleKey: "weeklyTitle", textKey: "weeklyText", openKey: "openWeekly" },
];

export default function SubscriptionScreen({ setActiveTab }) {
  const language = getUserLanguage();
  const copy = COPY[language] || COPY.Deutsch;
  const [loading, setLoading] = useState(true);
  const [placementEntitled, setPlacementEntitled] = useState(false);
  const [weeklyEntitled, setWeeklyEntitled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchPlacementEntitlementView(), fetchWeeklyPlanEntitlementView()])
      .then(([placement, weekly]) => {
        if (cancelled) return;
        setPlacementEntitled(Boolean(placement?.canTake));
        setWeeklyEntitled(Boolean(weekly?.canAccess));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isEntitled = (productId) =>
    productId === "placement" ? placementEntitled : weeklyEntitled;

  const handleOpen = (product) => {
    if (!isEntitled(product.id)) return;
    setActiveTab?.(product.tab);
  };

  return (
    <div style={container}>
      <button type="button" style={backButton} onClick={() => setActiveTab?.("profile")}>
        ← Zurück
      </button>

      <h1 style={title}>{copy.title}</h1>
      <p style={subtitle}>{copy.subtitle}</p>

      {PILOT_PRODUCTS.map((product) => {
        const entitled = isEntitled(product.id);
        return (
          <div key={product.id} style={card}>
            <h2 style={cardTitle}>{copy[product.titleKey]}</h2>
            <p style={cardText}>{copy[product.textKey]}</p>
            <button
              type="button"
              style={{
                ...button,
                backgroundColor: entitled ? "#2563eb" : "#94a3b8",
                cursor: entitled ? "pointer" : "default",
              }}
              disabled={loading || !entitled}
              onClick={() => handleOpen(product)}
            >
              {loading ? copy.loading : entitled ? copy[product.openKey] : copy.comingSoon}
            </button>
          </div>
        );
      })}
    </div>
  );
}

const container = {
  padding: "22px",
  paddingBottom: "100px",
  fontFamily: "system-ui, sans-serif",
  backgroundColor: "#f8fafc",
  minHeight: "100vh",
  boxSizing: "border-box",
};

const backButton = {
  border: "none",
  backgroundColor: "#e0f2fe",
  color: "#0369a1",
  padding: "10px 14px",
  borderRadius: "12px",
  fontWeight: "600",
  cursor: "pointer",
  marginBottom: "16px",
};

const title = {
  margin: "0 0 8px",
  color: "#0f172a",
  fontSize: "28px",
};

const subtitle = {
  margin: "0 0 20px",
  color: "#64748b",
  lineHeight: 1.5,
};

const card = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  padding: "20px",
  marginBottom: "16px",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.04)",
};

const cardTitle = {
  margin: "0 0 8px",
  color: "#0f172a",
  fontSize: "20px",
};

const cardText = {
  margin: "0 0 16px",
  color: "#475569",
  lineHeight: 1.5,
};

const button = {
  border: "none",
  color: "#ffffff",
  padding: "12px 16px",
  borderRadius: "12px",
  fontWeight: "700",
  width: "100%",
  fontSize: "15px",
};
