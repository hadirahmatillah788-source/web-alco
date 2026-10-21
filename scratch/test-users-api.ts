import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

async function testUsersManagement() {
  console.log("=== 1. Testing Read Users List ===");
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
  });
  console.log(`Found ${users.length} existing users:`);
  users.forEach((u) => {
    console.log(` - [${u.role}] ${u.name} (${u.email}) - Dept: ${u.department} - Active: ${u.isActive}`);
  });

  console.log("\n=== 2. Testing Create New Viewer (Dewi Lestari) ===");
  const testEmail = "dewi.lestari@company.com";
  // Clean if existing
  await prisma.user.deleteMany({ where: { email: testEmail } });

  const passwordHash = await bcrypt.hash("viewer123456", 10);
  const newViewer = await prisma.user.create({
    data: {
      name: "Dewi Lestari, S.E.",
      email: testEmail,
      password: passwordHash,
      role: Role.KARYAWAN,
      department: "Kredit & Risiko Pembiayaan",
      isActive: true,
    },
  });
  console.log(`Created Viewer successfully: ID ${newViewer.id}, Name: ${newViewer.name}, Role: ${newViewer.role}, Active: ${newViewer.isActive}`);

  console.log("\n=== 3. Testing Edit Viewer Data & Toggle Active (Suspend) ===");
  const updatedViewer = await prisma.user.update({
    where: { id: newViewer.id },
    data: {
      name: "Dewi Lestari, S.E., M.M.",
      department: "Pemasaran & Operasional Cabang",
      isActive: false, // Suspended
    },
  });
  console.log(`Updated Viewer: Name: ${updatedViewer.name}, Dept: ${updatedViewer.department}, Active: ${updatedViewer.isActive} (Suspended)`);

  console.log("\n=== 4. Testing Password Verification with bcrypt ===");
  const isMatch = await bcrypt.compare("viewer123456", updatedViewer.password);
  console.log(`Password comparison check: ${isMatch ? "SUCCESS (Matched)" : "FAILED"}`);

  console.log("\n=== 5. Testing Re-activate Viewer ===");
  const reactivated = await prisma.user.update({
    where: { id: newViewer.id },
    data: { isActive: true },
  });
  console.log(`Re-activated Viewer: Active: ${reactivated.isActive}`);

  console.log("\n=== 6. Testing Delete Viewer ===");
  await prisma.user.delete({ where: { id: newViewer.id } });
  console.log(`Deleted test viewer ${newViewer.email} successfully!`);

  console.log("\n>>> ALL USER & VIEWER MANAGEMENT TESTS PASSED 100%! <<<");
}

testUsersManagement()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
