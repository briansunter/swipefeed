[**@brian/tiktok-swipe**](../README.md)

***

[@brian/tiktok-swipe](../README.md) / SwipeDeckOptions

# Interface: SwipeDeckOptions\<T\>

Defined in: [src/types.ts:53](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L53)

## Extended by

- [`SwipeDeckProps`](SwipeDeckProps.md)

## Type Parameters

### T

`T`

## Properties

### ariaLabel?

> `optional` **ariaLabel**: `string`

Defined in: [src/types.ts:70](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L70)

***

### defaultIndex?

> `optional` **defaultIndex**: `number`

Defined in: [src/types.ts:57](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L57)

***

### direction?

> `optional` **direction**: [`Direction`](../type-aliases/Direction.md)

Defined in: [src/types.ts:56](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L56)

***

### endReachedThreshold?

> `optional` **endReachedThreshold**: `number`

Defined in: [src/types.ts:69](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L69)

***

### gesture?

> `optional` **gesture**: `GestureConfig`

Defined in: [src/types.ts:61](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L61)

***

### index?

> `optional` **index**: `number`

Defined in: [src/types.ts:58](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L58)

***

### items

> **items**: readonly `T`[]

Defined in: [src/types.ts:54](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L54)

***

### keyboard?

> `optional` **keyboard**: `KeyboardConfig`

Defined in: [src/types.ts:63](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L63)

***

### keyboardNavigation?

> `optional` **keyboardNavigation**: `boolean`

Defined in: [src/types.ts:71](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L71)

***

### loop?

> `optional` **loop**: `boolean`

Defined in: [src/types.ts:60](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L60)

***

### onEndReached()?

> `optional` **onEndReached**: (`info`) => `void`

Defined in: [src/types.ts:68](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L68)

#### Parameters

##### info

###### direction

`"forward"` \| `"backward"`

###### distanceFromEnd

`number`

#### Returns

`void`

***

### onIndexChange()?

> `optional` **onIndexChange**: (`index`, `source`) => `void`

Defined in: [src/types.ts:59](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L59)

#### Parameters

##### index

`number`

##### source

[`IndexChangeSource`](../type-aliases/IndexChangeSource.md)

#### Returns

`void`

***

### onItemActive()?

> `optional` **onItemActive**: (`item`, `index`) => `void`

Defined in: [src/types.ts:66](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L66)

#### Parameters

##### item

`T`

##### index

`number`

#### Returns

`void`

***

### onItemInactive()?

> `optional` **onItemInactive**: (`item`, `index`) => `void`

Defined in: [src/types.ts:67](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L67)

#### Parameters

##### item

`T`

##### index

`number`

#### Returns

`void`

***

### orientation?

> `optional` **orientation**: [`Orientation`](../type-aliases/Orientation.md)

Defined in: [src/types.ts:55](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L55)

***

### virtual?

> `optional` **virtual**: `VirtualConfig`

Defined in: [src/types.ts:65](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L65)

***

### visibility?

> `optional` **visibility**: `VisibilityConfig`

Defined in: [src/types.ts:64](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L64)

***

### wheel?

> `optional` **wheel**: `WheelConfig`

Defined in: [src/types.ts:62](https://github.com/briansunter/swipefeed/blob/6969c541a9881e67647712cb6899a88830e66be6/src/types.ts#L62)
