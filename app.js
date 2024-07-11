import bodyParser from 'body-parser';
import { router as appRoutes } from './routes/routes.js';
import express from 'express';


const app = express();
app.use(bodyParser.json());

// Use the routes from routes.js
app.use(appRoutes);

app.listen(8080, () => console.log('Server running on port 8080'));