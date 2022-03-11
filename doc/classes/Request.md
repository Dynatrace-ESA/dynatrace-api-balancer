[@dt-esa/dynatrace-api-balancer](../README.md) / [Exports](../modules.md) / Request

# Class: Request

## Table of contents

### Constructors

- [constructor](Request.md#constructor)

### Properties

- [abort](Request.md#abort)
- [autoCancel](Request.md#autocancel)
- [callback](Request.md#callback)
- [createTime](Request.md#createtime)
- [emitter](Request.md#emitter)
- [options](Request.md#options)
- [queue](Request.md#queue)
- [queueTime](Request.md#queuetime)
- [releaseTime](Request.md#releasetime)
- [tenant](Request.md#tenant)

### Methods

- [cancel](Request.md#cancel)
- [setHost](Request.md#sethost)

## Constructors

### constructor

• **new Request**(`tenant`, `options`, `limits`, `onDone`)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `tenant` | [`TenantConfig`](../modules.md#tenantconfig) | Tenant connection configuration. |
| `options` | [`RequestOptions`](../modules.md#requestoptions) | Options to follow. |
| `limits` | [`Limits`](../modules.md#limits) | strict performance limits to follow. |
| `onDone` | [`RequestCallback`](../modules.md#requestcallback) | Callback on request completion. |

#### Defined in

[src/request.ts:21](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request.ts#L21)

## Properties

### abort

• **abort**: `any` = `null`

#### Defined in

[src/request.ts:12](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request.ts#L12)

___

### autoCancel

• **autoCancel**: `any` = `null`

#### Defined in

[src/request.ts:9](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request.ts#L9)

___

### callback

• **callback**: [`RequestCallback`](../modules.md#requestcallback) = `null`

#### Defined in

[src/request.ts:11](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request.ts#L11)

___

### createTime

• **createTime**: `any` = `null`

#### Defined in

[src/request.ts:6](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request.ts#L6)

___

### emitter

• **emitter**: [`CancellableEventEmitter`](CancellableEventEmitter.md) = `null`

#### Defined in

[src/request.ts:10](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request.ts#L10)

___

### options

• **options**: [`RequestOptions`](../modules.md#requestoptions)

___

### queue

• **queue**: `any` = `null`

#### Defined in

[src/request.ts:5](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request.ts#L5)

___

### queueTime

• **queueTime**: `any` = `null`

#### Defined in

[src/request.ts:7](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request.ts#L7)

___

### releaseTime

• **releaseTime**: `any` = `null`

#### Defined in

[src/request.ts:8](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request.ts#L8)

___

### tenant

• **tenant**: [`TenantConfig`](../modules.md#tenantconfig)

## Methods

### cancel

▸ **cancel**(`reason?`): `void`

The queues can call this if the request has been on the queue for too long.
Original requestors can call this as well from the CancellableEventEmitter.
Queues will give us the timeout they applied. Through the emitter we may
get a reason. If we do, the request will be reported as 'Cancelled' to the
original requestor with that reason(promise or callback). If we don't get
a reason, the request will be cancelled silently.

#### Parameters

| Name | Type |
| :------ | :------ |
| `reason?` | `string` \| `number` |

#### Returns

`void`

#### Defined in

[src/request.ts:100](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request.ts#L100)

___

### setHost

▸ **setHost**(`host`): `string`

Set the host that accepted this request.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `host` | `any` | DNS hostname string. |

#### Returns

`string`

calculated URL

#### Defined in

[src/request.ts:80](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/request.ts#L80)
