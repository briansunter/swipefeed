[**swipefeed**](../README.md)

***

[swipefeed](../README.md) / SwipeDeckMotion

# Interface: SwipeDeckMotion

Defined in: [types.ts:17](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L17)

## Properties

### direction

> **direction**: [`SwipeDeckMotionDirection`](../type-aliases/SwipeDeckMotionDirection.md)

Defined in: [types.ts:31](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L31)

Direction of the latest observed movement.

***

### index

> **index**: `number`

Defined in: [types.ts:25](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L25)

Item nearest the viewport center.

***

### isSettled

> **isSettled**: `boolean`

Defined in: [types.ts:33](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L33)

Whether the nearest item is aligned with the viewport.

***

### offset

> **offset**: `number`

Defined in: [types.ts:27](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L27)

Nearest item's offset from its settled position, in pixels.

***

### offsetRatio

> **offsetRatio**: `number`

Defined in: [types.ts:29](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L29)

Nearest item's offset normalized by viewport size.

***

### position

> **position**: `number`

Defined in: [types.ts:23](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L23)

Continuous item position. For example, 1.5 is halfway from item 1 to item 2.

***

### scrollOffset

> **scrollOffset**: `number`

Defined in: [types.ts:19](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L19)

Clamped scroll offset along the deck's active axis, in pixels.

***

### viewportSize

> **viewportSize**: `number`

Defined in: [types.ts:21](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L21)

Current viewport size along the deck's active axis, in pixels.
