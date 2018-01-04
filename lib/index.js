'use strict'

const util = require('./util')

exports.Document = require('./document')
exports.Font = require('./font')

const PDFImage = require('./image/pdf')
const JPEGImage = require('./image/jpeg')
const PNGImage = require('./image/png')

exports.Image = class Image {
  constructor(b) {
    const src = util.toArrayBuffer(b)

    switch (determineType(src)) {
      case 'pdf':
        return new PDFImage(src)
      case 'jpeg':
        return new JPEGImage(src)
      case 'png':
        return new PNGImage(src)
      default:
        throw new TypeError('Unsupported image type')
    }
  }
}

function determineType(buffer) {
  const pdf = String.fromCharCode.apply(null, new Uint8Array(buffer, 0, 5))
  if (pdf === '%PDF-') {
    return 'pdf'
  }

  const view = new DataView(buffer)
  if (view.getUint8(0) === 0xff || view.getUint8(1) === 0xd8) {
    return 'jpeg'
  }

  if (view.getUint8(0) === 0x89 && buffer.toString('ascii', 1, 4) === 'PNG') {
    return 'png'
  }

  return null
}

exports.ExternalDocument = require('./external')

exports.mm = 0.0393700787 * 72
exports.cm = exports.mm * 10
