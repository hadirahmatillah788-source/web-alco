import prisma from "../src/lib/prisma";

async function testCrud() {
  console.log("=== 1. Testing Prisma Relational Read ===");
  const jenis = await prisma.jenisBunga.findFirst({
    where: { kode: "KONVENSIONAL" },
    include: {
      kategori: {
        include: {
          produk: true,
        },
      },
    },
  });

  if (!jenis) throw new Error("Jenis KONVENSIONAL tidak ditemukan");
  console.log(`Jenis: ${jenis.nama}, Kategori count: ${jenis.kategori.length}`);

  console.log("\n=== 2. Testing Create Category (Maker) ===");
  const testCat = await prisma.kategoriBunga.create({
    data: {
      jenisId: jenis.id,
      nama: "Kredit Sindikasi Strategis (Test)",
      slug: "kredit-sindikasi-test",
      deskripsi: "Kategori uji coba sistem",
      urutan: 99,
    },
  });
  console.log(`Created Category: [${testCat.id}] ${testCat.nama}`);

  console.log("\n=== 3. Testing Create Product (Maker) ===");
  const testProd = await prisma.produkBunga.create({
    data: {
      kategoriId: testCat.id,
      nama: "Pembiayaan Konsorsium BUMN (Test)",
      rate: "7.75% p.a.",
      tenorTiering: "5 - 10 Tahun",
      saldoMinimal: "Plafon Rp 50 Miliar",
      keterangan: "Review komite ALCO kuartal IV",
      isActive: true,
      urutan: 1,
    },
  });
  console.log(`Created Product: [${testProd.id}] ${testProd.nama} - Rate: ${testProd.rate} - Active: ${testProd.isActive}`);

  console.log("\n=== 4. Testing Fast Toggle Status isActive (Soft Delete) ===");
  const updatedProd = await prisma.produkBunga.update({
    where: { id: testProd.id },
    data: { isActive: false },
  });
  console.log(`Updated Product: [${updatedProd.id}] Status Active is now: ${updatedProd.isActive} (Successfully Deactivated / Archived)`);

  console.log("\n=== 5. Testing Re-activate Product ===");
  const reactivated = await prisma.produkBunga.update({
    where: { id: testProd.id },
    data: { isActive: true },
  });
  console.log(`Re-activated Product: [${reactivated.id}] Status Active is now: ${reactivated.isActive}`);

  console.log("\n=== 6. Clean Up Test Data ===");
  await prisma.produkBunga.delete({ where: { id: testProd.id } });
  await prisma.kategoriBunga.delete({ where: { id: testCat.id } });
  console.log("Cleaned up test product and test category successfully!");

  console.log("\n>>> ALL RELATIONAL AND CMS OPERATIONS SUCCEEDED 100%! <<<");
}

testCrud()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
