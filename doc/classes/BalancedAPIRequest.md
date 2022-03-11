[@dt-esa/dynatrace-api-balancer](../README.md) / [Exports](../modules.md) / BalancedAPIRequest

# Class: BalancedAPIRequest

The BalancedAPIRequest class enriches the functionality of [DirectAPIRequest](DirectAPIRequest.md)
with an efficient load balancing, queuing and request throttling layer that protects
the Dynatrace cluster from request overload while ensuring that for each request the
best (most available) cluster node is selected to handle that request. Additionally,
it provides a simple way to cancel any request if the caller is no longer interested
in the response.

## Table of contents

### Constructors

- [constructor](BalancedAPIRequest.md#constructor)

### Properties

- [globalQueue](BalancedAPIRequest.md#globalqueue)
- [hosts](BalancedAPIRequest.md#hosts)
- [tenants](BalancedAPIRequest.md#tenants)

### Methods

- [delete](BalancedAPIRequest.md#delete)
- [fetch](BalancedAPIRequest.md#fetch)
- [get](BalancedAPIRequest.md#get)
- [getHealthMetrics](BalancedAPIRequest.md#gethealthmetrics)
- [healthReport](BalancedAPIRequest.md#healthreport)
- [post](BalancedAPIRequest.md#post)
- [put](BalancedAPIRequest.md#put)
- [resetHosts](BalancedAPIRequest.md#resethosts)
- [restart](BalancedAPIRequest.md#restart)
- [shutdown](BalancedAPIRequest.md#shutdown)
- [submitRequest](BalancedAPIRequest.md#submitrequest)

## Constructors

### constructor

• **new BalancedAPIRequest**(`limits?`, `tenants?`)

Creates a pool of connections to reach multiple tenants and clusters.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `limits` | [`Limits`](../modules.md#limits) | Default values for `retryLimit`, `retryAfter` and `timeout`. |
| `tenants` | [`Tenants`](../modules.md#tenants) | The configurations for the tenants. |

#### Defined in

[src/balanced-api-request.ts:39](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/balanced-api-request.ts#L39)

## Properties

### globalQueue

• `Private` **globalQueue**: [`GlobalRequestQueue`](GlobalRequestQueue.md)

#### Defined in

[src/balanced-api-request.ts:31](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/balanced-api-request.ts#L31)

___

### hosts

• `Private` **hosts**: [`Ring`](Ring.md)<[`Host`](Host.md)\>

#### Defined in

[src/balanced-api-request.ts:29](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/balanced-api-request.ts#L29)

___

### tenants

• `Private` **tenants**: `Object`

#### Index signature

▪ [key: `string`]: [`TenantConfig`](../modules.md#tenantconfig)

#### Defined in

[src/balanced-api-request.ts:30](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/balanced-api-request.ts#L30)

## Methods

### delete

▸ **delete**(`url`, `options`, `onDone?`): `Promise`<`any`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `url` | `any` | `undefined` |
| `options` | `any` | `undefined` |
| `onDone` | `any` | `null` |

#### Returns

`Promise`<`any`\>

#### Defined in

[src/balanced-api-request.ts:344](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/balanced-api-request.ts#L344)

___

### fetch

▸ **fetch**(`options`, `onDone?`): [`CancellableEventEmitter`](CancellableEventEmitter.md) \| [`CancellablePromise`](CancellablePromise.md)

Issues a request to a Dynatrace API.

**`async`**

**`description`**
Note that in this class the [RequestOptions](../modules.md#requestoptions) object also supports the `noQueue` property.

Required properties in the [RequestOptions](../modules.md#requestoptions) object (unless an alias is used - see below):
- `url`: URL relative to the `tenant`. Ex.: `'/api/v2/entities'`.
- `tenant`: Name of the Dynatrace tenant. Ex.: `'PROD'`.

For convenience aliases have been provided for the following request methods:
- `get(url, options[, onDone])`
- `delete(url, options[, onDone])`
- `post(url, data, options[, onDone])`
- `put(url, data, options[, onDone])`

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `options` | [`RequestOptions`](../modules.md#requestoptions) | `undefined` | The request options, Axios-style. |
| `onDone` | [`RequestCallback`](../modules.md#requestcallback) | `null` | - |

#### Returns

[`CancellableEventEmitter`](CancellableEventEmitter.md) \| [`CancellablePromise`](CancellablePromise.md)

If `onDone` is provided, this method returns a [CancellableEventEmitter](CancellableEventEmitter.md).
Else, this method returns a [CancellablePromise](CancellablePromise.md).

#### Defined in

[src/balanced-api-request.ts:315](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/balanced-api-request.ts#L315)

___

### get

▸ **get**(`url`, `options`, `onDone?`): `Promise`<`any`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `url` | `any` | `undefined` |
| `options` | `any` | `undefined` |
| `onDone` | `any` | `null` |

#### Returns

`Promise`<`any`\>

#### Defined in

[src/balanced-api-request.ts:339](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/balanced-api-request.ts#L339)

___

### getHealthMetrics

▸ **getHealthMetrics**(`frequency`, `callback`): `any`[] \| `Timer`

Report the health of the connection pool. If no parameters are specified, the health
report will be returned. If both parameters are specified, the callback will be called
with the health report as its only parameter, per the specified frequency.

**`memberof`** BalancedAPIRequest

#### Parameters

| Name | Type |
| :------ | :------ |
| `frequency` | `any` |
| `callback` | `any` |

#### Returns

`any`[] \| `Timer`

#### Defined in

[src/balanced-api-request.ts:385](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/balanced-api-request.ts#L385)

___

### healthReport

▸ `Private` **healthReport**(`callback?`): `any`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback?` | `Function` |

#### Returns

`any`[]

#### Defined in

[src/balanced-api-request.ts:233](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/balanced-api-request.ts#L233)

___

### post

▸ **post**(`url`, `data`, `options`, `onDone?`): `Promise`<`any`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `url` | `any` | `undefined` |
| `data` | `any` | `undefined` |
| `options` | `any` | `undefined` |
| `onDone` | `any` | `null` |

#### Returns

`Promise`<`any`\>

#### Defined in

[src/balanced-api-request.ts:349](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/balanced-api-request.ts#L349)

___

### put

▸ **put**(`url`, `data`, `options`, `onDone?`): `Promise`<`any`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `url` | `any` | `undefined` |
| `data` | `any` | `undefined` |
| `options` | `any` | `undefined` |
| `onDone` | `any` | `null` |

#### Returns

`Promise`<`any`\>

#### Defined in

[src/balanced-api-request.ts:355](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/balanced-api-request.ts#L355)

___

### resetHosts

▸ `Private` **resetHosts**(): `void`

#### Returns

`void`

#### Defined in

[src/balanced-api-request.ts:102](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/balanced-api-request.ts#L102)

___

### restart

▸ **restart**(): `void`

Cancel all running and/or queued requests and reset the connection pool.

**`memberof`** BalancedAPIRequest

#### Returns

`void`

#### Defined in

[src/balanced-api-request.ts:365](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/balanced-api-request.ts#L365)

___

### shutdown

▸ **shutdown**(): `void`

Cancel all running and/or queued requests and delete the connection pool.

**`memberof`** BalancedAPIRequest

#### Returns

`void`

#### Defined in

[src/balanced-api-request.ts:372](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/balanced-api-request.ts#L372)

___

### submitRequest

▸ `Private` **submitRequest**(`options`, `onDone`): [`CancellableEventEmitter`](CancellableEventEmitter.md)

This is the main function. Requests are submitted here and shopped
across the available hosts until we find one that can handle the
request. The 'onDone()' callback will called with the result of
executing the request, or with the error if something went wrong.

**`memberof`** BalancedAPIRequest

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`RequestOptions`](../modules.md#requestoptions) |
| `onDone` | (`error?`: `any`, `data?`: `any`) => `any` |

#### Returns

[`CancellableEventEmitter`](CancellableEventEmitter.md)

#### Defined in

[src/balanced-api-request.ts:114](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/balanced-api-request.ts#L114)
