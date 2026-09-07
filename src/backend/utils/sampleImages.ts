/**
 * Utility to generate valid JPEG buffers with embedded EXIF metadata for real testing
 */

// Function to assemble a valid minimal JPEG with custom APP1 EXIF segment
export function createSampleExifJpeg(options: {
  lat?: number;
  lng?: number;
  make?: string;
  model?: string;
  software?: string;
  hasExif: boolean;
}): Buffer {
  if (!options.hasExif) {
    // Minimal valid 1x1 JPEG without EXIF
    return Buffer.from([
      0xff, 0xd8, // SOI
      0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
      0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32,
      0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
      0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
      0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xbf, 0x00,
      0xff, 0xd9 // EOI
    ]);
  }

  // Construct TIFF header with EXIF APP1
  const lat = options.lat ?? 18.5721;
  const lng = options.lng ?? 79.1315;
  const software = options.software ?? 'OpenCamera 1.51';
  const make = options.make ?? 'Samsung';
  const model = options.model ?? 'SM-T575';

  // Helper to convert float coordinate to degrees, minutes, seconds rational
  function toDMS(deg: number) {
    const d = Math.floor(Math.abs(deg));
    const minFloat = (Math.abs(deg) - d) * 60;
    const m = Math.floor(minFloat);
    const s = Math.round((minFloat - m) * 60 * 100);
    return { d, m, s };
  }

  const latDMS = toDMS(lat);
  const lngDMS = toDMS(lng);

  // Buffer builder with Little Endian TIFF structure
  const tiff = Buffer.alloc(512, 0);
  let offset = 0;

  // Header "II" (little endian) + 0x002A + offset to IFD0 (8)
  tiff.write('II', offset);
  offset += 2;
  tiff.writeUInt16LE(0x002a, offset);
  offset += 2;
  tiff.writeUInt32LE(8, offset);
  offset += 4;

  // IFD0: 4 entries (Make, Model, Software, GPSInfo)
  const ifd0Entries = 4;
  tiff.writeUInt16LE(ifd0Entries, offset);
  offset += 2;

  // Make tag (0x010f), ASCII
  const makeOffset = 250;
  tiff.writeUInt16LE(0x010f, offset);
  tiff.writeUInt16LE(2, offset + 2);
  tiff.writeUInt32LE(make.length + 1, offset + 4);
  tiff.writeUInt32LE(makeOffset, offset + 8);
  tiff.write(make + '\0', makeOffset);
  offset += 12;

  // Model tag (0x0110), ASCII
  const modelOffset = 280;
  tiff.writeUInt16LE(0x0110, offset);
  tiff.writeUInt16LE(2, offset + 2);
  tiff.writeUInt32LE(model.length + 1, offset + 4);
  tiff.writeUInt32LE(modelOffset, offset + 8);
  tiff.write(model + '\0', modelOffset);
  offset += 12;

  // Software tag (0x0131), ASCII
  const swOffset = 310;
  tiff.writeUInt16LE(0x0131, offset);
  tiff.writeUInt16LE(2, offset + 2);
  tiff.writeUInt32LE(software.length + 1, offset + 4);
  tiff.writeUInt32LE(swOffset, offset + 8);
  tiff.write(software + '\0', swOffset);
  offset += 12;

  // GPSInfo tag (0x8825), LONG -> points to GPS IFD at offset 120
  const gpsIfdOffset = 120;
  tiff.writeUInt16LE(0x8825, offset);
  tiff.writeUInt16LE(4, offset + 2);
  tiff.writeUInt32LE(1, offset + 4);
  tiff.writeUInt32LE(gpsIfdOffset, offset + 8);
  offset += 12;

  // Next IFD = 0
  tiff.writeUInt32LE(0, offset);

  // Write GPS IFD at offset 120:
  let gOffset = gpsIfdOffset;
  const gpsEntries = 4; // GPSLatitudeRef, GPSLatitude, GPSLongitudeRef, GPSLongitude
  tiff.writeUInt16LE(gpsEntries, gOffset);
  gOffset += 2;

  // GPSLatitudeRef (0x0001), ASCII "N"
  tiff.writeUInt16LE(0x0001, gOffset);
  tiff.writeUInt16LE(2, gOffset + 2);
  tiff.writeUInt32LE(2, gOffset + 4);
  tiff.write('N\0', gOffset + 8);
  gOffset += 12;

  // GPSLatitude (0x0002), RATIONAL (3 rationals = 24 bytes) at offset 380
  const latDataOffset = 380;
  tiff.writeUInt16LE(0x0002, gOffset);
  tiff.writeUInt16LE(5, gOffset + 2);
  tiff.writeUInt32LE(3, gOffset + 4);
  tiff.writeUInt32LE(latDataOffset, gOffset + 8);
  // Write lat rationals
  tiff.writeUInt32LE(latDMS.d, latDataOffset);
  tiff.writeUInt32LE(1, latDataOffset + 4);
  tiff.writeUInt32LE(latDMS.m, latDataOffset + 8);
  tiff.writeUInt32LE(1, latDataOffset + 12);
  tiff.writeUInt32LE(latDMS.s, latDataOffset + 16);
  tiff.writeUInt32LE(100, latDataOffset + 20);
  gOffset += 12;

  // GPSLongitudeRef (0x0003), ASCII "E"
  tiff.writeUInt16LE(0x0003, gOffset);
  tiff.writeUInt16LE(2, gOffset + 2);
  tiff.writeUInt32LE(2, gOffset + 4);
  tiff.write('E\0', gOffset + 8);
  gOffset += 12;

  // GPSLongitude (0x0004), RATIONAL (3 rationals = 24 bytes) at offset 420
  const lngDataOffset = 420;
  tiff.writeUInt16LE(0x0004, gOffset);
  tiff.writeUInt16LE(5, gOffset + 2);
  tiff.writeUInt32LE(3, gOffset + 4);
  tiff.writeUInt32LE(lngDataOffset, gOffset + 8);
  // Write lng rationals
  tiff.writeUInt32LE(lngDMS.d, lngDataOffset);
  tiff.writeUInt32LE(1, lngDataOffset + 4);
  tiff.writeUInt32LE(lngDMS.m, lngDataOffset + 8);
  tiff.writeUInt32LE(1, lngDataOffset + 12);
  tiff.writeUInt32LE(lngDMS.s, lngDataOffset + 16);
  tiff.writeUInt32LE(100, lngDataOffset + 20);
  gOffset += 12;

  // APP1 Exif segment header
  const exifHeader = Buffer.from('Exif\0\0');
  const app1Payload = Buffer.concat([exifHeader, tiff.subarray(0, 460)]);
  const app1Length = app1Payload.length + 2;

  const app1Header = Buffer.alloc(4);
  app1Header.writeUInt8(0xff, 0);
  app1Header.writeUInt8(0xe1, 1);
  app1Header.writeUInt16BE(app1Length, 2);

  const soi = Buffer.from([0xff, 0xd8]);
  const minimalBody = Buffer.from([
    0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32,
    0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
    0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xbf, 0x00,
    0xff, 0xd9
  ]);

  return Buffer.concat([soi, app1Header, app1Payload, minimalBody]);
}
