import type { ComplianceRule, ExtractedField, FieldName, OCRResponse, OCRRegion } from '../types';

export function validateOCRResponse(value: unknown): OCRResponse {
  if (!value || typeof value !== 'object') throw new Error('OCR response is not an object');
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.regions) || !Number.isFinite(raw.imageWidth) || !Number.isFinite(raw.imageHeight) || typeof raw.engine !== 'string') throw new Error('Invalid OCR response shape');
  const regions = raw.regions.map((candidate) => {
    if (!candidate || typeof candidate !== 'object') throw new Error('Invalid OCR region');
    const region = candidate as Record<string, unknown>;
    const bbox = region.bbox;
    if (typeof region.text !== 'string' || typeof region.confidence !== 'number' || !Array.isArray(bbox) || bbox.length !== 4 || bbox.some((point) => typeof point !== 'number' || !Number.isFinite(point))) throw new Error('Invalid OCR region shape: bbox must be [x1,y1,x2,y2]');
    const [x1, y1, x2, y2] = bbox as number[];
    if (x2 < x1 || y2 < y1) throw new Error('Invalid OCR bbox coordinates');
    return { text: region.text, confidence: Math.max(0, Math.min(1, region.confidence)), bbox: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 } } satisfies OCRRegion;
  });
  return { regions, imageWidth: raw.imageWidth as number, imageHeight: raw.imageHeight as number, engine: raw.engine };
}

const definitions: Array<[FieldName, string, RegExp]> = [
  ['productName', 'Product name', /(?:product\s*name|product|name)\s*[:\-]?\s*(.+)/i],
  ['mrp', 'MRP', /(?:mrp|max(?:imum)? retail price)\s*[:\-]?\s*(?:₹|rs\.?|inr)?\s*([\d,.]+)/i],
  ['netQuantity', 'Net quantity', /(?:net quantity|net qty)\s*[:\-]?\s*([\w. ]+)/i],
  ['unitSalePrice', 'Unit sale price', /(?:unit sale price|price per unit|unit price)\s*[:\-]?\s*(?:₹|rs\.?|inr)?\s*([\d,.]+)/i],
  ['manufacturer', 'Manufacturer', /(?:manufactured by|manufacturer|mfg)\s*[:\-]?\s*(.+)/i],
  ['packer', 'Packer', /(?:packed by|packer)\s*[:\-]?\s*(.+)/i],
  ['importer', 'Importer', /(?:imported by|importer)\s*[:\-]?\s*(.+)/i],
  ['manufacturingPackingDate', 'Manufacturing / packing date', /(?:manufactured|mfg|packed|pack(?:ing)? date|date of packing)\s*[:\-]?\s*(\S+)/i],
  ['bestBeforeUseByExpiry', 'Best before / use by / expiry', /(?:best before|use by|expiry|expires?)\s*[:\-]?\s*(\S+)/i],
  ['consumerCare', 'Consumer care', /(?:consumer care|customer care|helpline|contact)\s*[:\-]?\s*(.+)/i],
  ['countryOfOrigin', 'Country of origin', /(?:country of origin|made in|country)\s*[:\-]?\s*(.+)/i],
];
export function extractFields(ocr: OCRResponse): ExtractedField[] { return definitions.map(([name, label, pattern]) => { const regionIndex = ocr.regions.findIndex((region) => pattern.test(region.text)); const region = regionIndex >= 0 ? ocr.regions[regionIndex] : undefined; const match = region?.text.match(pattern); return { name, label, value: match?.[1]?.trim() ?? '', confidence: region?.confidence ?? 0, regionIndex: regionIndex >= 0 ? regionIndex : null, bbox: region?.bbox ?? null }; }); }

const ruleDefinitions: Array<[string, string, string, string, FieldName[], 'LOW'|'MEDIUM'|'HIGH']> = [
  ['mrp-declaration', 'MRP declaration', 'Price declaration', 'MRP should be visible on the package.', ['mrp'], 'HIGH'],
  ['net-quantity', 'Net quantity', 'Quantity declaration', 'Net quantity should be visible.', ['netQuantity'], 'HIGH'],
  ['unit-sale-price', 'Unit sale price', 'Price transparency', 'Unit sale price should be declared where applicable.', ['unitSalePrice'], 'MEDIUM'],
  ['manufacturer-packer', 'Manufacturer and packer', 'Entity declaration', 'Manufacturer and packer details should be identifiable.', ['manufacturer', 'packer'], 'MEDIUM'],
  ['date-declaration', 'Date declaration', 'Date declaration', 'Manufacturing/packing date and best-before/use-by/expiry should be reviewable.', ['manufacturingPackingDate', 'bestBeforeUseByExpiry'], 'HIGH'],
  ['consumer-care', 'Consumer care', 'Consumer information', 'Consumer care contact details should be visible.', ['consumerCare'], 'LOW'],
  ['country-of-origin', 'Country of origin', 'Origin declaration', 'Country of origin should be visible.', ['countryOfOrigin'], 'MEDIUM'],
  ['declaration-visibility', 'Declaration visibility', 'Label legibility', 'Required declaration regions should have readable confidence.', ['productName', 'mrp', 'netQuantity'], 'MEDIUM'],
];
export function evaluateRules(fields: ExtractedField[]): ComplianceRule[] { const get = (name: FieldName) => fields.find((field) => field.name === name); return ruleDefinitions.map(([id, name, category, reason, required, severity]) => { const sources = required.map(get); const missing = sources.some((field) => !field?.value || field.regionIndex === null); const lowConfidence = sources.some((field) => Boolean(field?.value) && (field?.confidence ?? 0) < .75); const evidence = sources.find((field) => field?.regionIndex !== null)?.regionIndex ?? null; const status = missing || lowConfidence ? 'REQUIRES REVIEW' : 'COMPLIANT'; return { id, name, category, status, reason: missing ? `${reason} Evidence was not found.` : lowConfidence ? `${reason} OCR confidence is below the review threshold.` : reason, severity, evidenceRegionIndex: evidence }; }); }
export function summarizeRules(rules: ComplianceRule[]) { return rules.reduce((summary, rule) => { if (rule.status === 'COMPLIANT') summary.compliant++; else if (rule.status === 'POTENTIAL VIOLATION') summary.potential++; else summary.review++; return summary; }, { compliant: 0, potential: 0, review: 0 }); }
