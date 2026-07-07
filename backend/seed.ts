import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { users, categories, events } from './src/database/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || '',
});
const db = drizzle(pool);

async function seed() {
  console.log('🌱 Starting seed...');

  try {
    // Create or update users
    console.log('📝 Creating/updating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const userData = [
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        role: 'admin' as const,
        isActive: true,
      },
      {
        firstName: 'John',
        lastName: 'Organizer',
        email: 'john@example.com',
        role: 'organizer' as const,
        isActive: true,
      },
      {
        firstName: 'Nh',
        lastName: 'User',
        email: 'nh@gmail.com',
        role: 'organizer' as const,
        isActive: true,
      },
    ];

    let organizerId = '';

    for (const user of userData) {
      try {
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        if (existing.length === 0) {
          const [created] = await db
            .insert(users)
            .values({
              ...user,
              passwordHash: hashedPassword,
            })
            .returning();
          console.log(`✅ Created user: ${user.email}`);
          if (user.email === 'john@example.com') {
            organizerId = created.id;
          }
        } else {
          console.log(`⏭️  User already exists: ${user.email}`);
          if (user.email === 'john@example.com') {
            organizerId = existing[0].id;
          }
        }
      } catch (err) {
        console.error(`Failed to create user ${user.email}:`, err);
      }
    }

    console.log(`✅ User setup complete`);

    // Create categories (skip if exist)
    console.log('📂 Creating categories...');
    const categoryNames = ['Technology', 'Music', 'Sports'];
    const createdCategories = [];

    for (const name of categoryNames) {
      try {
        const existing = await db
          .select()
          .from(categories)
          .where(eq(categories.name, name))
          .limit(1);

        if (existing.length === 0) {
          const [cat] = await db
            .insert(categories)
            .values({ name })
            .returning();
          createdCategories.push(cat);
          console.log(`✅ Created category: ${name}`);
        } else {
          createdCategories.push(existing[0]);
          console.log(`⏭️  Category already exists: ${name}`);
        }
      } catch (err) {
        console.error(`Failed to create category ${name}:`, err);
      }
    }

    if (createdCategories.length < 3 || !organizerId) {
      console.log('⚠️  Missing prerequisites, skipping events');
      console.log('✨ Seed completed (partial)!');
      return;
    }

    const [techCategory, musicCategory, sportsCategory] = createdCategories;

    // Create events (skip if exist)
    console.log('🎉 Creating events...');
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const eventData = [
      {
        title: 'React Workshop',
        slug: 'react-workshop',
        description: 'Learn React basics and advanced concepts',
        categoryId: techCategory.id,
        createdById: organizerId,
        venue: 'Tech Hub, New York',
        eventDate: futureDate,
        capacity: 100,
        status: 'upcoming' as const,
        isPublic: true,
      },
      {
        title: 'Jazz Night',
        slug: 'jazz-night',
        description: 'Live jazz music performance',
        categoryId: musicCategory.id,
        createdById: organizerId,
        venue: 'Blue Moon Jazz Club',
        eventDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        capacity: 150,
        status: 'upcoming' as const,
        isPublic: true,
      },
      {
        title: 'Basketball Tournament',
        slug: 'basketball-tournament',
        description: 'Annual basketball championship',
        categoryId: sportsCategory.id,
        createdById: organizerId,
        venue: 'Sports Arena',
        eventDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        capacity: 500,
        status: 'upcoming' as const,
        isPublic: true,
      },
    ];

    for (const eventInfo of eventData) {
      try {
        const existing = await db
          .select()
          .from(events)
          .where(eq(events.slug, eventInfo.slug))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(events).values(eventInfo);
          console.log(`✅ Created event: ${eventInfo.title}`);
        } else {
          console.log(`⏭️  Event already exists: ${eventInfo.title}`);
        }
      } catch (err) {
        console.error(`Failed to create event ${eventInfo.title}:`, err);
      }
    }

    console.log(`✅ Events setup complete`);
    console.log('✨ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
