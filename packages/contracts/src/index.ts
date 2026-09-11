import { Type, type Static } from "@sinclair/typebox";

export const IdSchema = Type.String({ minLength: 1 });
export const IsoDateTimeSchema = Type.String({ format: "date-time" });
export const DateOnlySchema = Type.String({
  pattern: "^\\d{4}-\\d{2}-\\d{2}$",
});
export const MoneySchema = Type.Integer({ minimum: 0 });

export const MealSlotSchema = Type.Union([
  Type.Literal("breakfast"),
  Type.Literal("lunch"),
  Type.Literal("dinner"),
]);
export type MealSlot = Static<typeof MealSlotSchema>;

export const DietaryRestrictionSchema = Type.Object({
  id: IdSchema,
  label: Type.String({ minLength: 1 }),
  kind: Type.Union([Type.Literal("allergy"), Type.Literal("avoid"), Type.Literal("preference")]),
  ingredientKeys: Type.Array(Type.String({ minLength: 1 })),
  isHardLimit: Type.Boolean(),
});
export type DietaryRestriction = Static<typeof DietaryRestrictionSchema>;

export const CookingExperienceSchema = Type.Union([
  Type.Literal("beginner"),
  Type.Literal("comfortable"),
  Type.Literal("advanced"),
]);
export type CookingExperience = Static<typeof CookingExperienceSchema>;

export const GuidanceModeSchema = Type.Union([
  Type.Literal("detailed"),
  Type.Literal("compact"),
]);
export type GuidanceMode = Static<typeof GuidanceModeSchema>;

export const HabitBarrierSchema = Type.Union([
  Type.Literal("no_ideas"),
  Type.Literal("low_energy"),
  Type.Literal("no_time"),
  Type.Literal("ingredients_waste"),
  Type.Literal("cleanup"),
]);
export type HabitBarrier = Static<typeof HabitBarrierSchema>;

export const WeeklyGoalMetricSchema = Type.Union([
  Type.Literal("cooking_sessions"),
  Type.Literal("self_cooked_servings"),
]);
export type WeeklyGoalMetric = Static<typeof WeeklyGoalMetricSchema>;

export const ReminderPreferencesSchema = Type.Object({
  expiringIngredients: Type.Boolean(),
  plannedMeals: Type.Boolean(),
  weeklyRhythm: Type.Boolean(),
  pushEnabled: Type.Boolean(),
  quietHoursStart: Type.String({ pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }),
  quietHoursEnd: Type.String({ pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }),
  weeklyLimit: Type.Literal(3),
});
export type ReminderPreferences = Static<typeof ReminderPreferencesSchema>;

export const ReminderPreferencesPatchSchema = Type.Object({
  expiringIngredients: Type.Boolean(),
  plannedMeals: Type.Boolean(),
  weeklyRhythm: Type.Boolean(),
});
export type ReminderPreferencesPatch = Static<typeof ReminderPreferencesPatchSchema>;

export const OnboardingProfileSchema = Type.Object({
  status: Type.Union([Type.Literal("draft"), Type.Literal("complete")]),
  currentStep: Type.Integer({ minimum: 1, maximum: 5 }),
  cookingExperience: CookingExperienceSchema,
  currentWeeklyCookingFrequency: Type.Integer({ minimum: 0, maximum: 21 }),
  habitBarriers: Type.Array(HabitBarrierSchema, { minItems: 1 }),
  guidanceMode: GuidanceModeSchema,
  householdServings: Type.Integer({ minimum: 1, maximum: 12 }),
  cookware: Type.Array(Type.Object({
    type: Type.String({ minLength: 1 }),
    capacity: Type.Optional(Type.String()),
    limitations: Type.Array(Type.String()),
  })),
  restrictions: Type.Array(DietaryRestrictionSchema),
  preferredFlavors: Type.Array(Type.String()),
  availableMinutes: Type.Integer({ minimum: 5, maximum: 180 }),
  inventoryReviewed: Type.Boolean(),
  hasNoInventory: Type.Boolean(),
  plannedMealSlots: Type.Array(MealSlotSchema, { minItems: 1 }),
  primaryGoalMetric: WeeklyGoalMetricSchema,
  weeklyGoalTarget: Type.Integer({ minimum: 1, maximum: 21 }),
  reminders: ReminderPreferencesSchema,
  completedAt: Type.Union([IsoDateTimeSchema, Type.Null()]),
});
export type OnboardingProfile = Static<typeof OnboardingProfileSchema>;

export const IngredientRequirementSchema = Type.Object({
  ingredientKey: Type.String({ minLength: 1 }),
  name: Type.String({ minLength: 1 }),
  quantity: Type.Number({ exclusiveMinimum: 0 }),
  unit: Type.String({ minLength: 1 }),
  isPantryStaple: Type.Boolean(),
  isVegetable: Type.Boolean(),
  coveredByInventory: Type.Boolean(),
});
export type IngredientRequirement = Static<typeof IngredientRequirementSchema>;

export const PlannedMealSchema = Type.Object({
  id: IdSchema,
  date: DateOnlySchema,
  slot: MealSlotSchema,
  recipeId: IdSchema,
  title: Type.String(),
  status: Type.Union([Type.Literal("planned"), Type.Literal("postponed"), Type.Literal("cancelled"), Type.Literal("cooked")]),
  servings: Type.Integer({ minimum: 1 }),
  ingredients: Type.Array(IngredientRequirementSchema),
  estimatedCost: MoneySchema,
  totalMinutes: Type.Integer({ minimum: 1 }),
  cookwareTypes: Type.Array(Type.String()),
  energyLevel: Type.Union([Type.Literal("low"), Type.Literal("normal")]),
});
export type PlannedMeal = Static<typeof PlannedMealSchema>;

export const MealPlanSchema = Type.Object({
  id: IdSchema,
  weekStart: DateOnlySchema,
  meals: Type.Array(PlannedMealSchema),
  overlapRate: Type.Number({ minimum: 0, maximum: 1 }),
  inventoryCoverageRate: Type.Number({ minimum: 0, maximum: 1 }),
  updatedAt: IsoDateTimeSchema,
});
export type MealPlan = Static<typeof MealPlanSchema>;

export const ReceiptItemSchema = Type.Object({
  id: IdSchema,
  name: Type.String(),
  quantity: Type.Number({ exclusiveMinimum: 0 }),
  unit: Type.String(),
  unitPrice: MoneySchema,
  actualPrice: MoneySchema,
  storageLocation: Type.Union([Type.Literal("cold"), Type.Literal("frozen"), Type.Literal("pantry")]),
  expiresOn: Type.Union([DateOnlySchema, Type.Null()]),
  confidence: Type.Object({
    name: Type.Number({ minimum: 0, maximum: 1 }),
    quantity: Type.Number({ minimum: 0, maximum: 1 }),
    unitPrice: Type.Number({ minimum: 0, maximum: 1 }),
    actualPrice: Type.Number({ minimum: 0, maximum: 1 }),
  }),
  confirmed: Type.Boolean(),
});
export type ReceiptItem = Static<typeof ReceiptItemSchema>;

export const ReceiptSchema = Type.Object({
  id: IdSchema,
  purchasedOn: Type.Union([DateOnlySchema, Type.Null()]),
  originalImagePath: Type.String(),
  status: Type.Union([Type.Literal("uploaded"), Type.Literal("recognizing"), Type.Literal("needs_review"), Type.Literal("confirmed"), Type.Literal("failed")]),
  items: Type.Array(ReceiptItemSchema),
  createdAt: IsoDateTimeSchema,
});
export type Receipt = Static<typeof ReceiptSchema>;
export const ReceiptRecognitionSchema = Type.Object({
  purchasedOn: Type.Union([DateOnlySchema, Type.Null()]),
  items: Type.Array(Type.Object({
    name: Type.String({ minLength: 1 }),
    quantity: Type.Number({ exclusiveMinimum: 0 }),
    unit: Type.String({ minLength: 1 }),
    unitPrice: MoneySchema,
    actualPrice: MoneySchema,
    confidence: ReceiptItemSchema.properties.confidence,
  })),
});
export type ReceiptRecognition = Static<typeof ReceiptRecognitionSchema>;

export const RecipeStepSchema = Type.Object({
  id: IdSchema,
  order: Type.Integer({ minimum: 1 }),
  instruction: Type.String({ minLength: 1 }),
  voiceText: Type.String({ minLength: 1 }),
  timerSeconds: Type.Union([Type.Integer({ minimum: 1 }), Type.Null()]),
  safetyNote: Type.Union([Type.String(), Type.Null()]),
});
export type RecipeStep = Static<typeof RecipeStepSchema>;

export const RecipePackageSchema = Type.Object({
  catalogVersionId: Type.Optional(Type.String()),
  source: Type.Optional(Type.Union([Type.Literal("gemini"), Type.Literal("openrouter"), Type.Literal("brand_safe"), Type.Literal("catalog")])),
  id: IdSchema,
  recipeId: IdSchema,
  title: Type.String(),
  servings: Type.Integer({ minimum: 1 }),
  prepMinutes: Type.Integer({ minimum: 0 }),
  totalMinutes: Type.Integer({ minimum: 1 }),
  estimatedCost: MoneySchema,
  cookwareTypes: Type.Array(Type.String()),
  ingredients: Type.Array(IngredientRequirementSchema),
  steps: Type.Array(RecipeStepSchema, { minItems: 1 }),
  imageUrl: Type.Union([Type.String(), Type.Null()]),
  fallbackImageUrl: Type.String(),
  downloadedAt: Type.Union([IsoDateTimeSchema, Type.Null()]),
});
export type RecipePackage = Static<typeof RecipePackageSchema>;

export const RecipeGenerationSchema = Type.Object({
  recipe: RecipePackageSchema,
  source: Type.Union([Type.Literal("gemini"), Type.Literal("openrouter"), Type.Literal("brand_safe"), Type.Literal("catalog")]),
  notice: Type.Union([Type.String(), Type.Null()]),
});
export type RecipeGeneration = Static<typeof RecipeGenerationSchema>;
export const TodayDecisionSchema = Type.Object({
  date: DateOnlySchema,
  slot: MealSlotSchema,
  primary: Type.Union([RecipePackageSchema, Type.Null()]),
  alternatives: Type.Array(RecipePackageSchema, { maxItems: 2 }),
  source: Type.Union([Type.Literal("brand_safe"), Type.Literal("catalog")]),
  notice: Type.String(),
});
export type TodayDecision = Static<typeof TodayDecisionSchema>;
export const MealPlanCreateSchema = Type.Object({ weekStart: DateOnlySchema });
export const MealPostponeSchema = Type.Object({
  weekStart: DateOnlySchema,
  kind: Type.Union([Type.Literal("next_slot"), Type.Literal("specific_date"), Type.Literal("cancel")]),
  date: Type.Optional(DateOnlySchema),
  slot: Type.Optional(MealSlotSchema),
  expectedUpdatedAt: IsoDateTimeSchema,
});
export type MealPostpone = Static<typeof MealPostponeSchema>;
export interface MealPlanGap { date: string; slot: MealSlot }
export interface MealPlanResult {
  plan: MealPlan;
  packages: RecipePackage[];
  expiryWarnings: string[];
  unfilledSlots: MealPlanGap[];
  purchaseCandidates: RecipeRecommendation[];
}

export const CookingSessionSchema = Type.Object({
  id: IdSchema,
  operationId: IdSchema,
  recipePackageId: IdSchema,
  status: Type.Union([Type.Literal("active"), Type.Literal("completed"), Type.Literal("needs_sync")]),
  servingsCooked: Type.Integer({ minimum: 1 }),
  currentStep: Type.Integer({ minimum: 0 }),
  startedAt: IsoDateTimeSchema,
  completedAt: Type.Union([IsoDateTimeSchema, Type.Null()]),
});
export type CookingSession = Static<typeof CookingSessionSchema>;

export const MealServingSchema = Type.Object({
  id: IdSchema,
  cookingSessionId: IdSchema,
  status: Type.Union([Type.Literal("eaten"), Type.Literal("prepared_inventory")]),
  eatenAt: Type.Union([IsoDateTimeSchema, Type.Null()]),
  vegetableKeys: Type.Array(Type.String()),
});
export type MealServing = Static<typeof MealServingSchema>;

export const CookingCostRecordSchema = Type.Object({
  id: IdSchema,
  cookingSessionId: IdSchema,
  comparisonMealPrice: MoneySchema,
  actualIngredientCost: MoneySchema,
  difference: MoneySchema,
  createdAt: IsoDateTimeSchema,
});
export type CookingCostRecord = Static<typeof CookingCostRecordSchema>;

export const ExpEventTypeSchema = Type.Union([
  Type.Literal("cooking_completed"),
  Type.Literal("prepared_serving_eaten"),
  Type.Literal("expiring_ingredient_used"),
  Type.Literal("double_meal_completed"),
  Type.Literal("weekly_goal_completed"),
]);
export type ExpEventType = Static<typeof ExpEventTypeSchema>;

export const ExpEventSchema = Type.Object({
  id: IdSchema,
  operationId: IdSchema,
  type: ExpEventTypeSchema,
  points: Type.Integer({ minimum: 0 }),
  sourceId: IdSchema,
  createdAt: IsoDateTimeSchema,
});
export type ExpEvent = Static<typeof ExpEventSchema>;

export const ChefRankSchema = Type.Object({
  level: Type.Integer({ minimum: 1, maximum: 5 }),
  name: Type.Union([
    Type.Literal("初火學徒"),
    Type.Literal("赤銅助廚"),
    Type.Literal("銀焰掌勺官"),
    Type.Literal("星鑽副主廚"),
    Type.Literal("傳奇總主廚"),
  ]),
  threshold: Type.Integer({ minimum: 0 }),
  nextThreshold: Type.Union([Type.Integer({ minimum: 1 }), Type.Null()]),
});
export type ChefRank = Static<typeof ChefRankSchema>;

export const WeeklyGoalSchema = Type.Object({
  id: IdSchema,
  weekStart: DateOnlySchema,
  metric: WeeklyGoalMetricSchema,
  target: Type.Integer({ minimum: 1, maximum: 21 }),
  progress: Type.Integer({ minimum: 0 }),
  rewardGrantedAt: Type.Union([IsoDateTimeSchema, Type.Null()]),
  updatedAt: IsoDateTimeSchema,
});
export type WeeklyGoal = Static<typeof WeeklyGoalSchema>;

export const BadgeCategorySchema = Type.Union([
  Type.Literal("cooking"),
  Type.Literal("rhythm"),
  Type.Literal("waste_less"),
  Type.Literal("exploration"),
]);
export const BadgeAwardSchema = Type.Object({
  id: IdSchema,
  badgeKey: Type.String({ minLength: 1 }),
  category: BadgeCategorySchema,
  tier: Type.Integer({ minimum: 1, maximum: 3 }),
  title: Type.String({ minLength: 1 }),
  awardedAt: IsoDateTimeSchema,
});
export type BadgeAward = Static<typeof BadgeAwardSchema>;

export const GrowthProfileSchema = Type.Object({
  totalExp: Type.Integer({ minimum: 0 }),
  rank: ChefRankSchema,
  nextBadge: Type.Union([Type.Object({
    badgeKey: Type.String(),
    title: Type.String(),
    current: Type.Integer({ minimum: 0 }),
    target: Type.Integer({ minimum: 1 }),
  }), Type.Null()]),
});
export type GrowthProfile = Static<typeof GrowthProfileSchema>;

export const MealTaskStatusSchema = Type.Union([
  Type.Literal("needs_shopping"),
  Type.Literal("ready"),
  Type.Literal("cooking"),
  Type.Literal("needs_replan"),
  Type.Literal("complete"),
]);
export const MealTaskSchema = Type.Object({
  id: IdSchema,
  operationId: IdSchema,
  recipe: RecipePackageSchema,
  status: MealTaskStatusSchema,
  currentMeal: Type.Object({ date: DateOnlySchema, slot: MealSlotSchema, servings: Type.Integer({ minimum: 1 }) }),
  nextMeal: Type.Union([
    Type.Object({ strategy: Type.Literal("cook_extra"), date: DateOnlySchema, slot: MealSlotSchema, servings: Type.Integer({ minimum: 1 }) }),
    Type.Object({ strategy: Type.Literal("plan_separately"), date: DateOnlySchema, slot: MealSlotSchema, servings: Type.Integer({ minimum: 1 }) }),
    Type.Object({ strategy: Type.Literal("skip") }),
  ]),
  plannedTotalServings: Type.Integer({ minimum: 1 }),
  shortages: Type.Array(Type.Object({
    id: IdSchema,
    ingredientKey: Type.String(),
    name: Type.String(),
    quantity: Type.Number({ exclusiveMinimum: 0 }),
    unit: Type.String(),
    resolution: Type.Union([Type.Literal("needed"), Type.Literal("bought"), Type.Literal("unavailable"), Type.Literal("replaced")]),
  })),
  revision: Type.Integer({ minimum: 1 }),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});
export type MealTask = Static<typeof MealTaskSchema>;

export const OfflineOperationSchema = Type.Object({
  id: IdSchema,
  kind: Type.String(),
  payload: Type.Unknown(),
  status: Type.Union([Type.Literal("pending"), Type.Literal("synced"), Type.Literal("conflict")]),
  createdAt: IsoDateTimeSchema,
});
export type OfflineOperation = Static<typeof OfflineOperationSchema>;

export const SyncConflictSchema = Type.Object({
  id: IdSchema,
  operationId: IdSchema,
  kind: Type.String(),
  message: Type.String(),
  createdAt: IsoDateTimeSchema,
  resolvedAt: Type.Union([IsoDateTimeSchema, Type.Null()]),
});
export type SyncConflict = Static<typeof SyncConflictSchema>;

export const BetaInviteSchema = Type.Object({
  id: IdSchema,
  email: Type.String({ format: "email" }),
  status: Type.Union([Type.Literal("invited"), Type.Literal("accepted"), Type.Literal("revoked")]),
  invitedBy: IdSchema,
  createdAt: IsoDateTimeSchema,
  acceptedAt: Type.Union([IsoDateTimeSchema, Type.Null()]),
});
export type BetaInvite = Static<typeof BetaInviteSchema>;

export const SessionSchema = Type.Object({
  user: Type.Union([
    Type.Null(),
    Type.Object({
      id: IdSchema,
      email: Type.String({ format: "email" }),
      displayName: Type.String(),
    }),
  ]),
});
export type Session = Static<typeof SessionSchema>;

export const CookingOutcomeSchema = Type.Object({
  id: IdSchema,
  completionKey: IdSchema,
  mealName: Type.String(),
  source: Type.String(),
  ingredientCost: MoneySchema,
  servingsCooked: Type.Integer({ minimum: 1 }),
  servingsEaten: Type.Integer({ minimum: 0 }),
  expAwarded: Type.Integer({ minimum: 0 }),
  createdAt: IsoDateTimeSchema,
});
export type CookingOutcome = Static<typeof CookingOutcomeSchema>;

export const HabitProgressSchema = Type.Object({
  totalMeals: Type.Integer({ minimum: 0 }),
  weeklyCompletions: Type.Record(Type.String(), Type.Integer({ minimum: 0 })),
  events: Type.Array(
    Type.Object({
      outcomeId: IdSchema,
      createdAt: IsoDateTimeSchema,
      weekKey: DateOnlySchema,
    }),
  ),
});
export type HabitProgress = Static<typeof HabitProgressSchema>;

export const HealthAssetsSchema = Type.Object({
  healthyAutonomyMeals: Type.Integer({ minimum: 0 }),
  vegetableMeals: Type.Integer({ minimum: 0 }),
  lowOilMeals: Type.Integer({ minimum: 0 }),
  mindfulSeasoningMeals: Type.Integer({ minimum: 0 }),
  events: Type.Array(
    Type.Object({
      outcomeId: IdSchema,
      createdAt: IsoDateTimeSchema,
      vegetables: Type.Boolean(),
      lowOil: Type.Boolean(),
      mindfulSeasoning: Type.Boolean(),
      source: Type.Literal("self_reported"),
    }),
  ),
});
export type HealthAssets = Static<typeof HealthAssetsSchema>;

export const InventoryItemSchema = Type.Object({
  id: IdSchema,
  name: Type.String({ minLength: 1 }),
  ingredientKey: Type.String({ minLength: 1 }),
  chamber: Type.Union([Type.Literal("cold"), Type.Literal("frozen"), Type.Literal("pantry")]),
  qty: Type.Number({ minimum: 0 }),
  unit: Type.String(),
  daysLeft: Type.Integer({ minimum: 0 }),
  expiresOn: Type.Union([DateOnlySchema, Type.Null()]),
  lastConfirmedAt: IsoDateTimeSchema,
  image: Type.String(),
  addedDate: DateOnlySchema,
  estimatedValue: MoneySchema,
  /** @deprecated Read-only visual fallback until the fridge card migration is complete. */
  roi: Type.Optional(Type.Object({ savings: MoneySchema, sodium: MoneySchema, fat: MoneySchema })),
  storageProtocol: Type.String(),
  boxSize: Type.Union([
    Type.Literal("S"),
    Type.Literal("M"),
    Type.Literal("L"),
  ]),
});
export type InventoryItem = Static<typeof InventoryItemSchema>;

export const RescuePlanSchema = Type.Object({
  itemId: IdSchema,
  eatNow: Type.Object({
    title: Type.String(),
    detail: Type.String(),
    minutes: Type.Integer(),
    quantity: Type.Number(),
  }),
  preserve: Type.Object({
    title: Type.String(),
    detail: Type.String(),
    packages: Type.Integer(),
    days: Type.Integer(),
  }),
});
export type RescuePlan = Static<typeof RescuePlanSchema>;

export const ShoppingItemSchema = Type.Object({
  id: IdSchema,
  name: Type.String({ minLength: 1 }),
  category: Type.Union([
    Type.Literal("produce"),
    Type.Literal("protein"),
    Type.Literal("pantry"),
    Type.Literal("other"),
  ]),
  qty: Type.Number({ minimum: 0 }),
  unit: Type.String(),
  checked: Type.Boolean(),
  status: Type.String(),
  estCost: MoneySchema,
});
export type ShoppingItem = Static<typeof ShoppingItemSchema>;

export const ShoppingAnalysisRecommendationSchema = Type.Object({
  item: ShoppingItemSchema,
  action: Type.Union([
    Type.Literal("buy_now"),
    Type.Literal("buy_later"),
    Type.Literal("skip"),
  ]),
  reason: Type.String({ minLength: 1 }),
});
export type ShoppingAnalysisRecommendation = Static<typeof ShoppingAnalysisRecommendationSchema>;

export const ShoppingAnalysisSchema = Type.Object({
  summary: Type.String({ minLength: 1 }),
  recommendations: Type.Array(ShoppingAnalysisRecommendationSchema, { maxItems: 5 }),
  estimatedTotal: MoneySchema,
  budgetStatus: Type.Union([
    Type.Literal("within_budget"),
    Type.Literal("over_budget"),
    Type.Literal("unknown"),
  ]),
  source: Type.Union([Type.Literal("openrouter"), Type.Literal("rules")]),
  model: Type.Union([Type.String(), Type.Null()]),
  notice: Type.Union([Type.String(), Type.Null()]),
});
export type ShoppingAnalysis = Static<typeof ShoppingAnalysisSchema>;

export const RecipeSchema = Type.Object({
  catalogVersionId: Type.Optional(Type.String()),
  source: Type.Optional(Type.Union([Type.Literal("gemini"), Type.Literal("openrouter"), Type.Literal("brand_safe"), Type.Literal("catalog")])),
  id: IdSchema,
  title: Type.String(),
  style: Type.String(),
  prepTime: Type.String(),
  estCost: Type.String(),
  scientificPrinciple: Type.String(),
  ingredients: Type.Array(Type.String()),
  steps: Type.Array(Type.String()),
});
export type Recipe = Static<typeof RecipeSchema>;

export const FridgeProfileSchema = Type.Object({
  brand: Type.String(),
  model: Type.String(),
  capacityLiters: Type.Integer({ minimum: 0 }),
  coldRatio: Type.Number({ minimum: 0, maximum: 1 }),
  isConfigured: Type.Boolean(),
});
export type FridgeProfile = Static<typeof FridgeProfileSchema>;

export const CookwareProfileSchema = Type.Object({
  id: IdSchema,
  type: Type.String(),
  name: Type.String(),
  brand: Type.String(),
  model: Type.String(),
  capacity: Type.String(),
  wattage: Type.Integer({ minimum: 0 }),
});
export type CookwareProfile = Static<typeof CookwareProfileSchema>;

export const LoginRequestSchema = Type.Object({
  email: Type.String({ minLength: 3 }),
});
export const InventoryCreateSchema = Type.Omit(InventoryItemSchema, ["id"]);
export const RescueCommandSchema = Type.Object({
  action: Type.Union([
    Type.Literal("eat"),
    Type.Literal("preserve"),
    Type.Literal("discard"),
  ]),
  foodSafe: Type.Boolean(),
});
export const RecipeGenerateSchema = Type.Object({
  operationId: Type.Optional(IdSchema),
  ingredientIds: Type.Array(IdSchema, { minItems: 1 }),
  style: Type.Optional(Type.String()),
  excludeTitle: Type.Optional(Type.String()),
});
export const CookingOutcomeCommandSchema = Type.Object({
  completionKey: IdSchema,
  mealTaskId: Type.Optional(IdSchema),
  recipe: RecipeSchema,
  ingredientIds: Type.Array(IdSchema),
  ingredientCost: MoneySchema,
  comparisonMealPrice: Type.Optional(MoneySchema),
  trackCost: Type.Boolean(),
  foodSafe: Type.Boolean(),
  vegetables: Type.Boolean(),
  lowOil: Type.Boolean(),
  mindfulSeasoning: Type.Boolean(),
  usedExpiringIngredient: Type.Boolean(),
  completedDoubleMeal: Type.Boolean(),
  servingsCooked: Type.Optional(Type.Integer({ minimum: 1, maximum: 20 })),
  servingsEaten: Type.Optional(Type.Integer({ minimum: 0, maximum: 20 })),
  ingredientRequirements: Type.Optional(Type.Array(IngredientRequirementSchema)),
});
export const ShoppingWriteSchema = Type.Object({
  id: Type.Optional(IdSchema),
  name: Type.String({ minLength: 1 }),
  category: Type.Optional(ShoppingItemSchema.properties.category),
  qty: Type.Optional(Type.Number({ minimum: 0 })),
  unit: Type.Optional(Type.String()),
  checked: Type.Optional(Type.Boolean()),
  status: Type.Optional(Type.String()),
  estCost: Type.Optional(MoneySchema),
});
export const ShoppingParseSchema = Type.Object({
  text: Type.String({ minLength: 1 }),
});
export const ShoppingAnalyzeSchema = Type.Object({ operationId: IdSchema });
export const ReceiptRecognizeSchema = Type.Object({ operationId: Type.Optional(IdSchema) });
export interface AppState {
  version: 2;
  session: Session;
  growth: GrowthProfile;
  weeklyGoal: WeeklyGoal;
  expEvents: ExpEvent[];
  badgeAwards: BadgeAward[];
  cookingOutcomes: CookingOutcome[];
  habitProgress: HabitProgress;
  healthAssets: HealthAssets;
  inventory: InventoryItem[];
  shoppingItems: ShoppingItem[];
  fridgeProfile: FridgeProfile;
  cookware: CookwareProfile[];
  onboardingProfile?: OnboardingProfile;
  mealPlan?: MealPlan;
  receipts?: Receipt[];
  recipePackages?: RecipePackage[];
  recipeFavoriteIds?: string[];
  cookingSessions?: CookingSession[];
  mealServings?: MealServing[];
  cookingCosts?: CookingCostRecord[];
  mealTasks?: MealTask[];
  recipeAdjustmentPreviews?: RecipeAdjustmentPreview[];
  reminderPreferences?: ReminderPreferences;
  chefChatSessions?: ChefChatSession[];
  offlineOperations?: OfflineOperation[];
  syncConflicts?: SyncConflict[];

}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
    requestId: string;
  };
}
export type ApiSuccess<T> = { data: T };

export const RecipeModeSchema = Type.Union([Type.Literal('inventory_only'), Type.Literal('small_purchase')]);
export type RecipeMode = Static<typeof RecipeModeSchema>;
export const RecipePreferencesSchema = Type.Object({
  purchaseBudget: MoneySchema,
  confirmed: Type.Boolean(),
  version: Type.Integer({ minimum: 0 }),
});
export type RecipePreferences = Static<typeof RecipePreferencesSchema>;
export const RecipeRecommendationRequestSchema = Type.Object({
  mode: RecipeModeSchema,
  purchaseBudget: MoneySchema,
  allowRepeat: Type.Optional(Type.Boolean()),
  energy: Type.Optional(Type.Union([Type.Literal('low'), Type.Literal('normal')])),
});
export type RecipeRecommendationRequest = Static<typeof RecipeRecommendationRequestSchema>;
export const IngredientPriceSchema = Type.Object({
  id: Type.String(), ingredientKey: Type.String({ minLength: 1 }), name: Type.String({ minLength: 1 }),
  packageQuantity: Type.Number({ exclusiveMinimum: 0 }), unit: Type.String({ minLength: 1 }),
  price: MoneySchema, source: Type.String({ minLength: 1 }), observedAt: IsoDateTimeSchema,
});
export type IngredientPrice = Static<typeof IngredientPriceSchema>;
export interface PurchaseRequirement {
  ingredientKey: string; name: string; quantity: number; unit: string;
  packages: number | null; purchaseQuantity: number | null; estimatedCost: number | null;
  priceId: string | null; priceObservedAt: string | null;
}
export interface RecipeRecommendation {
  recipe: RecipePackage; missing: PurchaseRequirement[];
  estimatedPurchaseCost: number | null;
  budgetStatus: 'within_budget' | 'unknown';
  issues: string[];
}
export interface RecipeRecommendations {
  eligible: RecipeRecommendation[]; needsConfirmation: RecipeRecommendation[];
  notice: string; mode: RecipeMode;
}

export const RecipeSearchRequestSchema = Type.Object({
  query: Type.String({ maxLength: 120 }),
  ingredientKeywords: Type.Array(Type.String({ minLength: 1, maxLength: 40 }), { maxItems: 10 }),
  category: Type.Optional(Type.Union([
    Type.Literal("quick"),
    Type.Literal("fridge_rescue"),
    Type.Literal("new_flavor"),
    Type.Literal("favorites"),
  ])),
});
export type RecipeSearchRequest = Static<typeof RecipeSearchRequestSchema>;
export interface RecipeSearchItem extends RecipeRecommendation {
  matchedKeywords: string[];
  match: "all" | "partial" | "none";
  favorite: boolean;
}
export interface RecipeSearchResult { items: RecipeSearchItem[]; notice: string }

export const RecipeAdjustmentRequestSchema = Type.Object({
  operationId: IdSchema,
  servings: Type.Integer({ minimum: 1, maximum: 20 }),
  replacementRequests: Type.Array(Type.Object({
    ingredientKey: Type.String({ minLength: 1 }),
    requestedReplacement: Type.String({ minLength: 1 }),
  }), { maxItems: 8 }),
  context: Type.String({ maxLength: 500 }),
});
export type RecipeAdjustmentRequest = Static<typeof RecipeAdjustmentRequestSchema>;
export interface RecipeAdjustmentPreview {
  previewId: string;
  originalRecipeId: string;
  adjustedRecipe: RecipePackage;
  changes: Array<{ field: string; before: string; after: string; reason: string }>;
  missing: PurchaseRequirement[];
  safetyChecks: string[];
  source: "openrouter" | "rules";
  expiresAt: string;
}

export const MealTaskCreateSchema = Type.Object({
  operationId: IdSchema,
  recipePackageId: IdSchema,
  adjustmentPreviewId: Type.Optional(IdSchema),
  currentMeal: Type.Object({ date: DateOnlySchema, slot: MealSlotSchema, servings: Type.Integer({ minimum: 1, maximum: 20 }) }),
  nextMeal: Type.Union([
    Type.Object({ strategy: Type.Literal("cook_extra"), date: DateOnlySchema, slot: MealSlotSchema, servings: Type.Integer({ minimum: 1, maximum: 20 }) }),
    Type.Object({ strategy: Type.Literal("plan_separately"), date: DateOnlySchema, slot: MealSlotSchema, servings: Type.Integer({ minimum: 1, maximum: 20 }) }),
    Type.Object({ strategy: Type.Literal("skip") }),
  ]),
});
export type MealTaskCreate = Static<typeof MealTaskCreateSchema>;

export const WeeklyGoalPatchSchema = Type.Object({
  metric: WeeklyGoalMetricSchema,
  target: Type.Integer({ minimum: 1, maximum: 21 }),
});

export const ChefChatMessageSchema = Type.Object({
  id: IdSchema,
  role: Type.Union([Type.Literal("user"), Type.Literal("assistant"), Type.Literal("system")]),
  content: Type.String({ minLength: 1, maxLength: 4000 }),
  createdAt: IsoDateTimeSchema,
});
export type ChefChatMessage = Static<typeof ChefChatMessageSchema>;
export interface ChefChatSession {
  id: string;
  title: string;
  messages: ChefChatMessage[];
  source: "openrouter" | "rules";
  createdAt: string;
  updatedAt: string;
}
export const ChefChatSendSchema = Type.Object({
  operationId: IdSchema,
  message: Type.String({ minLength: 1, maxLength: 2000 }),
});

export const PushSubscriptionWriteSchema = Type.Object({
  endpoint: Type.String({ minLength: 1 }),
  p256dh: Type.String({ minLength: 1 }),
  auth: Type.String({ minLength: 1 }),
});
export const PushSubscriptionDeleteSchema = Type.Object({
  endpoint: Type.String({ minLength: 1 }),
});
export const PreparedServingEatSchema = Type.Object({
  operationId: IdSchema,
});

export const ContractSchemas = {
  LoginRequestSchema,
  InventoryCreateSchema,
  RescueCommandSchema,
  RecipeGenerateSchema,
  CookingOutcomeCommandSchema,
  ShoppingWriteSchema,
  ShoppingParseSchema,
  ShoppingAnalyzeSchema,
  ReceiptRecognizeSchema,
  ShoppingAnalysisSchema,
  FridgeProfileSchema,
  CookwareListSchema: Type.Array(CookwareProfileSchema),
  DietaryRestrictionSchema,
  OnboardingProfileSchema,
  MealPlanSchema,
  PlannedMealSchema,
  ReceiptSchema,
  ReceiptItemSchema,
  ReceiptRecognitionSchema,
  RecipePackageSchema,
  RecipeGenerationSchema,
  TodayDecisionSchema,
  MealPlanCreateSchema,
  MealPostponeSchema,
  CookingSessionSchema,
  CookingCostRecordSchema,
  ExpEventSchema,
  WeeklyGoalSchema,
  BadgeAwardSchema,
  GrowthProfileSchema,
  MealTaskSchema,
  MealTaskCreateSchema,
  RecipeSearchRequestSchema,
  RecipeAdjustmentRequestSchema,
  WeeklyGoalPatchSchema,
  ReminderPreferencesPatchSchema,
  ChefChatSendSchema,
  PushSubscriptionWriteSchema,
  PushSubscriptionDeleteSchema,
  PreparedServingEatSchema,
  ReminderPreferencesSchema,
  OfflineOperationSchema,
  BetaInviteSchema,
};
export interface CatalogVersion {
  id: string; familyId: string; status: 'candidate' | 'published' | 'quarantined' | 'rejected';
  recipe: RecipePackage; createdAt: string; reasons: string[];
}
export interface CatalogReview { pass: boolean; reasons: string[]; ruleVersion: string }
export interface CatalogAdminState {
  versions: CatalogVersion[]; prices: IngredientPrice[];
  paused: boolean; month: string; spentTwd: number; reservedTwd: number; catalogBudgetTwd: number;
  interactiveUsage: Array<{ feature:'shopping_analysis'|'recipe_generation'|'receipt_ocr'; spentTwd:number; reservedTwd:number; budgetTwd:number; dailyUserLimit:number }>;
  globalSpentTwd:number; globalReservedTwd:number; globalBudgetTwd:number;
  candidateCount: number; candidateLimit: number; failedJobCount: number;
  stalePriceCount: number; expiringPriceCount: number;
  lastRunAt: string | null; alerts: string[];
  jobs: Array<{ id:string; status:string; attempts:number; error:string|null; createdAt:string; versionId:string|null }>;
  reports: Array<{ id:string; versionId:string; title:string; safety:boolean; message:string; createdAt:string; processedAt:string|null }>;
}
export const SyncRequestSchema = Type.Object({ operations: Type.Array(Type.Object({
  id: Type.String({ format: 'uuid' }), kind: Type.Literal('cooking_complete'), payload: CookingOutcomeCommandSchema,
}), { maxItems: 20 }) });
export interface SyncResult { results: Array<{id: string; status: 'synced' | 'conflict'; message?: string}> }
