const {
  readFileSync,
  renameSync,
  unwatchFile,
  watchFile,
  writeFileSync,
} = require('node:fs');
const { basename, dirname, resolve } = require('node:path');
const jsonServer = require('json-server');
const config = require('../json-server.json');

const projectRoot = resolve(__dirname, '..');

function readDatabase(filename) {
  const data = JSON.parse(readFileSync(filename, 'utf8').trim());
  const { accounts, products, reports } = data;
  if (![accounts, products, reports].every(Array.isArray)) {
    throw new Error('โครงสร้างข้อมูล Campus Market ไม่ถูกต้อง');
  }
  return data;
}

function startServer({
  databasePath = resolve(projectRoot, 'db.json'),
  storageDirectory = resolve(dirname(databasePath), 'uploads', 'videos'),
  port = 3001,
} = {}) {
  const filename = resolve(databasePath);
  const temporaryFile = resolve(dirname(filename), `.~${basename(filename)}`);
  const app = jsonServer.create();
  const initialData = readDatabase(filename);
  let savedDatabase = JSON.stringify(initialData);
  const router = jsonServer.router(initialData, {
    foreignKeySuffix: config.foreignKeySuffix,
  });
  const db = router.db;

  db.write = (result) => {
    // เขียนไฟล์ชั่วคราวให้ครบก่อนสลับเข้าแทนไฟล์ข้อมูล
    try {
      const data = JSON.stringify(db.getState(), null, 2);
      writeFileSync(temporaryFile, data + '\n');
      renameSync(temporaryFile, filename);
      savedDatabase = data;
    } catch (error) {
      db.setState(JSON.parse(savedDatabase));
      throw error;
    }
    return result;
  };

  app.db = db;
  app.locals.videoStorageDirectory = resolve(storageDirectory);
  app.use(
    jsonServer.defaults({
      noCors: config.noCors,
      bodyParser: true,
      static: resolve(projectRoot, 'public'),
    }),
  );
  for (const middleware of config.middlewares) {
    app.use(require(resolve(projectRoot, middleware)));
  }
  app.use(router);

  function reloadDatabase(current) {
    if (current.nlink === 0) return;

    try {
      const data = readDatabase(filename);
      savedDatabase = JSON.stringify(data);
      db.setState(data);
    } catch (error) {
      console.warn(`โหลดฐานข้อมูลที่แก้ไขไม่ได้ ${error.message}`);
    }
  }

  const server = app.listen(port, config.host);
  server.once('listening', () => {
    watchFile(filename, { interval: 500, persistent: false }, reloadDatabase);
  });
  server.once('close', () => unwatchFile(filename, reloadDatabase));
  return server;
}

if (require.main === module) {
  const server = startServer();
  server.once('listening', () => {
    console.log(
      `Campus Market API พร้อมที่ http://${config.host}:${server.address().port}`,
    );
  });
}

module.exports = { startServer };
