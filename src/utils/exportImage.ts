import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'

async function getImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error('Kunne ikke læse eksportbillede'))
    image.src = dataUrl
  })
}

export async function exportAsPng(node: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#05070c',
  })

  const link = document.createElement('a')
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`
  link.href = dataUrl
  link.click()
}

export async function exportAsPdf(node: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#05070c',
  })

  const { width, height } = await getImageSize(dataUrl)
  const isLandscape = width >= height

  const pdf = new jsPDF({
    orientation: isLandscape ? 'l' : 'p',
    unit: 'pt',
    format: [width, height],
  })

  pdf.addImage(dataUrl, 'PNG', 0, 0, width, height, undefined, 'FAST')
  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}
