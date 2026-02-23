"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { PageContainer } from "@/components/layout/PageContainer";
import { useSessionStore } from "@/stores/useSessionStore";
import type { CommunicationStyle } from "@/types/session";

const styles: {
  id: CommunicationStyle;
  name: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "sensitive",
    name: "רגיש",
    description: "עדין, אמפתי ומכיל. שפה רכה ותומכת",
    icon: "💜",
  },
  {
    id: "practical",
    name: "פרקטי",
    description: "ישיר, לוגי וממוקד פתרונות. שפה ברורה ותכליתית",
    icon: "🎯",
  },
  {
    id: "spiritual",
    name: "רוחני",
    description: "מחובר למשמעות עמוקה, מטאפורות וחוכמה פנימית",
    icon: "✨",
  },
  {
    id: "provocative",
    name: "פרובוקטיבי",
    description: "מאתגר, נועז ולא שגרתי. שובר תבניות בהומור",
    icon: "🔥",
  },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export default function EmotionsPage() {
  const router = useRouter();
  const createSession = useSessionStore((s) => s.createSession);
  const isMobile = useIsMobile();
  const [showMobileModal, setShowMobileModal] = useState(false);

  const handleStyleSelect = (style: CommunicationStyle) => {
    if (isMobile) {
      setShowMobileModal(true);
      return;
    }
    const sessionId = createSession("emotions", style);
    router.push(`/emotions/${sessionId}`);
  };

  return (
    <PageContainer narrow>
      <div className="text-center pt-8 pb-10">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-3">
          באיזה סגנון תרצה לעבוד?
        </h1>
        <p className="text-text-secondary">
          בחר את סגנון התקשורת שהכי מתאים לך
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 pb-16 md:pb-0">
        {styles.map((style) => (
          <Card
            key={style.id}
            hoverable
            className="text-center"
            onClick={() => handleStyleSelect(style.id)}
          >
            <div className="text-3xl mb-3">{style.icon}</div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">
              {style.name}
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              {style.description}
            </p>
          </Card>
        ))}
      </div>

      {showMobileModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
            <div className="text-4xl mb-4">🖥️</div>
            <h3 className="text-xl font-bold text-text-primary mb-3">
              זמין רק במחשב
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              תהליך שחרור הרגשות והתחושות כולל שיחה קולית ועיבוד בילטרלי שדורשים מסך גדול.
              <br />
              <span className="font-medium">היכנס מהמחשב כדי להתחיל את התהליך.</span>
            </p>
            <button
              onClick={() => setShowMobileModal(false)}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
            >
              הבנתי
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
