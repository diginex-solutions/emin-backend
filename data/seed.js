//var log = require('../dist/helper/logger.js').log;

const { ObjectId } = require('mongodb');
const path = require('path');
const { Seeder } = require('mongo-seeding');

const config = {
  database: 'mongodb://localhost:27017/diginex-trust',
  dropDatabase: true,
};
const seeder = new Seeder(config);

const collectionReadingOptions = {
  extensions: ['ts'],
  transformers: [
    Seeder.Transformers.replaceDocumentIdWithUnderscoreId,
  ]
}

let seed = async () => {
  var collections = seeder.readCollectionsFromPath(
    path.resolve('./data'),
    collectionReadingOptions
  );

  return await seeder
    .import(collections)
    .then(() => {
      //log.info('Success');
    })
    .catch(err => {
      //log.error('Error', err);
    });
}

module.exports.seed = seed
