import { tuft, createBodyParser } from 'tuft';
import { createHelmetPrehandler } from '@tuft/helmet-prehandler';
import { createViewResponder } from '@tuft/view-responder';
import { join } from 'path';
import { createClient } from './db';
import { create } from './controllers/create';
import { redirect } from './controllers/redirect';
import { notFoundResponse } from './error-responses';
import { DB_TABLE_NAME, DB_ITEM_TTL } from './constants';

if (
  process.env.NODE_ENV !== 'development' &&
  process.env.NODE_ENV !== 'test' &&
  process.env.NODE_ENV !== 'production'
) {
  const err = new Error('\'NODE_ENV \' environment variable must be set to \'development\', \'test\', or \'production\'.');
  console.error(err);
  process.exit(1);
}

if (process.env.HOST === undefined) {
  const err = new Error('\'HOST\' environment variable must be set.');
  console.error(err);
  process.exit(1);
}

if (process.env.PORT === undefined) {
  const err = new Error('\'PORT\' environment variable must be set.');
  console.error(err);
  process.exit(1);
}

const MAX_BODY_SIZE = 2048; // bytes

const host = process.env.HOST;
const port = process.env.PORT;
const assetsDir = join(__dirname, '../public');

async function init() {
  try {
    const dbClient = await createClient(DB_TABLE_NAME, DB_ITEM_TTL);

    const app = tuft({
      cors: {
        allowOrigin: 'https://reactclient.knck.xyz',
      },
      preHandlers: [
        createBodyParser('urlEncoded', MAX_BODY_SIZE),
        createHelmetPrehandler({
          hidePoweredBy: false,
          ieNoOpen: false,
          frameguard: false,
        }),
      ],
      responders: [
        createViewResponder('ejs', 'views'),
      ],
    });

    // Serve static web assets from the root path.
    await app.static('/', assetsDir);

    app
      .set('GET /', { render: 'index' })
      .set('POST /', create.bind(null, dbClient))
      .set('GET /{urlId}', redirect.bind(null, dbClient))
      .set('/{**}', notFoundResponse)
      .onError(console.error);

    const server = app.createServer({ host, port });
    const address = await server.start();

    console.log(`Server is listening at http://${address.host}:${address.port}`);
  }

  catch (err) {
    console.error(err);
    process.exit(1);
  }
}

init();
