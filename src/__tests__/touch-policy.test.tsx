// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render} from '@testing-library/react';
import {useGestures} from '../hooks/useGestures';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
function setup(){
 let now=1000;vi.spyOn(performance,'now').mockImplementation(()=>now);
 const change=vi.fn(),drag=vi.fn();
 function Test(){const {handlers}=useGestures({orientation:'vertical',direction:'ltr',threshold:80,
  distanceRatio:.22,viewportSize:()=>844,minFlickDistance:55,flickVelocity:.65,controlledTouch:true,
  lockAxis:true,ignoreWhileAnimating:false,loop:false,getIndex:()=>1,maxIndex:10,onRequestIndexChange:change,
  setAnimating:()=>{},isAnimating:false,onDrag:drag});return <div data-testid="surface" {...handlers}><button>Control</button></div>;}
 const view=render(<Test/>),surface=view.getByTestId('surface');
 const event=(type:'pointerDown'|'pointerMove'|'pointerUp'|'pointerCancel',y:number,ms=16,id=1,x=100)=>{
  now+=ms;act(()=>fireEvent[type](surface,{clientX:x,clientY:y,pointerId:id,pointerType:'touch',button:0}));
 };
 event('pointerDown',600);
 return {event,change,drag,surface,view};
}
it('keeps a tiny fast movement on the same slide',()=>{const t=setup();t.event('pointerMove',576,8);t.event('pointerUp',576,8);expect(t.change.mock.calls).toEqual([[1]]);});
it('returns a slow partial drag to its anchor',()=>{const t=setup();t.event('pointerMove',550,100);t.event('pointerMove',500,100);t.event('pointerUp',500,100);expect(t.change.mock.calls).toEqual([[1]]);});
it('accepts a deliberate short flick from recent velocity',()=>{const t=setup();t.event('pointerMove',570,20);t.event('pointerMove',510,20);t.event('pointerUp',510,10);expect(t.change.mock.calls).toEqual([[2]]);});
it('does not treat a held partial drag as a flick',()=>{const t=setup();t.event('pointerMove',560,15);t.event('pointerMove',500,15);t.event('pointerUp',500,400);expect(t.change.mock.calls).toEqual([[1]]);});
it('commits a slow drag past the viewport threshold only on release',()=>{const t=setup();t.event('pointerMove',350,400);expect(t.change).not.toHaveBeenCalled();t.event('pointerUp',350,400);expect(t.change.mock.calls).toEqual([[2]]);});
it('uses the release direction after reversing a partial drag',()=>{const t=setup();t.event('pointerMove',460,200);t.event('pointerMove',520,20);t.event('pointerUp',520,10);expect(t.change.mock.calls).toEqual([[1]]);});
it('never skips multiple items for a long gesture',()=>{const t=setup();t.event('pointerMove',-900,200);t.event('pointerUp',-900,20);expect(t.change.mock.calls).toEqual([[2]]);});
it('cancellation returns to the original slide and releases the pointer',()=>{const t=setup();t.event('pointerMove',200,80);t.event('pointerCancel',200);t.event('pointerUp',200);expect(t.change.mock.calls).toEqual([[1]]);});
it('ignores a second pointer and perpendicular swipes',()=>{const t=setup();t.event('pointerMove',200,20,2);t.event('pointerMove',598,20,1,250);t.event('pointerUp',598);expect(t.change).not.toHaveBeenCalled();expect(t.drag).not.toHaveBeenCalled();});
it('leaves interactive controls clickable',()=>{const t=setup();t.event('pointerUp',600);act(()=>{fireEvent.pointerDown(t.view.getByText('Control'),{clientY:600,pointerId:3,pointerType:'touch',button:0});fireEvent.pointerMove(t.surface,{clientY:200,pointerId:3});fireEvent.pointerUp(t.surface,{pointerId:3});});expect(t.change).not.toHaveBeenCalled();});
it('does not cancel when implicit capture transfers from a child to the surface',()=>{const t=setup();t.event('pointerMove',500,30);act(()=>fireEvent.lostPointerCapture(t.view.getByText('Control'),{pointerId:1,bubbles:true}));t.event('pointerMove',300,60);t.event('pointerUp',300,20);expect(t.change.mock.calls).toEqual([[2]]);});
