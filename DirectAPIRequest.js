'use strict';

const axios = require('axios').default;

class DirectAPIRequest {
	#defaults = {
        retryLimit: 3,
	    retryAfter: 100,  // ms
	    timeout:    5000  // ms
    }
	
    #resultProps = {
        "/api/v1/userSessionQueryLanguage/tree"       : "values",
        "/api/v1/userSessionQueryLanguage/table"      : "values",
        "/api/v1/entity/infrastructure/processes"     : null,
        "/api/v1/entity/infrastructure/process-groups": null,
        "/api/v1/entity/infrastructure/hosts"         : null,
        "/api/v1/entity/infrastructure/services"      : null,
        "/api/v1/entity/infrastructure/applications"  : null,
        "/api/v1/oneagents"                           : "hosts",
        "/api/config/v1/managementZones"              : "values",
        "/api/config/v1/autoTags"                     : "values",
        "/api/v2/entityTypes"                         : "types",
        "/api/v2/entities"                            : "entities",
        "/api/v2/problems"                            : "problems",
        "/api/v2/metrics/query"                       : "result",
        "/api/v2/metrics"                             : "metrics",
        "/api/v2/auditlogs"                           : "auditLogs",
        "/api/v2/settings/schemas"                    : "items",
        "/api/v2/settings/objects"                    : "items",
        "/api/v1/synthetic/monitors"                  : "monitors",
        "/api/v2/activeGates"                         : "activeGates",
        "/api/v2/tags"                                : "tags"
    };

    /*  When using axios, the rejectUnauthorized works like this:

            const agent = new https.Agent({ rejectUnauthorized: false });
            axios.get('https://something.com/foo', { httpsAgent: agent });

        OR:
            https.globalAgent.options.rejectUnauthorized = false;

        As a last resort, this can be placed in the top of the main JS file:
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
     */ 

    constructor(defaults = {}) {
        this.#defaults = { ...this.#defaults, ...defaults };
    }

    async fetch(options, onDone = () => {}) {
        const now        = (new Date()).getTime();
		const createTime = options.createTime || now;	
        const timeout    = options.timeout    || this.#defaults.timeout;
        const retryLimit = options.retryLimit || this.#defaults.retryLimit;
        const retryAfter = this.#defaults.retryAfter;

        // There are certain errors that are potentially recoverable.
        options.validateStatus = status => 
            (status  >= 200 && status  <  400) || 
             status === 429 || status === 500  || status === 503;

        // If we need to append result sets due to paging, we have to account 
        // for situations where the sets are under a property rather than as 
        // top-level flat array.		
        let prop = this.#resultProps[options.url];
        let list = null;
        let data = null;
        let response = null;
        let waitTime = null;
        let waitAndRetry = null;
        let nextPageKey  = null;
		let attempts     = retryLimit;
		
		const getAPIResetDelay = (headers) => {
			if (!headers) return retryAfter;
			const delay = Number(headers["Retry-After"]);
			return isNaN(delay) ? retryAfter : delay;
		};
			
        try {
            do {
                if (waitAndRetry)    // Wait for the specified amount of time.
                    await new Promise(resolve => setTimeout(resolve, waitAndRetry));   

                // In case we need to retry or get multiple pages it's best to  
                // give Axios a clean 'options' object for each request.
                response = await axios({ ...options }); 

                // We collect the wait time, but we only use it if we receive a
                // recoverable error or if the response is paged.
                waitTime = getAPIResetDelay(response.headers);

                if (response.status >= 400) {
                    let timeLeft = (createTime + timeout) > (now + waitTime);
            
                    if (response.status === 429 || response.status === 503) {   
                        // Too Many Requests or Service Unavailable. In both cases
                        // the 'Retry-After' header may be present. We will retry 
                        // after the retry time or a default delay has elapsed.
                        if (!timeLeft)
                            throw new Error(response.statusText + " - timeout of " + timeout + "ms exceeded");

                        waitAndRetry = waitTime;
                    }               
                    else {
                        // Internal Server Error. Use default delay and retry as
                        // many times as we're allowed for this request.
                        if (!timeLeft || attempts-- < 0)
                            throw new Error(response.statusText + " - timeout of " + timeout + "ms or retry max of " + retryLimit + " exceeded");
                        
                        waitAndRetry = waitTime;
                    }
                }
                else {
                    // Good, useable JSON response received.
                    waitAndRetry = null;

                    // Depending on the API, a paged set of results may be an
                    // array, or may be an array at a property.
                    list = prop ? response.data[prop] : response.data;
                    data = data !== null 
                         ? data.concat(list)
                         : list;  
                        
                    nextPageKey = options.responseType === 'stream' 
                                ? null   // If we stream, we don't handle paging.
                                : response.headers["next-page-key"] || // v1
                                  response.data.nextPageKey;           // v2      

                    if (nextPageKey) {
                        // There's slight difference between v1 and v2 APIs here.
                        if (options.url.includes('/v1'))
                            options.params.nextPageKey = encodeURIComponent(nextPageKey);
                        else 
                            options.params = { nextPageKey: encodeURIComponent(nextPageKey) };

                        // Wait a sec and then get the next set (page) of data.
                        waitAndRetry = waitTime;
                    }
                }
            } while (waitAndRetry);

            // If we had take the data from a property so that we could
            // keep appending paged data, then put that property back again.
            if (prop) {
                list = data;
                data = {};
                data[prop] = list;
            }

			onDone(null, data);
            return data; 
        }
        catch (error) {  
            // Errors handled here are unrecoverable.
            const raisedError= {
                status:  null,
                message: null,
                url:     options.url,
                baseURL: options.baseURL,
                method:  options.method,
                params:  options.params,
                data:    options.data
            }

            if (error.response) {
                // The error was returned by the server.
                // We can still have Dynatrace explanations in the response.
                if (error.response.data && error.response.data.error) {
                    raisedError.status  = error.response.status;                                      
                    raisedError.message = error.response.data.error.constraintViolations
                                      ||  error.response.data.error.message
                                      ||  error.response.statusText;
                }
                else {
                    raisedError.status  = error.response.status;   
                    raisedError.message = error.response.statusText;
                }
            }
            else if (error.request) {
                // The request was made but no response was received.
                raisedError.status  = error.code;    
                raisedError.message = error.message || error.code || "Failed to issue request"
            }
            else {
                // The request was not made because an error occurred.
                raisedError.status  = error.status || 0;
                raisedError.message = error.message;
            }       
            
            onDone(raisedError);
            throw raisedError;            
        }
    }
}

module.exports = DirectAPIRequest;