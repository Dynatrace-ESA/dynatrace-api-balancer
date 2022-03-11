[@dt-esa/dynatrace-api-balancer](../README.md) / [Exports](../modules.md) / DirectAPIRequest

# Class: DirectAPIRequest

The DirectAPIRequest class is a wrapper around Axios to more consistently issue
and process Dynatrace API requests. It attempts to responds to and recover from
429 and 503 errors gracefully (up till specified limits). It also automatically
aggregates paged responses (from both v1 and v2 APIs).  Finally, it unifies the
various types of errors that may happen while initializating a request, issuing
it, and processing its response. This greatly simplifies writing code that makes
Dynatrace API requests.

## Table of contents

### Constructors

- [constructor](DirectAPIRequest.md#constructor)

### Properties

- [httpsAgent](DirectAPIRequest.md#httpsagent)
- [limits](DirectAPIRequest.md#limits)

### Methods

- [delete](DirectAPIRequest.md#delete)
- [fetch](DirectAPIRequest.md#fetch)
- [get](DirectAPIRequest.md#get)
- [post](DirectAPIRequest.md#post)
- [put](DirectAPIRequest.md#put)
- [serializeParams](DirectAPIRequest.md#serializeparams)

## Constructors

### constructor

• **new DirectAPIRequest**(`limits?`)

Creates an instance with which any number of API requests can be made.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `limits` | `Object` | Default values for `maxRetries`, `retryAfter` and `timeout`. |

#### Defined in

[src/direct-api-request.ts:53](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/direct-api-request.ts#L53)

## Properties

### httpsAgent

• `Private` **httpsAgent**: `Agent` = `null`

#### Defined in

[src/direct-api-request.ts:46](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/direct-api-request.ts#L46)

___

### limits

• `Private` **limits**: [`Limits`](../modules.md#limits) = `{}`

#### Defined in

[src/direct-api-request.ts:45](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/direct-api-request.ts#L45)

## Methods

### delete

▸ **delete**(`url`, `options`, `onDone?`): `Promise`<`any`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `url` | `string` | `undefined` |
| `options` | [`RequestOptions`](../modules.md#requestoptions) | `undefined` |
| `onDone` | [`RequestCallback`](../modules.md#requestcallback) | `null` |

#### Returns

`Promise`<`any`\>

#### Defined in

[src/direct-api-request.ts:269](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/direct-api-request.ts#L269)

___

### fetch

▸ **fetch**<`T`\>(`options`, `onDone?`): `Promise`<`T`\>

Issues a request to a Dynatrace API.

**`description`**
Required properties in the [RequestOptions](../modules.md#requestoptions) object (unless an alias is used - see below):
- `url`: URL relative to the `baseURL`. Ex.: `'/api/v2/entities'`.
- `baseURL`: URL of the Dynatrace tenant. Ex.: `'https://abc12345.live.dynatrace.com'`.

For convenience aliases have been provided for the following request methods:
- `get(url, options[, onDone])`
- `delete(url, options[, onDone])`
- `post(url, data, options[, onDone])`
- `put(url, data, options[, onDone])`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `any` |

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `options` | [`RequestOptions`](../modules.md#requestoptions) | `undefined` | The request options, Axios-style. |
| `onDone` | [`RequestCallback`](../modules.md#requestcallback) | `null` | Optional callback to handle the result (alternative to using a Promise). |

#### Returns

`Promise`<`T`\>

#### Defined in

[src/direct-api-request.ts:98](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/direct-api-request.ts#L98)

___

### get

▸ **get**(`url`, `options`, `onDone?`): `Promise`<`any`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `url` | `string` | `undefined` |
| `options` | [`RequestOptions`](../modules.md#requestoptions) | `undefined` |
| `onDone` | [`RequestCallback`](../modules.md#requestcallback) | `null` |

#### Returns

`Promise`<`any`\>

#### Defined in

[src/direct-api-request.ts:264](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/direct-api-request.ts#L264)

___

### post

▸ **post**(`url`, `data`, `options`, `onDone?`): `Promise`<`any`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `url` | `string` | `undefined` |
| `data` | `any` | `undefined` |
| `options` | [`RequestOptions`](../modules.md#requestoptions) | `undefined` |
| `onDone` | [`RequestCallback`](../modules.md#requestcallback) | `null` |

#### Returns

`Promise`<`any`\>

#### Defined in

[src/direct-api-request.ts:274](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/direct-api-request.ts#L274)

___

### put

▸ **put**(`url`, `data`, `options`, `onDone?`): `Promise`<`any`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `url` | `string` | `undefined` |
| `data` | `any` | `undefined` |
| `options` | [`RequestOptions`](../modules.md#requestoptions) | `undefined` |
| `onDone` | [`RequestCallback`](../modules.md#requestcallback) | `null` |

#### Returns

`Promise`<`any`\>

#### Defined in

[src/direct-api-request.ts:280](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/direct-api-request.ts#L280)

___

### serializeParams

▸ `Private` **serializeParams**(`params`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `any` |

#### Returns

`string`

#### Defined in

[src/direct-api-request.ts:66](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/direct-api-request.ts#L66)
