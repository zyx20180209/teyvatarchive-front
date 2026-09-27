# 发布到 GitHub Pages

公开网站支持浏览任务、搜索、连线、视频链接、缩放和浏览器内的个人完成记录。管理仍在本机进行，网站不包含 `/admin` 和保存接口。

## 首次发布

1. 在 GitHub 创建一个空的公开仓库，例如 `ysarchive`。先不要勾选自动创建 README、许可证和 .gitignore，以便推送现有文件。
2. 在本机项目目录执行以下命令。把远程地址中的 `YOUR_NAME` 替换成 GitHub 用户名；如仓库名称不同，同时替换 `ysarchive`。当前项目还没有 Git 仓库，所以首次需要 `git init`。

```sh
cd /Users/yuxuan/personal/ysarchive
node scripts/build-pages.mjs
git init -b main
git add .gitignore .github index.html task-tree.js task-tree.css task-graph-layout.js ui data/task-tree-data.js scripts/build-pages.mjs package.json package-lock.json README.md docs/github-pages.md
git commit -m "Publish task archive frontend"
git remote add origin https://github.com/YOUR_NAME/ysarchive.git
git push -u origin main
```

上述清单只提交前端及发布配置。本地 `admin/`、`server.py`、原始来源、编辑覆盖文件等仍保存在电脑上，未由这份前端仓库备份。不要把以上 `git add` 简化成 `git add .`，除非你有意公开整个本地项目。

3. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
4. 打开仓库 **Actions**，选择 **Deploy frontend to GitHub Pages**。首次推送可能早于 Pages 启用，可点击 **Run workflow**（选择 `main`）重跑。
5. 等待 `build` 与 `deploy` 都成功，发布地址会显示在 Pages 设置页及该次部署结果中。一般为 `https://YOUR_NAME.github.io/ysarchive/`。可以把这个地址分享给其他用户，不需要对方安装软件或登录。

如果使用的是 GitHub Pages 用户站点仓库 `YOUR_NAME.github.io`，访问地址通常不带仓库路径。本项目资源使用相对路径，两种形式都兼容。

## 以后更新任务

在本机运行 `python3 server.py`，手动访问 `http://127.0.0.1:4173/admin`，编辑后点击保存。保存成功时，前端数据 `data/task-tree-data.js` 已同步生成。然后执行：

```sh
git add data/task-tree-data.js
git commit -m "Update tasks"
git push
```

推送到 `main` 后，Actions 自动部署新版本。访问者刷新页面即可获得更新，已有任务的稳定ID不变时，勾选进度保留。更新网页代码时，另外提交修改过的前端文件即可。

Pages 打包直接使用已生成的展示数据，不在 GitHub 上重新抓取百科或运行本机管理服务，也不需要上传约368MB的来源快照。无需配置第三方密钥或个人访问令牌到 workflow 中。

## 本机检查发布产物

```sh
npm run build:pages
python3 -m http.server 4174 --bind 127.0.0.1 --directory dist/pages
```

访问 `http://127.0.0.1:4174/`。发布产物共9个文件，只包含页面、样式、脚本、背景、展示数据与 `.nojekyll`；静态版关闭了本机接口轮询。

完成记录存在每位用户自己的浏览器中，不会互相覆盖，也不会跨设备同步。你在 `127.0.0.1` 下的进度不会自动迁移到 GitHub Pages 域名。
