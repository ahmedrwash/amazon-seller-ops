import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as pause } from 'node:timers/promises';
import { createAuthEventScheduler } from '../src/utils/authEvents.js';
test('session hydration starts after the callback releases its auth lock',async()=>{
 let locked=true,hydrated=false,error;
 const jobs=createAuthEventScheduler(async()=>{assert.equal(locked,false);hydrated=true;},e=>{error=e;});
 assert.equal(jobs.enqueue({user:{id:'user'}}),undefined);assert.equal(hydrated,false);locked=false;
 await pause(20);assert.equal(error,undefined);assert.equal(hydrated,true);jobs.dispose();
});
test('new auth events invalidate stale hydration and disposal cancels queued work',async()=>{
 const seen=[];let release;const pending=new Promise(resolve=>{release=resolve;});
 const jobs=createAuthEventScheduler(async(session,isCurrent)=>{if(session==='old')await pending;if(isCurrent())seen.push(session);},()=>{});
 jobs.enqueue('old');await pause(10);jobs.enqueue('signed_out');release();await pause(10);assert.deepEqual(seen,['signed_out']);
 jobs.enqueue('after_dispose');jobs.dispose();await pause(10);assert.deepEqual(seen,['signed_out']);
});
