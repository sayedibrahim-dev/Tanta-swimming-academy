"use client";

import { useState } from "react";
import {
  User,
  Phone,
  Mail,
  Users,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ParentItem } from "./page";

interface ParentsClientProps {
  initialParents: ParentItem[];
}

export default function ParentsClient({ initialParents }: ParentsClientProps) {
  // قائمة أولياء الأمور — بتتحدث بعد الحذف بدون reload
  const [parents, setParents] = useState(initialParents);

  // modal تأكيد الحذف — null = مغلق
  const [deleteModal, setDeleteModal] = useState<{
    parentId:     string; // معرف ولي الأمر
    name:         string; // اسمه للعرض
    swimmerCount: number; // عدد أبنائه (تحذير)
  } | null>(null);

  // حالة التحميل أثناء الحذف
  const [deleting, setDeleting] = useState(false);

  // رسالة الخطأ في modal الحذف
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ==========================================
  // دالة فتح modal تأكيد الحذف
  // ==========================================
  const openDeleteModal = (parent: ParentItem) => {
    setDeleteError(null);
    setDeleteModal({
      parentId:     parent.id,
      name:         parent.name,
      swimmerCount: parent.swimmers?.length ?? 0,
    });
  };

  // ==========================================
  // دالة تأكيد الحذف
  // ==========================================
  const handleDelete = async () => {
    if (!deleteModal) return;

    setDeleting(true);
    setDeleteError(null);

    const res = await fetch(`/api/admin/parents/${deleteModal.parentId}`, {
      method: "DELETE",
    });

    setDeleting(false);

    if (!res.ok) {
      const data = await res.json();
      setDeleteError(data.error ?? "حدث خطأ أثناء الحذف");
      return;
    }

    // إزالة ولي الأمر من القائمة بدون reload
    setParents((prev) => prev.filter((p) => p.id !== deleteModal.parentId));
    setDeleteModal(null);
  };

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
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {/* أيقونة ولي الأمر */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--cyan-muted)" }}
                  >
                    <User className="w-5 h-5" style={{ color: "var(--cyan)" }} />
                  </div>

                  {/* الاسم وعدد السباحين */}
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

                {/* زرار الحذف */}
                <button
                  onClick={() => openDeleteModal(parent)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors flex-shrink-0"
                  title="حذف ولي الأمر"
                >
                  <Trash2 className="w-4 h-4" style={{ color: "var(--destructive)" }} />
                </button>
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

      {/* ==========================================
          Modal تأكيد حذف ولي الأمر
          ========================================== */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 70%)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setDeleteModal(null); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {/* رأس الـ modal */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" style={{ color: "var(--destructive)" }} />
                <h2 className="text-lg font-semibold text-white">حذف ولي الأمر</h2>
              </div>
              <button
                onClick={() => { if (!deleting) setDeleteModal(null); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>

            {/* نص التأكيد */}
            <p className="text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>
              هل تريد حذف ولي الأمر <span className="text-white font-semibold">"{deleteModal.name}"</span>؟
            </p>

            {/* تحذير لو عنده سباحون */}
            {deleteModal.swimmerCount > 0 && (
              <div
                className="rounded-lg p-3 mb-4 text-sm"
                style={{
                  background: "oklch(0.65 0.22 25 / 10%)",
                  color:      "oklch(0.72 0.22 25)",
                  border:     "1px solid oklch(0.65 0.22 25 / 30%)",
                }}
              >
                ⚠️ هذا الحذف نهائي — سيتم حذف ولي الأمر و
                <span className="font-semibold"> {deleteModal.swimmerCount} سباح </span>
                مرتبط{deleteModal.swimmerCount === 1 ? "" : "ون"} به بالكامل
              </div>
            )}

            {/* رسالة الخطأ */}
            {deleteError && (
              <p
                className="text-sm rounded-lg p-3 mb-4"
                style={{
                  background: "oklch(0.65 0.22 25 / 15%)",
                  color:      "oklch(0.65 0.22 25)",
                  border:     "1px solid oklch(0.65 0.22 25 / 30%)",
                }}
              >
                {deleteError}
              </p>
            )}

            {/* أزرار التأكيد والإلغاء */}
            <div className="flex gap-3">
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 font-semibold h-10"
                style={{ background: "var(--destructive)", color: "white" }}
              >
                {deleting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : "تأكيد الحذف"
                }
              </Button>
              <Button
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
                variant="ghost"
                className="flex-1 h-10"
                style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
