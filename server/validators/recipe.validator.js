import { z } from 'zod';

export const generateRecipeSchema = z.object({
  ingredients: z.array(z.string()).min(1, 'At least one ingredient is required'),
  style: z.string().optional(),
  excludeTitle: z.string().optional()
});
