const cluster = require('cluster');
const os = require('os');

const app = require ('./app');

const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 80 : 5500);
const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  })
} else {
  const server = app.listen(PORT);

  console.log(`Worker ${process.pid} started`);
}
