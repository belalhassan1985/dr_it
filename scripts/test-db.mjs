import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== All categories ===');
    const cats = await prisma.category.findMany({ orderBy: { nameAr: 'asc' } });
    console.log('Total:', cats.length);
    cats.forEach(c => {
        console.log('  "' + c.nameAr + '" -> slug: "' + c.slug + '" (length: ' + c.slug.length + ')');
    });
    
    // Check the first sidebar slug specifically
    const testSlug = 'لابتوبات-وحاسبات';
    console.log('\n=== Testing slug: "' + testSlug + '" ===');
    console.log('  Length:', testSlug.length);
    console.log('  Bytes:', Buffer.from(testSlug).length);
    
    const found = await prisma.category.findUnique({ where: { slug: testSlug } });
    console.log('  Found:', found ? 'YES - ' + found.nameAr : 'NO - null');
    
    // Try with findFirst
    const foundFirst = await prisma.category.findFirst({ where: { slug: testSlug } });
    console.log('  findFirst:', foundFirst ? 'YES - ' + foundFirst.nameAr : 'NO - null');
    
    await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); });
