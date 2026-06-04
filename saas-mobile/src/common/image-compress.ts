const OCR_MAX_IMAGE_SIDE = 1400;
const OCR_JPEG_QUALITY = 0.85;
const OCR_COMPRESS_MIN_SIZE = 2 * 1024 * 1024;
const VEHICLE_LICENSE_OCR_MAX_IMAGE_SIDE = 1200;
const VEHICLE_LICENSE_OCR_JPEG_QUALITY = 0.78;
const VEHICLE_LICENSE_OCR_COMPRESS_MIN_SIZE = OCR_COMPRESS_MIN_SIZE;

export interface OcrImageCompressOptions {
  maxSide?: number;
  quality?: number;
  minSize?: number;
  label?: string;
}

interface ImageSize {
  width: number;
  height: number;
}

function getImageInfo(filePath: string): Promise<ImageSize> {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src: filePath,
      success: (info) => {
        resolve({
          width: Number(info.width) || 0,
          height: Number(info.height) || 0,
        });
      },
      fail: reject,
    });
  });
}

function getFileSize(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    if (typeof uni.getFileInfo !== "function") {
      resolve(0);
      return;
    }

    uni.getFileInfo({
      filePath,
      success: (info) => resolve(Number(info.size) || 0),
      fail: () => resolve(0),
    });
  });
}

function formatSize(size: number) {
  if (!size) return "unknown";
  return `${(size / 1024 / 1024).toFixed(2)}MB`;
}

function formatCompressRatio(before: number, after: number) {
  if (!before || !after) return "unknown";
  return `${Math.round((1 - after / before) * 100)}%`;
}

function calculateCompressedSize(size: ImageSize, maxSide: number) {
  const longestSide = Math.max(size.width, size.height);
  if (!longestSide || longestSide <= maxSide) {
    return {
      width: size.width,
      height: size.height,
      shouldResize: false,
    };
  }

  const ratio = maxSide / longestSide;
  return {
    width: Math.round(size.width * ratio),
    height: Math.round(size.height * ratio),
    shouldResize: true,
  };
}

function compressWithUniApi(
  filePath: string,
  width: number,
  height: number,
  quality: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof uni.compressImage !== "function") {
      reject(new Error("compressImage is not available"));
      return;
    }

    uni.compressImage({
      src: filePath,
      quality: Math.round(quality * 100),
      width: String(width),
      height: String(height),
      success: (res) => resolve(res.tempFilePath),
      fail: reject,
    });
  });
}

function loadHtmlImage(filePath: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = filePath;
  });
}

async function compressWithCanvas(
  filePath: string,
  width: number,
  height: number,
  quality: number,
) {
  if (typeof document === "undefined") {
    throw new Error("canvas compression is not available");
  }

  const image = await loadHtmlImage(filePath);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("canvas context is not available");
  }
  context.drawImage(image, 0, 0, width, height);
  return new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("canvas blob is not available"));
          return;
        }
        resolve(URL.createObjectURL(blob));
      },
      "image/jpeg",
      quality,
    );
  });
}

export async function compressImageForOcr(
  filePath: string,
  options: OcrImageCompressOptions = {},
) {
  const startTime = Date.now();
  const maxSide = options.maxSide || OCR_MAX_IMAGE_SIDE;
  const quality = options.quality || OCR_JPEG_QUALITY;
  const minSize = options.minSize ?? OCR_COMPRESS_MIN_SIZE;
  const label = options.label || "OCR";

  try {
    const fileSize = await getFileSize(filePath);
    if (fileSize > 0 && fileSize <= minSize) {
      console.log(
        `[ImageCompress] ${label} skip, original=${formatSize(fileSize)}, compressed=false, reason=below ${formatSize(minSize)}, cost=${Date.now() - startTime}ms`,
      );
      return filePath;
    }

    const imageInfo = await getImageInfo(filePath);
    const target = calculateCompressedSize(imageInfo, maxSide);
    const shouldCompressBySize = fileSize > minSize;
    if (!target.shouldResize && !shouldCompressBySize) {
      console.log(
        `[ImageCompress] ${label} skip, original=${formatSize(fileSize)}, compressed=false, ${imageInfo.width}x${imageInfo.height}, cost=${Date.now() - startTime}ms`,
      );
      return filePath;
    }

    const targetWidth = target.width || imageInfo.width;
    const targetHeight = target.height || imageInfo.height;

    try {
      const compressedPath = await compressWithUniApi(
        filePath,
        targetWidth,
        targetHeight,
        quality,
      );
      const compressedSize = await getFileSize(compressedPath);
      console.log(
        `[ImageCompress] ${label} compressed by uni, compressed=true, original=${formatSize(fileSize)}, result=${formatSize(compressedSize)}, saved=${formatCompressRatio(fileSize, compressedSize)}, ${imageInfo.width}x${imageInfo.height}->${targetWidth}x${targetHeight}, cost=${Date.now() - startTime}ms`,
      );
      return compressedPath;
    } catch (error) {
      console.warn("[ImageCompress] uni.compressImage 不可用，尝试 Canvas 压缩:", error);
    }

    const compressedPath = await compressWithCanvas(
      filePath,
      targetWidth,
      targetHeight,
      quality,
    );
    const compressedSize = await getFileSize(compressedPath);
    console.log(
      `[ImageCompress] ${label} compressed by canvas, compressed=true, original=${formatSize(fileSize)}, result=${formatSize(compressedSize)}, saved=${formatCompressRatio(fileSize, compressedSize)}, ${imageInfo.width}x${imageInfo.height}->${targetWidth}x${targetHeight}, cost=${Date.now() - startTime}ms`,
    );
    return compressedPath;
  } catch (error) {
    console.warn(`[ImageCompress] ${label} 图片压缩失败，使用原图，cost=${Date.now() - startTime}ms`, error);
    return filePath;
  }
}

export function compressVehicleLicenseForOcr(filePath: string) {
  return compressImageForOcr(filePath, {
    maxSide: VEHICLE_LICENSE_OCR_MAX_IMAGE_SIDE,
    quality: VEHICLE_LICENSE_OCR_JPEG_QUALITY,
    minSize: VEHICLE_LICENSE_OCR_COMPRESS_MIN_SIZE,
    label: "VehicleLicenseOCR",
  });
}
