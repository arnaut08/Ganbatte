import { createServer } from 'http';
import app from './app.js';
import { PORT } from './config/env.js';
import friendRoutes from './routes/friend-routes.js';
import gameRoutes from './routes/game-routes.js';
import assessmentRoutes from './routes/assessment-routes.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { configureSocketServer } from './socket/socket-server.js';

const server = createServer(app);

app.use('/api', friendRoutes);
app.use('/api', gameRoutes);
app.use('/api', assessmentRoutes);

app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use(notFoundHandler);
app.use(errorHandler);

await configureSocketServer(server, app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
