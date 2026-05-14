import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  MovementType,
  PrismaClient,
  PurchaseOrderStatus,
  ReferenceType,
  RiskLevel,
  ScenarioType,
  UserRole,
  WasteReason,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

type SupplierSeed = {
  id: string;
  code: string;
  name: string;
  defaultLeadTimeDays: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

type SkuSeed = {
  id: string;
  code: string;
  supplierCode: string;
  name: string;
  category: string;
  unit: string;
  unitCost: number;
  holdingCost: number;
  orderCost: number;
  shelfLifeDays: number;
  safetyStock: number;
  minimumStock: number;
  averageDailyDemand: number;
  demandVariability: number;
};

type MenuItemSeed = {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  baseDemand: number;
  recipe: Array<{
    skuCode: string;
    quantityPerServing: number;
    unit: string;
  }>;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required for seeding');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const HOTEL_ROOM_CAPACITY = 160;
const DAYS_OF_HISTORY = 35;

const atNoonUtc = (daysOffset: number) => {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + daysOffset,
      12,
      0,
      0,
      0,
    ),
  );
};

const round = (value: number, decimals = 2) =>
  Number(value.toFixed(decimals));

const suppliers: SupplierSeed[] = [
  {
    id: randomUUID(),
    code: 'meats',
    name: 'Morning Crest Meats',
    defaultLeadTimeDays: 2,
    contactName: 'Narin Chai',
    contactEmail: 'narin@morningcrest.example',
    contactPhone: '+66-2100-1101',
  },
  {
    id: randomUUID(),
    code: 'seafood',
    name: 'Andaman Coastal Seafood',
    defaultLeadTimeDays: 2,
    contactName: 'Mali Sae-Lim',
    contactEmail: 'mali@andamancoast.example',
    contactPhone: '+66-2100-1102',
  },
  {
    id: randomUUID(),
    code: 'produce',
    name: 'Green Valley Produce',
    defaultLeadTimeDays: 1,
    contactName: 'Preecha Virote',
    contactEmail: 'preecha@greenvalley.example',
    contactPhone: '+66-2100-1103',
  },
  {
    id: randomUUID(),
    code: 'dairy',
    name: 'Royal Dairy House',
    defaultLeadTimeDays: 2,
    contactName: 'Suda Kittisak',
    contactEmail: 'suda@royaldairy.example',
    contactPhone: '+66-2100-1104',
  },
  {
    id: randomUUID(),
    code: 'pantry',
    name: 'Siam Pantry Trading',
    defaultLeadTimeDays: 4,
    contactName: 'Anan Phorn',
    contactEmail: 'anan@siampantry.example',
    contactPhone: '+66-2100-1105',
  },
];

const skuDefinitions: SkuSeed[] = [
  {
    id: randomUUID(),
    code: 'CHK-BRST',
    supplierCode: 'meats',
    name: 'Chicken Breast',
    category: 'meat',
    unit: 'kg',
    unitCost: 145,
    holdingCost: 6.2,
    orderCost: 240,
    shelfLifeDays: 5,
    safetyStock: 12,
    minimumStock: 18,
    averageDailyDemand: 6.8,
    demandVariability: 1.9,
  },
  {
    id: randomUUID(),
    code: 'BEF-STRP',
    supplierCode: 'meats',
    name: 'Beef Striploin',
    category: 'meat',
    unit: 'kg',
    unitCost: 420,
    holdingCost: 15.5,
    orderCost: 320,
    shelfLifeDays: 7,
    safetyStock: 8,
    minimumStock: 10,
    averageDailyDemand: 3.2,
    demandVariability: 1.1,
  },
  {
    id: randomUUID(),
    code: 'SAL-FLET',
    supplierCode: 'seafood',
    name: 'Salmon Fillet',
    category: 'seafood',
    unit: 'kg',
    unitCost: 360,
    holdingCost: 14.2,
    orderCost: 300,
    shelfLifeDays: 4,
    safetyStock: 7,
    minimumStock: 9,
    averageDailyDemand: 2.5,
    demandVariability: 0.9,
  },
  {
    id: randomUUID(),
    code: 'SHR-WHT',
    supplierCode: 'seafood',
    name: 'White Shrimp',
    category: 'seafood',
    unit: 'kg',
    unitCost: 285,
    holdingCost: 11.6,
    orderCost: 280,
    shelfLifeDays: 4,
    safetyStock: 8,
    minimumStock: 10,
    averageDailyDemand: 3.7,
    demandVariability: 1.2,
  },
  {
    id: randomUUID(),
    code: 'RIC-JAS',
    supplierCode: 'pantry',
    name: 'Jasmine Rice',
    category: 'pantry',
    unit: 'kg',
    unitCost: 38,
    holdingCost: 2.1,
    orderCost: 180,
    shelfLifeDays: 180,
    safetyStock: 35,
    minimumStock: 50,
    averageDailyDemand: 11.8,
    demandVariability: 2.4,
  },
  {
    id: randomUUID(),
    code: 'CML-1000',
    supplierCode: 'pantry',
    name: 'Coconut Milk',
    category: 'pantry',
    unit: 'liter',
    unitCost: 52,
    holdingCost: 2.8,
    orderCost: 180,
    shelfLifeDays: 45,
    safetyStock: 10,
    minimumStock: 14,
    averageDailyDemand: 4.2,
    demandVariability: 1.3,
  },
  {
    id: randomUUID(),
    code: 'EGG-LRG',
    supplierCode: 'dairy',
    name: 'Large Eggs',
    category: 'dairy',
    unit: 'piece',
    unitCost: 4.2,
    holdingCost: 0.12,
    orderCost: 150,
    shelfLifeDays: 14,
    safetyStock: 180,
    minimumStock: 240,
    averageDailyDemand: 82,
    demandVariability: 10.5,
  },
  {
    id: randomUUID(),
    code: 'MLK-WHL',
    supplierCode: 'dairy',
    name: 'Whole Milk',
    category: 'dairy',
    unit: 'liter',
    unitCost: 48,
    holdingCost: 2.5,
    orderCost: 150,
    shelfLifeDays: 7,
    safetyStock: 16,
    minimumStock: 22,
    averageDailyDemand: 7.5,
    demandVariability: 1.8,
  },
  {
    id: randomUUID(),
    code: 'BTR-UNS',
    supplierCode: 'dairy',
    name: 'Unsalted Butter',
    category: 'dairy',
    unit: 'kg',
    unitCost: 210,
    holdingCost: 6.8,
    orderCost: 170,
    shelfLifeDays: 30,
    safetyStock: 6,
    minimumStock: 8,
    averageDailyDemand: 1.4,
    demandVariability: 0.4,
  },
  {
    id: randomUUID(),
    code: 'LET-ROM',
    supplierCode: 'produce',
    name: 'Romaine Lettuce',
    category: 'vegetable',
    unit: 'kg',
    unitCost: 95,
    holdingCost: 4.4,
    orderCost: 140,
    shelfLifeDays: 4,
    safetyStock: 6,
    minimumStock: 8,
    averageDailyDemand: 2.9,
    demandVariability: 0.8,
  },
  {
    id: randomUUID(),
    code: 'TOM-RED',
    supplierCode: 'produce',
    name: 'Tomato',
    category: 'vegetable',
    unit: 'kg',
    unitCost: 65,
    holdingCost: 3.3,
    orderCost: 140,
    shelfLifeDays: 5,
    safetyStock: 7,
    minimumStock: 10,
    averageDailyDemand: 3.6,
    demandVariability: 1,
  },
  {
    id: randomUUID(),
    code: 'ONI-YLW',
    supplierCode: 'produce',
    name: 'Yellow Onion',
    category: 'vegetable',
    unit: 'kg',
    unitCost: 32,
    holdingCost: 1.6,
    orderCost: 120,
    shelfLifeDays: 25,
    safetyStock: 8,
    minimumStock: 12,
    averageDailyDemand: 2.7,
    demandVariability: 0.7,
  },
  {
    id: randomUUID(),
    code: 'POT-RUS',
    supplierCode: 'produce',
    name: 'Potato',
    category: 'vegetable',
    unit: 'kg',
    unitCost: 28,
    holdingCost: 1.5,
    orderCost: 120,
    shelfLifeDays: 30,
    safetyStock: 10,
    minimumStock: 15,
    averageDailyDemand: 4.8,
    demandVariability: 1.2,
  },
  {
    id: randomUUID(),
    code: 'BRC-FSH',
    supplierCode: 'produce',
    name: 'Broccoli',
    category: 'vegetable',
    unit: 'kg',
    unitCost: 88,
    holdingCost: 4.1,
    orderCost: 130,
    shelfLifeDays: 6,
    safetyStock: 5,
    minimumStock: 7,
    averageDailyDemand: 2.1,
    demandVariability: 0.6,
  },
  {
    id: randomUUID(),
    code: 'CRT-FSH',
    supplierCode: 'produce',
    name: 'Carrot',
    category: 'vegetable',
    unit: 'kg',
    unitCost: 35,
    holdingCost: 1.9,
    orderCost: 120,
    shelfLifeDays: 20,
    safetyStock: 6,
    minimumStock: 9,
    averageDailyDemand: 2.4,
    demandVariability: 0.6,
  },
];

const menuItems: MenuItemSeed[] = [
  {
    id: randomUUID(),
    name: 'Chicken Fried Rice',
    category: 'lunch',
    sellingPrice: 245,
    baseDemand: 20,
    recipe: [
      { skuCode: 'CHK-BRST', quantityPerServing: 0.18, unit: 'kg' },
      { skuCode: 'RIC-JAS', quantityPerServing: 0.12, unit: 'kg' },
      { skuCode: 'EGG-LRG', quantityPerServing: 1, unit: 'piece' },
      { skuCode: 'ONI-YLW', quantityPerServing: 0.03, unit: 'kg' },
      { skuCode: 'CRT-FSH', quantityPerServing: 0.02, unit: 'kg' },
    ],
  },
  {
    id: randomUUID(),
    name: 'Grilled Salmon Plate',
    category: 'dinner',
    sellingPrice: 540,
    baseDemand: 8,
    recipe: [
      { skuCode: 'SAL-FLET', quantityPerServing: 0.22, unit: 'kg' },
      { skuCode: 'POT-RUS', quantityPerServing: 0.18, unit: 'kg' },
      { skuCode: 'BRC-FSH', quantityPerServing: 0.08, unit: 'kg' },
      { skuCode: 'BTR-UNS', quantityPerServing: 0.02, unit: 'kg' },
    ],
  },
  {
    id: randomUUID(),
    name: 'Shrimp Coconut Curry',
    category: 'dinner',
    sellingPrice: 395,
    baseDemand: 10,
    recipe: [
      { skuCode: 'SHR-WHT', quantityPerServing: 0.16, unit: 'kg' },
      { skuCode: 'CML-1000', quantityPerServing: 0.15, unit: 'liter' },
      { skuCode: 'RIC-JAS', quantityPerServing: 0.11, unit: 'kg' },
      { skuCode: 'ONI-YLW', quantityPerServing: 0.03, unit: 'kg' },
      { skuCode: 'TOM-RED', quantityPerServing: 0.05, unit: 'kg' },
    ],
  },
  {
    id: randomUUID(),
    name: 'Beef Striploin Steak',
    category: 'dinner',
    sellingPrice: 690,
    baseDemand: 7,
    recipe: [
      { skuCode: 'BEF-STRP', quantityPerServing: 0.25, unit: 'kg' },
      { skuCode: 'POT-RUS', quantityPerServing: 0.2, unit: 'kg' },
      { skuCode: 'BTR-UNS', quantityPerServing: 0.015, unit: 'kg' },
      { skuCode: 'BRC-FSH', quantityPerServing: 0.07, unit: 'kg' },
    ],
  },
  {
    id: randomUUID(),
    name: 'Garden Salad',
    category: 'appetizer',
    sellingPrice: 180,
    baseDemand: 11,
    recipe: [
      { skuCode: 'LET-ROM', quantityPerServing: 0.08, unit: 'kg' },
      { skuCode: 'TOM-RED', quantityPerServing: 0.05, unit: 'kg' },
      { skuCode: 'CRT-FSH', quantityPerServing: 0.03, unit: 'kg' },
    ],
  },
  {
    id: randomUUID(),
    name: 'Vegetable Omelette',
    category: 'breakfast',
    sellingPrice: 160,
    baseDemand: 14,
    recipe: [
      { skuCode: 'EGG-LRG', quantityPerServing: 2, unit: 'piece' },
      { skuCode: 'MLK-WHL', quantityPerServing: 0.04, unit: 'liter' },
      { skuCode: 'ONI-YLW', quantityPerServing: 0.02, unit: 'kg' },
      { skuCode: 'TOM-RED', quantityPerServing: 0.03, unit: 'kg' },
      { skuCode: 'BTR-UNS', quantityPerServing: 0.01, unit: 'kg' },
    ],
  },
  {
    id: randomUUID(),
    name: 'Creamy Potato Soup',
    category: 'lunch',
    sellingPrice: 195,
    baseDemand: 9,
    recipe: [
      { skuCode: 'POT-RUS', quantityPerServing: 0.16, unit: 'kg' },
      { skuCode: 'MLK-WHL', quantityPerServing: 0.12, unit: 'liter' },
      { skuCode: 'ONI-YLW', quantityPerServing: 0.03, unit: 'kg' },
      { skuCode: 'BTR-UNS', quantityPerServing: 0.01, unit: 'kg' },
    ],
  },
  {
    id: randomUUID(),
    name: 'Breakfast Buffet',
    category: 'breakfast',
    sellingPrice: 420,
    baseDemand: 32,
    recipe: [
      { skuCode: 'EGG-LRG', quantityPerServing: 1.5, unit: 'piece' },
      { skuCode: 'RIC-JAS', quantityPerServing: 0.08, unit: 'kg' },
      { skuCode: 'CHK-BRST', quantityPerServing: 0.06, unit: 'kg' },
      { skuCode: 'MLK-WHL', quantityPerServing: 0.08, unit: 'liter' },
      { skuCode: 'LET-ROM', quantityPerServing: 0.02, unit: 'kg' },
      { skuCode: 'TOM-RED', quantityPerServing: 0.02, unit: 'kg' },
    ],
  },
];

const movementAdjustments = [
  {
    movement_type: MovementType.adjustment,
    reference_type: ReferenceType.manual_adjustment,
    notes: 'Cold room count correction after physical stock check.',
  },
  {
    movement_type: MovementType.usage,
    reference_type: ReferenceType.pos_consumption,
    notes: 'Manual usage capture for buffet overrun.',
  },
  {
    movement_type: MovementType.adjustment,
    reference_type: ReferenceType.manual_adjustment,
    notes: 'Receiving variance correction from supplier invoice.',
  },
];

async function resetDatabase() {
  await prisma.replenishmentRecommendation.deleteMany();
  await prisma.demandForecast.deleteMany();
  await prisma.supplierLeadTime.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.inventoryBatch.deleteMany();
  await prisma.wasteLog.deleteMany();
  await prisma.posTransaction.deleteMany();
  await prisma.occupancyRecord.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.simulationRun.deleteMany();
  await prisma.sku.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.hotel.deleteMany();
}

async function main() {
  await resetDatabase();

  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const analystPasswordHash = await bcrypt.hash('Analyst123!', 10);

  const hotelId = randomUUID();

  await prisma.hotel.create({
    data: {
      id: hotelId,
      name: 'Azure Bay Hotel Bangkok',
      location: 'Bangkok Riverside',
    },
  });

  await prisma.user.createMany({
    data: [
      {
        id: randomUUID(),
        name: 'Operations Admin',
        email: 'admin@azurebay.example',
        password_hash: adminPasswordHash,
        role: UserRole.admin,
      },
      {
        id: randomUUID(),
        name: 'Inventory Analyst',
        email: 'analyst@azurebay.example',
        password_hash: analystPasswordHash,
        role: UserRole.analyst,
      },
    ],
  });

  await prisma.supplier.createMany({
    data: suppliers.map((supplier) => ({
      id: supplier.id,
      hotel_id: hotelId,
      name: supplier.name,
      contact_name: supplier.contactName,
      contact_email: supplier.contactEmail,
      contact_phone: supplier.contactPhone,
      default_lead_time_days: supplier.defaultLeadTimeDays,
    })),
  });

  const supplierByCode = new Map(suppliers.map((supplier) => [supplier.code, supplier]));
  const skuByCode = new Map(skuDefinitions.map((sku) => [sku.code, sku]));

  await prisma.sku.createMany({
    data: skuDefinitions.map((sku) => ({
      id: sku.id,
      hotel_id: hotelId,
      supplier_id: supplierByCode.get(sku.supplierCode)!.id,
      sku_code: sku.code,
      name: sku.name,
      category: sku.category,
      unit: sku.unit,
      unit_cost: sku.unitCost,
      holding_cost_per_unit: sku.holdingCost,
      order_cost: sku.orderCost,
      shelf_life_days: sku.shelfLifeDays,
      safety_stock: sku.safetyStock,
      minimum_stock: sku.minimumStock,
      is_active: true,
    })),
  });

  await prisma.menuItem.createMany({
    data: menuItems.map((menuItem) => ({
      id: menuItem.id,
      hotel_id: hotelId,
      name: menuItem.name,
      category: menuItem.category,
      selling_price: menuItem.sellingPrice,
      is_active: true,
    })),
  });

  await prisma.recipe.createMany({
    data: menuItems.flatMap((menuItem) =>
      menuItem.recipe.map((ingredient) => ({
        id: randomUUID(),
        menu_item_id: menuItem.id,
        sku_id: skuByCode.get(ingredient.skuCode)!.id,
        quantity_per_serving: ingredient.quantityPerServing,
        unit: ingredient.unit,
      })),
    ),
  });

  const occupancyRecords = Array.from({ length: DAYS_OF_HISTORY }, (_, index) => {
    const daysOffset = index - (DAYS_OF_HISTORY - 1);
    const recordDate = atNoonUtc(daysOffset);
    const dayOfWeek = recordDate.getUTCDay();
    const weekendBoost = dayOfWeek === 5 || dayOfWeek === 6 ? 18 : 0;
    const breakfastBoost = dayOfWeek === 0 ? 10 : 0;
    const eventBoost = index === 10 || index === 26 ? 25 : 0;
    const occupiedRooms = 102 + (index % 7) * 3 + weekendBoost + breakfastBoost + eventBoost;
    const occupancyRate = round((occupiedRooms / HOTEL_ROOM_CAPACITY) * 100, 2);
    const estimatedRestaurantVisits = Math.round(occupiedRooms * (dayOfWeek >= 5 ? 1.35 : 1.08));

    return {
      id: randomUUID(),
      hotel_id: hotelId,
      record_date: recordDate,
      occupied_rooms: occupiedRooms,
      occupancy_rate: occupancyRate,
      estimated_restaurant_visits: estimatedRestaurantVisits,
    };
  });

  await prisma.occupancyRecord.createMany({ data: occupancyRecords });

  const posTransactions = occupancyRecords.flatMap((record, index) => {
    const dayOfWeek = record.record_date.getUTCDay();
    const weekendFactor = dayOfWeek === 5 || dayOfWeek === 6 ? 1.22 : 1;
    const occupancyFactor = record.occupancy_rate / 74;
    const eventFactor = index === 10 || index === 26 ? 1.18 : 1;

    return menuItems
      .map((menuItem) => {
        const breakfastFactor =
          menuItem.category === 'breakfast' ? 1.16 : 1;
        const dinnerFactor = menuItem.category === 'dinner' ? 1.08 : 1;
        const quantity = Math.max(
          1,
          Math.round(
            menuItem.baseDemand *
              weekendFactor *
              occupancyFactor *
              eventFactor *
              breakfastFactor *
              dinnerFactor,
          ),
        );

        return {
          id: randomUUID(),
          hotel_id: hotelId,
          menu_item_id: menuItem.id,
          quantity_sold: quantity,
          transaction_date: record.record_date,
          meal_period:
            menuItem.category === 'breakfast'
              ? 'breakfast'
              : menuItem.category === 'dinner'
                ? 'dinner'
                : 'lunch',
        };
      })
      .filter((transaction) => transaction.quantity_sold > 0);
  });

  await prisma.posTransaction.createMany({ data: posTransactions });

  const wasteEvents = [
    { skuCode: 'LET-ROM', daysOffset: -30, quantity: 1.6, reason: WasteReason.expiration },
    { skuCode: 'TOM-RED', daysOffset: -28, quantity: 2.1, reason: WasteReason.spoilage },
    { skuCode: 'MLK-WHL', daysOffset: -24, quantity: 3.2, reason: WasteReason.expiration },
    { skuCode: 'SAL-FLET', daysOffset: -21, quantity: 1.1, reason: WasteReason.quality_issue },
    { skuCode: 'SHR-WHT', daysOffset: -19, quantity: 1.8, reason: WasteReason.spoilage },
    { skuCode: 'CHK-BRST', daysOffset: -16, quantity: 2.4, reason: WasteReason.overproduction },
    { skuCode: 'LET-ROM', daysOffset: -14, quantity: 1.2, reason: WasteReason.damage },
    { skuCode: 'BRC-FSH', daysOffset: -11, quantity: 1.3, reason: WasteReason.expiration },
    { skuCode: 'TOM-RED', daysOffset: -9, quantity: 1.5, reason: WasteReason.spoilage },
    { skuCode: 'MLK-WHL', daysOffset: -7, quantity: 2.8, reason: WasteReason.expiration },
    { skuCode: 'SHR-WHT', daysOffset: -4, quantity: 1.2, reason: WasteReason.quality_issue },
    { skuCode: 'LET-ROM', daysOffset: -2, quantity: 1.4, reason: WasteReason.expiration },
  ];

  const wasteLogs = wasteEvents.map((event) => {
    const sku = skuByCode.get(event.skuCode)!;

    return {
      id: randomUUID(),
      sku_id: sku.id,
      quantity: event.quantity,
      unit: sku.unit,
      waste_reason: event.reason,
      estimated_cost: round(event.quantity * sku.unitCost, 2),
      waste_date: atNoonUtc(event.daysOffset),
      notes: `Seeded ${event.reason.toLowerCase()} event for ${sku.name}.`,
    };
  });

  await prisma.wasteLog.createMany({ data: wasteLogs });

  const purchaseOrderBlueprints = [
    ['RIC-JAS', 'EGG-LRG', 'MLK-WHL'],
    ['CHK-BRST', 'LET-ROM', 'TOM-RED'],
    ['SHR-WHT', 'CML-1000', 'ONI-YLW'],
    ['BEF-STRP', 'POT-RUS', 'BRC-FSH'],
    ['SAL-FLET', 'LET-ROM', 'MLK-WHL'],
    ['RIC-JAS', 'CHK-BRST', 'EGG-LRG'],
  ];

  const purchaseOrders = purchaseOrderBlueprints.map((skuCodes, index) => {
    const firstSku = skuByCode.get(skuCodes[0])!;
    const supplier = supplierByCode.get(firstSku.supplierCode)!;
    const orderDate = atNoonUtc(-32 + index * 5);
    const expectedDeliveryDate = atNoonUtc(-30 + index * 5);

    return {
      id: randomUUID(),
      hotel_id: hotelId,
      supplier_id: supplier.id,
      status:
        index < 4 ? PurchaseOrderStatus.received : PurchaseOrderStatus.ordered,
      order_date: orderDate,
      expected_delivery_date: expectedDeliveryDate,
      skuCodes,
    };
  });

  const purchaseOrderItems = purchaseOrders.flatMap((order, orderIndex) =>
    order.skuCodes.map((skuCode, itemIndex) => {
      const sku = skuByCode.get(skuCode)!;
      const orderedQuantity =
        sku.unit === 'piece'
          ? 220 + orderIndex * 15
          : round(sku.averageDailyDemand * (5 + itemIndex), 3);
      const discountRate = itemIndex === 0 ? 5 : 0;

      return {
        id: randomUUID(),
        purchase_order_id: order.id,
        sku_id: sku.id,
        ordered_quantity: orderedQuantity,
        unit_cost: sku.unitCost,
        discount_rate: discountRate,
      };
    }),
  );

  const purchaseOrdersWithTotals = purchaseOrders.map((order) => {
    const items = purchaseOrderItems.filter(
      (item) => item.purchase_order_id === order.id,
    );
    const totalCost = round(
      items.reduce(
        (sum, item) =>
          sum +
          Number(item.ordered_quantity) *
            item.unit_cost *
            (1 - Number(item.discount_rate ?? 0) / 100),
        0,
      ),
      2,
    );

    return {
      id: order.id,
      hotel_id: order.hotel_id,
      supplier_id: order.supplier_id,
      status: order.status,
      order_date: order.order_date,
      expected_delivery_date: order.expected_delivery_date,
      total_cost: totalCost,
    };
  });

  await prisma.purchaseOrder.createMany({ data: purchaseOrdersWithTotals });
  await prisma.purchaseOrderItem.createMany({ data: purchaseOrderItems });

  const inventoryBatches = purchaseOrderItems.map((item, index) => {
    const sku = skuDefinitions.find((candidate) => candidate.id === item.sku_id)!;
    const receivedDate = purchaseOrdersWithTotals.find(
      (order) => order.id === item.purchase_order_id,
    )!.expected_delivery_date;
    const expiryDate = atNoonUtc(
      Math.round(
        (receivedDate.getTime() - atNoonUtc(0).getTime()) / (24 * 60 * 60 * 1000),
      ) + sku.shelfLifeDays,
    );

    return {
      id: randomUUID(),
      sku_id: item.sku_id,
      received_quantity: item.ordered_quantity,
      remaining_quantity:
        sku.unit === 'piece'
          ? Number(item.ordered_quantity) * 0.55
          : round(Number(item.ordered_quantity) * (0.42 + (index % 3) * 0.08), 3),
      received_date: receivedDate,
      expiry_date: expiryDate,
      unit_cost: item.unit_cost,
    };
  });

  await prisma.inventoryBatch.createMany({ data: inventoryBatches });

  const purchaseMovements = purchaseOrderItems.map((item) => {
    const order = purchaseOrdersWithTotals.find(
      (purchaseOrder) => purchaseOrder.id === item.purchase_order_id,
    )!;

    return {
      id: randomUUID(),
      sku_id: item.sku_id,
      movement_type: MovementType.purchase,
      quantity: item.ordered_quantity,
      reference_type: ReferenceType.purchase_order,
      reference_id: item.purchase_order_id,
      movement_date: order.expected_delivery_date,
      notes: 'Seeded purchase receipt movement.',
    };
  });

  const wasteMovements = wasteLogs.map((wasteLog) => ({
    id: randomUUID(),
    sku_id: wasteLog.sku_id,
    movement_type: MovementType.waste,
    quantity: wasteLog.quantity,
    reference_type: ReferenceType.waste_log,
    reference_id: wasteLog.id,
    movement_date: wasteLog.waste_date,
    notes: 'Seeded waste movement from logged waste event.',
  }));

  const adjustmentMovements = movementAdjustments.map((adjustment, index) => {
    const sku = skuDefinitions[index];
    return {
      id: randomUUID(),
      sku_id: sku.id,
      movement_type: adjustment.movement_type,
      quantity: round(sku.averageDailyDemand * (0.8 + index * 0.2), 3),
      reference_type: adjustment.reference_type,
      reference_id: randomUUID(),
      movement_date: atNoonUtc(-6 + index),
      notes: adjustment.notes,
    };
  });

  await prisma.inventoryMovement.createMany({
    data: [...purchaseMovements, ...wasteMovements, ...adjustmentMovements],
  });

  const supplierLeadTimes = skuDefinitions.map((sku, index) => {
    const supplier = supplierByCode.get(sku.supplierCode)!;

    return {
      id: randomUUID(),
      supplier_id: supplier.id,
      sku_id: sku.id,
      average_lead_time_days: supplier.defaultLeadTimeDays,
      lead_time_variability_days: (index % 3) + 1,
    };
  });

  await prisma.supplierLeadTime.createMany({ data: supplierLeadTimes });

  const demandForecasts = skuDefinitions.map((sku, index) => ({
    id: randomUUID(),
    sku_id: sku.id,
    forecast_period_start: atNoonUtc(1),
    forecast_period_end: atNoonUtc(30),
    average_daily_demand: round(
      sku.averageDailyDemand * (index % 4 === 0 ? 1.08 : 1.02),
      3,
    ),
    demand_variability: sku.demandVariability,
    seasonality_factor: round(index % 5 === 0 ? 1.16 : 1.04, 3),
  }));

  await prisma.demandForecast.createMany({ data: demandForecasts });

  const replenishmentRecommendations = skuDefinitions.map((sku, index) => {
    const leadTime = supplierLeadTimes.find(
      (candidate) => candidate.sku_id === sku.id,
    )!;
    const currentStock =
      index % 3 === 0
        ? round(sku.minimumStock * 0.55, 3)
        : index % 3 === 1
          ? round(sku.minimumStock * 0.95, 3)
          : round(sku.minimumStock * 1.45, 3);
    const reorderPoint = round(
      sku.averageDailyDemand * leadTime.average_lead_time_days + sku.safetyStock,
      3,
    );
    const eoqValue = round(
      Math.sqrt(
        (2 * sku.averageDailyDemand * 30 * sku.orderCost) / sku.holdingCost,
      ),
      3,
    );
    const recommendedQuantity =
      currentStock < reorderPoint ? round(Math.max(eoqValue, sku.minimumStock), 3) : 0;
    const estimatedDaysOfCover = round(
      currentStock / Math.max(sku.averageDailyDemand, 0.1),
      2,
    );
    const riskLevel =
      currentStock < reorderPoint * 0.65
        ? RiskLevel.high
        : currentStock < reorderPoint
          ? RiskLevel.medium
          : RiskLevel.low;

    return {
      id: randomUUID(),
      sku_id: sku.id,
      recommendation_date: atNoonUtc(0),
      current_stock: currentStock,
      reorder_point: reorderPoint,
      recommended_quantity: recommendedQuantity,
      eoq_value: eoqValue,
      estimated_days_of_cover: estimatedDaysOfCover,
      risk_level: riskLevel,
      explanation:
        recommendedQuantity > 0
          ? `${sku.name} is below or near its reorder threshold and needs replenishment support based on lead time, safety stock, and current daily demand.`
          : `${sku.name} currently has enough stock cover relative to its demand and lead time profile.`,
    };
  });

  await prisma.replenishmentRecommendation.createMany({
    data: replenishmentRecommendations,
  });

  const simulationRuns = [
    {
      id: randomUUID(),
      hotel_id: hotelId,
      name: 'Conference Weekend Occupancy Spike',
      scenario_type: ScenarioType.occupancy_change,
      input_parameters: {
        occupancyChangePercent: 18,
        periodDays: 3,
        focusCategories: ['breakfast', 'dinner'],
      },
      result_summary: {
        affectedSkus: ['EGG-LRG', 'RIC-JAS', 'CHK-BRST'],
        projectedAdditionalWasteRisk: 'medium',
        reorderAlertsIncrease: 4,
      },
    },
    {
      id: randomUUID(),
      hotel_id: hotelId,
      name: 'Seafood Supplier Delay',
      scenario_type: ScenarioType.supplier_delay,
      input_parameters: {
        supplier: 'Andaman Coastal Seafood',
        delayDays: 2,
      },
      result_summary: {
        affectedSkus: ['SAL-FLET', 'SHR-WHT'],
        projectedStockoutRisk: 'high',
        suggestedMitigation: 'increase safety stock or split supplier sourcing',
      },
    },
    {
      id: randomUUID(),
      hotel_id: hotelId,
      name: 'Rainy Season Demand Shift',
      scenario_type: ScenarioType.seasonal_shift,
      input_parameters: {
        seasonalityFactor: 1.12,
        focusItems: ['Creamy Potato Soup', 'Shrimp Coconut Curry'],
      },
      result_summary: {
        affectedSkus: ['POT-RUS', 'MLK-WHL', 'SHR-WHT', 'CML-1000'],
        projectedReorderAlerts: 3,
        projectedWasteRisk: 'low',
      },
    },
  ];

  await prisma.simulationRun.createMany({ data: simulationRuns });

  const counts = await Promise.all([
    prisma.hotel.count(),
    prisma.supplier.count(),
    prisma.sku.count(),
    prisma.menuItem.count(),
    prisma.recipe.count(),
    prisma.posTransaction.count(),
    prisma.occupancyRecord.count(),
    prisma.wasteLog.count(),
    prisma.purchaseOrder.count(),
    prisma.replenishmentRecommendation.count(),
  ]);

  console.log(
    JSON.stringify(
      {
        hotels: counts[0],
        suppliers: counts[1],
        skus: counts[2],
        menuItems: counts[3],
        recipes: counts[4],
        posTransactions: counts[5],
        occupancyRecords: counts[6],
        wasteLogs: counts[7],
        purchaseOrders: counts[8],
        replenishmentRecommendations: counts[9],
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
