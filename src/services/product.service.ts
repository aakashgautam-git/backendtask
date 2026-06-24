import { PrismaClient, Prisma } from "@prisma/client";
import { decodeCursor, encodeCursor } from "../utils/cursor";
import {
  PaginatedProducts,
  PaginationParams,
  ProductResponse,
} from "../types/pagination";

const prisma = new PrismaClient();

export async function getProducts({
  limit,
  cursor,
  category,
}: PaginationParams): Promise<PaginatedProducts> {
  const where: Prisma.ProductWhereInput = {};

  // Category filter
  if (category) {
    where.category = category;
  }

  // Cursor pagination
  if (cursor) {
    const decoded = decodeCursor(cursor);

    where.OR = [
      {
        createdAt: {
          lt: new Date(decoded.createdAt),
        },
      },
      {
        createdAt: new Date(decoded.createdAt),
        id: {
          lt: BigInt(decoded.id),
        },
      },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
    take: limit + 1,
  });

  let nextCursor: string | null = null;

  if (products.length > limit) {
    const lastItem = products[limit - 1];

    nextCursor = encodeCursor({
      createdAt: lastItem.createdAt.toISOString(),
      id: lastItem.id.toString(),
    });

    products.pop();
  }

  const response: ProductResponse[] = products.map((product) => ({
    id: product.id.toString(),
    name: product.name,
    category: product.category,
    price: product.price.toString(),
    createdAt: product.createdAt,
  }));

  return {
    data: response,
    nextCursor,
  };
}