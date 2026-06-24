import { PrismaClient, Prisma } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

const TOTAL_PRODUCTS = 200_000;
const BATCH_SIZE = Number(process.env.BATCH_SIZE) || 1000;

const categories = [
  "Electronics", "Books", "Fashion", "Sports", "Home",
  "Beauty", "Toys", "Automotive", "Office", "Kitchen",
];

function generateProduct(createdAt: Date): Prisma.ProductCreateManyInput {
  return {
    name: faker.commerce.productName(),
    category: faker.helpers.arrayElement(categories),
    price: new Prisma.Decimal(
      faker.commerce.price({ min: 50, max: 50000, dec: 2 })
    ),
    createdAt,
  };
}

async function seed() {
  console.time("🌱 Total Seed Time");

  try {
    console.log("🧹 Clearing existing data...");
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "products" RESTART IDENTITY CASCADE;`
    );

    let generated = 0;
    let batch = 1;
    let currentTimestamp = new Date();

    while (generated < TOTAL_PRODUCTS) {
      const products: Prisma.ProductCreateManyInput[] = [];

      while (products.length < BATCH_SIZE && generated < TOTAL_PRODUCTS) {
        const groupSize = faker.number.int({ min: 5, max: 80 });

        for (
          let i = 0;
          i < groupSize && products.length < BATCH_SIZE && generated < TOTAL_PRODUCTS;
          i++
        ) {
          products.push(generateProduct(currentTimestamp));
          generated++;
        }

        currentTimestamp = new Date(
          currentTimestamp.getTime() - faker.number.int({ min: 0, max: 5000 })
        );
      }

      console.time(`Batch ${batch}`);
      await prisma.product.createMany({ data: products });
      console.timeEnd(`Batch ${batch}`);

      const percentage = ((generated / TOTAL_PRODUCTS) * 100).toFixed(1);
      console.log(
        `✅ Batch ${batch} | ${generated.toLocaleString()} / ${TOTAL_PRODUCTS.toLocaleString()} (${percentage}%)`
      );
      batch++;
    }

    const count = await prisma.product.count();
    console.log("\n🎉 Seeding completed successfully!");
    console.log(`📦 Total products in database: ${count.toLocaleString()}`);
    console.timeEnd("🌱 Total Seed Time");
  } catch (error) {
    console.error("❌ Seeding failed:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();