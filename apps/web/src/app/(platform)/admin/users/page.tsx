import { auth } from "@/lib/auth";
import { prisma } from "@ftz-erp/db";
import { formatDateTime } from "@/lib/utils";
import type { Metadata } from "next";
import { Users, Plus, ShieldCheck, UserCircle } from "lucide-react";

export const metadata: Metadata = { title: "Quản lý người dùng" };

export default async function UsersAdminPage() {
  const session = await auth();
  const tenantId = (session as any)?.tenantId as string;

  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId },
      include: {
        userRoles: {
          include: { role: { select: { name: true, color: true, slug: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.role.findMany({
      where: { tenantId },
      include: { _count: { select: { userRoles: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Người dùng & Phân quyền</h1>
          <p className="text-slate-500 text-sm">{users.length} người dùng · {roles.length} vai trò</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          Mời người dùng
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-800">Danh sách người dùng</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {users.map((user) => (
              <div key={user.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <UserCircle className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{user.displayName}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {user.userRoles.map((ur) => (
                    <span
                      key={ur.roleId}
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: ur.role.color ? `${ur.role.color}20` : "#f1f5f9",
                        color: ur.role.color ?? "#64748b",
                      }}
                    >
                      {ur.role.name}
                    </span>
                  ))}
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    user.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Roles */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-800">Vai trò (RBAC)</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {roles.map((role) => (
              <div key={role.id} className="px-5 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-sm font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: role.color ? `${role.color}20` : "#f1f5f9",
                      color: role.color ?? "#64748b",
                    }}
                  >
                    {role.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {role._count.userRoles} người
                  </span>
                </div>
                {role.description && (
                  <p className="text-xs text-slate-500">{role.description}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  {role.permissions.length} quyền
                  {role.isSystem && " · System"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
