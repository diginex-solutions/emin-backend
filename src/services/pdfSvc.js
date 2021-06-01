let PdfPrinter = require('pdfmake')
let fs = require('fs')
let moment = require('moment')

let fonts = {
  Roboto: {
    normal: __dirname + '/../static/fonts/Roboto-Regular.ttf',
    bold: __dirname + '/../static/fonts/Roboto-Medium.ttf',
    italics: __dirname + '/../static/fonts/Roboto-Italic.ttf',
    bolditalics: __dirname + '/../static/fonts/Roboto-MediumItalic.ttf',
  },
}
let printer = new PdfPrinter(fonts)
const svg = {
  person_add:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
  lock:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>',
  lock_open:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/></svg>',
  archive:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
  unarchive:
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24"><defs><path id="a" d="M0 0h24v24H0V0z"/></defs><clipPath id="b"><use xlink:href="#a" overflow="visible"/></clipPath><path clip-path="url(#b)" d="M20.55 5.22l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.15.55L3.46 5.22C3.17 5.57 3 6.01 3 6.5V19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.49-.17-.93-.45-1.28zM12 9.5l5.5 5.5H14v2h-4v-2H6.5L12 9.5zM5.12 5l.82-1h12l.93 1H5.12z"/></svg>',
  assignment:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>',
}
const constants = {
  paddingLeft: -30,
  paddingRight: -30,
  paddingTop: 5,
  paddingBottom: 5,
  noBorder: [false, false, false, false],
  noMargin: [0, 0, 0, 0],
  tableBorderWidth: 0.5,
  headingPaddingTop: 20,
  colWidth: [100, 100, 100, 100, 100],
  textBasic: {
    fontSize: 10,
    color: 'black',
    margin: [0, 5],
  },
}

const layout = {
  main: {
    hLineColor: function (i, node) {
      return '#aaa'
    },
    vLineColor: function (i, node) {
      return '#aaa'
    },
    hLineWidth: function (i, node) {
      if (node.table.body.length == i) return 0
      else return constants.tableBorderWidth
    },
    vLineWidth: function (i, node) {
      return 0
    },
    paddingTop: function (i, node) {
      return 0
    },
    paddingBottom: function (i, node) {
      return 0
    },
    paddingLeft: function (i) {
      return i === 0 ? 0 : 8
    },
    paddingRight: function (i, node) {
      return i === node.table.widths.length - 1 ? 0 : 8
    },
  },
  row: {
    hLineColor: function (i, node) {
      return '#aaa'
    },
    vLineColor: function (i, node) {
      return '#aaa'
    },

    hLineWidth: function (i, node) {
      if (i == 1) return constants.tableBorderWidth
      else return 0
    },
    vLineWidth: function (i, node) {
      if (i == 0 || i === node.table.widths.length) {
        return constants.tableBorderWidth
      }
      return 0
    },
    paddingLeft: function (i) {
      return i === 0 ? 0 : 8
    },
    paddingRight: function (i, node) {
      return i === node.table.widths.length - 1 ? 0 : 8
    },
    paddingTop: function (i, node) {
      return 0
    },
    paddingBottom: function (i, node) {
      return 0
    },
  },
  zero: {
    hLineWidth: function (i, node) {
      return 0
    },
    vLineWidth: function (i, node) {
      return 0
    },
    paddingLeft: function (i, node) {
      return 0
    },
    paddingRight: function (i, node) {
      return 0
    },
    paddingTop: function (i, node) {
      return 0
    },
    paddingBottom: function (i, node) {
      return 0
    },
  },
}

let getAction = (action) => {
  let actionStr = action
  let icon
  switch (action) {
    case 'create':
      icon = svg.assignment
      break
    case 'archived':
      icon = svg.archive
      break
    case 'restored':
      icon = svg.unarchive
      break
    case 'renamed':
      icon = svg.person_add
      break
    case 'share':
      icon = svg.lock_open
      break
    case 'unshare':
      icon = svg.lock
      break
    default:
      icon = svg.lock
  }
  if (action) {
    actionStr = action.charAt(0).toUpperCase() + action.slice(1)
  }

  return {
    layout: layout.zero,
    margin: constants.noMargin,
    table: {
      widths: [40, 'auto'],
      body: [
        [
          { svg: icon, style: 'svgCell', alignment: 'right', fit: [11, 11] },
          { text: actionStr, style: 'textCell', margin: [5, 5], alignment: 'center' },
        ],
      ],
    },
  }
}

let makeCell = (str) => {
  return {
    style: 'textCell',
    text: str,
  }
}

let makeCellProof = (status, txHash, txNetwork) => {
  let textStyle
  if (status) {
    textStyle = 'textLink'
  } else {
    textStyle = 'textItalics'
  }
  let ethNetwork = txNetwork && txNetwork !== 'mainnet' ? `${txNetwork}.` : ''
  let text = status ? { text: 'View Record' } : { text: 'Pending Confirmation' }
  let link = status ? { link: `https://${ethNetwork}etherscan.io/tx/${txHash}` } : {}
  return {
    style: textStyle,
    ...text,
    ...link,
  }
}

let makeRowDescription = (item) => {
  let description
  let txHash = item.txHash ? item.txHash : 'pending confirmation'

  if(item.user) {
    let company = item.user.company ? `${item.user.company}. ` : '';
    description = `${item.fileOwner.name} ${item.fileOwner.surname} (${item.fileOwner.email}) ${item.action} with ${item.user.name} ${item.user.surname} (${item.user.email})\nThe blockchain transaction is ${txHash}`
  } else {
    description = `${item.fileOwner.name} ${item.fileOwner.surname} (${item.fileOwner.email}) ${
      item.action
    } file at ${moment(item.date).format('HH:mm DD/MM/YYYY')}\nThe blockchain transaction is ${txHash}`
  }
  return {
    style: 'textRow',
    colSpan: 5,
    text: description,
  }
}

let propulate = (items) => {
  return items.map((item) => {
    if (!item.fileOwner) {
      item.fileOwner = item.user
      delete item.user
    }

    let arrA = [
      {
        colSpan: 5,
        layout: layout.row,
        margin: constants.noMargin,
        table: {
          widths: constants.colWidth,
          body: [
            [
              getAction(item.action),
              makeCell(moment(item.date).format('HH:mm DD/MM/YYYY')),
              makeCell(`${item.fileOwner.name} ${item.fileOwner.surname}`),
              makeCell(`${item.ipAddress}`),
              makeCellProof(item.status, item.txHash, item.txNetwork),
            ],
            [makeRowDescription(item)],
          ],
        },
      },
    ]
    return arrA
  })
}

function bytesToSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes == 0) return '0 Byte'
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
}

const logoMap = {
  emin: '/../static/logo/emin_logo.png',
  default: '/../static/logo/logo.png',
}

let generatePdf = (file, histories, app, res) => {
  console.log(histories)
  const logo = logoMap[app] ? logoMap[app] : logoMap.default
  let ext = file.extension ? `.${file.extension}` : ''
  let filename = `${file.name}${ext}`
  let rows = propulate(histories)
  let docDefinition = {
    content: [
      {
        image: __dirname + logo,
        alignment: 'center',
        width: 150,
        margin: constants.noMargin,
      },
      { text: `Date: ${moment(file.uploaded).format('HH:mm DD-MM-YYYY')}`, style: 'textNormal' },
      { text: `File: ${filename}`, style: 'textNormal' },
      { text: `Size: ${bytesToSize(file.size)}`, style: 'textNormal' },
      { text: 'History', style: 'header' },
      {
        style: 'tableMain',
        layout: layout.main,
        table: {
          dontBreakRows: 1,
          headerRows: 1,
          keepWithHeaderRows: 1,
          widths: constants.colWidth,
          body: [
            [
              { text: 'Action', style: 'tableHeader', border: constants.noBorder },
              { text: 'Date', style: 'tableHeader', border: constants.noBorder },
              { text: 'By', style: 'tableHeader', border: constants.noBorder },
              { text: 'IP Address', style: 'tableHeader', border: constants.noBorder },
              { text: 'Proof', style: 'tableHeader', border: constants.noBorder },
            ],
            ...rows,
            [{ text: 'What does this mean?', style: 'textRowFooter', border: constants.noBorder, colSpan: 5 }],
            [
              {
                text:
                  'The data included in this report shows every action that has occurred concerning this document. This data cannot be changed by anyone, including system administrators.',
                style: 'textRow',
                border: constants.noBorder,
                colSpan: 5,
              },
            ],
          ],
        },
      },
    ],
    styles: {
      header: {
        fontSize: 16,
        bold: true,
        margin: [constants.paddingLeft, constants.headingPaddingTop, constants.paddingRight, constants.paddingBottom],
      },
      tableMain: {
        margin: [constants.paddingLeft, constants.paddingTop, constants.paddingRight, constants.paddingBottom],
      },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: '#666666',
        alignment: 'center',
        margin: constants.noMargin,
      },
      textRowFooter: {
        fontSize: 16,
        bold: true,
        color: 'black',
        margin: [5, constants.headingPaddingTop, 5, 0],
      },
      textRow: {
        ...constants.textBasic,
        margin: [5, 5],
      },
      textCell: {
        ...constants.textBasic,
        alignment: 'center',
      },
      textLink: {
        ...constants.textBasic,
        color: '#cc2531',
        alignment: 'center',
      },
      textItalics: {
        ...constants.textBasic,
        italics: true,
        alignment: 'center',
      },
      svgCell: {
        margin: [-5, 5, 1, 0],
      },
      textNormal: {
        fontSize: 12,
        color: 'black',
        margin: [constants.paddingLeft, 0],
      },
    },
  }

  let pdfDoc = printer.createPdfKitDocument(docDefinition)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename=test.pdf`)
  pdfDoc.pipe(res)
  pdfDoc.end()
}

module.exports = {
  generatePdf,
}
