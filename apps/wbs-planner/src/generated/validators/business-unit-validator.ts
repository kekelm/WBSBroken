import { z } from 'zod';

/**
 * Zod schema for BusinessUnit validation
 */
export const BusinessUnitSchema = z.object({
  id: z.string().uuid(),
  id1: z.string().uuid(),
  id2: z.string().uuid(),
  name1: z.string().min(1, { message: "Name is required" }),
  address1AddressTypeKey: z.enum(['DefaultValue']).optional(),
  address1County: z.string().optional(),
  address1Fax: z.string().optional(),
  address1Latitude: z.number().optional(),
  address1Longitude: z.number().optional(),
  address1Name: z.string().optional(),
  address1PostOfficeBox: z.string().optional(),
  address1ShippingMethodKey: z.enum(['DefaultValue']).optional(),
  address1Telephone3: z.string().optional(),
  address1UPSZone: z.string().optional(),
  address1UTCOffset: z.number().optional(),
  address2AddressTypeKey: z.enum(['DefaultValue']).optional(),
  address2County: z.string().optional(),
  address2Fax: z.string().optional(),
  address2Latitude: z.number().optional(),
  address2Longitude: z.number().optional(),
  address2Name: z.string().optional(),
  address2PostOfficeBox: z.string().optional(),
  address2ShippingMethodKey: z.enum(['DefaultValue']).optional(),
  address2Telephone1: z.string().optional(),
  address2Telephone2: z.string().optional(),
  address2Telephone3: z.string().optional(),
  address2UPSZone: z.string().optional(),
  address2UTCOffset: z.number().optional(),
  billToCity: z.string().optional(),
  billToCountryRegion: z.string().optional(),
  billToStateProvince: z.string().optional(),
  billToStreet1: z.string().optional(),
  billToStreet2: z.string().optional(),
  billToStreet3: z.string().optional(),
  billToZIPPostalCode: z.string().optional(),
  calendar: z.object({ id: z.string().uuid(), name1: z.string() }).optional(),
  costCenter: z.string().optional(),
  creditLimit: z.number().optional(),
  currency: z.object({ id: z.string().uuid(), currencyName: z.string() }).optional(),
  description: z.string().optional(),
  disableReason: z.string().optional(),
  division: z.string().optional(),
  email: z.string().email().optional(),
  exchangeRate: z.number().optional(),
  fileAsName: z.string().optional(),
  fTPSite: z.string().url().optional(),
  inheritanceMask: z.number().int().optional(),
  isDisabled: z.boolean(),
  mainPhone: z.string().optional(),
  organization: z.object({ id: z.string().uuid(), organizationName: z.string() }),
  otherPhone: z.string().optional(),
  parentBusiness: z.object({ id: z.string().uuid(), name1: z.string() }),
  shipToCity: z.string().optional(),
  shipToCountryRegion: z.string().optional(),
  shipToStateProvince: z.string().optional(),
  shipToStreet1: z.string().optional(),
  shipToStreet2: z.string().optional(),
  shipToStreet3: z.string().optional(),
  shipToZIPPostalCode: z.string().optional(),
  stockExchange: z.string().optional(),
  tickerSymbol: z.string().optional(),
  uTCOffset: z.number().optional(),
  website: z.string().url().optional(),
  workflowSuspended: z.boolean().optional(),
});

/**
 * Schema for creating a new BusinessUnit (omits system-generated ID)
 */
export const CreateBusinessUnitSchema = BusinessUnitSchema.omit({ id: true });

/**
 * Schema for updating an existing BusinessUnit
 */
export const UpdateBusinessUnitSchema = BusinessUnitSchema;

export type BusinessUnitInput = z.infer<typeof BusinessUnitSchema>;
export type CreateBusinessUnitInput = z.infer<typeof CreateBusinessUnitSchema>;
export type UpdateBusinessUnitInput = z.infer<typeof UpdateBusinessUnitSchema>;