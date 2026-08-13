import { z } from 'zod';

export const addInventorySchema = z.object({
  name: z.string(),
  chamber: z.enum(['cold', 'frozen']),
  qty: z.union([z.number(), z.string()]),
  unit: z.string(),
  daysLeft: z.number(),
  boxSize: z.string().optional()
});
