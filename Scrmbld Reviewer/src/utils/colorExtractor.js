/**
 * Extracts dominant colors from an image to create dynamic gradients
 * Similar to Spotify's album page gradient feature
 */

/**
 * Get dominant color from an image
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<{primary: string, secondary: string, tertiary: string}>}
 */
export async function extractColorsFromImage(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    
    // Try with CORS first (for same-origin or CORS-enabled images)
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size (smaller for performance)
        canvas.width = 100;
        canvas.height = 100;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Extract colors
        const colors = extractDominantColors(data, canvas.width * canvas.height);
        
        resolve(colors);
      } catch (error) {
        // CORS error or canvas error - use fallback
        console.warn('Could not extract colors (CORS or canvas issue), using fallback:', error);
        resolve(getDefaultColors());
      }
    };
    
    img.onerror = () => {
      // Image load error - use fallback
      console.warn('Error loading image for color extraction, using fallback');
      resolve(getDefaultColors());
    };
    
    // Set src after setting up handlers
    img.src = imageUrl;
  });
}

/**
 * Extract dominant colors from pixel data
 * @param {Uint8ClampedArray} data - Image pixel data
 * @param {number} pixelCount - Total number of pixels
 * @returns {{primary: string, secondary: string, tertiary: string}}
 */
function extractDominantColors(data, pixelCount) {
  const colorMap = new Map();
  
  // Sample pixels (every 10th pixel for performance)
  for (let i = 0; i < data.length; i += 40) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Skip transparent pixels
    if (a < 128) continue;
    
    // Quantize colors to reduce noise
    const quantizedR = Math.floor(r / 10) * 10;
    const quantizedG = Math.floor(g / 10) * 10;
    const quantizedB = Math.floor(b / 10) * 10;
    
    const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
    colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
  }
  
  // Sort by frequency
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // Get top 10 colors
  
  // Convert to RGB strings and adjust brightness
  const colors = sortedColors.map(([colorKey]) => {
    const [r, g, b] = colorKey.split(',').map(Number);
    return { r, g, b, rgb: `rgb(${r}, ${g}, ${b})` };
  });
  
  // Get primary color (most dominant)
  const primary = colors[0] || { r: 80, g: 53, b: 80, rgb: 'rgb(80, 53, 80)' };
  
  // Get secondary color (second most dominant, or adjust primary)
  const secondary = colors[1] || adjustBrightness(primary, 0.7);
  
  // Get tertiary color (darker version for gradient end)
  const tertiary = adjustBrightness(primary, 0.3);
  
  return {
    primary: primary.rgb,
    secondary: secondary.rgb,
    tertiary: tertiary.rgb,
    // Also provide rgba versions with opacity for gradients
    primaryRgba: `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.6)`,
    secondaryRgba: `rgba(${secondary.r}, ${secondary.g}, ${secondary.b}, 0.4)`,
    tertiaryRgba: `rgba(${tertiary.r}, ${tertiary.g}, ${tertiary.b}, 0.2)`
  };
}

/**
 * Adjust brightness of a color
 * @param {{r: number, g: number, b: number}} color - RGB color object
 * @param {number} factor - Brightness factor (0-1)
 * @returns {{r: number, g: number, b: number, rgb: string}}
 */
function adjustBrightness(color, factor) {
  const r = Math.max(0, Math.min(255, Math.floor(color.r * factor)));
  const g = Math.max(0, Math.min(255, Math.floor(color.g * factor)));
  const b = Math.max(0, Math.min(255, Math.floor(color.b * factor)));
  
  return { r, g, b, rgb: `rgb(${r}, ${g}, ${b})` };
}

/**
 * Get default colors (fallback)
 * @returns {{primary: string, secondary: string, tertiary: string}}
 */
function getDefaultColors() {
  return {
    primary: 'rgb(80, 53, 80)',
    secondary: 'rgb(60, 40, 60)',
    tertiary: 'rgb(30, 20, 30)',
    primaryRgba: 'rgba(80, 53, 80, 0.6)',
    secondaryRgba: 'rgba(60, 40, 60, 0.4)',
    tertiaryRgba: 'rgba(30, 20, 30, 0.2)'
  };
}

