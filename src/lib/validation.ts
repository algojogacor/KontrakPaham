import { z } from "zod";

// Username: 3-32 chars, alfanumerik + underscore + titik + hyphen
export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username minimal 3 karakter")
  .max(32, "Username maksimal 32 karakter")
  .regex(
    /^[a-zA-Z0-9_.-]+$/,
    "Username hanya boleh huruf, angka, titik, strip, dan underscore"
  );

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Format email tidak valid")
  .max(254, "Email terlalu panjang");

export const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .max(128, "Password maksimal 128 karakter")
  .refine((v) => /[a-zA-Z]/.test(v), "Password harus mengandung huruf")
  .refine((v) => /\d/.test(v), "Password harus mengandung angka");

export const signupSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    displayName: z.string().trim().max(64).optional(),
  })
  .refine((d) => d.username.toLowerCase() !== d.email, {
    message: "Username tidak boleh sama dengan email",
    path: ["username"],
  });

export const signinSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Masukkan username atau email")
    .max(254, "Input terlalu panjang"),
  password: z.string().min(1, "Password wajib diisi").max(128),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, "Token tidak valid"),
    password: passwordSchema,
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: passwordSchema,
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "Password baru tidak boleh sama dengan password lama",
    path: ["newPassword"],
  });

// Sanitize free text to mitigate stored XSS when rendered as HTML.
// We strip angle-bracket tags. (Our UI renders text, not dangerouslySetInnerHTML.)
export function sanitizeText(input: string): string {
  return input
    .replace(/<\/?[^>]+>/g, "") // strip HTML tags
    .replace(/\u0000/g, "") // strip null bytes
    .slice(0, 200_000); // hard cap
}

// Contract text validation
export const contractTextSchema = z
  .string()
  .transform((s) => sanitizeText(s))
  .pipe(
    z
      .string()
      .min(120, "Teks kontrak terlalu pendek (minimal 120 karakter). Pastikan Anda menyalin kontrak lengkap.")
      .max(100_000, "Teks kontrak terlalu panjang (maksimal 100.000 karakter).")
  );

export function formatZodErrors(error: z.ZodError): string {
  const issues = error.issues;
  if (issues.length === 0) return "Input tidak valid";
  return issues
    .map((i) => {
      const field = i.path.length > 0 ? i.path.join(".") : "input";
      return `${field}: ${i.message}`;
    })
    .join("; ");
}
