import { z } from "zod";

/* ============================================
 * AUTH
 * ============================================ */

export const phoneSchema = z
  .string()
  .min(8, "Número muy corto")
  .max(20, "Número muy largo")
  .regex(/^[\d\s\+\-\(\)]+$/, "Formato inválido");

export const emailSchema = z.string().email("Email inválido").toLowerCase();

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "Mínimo 6 caracteres"),
  fullName: z.string().min(2, "Ingresá tu nombre").max(80),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const otpSchema = z.object({
  email: emailSchema,
  token: z.string().length(6, "El código tiene 6 dígitos"),
  type: z.enum(["email", "signup"]).default("email"),
});
export type OtpInput = z.infer<typeof otpSchema>;

export const signupSchema = z.object({
  email: emailSchema,
  fullName: z.string().min(2, "Ingresá tu nombre").max(80),
  phone: phoneSchema.optional().or(z.literal("")),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});
export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;

export const newPasswordSchema = z
  .object({
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  });
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;

/* ============================================
 * STORE ONBOARDING
 * ============================================ */

export const storeBasicSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto").max(80),
  description: z.string().max(280, "Máximo 280 caracteres").optional().or(z.literal("")),
  categoryId: z.string().uuid("Elegí una categoría"),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal("")),
});
export type StoreBasicInput = z.infer<typeof storeBasicSchema>;

export const storeAddressSchema = z.object({
  address: z.string().min(5, "Dirección muy corta").max(200),
  lat: z.number().optional(),
  lng: z.number().optional(),
  deliveryRadiusKm: z.coerce.number().min(0.5).max(50).default(5),
});
export type StoreAddressInput = z.infer<typeof storeAddressSchema>;

export const storeOperationSchema = z.object({
  minOrderAmount: z.coerce.number().min(0).default(0),
  deliveryFee: z.coerce.number().min(0).default(0),
  avgPrepMinutes: z.coerce.number().int().min(5).max(180).default(25),
  acceptsCash: z.boolean().default(true),
  acceptsMp: z.boolean().default(true),
});
export type StoreOperationInput = z.infer<typeof storeOperationSchema>;

export const storeProfileSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto").max(80),
  description: z.string().max(280, "Máximo 280 caracteres").optional().or(z.literal("")),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal("")),
});
export type StoreProfileInput = z.infer<typeof storeProfileSchema>;

export const storePaymentsSchema = z.object({
  mpAccessToken: z
    .string()
    .regex(/^(TEST-|APP_USR-)/, "El token debe empezar con TEST- o APP_USR-")
    .optional()
    .or(z.literal("")),
});
export type StorePaymentsInput = z.infer<typeof storePaymentsSchema>;

export const storeCommissionSchema = z.object({
  commissionPct: z.coerce.number().min(0).max(30),
});
export type StoreCommissionInput = z.infer<typeof storeCommissionSchema>;

export const storeNotificationsSchema = z
  .object({
    whatsappEnabled: z.boolean(),
    whatsappNumber: z
      .string()
      .regex(/^\+[1-9]\d{7,14}$/, "Usá formato internacional: +5491122223333")
      .optional()
      .or(z.literal("")),
  })
  .refine((d) => !d.whatsappEnabled || !!d.whatsappNumber, {
    message: "Para activar WhatsApp cargá tu número",
    path: ["whatsappEnabled"],
  });
export type StoreNotificationsInput = z.infer<typeof storeNotificationsSchema>;

/* ============================================
 * PRODUCTS
 * ============================================ */

export const productSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(280).optional().or(z.literal("")),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).optional(),
  productCategoryId: z.string().uuid().optional(),
  isAvailable: z.boolean().default(true),
});
export type ProductInput = z.infer<typeof productSchema>;

/* ============================================
 * CART / ORDER
 * ============================================ */

export const addToCartSchema = z.object({
  storeId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(20),
  modifiers: z.array(z.object({
    optionId: z.string().uuid(),
    name: z.string(),
    priceDelta: z.number(),
  })).default([]),
  notes: z.string().max(200).optional(),
});
export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const checkoutSchema = z.object({
  storeId: z.string().uuid(),
  addressId: z.string().uuid("Elegí una dirección"),
  paymentMethod: z.enum(["cash", "mercadopago"]),
  customerNotes: z.string().max(280).optional(),
  promoCode: z.string().optional(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;