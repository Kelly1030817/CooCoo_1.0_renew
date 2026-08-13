import { z } from 'zod';

export const shoppingAssistantSchema = z.object({
  query: z.string().optional(),
  items: z.array(z.any()).optional()
});
