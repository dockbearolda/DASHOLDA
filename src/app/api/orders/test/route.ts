import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/orders/test — create a test order using raw SQL to bypass
// the stale Prisma client that has old French enum defaults embedded.
export async function POST() {
  const orderNumber = `TEST-${Date.now()}`;
  const id = `cuid_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  try {
    // Use raw SQL so the DB's actual enum values are used directly.
    // prisma.order.create() fails because the generated client embeds an old
    // French OrderStatus default (COMMANDE_A_TRAITER) that the DB rejects.
    await prisma.$executeRaw`
      INSERT INTO orders (
        id, "orderNumber", "customerName", "customerEmail", "customerPhone",
        status, "paymentStatus", total, subtotal, shipping, tax, currency,
        "shippingAddress", "updatedAt"
      ) VALUES (
        ${id},
        ${orderNumber},
        'Marie Dupont',
        'marie.dupont@example.com',
        '+33 6 12 34 56 78',
        'PENDING'::"OrderStatus",
        'PAID'::"PaymentStatus",
        149.99,
        129.99,
        9.9,
        10.1,
        'EUR',
        '{"street":"15 Rue de la Paix","city":"Paris","postalCode":"75001","country":"France"}'::jsonb,
        NOW()
      )
    `;

    await prisma.$executeRaw`
      INSERT INTO order_items (id, "orderId", name, sku, quantity, price)
      VALUES
        (${id + '_1'}, ${id}, 'Bougie Signature Ambre', 'BSIG-AMB-001', 2, 49.99),
        (${id + '_2'}, ${id}, 'Diffuseur Luxe Bois',    'DLUX-BOIS-01', 1, 30.01)
    `;

    // Read back the created order via raw query (avoids Prisma enum issues)
    const orders = await prisma.$queryRaw<{ id: string; orderNumber: string; status: string; paymentStatus: string; total: number; createdAt: Date }[]>`
      SELECT id, "orderNumber", status, "paymentStatus", total, "createdAt"
      FROM orders WHERE id = ${id}
    `;
    const order = orders[0];

    return NextResponse.json(
      {
        success: true,
        order: {
          ...order,
          createdAt: order.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/orders/test error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Failed to create test order", detail: message }, { status: 500 });
  }
}
