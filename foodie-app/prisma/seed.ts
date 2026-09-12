import { PrismaClient } from '@prisma/client';
import { DEFAULT_CATEGORIES, DEFAULT_CUISINES, DEFAULT_VIBES } from '../src/lib/constants';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const mysuruPlaces = [
  {
    name: 'Mylari Hotel',
    slug: 'mylari-hotel-mysuru',
    description: 'Iconic spot for melt-in-your-mouth benne dosas. A must-visit heritage eatery in Mysuru.',
    address: 'Nazarbad Main Rd, Doora, Mysuru',
    latitude: 12.3051,
    longitude: 76.6651,
    categorySlug: 'restaurant',
    cuisineNames: ['South Indian', 'Street Food'],
    vibeSlugs: ['budget-eats', 'quick-bite', 'family-friendly'],
    priceLevel: 1,
  },
  {
    name: 'Depth N Green',
    slug: 'depth-n-green-mysuru',
    description: 'Cozy cafe offering vegan and vegetarian health food, great coffee, and a calm reading atmosphere.',
    address: 'Gokulam 3rd Stage, Mysuru',
    latitude: 12.3245,
    longitude: 76.6341,
    categorySlug: 'cafe',
    cuisineNames: ['Continental', 'Beverages'],
    vibeSlugs: ['quiet-wfh', 'study-friendly', 'instagrammable'],
    priceLevel: 2,
  },
  {
    name: 'By The Way',
    slug: 'by-the-way-mysuru',
    description: 'Spacious multi-cuisine restaurant with outdoor seating and a relaxed vibe.',
    address: 'Ring Road, Vijayanagar, Mysuru',
    latitude: 12.3330,
    longitude: 76.6180,
    categorySlug: 'restaurant',
    cuisineNames: ['Multi-cuisine', 'North Indian', 'Chinese'],
    vibeSlugs: ['group-hangout', 'outdoor-seating', 'family-friendly'],
    priceLevel: 3,
  },
  {
    name: 'Pelican Pub',
    slug: 'pelican-pub-mysuru',
    description: 'One of the oldest and most beloved open-air pubs in Mysuru, known for draught beer and great appetizers.',
    address: 'Vinoba Road, Jayalakshmipuram, Mysuru',
    latitude: 12.3160,
    longitude: 76.6380,
    categorySlug: 'pub-bar',
    cuisineNames: ['Continental', 'North Indian'],
    vibeSlugs: ['group-hangout', 'late-night', 'outdoor-seating'],
    priceLevel: 2,
  },
  {
    name: 'Minimal Coffee Roasters',
    slug: 'minimal-coffee-mysuru',
    description: 'Specialty coffee roastery serving excellent pour-overs and baked goods.',
    address: 'Vontikoppal, Mysuru',
    latitude: 12.3255,
    longitude: 76.6385,
    categorySlug: 'cafe',
    cuisineNames: ['Beverages', 'Desserts'],
    vibeSlugs: ['quiet-wfh', 'instagrammable', 'study-friendly'],
    priceLevel: 2,
  }
];

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Categories
  console.log('Seeding categories...');
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.placeCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug, icon: cat.icon }
    });
  }

  // 2. Seed Cuisines
  console.log('Seeding cuisines...');
  for (const cuisine of DEFAULT_CUISINES) {
    const slug = cuisine.toLowerCase().replace(/\s+/g, '-');
    await prisma.cuisine.upsert({
      where: { slug },
      update: {},
      create: { name: cuisine, slug }
    });
  }

  // 3. Seed Vibes
  console.log('Seeding vibes...');
  for (let i = 0; i < DEFAULT_VIBES.length; i++) {
    const vibe = DEFAULT_VIBES[i];
    await prisma.vibe.upsert({
      where: { slug: vibe.slug },
      update: { sortOrder: i },
      create: { name: vibe.name, slug: vibe.slug, emoji: vibe.emoji, sortOrder: i }
    });
  }

  // 4. Seed City
  console.log('Seeding city...');
  const mysuru = await prisma.city.upsert({
    where: { slug: 'mysuru' },
    update: {},
    create: {
      name: 'Mysuru',
      slug: 'mysuru',
      state: 'Karnataka',
      country: 'India',
      latitude: 12.2958,
      longitude: 76.6394,
    }
  });

  // 5. Seed Places (Mysuru specific)
  console.log('Seeding places...');
  for (const p of mysuruPlaces) {
    const category = await prisma.placeCategory.findUnique({ where: { slug: p.categorySlug } });
    if (!category) continue;

    const place = await prisma.place.upsert({
      where: { slug_cityId: { slug: p.slug, cityId: mysuru.id } },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        address: p.address,
        cityId: mysuru.id,
        latitude: p.latitude,
        longitude: p.longitude,
        categoryId: category.id,
        priceLevel: p.priceLevel,
      }
    });

    // Link cuisines
    for (const cName of p.cuisineNames) {
      const slug = cName.toLowerCase().replace(/\s+/g, '-');
      const cuisine = await prisma.cuisine.findUnique({ where: { slug } });
      if (cuisine) {
        await prisma.placeCuisine.upsert({
          where: { placeId_cuisineId: { placeId: place.id, cuisineId: cuisine.id } },
          update: {},
          create: { placeId: place.id, cuisineId: cuisine.id }
        });
      }
    }

    // Link vibes with initial count
    for (const vSlug of p.vibeSlugs) {
      const vibe = await prisma.vibe.findUnique({ where: { slug: vSlug } });
      if (vibe) {
        await prisma.placeVibe.upsert({
          where: { placeId_vibeId: { placeId: place.id, vibeId: vibe.id } },
          update: { count: 5 }, // Pre-seed with some counts to show up in UI
          create: { placeId: place.id, vibeId: vibe.id, count: 5 }
        });
      }
    }
  }

  // 5. Seed Test User
  console.log('Seeding test user...');
  const testEmail = 'test@foodie.local';
  const existingUser = await prisma.user.findUnique({ where: { email: testEmail } });
  
  if (!existingUser) {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        role: 'ADMIN',
        profile: {
          create: {
            username: 'testuser',
            displayName: 'Test User',
          }
        }
      }
    });
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
