import { z } from "zod";
import { AWS_REGIONS } from "./constants";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  jobTitle: z.string().trim().max(120).optional().or(z.literal("")),
  monthlyBudget: z.coerce.number().min(100, "Budget must be at least $100").max(100_000_000),
});

export const ROLE_ARN_REGEX = /^arn:aws:iam::(\d{12}):role\/[\w+=,.@\-/]{1,128}$/;

export const connectionSchema = z.object({
  name: z.string().trim().min(2, "Give this connection a name").max(60),
  roleArn: z.string().trim().regex(ROLE_ARN_REGEX, "Enter a valid IAM Role ARN, e.g. arn:aws:iam::123456789012:role/CloudPulseReadOnly"),
  externalId: z.string().trim().min(8, "External ID must be at least 8 characters").max(128),
  accessKeyId: z
    .string()
    .trim()
    .regex(/^(AKIA|ASIA)[A-Z0-9]{16}$/, "Access Key ID must look like AKIAXXXXXXXXXXXXXXXX")
    .optional()
    .or(z.literal("")),
  region: z.enum(AWS_REGIONS),
});

export const alertUpdateSchema = z.object({
  ids: z.array(z.string().min(1)).max(500).optional(),
  all: z.boolean().optional(),
  read: z.boolean().default(true),
});

export const costQuerySchema = z.object({
  range: z.enum(["7d", "30d", "90d", "180d"]).default("30d"),
});
