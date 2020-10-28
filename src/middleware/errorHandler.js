const log = require('../helper/logger.js').log
const config = require('../config')
const errors = require('../helper/errors')
const errorNotifier = require('../helper/errorNotifier')
const { CastError, ValidationError } = require('mongoose').Error
const {
  CorsError,
  AuthError,
  ReCaptchaException,
  ResourceNotFoundException,
  UniqueConstraintException,
  InternalServerError,
  InvalidRequestPayloadException,
  InvalidStateTransitException,
  PermissionDeniedException,
  DuplicateAccessesException,
} = require('../helper/customError')

const actionCatch = (action) => (req, res, next) => action(req, res, next).catch(next)

let errHandler = (err, req, res, next) => {
  log.error(err)
  errorNotifier.send(err + err.stack)
  if (err instanceof TypeError) {
    errors.make(res, errors.internalServerError)
  } else if (err instanceof ResourceNotFoundException) {
    errors.makeMessage(res, errors.notFoundError, err.message)
  } else if (err instanceof InternalServerError) {
    errors.makeMessage(res, errors.internalServerError, err.message)
  } else if (err instanceof UniqueConstraintException) {
    errors.makeMessage(res, errors.invalidRequestPayload, err.message)
  } else if (err instanceof InvalidRequestPayloadException) {
    errors.makeMessage(res, errors.invalidRequestPayload, err.message)
  } else if (err instanceof ValidationError) {
    errors.makeMessage(res, errors.invalidRequestPayload, err.message)
  } else if (err instanceof InvalidStateTransitException) {
    errors.makeMessage(res, errors.conflictError, err.message)
  } else if (err instanceof CastError) {
    errors.makeMessage(res, errors.badRequest, 'Please check your input: ' + err.message)
  } else if (err instanceof CorsError) {
    errors.make(res, errors.corsError)
  } else if (err instanceof PermissionDeniedException) {
    errors.makeMessage(res, errors.PermissionDeniedException, err.message)
  } else if (err instanceof DuplicateAccessesException) {
    errors.makeMessage(res, errors.conflictError, err.message)
  } else if (err instanceof ReCaptchaException) {
    errors.makeMessage(res, errors.recaptchaError, err.message)
  } else {
    errors.makeMessage(res, errors.internalServerError, 'Uncaught Error')
  }
}

module.exports = {
  actionCatch,
  errHandler,
}
