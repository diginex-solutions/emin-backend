exports.sharedFullpath = '/shared'
exports.archivedFullpath = '/archived'
exports.reservedPaths = [this.sharedFullpath, this.archivedFullpath]
exports.initialNumFiles = 3
exports.inputId1 = '111'
exports.inputId2 = '222'
exports.contact = {
  email: "test@diginex.com",
  company: "diginex",
  surname: "testSurname",
  name: "testName",
  lang: "en"
}
exports.sampleTemplate = (inputId1, inputId2) => {
  const id1 = inputId1 ? inputId1: this.inputId1
  const id2 = inputId2 ? inputId2: this.inputId2

  const template = {
    name: 'simple template',
    inputs: [
      {
        type: 'text',
        id: id1,
        options: [],
      },
      {
        label: 'pick any',
        type: 'multiselect',
        id: id2,
        options: [{ id: '123' }, { id: '234' }],
      },
    ],
    languages: [
      {
        lang: 'en',
        inputs: [
          {
            id: id1,
            label: 'type something',
            options: [],
          },
          {
            id: id2,
            label: 'pick any',
            options: [
              { id: '123', label: 'aaa' },
              { id: '234', label: 'bbb' },
            ],
          },
        ],
      },
      {
        lang: 'hi',
        inputs: [
          {
            id: id1,
            label: 'type something',
            options: [],
          },
          {
            id: id2,
            label: 'pick any',
            options: [
              { id: '123', label: 'AAA' },
              { id: '234', label: 'BBB' },
            ],
          },
        ],
      },
    ],
  }
  return template
}
