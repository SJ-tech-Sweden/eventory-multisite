export const quasarColors = {
  primary: '#1976D2',
  secondary: '#26A69A',
  accent: '#9C27B0',
  dark: '#1D1D1D',
  positive: '#21BA45',
  negative: '#C10015',
  info: '#31CCEC',
  warning: '#F2C037',
  'red-1': '#FFEBEE',
  'red-2': '#FFCDD2',
  'red-3': '#EF9A9A',
  'red-4': '#E57373',
  'red-5': '#EF5350',
  'red-6': '#F44336',
  'red-7': '#E53935',
  'red-8': '#D32F2F',
  'red-9': '#C62828',
  'red-10': '#B71C1C',
  'pink-1': '#FCE4EC',
  'pink-2': '#F8BBD0',
  'pink-3': '#F48FB1',
  'pink-4': '#F06292',
  'pink-5': '#EC407A',
  'pink-6': '#E91E63',
  'pink-7': '#D81B60',
  'pink-8': '#C2185B',
  'pink-9': '#AD1457',
  'pink-10': '#880E4F',
  'purple-1': '#F3E5F5',
  'purple-2': '#E1BEE7',
  'purple-3': '#CE93D8',
  'purple-4': '#BA68C8',
  'purple-5': '#AB47BC',
  'purple-6': '#9C27B0',
  'purple-7': '#8E24AA',
  'purple-8': '#7B1FA2',
  'purple-9': '#6A1B9A',
  'purple-10': '#4A148C',
  'blue-1': '#E3F2FD',
  'blue-2': '#BBDEFB',
  'blue-3': '#90CAF9',
  'blue-4': '#64B5F6',
  'blue-5': '#42A5F5',
  'blue-6': '#2196F3',
  'blue-7': '#1E88E5',
  'blue-8': '#1976D2',
  'blue-9': '#1565C0',
  'blue-10': '#0D47A1',
  'green-1': '#E8F5E9',
  'green-2': '#C8E6C9',
  'green-3': '#A5D6A7',
  'green-4': '#81C784',
  'green-5': '#66BB6A',
  'green-6': '#4CAF50',
  'green-7': '#43A047',
  'green-8': '#388E3C',
  'green-9': '#2E7D32',
  'green-10': '#1B5E20',
  'yellow-1': '#FFFDE7',
  'yellow-2': '#FFF9C4',
  'yellow-3': '#FFF59D',
  'yellow-4': '#FFF176',
  'yellow-5': '#FFEE58',
  'yellow-6': '#FFEB3B',
  'yellow-7': '#FDD835',
  'yellow-8': '#FBC02D',
  'yellow-9': '#F9A825',
  'yellow-10': '#F57F17',
  'brown-1': '#EFEBE9',
  'brown-2': '#D7CCC8',
  'brown-3': '#BCAAA4',
  'brown-4': '#A1887F',
  'brown-5': '#8D6E63',
  'brown-6': '#795548',
  'brown-7': '#6D4C41',
  'brown-8': '#5D4037',
  'brown-9': '#4E342E',
  'brown-10': '#3E2723',
  'grey-1': '#FAFAFA',
  'grey-2': '#F5F5F5',
  'grey-3': '#EEEEEE',
  'grey-4': '#E0E0E0',
  'grey-5': '#BDBDBD',
  'grey-6': '#9E9E9E',
  'grey-7': '#757575',
  'grey-8': '#616161',
  'grey-9': '#424242',
  'grey-10': '#212121',
  'blue-grey-1': '#ECEFF1',
  'blue-grey-2': '#CFD8DC',
  'blue-grey-3': '#B0BEC5',
  'blue-grey-4': '#90A4AE',
  'blue-grey-5': '#78909C',
  'blue-grey-6': '#607D8B',
  'blue-grey-7': '#546E7A',
  'blue-grey-8': '#455A64',
  'blue-grey-9': '#37474F',
  'blue-grey-10': '#263238',
}

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

export function colorDistance(rgb1, rgb2) {
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) + Math.pow(rgb1.g - rgb2.g, 2) + Math.pow(rgb1.b - rgb2.b, 2),
  )
}

export function closestQuasarColor(hex) {
  const inputRgb = hexToRgb(hex)
  if (!inputRgb) {
    throw new Error('Invalid hex color')
  }

  let closestColor = null
  let minDistance = Infinity

  for (const [colorName, colorHex] of Object.entries(quasarColors)) {
    const paletteRgb = hexToRgb(colorHex)
    const distance = colorDistance(inputRgb, paletteRgb)

    if (distance < minDistance) {
      minDistance = distance
      closestColor = colorName
    }
  }

  return closestColor
}
