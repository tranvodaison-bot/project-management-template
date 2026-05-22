import { auth } from "@/lib/auth";
import { prisma } from "@ftz-erp/db";
import { formatCurrency } from "@/lib/utils";
import type { Metadata } from "next";
import {
  CheckSquare,
  FolderOpen,
  Building2,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardData(tenantId: string) {
  const [
    activeProjects,
    pendingTasks,
    openIncidents,
    activeEmployees,
    recentDocuments,
    recentTasks,
  ] = await Promise.all([
    prisma.project.count({ where: { tenantId, status: "ACTIVE" } }),
    prisma.task.count({
      where: { tenantId, status: { in: ["TODO", "IN_PROGRESS"] } },
    }),
    prisma.hseIncident.count({ where: { tenantId, status: "OPEN" } }),
    prisma.hrmEmployee.count({ where: { tenantId, employmentStatus: "active" } }),
    prisma.document.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, createdAt: true },
    }),
    prisma.task.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, title: true, status: true, priority: true, dueDate: true },
    }),
  ]);

  return { activeProjects, pendingTasks, openIncidents, activeEmployees, recentDocuments, recentTasks };
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  sub,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  TODO: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-amber-100 text-amber-700",
  DONE: "bg-green-100 text-green-700",
  WIP: "bg-slate-100 text-slate-600",
  SHARED: "bg-blue-100 text-blue-700",
  PUBLISHED: "bg-green-100 text-green-700",
  ARCHIVED: "bg-slate-100 text-slate-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-500",
  NORMAL: "bg-blue-50 text-blue-600",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export default async function DashboardPage() {
  const session = await auth();
  const tenantId = (session as any)?.tenantId as string;

  const data = await getDashboardData(tenantId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Xin chào, {session?.user?.name} — Tổng quan hệ thống FTZ-ERP
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Dự án đang triển khai"
          value={data.activeProjects}
          icon={Building2}
          color="bg-indigo-500"
          sub="dự án hoạt động"
        />
        <StatCard
          title="Công việc chờ xử lý"
          value={data.pendingTasks}
          icon={CheckSquare}
          color="bg-blue-500"
          sub="tasks đang mở"
        />
        <StatCard
          title="Nhân viên"
          value={data.activeEmployees}
          icon={Users}
          color="bg-emerald-500"
          sub="đang làm việc"
        />
        <StatCard
          title="Sự cố HSE mở"
          value={data.openIncidents}
          icon={AlertTriangle}
          color={data.openIncidents > 0 ? "bg-red-500" : "bg-slate-400"}
          sub="cần xử lý"
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Nhiệm vụ gần đây</h2>
            <a href="/work/tasks" className="text-xs text-indigo-500 hover:underline">
              Xem tất cả
            </a>
          </div>
          <div className="divide-y divide-slate-50">
            {data.recentTasks.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">
                Không có nhiệm vụ nào
              </div>
            ) : (
              data.recentTasks.map((task) => (
                <div key={task.id} className="px-5 py-3 flex items-center gap-3">
                  {task.status === "DONE" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate font-medium">
                      {task.title}
                    </p>
                    {task.dueDate && (
                      <p className="text-xs text-slate-400">
                        Hạn: {new Date(task.dueDate).toLocaleDateString("vi-VN")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        STATUS_COLORS[task.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {task.status}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        PRIORITY_COLORS[task.priority] ?? "bg-slate-100"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Tài liệu gần đây</h2>
            <a href="/documents" className="text-xs text-indigo-500 hover:underline">
              Xem tất cả
            </a>
          </div>
          <div className="divide-y divide-slate-50">
            {data.recentDocuments.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">
                Không có tài liệu nào
              </div>
            ) : (
              data.recentDocuments.map((doc) => (
                <div key={doc.id} className="px-5 py-3 flex items-center gap-3">
                  <FolderOpen className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate font-medium">
                      {doc.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(doc.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      STATUS_COLORS[doc.status] ?? "bg-slate-100"
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System info */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-indigo-800">
              FTZ-ERP Platform — Phase 1 MVP
            </p>
            <p className="text-xs text-indigo-600 mt-0.5">
              4 lớp kiến trúc · 13 phân hệ nghiệp vụ · CDE ISO 19650 · RBAC/ABAC ·
              Workflow Engine BPMN 2.0 · BIM/IFC Integration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
