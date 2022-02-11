## dynatrace-api-balancer
A wrapper around [Axios](https://axios-http.com/docs/req_config "Axios") that balances and throttles Dynatrace API requests across tenants, clusters and cluster nodes.

A dependency map can be found [here](https://npmgraph.js.org/?q=@dt-esa/dynatrace-api-balancer).

### Usage
Using {@link BalancedAPIRequest}:
```javascript
const api = new BalancedAPIRequest(limits, tenants);

const cancellablePromise = api.fetch(options).then(data => { ... }).catch(err => { ... });
// OR 
const cancellableEventEmitter = api.fetch(options, (err, data) => { ... });
```
Using {@link DirectAPIRequest}:
```javascript
const api = new DirectAPIRequest(limits);

const promise = api.fetch(options).then(data => { ... }).catch(err => { ... });
// OR
const eventEmitter = api.fetch(options, (err, data) => { ... });
```
For convenience aliases have been provided for the following request methods:
- `get(url, options[, onDone])`
- `delete(url, options[, onDone])`
- `post(url, data, options[, onDone])`
- `put(url, data, options[, onDone])`

### Features
The {@link DirectAPIRequest} wrapper responds to and recovers from 429 and 503 errors gracefully (up till specified limits). It also automatically consolidates paged responses (from both v1 and v2 APIs). Finally, it unifies the various types of errors that may happen while initializating a request, issuing it, and processing its response. This greatly simplifies writing code that makes Dynatrace API requests.

The {@link BalancedAPIRequest} adds an efficient load balancing, queuing and request throttling layer that protects the Dynatrace cluster from a request overload while ensuring that for each request the best (i.e. most available) cluster node is selected to handle that request. Additionally, it natively supports cancelling any request (or all) if the caller is no longer interested in the response. 

Note that the interfaces of {@link BalancedAPIRequest} and {@link DirectAPIRequest} are virtually identical.

The {@link BalancedAPIRequest} is a cornerstone of several Dynatrace ESA solutions, most notably the ETL Service and the API Security Gateway. Additionally, {@link DirectAPIRequest} is used by the Dynatrace API Helper, a solution that greatly simplifies the process of writing code to access Dynatrace APIs. Please contact **esa@dynatrace.com** for more information.
