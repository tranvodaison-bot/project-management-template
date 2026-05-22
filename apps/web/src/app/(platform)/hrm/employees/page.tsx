import { auth } from "@/lib/auth";
import { prisma } from "@ftz-erp/db";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import { Users, Plus, UserCheck, UserX } from "lucide-react";

export const metadata: Metadata = { title: "Nhân viên" };

export default async function EmployeesPage() {
  const session = await auth();
  const tenantId = (session as any)?.tenantId as string;

  const employees = await prisma.hrmEmployee.findMany({
    where: { tenantId },
    include: {
      department: { select: { name: true } },
      position: { select: { name: true, level: true } },
    },
    orderBy: { employeeNumber: "asc" },
  });

  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.employmentStatus === "active").length,
    onLeave: employees.filter((e) => e.employmentStatus === "on-leave").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Nhân viên</h1>
          <p className="text-slate-500 text-sm">{stats.total} nhân viên</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          Thêm nhân viên
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
          <p className="text-sm text-slate-500 mt-0.5">Tổng nhân viên</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          <p className="text-sm text-slate-500 mt-0.5">Đang làm việc</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-3xl font-bold text-amber-500">{stats.onLeave}</p>
          <p className="text-sm text-slate-500 mt-0.5">Đang nghỉ phép</p>
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <div className="grid grid-cols-6 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>Mã NV</span>
            <span className="col-span-2">Họ tên</span>
            <span>Phòng ban</span>
            <span>Chức vụ</span>
            <span>Trạng thái</span>
          </div>
        </div>
        {employees.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Chưa có nhân viên nào</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="px-5 py-3 grid grid-cols-6 items-center hover:bg-slate-50 transition-colors"
              >
                <span className="font-mono text-sm text-slate-500">{emp.employeeNumber}</span>
                <div className="col-span-2">
                  <p className="font-medium text-slate-800 text-sm">{emp.fullName}</p>
                  {emp.hireDate && (
                    <p className="text-xs text-slate-400">
                      Ngày vào: {formatDate(emp.hireDate)}
                    </p>
                  )}
                </div>
                <span className="text-sm text-slate-600">{emp.department?.name ?? "—"}</span>
                <div>
                  <p className="text-sm text-slate-700">{emp.position?.name ?? "—"}</p>
                  {emp.position?.level && (
                    <p className="text-xs text-slate-400">{emp.position.level}</p>
                  )}
                </div>
                <div>
                  {emp.employmentStatus === "active" ? (
                    <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full w-fit">
                      <UserCheck className="w-3 h-3" /> Đang làm
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full w-fit">
                      <UserX className="w-3 h-3" /> {emp.employmentStatus}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
