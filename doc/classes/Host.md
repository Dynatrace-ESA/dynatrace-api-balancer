[@dt-esa/dynatrace-api-balancer](../README.md) / [Exports](../modules.md) / Host

# Class: Host

 Manages access to HTTP requests at a given host name.
 It uses a throttle and a local queue to ensure that any
 rate limits and concurrent request limits are observed.

## Table of contents

### Constructors

- [constructor](Host.md#constructor)

### Properties

- [acceptNext](Host.md#acceptnext)
- [globalQueue](Host.md#globalqueue)
- [hostName](Host.md#hostname)
- [issuedList](Host.md#issuedlist)
- [localQueue](Host.md#localqueue)
- [requestLimit](Host.md#requestlimit)
- [requester](Host.md#requester)
- [throttle](Host.md#throttle)

### Accessors

- [availability](Host.md#availability)
- [name](Host.md#name)

### Methods

- [accept](Host.md#accept)
- [isAlive](Host.md#isalive)
- [issue](Host.md#issue)
- [raiseLimits](Host.md#raiselimits)
- [reset](Host.md#reset)

## Constructors

### constructor

• **new Host**(`hostName`, `mainQueue`, `__namedParameters`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `hostName` | `any` |
| `mainQueue` | `any` |
| `__namedParameters` | [`Limits`](../modules.md#limits) |

#### Defined in

[src/host.ts:24](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/host.ts#L24)

## Properties

### acceptNext

• `Private` **acceptNext**: `any`

#### Defined in

[src/host.ts:135](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/host.ts#L135)

___

### globalQueue

• `Private` **globalQueue**: `any`

#### Defined in

[src/host.ts:16](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/host.ts#L16)

___

### hostName

• `Private` **hostName**: `any`

#### Defined in

[src/host.ts:15](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/host.ts#L15)

___

### issuedList

• `Readonly` **issuedList**: [`RequestQueue`](RequestQueue.md)

#### Defined in

[src/host.ts:22](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/host.ts#L22)

___

### localQueue

• `Readonly` **localQueue**: [`RequestQueue`](RequestQueue.md)

#### Defined in

[src/host.ts:21](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/host.ts#L21)

___

### requestLimit

• `Private` **requestLimit**: `any`

#### Defined in

[src/host.ts:19](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/host.ts#L19)

___

### requester

• `Private` **requester**: `any`

#### Defined in

[src/host.ts:17](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/host.ts#L17)

___

### throttle

• `Private` **throttle**: `any`

#### Defined in

[src/host.ts:18](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/host.ts#L18)

## Accessors

### availability

• `get` **availability**(): `number`

Return a measure of our availability as a number ranging
from minus infinity to the (positive) size of our throttle.

#### Returns

`number`

#### Defined in

[src/host.ts:166](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/host.ts#L166)

___

### name

• `get` **name**(): `string`

Return the name of the host.

#### Returns

`string`

#### Defined in

[src/host.ts:140](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/host.ts#L140)

## Methods

### accept

▸ **accept**(`request`, `forced?`): `boolean`

Ask the host to accept and issue this request.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `request` | `any` | `undefined` |  |
| `forced` | `boolean` | `false` | If forced is `true`, disregard queue and make the request. |

#### Returns

`boolean`

`true` if the request was queued. Otherwise returns `false`.

#### Defined in

[src/host.ts:95](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/host.ts#L95)

___

### isAlive

▸ **isAlive**(`tenant`): `Promise`<`boolean`\>

Check if the specified tenant is reachable.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `tenant` | [`Tenant`](../modules.md#tenant) | Tenant |

#### Returns

`Promise`<`boolean`\>

A promise that resolves to `true` if it
can be reached or rejects if it can't.

#### Defined in

[src/host.ts:150](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/host.ts#L150)

___

### issue

▸ `Private` **issue**(`request`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Request`](Request.md) |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/host.ts:57](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/host.ts#L57)

___

### raiseLimits

▸ **raiseLimits**(`__namedParameters`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | [`Limits`](../modules.md#limits) |

#### Returns

`void`

#### Defined in

[src/host.ts:35](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/host.ts#L35)

___

### reset

▸ **reset**(): `void`

Empty the queue; clear the throttler; empty the lists.

#### Returns

`void`

#### Defined in

[src/host.ts:44](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/host.ts#L44)
