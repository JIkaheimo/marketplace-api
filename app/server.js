//@ts-check

// Third-party modules.
import { default as express } from 'express';
import bodyParser from 'body-parser';
import _ from 'express-async-errors';
import morgan from 'morgan';
import cors from 'cors';

// In-house modules.
import { mware, db } from './utils/index.js';
import * as routes from './controllers/index.js';
import {
  IMAGES_PATH,
  LOGIN_PATH,
  POSTS_PATH,
  USERS_PATH,
} from './constants.js';

const app = express();

// Add cross-origin support.
app.use(cors());

// Serve HTML files from public folder.
app.use(express.static('public', { extensions: ['html'] }));

// Add JSON bodyparsing.
app.use(bodyParser.json());

// Indicate the app is ready when DB connection is established.
db.connect(() => app.emit('ready'));

// Attach pre-route middlewares.
app.use(mware.pathProvider);

// Attach morgan logger for other than test mode.
process.env.NODE_ENV !== 'test' ? app.use(morgan('tiny')) : null;

// Add diggerent API routes.
app.use(POSTS_PATH, routes.posts);
app.use(LOGIN_PATH, routes.login);
app.use(USERS_PATH, routes.users);
app.use(IMAGES_PATH, routes.images);

// Attach post-route middlewares.
app.use(mware.unknownHandler);
app.use(mware.errorHandler);

export default app;
