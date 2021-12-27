const cluster = require('cluster');

/**
 * Starts a new process to execute a server instance 
 * @returns {void}
 */
function startWorker() {
    const worker = cluster.fork();
    console.log(`Cluster: Worker ${worker.id} started.`);
}

if(cluster.isMaster) {
    // Cluster master controls the state and number of workers
    require('os').cpus().forEach(startWorker);

    cluster.on('disconnect', (worker) => {
        console.log(`Cluster: Worker ${worker.id} disconnected from the cluster.`);
    });
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Cluster: Worker ${worker.id} finished with exit code ${code} (${signal})`);
        startWorker();
    });
}else {
    // Child processes execute an instance for the index app
    const {credentials} = require('./lib/config/config');
    const port = credentials.port;
    require('./index')(port);
}