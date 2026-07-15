[**swipefeed**](../README.md)

***

[swipefeed](../README.md) / SwipeDeckOptions

# Interface: SwipeDeckOptions\<T\>

Defined in: [types.ts:75](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L75)

## Extended by

- [`SwipeDeckProps`](SwipeDeckProps.md)

## Type Parameters

### T

`T`

## Properties

### ariaLabel?

> `optional` **ariaLabel?**: `string`

Defined in: [types.ts:99](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L99)

***

### defaultIndex?

> `optional` **defaultIndex?**: `number`

Defined in: [types.ts:79](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L79)

***

### direction?

> `optional` **direction?**: [`Direction`](../type-aliases/Direction.md)

Defined in: [types.ts:78](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L78)

***

### endReachedThreshold?

> `optional` **endReachedThreshold?**: `number`

Defined in: [types.ts:98](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L98)

***

### gesture?

> `optional` **gesture?**: [`GestureConfig`](GestureConfig.md)

Defined in: [types.ts:90](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L90)

***

### index?

> `optional` **index?**: `number`

Defined in: [types.ts:80](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L80)

***

### items

> **items**: readonly `T`[]

Defined in: [types.ts:76](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L76)

***

### keyboard?

> `optional` **keyboard?**: [`KeyboardConfig`](KeyboardConfig.md)

Defined in: [types.ts:92](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L92)

***

### keyboardNavigation?

> `optional` **keyboardNavigation?**: `boolean`

Defined in: [types.ts:100](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L100)

***

### loop?

> `optional` **loop?**: `boolean`

Defined in: [types.ts:87](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L87)

***

### onEndReached?

> `optional` **onEndReached?**: (`info`) => `void`

Defined in: [types.ts:97](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L97)

#### Parameters

##### info

###### direction

`"forward"` \| `"backward"`

###### distanceFromEnd

`number`

#### Returns

`void`

***

### onIndexChange?

> `optional` **onIndexChange?**: (`index`, `source`) => `void`

Defined in: [types.ts:81](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L81)

#### Parameters

##### index

`number`

##### source

[`IndexChangeSource`](../type-aliases/IndexChangeSource.md)

#### Returns

`void`

***

### onItemActive?

> `optional` **onItemActive?**: (`item`, `index`) => `void`

Defined in: [types.ts:95](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L95)

#### Parameters

##### item

`T`

##### index

`number`

#### Returns

`void`

***

### onItemInactive?

> `optional` **onItemInactive?**: (`item`, `index`) => `void`

Defined in: [types.ts:96](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L96)

#### Parameters

##### item

`T`

##### index

`number`

#### Returns

`void`

***

### onMotionChange?

> `optional` **onMotionChange?**: (`motion`) => `void`

Defined in: [types.ts:86](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L86)

Receives requestAnimationFrame-throttled motion snapshots without making
continuous motion part of SwipeDeck's React render state.

#### Parameters

##### motion

[`SwipeDeckMotion`](SwipeDeckMotion.md)

#### Returns

`void`

***

### orientation?

> `optional` **orientation?**: [`Orientation`](../type-aliases/Orientation.md)

Defined in: [types.ts:77](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L77)

***

### preload?

> `optional` **preload?**: `number`

Defined in: [types.ts:88](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L88)

***

### preloadPrevious?

> `optional` **preloadPrevious?**: `number`

Defined in: [types.ts:89](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L89)

***

### virtual?

> `optional` **virtual?**: [`VirtualConfig`](VirtualConfig.md)

Defined in: [types.ts:94](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L94)

***

### visibility?

> `optional` **visibility?**: [`VisibilityConfig`](VisibilityConfig.md)

Defined in: [types.ts:93](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L93)

***

### wheel?

> `optional` **wheel?**: [`WheelConfig`](WheelConfig.md)

Defined in: [types.ts:91](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L91)
