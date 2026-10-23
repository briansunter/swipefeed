// @vitest-environment jsdom
import {afterEach,it,expect,vi} from 'vitest';
import React,{createRef} from 'react';
import type {SwipeDeckHandle} from '../types';
import {render,cleanup,act} from '@testing-library/react';
import {SwipeDeck} from '../components/SwipeDeck';
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals()});
function setup(){
 vi.useFakeTimers();vi.setSystemTime(1000);vi.spyOn(performance,'now').mockImplementation(()=>Date.now());
 vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});
 vi.stubGlobal('requestAnimationFrame',(fn:FrameRequestCallback)=>setTimeout(()=>fn(Date.now()),16));vi.stubGlobal('cancelAnimationFrame',(id:number)=>clearTimeout(id));
 const height=vi.spyOn(HTMLElement.prototype,'clientHeight','get').mockReturnValue(600);vi.spyOn(HTMLElement.prototype,'clientWidth','get').mockReturnValue(400);
 Object.defineProperty(HTMLElement.prototype,'scrollTo',{configurable:true,value:function(opts:ScrollToOptions){this.scrollTop=opts.top??0;}});
 const ref=createRef<SwipeDeckHandle>();const changed=vi.fn();const view=render(<SwipeDeck ref={ref} items={['a','b','c']} index={0} transitionDuration={320} onIndexChange={changed} gesture={{touch:'controlled',threshold:80}}>{({item})=><div>{item}</div>}</SwipeDeck>);
 const viewport=view.getByRole('feed');act(()=>vi.advanceTimersByTime(100));
 function input(type:string,y:number,target:EventTarget=viewport){const e=new PointerEvent(type,{bubbles:true,clientY:y,clientX:100,pointerId:1,pointerType:'touch',button:0});Object.defineProperty(e,'timeStamp',{value:Date.now()});act(()=>target.dispatchEvent(e));}
 return {viewport,changed,input,height,ref};
}
it('controlled paging never enables native pan or CSS snap',()=>{const {viewport}=setup();expect(viewport.style.overflow).toBe('hidden');expect(viewport.style.scrollSnapType).toBe('none');});
it('a late compositor scroll cannot strand the controlled artwork or select a blank neighbor',()=>{
 const {viewport,changed}=setup();viewport.scrollTop=230;act(()=>viewport.dispatchEvent(new Event('scroll')));act(()=>vi.advanceTimersByTime(600));expect(viewport.scrollTop).toBe(0);expect(changed).not.toHaveBeenCalled();
});
it('finishes when release is delivered to the window instead of the deck',()=>{
 const {viewport,changed,input}=setup();input('pointerdown',500);input('pointermove',450);act(()=>vi.advanceTimersByTime(32));input('pointerup',300,window);act(()=>vi.advanceTimersByTime(600));expect(viewport.scrollTop).toBe(600);expect(changed).toHaveBeenCalledWith(1,'user:gesture');
});
it('a height-only toolbar resize keeps the current finger gesture alive',()=>{
 const {viewport,changed,input,height}=setup();input('pointerdown',500);input('pointermove',450);act(()=>vi.advanceTimersByTime(32));height.mockReturnValue(700);act(()=>window.dispatchEvent(new Event('resize')));input('pointerup',300);act(()=>vi.advanceTimersByTime(600));expect(viewport.scrollTop).toBe(700);expect(changed).toHaveBeenCalledWith(1,'user:gesture');
});
it('unlocks at the release deadline even when reconciliation RAF is suspended',()=>{
 const {viewport,input}=setup();vi.stubGlobal('requestAnimationFrame',()=>123);
 input('pointerdown',500);input('pointermove',450);input('pointerup',300);act(()=>vi.advanceTimersByTime(700));
 expect(viewport.scrollTop).toBe(600);expect(viewport.getAttribute('aria-busy')).toBe('false');
});

it('instant navigation never restores native snap in controlled mode',()=>{
 const {viewport,ref}=setup();act(()=>ref.current!.scrollTo(1,{behavior:'instant'}));act(()=>vi.advanceTimersByTime(700));expect(viewport.style.scrollSnapType).toBe('none');
});
