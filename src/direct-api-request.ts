import https, { Agent } from "https";
import axios from "axios";
import { Limits, RequestCallback, RequestOptions } from './types';
import { Readable } from "stream";

const resultProps = {
    "/api/v1/userSessionQueryLanguage/tree": "values",
    "/api/v1/userSessionQueryLanguage/table": "values",
    "/api/v1/entity/infrastructure/processes": null,
    "/api/v1/entity/infrastructure/process-groups": null,
    "/api/v1/entity/infrastructure/hosts": null,
    "/api/v1/entity/infrastructure/services": null,
    "/api/v1/entity/infrastructure/applications": null,
    "/api/v1/oneagents": "hosts",
    "/api/config/v1/managementZones": "values",
    "/api/config/v1/autoTags": "values",
    "/api/v2/entityTypes": "types",
    "/api/v2/entities": "entities",
    "/api/v2/problems": "problems",
    "/api/v2/metrics/query": "result",
    "/api/v2/metrics": "metrics",
    "/api/v2/auditlogs": "auditLogs",
    "/api/v2/settings/schemas": "items",
    "/api/v2/settings/objects": "items",
    "/api/v1/synthetic/monitors": "monitors",
    "/api/v2/activeGates": "activeGates",
    "/api/v2/tags": "tags"
};

const defaultLimits = {
    maxRetries: 3,
    retryAfter: 1000, // ms
    timeout: 50000     // ms
};

/** 
 * The DirectAPIRequest class is a wrapper around Axios to more consistently issue
 * and process Dynatrace API requests. It attempts to responds to and recover from
 * 429 and 503 errors gracefully (up till specified limits). It also automatically
 * aggregates paged responses (from both v1 and v2 APIs).  Finally, it unifies the
 * various types of errors that may happen while initializating a request, issuing
 * it, and processing its response. This greatly simplifies writing code that makes
 * Dynatrace API requests.
 */
export class DirectAPIRequest {
    private limits: Limits = {};
    private httpsAgent: Agent = null;

    /**
     * Creates an instance with which any number of API requests can be made.
     * @constructor
     * @param limits - Default values for `maxRetries`, `retryAfter` and `timeout`.
     */
    constructor(limits = {}) {
        this.limits = { ...defaultLimits, ...limits };

        try {
            // Create an HTTPS agent for Axios to not reject Self-signed SSL 
            // certificates. Is important in a development context.
            this.httpsAgent = new https.Agent({ rejectUnauthorized: false });            
        } 
        catch (ex) {
            this.httpsAgent = null;
        }
    }

    streamToString(stream: Readable): Promise<string> {
        const chunks = [];
        return new Promise((resolve, reject) => {
            stream.on('data', chunk => chunks.push(Buffer.from(chunk)));
            stream.on('error', err => reject(err));
            stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        });
    }

    private serializeParams(params: any): string {
        const serialized = Object.keys(params)
            .filter(key => params[key])
            .map(key => Array.isArray(params[key])
                      ? params[key]
                        .filter(val => params[key][val])
                        .map(val => key + "=" + val)
                        .join('&')
                      :  key + "=" + params[key]
                )
            .join("&");

        // Return empty string (i.e. no '?') if no params were rendered.
        return serialized.length == 0 ? '' : ('?' + serialized);
    }

    /**
     * Issues a request to a Dynatrace API. 
     * @param options - The request options, Axios-style. 
     * @param onDone  - Optional callback to handle the result (alternative to using a Promise). 
     * 
     * @description
     * Required properties in the {@link RequestOptions} object (unless an alias is used - see below):
     * - `url`: URL relative to the `baseURL`. Ex.: `'/api/v2/entities'`.
     * - `baseURL`: URL of the Dynatrace tenant. Ex.: `'https://abc12345.live.dynatrace.com'`.
     *
     * For convenience aliases have been provided for the following request methods:
     * - `get(url, options[, onDone])`
     * - `delete(url, options[, onDone])`
     * - `post(url, data, options[, onDone])`
     * - `put(url, data, options[, onDone])`
     */
    public async fetch<T = any>(options: RequestOptions, onDone: RequestCallback = null) {
        const now = (new Date()).getTime();
        const issueTime  = now;
        const timeout    = options.timeout    || this.limits.timeout;
        const maxRetries = options.maxRetries || this.limits.maxRetries;
        const retryAfter = this.limits.retryAfter;

        // There are certain errors that are potentially recoverable.
        // UPDATE: We're handling them now differently (try/catch).
        /*  
        options.validateStatus = status =>
            (status >= 200 && status <= 400) ||
            status === 429 || status === 500 || status === 503;
         */

        // If we need to append result sets due to paging, we have to account 
        // for situations where the sets are under a property rather than as 
        // top-level flat array.		
        let prop = resultProps[Object.keys(resultProps).find(k => options.url.endsWith(k))];
        let list = null;
        let data: Array<any> = null;
        let response = null;
        let waitTime = null;
        let waitAndRetry = null;
        let nextPageKey = null;
        let attempts = maxRetries;

        const getAPIResetDelay = (headers) => {
            if (!headers) return retryAfter;
            const delay = Number(headers["Retry-After"]);
            return isNaN(delay) ? retryAfter : delay;
        };

        try {
            do {
                if (waitAndRetry)    // Wait for the specified amount of time.
                    await new Promise(resolve => setTimeout(resolve, waitAndRetry));
                    
                // In case we need to retry or get multiple pages it's best   
                // to give Axios a clean 'options' object for each request.                    
                // We also explicitly render parameters for Dynatrace compatibility.
                try {                
                    const targetUrl   = options.url + this.serializeParams(options.params);
                    const requestOpts = JSON.parse(JSON.stringify(options));
                    delete requestOpts.params;
                    requestOpts.httpsAgent = this.httpsAgent;

                    delete requestOpts.headers.host;

                    response = await axios(targetUrl, requestOpts);
                }
                catch (ex) {
                    response = ex.response;
                }
                
                // We collect the wait time, but we only use it if we receive
                // a recoverable error or if the response is paged.
                waitTime = getAPIResetDelay(response.headers);
                let timeLeft = (issueTime + timeout) > (now + waitTime);

                // Only try again when we get an actual status code.
                // This will NOT retry when a timeout occurs.
                // Timeouts mostly occur because of non-transient issues.
                if (response.status === 400) {
                    throw {
                        status:   response.status,
                        response: JSON.parse(await this.streamToString(response.data))
                    }
                }
                else if (response.status === 429 || response.status === 503) {
                    // Too Many Requests or Service Unavailable. In both cases
                    // the 'Retry-After' header may be present. We will retry 
                    // after the retry time or a default delay has elapsed.
                    if (!timeLeft) {
                        throw {
                            status:  response.status,
                            message: response.statusText + " - timeout of " + timeout + "ms exceeded"
                        }
                    }
                    waitAndRetry = waitTime;
                }
                else if (response.status > 400) {
                    // Internal Server Error. Use default delay and retry as
                    // many times as we're allowed for this request.
                    if (!timeLeft || attempts-- < 0) {
                        throw {
                            status:  response.status,
                            message: response.statusText + " - timeout of " + timeout + "ms or retry max of " + maxRetries + " exceeded"
                        }
                    }
                    waitAndRetry = waitTime;
                }
                else {
                    // Good, useable JSON response received.
                    waitAndRetry = null;

                    if (options.responseType === 'stream') {
                        // Use the stream as-is.
                        data = response.data;
                    }
                    else {
                        // Use the response as a result set object.
                        // Depending on the API, a paged set of results  
                        // may be an array, or an array at a property.
                        list = prop ? response.data[prop] : response.data;
                        data = data !== null
                             ? data.concat(list)
                             : list;
    
                        nextPageKey = response.headers["next-page-key"]  // v1
                                   || response.data.nextPageKey;         // v2      
                                      
                        // If we have a 'next page key' and paging is not explicitly
                        // disabled, attempt to automatically page through the results.
                        if (nextPageKey && options.paging !== false) {
                            // There's slight difference between v1 and v2 APIs here.
                            if (options.url.includes('/v1'))
                                options.params.nextPageKey = encodeURIComponent(nextPageKey);
                            else
                                options.params = { nextPageKey: encodeURIComponent(nextPageKey) };
    
                            // Wait a sec and then get the next set (page) of data.
                            waitAndRetry = waitTime;
                        }
                    }
                }
            } while (waitAndRetry);

            let output = response.data;

            if (options.responseType !== 'stream' && prop) {
                // If we had take the data from a property so that we could
                // keep appending paged data, then put that property back again.
                output[prop] = data;
            }

            if (onDone) onDone(null, output);
            return output as T;
        }
        catch (error) {
            // Errors handled here are unrecoverable.
            const raisedError = {
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
                raisedError.status  = error.response.status || error.status;
                raisedError.message = error.response.error  || error.message
                                   || error.response.statusText 
                                   || "Received a bad response";
            }
            else if (error.request) {
                // The request was made but no response was received.
                raisedError.status  = error.code;
                raisedError.message = error.message || error.code 
                                   || "Received no usable response";
            }
            else {
                // The request was not made because some error occurred.
                raisedError.status  = error.status  || 500;
                raisedError.message = error.message || "Request could not be issued";
            }

            if (onDone) onDone(raisedError);
            throw raisedError;
        }
    }

    public async get(url: string, options: RequestOptions, onDone: RequestCallback = null): Promise<any> {
        options.url = url;
        options.method = 'get';
        return this.fetch(options, onDone);
    }
    public async delete(url: string, options: RequestOptions, onDone: RequestCallback = null): Promise<any> {
        options.url = url;
        options.method = 'delete';
        return this.fetch(options, onDone);
    }
    public async post(url: string, data: any, options: RequestOptions, onDone: RequestCallback = null): Promise<any> {
        options.url = url;
        options.data = data;
        options.method = 'post';
        return this.fetch(options, onDone);
    }
    public async put(url: string, data: any, options: RequestOptions, onDone: RequestCallback = null): Promise<any> {
        options.url = url;
        options.data = data;
        options.method = 'put';
        return this.fetch(options, onDone);
    }
}
