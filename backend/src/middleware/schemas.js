'use strict';
const { z } = require('zod');

// ── Reusable primitives ────────────────────────────────────────────────────────

// Safe text: strips leading/trailing whitespace, rejects HTML tags, limits length
const safeText = (min = 1, max = 500) =>
  z.string()
    .min(min, `Must be at least ${min} character(s)`)
    .max(max, `Must be at most ${max} characters`)
    .transform(v => v.trim())
    .refine(v => !/<[^>]*>/.test(v), { message: 'HTML tags are not allowed' })
    .refine(v => !/javascript:/i.test(v), { message: 'Invalid input' })
    .refine(v => !/on\w+\s*=/i.test(v), { message: 'Invalid input' })
    .refine(v => !/data:/i.test(v), { message: 'Invalid input' })
    .refine(v => !/<script/i.test(v), { message: 'Scripts are not allowed' })
    .refine(v => !/eval\s*\(/i.test(v), { message: 'Invalid input' })
    .refine(v => !/expression\s*\(/i.test(v), { message: 'Invalid input' })
    .refine(v => !/<iframe/i.test(v), { message: 'Iframes are not allowed' })
    .refine(v => !/<object/i.test(v), { message: 'Objects are not allowed' })
    .refine(v => !/<embed/i.test(v), { message: 'Embeds are not allowed' });

const safeEmail = () =>
  z.string()
    .email('Invalid email address')
    .max(254)
    .transform(v => v.trim().toLowerCase());

const safePhone = () =>
  z.string()
    .regex(/^\+?[0-9\s\-]{7,20}$/, 'Invalid phone number')
    .transform(v => v.trim().replace(/\s+/g, ''));

const safeUUID = () => z.string().uuid('Invalid identifier');

const safeRating = () =>
  z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5');

const safePassword = () =>
  z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .refine(v => /[!@#$%^&*()\-_=+\[\]{}|;:'",.<>?\/\\`~]/.test(v), {
      message: 'Password must include at least one special character',
    });

// ── Auth schemas ───────────────────────────────────────────────────────────────

const registerSchema = z.object({
  full_name: safeText(3, 100)
    .refine(v => v.trim().split(/\s+/).length >= 2, {
      message: 'Please provide your full name — first and last name required',
    }),
  email: safeEmail(),
  phone: safePhone(),
  password: safePassword(),
});

const loginSchema = z.object({
  email: safeEmail(),
  password: z.string().min(1).max(128),
});

const forgotPasswordSchema = z.object({
  email: safeEmail(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  new_password: safePassword(),
});

const updateProfileSchema = z.object({
  full_name: safeText(3, 100).optional(),
  first_name: safeText(1, 60).optional(),
  last_name: safeText(1, 60).optional(),
  phone: safePhone().optional(),
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1).max(128),
  new_password: safePassword(),
});

// ── Order schemas ──────────────────────────────────────────────────────────────

const createOrderSchema = z.object({
  first_name: safeText(1, 60),
  last_name: safeText(1, 60),
  email: safeEmail(),
  phone: safePhone(),
  delivery_address: safeText(5, 500),
  delivery_note: safeText(0, 300).optional().nullable(),
  gift_note: safeText(0, 300).optional().nullable(),
  delivery_zone_id: safeUUID().optional().nullable(),
  items: z.array(z.object({
    product_id: safeUUID(),
    variant_id: safeUUID(),
    quantity: z.number().int().min(1).max(50),
  })).min(1).max(20),
  payment_method: z.enum(['mtn_momo', 'airtel', 'cash_on_delivery']),
  consent_given: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms to proceed' }),
  }),
});

const cancelOrderSchema = z.object({
  reason: safeText(5, 500),
});

// ── Review schema ──────────────────────────────────────────────────────────────

const createReviewSchema = z.object({
  name: safeText(2, 80),
  rating: safeRating(),
  comment: safeText(5, 1000),
  tracking_token: z.string().min(10).max(200).optional(),
});

// ── Loyalty schema ─────────────────────────────────────────────────────────────

const loyaltyApplySchema = z.object({
  delivery_address: safeText(5, 500),
  contact_phone: safePhone(),
});

// ── Newsletter schema ──────────────────────────────────────────────────────────

const newsletterSubscribeSchema = z.object({
  email: safeEmail(),
  name: safeText(2, 100),
});

// ── Message schema ─────────────────────────────────────────────────────────────

const createMessageSchema = z.object({
  order_id: safeUUID().optional(),
  body: safeText(1, 2000),
  email: safeEmail().optional(),
  name: safeText(1, 100).optional(),
  subject: safeText(1, 200).optional(),
});

// ── Admin schemas ──────────────────────────────────────────────────────────────

const adminLoginSchema = z.object({
  email: safeEmail(),
  password: z.string().min(1).max(128),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'en_route', 'delivered', 'cancelled']),
});

const adminCreateProductSchema = z.object({
  name: safeText(2, 100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  subtitle: safeText(0, 200).optional().nullable(),
  description: safeText(0, 2000).optional().nullable(),
  tasting_notes: safeText(0, 1000).optional().nullable(),
  category_id: z.number().int().positive().optional().nullable(),
  base_price: z.number().min(0).max(10_000_000),
  off_peak_price: z.number().min(0).max(10_000_000).optional().nullable(),
  is_featured: z.boolean().optional(),
  is_limited: z.boolean().optional(),
  is_box_item: z.boolean().optional(),
  variants: z.array(z.object({
    label: safeText(1, 100),
    price: z.number().min(0).max(10_000_000),
    stock_qty: z.number().int().min(0),
    is_default: z.boolean().optional(),
  })).optional(),
  items: z.array(safeText(1, 200)).optional(),
});

// Returns true only when str is a genuinely existing calendar date (catches Feb 30 etc.)
const isValidCalendarDate = (str) => {
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(y, m - 1, d); // local constructor — no UTC coercion
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

const specialDayCreateSchema = z.object({
  label: safeText(2, 100),
  date_from: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date_from must be YYYY-MM-DD')
    .refine(isValidCalendarDate, { message: 'date_from is not a valid calendar date' }),
  date_to: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date_to must be YYYY-MM-DD')
    .refine(isValidCalendarDate, { message: 'date_to is not a valid calendar date' }),
}).refine(data => new Date(data.date_to) >= new Date(data.date_from), {
  message: 'date_to must be on or after date_from',
  path: ['date_to'],
});

const adminMessageReplySchema = z.object({
  body: safeText(1, 2000),
});

const adminReviewActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'delete']),
});

module.exports = {
  registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema,
  updateProfileSchema, changePasswordSchema,
  createOrderSchema, cancelOrderSchema,
  createReviewSchema,
  loyaltyApplySchema,
  newsletterSubscribeSchema,
  createMessageSchema,
  adminLoginSchema, updateOrderStatusSchema, adminCreateProductSchema,
  specialDayCreateSchema, adminMessageReplySchema, adminReviewActionSchema,
};
