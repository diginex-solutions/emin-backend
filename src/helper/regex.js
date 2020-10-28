const isEmail = (email) => {
  let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email))
}

const isAlphabetOnly = (str) => {
  let re = /^[A-Za-z]+$/
  return re.test(String(str))
}

const isNameValid = (str) => {
  let re = /^[A-Za-z ]+$/
  return re.test(String(str))
}

const passwordValidationError = (password) => {
  const regexs = [
    { msg: 'Password should have minimum length of 8', re: /^.{8,}$/ },
    { msg: 'Password should have at least one lower case letter', re: /^(?=.*[a-z]).*$/ },
    { msg: 'Password should have at least one upper case letter', re: /^(?=.*[A-Z]).*$/ },
    { msg: 'Password should have at least one digit', re: /^(?=.*[0-9]).*$/ },
    { msg: 'Password should have at least one special character', re: /^(?=.*[!@#\$%\^\&*\)\(+=._-]).*$/ },
  ]
  for (const reg of regexs) {
    if (!reg.re.test(password)) {
      return reg.msg
    }
  }
  return null
}

module.exports = {
  isEmail,
  isAlphabetOnly,
  isNameValid,
  passwordValidationError,
}
