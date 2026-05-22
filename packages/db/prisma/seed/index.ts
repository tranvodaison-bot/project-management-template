import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding FTZ-ERP database...");

  // ── Tenant ─────────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: "ftz-demo" },
    update: {},
    create: {
      slug: "ftz-demo",
      name: "FTZ Industrial Zone Demo",
      type: "ftz",
      settings: {
        timezone: "Asia/Ho_Chi_Minh",
        currency: "VND",
        language: "vi",
        fiscalYearStart: "01-01",
      },
    },
  });
  console.log(`  ✅ Tenant: ${tenant.name}`);

  // ── Admin Role ─────────────────────────────────────────────────────────────
  const adminRole = await prisma.role.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "admin" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "System Administrator",
      slug: "admin",
      description: "Full system access",
      isSystem: true,
      permissions: [
        "documents:*",
        "hrm:*",
        "finance:*",
        "projects:*",
        "assets:*",
        "business:*",
        "operations:*",
        "legal:*",
        "admin:*",
        "work:*",
      ],
      color: "#6366f1",
    },
  });

  const pmRole = await prisma.role.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "project-manager" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Project Manager",
      slug: "project-manager",
      description: "Manages projects, WBS, contracts, QC, HSE",
      isSystem: true,
      permissions: [
        "documents:read",
        "documents:write",
        "documents:approve",
        "projects:*",
        "work:*",
        "hrm:read",
        "finance:read",
        "assets:read",
      ],
      color: "#0ea5e9",
    },
  });

  const hrRole = await prisma.role.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "hr-manager" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "HR Manager",
      slug: "hr-manager",
      description: "Manages employees, payroll, recruitment",
      isSystem: true,
      permissions: ["hrm:*", "documents:read", "work:read", "finance:read"],
      color: "#10b981",
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "viewer" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Viewer",
      slug: "viewer",
      description: "Read-only access",
      isSystem: true,
      permissions: [
        "documents:read",
        "projects:read",
        "hrm:read",
        "work:read",
        "assets:read",
      ],
      color: "#94a3b8",
    },
  });

  console.log(`  ✅ Roles: admin, project-manager, hr-manager, viewer`);

  // ── Admin User ─────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@ftz-erp.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@ftz-erp.com",
      displayName: "System Admin",
      userType: "internal",
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
      tenantId: tenant.id,
    },
  });

  // Sample PM user
  const pmUser = await prisma.user.upsert({
    where: { email: "pm@ftz-erp.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "pm@ftz-erp.com",
      displayName: "Nguyen Van A",
      userType: "internal",
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: pmUser.id, roleId: pmRole.id } },
    update: {},
    create: {
      userId: pmUser.id,
      roleId: pmRole.id,
      tenantId: tenant.id,
    },
  });

  console.log(`  ✅ Users: admin@ftz-erp.com, pm@ftz-erp.com`);

  // ── CDE Root Containers ────────────────────────────────────────────────────
  const rootContainer = await prisma.cdeContainer.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      tenantId: tenant.id,
      code: "FTZ-ROOT",
      name: "FTZ Industrial Zone",
      containerType: "zone",
      classificationTable: "EF",
      classificationCode: "EF_50",
      pathLtree: "root",
      createdById: adminUser.id,
    },
  });

  const projectContainer = await prisma.cdeContainer.create({
    data: {
      tenantId: tenant.id,
      parentId: rootContainer.id,
      code: "PRJ-2025-001",
      name: "Infrastructure Phase 1 - Road & Utilities",
      containerType: "project",
      classificationCode: "Ac_05",
      pathLtree: `root.prj2025001`,
      createdById: adminUser.id,
    },
  });

  console.log(`  ✅ CDE containers initialized`);

  // ── Sample Project ─────────────────────────────────────────────────────────
  const project = await prisma.project.upsert({
    where: { code: "PRJ-2025-001" },
    update: {},
    create: {
      tenantId: tenant.id,
      cdeContainerId: projectContainer.id,
      code: "PRJ-2025-001",
      name: "Infrastructure Phase 1 - Road & Utilities",
      projectType: "infrastructure",
      plannedStart: new Date("2025-01-01"),
      plannedEnd: new Date("2026-06-30"),
      totalBudget: 50000000000, // 50 billion VND
      currency: "VND",
      status: "ACTIVE",
      phase: "Construction",
      projectManagerId: pmUser.id,
    },
  });

  // ── WBS Nodes ──────────────────────────────────────────────────────────────
  const wbs1 = await prisma.wbsNode.create({
    data: {
      tenantId: tenant.id,
      projectId: project.id,
      code: "1.0",
      name: "Site Preparation",
      level: 1,
      wbsType: "phase",
      plannedStart: new Date("2025-01-01"),
      plannedEnd: new Date("2025-03-31"),
      plannedCost: 5000000000,
      progressPct: 80,
      bac: 5000000000,
      pathLtree: "1",
    },
  });

  await prisma.wbsNode.createMany({
    data: [
      {
        tenantId: tenant.id,
        projectId: project.id,
        parentId: wbs1.id,
        code: "1.1",
        name: "Land Clearing",
        level: 2,
        wbsType: "work_package",
        plannedStart: new Date("2025-01-01"),
        plannedEnd: new Date("2025-02-15"),
        plannedCost: 2000000000,
        progressPct: 100,
        pathLtree: "1.11",
      },
      {
        tenantId: tenant.id,
        projectId: project.id,
        parentId: wbs1.id,
        code: "1.2",
        name: "Soil Testing & Survey",
        level: 2,
        wbsType: "work_package",
        plannedStart: new Date("2025-02-01"),
        plannedEnd: new Date("2025-03-31"),
        plannedCost: 3000000000,
        progressPct: 60,
        pathLtree: "1.12",
      },
    ],
    skipDuplicates: true,
  });

  console.log(`  ✅ Sample project with WBS nodes`);

  // ── HRM Department & Employees ─────────────────────────────────────────────
  const dept = await prisma.hrmDepartment.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "PMO" } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: "PMO",
      name: "Project Management Office",
      costCenter: "CC-PMO",
    },
  });

  const position = await prisma.hrmPosition.create({
    data: {
      tenantId: tenant.id,
      departmentId: dept.id,
      name: "Senior Project Manager",
      level: "Manager",
      jobGrade: "M3",
      minSalary: 30000000,
      maxSalary: 60000000,
    },
  });

  await prisma.hrmEmployee.upsert({
    where: { employeeNumber: "EMP-001" },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: pmUser.id,
      employeeNumber: "EMP-001",
      fullName: "Nguyen Van A",
      departmentId: dept.id,
      positionId: position.id,
      hireDate: new Date("2023-01-01"),
      contractType: "full-time",
      baseSalary: 45000000,
      employmentStatus: "active",
    },
  });

  console.log(`  ✅ HR: departments, positions, employees`);

  // ── Finance: Chart of Accounts (Vietnamese Standard) ──────────────────────
  const accounts = [
    { code: "111", name: "Tiền mặt", accountType: "asset" },
    { code: "112", name: "Tiền gửi ngân hàng", accountType: "asset" },
    { code: "131", name: "Phải thu khách hàng", accountType: "asset" },
    { code: "211", name: "Tài sản cố định hữu hình", accountType: "asset" },
    { code: "331", name: "Phải trả người bán", accountType: "liability" },
    { code: "411", name: "Vốn chủ sở hữu", accountType: "equity" },
    { code: "511", name: "Doanh thu bán hàng", accountType: "revenue" },
    { code: "632", name: "Giá vốn hàng bán", accountType: "expense" },
    { code: "642", name: "Chi phí quản lý doanh nghiệp", accountType: "expense" },
  ];

  for (const acc of accounts) {
    await prisma.finAccount.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: acc.code } },
      update: {},
      create: { tenantId: tenant.id, ...acc },
    });
  }

  console.log(`  ✅ Chart of accounts (Vietnamese standard)`);

  // ── Sample Tasks ───────────────────────────────────────────────────────────
  const board = await prisma.kanbanBoard.create({
    data: {
      tenantId: tenant.id,
      name: "PMO Sprint Board",
      ownerId: adminUser.id,
      scopeType: "team",
      columns: [
        { id: "todo", name: "Todo", color: "#94a3b8", position: 0 },
        { id: "in_progress", name: "In Progress", color: "#3b82f6", position: 1 },
        { id: "in_review", name: "In Review", color: "#f59e0b", position: 2 },
        { id: "done", name: "Done", color: "#10b981", position: 3 },
      ],
    },
  });

  await prisma.task.createMany({
    data: [
      {
        tenantId: tenant.id,
        boardId: board.id,
        title: "Review soil survey report",
        status: "IN_PROGRESS",
        priority: "HIGH",
        assigneeId: pmUser.id,
        reporterId: adminUser.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        moduleType: "project",
        moduleRefId: project.id,
        position: 1,
      },
      {
        tenantId: tenant.id,
        boardId: board.id,
        title: "Prepare contractor onboarding documents",
        status: "TODO",
        priority: "NORMAL",
        assigneeId: pmUser.id,
        reporterId: adminUser.id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        position: 2,
      },
      {
        tenantId: tenant.id,
        boardId: board.id,
        title: "Schedule monthly HSE inspection",
        status: "TODO",
        priority: "HIGH",
        reporterId: adminUser.id,
        position: 3,
      },
    ],
  });

  console.log(`  ✅ Kanban board with sample tasks`);

  console.log("\n✨ Seed complete!");
  console.log("\n   Login: admin@ftz-erp.com");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
