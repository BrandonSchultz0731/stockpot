import { Image as RNImage } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import ImageCropPicker from 'react-native-image-crop-picker';

export interface CapturedImage {
  base64: string;
  mimeType: string;
}

/** Crop an image at the given path and return base64 + mime */
export async function cropImage(
  imagePath: string,
): Promise<CapturedImage | null> {
  try {
    // openCropper needs a file:// URI — ensure the prefix is present
    const path = imagePath.startsWith('file://')
      ? imagePath
      : `file://${imagePath}`;

    // Get actual image dimensions so the crop box starts at "Original"
    const { width, height } = await new Promise<{
      width: number;
      height: number;
    }>((resolve, reject) =>
      RNImage.getSize(
        path,
        (w, h) => resolve({ width: w, height: h }),
        reject,
      ),
    );

    const result = await ImageCropPicker.openCropper({
      path,
      width,
      height,
      mediaType: 'photo',
      includeBase64: true,
      compressImageQuality: 0.8,
      freeStyleCropEnabled: true,
    });

    if (result.data) {
      return { base64: result.data, mimeType: result.mime || 'image/jpeg' };
    }
    return null;
  } catch {
    // User dismissed the cropper — do nothing
    return null;
  }
}

/** Open the native camera, crop the captured photo, and return base64 */
export async function captureFromCamera(): Promise<CapturedImage | null> {
  return new Promise((resolve) => {
    launchCamera(
      {
        mediaType: 'photo',
        maxWidth: 1500,
        maxHeight: 2000,
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel || response.errorCode) {
          resolve(null);
          return;
        }

        const uri = response.assets?.[0]?.uri;
        if (!uri) {
          resolve(null);
          return;
        }

        // Delay so the camera modal fully dismisses before
        // openCropper presents its own modal on iOS
        setTimeout(async () => {
          const result = await cropImage(uri);
          resolve(result);
        }, 1000);
      },
    );
  });
}

/** Open the photo library, crop selected image, and return base64 */
export async function pickFromGallery(): Promise<CapturedImage | null> {
  return new Promise((resolve) => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        maxWidth: 1500,
        maxHeight: 2000,
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel || response.errorCode) {
          resolve(null);
          return;
        }

        const uri = response.assets?.[0]?.uri;
        if (!uri) {
          resolve(null);
          return;
        }

        // Delay so the image picker modal fully dismisses before
        // openCropper presents its own modal on iOS
        setTimeout(async () => {
          const result = await cropImage(uri);
          resolve(result);
        }, 1000);
      },
    );
  });
}
