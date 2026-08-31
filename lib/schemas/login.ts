import { z } from "zod";
import { email } from "./common";

export const loginSchema = z.object({
  email: email("Email"),
  password: z
    .string()
    .min(1, { message: "Password is required." })
    .max(72, { message: "Password is too long (max 72 characters)." }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
