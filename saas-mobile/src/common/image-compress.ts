const OCR_MAX_IMAGE_SIDE = 1400;
const OCR_JPEG_QUALITY = 0.85;
const OCR_COMPRESS_MIN_SIZE = 2 * 1024 * 1024;

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
      width,
      height,
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

export async function compressImageForOcr(filePath: string) {
  const startTime = Date.now();
  try {
    const fileSize = await getFileSize(filePath);
    if (fileSize > 0 && fileSize <= OCR_COMPRESS_MIN_SIZE) {
      console.log(
        `[ImageCompress] skip, size=${formatSize(fileSize)}, cost=${Date.now() - startTime}ms`,
      );
      return filePath;
    }

    const imageInfo = await getImageInfo(filePath);
    const target = calculateCompressedSize(imageInfo, OCR_MAX_IMAGE_SIDE);
    if (!target.shouldResize) {
      console.log(
        `[ImageCompress] skip, size=${formatSize(fileSize)}, ${imageInfo.width}x${imageInfo.height}, cost=${Date.now() - startTime}ms`,
      );
      return filePath;
    }

    try {
      const compressedPath = await compressWithUniApi(
        filePath,
        target.width,
        target.height,
        OCR_JPEG_QUALITY,
      );
      console.log(
        `[ImageCompress] compressed by uni, size=${formatSize(fileSize)}, ${imageInfo.width}x${imageInfo.height}->${target.width}x${target.height}, cost=${Date.now() - startTime}ms`,
      );
      return compressedPath;
    } catch (error) {
      console.warn("[ImageCompress] uni.compressImage 不可用，尝试 Canvas 压缩:", error);
    }

    const compressedPath = await compressWithCanvas(
      filePath,
      target.width,
      target.height,
      OCR_JPEG_QUALITY,
    );
    console.log(
      `[ImageCompress] compressed by canvas, size=${formatSize(fileSize)}, ${imageInfo.width}x${imageInfo.height}->${target.width}x${target.height}, cost=${Date.now() - startTime}ms`,
    );
    return compressedPath;
  } catch (error) {
    console.warn(`[ImageCompress] 图片压缩失败，使用原图，cost=${Date.now() - startTime}ms`, error);
    return filePath;
  }
}
