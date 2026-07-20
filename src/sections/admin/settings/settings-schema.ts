import type { ShopSettings } from 'src/lib/shop-settings-service';

import * as z from 'zod';

// ----------------------------------------------------------------------

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
  error: 'กรุณาระบุเวลาให้ถูกต้อง',
});

const dayHoursSchema = z.object({
  closed: z.boolean(),
  open: timeSchema,
  close: timeSchema,
});

const nullableImageUrlSchema = z.string().url({ error: 'URL รูปภาพไม่ถูกต้อง' }).nullable();

const specialClosureSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'กรุณาระบุวันที่หยุด' }),
  label: z.string().trim().min(1, { error: 'กรุณาระบุเหตุผล' }).max(120),
});

export const AdminSettingsSchema = z
  .object({
    name: z.string().trim().min(1, { error: 'กรุณาระบุชื่อร้าน' }).max(120),
    description: z.string().trim().max(500, { error: 'รายละเอียดต้องไม่เกิน 500 ตัวอักษร' }),
    logoUrl: nullableImageUrlSchema,
    address: z.string().trim().min(1, { error: 'กรุณาระบุที่อยู่ร้าน' }).max(500),
    phone: z
      .string()
      .trim()
      .max(30)
      .refine((value) => !value || /^[0-9+()\-\s]{8,30}$/.test(value), {
        error: 'รูปแบบเบอร์โทรไม่ถูกต้อง',
      }),
    promptPayId: z
      .string()
      .trim()
      .refine((value) => {
        if (!value) return true;
        const digits = value.replace(/\D/g, '');
        return digits.length === 10 || digits.length === 13;
      }, 'พร้อมเพย์ต้องเป็นเบอร์โทร 10 หลัก หรือเลขบัตรประชาชน 13 หลัก'),
    promptPayQrUrl: nullableImageUrlSchema,
    businessHours: z.object({
      mon: dayHoursSchema,
      tue: dayHoursSchema,
      wed: dayHoursSchema,
      thu: dayHoursSchema,
      fri: dayHoursSchema,
      sat: dayHoursSchema,
      sun: dayHoursSchema,
    }),
    specialClosures: z.array(specialClosureSchema).max(100),
    announcement: z.object({
      enabled: z.boolean(),
      message: z.string().trim().max(500, { error: 'ประกาศต้องไม่เกิน 500 ตัวอักษร' }),
    }),
    customOrder: z.custom<ShopSettings['customOrder']>(),
    loyalty: z.custom<ShopSettings['loyalty']>(),
    isOpen: z.boolean(),
    manuallyOpen: z.boolean(),
    closureReason: z.string(),
  })
  .superRefine((values, context) => {
    if (values.announcement.enabled && !values.announcement.message.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['announcement', 'message'],
        message: 'กรุณาระบุข้อความประกาศ',
      });
    }

    const seenDates = new Set<string>();
    values.specialClosures.forEach((closure, index) => {
      if (seenDates.has(closure.date)) {
        context.addIssue({
          code: 'custom',
          path: ['specialClosures', index, 'date'],
          message: 'วันที่หยุดนี้ถูกเพิ่มแล้ว',
        });
      }
      seenDates.add(closure.date);
    });
  });

export type AdminSettingsSchemaType = z.infer<typeof AdminSettingsSchema>;
