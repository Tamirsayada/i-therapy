"use client";

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

export default function EmotionsPage() {
  const router = useRouter();
  const createSession = useSessionStore((s) => s.createSession);

  const handleStyleSelect = (style: CommunicationStyle) => {
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
    </PageContainer>
  );
}
