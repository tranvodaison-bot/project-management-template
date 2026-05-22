import { auth } from "@/lib/auth";
import { prisma } from "@ftz-erp/db";
import { formatDateTime } from "@/lib/utils";
import type { Metadata } from "next";
import { FolderOpen, Plus, FileText, ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "CDE / Tài liệu" };

const LIFECYCLE_COLORS: Record<string, string> = {
  WIP: "bg-slate-100 text-slate-600",
  SHARED: "bg-blue-100 text-blue-700",
  PUBLISHED: "bg-green-100 text-green-700",
  ARCHIVED: "bg-slate-100 text-slate-400",
};

const LIFECYCLE_LABELS: Record<string, string> = {
  WIP: "WIP",
  SHARED: "Shared",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export default async function DocumentsPage() {
  const session = await auth();
  const tenantId = (session as any)?.tenantId as string;

  const [documents, containers, stats] = await Promise.all([
    prisma.document.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        container: { select: { name: true } },
        _count: { select: { revisions: true } },
      },
    }),
    prisma.cdeContainer.findMany({
      where: { tenantId, parentId: null },
      include: { _count: { select: { children: true, documents: true } } },
    }),
    prisma.document.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { _all: true },
    }),
  ]);

  const statMap = stats.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = s._count._all;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">CDE — Tài liệu</h1>
          <p className="text-slate-500 text-sm">
            Common Data Environment · ISO 19650 Lifecycle
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          Upload tài liệu
        </button>
      </div>

      {/* Lifecycle Stats */}
      <div className="grid grid-cols-4 gap-3">
        {(["WIP", "SHARED", "PUBLISHED", "ARCHIVED"] as const).map((status) => (
          <div key={status} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${LIFECYCLE_COLORS[status]}`}>
              {LIFECYCLE_LABELS[status]}
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-2">{statMap[status] ?? 0}</p>
            <p className="text-xs text-slate-400">tài liệu</p>
          </div>
        ))}
      </div>

      {/* ISO 19650 lifecycle diagram */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-indigo-700 mb-2">ISO 19650 Document Lifecycle</p>
        <div className="flex items-center gap-2 text-xs">
          {["WIP", "SHARED", "PUBLISHED", "ARCHIVED"].map((s, i, arr) => (
            <span key={s} className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-md font-medium ${LIFECYCLE_COLORS[s]}`}>{s}</span>
              {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-indigo-400" />}
            </span>
          ))}
        </div>
      </div>

      {/* CDE Container Browser */}
      {containers.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-700 text-sm mb-2">Container Hierarchy</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {containers.map((c) => (
              <div key={c.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:border-indigo-300 transition-colors cursor-pointer">
                <div className="flex items-start gap-2">
                  <FolderOpen className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{c.code}</p>
                    <div className="flex gap-3 mt-1 text-xs text-slate-500">
                      <span>{c._count.children} sub-containers</span>
                      <span>{c._count.documents} docs</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <div className="grid grid-cols-12 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span className="col-span-5">Tiêu đề / Tên tài liệu</span>
            <span className="col-span-3">Container</span>
            <span className="col-span-2">Trạng thái</span>
            <span className="col-span-2">Cập nhật</span>
          </div>
        </div>
        {documents.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Chưa có tài liệu nào trong CDE</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="px-5 py-3 grid grid-cols-12 items-center hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="col-span-5 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-800 truncate">{doc.title}</p>
                    {doc.number && (
                      <p className="text-xs font-mono text-slate-400">{doc.number}</p>
                    )}
                  </div>
                </div>
                <span className="col-span-3 text-sm text-slate-500 truncate">
                  {doc.container?.name ?? "—"}
                </span>
                <div className="col-span-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LIFECYCLE_COLORS[doc.status]}`}>
                    {LIFECYCLE_LABELS[doc.status]}
                  </span>
                </div>
                <span className="col-span-2 text-xs text-slate-400">
                  {formatDateTime(doc.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
