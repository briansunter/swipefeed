// @vitest-environment jsdom
import {afterEach,it,expect,vi} from 'vitest';
import React,{createRef} from 'react';
import {render,cleanup,act} from '@testing-library/react';
import {SwipeDeck} from '../components/SwipeDeck';
import type {SwipeDeckHandle} from '../types';
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals()});
it('paints intermediate eased positions and releases its navigation lock',()=>{
 vi.useFakeTimers();vi.setSystemTime(1000);
 vi.spyOn(performance,'now').mockImplementation(()=>Date.now());
 vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});
 vi.stubGlobal('requestAnimationFrame',(fn:FrameRequestCallback)=>setTimeout(()=>fn(Date.now()),16));
 vi.stubGlobal('cancelAnimationFrame',(id:number)=>clearTimeout(id));
 const height=vi.spyOn(HTMLElement.prototype,'clientHeight','get').mockReturnValue(600);
 vi.spyOn(HTMLElement.prototype,'clientWidth','get').mockReturnValue(400);
 Object.defineProperty(HTMLElement.prototype,'scrollTo',{configurable:true,value:function(opts:ScrollToOptions){this.scrollTop=opts.top||0;}});
 const ref=createRef<SwipeDeckHandle>();
 const view=render(<SwipeDeck ref={ref} items={['a','b','c']} transitionDuration={320}>{({item})=><div>{item}</div>}</SwipeDeck>);
 const viewport=view.getByRole('feed');
 act(()=>ref.current!.scrollTo(1,{behavior:'smooth'}));
 expect(viewport.scrollTop).toBe(0);
 act(()=>vi.advanceTimersByTime(160));
 expect(viewport.scrollTop).toBeGreaterThan(0);expect(viewport.scrollTop).toBeLessThan(600);
 expect(ref.current!.getState().isAnimating).toBe(true);
 act(()=>vi.advanceTimersByTime(400));
 expect(viewport.scrollTop).toBe(600);expect(ref.current!.getState().isAnimating).toBe(false);
 expect(viewport.style.scrollSnapType).toBe('y mandatory');
 act(()=>ref.current!.scrollTo(2,{behavior:'smooth'}));act(()=>vi.advanceTimersByTime(80));
 height.mockReturnValue(300);act(()=>window.dispatchEvent(new Event('resize')));
 expect(viewport.scrollTop).toBe(600);
 act(()=>vi.advanceTimersByTime(600));expect(viewport.scrollTop).toBe(600);
 expect(ref.current!.getState().isAnimating).toBe(false);
});

it('flushes the final finger position before starting its release animation',()=>{
 vi.useFakeTimers();vi.setSystemTime(1000);vi.spyOn(performance,'now').mockImplementation(()=>Date.now());
 vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});
 vi.stubGlobal('requestAnimationFrame',(fn:FrameRequestCallback)=>setTimeout(()=>fn(Date.now()),16));vi.stubGlobal('cancelAnimationFrame',(id:number)=>clearTimeout(id));
 vi.spyOn(HTMLElement.prototype,'clientHeight','get').mockReturnValue(600);vi.spyOn(HTMLElement.prototype,'clientWidth','get').mockReturnValue(400);
 Object.defineProperty(HTMLElement.prototype,'scrollTo',{configurable:true,value:function(opts:ScrollToOptions){this.scrollTop=opts.top??0;}});
 const changed=vi.fn();const view=render(<SwipeDeck items={['a','b','c']} index={1} transitionDuration={320} onIndexChange={changed} gesture={{touch:'controlled',threshold:80}}>{({item})=><div>{item}</div>}</SwipeDeck>);
 const viewport=view.getByRole('feed');act(()=>vi.advanceTimersByTime(50));
 function input(type:string,y:number){const event=new PointerEvent(type,{bubbles:true,clientY:y,clientX:100,pointerId:1,pointerType:'touch',button:0});Object.defineProperty(event,'timeStamp',{value:Date.now()});act(()=>viewport.dispatchEvent(event));}
 input('pointerdown',600);input('pointermove',550);
 // No RAF has painted the pending move when the release arrives farther along.
 input('pointerup',350);
 expect(viewport.scrollTop).toBe(850);expect(changed).toHaveBeenCalledWith(2,'user:gesture');
 act(()=>vi.advanceTimersByTime(500));expect(viewport.scrollTop).toBe(1200);
});
