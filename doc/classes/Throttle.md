[@dt-esa/dynatrace-api-balancer](../README.md) / [Exports](../modules.md) / Throttle

# Class: Throttle

 The Throttle rate-limits access to a resource over a moving time window
 using a 'leaky bucket' algorithm.

## Hierarchy

- **`Throttle`**

  ↳ [`NoThrottle`](NoThrottle.md)

## Table of contents

### Constructors

- [constructor](Throttle.md#constructor)

### Properties

- [fill](Throttle.md#fill)
- [last](Throttle.md#last)
- [queue](Throttle.md#queue)
- [rate](Throttle.md#rate)
- [size](Throttle.md#size)

### Accessors

- [nextSlot](Throttle.md#nextslot)
- [remainder](Throttle.md#remainder)
- [waitTime](Throttle.md#waittime)

### Methods

- [consume](Throttle.md#consume)
- [next](Throttle.md#next)
- [permit](Throttle.md#permit)
- [reset](Throttle.md#reset)

## Constructors

### constructor

• **new Throttle**(`limit`, `window`)

Creates a throttle.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `limit` | `number` | Number of requests allowed. |
| `window` | `number` | Per this time window (in ms). |

#### Defined in

[src/throttle.ts:27](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/throttle.ts#L27)

## Properties

### fill

• `Private` **fill**: `any` = `null`

#### Defined in

[src/throttle.ts:9](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/throttle.ts#L9)

___

### last

• `Private` **last**: `any` = `null`

#### Defined in

[src/throttle.ts:10](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/throttle.ts#L10)

___

### queue

• `Private` **queue**: `any`[] = `[]`

#### Defined in

[src/throttle.ts:6](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/throttle.ts#L6)

___

### rate

• `Private` **rate**: `any` = `null`

#### Defined in

[src/throttle.ts:8](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/throttle.ts#L8)

___

### size

• `Private` **size**: `any` = `null`

#### Defined in

[src/throttle.ts:7](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/throttle.ts#L7)

## Accessors

### nextSlot

• `get` **nextSlot**(): `number`

Returns the time (ms) until the throttle opens again (plus 1ms).
Note that this getter just returns the delay - it does not update the throttle.

#### Returns

`number`

#### Defined in

[src/throttle.ts:54](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/throttle.ts#L54)

___

### remainder

• `get` **remainder**(): `number`

Returns how much capacity is left. This value is useful for selecting
the least constricted resource among a pool of throttled resources.

#### Returns

`number`

#### Defined in

[src/throttle.ts:46](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/throttle.ts#L46)

___

### waitTime

• `get` **waitTime**(): `number`

Returns the time (ms) until a next request can be honored (plus 1ms if there's a wait).
This is useful in case multiple throttles need to be checked before a request can be
consumed. Contrary to [nextSlot](Throttle.md#nextslot), this getter updates the throttle's state
before it produces a value.

#### Returns

`number`

#### Defined in

[src/throttle.ts:65](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/throttle.ts#L65)

## Methods

### consume

▸ **consume**(): `void`

Consumes one unit of capacity. Should only be called if {@link Throttle#waitTime waitTime} > 0.

**`example`**
```javascript
function doSomething() {
    const delay = myThrottle.waitTime;
    if (delay > 0)
        return "I can't do this right now, but in " + delay + "ms I can.";

    myThrottle.consume();
    // Do it.
    return "I did it.";
}
```

#### Returns

`void`

#### Defined in

[src/throttle.ts:91](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/throttle.ts#L91)

___

### next

▸ `Private` **next**(): `void`

Resolves next promise in the queue and keeps emptying it.

#### Returns

`void`

#### Defined in

[src/throttle.ts:15](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/throttle.ts#L15)

___

### permit

▸ **permit**(): `Promise`<`any`\>

Returns a promise that is guaranteed to resolve (in FIFO order), but not sooner
than the throttle allows. For certain use cases this provides a more convenient
alternative compared to using the [`Throttle.waitTime`](Throttle.md#waittime) and
[`Throttle.consume`](Throttle.md#consume) pair.

**`example`**
```javascript
async function doSomething() {
    await myThrottle.permit();   // Resolves immediately or as soon as possible.
    // Do it.
    return "I did it.";
}
```

#### Returns

`Promise`<`any`\>

#### Defined in

[src/throttle.ts:110](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/throttle.ts#L110)

___

### reset

▸ **reset**(): `void`

Resets the throttle to its maximum capacity.

#### Returns

`void`

#### Defined in

[src/throttle.ts:37](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/throttle.ts#L37)
