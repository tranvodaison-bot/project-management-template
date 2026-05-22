import { auth } from "@/lib/auth";
import { prisma } from "@ftz-erp/db";
import type { Metadata } from "next";
import { Package, Wrench, Activity } from "lucide-react";

export const metadata: Metadata = { title: "Quản lý Tài sản" };

export default async function AssetsPage() {
  const session = await auth();
  const tenantId = (session as any)?.tenantId as string;

  const [assetStats, maintenanceDue, iotDevices] = await Promise.all([
    prisma.asset.groupBy({ by: ["assetType"], where: { tenantId }, _count: { _all: true } }),
    prisma.asset.count({
      where: { tenantId, nextMaintenanceDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.iotDevice.count({ where: { tenantId, isActive: true } }),
  ]);

  const typeLabels: Record<string, string> = {
    infrastructure: "Hạ tầng kỹ thuật",
    equipment: "Máy móc thiết bị",
    vehicle: "Phương tiện",
    it: "Tài sản IT",
    real_estate: "Bất động sản",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Quản lý Tài sản</h1>
        <p className="text-slate-500 text-sm">
          Vòng đời tài sản · BIM/IFC Integration · IoT Monitoring
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <Package className="w-4 h-4" />
            <p className="text-sm font-medium">Tài sản</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {assetStats.reduce((sum, s) => sum + s._count._all, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <Wrench className="w-4 h-4" />
            <p className="text-sm font-medium">Sắp bảo trì (30 ngày)</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{maintenanceDue}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <Activity className="w-4 h-4" />
            <p className="text-sm font-medium">Thiết bị IoT</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{iotDevices}</p>
        </div>
      </div>

      {assetStats.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Phân loại tài sản</h2>
          <div className="space-y-3">
            {assetStats.map((s) => (
              <div key={s.assetType} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-40">
                  {typeLabels[s.assetType] ?? s.assetType}
                </span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: `${(s._count._all / assetStats.reduce((sum, x) => sum + x._count._all, 0)) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-700 w-8 text-right">
                  {s._count._all}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
