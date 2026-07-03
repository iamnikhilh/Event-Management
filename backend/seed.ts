import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as bcrypt from 'bcrypt';
import { users, categories, events } from './src/database/schema';

const client = postgres(process.env.DATABASE_URL || '');
const db = drizzle(client);

async function seed() {
  console.log('🌱 Starting seed...');

  try {
    // Create users
    console.log('📝 Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const [admin, organizer, viewer] = await db
      .insert(users)
      .values([
        {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
          passwordHash: hashedPassword,
          role: 'admin',
          isActive: true,
        },
        {
          firstName: 'John',
          lastName: 'Organizer',
          email: 'john@example.com',
          passwordHash: hashedPassword,
          role: 'organizer',
          isActive: true,
        },
        {
          firstName: 'Jane',
          lastName: 'Viewer',
          email: 'jane@example.com',
          passwordHash: hashedPassword,
          role: 'viewer',
          isActive: true,
        },
      ])
      .returning();

    console.log(`✅ Created ${3} users`);

    // Create categories
    console.log('📂 Creating categories...');
    const [techCategory, musicCategory, sportsCategory] = await db
      .insert(categories)
      .values([
        { name: 'Technology' },
        { name: 'Music' },
        { name: 'Sports' },
      ])
      .returning();

    console.log(`✅ Created ${3} categories`);

    // Create events
    console.log('🎉 Creating events...');
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    await db
      .insert(events)
      .values([
        {
          title: 'React Workshop',
          description: 'Learn React basics and advanced concepts',
          categoryId: techCategory.id,
          createdById: organizer.id,
          venue: 'Tech Hub, New York',
          eventDate: futureDate,
          capacity: 100,
          status: 'upcoming',
          bannerImage: 'https://via.placeholder.com/500x300?text=React+Workshop',
        },
        {
          title: 'Jazz Night',
          description: 'Live jazz music performance',
          categoryId: musicCategory.id,
          createdById: organizer.id,
          venue: 'Blue Moon Jazz Club',
          eventDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          capacity: 150,
          status: 'upcoming',
          bannerImage: 'https://via.placeholder.com/500x300?text=Jazz+Night',
        },
        {
          title: 'Basketball Tournament',
          description: 'Annual basketball championship',
          categoryId: sportsCategory.id,
          createdById: organizer.id,
          venue: 'Sports Arena',
          eventDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          capacity: 500,
          status: 'upcoming',
          bannerImage: 'https://via.placeholder.com/500x300?text=Basketball',
        },
      ]);

    console.log(`✅ Created ${3} events`);

    console.log('✨ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
