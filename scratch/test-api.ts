import prisma from "../src/lib/prisma";

async function testQuery() {
  const data = await prisma.jenisBunga.findMany({
    orderBy: { urutan: "asc" },
    include: {
      kategori: {
        orderBy: { urutan: "asc" },
        include: {
          produk: {
            orderBy: { urutan: "asc" },
          },
        },
      },
    },
  });

  const formatted = data.map((j) => ({
    id: j.id,
    jenis: j.nama,
    kode: j.kode,
    kategori: j.kategori.map((k) => ({
      id: k.id,
      nama: k.nama,
      slug: k.slug,
      produk: k.produk.map((p) => ({
        id: p.id,
        nama: p.nama,
        rate: p.rate,
        isActive: p.isActive,
      })),
    })),
  }));

  console.log("Nested JSON Output sample (Konvensional):");
  console.log(JSON.stringify(formatted[0], null, 2));
}

testQuery()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
