import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { localShellPlugin, localShellWorker } from '../scripts/local-shell-plugin.js';

test('offline build follows only static entry and explicit local route graphs', () => {
  const chunk = (fileName, extras = {}) => ({type:'chunk',fileName,code:'synthetic code',imports:[],...extras});
  const bundle = {
    'index.html':{type:'asset',source:'<html>first</html>'},
    'style.css':{type:'asset',source:'body{color:white}'},
    'entry.js':chunk('entry.js',{isEntry:true,imports:['react.js'],dynamicImports:['cloud.js','local.js','audience.js'],viteMetadata:{importedCss:new Set(['style.css'])}}),
    'react.js':chunk('react.js'),
    'local.js':chunk('local.js',{facadeModuleId:'/src/pages/LocalLibrary.jsx',imports:['repo.js']}),
    'audience.js':chunk('audience.js',{facadeModuleId:'/src/pages/LocalAudience.jsx'}),
    'repo.js':chunk('repo.js'), 'cloud.js':chunk('cloud.js'),
  };
  let output;
  localShellPlugin().generateBundle.call({emitFile(value){output=value;}}, {}, bundle);
  assert.equal(output.fileName,'lucent-local-sw.js');
  assert.ok(output.source.includes('/repo.js')); assert.ok(output.source.includes('/style.css'));
  assert.ok(!output.source.includes('cloud.js'));
  const firstSource=output.source;
  bundle['index.html'].source='<html>second</html>';
  localShellPlugin().generateBundle.call({emitFile(value){output=value;}}, {}, bundle);
  assert.notEqual(output.source.split('\n')[0],firstSource.split('\n')[0], 'HTML-only edits must create a distinct cache');
  delete bundle['style.css'];
  assert.throws(() => localShellPlugin().generateBundle.call({emitFile(){}},{},bundle),/Missing offline shell asset/);
  delete bundle['audience.js'];
  assert.throws(() => localShellPlugin().generateBundle.call({emitFile(){}},{},bundle),/incomplete/);
});

function worker(fail=false) {
  const handlers={}, deleted=[], requests=[];
  let claimed=false;
  const cache={async addAll(items){requests.push(...items);if(fail)throw Error('network');},async match(path){return path==='/missing.js'?undefined:{path};}};
  const self={location:{origin:'https://local.test'},clients:{async claim(){claimed=true;}},addEventListener(name,fn){handlers[name]=fn;}};
  vm.runInNewContext(localShellWorker(['/index.html','/entry.js','/missing.js'],'test'),{self,URL,Request:class{constructor(path,opts){this.path=path;this.options=opts;}},Response,caches:{async open(){return cache;},async delete(name){deleted.push(name);},async keys(){return ['unrelated','lucent-local-shell-old','lucent-local-shell-test'];}}});
  return {handlers,deleted,requests,get claimed(){return claimed;}};
}
test('installation is public static only; failures delete partial cache and reject',async()=>{
  const good=worker();let pending;good.handlers.install({waitUntil(p){pending=p;}});await pending;
  assert.equal(good.requests.length,3);
  for(const r of good.requests){assert.equal(r.options.credentials,'omit');assert.equal(r.options.redirect,'error');}
  const bad=worker(true);bad.handlers.install({waitUntil(p){pending=p;}});await assert.rejects(pending,/network/);
  assert.deepEqual(bad.deleted,['lucent-local-shell-test']);
});
test('activation cleans only owned stale cache without forced skipWaiting',async()=>{
  const w=worker();let pending;w.handlers.activate({waitUntil(p){pending=p;}});await pending;
  assert.deepEqual(w.deleted,['lucent-local-shell-old']);assert.equal(w.claimed,true);
});
test('fetch handles local shell and exact assets only, never cloud/API/query/mutations',async()=>{
  const w=worker();
  const fetch=async(path,mode='navigate',method='GET')=>{let response;w.handlers.fetch({request:{url:new URL(path,'https://local.test').href,mode,method},respondWith(p){response=p;}});return response;};
  assert.equal((await fetch('/local-library')).path,'/index.html');
  assert.equal((await fetch('/local-audience/')).path,'/index.html');
  assert.equal((await fetch('/entry.js','cors')).path,'/entry.js');
  for(const path of ['/','/login','/local-library/secret','/api/songs','/local-library?token=secret','https://cloud.test/entry.js','/index.html']) assert.equal(await fetch(path),undefined);
  assert.equal(await fetch('/entry.js','cors','POST'),undefined);
  assert.equal((await fetch('/missing.js','cors')).status,503);
});

test('each lazy route has its own callback so Vite cannot preload cloud CSS locally', async()=>{
  const {readFile}=await import('node:fs/promises');
  const main=await readFile(new URL('../src/main.jsx',import.meta.url),'utf8');
  assert.match(main,/React\.lazy\(\(\) => import\('\.\/pages\/LocalLibrary\.jsx'\)\)/);
  assert.match(main,/React\.lazy\(\(\) => import\('\.\/pages\/LocalAudience\.jsx'\)\)/);
  assert.match(main,/React\.lazy\(\(\) => import\('\.\/App\.jsx'\)\)/);
});
