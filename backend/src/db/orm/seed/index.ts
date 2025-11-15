import { PrismaClient } from '@prisma/client';
import { env } from 'process';

// Initialize the Prisma Client
const prisma = new PrismaClient();

/**
 * Database AI Model Seeding function
 * 
 * @description This function seeds the database with initial AI model data.
 * 
 * @returns {Promise<void>} A promise that resolves when seeding is complete.
 */
async function main() {
  console.log('Start seeding...');

  const domain = env.DEV_MODE === '1' ? 'localhost' : 'iagiliza_ai';

  // NOTE: The IDs are hardcoded to ensure consistency across environments
  const toCreate = [
    {id: 1, name: "default", modelType: "no-model", url: null},
    {id: 2, name: "qwen", modelType: "ollama", url: `http://${domain}:11434/api/generate`},
  ]

  for (const data of toCreate) {
    const sender = await prisma.sender.upsert({
      where: { id: data.id },
      update: {name: data.name},
      create: {
        name: data.name,
      },
    });
    const ai = await prisma.ai.upsert({
      where: { senderId: sender.id },
      update: {modelType: data.modelType, url: data.url},
      create: {
        modelType: data.modelType,
        url: data.url,
        senderId: sender.id,
      },
    });

    console.log(`Created sender: ${sender.id} with AI model: ${ai.id}`);
  }
  console.log('Seeding finished.');
}

// Run the main function and handle errors
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Always disconnect the Prisma Client
    await prisma.$disconnect();
  });