const cluster = require('cluster');
const db = require('./lib/db/db');

/**
 * Starts a new process to execute a server instance 
 * @returns {void}
 */
function StartWorker() {
    const worker = cluster.fork();
    console.log(`Cluster: Worker ${worker.id} started.`);
}

if(cluster.isMaster) {
    // Cluster master controls the state and number of workers
    require('os').cpus().forEach(StartWorker);

    cluster.on('disconnect', (worker) => {
        console.log(`Cluster: Worker ${worker.id} disconnected from the cluster.`);
    });
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Cluster: Worker ${worker.id} finished with exit code ${code} (${signal})`);
        StartWorker();
    });

    db.CleanOldRecords()
        .then(() => console.log('Cleaned old records'))
        .catch((err) => console.log('ERROR: could not clean old records: ' + err));

    setInterval(() => {db.CleanOldRecords()
        .then(() => console.log('Cleaned old records'))
        .catch((err) => console.log('ERROR: could not clean old records: ' + err));
    }, 24*60*60*1000); //Clear old records every 24hrs
    
}else {
    // Child processes execute an instance for the index app
    const {credentials} = require('./lib/config/config');
    const port = credentials.port;
    require('./index')(port);
}