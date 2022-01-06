const {credentials} = require('../config/config');


module.exports = (app) => {
    const { proxy, scriptUrl } = require('rtsp-relay')(app);
    
    const handler = proxy({
        url: credentials.rtsp_url,
        // if your RTSP stream need credentials, include them in the URL as above
        verbose: false,
    });

    app.ws('/api/stream', handler);

    return {
        scriptUrl:scriptUrl,
    };
};