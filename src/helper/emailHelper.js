const sanitizeHtml = require('sanitize-html')
const _ = require('lodash')
const fs = require('fs')
const config = require('../config')
const { LANGUAGES } = require('../constants')

function makeEmail(beginningText, followingText, fileLink, lang) {
  fileLink = sanitizeHtml(fileLink)
  const appName = config.appName
  const logoUrl = config.logoUrl
  const termsOfUseUrl = config.termsOfUseUrl
  const privacyPolicyUrl = config.privacyPolicyUrl

  let template = ''
  if (lang !== LANGUAGES.default && fs.existsSync(`${__dirname}/../templates/email.${lang}.html`)) {
    template = fs.readFileSync(`${__dirname}/../templates/email.${lang}.html`)
  } else {
    template = fs.readFileSync(`${__dirname}/../templates/email.html`)
  }

  return _.template(template)({ beginningText, followingText, fileLink, appName, logoUrl,  termsOfUseUrl, privacyPolicyUrl })
}


function makeBaseEmail(content, lang) {
  const logoUrl = config.logoUrl
  const termsOfUseUrl = config.termsOfUseUrl
  const privacyPolicyUrl = config.privacyPolicyUrl
  let template = ''
  if (lang !== LANGUAGES.default && fs.existsSync(`${__dirname}/../templates/base/email.${lang}.html`)) {
    template = fs.readFileSync(`${__dirname}/../templates/base/email.${lang}.html`)
  } else {
    template = fs.readFileSync(`${__dirname}/../templates/base/email.html`)
  }
  return _.template(template)({ content: stringToHTML(content), logoUrl, termsOfUseUrl, privacyPolicyUrl })
}

function stringToHTML(string) {
  return string.replace(/((https:\/\/|http:\/\/)[^ |\s\t\r\n]+)/g, '<a href=$1>$1</a>').replace(/(?:\r\n|\r|\n)/g, '<br/>')
}

module.exports = {
  makeEmail,
  makeBaseEmail,
}
