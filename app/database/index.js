const Datastore = require('nedb-promise');

const config = require('../config');
const { rootResolve } = require('../paths');
const isTests = process.env.NODE_ENV === 'test';
const dbPath = config.dbPath;

const db = {};

const storeConfig = {
  timestampData: true
};

const StoreFactory = ({ name }) =>
  new Datastore(isTests ?
    storeConfig : {
      ...storeConfig,
      filename: rootResolve(`${dbPath}/${name}.nedb`)
    }
  );

db.users = StoreFactory({
  name: 'users'
});

db.comments = StoreFactory({
  name: 'comments'
});

db.posts = StoreFactory({
  name: 'posts'
});

async function indexDb() {
  await db.users.ensureIndex({
    fieldName: 'nickname',
    unique: true
  });

  await db.posts.ensureIndex({
    fieldName: 'userId',
  });

  await db.comments.ensureIndex({
    fieldName: 'userId',
  });

  await db.comments.ensureIndex({
    fieldName: 'postId',
  });
}

module.exports.db = db;

module.exports.connect = async () => {
  await Promise.all(
    Object.values(db).map(item => item.loadDatabase())
  );

  await indexDb();
};
