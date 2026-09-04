export type ComplianceStatus = 'COMPLIANT' | 'POTENTIAL VIOLATION' | 'REQUIRES REVIEW';
export type FieldName = 'productName' | 'mrp' | 'netQuantity' | 'unitSalePrice' | 'manufacturer' | 'packer' | 'importer' | 'manufacturingPackingDate' | 'bestBeforeUseByExpiry' | 'consumerCare' | 'countryOfOrigin';
export interface BBox { x: number; y: number; width: number; height: number }
export interface OCRRegion { text: string; confidence: number; bbox: BBox }
export interface OCRResponse { regions: OCRRegion[]; imageWidth: number; imageHeight: number; engine: string }
export interface ExtractedField { name: FieldName; label: string; value: string; confidence: number; regionIndex: number | null; bbox: BBox | null }
export interface ComplianceRule { id: string; name: string; category: string; status: ComplianceStatus; reason: string; severity: 'LOW' | 'MEDIUM' | 'HIGH'; evidenceRegionIndex: number | null }
export interface Inspection { id: string; userId?: string; createdAt: string; imageName: string; imageDataUrl?: string; ocr: OCRResponse; fields: ExtractedField[]; rules: ComplianceRule[]; summary: { compliant: number; potential: number; review: number }; demo?: boolean }
export interface Declaration { id: string; inspectionId: string; userId?: string; text: string; createdAt: string }
export interface Violation { id: string; inspectionId: string; userId?: string; ruleId: string; status: ComplianceStatus; note: string }
