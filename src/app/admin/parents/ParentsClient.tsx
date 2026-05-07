"use client";

import {
  User,
  Phone,
  Mail,
  Users,
} from "lucide-react";
import type { ParentItem } from "./page";

interface ParentsClientProps {
  initialParents: ParentItem[];
}

export default function ParentsClient({ initialParents }: ParentsClientProps) {
  const parents = initialParents;

  if (parents.length === 0) {
    return (
      <div
        className="rounded-2xl p-16 flex flex-col items-center gap-4 text-center"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--cyan-muted)" }}
        >
          <User className="w-8 h-8" style={{ color: "var(--cyan)" }} />
        </div>
        <div>
          <p className="text-lg font-semibold text-white">لا يوجد أولياء أمور بعد</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            سيظهرون هنا بعد تسجيلهم في البرنامج
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
        إجمالي أولياء الأمور: <span className="text-white font-semibold">{parents.length}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {parents.map((parent) => {
          const swimmerCount = parent.swimmers?.length ?? 0;

          return (
            <div
              key={parent.id}
              className="rounded-2xl p-5 border flex flex-col gap-4"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              {/* رأس البطاقة */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--cyan-muted)" }}
                >
                  <User className="w-5 h-5" style={{ color: "var(--cyan)" }} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{parent.name}</p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "var(--cyan-muted)", color: "var(--cyan)" }}
                  >
                    {swimmerCount} {swimmerCount === 1 ? "سباح" : "سباحون"}
                  </span>
                </div>
              </div>

              {/* التفاصيل */}
              <div className="space-y-2">
                {parent.user?.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                    <span className="truncate font-mono text-xs" style={{ color: "var(--muted-foreground)", direction: "ltr" }}>
                      {parent.user.email}
                    </span>
                  </div>
                )}
                {parent.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                    <span className="font-mono text-xs" style={{ color: "var(--muted-foreground)", direction: "ltr" }}>
                      {parent.phone}
                    </span>
                  </div>
                )}
                {swimmerCount > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <Users className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "var(--muted-foreground)" }} />
                    <span style={{ color: "var(--muted-foreground)" }} className="text-xs">
                      {parent.swimmers.map((s) => s.name).join("، ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
