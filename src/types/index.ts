export type ComplianceStatus = 'COMPLIANT' | 'POTENTIAL VIOLATION' | 'REQUIRES REVIEW';
export type FieldName = 'manufacturer' | 'productName' | 'netQuantity' | 'unit' | 'mrp' | 'packDate' | 'batchNumber' | 'customerCare' | 'origin' | 'licenseNumber' | 'standardMark';
export interface BBox { x: number; y: number; width: number; height: number }
export interface OCRRegion { text: string; confidence: number; bbox: BBox }
export interface OCRResponse { regions: OCRRegion[]; imageWidth: number; imageHeight: number; engine: string }
export interface ExtractedField { name: FieldName; label: string; value: string; confidence: number; regionIndex: number | null; bbox: BBox | null }
export interface ComplianceRule { id: string; title: string; description: string; status: ComplianceStatus; evidenceRegionIndex: number | null }
export interface Inspection { id: string; createdAt: string; imageName: string; imageUrl?: string; ocr: OCRResponse; fields: ExtractedField[]; rules: ComplianceRule[]; summary: { compliant: number; potential: number; review: number }; demo?: boolean }
export interface Declaration { id: string; inspectionId: string; text: string; createdAt: string }
export interface Violation { id: string; inspectionId: string; ruleId: string; status: ComplianceStatus; note: string }
