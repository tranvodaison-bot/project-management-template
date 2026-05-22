import { auth } from "@/lib/auth";
import { prisma } from "@ftz-erp/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import { Building2, Plus, Clock, CheckCircle, PauseCircle } from "lucide-react";

export const metadata: Metadata = { title: "Quản lý Dự án" };

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{className?: string}> }> = {
  PLANNING: { label: "Lập kế hoạch", color: "bg-slate-100 text-slate-600", icon: Clock },
  ACTIVE: { label: "Đang triển khai", color: "bg-blue-100 text-blue-700", icon: Clock },
  ON_HOLD: { label: "Tạm dừng", color: "bg-amber-100 text-amber-700", icon: PauseCircle },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-700", icon: CheckCircle },
  CANCELLED: { label: "Hủy bỏ", color: "bg-red-100 text-red-600", icon: PauseCircle },
};

export default async function ProjectsPage() {
  const session = await auth();
  const tenantId = (session as any)?.tenantId as string;

  const projects = await prisma.project.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { wbsNodes: true, contracts: true, risks: true } },
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Dự án</h1>
          <p className="text-slate-500 text-sm">{projects.length} dự án</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          Tạo dự án
        </button>
      </div>

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Chưa có dự án nào</p>
            <p className="text-slate-400 text-sm mt-1">Tạo dự án đầu tiên để bắt đầu</p>
          </div>
        ) : (
          projects.map((project) => {
            const statusCfg = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.PLANNING;
            return (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-400">{project.code}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                      {project.phase && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                          {project.phase}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-800 text-lg">{project.name}</h3>
                    {project.description && (
                      <p className="text-slate-500 text-sm mt-1 line-clamp-1">{project.description}</p>
                    )}
                  </div>
                  {project.totalBudget && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-400">Ngân sách</p>
                      <p className="font-bold text-slate-800">
                        {formatCurrency(Number(project.totalBudget), project.currency)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Tiến độ tổng thể</span>
                    <span className="font-medium">{Number(project.completionPct).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${Number(project.completionPct)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                  <span>{project._count.wbsNodes} WBS nodes</span>
                  <span>{project._count.contracts} hợp đồng</span>
                  <span>{project._count.risks} rủi ro</span>
                  {project.plannedStart && (
                    <span>Bắt đầu: {formatDate(project.plannedStart)}</span>
                  )}
                  {project.plannedEnd && (
                    <span>Kết thúc: {formatDate(project.plannedEnd)}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
