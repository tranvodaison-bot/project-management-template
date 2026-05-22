"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CheckSquare,
  Kanban,
  FileText,
  Users,
  FolderOpen,
  Building2,
  DollarSign,
  Package,
  Briefcase,
  Scale,
  Settings,
  ChevronDown,
  ChevronRight,
  Cpu,
  BarChart3,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { label: string; href: string }[];
  badge?: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Công việc & Kế hoạch",
    icon: CheckSquare,
    children: [
      { label: "Nhiệm vụ của tôi", href: "/work/tasks" },
      { label: "Kanban Board", href: "/work/kanban" },
      { label: "Kế hoạch", href: "/work/plans" },
    ],
  },
  {
    label: "CDE / Tài liệu",
    icon: FolderOpen,
    children: [
      { label: "Kho tài liệu", href: "/documents" },
      { label: "Phê duyệt tài liệu", href: "/documents/approvals" },
      { label: "Công văn", href: "/documents/correspondence" },
    ],
  },
  {
    label: "Quản lý Dự án",
    icon: Building2,
    children: [
      { label: "Danh sách dự án", href: "/projects" },
      { label: "WBS & Tiến độ", href: "/projects/wbs" },
      { label: "Hợp đồng", href: "/projects/contracts" },
      { label: "QC/QA", href: "/projects/quality" },
      { label: "HSE", href: "/projects/hse" },
      { label: "Đấu thầu", href: "/projects/procurement" },
      { label: "Rủi ro", href: "/projects/risks" },
    ],
  },
  {
    label: "Nhân sự (HRM)",
    icon: Users,
    children: [
      { label: "Nhân viên", href: "/hrm/employees" },
      { label: "Tuyển dụng", href: "/hrm/recruitment" },
      { label: "Bảng lương", href: "/hrm/payroll" },
      { label: "Đào tạo", href: "/hrm/training" },
      { label: "Đánh giá KPI", href: "/hrm/performance" },
    ],
  },
  {
    label: "Tài chính & Kế toán",
    icon: DollarSign,
    children: [
      { label: "Ngân sách", href: "/finance/budget" },
      { label: "Phải trả", href: "/finance/payables" },
      { label: "Phải thu", href: "/finance/receivables" },
      { label: "Sổ cái", href: "/finance/ledger" },
    ],
  },
  {
    label: "Tài sản",
    icon: Package,
    children: [
      { label: "Danh mục tài sản", href: "/assets" },
      { label: "Bảo trì", href: "/assets/maintenance" },
      { label: "IoT Dashboard", href: "/assets/iot" },
    ],
  },
  {
    label: "Kinh doanh & M&A",
    icon: Briefcase,
    children: [
      { label: "CRM Pipeline", href: "/business/pipeline" },
      { label: "Khách hàng/ĐT", href: "/business/contacts" },
      { label: "M&A", href: "/business/mna" },
    ],
  },
  {
    label: "Vận hành KCN",
    icon: BarChart3,
    children: [
      { label: "Doanh nghiệp thuê", href: "/operations/tenants" },
      { label: "Work Orders", href: "/operations/workorders" },
    ],
  },
  {
    label: "Pháp lý & Tuân thủ",
    icon: Scale,
    children: [
      { label: "Hồ sơ pháp lý", href: "/legal/files" },
      { label: "Cơ sở pháp luật", href: "/legal/regulations" },
      { label: "Tuân thủ", href: "/legal/compliance" },
    ],
  },
  {
    label: "AI Studio",
    icon: Cpu,
    href: "/ai",
  },
  {
    label: "Quản trị hệ thống",
    icon: Settings,
    children: [
      { label: "Người dùng & Quyền", href: "/admin/users" },
      { label: "Vai trò", href: "/admin/roles" },
      { label: "Workflow Designer", href: "/admin/workflows" },
      { label: "Danh mục", href: "/admin/catalogs" },
      { label: "Audit Log", href: "/admin/audit" },
    ],
  },
];

function NavGroup({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive =
    item.href === pathname ||
    item.children?.some((c) => pathname.startsWith(c.href));
  const [open, setOpen] = useState(isActive ?? false);

  if (item.href) {
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          pathname === item.href
            ? "bg-indigo-600 text-white"
            : "text-slate-300 hover:bg-slate-700 hover:text-white",
        )}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" />
        <span>{item.label}</span>
        {item.badge && (
          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
            {item.badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          isActive
            ? "text-indigo-300"
            : "text-slate-300 hover:bg-slate-700 hover:text-white",
        )}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
      </button>
      {open && (
        <div className="ml-7 mt-0.5 space-y-0.5">
          {item.children?.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className={cn(
                "block px-3 py-1.5 rounded-md text-xs transition-colors",
                pathname === child.href
                  ? "bg-indigo-600/40 text-indigo-200 font-medium"
                  : "text-slate-400 hover:text-white hover:bg-slate-700",
              )}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-700 flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">FTZ-ERP</p>
          <p className="text-slate-400 text-xs">Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-thin">
        {navItems.map((item) => (
          <NavGroup key={item.label} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-slate-700">
        <p className="text-slate-500 text-xs text-center">v0.1.0 — FTZ-ERP</p>
      </div>
    </aside>
  );
}
