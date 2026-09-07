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

export const OnboardingProfileSchema = Type.Object({
  status: Type.Union([Type.Literal("draft"), Type.Literal("complete")]),
  currentStep: Type.Integer({ minimum: 1, maximum: 10 }),
  householdServings: Type.Integer({ minimum: 1, maximum: 12 }),
  cookware: Type.Array(Type.Object({
    type: Type.String({ minLength: 1 }),
    capacity: Type.Optional(Type.String()),
    limitations: Type.Array(Type.String()),
  })),
  restrictions: Type.Array(DietaryRestrictionSchema),
  preferredFlavors: Type.Array(Type.String()),
  inventoryReviewed: Type.Boolean(),
  hasNoInventory: Type.Boolean(),
  dailyMealBudget: MoneySchema,
  outsideMealComparisonPrice: MoneySchema,
  plannedMealSlots: Type.Array(MealSlotSchema, { minItems: 1 }),
  weeklyHomeCookTarget: Type.Integer({ minimum: 1, maximum: 21 }),
  dreamName: Type.String({ minLength: 1 }),
  dreamTargetAmount: MoneySchema,
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
  source: Type.Optional(Type.Union([Type.Literal("gemini"), Type.Literal("brand_safe"), Type.Literal("catalog")])),
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
  source: Type.Union([Type.Literal("gemini"), Type.Literal("brand_safe"), Type.Literal("catalog")]),
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

export const SavingsEventSchema = Type.Object({
  id: IdSchema,
  cookingSessionId: IdSchema,
  outsideMealPrice: MoneySchema,
  actualIngredientCost: MoneySchema,
  confirmedAmount: MoneySchema,
  createdAt: IsoDateTimeSchema,
});
export type SavingsEvent = Static<typeof SavingsEventSchema>;

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

export const GoalMilestoneSchema = Type.Object({
  id: IdSchema,
  label: Type.String(),
  percent: Type.Number({ minimum: 0, maximum: 100 }),
  targetAmount: MoneySchema,
  completedAt: Type.Optional(Type.Union([IsoDateTimeSchema, Type.Null()])),
});
export type GoalMilestone = Static<typeof GoalMilestoneSchema>;

export const MoneyGoalSchema = Type.Object({
  id: IdSchema,
  purpose: Type.String(),
  name: Type.String(),
  targetAmount: MoneySchema,
  targetDate: Type.Union([DateOnlySchema, Type.Null()]),
  status: Type.Union([
    Type.Literal("active"),
    Type.Literal("completed"),
    Type.Literal("archived"),
  ]),
  createdAt: IsoDateTimeSchema,
  completedAt: Type.Union([IsoDateTimeSchema, Type.Null()]),
  milestones: Type.Array(GoalMilestoneSchema),
});
export type MoneyGoal = Static<typeof MoneyGoalSchema>;

export const AmountEventSchema = Type.Object({
  id: IdSchema,
  goalId: IdSchema,
  outcomeId: Type.Optional(IdSchema),
  type: Type.Union([
    Type.Literal("opening_balance"),
    Type.Literal("balance_adjustment"),
    Type.Literal("meal_deposit"),
    Type.Literal("extra_deposit"),
  ]),
  amount: Type.Integer(),
  createdAt: IsoDateTimeSchema,
});
export type AmountEvent = Static<typeof AmountEventSchema>;

export const CookingPlanSchema = Type.Object({
  eatingOutMeals: Type.Integer({ minimum: 0 }),
  eatingOutTotal: MoneySchema,
  eatingOutCost: MoneySchema,
  homeCookBudget: MoneySchema,
  weeklyCookingMeals: Type.Integer({ minimum: 0, maximum: 21 }),
  estimatedSavingPerMeal: MoneySchema,
  updatedAt: IsoDateTimeSchema,
});
export type CookingPlan = Static<typeof CookingPlanSchema>;

export const CookingOutcomeSchema = Type.Object({
  id: IdSchema,
  completionKey: IdSchema,
  goalId: Type.Union([IdSchema, Type.Null()]),
  mealName: Type.String(),
  source: Type.String(),
  eatingOutCost: MoneySchema,
  homeCookCost: MoneySchema,
  estimatedSaving: MoneySchema,
  actualDeposit: MoneySchema,
  mealDeposit: MoneySchema,
  extraDeposit: MoneySchema,
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
  chamber: Type.Union([Type.Literal("cold"), Type.Literal("frozen")]),
  qty: Type.Number({ minimum: 0 }),
  unit: Type.String(),
  daysLeft: Type.Integer({ minimum: 0 }),
  image: Type.String(),
  addedDate: DateOnlySchema,
  roi: Type.Object({
    savings: MoneySchema,
    sodium: MoneySchema,
    fat: MoneySchema,
  }),
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
  source: Type.Optional(Type.Union([Type.Literal("gemini"), Type.Literal("brand_safe"), Type.Literal("catalog")])),
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

export const GoalDraftSchema = Type.Object({
  purpose: Type.String(),
  name: Type.String({ minLength: 1 }),
  targetAmount: MoneySchema,
  currentSavedAmount: MoneySchema,
  targetDate: Type.Optional(Type.Union([DateOnlySchema, Type.Null()])),
  eatingOutMeals: Type.Integer({ minimum: 0 }),
  eatingOutTotal: MoneySchema,
  directEatingOutCost: Type.Optional(MoneySchema),
  homeCookBudget: MoneySchema,
  weeklyCookingMeals: Type.Integer({ minimum: 0, maximum: 21 }),
  shortPercent: Type.Optional(Type.Number()),
  mediumPercent: Type.Optional(Type.Number()),
  shortLabel: Type.Optional(Type.String()),
  mediumLabel: Type.Optional(Type.String()),
  longLabel: Type.Optional(Type.String()),
});
export const LoginRequestSchema = Type.Object({
  email: Type.String({ minLength: 3 }),
});
export const GoalPatchSchema = Type.Partial(
  Type.Object({
    targetAmount: MoneySchema,
    targetDate: Type.Union([DateOnlySchema, Type.Null()]),
    desiredSaved: MoneySchema,
    homeCookBudget: MoneySchema,
    weeklyCookingMeals: Type.Integer({ minimum: 0, maximum: 21 }),
  }),
);
export const AmountEventCommandSchema = Type.Object({
  desiredSaved: MoneySchema,
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
  ingredientIds: Type.Array(IdSchema, { minItems: 1 }),
  style: Type.Optional(Type.String()),
  excludeTitle: Type.Optional(Type.String()),
});
export const CookingOutcomeCommandSchema = Type.Object({
  completionKey: IdSchema,
  recipe: RecipeSchema,
  ingredientIds: Type.Array(IdSchema),
  homeCookCost: MoneySchema,
  actualDeposit: MoneySchema,
  foodSafe: Type.Boolean(),
  vegetables: Type.Boolean(),
  lowOil: Type.Boolean(),
  mindfulSeasoning: Type.Boolean(),
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
export const ContractSchemas = {
  LoginRequestSchema,
  GoalDraftSchema,
  GoalPatchSchema,
  AmountEventCommandSchema,
  InventoryCreateSchema,
  RescueCommandSchema,
  RecipeGenerateSchema,
  CookingOutcomeCommandSchema,
  ShoppingWriteSchema,
  ShoppingParseSchema,
  ShoppingAnalyzeSchema,
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
  SavingsEventSchema,
  OfflineOperationSchema,
  BetaInviteSchema,
};

export interface AppState {
  version: 1;
  session: Session;
  activeGoal: MoneyGoal | null;
  archivedGoals: MoneyGoal[];
  amountEvents: AmountEvent[];
  cookingPlan: CookingPlan | null;
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
  cookingSessions?: CookingSession[];
  mealServings?: MealServing[];
  savingsEvents?: SavingsEvent[];
  offlineOperations?: OfflineOperation[];
  syncConflicts?: SyncConflict[];
}

export type GoalDraft = Static<typeof GoalDraftSchema>;

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
export interface CatalogVersion {
  id: string; familyId: string; status: 'candidate' | 'published' | 'quarantined' | 'rejected';
  recipe: RecipePackage; createdAt: string; reasons: string[];
}
export interface CatalogReview { pass: boolean; reasons: string[]; ruleVersion: string }
export interface CatalogAdminState {
  versions: CatalogVersion[]; prices: IngredientPrice[];
  paused: boolean; month: string; spentTwd: number; reservedTwd: number; candidateCount: number;
  lastRunAt: string | null; alerts: string[];
  reports: Array<{ id:string; versionId:string; title:string; safety:boolean; message:string; createdAt:string; processedAt:string|null }>;
}
export const SyncRequestSchema = Type.Object({ operations: Type.Array(Type.Object({
  id: Type.String({ format: 'uuid' }), kind: Type.Literal('cooking_complete'), payload: CookingOutcomeCommandSchema,
}), { maxItems: 20 }) });
export interface SyncResult { results: Array<{id: string; status: 'synced' | 'conflict'; message?: string}> }
