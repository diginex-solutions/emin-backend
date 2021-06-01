var sgMail = require('@sendgrid/mail')
var log = require('../helper/logger.js').log
var config = require('../config')
var emailHelper = require('../helper/emailHelper')
const nodemailer = require('nodemailer')
const { LANGUAGES } = require('../constants')

const i18n = require('i18n')
let locale = {}
i18n.configure({
  locales: Object.values(LANGUAGES),
  register: locale,
  directory: __dirname + '/../locales',
})

let sendEmail = (email, link, filename, name, surname, username, isVerify, lang = LANGUAGES.default) => {
  if (email.indexOf('@') == -1) {
    return
  }
  // sgMail.setApiKey(config.sendgrid.apiKey);
  locale.setLocale(lang)
  let beginningText, followingText
  if (isVerify) {
    beginningText = `${locale.__("{{name}} has sent you '{{file}}' for review and verify.", {
      name: username,
      file: filename,
    })}`
    followingText = ''
  } else {
    beginningText = `${locale.__("{{name}} has shared '{{file}}' with you.", { name: username, file: filename })}`
    followingText = `${locale.__('Please click the button below to access and download the file.')}`
  }

  var msg = {
    to: email,
    from: config.sendgrid.from,
    subject: beginningText,
    text: `Hi,\n\n${beginningText}\n\n${followingText}\n\n${link}\n\nKind regards,\n${config.appName} Team\n\nTerms of Use: https://www.diginex.com/customer-agreement/\nPrivacy Policy: https://www.diginex.com/privacy-policy/`,
    html: emailHelper.makeEmail(beginningText, followingText, link, lang),
  }
  send(msg)
}

function sendPasswordResetEmail(email, name, token) {
  const link = `${config.webUrl}/reset-password?token=${token}`
  const text = `Hi ${name},\n\nYou recently requested a password reset for your ${config.appName} account. You can set a new password here:\n\n${link}\n\nIf you didn't request this, please ignore this message.\n\nKind regards,\n${config.appName} Team\n\n`
  const msg = {
    to: email,
    from: config.sendgrid.from,
    subject: `Reset your ${config.appNameShort} password`,
    text,
    html: emailHelper.makeBaseEmail(text),
  }
  send(msg)
}

function sendRegistractionEmail(email, inviterName, name, link) {
  const googlePlayUrl = config.googlePlayUrl
  const text = `Hi ${name},\n\n${inviterName} has invited you to register on ${config.appName}. You can register here:\n\n${googlePlayUrl}\n\nKind regards,\n${config.appName} Team\n\n`
  const msg = {
    to: email,
    from: config.sendgrid.from,
    subject: `${inviterName} invited you to join ${config.appName}`,
    text,
    html: emailHelper.makeBaseEmail(text),
  }
  send(msg)
}

function sendSpaceInvitedEmail(email, inviterName, name, spaceName, link) {
  const text = `Hi ${name},\n\n${inviterName} has invited you to space \"${spaceName}\". You can review the invitation here:\n\n${link}\n\nKind regards,\n${config.appName} Team\n\n`
  const msg = {
    to: email,
    from: config.sendgrid.from,
    subject: `${inviterName} invited you to join ${config.appName}`,
    text,
    html: emailHelper.makeBaseEmail(text),
  }
  send(msg)
}

function send(msg) {
  // if (process.env.APP_ENV === 'local') {
  //   const previewEmail = require('preview-email')
  //   previewEmail(msg)
  // } else {
    // sgMail.send(msg);
    const cb = (err, info) => console.log('info, err', info, err);
    nodemailer.createTransport(config.nodemailer).sendMail(msg, cb)
  //}
}

function sendCaseUserAddedEmail(email, recipientName, relatedUser, caseNo, link) {
  const text = `Dear ${recipientName || ''},\n\nThe is to notify that you have been added as a participant to case ${caseNo} by ${relatedUser}. You can refer the case by clicking on the link below\n\n${link}\n\nKind Regards,\n\n${config.appName} Team`
  const msg = {
    to: email,
    from: config.sendgrid.from,
    subject: `${relatedUser} has added you to case ${caseNo}`,
    text: text,
    html: emailHelper.makeBaseEmail(text),
  }
  send(msg)
}

function sendCaseCommentedEmail(email, recipientName, relatedUser, caseNo, link) {
  const text = `Dear ${recipientName},\n\nThis is to notify that ${relatedUser} has added a comment to case ${caseNo}. You can refer the case by clicking on the link below\n\n${link}\n\nKind Regards,\n\n${config.appName} Team`
  const msg = {
    to: email,
    from: config.sendgrid.from,
    subject: `${relatedUser} has commented to case ${caseNo}`,
    text: text,
    html: emailHelper.makeBaseEmail(text),
  }
  send(msg)
}

function sendCaseManagerAssignedEmail(email, recipientName, relatedUser, caseNo, link) {
  const text = `Dear ${recipientName},\n\nThis is to notify that your reported case ${caseNo} is now picked up by a Case Manager. You can refer the case by clicking on the link below\n\n${link}\n\nKind Regards,\n\n${config.appName} Team`
  const msg = {
    to: email,
    from: config.sendgrid.from,
    subject: `Case ${caseNo} picked up by a Case Manager`,
    text: text,
    html: emailHelper.makeBaseEmail(text),
  }
  send(msg)
}
module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendRegistractionEmail,
  sendCaseUserAddedEmail,
  sendCaseCommentedEmail,
  sendCaseManagerAssignedEmail,
  sendSpaceInvitedEmail,
}
