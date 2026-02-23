"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PageContainer } from "@/components/layout/PageContainer";

export default function Home() {
  return (
    <PageContainer>
      {/* Hero */}
      <div className="text-center pt-12 pb-16">
        <div className="inline-flex items-center gap-2 bg-primary-lightest text-primary text-sm font-medium px-4 py-2 rounded-full mb-6">
          זיהוי ושחרור אמונות מגבילות ורגשות
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight leading-tight mb-4">
          שחרר את מה
          <br />
          <span className="bg-gradient-to-l from-primary to-primary-light bg-clip-text text-transparent">
            שמעכב אותך
          </span>
        </h1>
        <p className="text-lg text-text-secondary max-w-md mx-auto">
          גלה את האמונות והרגשות שמגבילים אותך ושחרר אותם בעזרת כלים מבוססי NLP
        </p>
      </div>

      {/* Options */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Link href="/mapping">
          <Card hoverable className="h-full group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-lightest to-primary-lighter flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <svg
                className="w-7 h-7 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9 9 0 013 12c0-1.605.42-3.113 1.157-4.418"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              מיפוי מערכת אמונות
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              מפה את גלגל החיים שלך וגלה באילו תחומים יש אמונות שמגבילות אותך
            </p>
            <div className="mt-4 text-primary text-sm font-medium flex items-center gap-1">
              התחל מיפוי
              <svg
                className="w-4 h-4 rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Card>
        </Link>

        <Link href="/release">
          <Card hoverable className="h-full group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-lightest to-primary-lighter flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <svg
                className="w-7 h-7 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              זיהוי ושחרור אמונה מגבילה
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              זהה את האמונה שתוקעת אותך בתחום מסוים ושחרר אותה עם כלים מבוססי
              NLP
            </p>
            <div className="mt-4 text-primary text-sm font-medium flex items-center gap-1">
              התחל תהליך
              <svg
                className="w-4 h-4 rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Card>
        </Link>
        <Link href="/emotions">
          <Card hoverable className="h-full group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-lightest to-primary-lighter flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <svg
                className="w-7 h-7 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              שחרור רגשות ותחושות
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              שחרר רגשות ותחושות שליליות בשיחה קולית מודרכת עם כלים מבוססי EMDR
            </p>
            <div className="mt-4 text-primary text-sm font-medium flex items-center gap-1">
              התחל שחרור
              <svg
                className="w-4 h-4 rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Card>
        </Link>
      </div>
    </PageContainer>
  );
}
