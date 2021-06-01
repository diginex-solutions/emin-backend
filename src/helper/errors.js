const ERRORS_LIST = {
  badRequest: {
    status: 400,
    code: 40000,
    error: 'Bad Request',
  },
  loginNoCode: {
    status: 403,
    error: '"code" field is required',
  },
  registrationFail: {
    status: 400,
    error: 'Registration failed',
  },
  internalServerError: {
    status: 500,
    error: 'Internal Server Error',
  },
  PermissionDeniedException: {
    status: 403,
    code: 40302,
    error: 'Permission Denied',
  },
  authenticationFail: {
    status: 406,
    code: 40001,
    error: 'Authentication failure',
  },
  authenticationError: {
    status: 401,
    code: 40002,
    error: 'Authentication failure',
  },
  invalidRequestPayload: {
    status: 422,
    code: 40022,
    error: 'Invalid request payload',
  },
  corsError: {
    status: 403,
    code: 40301,
    error: 'Not allowed by CORS',
  },
  notFoundError: {
    status: 422,
    code: 42204,
    error: 'Request not processable',
  },
  conflictError: {
    status: 409,
    code: 40901,
    error: 'Conflict',
  },
  recaptchaError: {
    status: 422,
    code: 42201,
    error: 'Failed to validate reCaptcha',
  },
  wrongPasswordError: {
    status: 402,
    code: 40201,
    error: 'Current password is incorrect',
  }
}

function make(res, error) {
  res.statusCode = error.status
  res.json(error)
}

function makeMessage(res, error, message) {
  res.statusCode = error.status
  res.json({ ...error, message })
}

module.exports = {
  ...ERRORS_LIST,
  make,
  makeMessage,
}
