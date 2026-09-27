import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const output=path.join(root,'dist/pages');
const files=['index.html','task-tree.js','task-tree.css','task-graph-layout.js',
  'ui/theme.css','ui/task-view.js','ui/journey-sky.svg','data/task-tree-data.js'];
const allowed=new Set([...files,'.nojekyll']);
// Refuse unrelated leftovers instead of silently publishing or removing them.
function inspect(directory,relative=''){
  if(!fs.existsSync(directory))return;
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
    const name=relative+entry.name;
    if(entry.isSymbolicLink())throw new Error(`发布目录不能包含符号链接：${name}`);
    if(entry.isDirectory()){
      if(!files.some(f=>f.startsWith(name+'/')))throw new Error(`发布目录中有非前端目录：${name}`);
      inspect(path.join(directory,entry.name),name+'/');
    }else if(!allowed.has(name))throw new Error(`发布目录中有非前端文件：${name}`);
  }
}
inspect(output);
const source=fs.readFileSync(path.join(root,'data/task-tree-data.js'),'utf8');
const match=source.match(/^window\.TASK_TREE_DATA = ([\s\S]+);\s*$/);
if(!match)throw new Error('浏览器任务数据格式错误，请先在本机重建。');
const data=JSON.parse(match[1]);
const ids=new Set(data.nodes.map(n=>n.id));
if(!ids.size||ids.size!==data.nodes.length||data.relations.some(r=>!ids.has(r.from)||!ids.has(r.to)))throw new Error('任务ID或连线无效。');
for(const file of files){
  let content=fs.readFileSync(path.join(root,file));
  if(file==='index.html'){
    const html=content.toString();
    if(!html.includes('<html lang="zh-CN">'))throw new Error('首页标记已改变，请更新静态发布配置。');
    content=html.replace('<html lang="zh-CN">','<html lang="zh-CN" data-live-updates="off">')
      .replace('请启用 JavaScript 以浏览任务树，也可以查看 data/task-tree.json。','请启用 JavaScript 以浏览任务树。');
  }
  const target=path.join(output,file);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,content);
}
fs.writeFileSync(path.join(output,'.nojekyll'),'');
console.log(`Pages 前端已生成：${output}（${files.length+1} 个文件，${ids.size} 个任务；不含管理页和后端）`);
