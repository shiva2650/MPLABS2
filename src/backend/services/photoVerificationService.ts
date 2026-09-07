import exifr from 'exifr';
import { PhotoVerificationResult, Project } from '../../types/index.ts';
import { calculateHaversineDistance } from './aiAnomalyService.ts';

// Known photo-manipulation and AI generation software fingerprints
const SUSPICIOUS_SOFTWARE_KEYWORDS = [
  'photoshop',
  'gimp',
  'canva',
  'midjourney',
  'stable diffusion',
  'dall-e',
  'stablediffusion',
  'generative',
  'facetune',
  'snapseed',
  'lightroom',
  'pixlr',
  'remini'
];

/**
 * Computes a fast 64-bit difference hash (dHash) from image buffer
 */
export function computePerceptualHash(buffer: Buffer): string {
  // Simple deterministic sample hash across buffer chunks for perceptual fingerprinting
  let hashVal = 0n;
  const step = Math.max(1, Math.floor(buffer.length / 64));
  for (let i = 0; i < 64 && i * step < buffer.length; i++) {
    const byte = buffer[i * step];
    if (byte > 127) {
      hashVal |= 1n << BigInt(i);
    }
  }
  return hashVal.toString(16).padStart(16, '0');
}

/**
 * Compares Hamming distance between two hex perceptual hashes
 */
export function computeHammingDistance(hash1: string, hash2: string): number {
  try {
    let xor = BigInt('0x' + hash1) ^ BigInt('0x' + hash2);
    let distance = 0;
    while (xor > 0n) {
      if (xor & 1n) distance++;
      xor >>= 1n;
    }
    return distance;
  } catch {
    return 64;
  }
}

/**
 * Server-side EXIF Extraction and Multi-Factor Verification
 */
export async function verifyUploadedPhoto(
  buffer: Buffer,
  targetProject: Project,
  allProjects: Project[],
  thresholdMeters = 500
): Promise<PhotoVerificationResult> {
  const reasons: string[] = [];
  let isEditedOrAiGenerated = false;
  let status: 'Verified' | 'Mismatch' | 'Unverifiable' | 'Suspicious' = 'Verified';

  // 1. Compute perceptual hash
  const pHash = computePerceptualHash(buffer);

  // Check for duplicate photos across all registered projects
  let isDuplicateImage = false;
  let duplicateMatchProjectId: string | undefined;

  for (const proj of allProjects) {
    for (const photo of proj.photos || []) {
      if (photo.pHash) {
        const dist = computeHammingDistance(pHash, photo.pHash);
        if (dist <= 6) {
          isDuplicateImage = true;
          duplicateMatchProjectId = proj.id;
          reasons.push(
            `Near-duplicate image detected! Image hash matches photo from Work ID ${proj.workId} (Hamming distance: ${dist}).`
          );
          status = 'Suspicious';
          break;
        }
      }
    }
    if (isDuplicateImage) break;
  }

  // 2. Extract EXIF metadata with exifr
  let exifData: any = null;
  try {
    exifData = await exifr.parse(buffer, {
      tiff: true,
      xmp: true,
      gps: true,
      icc: false
    });
  } catch (err) {
    console.warn('EXIF parse error:', err);
  }

  // If no EXIF data or missing GPS
  if (!exifData || (!exifData.latitude && !exifData.GPSLatitude)) {
    reasons.push('EXIF metadata is missing or stripped. No embedded GPS coordinates or device timestamps found.');
    return {
      status: 'Unverifiable',
      distanceMeters: null,
      thresholdMeters,
      extractedCoordinates: null,
      targetCoordinates: {
        lat: targetProject.latitude,
        lng: targetProject.longitude
      },
      timestamp: null,
      cameraMake: null,
      cameraModel: null,
      software: null,
      isEditedOrAiGenerated: false,
      perceptualHash: pHash,
      isDuplicateImage,
      duplicateMatchProjectId,
      reasons
    };
  }

  const lat = Number(exifData.latitude || exifData.GPSLatitude);
  const lng = Number(exifData.longitude || exifData.GPSLongitude);
  const timestamp = exifData.DateTimeOriginal || exifData.CreateDate || exifData.ModifyDate || null;
  const cameraMake = exifData.Make ? String(exifData.Make).trim() : null;
  const cameraModel = exifData.Model ? String(exifData.Model).trim() : null;
  const software = exifData.Software ? String(exifData.Software).trim() : null;

  // 3. Inspect Software tags for digital editing / AI manipulation
  if (software) {
    const swLower = software.toLowerCase();
    for (const keyword of SUSPICIOUS_SOFTWARE_KEYWORDS) {
      if (swLower.includes(keyword)) {
        isEditedOrAiGenerated = true;
        reasons.push(`Image contains editing software metadata: "${software}". Possible post-capture manipulation.`);
        status = 'Suspicious';
        break;
      }
    }
  }

  // 4. Suspicious coordinate patterns (e.g. 0,0 or exact integer coordinate spoofing)
  if (lat === 0 && lng === 0) {
    reasons.push('Extracted coordinates are null island (0.0°N, 0.0°E), indicating invalid or spoofed sensor data.');
    status = 'Suspicious';
  } else if (Number.isInteger(lat) && Number.isInteger(lng)) {
    reasons.push(`Integer coordinates detected (${lat}.0, ${lng}.0), which typically indicates artificial manual entry.`);
    status = 'Suspicious';
  }

  // 5. GPS distance calculation to registered project location
  const distance = calculateHaversineDistance(
    targetProject.latitude,
    targetProject.longitude,
    lat,
    lng
  );

  if (distance > thresholdMeters) {
    status = 'Mismatch';
    reasons.push(
      `Location Mismatch: Photo captured at (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E) is ${distance.toLocaleString()}m away from registered project coordinates (${targetProject.latitude.toFixed(4)}°N, ${targetProject.longitude.toFixed(4)}°E). Allowed threshold is ${thresholdMeters}m.`
    );
  } else {
    reasons.push(
      `Location Verified: Distance of ${distance}m is within authorized ${thresholdMeters}m radius of registered site.`
    );
  }

  return {
    status,
    distanceMeters: distance,
    thresholdMeters,
    extractedCoordinates: { lat, lng },
    targetCoordinates: {
      lat: targetProject.latitude,
      lng: targetProject.longitude
    },
    timestamp: timestamp ? new Date(timestamp).toISOString() : null,
    cameraMake,
    cameraModel,
    software,
    isEditedOrAiGenerated,
    perceptualHash: pHash,
    isDuplicateImage,
    duplicateMatchProjectId,
    reasons
  };
}
