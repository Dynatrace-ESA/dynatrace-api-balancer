[@dt-esa/dynatrace-api-balancer](../README.md) / [Exports](../modules.md) / NoThrottle

# Class: NoThrottle

 The NoThrottle is a special type of {@coderef Throttle} that does not do any throttling.
 It is used where no request limits have been specified.

## Hierarchy

- [`Throttle`](Throttle.md)

  ↳ **`NoThrottle`**

## Table of contents

### Constructors

- [constructor](NoThrottle.md#constructor)

### Accessors

- [nextSlot](NoThrottle.md#nextslot)
- [remainder](NoThrottle.md#remainder)
- [waitTime](NoThrottle.md#waittime)

### Methods

- [consume](NoThrottle.md#consume)
- [permit](NoThrottle.md#permit)
- [reset](NoThrottle.md#reset)

## Constructors

### constructor

• **new NoThrottle**()

Creates a throttle.

#### Overrides

[Throttle](Throttle.md).[constructor](Throttle.md#constructor)

#### Defined in

[src/throttle.ts:125](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/throttle.ts#L125)

## Accessors

### nextSlot

• `get` **nextSlot**(): `number`

#### Returns

`number`

#### Overrides

Throttle.nextSlot

#### Defined in

[src/throttle.ts:129](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/throttle.ts#L129)

___

### remainder

• `get` **remainder**(): `number`

Returns how much capacity is left. This value is useful for selecting
the least constricted resource among a pool of throttled resources.

#### Returns

`number`

#### Inherited from

Throttle.remainder

#### Defined in

[src/throttle.ts:46](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/throttle.ts#L46)

___

### waitTime

• `get` **waitTime**(): `number`

#### Returns

`number`

#### Overrides

Throttle.waitTime

#### Defined in

[src/throttle.ts:130](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/throttle.ts#L130)

## Methods

### consume

▸ **consume**(): `void`

Consumes one unit of capacity. Should only be called if {@link Throttle#waitTime waitTime} > 0.

#### Returns

`void`

#### Overrides

[Throttle](Throttle.md).[consume](Throttle.md#consume)

#### Defined in

[src/throttle.ts:131](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/throttle.ts#L131)

___

### permit

▸ **permit**(): `Promise`<`any`\>

Returns a promise that is guaranteed to resolve (in FIFO order), but not sooner
than the throttle allows. For certain use cases this provides a more convenient
alternative compared to using the [`Throttle.waitTime`](Throttle.md#waittime) and
[`Throttle.consume`](Throttle.md#consume) pair.

#### Returns

`Promise`<`any`\>

#### Overrides

[Throttle](Throttle.md).[permit](Throttle.md#permit)

#### Defined in

[src/throttle.ts:132](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/throttle.ts#L132)

___

### reset

▸ **reset**(): `void`

Resets the throttle to its maximum capacity.

#### Returns

`void`

#### Inherited from

[Throttle](Throttle.md).[reset](Throttle.md#reset)

#### Defined in

[src/throttle.ts:37](https://github.com/Dynatrace-ESA/dynatrace-api-balancer/blob/d00cf1a/src/throttle.ts#L37)
