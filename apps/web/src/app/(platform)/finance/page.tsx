import { auth } from "@/lib/auth";
import { prisma } from "@ftz-erp/db";
import { formatCurrency } from "@/lib/utils";
import type { Metadata } from "next";
import { DollarSign, TrendingUp, TrendingDown, CreditCard } from "lucide-react";

export const metadata: Metadata = { title: "Tài chính & Kế toán" };

export default async function FinancePage() {
  const session = await auth();
  const tenantId = (session as any)?.tenantId as string;

  const [payables, receivables, budgets, accountCount] = await Promise.all([
    prisma.finInvoicePayable.aggregate({
      where: { tenantId, status: { in: ["PENDING", "APPROVED"] } },
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
    prisma.finInvoiceReceivable.aggregate({
      where: { tenantId, status: { in: ["SENT", "PARTIAL"] } },
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
    prisma.finProjectBudget.count({ where: { tenantId } }),
    prisma.finAccount.count({ where: { tenantId, isActive: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tài chính & Kế toán</h1>
        <p className="text-slate-500 text-sm">
          Chuẩn Thông tư 200/2014/TT-BTC · Kế toán doanh nghiệp Việt Nam
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <TrendingDown className="w-4 h-4" />
            <p className="text-sm font-medium">Phải trả</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {formatCurrency(Number(payables._sum.totalAmount ?? 0))}
          </p>
          <p className="text-xs text-slate-400 mt-1">{payables._count._all} hóa đơn chờ</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <TrendingUp className="w-4 h-4" />
            <p className="text-sm font-medium">Phải thu</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {formatCurrency(Number(receivables._sum.totalAmount ?? 0))}
          </p>
          <p className="text-xs text-slate-400 mt-1">{receivables._count._all} hóa đơn</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <CreditCard className="w-4 h-4" />
            <p className="text-sm font-medium">Ngân sách</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{budgets}</p>
          <p className="text-xs text-slate-400 mt-1">ngân sách dự án</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <DollarSign className="w-4 h-4" />
            <p className="text-sm font-medium">Tài khoản kế toán</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{accountCount}</p>
          <p className="text-xs text-slate-400 mt-1">tài khoản đang dùng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Module Tài chính</h2>
          <div className="space-y-2">
            {[
              { label: "Ngân sách dự án (WBS/BOQ)", href: "/finance/budget" },
              { label: "Phải trả (AP) - Thanh toán nhà thầu", href: "/finance/payables" },
              { label: "Phải thu (AR) - Thu tiền KH", href: "/finance/receivables" },
              { label: "Sổ cái & Bút toán", href: "/finance/ledger" },
              { label: "Báo cáo tài chính", href: "/finance/reports" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-700"
              >
                <DollarSign className="w-4 h-4 text-slate-400" />
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-700 mb-3">Quy trình Phê duyệt</h2>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-slate-300 text-white flex items-center justify-center text-xs font-bold">1</div>
              <span>Đề nghị thanh toán từ nghiệm thu công trình</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-400 text-white flex items-center justify-center text-xs font-bold">2</div>
              <span>Kiểm tra & phê duyệt Kế toán trưởng</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-bold">3</div>
              <span>Ban lãnh đạo phê duyệt (nếu vượt ngưỡng)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">4</div>
              <span>Tự động sinh phiếu chi & bút toán GL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
