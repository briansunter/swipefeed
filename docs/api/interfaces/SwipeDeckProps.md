[**swipefeed**](../README.md)

***

[swipefeed](../README.md) / SwipeDeckProps

# Interface: SwipeDeckProps\<T\>

Defined in: [types.ts:149](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L149)

## Extends

- [`SwipeDeckOptions`](SwipeDeckOptions.md)\<`T`\>

## Type Parameters

### T

`T`

## Properties

### ariaLabel?

> `optional` **ariaLabel?**: `string`

Defined in: [types.ts:99](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L99)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`ariaLabel`](SwipeDeckOptions.md#arialabel)

***

### as?

> `optional` **as?**: `ComponentType`\<`unknown`\> \| keyof IntrinsicElements

Defined in: [types.ts:150](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L150)

***

### children

> **children**: (`context`) => `ReactNode`

Defined in: [types.ts:151](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L151)

#### Parameters

##### context

[`SwipeDeckRenderContext`](SwipeDeckRenderContext.md)\<`T`\>

#### Returns

`ReactNode`

***

### className?

> `optional` **className?**: `string`

Defined in: [types.ts:152](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L152)

***

### defaultIndex?

> `optional` **defaultIndex?**: `number`

Defined in: [types.ts:79](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L79)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`defaultIndex`](SwipeDeckOptions.md#defaultindex)

***

### direction?

> `optional` **direction?**: [`Direction`](../type-aliases/Direction.md)

Defined in: [types.ts:78](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L78)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`direction`](SwipeDeckOptions.md#direction)

***

### endReachedThreshold?

> `optional` **endReachedThreshold?**: `number`

Defined in: [types.ts:98](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L98)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`endReachedThreshold`](SwipeDeckOptions.md#endreachedthreshold)

***

### fullscreen?

> `optional` **fullscreen?**: `boolean`

Defined in: [types.ts:158](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L158)

If true, applies styles to make the deck take up the full view height (100dvh) and width (100%).
Helpful for full-screen video feeds to handle browser UI (address bar) correctly.

***

### gesture?

> `optional` **gesture?**: [`GestureConfig`](GestureConfig.md)

Defined in: [types.ts:90](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L90)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`gesture`](SwipeDeckOptions.md#gesture)

***

### index?

> `optional` **index?**: `number`

Defined in: [types.ts:80](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L80)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`index`](SwipeDeckOptions.md#index)

***

### items

> **items**: readonly `T`[]

Defined in: [types.ts:76](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L76)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`items`](SwipeDeckOptions.md#items)

***

### keyboard?

> `optional` **keyboard?**: [`KeyboardConfig`](KeyboardConfig.md)

Defined in: [types.ts:92](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L92)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`keyboard`](SwipeDeckOptions.md#keyboard)

***

### keyboardNavigation?

> `optional` **keyboardNavigation?**: `boolean`

Defined in: [types.ts:100](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L100)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`keyboardNavigation`](SwipeDeckOptions.md#keyboardnavigation)

***

### loop?

> `optional` **loop?**: `boolean`

Defined in: [types.ts:87](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L87)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`loop`](SwipeDeckOptions.md#loop)

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

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`onEndReached`](SwipeDeckOptions.md#onendreached)

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

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`onIndexChange`](SwipeDeckOptions.md#onindexchange)

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

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`onItemActive`](SwipeDeckOptions.md#onitemactive)

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

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`onItemInactive`](SwipeDeckOptions.md#oniteminactive)

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

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`onMotionChange`](SwipeDeckOptions.md#onmotionchange)

***

### orientation?

> `optional` **orientation?**: [`Orientation`](../type-aliases/Orientation.md)

Defined in: [types.ts:77](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L77)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`orientation`](SwipeDeckOptions.md#orientation)

***

### preload?

> `optional` **preload?**: `number`

Defined in: [types.ts:88](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L88)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`preload`](SwipeDeckOptions.md#preload)

***

### preloadPrevious?

> `optional` **preloadPrevious?**: `number`

Defined in: [types.ts:89](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L89)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`preloadPrevious`](SwipeDeckOptions.md#preloadprevious)

***

### style?

> `optional` **style?**: `CSSProperties`

Defined in: [types.ts:153](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L153)

***

### virtual?

> `optional` **virtual?**: [`VirtualConfig`](VirtualConfig.md)

Defined in: [types.ts:94](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L94)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`virtual`](SwipeDeckOptions.md#virtual)

***

### visibility?

> `optional` **visibility?**: [`VisibilityConfig`](VisibilityConfig.md)

Defined in: [types.ts:93](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L93)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`visibility`](SwipeDeckOptions.md#visibility)

***

### wheel?

> `optional` **wheel?**: [`WheelConfig`](WheelConfig.md)

Defined in: [types.ts:91](https://github.com/briansunter/swipefeed/blob/30b15c85c65fd31b45db0346913c657468ef40ab/src/types.ts#L91)

#### Inherited from

[`SwipeDeckOptions`](SwipeDeckOptions.md).[`wheel`](SwipeDeckOptions.md#wheel)
