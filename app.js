import http from 'http';

import app from './app/server.js';
import { config, logger } from './app/utils/index.js';

app.once('ready', () => {
  http
    .createServer(app)
    .listen(config.PORT, () =>
      logger.i(`Server running... [PORT: ${config.PORT}]`)
    );
});
