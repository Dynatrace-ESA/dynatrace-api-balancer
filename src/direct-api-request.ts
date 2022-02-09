import axios from "axios";
import { Limits, RequestCallback, RequestOptions } from './types';

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


    /*  When using axios, the rejectUnauthorized works like this:

            const agent = new https.Agent({ rejectUnauthorized: false });
            axios.get('https://something.com/foo', { httpsAgent: agent });

        OR:
            https.globalAgent.options.rejectUnauthorized = false;

        As a last resort, this can be placed in the top of the main JS file:
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
     */

    /**
     * Creates an instance with which any number of API requests can be made.
     * @constructor
     * @param limits - Default values for `maxRetries`, `retryAfter` and `timeout`.
     */
    constructor(limits = {}) {
        this.limits = { ...defaultLimits, ...limits };
    }

    serializeParams(params: any): string {
        const serialized = '?' + Object.keys(params).filter(key => params[key]).map(key => {

            if (!Array.isArray(params[key]))
                return key + "=" + params[key];

            // If it's an array, create multiple identical keys with the different values.
            return params[key].filter(val => params[key][val]).map(val => key + "=" + val).join('&');
        }).join("&");
        // Return empty string where no params are rendered
        return serialized.length == 1 ? '' : serialized;
    }

    /**
     * Issues a request to a Dynatrace API. 
     * @async
     * @param options - The request options, Axios-style. 
     * @param onDone  - Callback that handles the result (alternative to using a Promise). 
     * @returns {EventEmitter|Promise} 
     * If `onDone` is provided, this method returns an EventEmitter. 
     * Else, this method returns a Promise.
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
    public async fetch<T = any>(options: RequestOptions, onDone: RequestCallback = () => { }) {
        const now = (new Date()).getTime();
        const issueTime  = now;
        const timeout    = options.timeout    || this.limits.timeout;
        const maxRetries = options.maxRetries || this.limits.maxRetries;
        const retryAfter = this.limits.retryAfter;

        // There are certain errors that are potentially recoverable.
        options.validateStatus = status =>
            (status >= 200 && status < 400) ||
            status === 429 || status === 500 || status === 503;

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
        let https = null;

        const getAPIResetDelay = (headers) => {
            if (!headers) return retryAfter;
            const delay = Number(headers["Retry-After"]);
            return isNaN(delay) ? retryAfter : delay;
        };

        try {
            https = require("https");
        } 
        catch (ex) {
            // NOP
        }

        // Create HTTPS agent for Axios to not reject Self-signed SSL certs in node env.
        const httpsAgent = https
            ? new https.Agent({ rejectUnauthorized: false })
            : null;

        try {
            do {
                if (waitAndRetry)    // Wait for the specified amount of time.
                    await new Promise(resolve => setTimeout(resolve, waitAndRetry));
                    
                // Explicitly render parmeters for Dynatrace compatibility.
                const targetUrl = options.url + this.serializeParams(options.params);

                // Create non-referenced copy of params.
                const requestOpts = JSON.parse(JSON.stringify(options));
                delete requestOpts.params;
                requestOpts.httpsAgent = httpsAgent;

                // In case we need to retry or get multiple pages it's best to  
                // give Axios a clean 'options' object for each request.
                response = await axios(targetUrl, requestOpts);

                // We collect the wait time, but we only use it if we receive a
                // recoverable error or if the response is paged.
                waitTime = getAPIResetDelay(response.headers);

                // Only try again when we get an actual status code.
                // This will NOT retry when a timeout occurs.
                // Timeouts largely occur due to non-transient issues.
                if (response.status >= 400) {
                    let timeLeft = (issueTime + timeout) > (now + waitTime);

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
                            throw new Error(response.statusText + " - timeout of " + timeout + "ms or retry max of " + maxRetries + " exceeded");

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

                    // If we have a next page key and we have paging is not false, attempt to 
                    // automatically page through results.
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
            } while (waitAndRetry);

            
            let output = {};

            // If we had take the data from a property so that we could
            // keep appending paged data, then put that property back again.
            if (prop) {
                list = data;
                output = data;
                output[prop] = list;
            }

            onDone(null, output);
            return output as T;
        }
        catch (error) {
            // Errors handled here are unrecoverable.
            const raisedError = {
                status: null,
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
                    raisedError.status = error.response.status;
                    raisedError.message = error.response.data.error.constraintViolations
                        || error.response.data.error.message
                        || error.response.statusText;
                }
                else {
                    raisedError.status = error.response.status;
                    raisedError.message = error.response.statusText;
                }
            }
            else if (error.request) {
                // The request was made but no response was received.
                raisedError.status = error.code;
                raisedError.message = error.message || error.code || "Failed to issue request";
            }
            else {
                // The request was not made because an error occurred.
                raisedError.status = error.status || 500;
                raisedError.message = error.message || "Unknown error";
            }

            onDone(raisedError);
            throw raisedError;
        }
    }

    public async get(url: string, options: RequestOptions, onDone: RequestCallback = () => { }): Promise<any> {
        options.url = url;
        options.method = 'get';
        return this.fetch(options, onDone);
    }
    public async delete(url: string, options: RequestOptions, onDone: RequestCallback = () => { }): Promise<any> {
        options.url = url;
        options.method = 'delete';
        return this.fetch(options, onDone);
    }
    public async post(url: string, data: any, options: RequestOptions, onDone: RequestCallback = () => { }): Promise<any> {
        options.url = url;
        options.data = data;
        options.method = 'post';
        return this.fetch(options, onDone);
    }
    public async put(url: string, data: any, options: RequestOptions, onDone: RequestCallback = () => { }): Promise<any> {
        options.url = url;
        options.data = data;
        options.method = 'put';
        return this.fetch(options, onDone);
    }
}
