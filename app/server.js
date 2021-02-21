//@ts-check

import { default as express } from 'express';
import bodyParser from 'body-parser';
import _ from 'express-async-errors';
import morgan from 'morgan';

import { mware, db } from './utils/index.js';
import * as routes from './controllers/index.js';

const app = express();

// Indicate the app is ready when DB connection is established.
db.connect(() => app.emit('ready'));

// Add JSON bodyparsing.
app.use(bodyParser.json());
// Serve HTML files from public folder.
app.use(express.static('public'));

// Attach pre-route middlewares.
app.use(mware.pathProvider);

// Attach morgan logger for other than test mode.
process.env.NODE_ENV !== 'test' ? app.use(morgan('tiny')) : null;

// Add diggerent API routes.
app.use('/api/posts', routes.posts);
app.use('/api/login', routes.login);
app.use('/api/users', routes.users);
app.use('/api/images', routes.images);

// Attach post-route middlewares.
app.use(mware.unknownHandler);
app.use(mware.errorHandler);

export default app;
