import { AppError } from "../appError.js";

const DATA_URL_PATTERN =
  /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

type ImageMimeType = "image/jpeg" | "image/png" | "image/webp";

type ValidateImageDataUrlOptions = {
  required?: boolean;
  maxSizeInBytes?: number;
  minSizeInBytes?: number;
  allowedMimeTypes?: ImageMimeType[];
  errorCodePrefix?: string;
};

type ParsedImageDataUrl = {
  mimeType: ImageMimeType;
  base64: string;
  buffer: Buffer;
};

const DEFAULT_ALLOWED_MIME_TYPES: ImageMimeType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const normalizeMimeType = (mimeType: string): ImageMimeType | null => {
  if (mimeType === "image/jpg") return "image/jpeg";
  if (
    mimeType === "image/jpeg" ||
    mimeType === "image/png" ||
    mimeType === "image/webp"
  ) {
    return mimeType;
  }

  return null;
};

const parseImageDataUrl = (value: string): ParsedImageDataUrl | null => {
  const match = DATA_URL_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const mimeType = normalizeMimeType(match[1]);
  const base64 = match[2];

  if (!mimeType || base64.length % 4 !== 0) {
    return null;
  }

  const buffer = Buffer.from(base64, "base64");

  if (buffer.toString("base64") !== base64) {
    return null;
  }

  return { mimeType, base64, buffer };
};

const isJpeg = (buffer: Buffer): boolean =>
  buffer.length >= 4 &&
  buffer[0] === 0xff &&
  buffer[1] === 0xd8 &&
  buffer[buffer.length - 2] === 0xff &&
  buffer[buffer.length - 1] === 0xd9;

const isPng = (buffer: Buffer): boolean =>
  buffer.length >= 8 &&
  buffer[0] === 0x89 &&
  buffer[1] === 0x50 &&
  buffer[2] === 0x4e &&
  buffer[3] === 0x47 &&
  buffer[4] === 0x0d &&
  buffer[5] === 0x0a &&
  buffer[6] === 0x1a &&
  buffer[7] === 0x0a;

const isWebp = (buffer: Buffer): boolean =>
  buffer.length >= 12 &&
  buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
  buffer.subarray(8, 12).toString("ascii") === "WEBP";

const imageSignatureMatches = (
  mimeType: ImageMimeType,
  buffer: Buffer,
): boolean => {
  if (mimeType === "image/jpeg") return isJpeg(buffer);
  if (mimeType === "image/png") return isPng(buffer);
  if (mimeType === "image/webp") return isWebp(buffer);
  return false;
};

export const validateImageDataUrl = (
  value?: string | null,
  options: ValidateImageDataUrlOptions = {},
): string | null => {
  const {
    required = false,
    maxSizeInBytes,
    minSizeInBytes = 1,
    allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES,
    errorCodePrefix = "IMAGE",
  } = options;
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    if (!required) return null;

    throw new AppError(
      "Image is required",
      400,
      `${errorCodePrefix}_REQUIRED`,
    );
  }

  const parsed = parseImageDataUrl(normalizedValue);

  if (!parsed || !allowedMimeTypes.includes(parsed.mimeType)) {
    throw new AppError(
      "Image must be a valid data URL with an allowed type",
      400,
      `${errorCodePrefix}_INVALID`,
    );
  }

  if (parsed.buffer.length < minSizeInBytes) {
    throw new AppError("Image file is too small", 400, `${errorCodePrefix}_INVALID`);
  }

  if (maxSizeInBytes && parsed.buffer.length > maxSizeInBytes) {
    throw new AppError(
      "Image exceeds the maximum allowed size",
      400,
      `${errorCodePrefix}_TOO_LARGE`,
    );
  }

  if (!imageSignatureMatches(parsed.mimeType, parsed.buffer)) {
    throw new AppError(
      "Image content does not match declared image type",
      400,
      `${errorCodePrefix}_INVALID`,
    );
  }

  return `data:${parsed.mimeType};base64,${parsed.base64}`;
};
