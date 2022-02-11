'use strict';

const Ring     = require('./lib/Ring.js');
const Host     = require('./lib/Host.js');
const Request  = require('./lib/Request.js');
const Throttle = require('./lib/Throttle.js');
const DirectAPIRequest   = require('./lib/DirectAPIRequest.js');
const BalancedAPIRequest = require('./lib/BalancedAPIRequest.js');

/**
 * @typedef TenantConfig
 * 
 * @description
 * Represents the configuration for a tenant.
 * 
 * @property {string}   name   - Name of tenant as used in the `tenant` property of {@link RequestOptions}. 
 * @property {string}   host   - The address of the tenant. Either this or the `hosts` property must be present. 
 * @property {string[]} hosts  - A list of addresses of nodes at which the tenant can be reached. This is
 *                               typically a subset of cluster nodes (for Managed Clusters). 
 * @property {string}   url    - If the nodes(s) are of a Managed Cluster, this is the environment URL. 
 *                               Ex.: /e/123-456-345 
 * @property {string}   token  - The Dynatrace API token to be used to execute the requests. The permissions 
 *                               this token should represent depends on the APIs that are permitted to be used. 
 * @property {string}   [maxRetries=3] 	    - Maximum number of retries before reporting an error. Note that  
 *                                            retry attempts will stop once the 'timeout' value gets exceeded. 
 * @property {string}   [reqRateLimit=200] 	- Maximum number of API requests per minute allowed against this tenant.
 * @property {string}   [maxQueueSize=1000] - Maximum length of the queue. The actual size is typically kept in
 *                                            check by virtue of the request rate limit.
 * @property {string}   [maxQueueTime=5000] - Maximum number of milliseconds a request may be queued. A request will
 *                                            be cancelled with 408 status if it stays queued for too long.
 * @property {string}   [requestLimit=20] 	- Maximum allowed number of concurrently active (i.e. issued) requests.
 * @property {string}   [timeout=5000] 	    - Number of milliseconds before a request times out once issued. If a 
 *                                            request takes longer than this value, it will be aborted.
 * @property {string}   [retryAfter=5000] 	- Number of milliseconds to wait before retrying after a 429 or 503 
 *                                            status where the response does not contain a 'Retry-After' header. 
 */

/**
 * @typedef RequestOptions
 * 
 * @description
 * The `options` object support all options supported by [Axios](https://axios-http.com/docs/req_config "Axios"), 
 * except where otherwise noted below. This implementation also adds a couple of additional options (i.e. `tenant`, 
 * `noQueue` and `maxRetries`) that are specific to this implementation.
 * Note that either a `tenant` or a `baseURL` must be provided, but not both.
 * 
 * @property {string}   url          	- URL relative to the `baseURL` or the `tenant`. Ex.: `'/api/v2/entities'`. 
 * @property {string}   [method='get'] 	- Request method (`'get'`,  `'put'`,  `'post'`,  `'delete'`). 
 * @property {string}   tenant       	- Name of the Dynatrace tenant ({@link BalancedAPIRequest} only - **not an Axios property**). Ex.: `'PROD'`. 
 * @property {string}   baseURL      	- URL of the Dynatrace tenant ({@link DirectAPIRequest} only). Ex.: `'https://abc12345.live.dynatrace.com'`. 
 * @property {Proxy}    [proxy] 	      - Proxy to use to make HTTP/S connections.
 * @property {object}   [headers]      	- Plain `object` containing the headers to be set in the request. Ex.: `{ 'Authorization': 'token XYZ' }`. 
 * @property {object}   [params]       	- URL parameters to be sent with the request. Must be a plain `object` or a `URLSearchParams` object. Ex.: `{ ID: 12345 }`. 
 * @property {object}   [data]         	- Must be of one of the following types: `string`, `object`, `ArrayBuffer`, `ArrayBufferView`, `URLSearchParams`, `Stream`, `Buffer`. Ex.: `{ firstName: 'Bart' }`. 
 * @property {boolean}  [noQueue=false]	- Specifies whether the request should be rejected if due to throttling it cannot immediately be issued  ({@link BalancedAPIRequest} only - **not an Axios property**).
 * @property {number}   [timeout=5000]  - Number of milliseconds before the request times out. If the request takes longer than `timeout`, it will be aborted (if it has been issued already) or cancelled (if it is still waiting in a queue).
 * @property {number}   [retryAfter]    - Number of milliseconds to wait before trying again after a 429 or 503 status is received and the response does not contain a 'Retry-After' header. If not provided, the default from the constructor is used.
 * @property {number}   [maxRedirects=5]   	- Maximum number of redirects to follow. If set to 0, no redirects will be followed.
 * @property {number}   [maxRetries=3]    	- Maximum number of retries allowed if a potentially transient error is encountered (**not an Axios property**).
 * @property {number}   [maxBodyLength=2000] 	- Maximum size of the http request content in bytes.
 * @property {number}   [maxContentLength=2000] - Maximum size of the http response content in bytes.
 * @property {function} [validateStatus]   		- **IGNORED** This parameter is set by {@link BalancedAPIRequest} and {@link DirectAPIRequest} internally.
 * @property {string}   [responseType='json'] 		- Specifies the type of data that the server will respond with. Options are: `'arraybuffer'`, `'document'`, `'json'`, `'text'`, `'stream'`. **Note**: The automatic paging support only works then this value is set to `'json'`.
 * @property {boolean}  [withCredentials=false]  	- Specifies whether or not cross-site Access-Control requests should be made using credentials.
 * @property {string}   [responseEncoding='utf8'] 	- Encoding to use for decoding responses. Note: Ignored when `responseType` is `'stream'`.
 * @property {function} [cancelToken]     - Specifies a cancel token that can be used to cancel the request. See Axios documentation for details. Note that {@link BalancedAPIRequest} sets this property to create and return a {@link CancellablePromise} or a {@link CancellableEventEmitter} through which requests can be cancelled.
 * @property {object}   [socketPath] 	  - See Axios documentation.
 * @property {object}   [httpAgent] 	  - See Axios documentation.
 * @property {object}   [httpsAgent]	  - See Axios documentation.
 * @property {boolean}  [decompress=true] - Specifies whether or not the response body should be decompressed automatically. If set to `true` will also remove the `'content-encoding'` header from the response objects of all decompressed responses. **Note**: The automatic paging support only works then this value is set to `true`.
 *  
 */

/**
 * @typedef Proxy
 * 
 * @description
 * Configuration of a proxy host through which connections to the baseURL are to be made.
 *
 * @property {string} host  - DNS name or IP address of the proxy host.
 * @property {number} port  - Port at which the proxy accepts requests.
 */

/**
 * @typedef RequestError
 * 
 * @description
 * A unified error object that consolidates the various types of errors that may happen 
 * while initializating a request, issuing it, and processing its response.
 *
 * @property {object} status        - An internal error code (string) or an HTTP status code (number).
 * @property {string} message       - Human-readble description of the error.
 * @property {string} url           - Original (relative) URL.
 * @property {string} baseURL       - Effective base URL.
 * @property {string} method        - Request method used.
 * @property {string} [params=null] - Query parameters passed.
 * @property {string} [data=null]   - Data sent in the request body.
 */

/**
 * @callback RequestCallback
 * @param {RequestError} error - The error if the request could not be fulfilled.
 * @param {object} data - The Dynatrace API's response, as a parsed JSON object, if the request was succesful.
 */    

module.exports = { BalancedAPIRequest, DirectAPIRequest, Throttle };