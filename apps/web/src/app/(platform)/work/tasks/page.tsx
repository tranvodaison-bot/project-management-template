import { auth } from "@/lib/auth";
import { prisma } from "@ftz-erp/db";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import { CheckSquare, Plus, Clock, AlertCircle } from "lucide-react";

export const metadata: Metadata = { title: "Nhiệm vụ" };

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  TODO: { label: "Cần làm", color: "bg-slate-100 text-slate-600" },
  IN_PROGRESS: { label: "Đang làm", color: "bg-blue-100 text-blue-700" },
  IN_REVIEW: { label: "Đang review", color: "bg-amber-100 text-amber-700" },
  DONE: { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Hủy", color: "bg-red-100 text-red-500" },
};

const PRIORITY_CFG: Record<string, { label: string; color: string }> = {
  LOW: { label: "Thấp", color: "bg-slate-100 text-slate-500" },
  NORMAL: { label: "Bình thường", color: "bg-blue-50 text-blue-600" },
  HIGH: { label: "Cao", color: "bg-orange-100 text-orange-700" },
  URGENT: { label: "Khẩn cấp", color: "bg-red-100 text-red-700" },
};

export default async function TasksPage() {
  const session = await auth();
  const tenantId = (session as any)?.tenantId as string;

  const tasks = await prisma.task.findMany({
    where: { tenantId },
    orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
    include: {
      _count: { select: { children: true, comments: true } },
    },
  });

  const grouped = {
    TODO: tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
    IN_REVIEW: tasks.filter((t) => t.status === "IN_REVIEW"),
    DONE: tasks.filter((t) => t.status === "DONE"),
  };

  const overdueCount = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE",
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nhiệm vụ</h1>
          <p className="text-slate-500 text-sm">{tasks.length} công việc tổng cộng</p>
        </div>
        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600 font-medium">{overdueCount} quá hạn</span>
            </div>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" />
            Tạo task
          </button>
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(grouped).map(([status, items]) => {
          const cfg = STATUS_CFG[status];
          return (
            <div key={status} className="bg-white rounded-xl border border-slate-200 p-4">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                {cfg.label}
              </span>
              <p className="text-2xl font-bold text-slate-800 mt-2">{items.length}</p>
            </div>
          );
        })}
      </div>

      {/* Tasks list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <div className="grid grid-cols-12 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span className="col-span-5">Tiêu đề</span>
            <span className="col-span-2">Trạng thái</span>
            <span className="col-span-2">Ưu tiên</span>
            <span className="col-span-2">Hạn hoàn thành</span>
            <span className="col-span-1">Sub</span>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="p-12 text-center">
            <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Chưa có nhiệm vụ nào</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {tasks.map((task) => {
              const statusCfg = STATUS_CFG[task.status] ?? STATUS_CFG.TODO;
              const priorityCfg = PRIORITY_CFG[task.priority] ?? PRIORITY_CFG.NORMAL;
              const isOverdue =
                task.dueDate &&
                new Date(task.dueDate) < new Date() &&
                task.status !== "DONE";

              return (
                <div
                  key={task.id}
                  className="px-5 py-3 grid grid-cols-12 items-center hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="col-span-5 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {task.title}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityCfg.color}`}>
                      {priorityCfg.label}
                    </span>
                  </div>
                  <div className="col-span-2">
                    {task.dueDate ? (
                      <span className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-600 font-medium" : "text-slate-500"}`}>
                        <Clock className="w-3 h-3" />
                        {formatDate(task.dueDate)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>
                  <div className="col-span-1 text-xs text-slate-400">
                    {task._count.children > 0 && (
                      <span>{task._count.children}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
