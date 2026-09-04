import type { ComplianceRule, ExtractedField, FieldName, OCRResponse, OCRRegion } from '../types';

export function validateOCRResponse(value: unknown): OCRResponse {
  if (!value || typeof value !== 'object') throw new Error('OCR response is not an object');
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.regions) || typeof raw.imageWidth !== 'number' || typeof raw.imageHeight !== 'number' || typeof raw.engine !== 'string') throw new Error('Invalid OCR response shape');
  const regions = raw.regions.map((region) => {
    if (!region || typeof region !== 'object') throw new Error('Invalid OCR region');
    const item = region as Record<string, unknown>;
    const bbox = item.bbox as Record<string, unknown> | undefined;
    if (typeof item.text !== 'string' || typeof item.confidence !== 'number' || !bbox || !['x','y','width','height'].every((key) => typeof bbox[key] === 'number')) throw new Error('Invalid OCR region shape');
    return { text: item.text, confidence: item.confidence, bbox: { x: bbox.x as number, y: bbox.y as number, width: bbox.width as number, height: bbox.height as number } } satisfies OCRRegion;
  });
  return { regions, imageWidth: raw.imageWidth, imageHeight: raw.imageHeight, engine: raw.engine } as OCRResponse;
}

const definitions: Array<[FieldName, string, RegExp]> = [
  ['manufacturer', 'Manufacturer', /(?:mfg|manufactured by|manufacturer)\s*[:\-]?\s*(.+)/i],
  ['productName', 'Product name', /(?:product|name)\s*[:\-]?\s*(.+)/i],
  ['netQuantity', 'Net quantity', /(?:net quantity|net qty)\s*[:\-]?\s*([\w. ]+)/i],
  ['unit', 'Unit', /([0-9]+\s*(?:g|kg|ml|l|pcs|piece)s?)/i],
  ['mrp', 'MRP', /(?:mrp|max retail price)\s*[:\-]?\s*(?:₹|rs\.?|inr)?\s*([\d,.]+)/i],
  ['packDate', 'Pack date', /(?:packed|pack date|date of packing)\s*[:\-]?\s*(\S+)/i],
  ['batchNumber', 'Batch number', /(?:batch|lot)\s*(?:no|number)?\s*[:\-]?\s*(\w[\w-]*)/i],
  ['customerCare', 'Customer care', /(?:customer care|helpline|contact)\s*[:\-]?\s*(.+)/i],
  ['origin', 'Country of origin', /(?:country of origin|made in)\s*[:\-]?\s*(.+)/i],
  ['licenseNumber', 'License number', /(?:license|licence)\s*(?:no|number)?\s*[:\-]?\s*(\w[\w/-]*)/i],
  ['standardMark', 'Standard mark', /\b(isi|agmark|fssai|bis)\b/i],
];
export function extractFields(ocr: OCRResponse): ExtractedField[] { return definitions.map(([name, label, pattern]) => { const index = ocr.regions.findIndex((r) => pattern.test(r.text)); const region = index >= 0 ? ocr.regions[index] : undefined; const match = region ? region.text.match(pattern) : null; return { name, label, value: match?.[1]?.trim() || (name === 'standardMark' && match ? match[1] : ''), confidence: region?.confidence ?? 0, regionIndex: index >= 0 ? index : null, bbox: region?.bbox ?? null }; }); }

export function evaluateRules(fields: ExtractedField[]): ComplianceRule[] { const get = (name: FieldName) => fields.find((f) => f.name === name); const rules: Array<[string,string,string,FieldName,boolean]> = [
 ['quantity','Net quantity declared','Net quantity should be present and paired with a unit.','netQuantity',Boolean(get('netQuantity')?.value && get('unit')?.value)],
 ['mrp','MRP declaration','Maximum retail price should be visible on the package.','mrp',Boolean(get('mrp')?.value)],
 ['date','Pack date','Packing/manufacturing date should be declared.','packDate',Boolean(get('packDate')?.value)],
 ['batch','Batch identification','Batch or lot number should be traceable.','batchNumber',Boolean(get('batchNumber')?.value)],
 ['origin','Country of origin','Country of origin should be declared.','origin',Boolean(get('origin')?.value)],
 ['care','Customer care details','Consumer contact information should be available.','customerCare',Boolean(get('customerCare')?.value)],
 ['license','License identification','Applicable license number should be present.','licenseNumber',Boolean(get('licenseNumber')?.value)],
 ['mark','Standards mark','A relevant standards mark should be declared where applicable.','standardMark',Boolean(get('standardMark')?.value)],
 ]; return rules.map(([id,title,description,field,ok]) => { const source = get(field); return { id, title, description, status: ok ? 'COMPLIANT' : source?.confidence ? 'POTENTIAL VIOLATION' : 'REQUIRES REVIEW', evidenceRegionIndex: source?.regionIndex ?? null }; }); }
export function summarizeRules(rules: ComplianceRule[]) { return rules.reduce((s, rule) => { if (rule.status === 'COMPLIANT') s.compliant++; else if (rule.status === 'POTENTIAL VIOLATION') s.potential++; else s.review++; return s; }, { compliant: 0, potential: 0, review: 0 }); }
