// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {render,cleanup,act} from '@testing-library/react';
import {SwipeDeck} from '../components/SwipeDeck';

afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
it('aligns a controlled deep link and an external index update without emitting stale navigation',async()=>{
 vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});
 vi.stubGlobal('requestAnimationFrame',(fn:FrameRequestCallback)=>setTimeout(()=>fn(performance.now()),0));
 vi.stubGlobal('cancelAnimationFrame',(id:number)=>clearTimeout(id));
 const height=vi.spyOn(HTMLElement.prototype,'clientHeight','get').mockReturnValue(600);
 vi.spyOn(HTMLElement.prototype,'clientWidth','get').mockReturnValue(400);
 Object.defineProperty(HTMLElement.prototype,'scrollTo',{configurable:true,value:function(opts:ScrollToOptions){this.scrollTop=opts.top||0;this.scrollLeft=opts.left||0;queueMicrotask(()=>this.dispatchEvent(new Event('scroll')));}});
 const onIndexChange=vi.fn();const items=[0,1,2,3,4];
 const ui=(index:number)=><SwipeDeck items={items} index={index} onIndexChange={onIndexChange}>{({item})=><div>{item}</div>}</SwipeDeck>;
 const view=render(ui(2));const viewport=view.getByRole('feed');
 expect(viewport.scrollTop).toBe(1200);
 view.rerender(ui(3));expect(viewport.scrollTop).toBe(1800);
 await act(async()=>{await new Promise(r=>setTimeout(r,30));});expect(onIndexChange).not.toHaveBeenCalled();
 height.mockReturnValue(300);window.dispatchEvent(new Event('resize'));expect(viewport.scrollTop).toBe(900);
 await act(async()=>{await new Promise(r=>setTimeout(r,80));});expect(onIndexChange).not.toHaveBeenCalled();
});
