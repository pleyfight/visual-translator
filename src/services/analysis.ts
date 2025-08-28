import { imageAnalysisRequestSchema, type ImageAnalysisRequest } from '../../lib/frontend-contracts';

/**
 * analyzeImage calls a backend endpoint with form-data:
 *   - imageFile: File
 *   - targetLanguage: string
 * Headers:
 *   - Authorization: Bearer <apiKey>
 *
 * It returns a translated file (Blob wrapped as File).
 */
export async function analyzeImage(req: ImageAnalysisRequest, apiUrl = '/api/analyze') {
  // Runtime validation using zod
  const parsed = imageAnalysisRequestSchema.parse(req);

  const form = new FormData();
  form.append('imageFile', parsed.imageFile);
  form.append('targetLanguage', parsed.targetLanguage);

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${parsed.apiKey}`,
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  const blob = await res.blob();

  // Try to preserve the content type if provided by server
  const type = res.headers.get('content-type') ?? (blob.type || 'application/octet-stream');
  const out = new File([blob], `translated-${parsed.imageFile.name}`, { type });
  return out;
}

/**
 * Fallback/mock in case there's no backend yet.
 * Echoes the original file as "translated".
 */
export async function analyzeImageMock(req: ImageAnalysisRequest) {
  const parsed = imageAnalysisRequestSchema.parse(req);
  const out = new File([await parsed.imageFile.arrayBuffer()], `translated-${parsed.imageFile.name}`, {
    type: parsed.imageFile.type || 'application/octet-stream',
  });
  await new Promise((r) => setTimeout(r, 1200)); // simulate processing
  return out;
}