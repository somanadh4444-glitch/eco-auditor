/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WasteCategory = 'Plastic' | 'E-Waste' | 'Organic' | 'Metal' | 'Other';

export interface WasteLog {
  id: string;
  category: WasteCategory;
  weight: number; // input weight
  unit?: 'g' | 'kg' | 'lbs'; // input weight unit
  weightInKg: number; // standardized weight in kg
  latitude: number;
  longitude: number;
  timestamp: {
    seconds: number;
    nanoseconds: number;
  } | Date | any;
  userId?: string;
  userEmail?: string;
  imageUrl?: string; // base64 string or image URL
  isPending?: boolean; // indicates if document has pending local writes in Firestore
}
