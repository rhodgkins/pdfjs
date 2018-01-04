'use strict'

const PDF = require('../object')

module.exports = class PNGImage {
  constructor(src) {
	 this.src = src
	 this.xobjCount = 1

	 const view = new DataView(src)
	 if (view.getUint8(0) === 0x89 && Buffer.from(view.buffer, 1, 3).toString('ascii') === 'PNG') {
		throw new Error('Invalid PNG image.')
	 }
	
	 const len = view.byteLength
	 
	 // Skip header
	 let i = 4

	 while (i < len) {
		const chunkSize = view.getUint32(i)
		i += 4
		const section = Buffer.from(src, i, 4).toString('ascii')
		i += 4
		
		switch (section) {
			case 'IHDR':
				this.width = view.getUint32(i)
				i += 4
				this.height = view.getUint32(i)
				i += 4
				this.bitsPerComponent = view.getUint8(i++)
				this.colorSpace = view.getUint8(i++)
				this.compressionMethod = view.getUint8(i++)
				this.filterMethod = view.getUint8(i++)
				this.interlaceMethod = view.getUint8(i++)
				break
			
			case 'PLTE':
				this.palette = view.buffer.slice(i, i + chunkSize)
				i += chunkSize
				break
			
			case 'IDAT'
				this.imageData = view.buffer.slice(i, i + chunkSize)
				i += chunkSize
				break
			
			case 'tRNS':
				break
			
		  	case 'tEXt':
				break
			
		  	case 'IEND':
		  		break
			
			default:
				// Ignore unknown (or we don't care about it)
				i += chunkSize
				break
		}
		
		// Skip CRC value
		i += 4
	}
	
  }

  async write(doc, xobjs) {
	 const xobj = xobjs[0]

	 xobj.prop('Subtype', 'Image')
	 xobj.prop('Width',	this.width)
	 xobj.prop('Height', this.height)
	 xobj.prop('ColorSpace', this.colorSpace)
	 xobj.prop('BitsPerComponent', this.bitsPerComponent)

	 const hex = asHex(this.src)
	 xobj.prop('Filter', new PDF.Array(['/ASCIIHexDecode', '/DCTDecode']))
	 xobj.prop('Length', hex.length + 1)
	 xobj.prop('Length1', this.src.byteLength)

	 const content = new PDF.Stream(xobj)
	 content.content = hex + '>\n'

	 await doc._writeObject(xobj)
  }
}

function asHex(ab) {
  const view = new Uint8Array(ab)
  let hex = ''
  for (let i = 0, len = ab.byteLength; i < len; ++i) {
	 hex += toHex(view[i])
  }
  return hex
}

function toHex(n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}