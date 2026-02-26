import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { UnitOfMeasure, type ShelfLife } from '../shared/enums';

export interface ScanReceiptRequest {
  imageBase64: string;
  mimeType: string;
}

export interface ReceiptScanItem {
  displayName: string;
  quantity: number;
  unit: UnitOfMeasure;
  estimatedShelfLife?: ShelfLife;
  suggestedStorageLocation?: string;
}

export interface ScanReceiptResponse {
  items: ReceiptScanItem[];
}

export function useReceiptScanMutation() {
  return useMutation({
    mutationFn: (data: ScanReceiptRequest) =>
      api.post<ScanReceiptResponse>(ROUTES.RECEIPTS.SCAN, data),
  });
}
