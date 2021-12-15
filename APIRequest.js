'use strict';

class DynatraceAPIRequest {
	#retryLimit = 3;
	#defaultDelay = 500;  // ms
	#defaultTimeout = 1000;  // ms
	
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
        "/api/config/v1/utoTags"                      : "values",
        "/api/v2/entityTypes"                         : "types",
        "/api/v2/entities"                            : "entities",
        "/api/v2/problems"                            : "problems",
        "/api/v2/metrics/query"                       : "result",
        "/api/v2/metrics"                             : "metrics",
        "/api/v2/auditlogs"                           : "auditLogs",
        "/api/v2/settings/(schemas|objects)"          : "items",
        "/api/v1/synthetic/monitors"                  : "monitors",
        "/api/v2/activeGates"                         : "activeGates",
        "/api/v2/tags"                                : "tags"
    };
 
    async request(options, onDone = () => {}) {
		const createTime   = (new Date()).getTime();	

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
			if (!headers) return this.#defaultDelay;
			
			const retryAfter = Number(headers["Retry-After"]);
			return isNaN(retryAfter) ? this.#defaultDelay : retryAfter;
		};
			
        try {
            do {
                if (waitAndRetry)    // Wait for the specified amount of time.
                    await new Promise(resolve => setTimeout(resolve, waitAndRetry));   

                response = await axios(options);

                // We collect the wait time, but we only use it if we receive 
                // a recoverable error or if the response is paged.
                waitTime = getAPIResetDelay(response.headers);

                if (response.status >= 400) {
                    let now      = (new Date()).getTime();
                    let timeout  = options.timeout || this.#defaultTimeout;
                    let timeLeft = (createTime + timeout) > (now + waitTime);
            
                    if (response.status === 429 || response.status === 503) {   
                        // Too Many Requests or Service Unavailable. In both cases
                        // the 'Retry-After' header may be present. We will retry 
                        // after the retry time or a default delay has elapsed.
                        if (!timeLeft)
                            throw new Error(response.statusText + " - timeout of " + timeout + "ms exceeded");

                        waitAndRetry = waitTime;
                    } 
                    else if (response.data.error) {
                        // There is additional error info in data that we should use.
                        // Assumption is that it does not make sense to retry.
                        throw new Error(response.data.error);
                    }                    
                    else {
                        // Internal Server Error. Use default delay and retry as
                        // many times as we're allowed for this request.
                        if (!timeLeft || attempts-- < 0)
                            throw new Error(response.statusText + " - timeout of " + timeout + "ms or retry max of " + this.#retryLimit + " exceeded");
                        
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
                                ? null     // If we stream, we don't handle paging.
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
            if (error.response) {
                // The error was returned by the server.
				onDone(error.response.statusText);
                throw new Error(error.response.statusText);     
            }
            else if (error.request) {
                // The request was made but no response was received.
				onDone(error.message || error.code)
                throw new Error(error.message || error.code);
            }
            else {
                // The request was not made because an error occurred.
				onDone(error);
                throw new Error(error || "Unknown error");
            }       
        }
    }
}