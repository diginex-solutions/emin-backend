const rootPath = `${__dirname}/../`
const app = require(`${rootPath}/dist/index.js`)
const api = require('./api-units')
const jwt = api.loginReq()
const state = {};
console.log('jwt', jwt);

function importTest(name, path, param) {
  describe(`🔥 ${name}`, function () {

    state.passed = true

    afterEach(function() {
      state.passed = state.passed &&
      (this.currentTest.state === "passed");
    });

    beforeEach(function() {
      if (!state.passed) {
        return this.currentTest.skip();
      }
    });

    beforeEach(function() {
      return require('../data/seed').seed()
    });

    require(path)(jwt, param);
  });
}

describe("Starting test suites", function () {
    importTest("Basic files operations", './basicFiles/main.test.js');
    importTest("Moving around folders and files", './basicFolders/main.test.js');
    // importTest("Contacts features", './contacts/main.test.js');
    importTest("Form Template features", './formTemplate/template.test.js');

});


