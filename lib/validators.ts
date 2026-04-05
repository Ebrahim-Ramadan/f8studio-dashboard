import { z } from "zod";

const existingImageSchema = z.object({
  id: z.string().uuid(),
  filename: z.string().trim().min(1).max(300),
  mimeType: z.string().trim().min(1).max(120)
});

const newImageSchema = z.object({
  filename: z.string().trim().min(1).max(300),
  mimeType: z.string().trim().min(1).max(120),
  dataBase64: z.string().trim().min(1)
});

export const projectImageInputSchema = z.union([existingImageSchema, newImageSchema]);

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(140),
  description: z.string().trim().min(1, "Description is required").max(5000),
  images: z.array(projectImageInputSchema).min(1, "At least one image is required")
});
