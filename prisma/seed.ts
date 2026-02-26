import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();

  for (let i = 1; i <= 20; i++) {
    const refNumber = String(i).padStart(3, "0");
    const reference = `H-${refNumber}`;
    const orderNumber = `CMD-${Date.now()}-${i}`;
    const price = 35 + i * 5;

    await prisma.order.create({
      data: {
        orderNumber,
        customerName:  `Client ${i}`,
        customerEmail: `client${i}@example.com`,
        customerPhone: `06${String(Math.random() * 100000000).padStart(8, "0")}`,
        status:        "COMMANDE_A_TRAITER",
        paymentStatus: i % 2 === 0 ? "PAID" : "PENDING",
        total:         price,
        subtotal:      price - 5,
        shipping:      5,
        tax:           0,
        currency:      "EUR",
        category:      "t-shirt",
        notes:         `Commande test ${i}`,
        items: {
          create: [
            {
              name:     `T-Shirt ${reference}`,
              sku:      reference,
              quantity: 1,
              price:    price,
              imageUrl: `https://example.com/logo-${refNumber}.png`,
            },
          ],
        },
      },
    });

    console.log(`Inséré : ${reference} (${orderNumber})`);
  }

  console.log("Seeding terminé!");
}

main()
  .catch((e) => {
    console.error("Erreur lors du seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
