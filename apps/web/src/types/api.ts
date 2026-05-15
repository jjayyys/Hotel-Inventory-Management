export type Supplier = {
  id: string;
  hotel_id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  default_lead_time_days: number;
  created_at: string;
  updated_at: string;
};

export type SupplierSummary = Supplier;

export type Sku = {
  id: string;
  hotel_id: string;
  supplier_id: string;
  sku_code: string;
  name: string;
  category: string | null;
  unit: string;
  unit_cost: string;
  holding_cost_per_unit: string;
  order_cost: string;
  shelf_life_days: number;
  safety_stock: string;
  minimum_stock: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  supplier?: SupplierSummary;
};

export type Recipe = {
  id: string;
  menu_item_id: string;
  sku_id: string;
  quantity_per_serving: string;
  unit: string;
  created_at: string;
  updated_at: string;
  menu_item?: {
    id: string;
    hotel_id: string;
    name: string;
    category: string | null;
  };
  sku?: Sku;
};

export type InventoryBatch = {
  id: string;
  sku_id: string;
  received_quantity: string;
  remaining_quantity: string;
  received_date: string;
  expiry_date: string;
  unit_cost: string;
  created_at: string;
  sku?: Sku;
};

export type InventoryMovement = {
  id: string;
  sku_id: string;
  movement_type: string;
  quantity: string;
  reference_type: string;
  reference_id: string | null;
  movement_date: string;
  notes: string | null;
  created_at: string;
  sku?: Sku;
};

export type WasteLog = {
  id: string;
  sku_id: string;
  quantity: string;
  unit: string;
  waste_reason: string;
  estimated_cost: string;
  waste_date: string;
  notes: string | null;
  created_at: string;
  sku?: Sku;
};

export type Recommendation = {
  id: string;
  sku_id: string;
  recommendation_date: string;
  current_stock: string;
  reorder_point: string;
  recommended_quantity: string;
  eoq_value: string;
  estimated_days_of_cover: string;
  risk_level: "low" | "medium" | "high" | "critical";
  explanation: string | null;
  created_at: string;
  sku: Sku;
};

export type RecommendationCalculation = {
  skuId: string;
  hotelId: string;
  skuCode: string;
  skuName: string;
  unit: string;
  averageDailyDemand: number;
  demandVariability: number;
  seasonalityFactor: number;
  currentStock: number;
  reorderPoint: number;
  recommendedQuantity: number;
  eoqValue: number;
  estimatedDaysOfCover: number;
  leadTimeDays: number;
  safetyStock: number;
  minimumStock: number;
  recentWasteQuantity: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  shelfLifeCapQuantity: number;
  overstockRisk: boolean;
};

export type RecommendationRecalculationResponse = {
  hotelId: string;
  daysWindow: number;
  historyWindow: {
    start: string;
    end: string;
  };
  forecastWindow: {
    start: string;
    end: string;
  };
  recommendationsGenerated: number;
  recommendations: RecommendationCalculation[];
};
