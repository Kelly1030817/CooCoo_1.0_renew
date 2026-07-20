import { Type, type Static } from "@sinclair/typebox";

export const IdSchema = Type.String({ minLength: 1 });
export const IsoDateTimeSchema = Type.String({ format: "date-time" });
export const DateOnlySchema = Type.String({
  pattern: "^\\d{4}-\\d{2}-\\d{2}$",
});
export const MoneySchema = Type.Integer({ minimum: 0 });

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

export const RecipeSchema = Type.Object({
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
  FridgeProfileSchema,
  CookwareListSchema: Type.Array(CookwareProfileSchema),
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
