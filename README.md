# 提瓦特任务树与剧情实录索引

以米游社观测枢任务目录为母清单，用BWIKI补充章幕与版本证据，用视频标题、简介、分P和上传时间匹配剧情实录。首页是可平移、缩放的任务流程图。旧时间线页面及其专用JS、CSS已移除。

## 本地预览

```bash
python3 server.py
```

打开 <http://127.0.0.1:4173>。也可以直接打开 `index.html`；不同访问地址的浏览器进度不共享。

GitHub Pages 发布已配置：`npm run build:pages` 生成纯前端文件，推送至 `main` 后可由 Actions 自动部署。首次启用及后续更新步骤见 [GitHub Pages 部署说明](docs/github-pages.md)。

## 本地管理

运行 `python3 server.py` 后，在地址栏手动输入 `http://127.0.0.1:4173/admin`。首页没有管理入口。管理页提供任务搜索、新增、删除及名称、性质、版本、描述、多个前序任务和多条视频链接的编辑，底部为实时预览。B站链接可直接携带 `?p=2` 等分P参数。

保存会先在临时目录校验并构建，拒绝循环前置、无效任务与视频链接，成功后更新本地文件。已经打开的首页每两秒检查更新并重新渲染，保留筛选、缩放和完成勾选；升级代码后，已打开的旧首页需先刷新一次。管理页有未保存修改时会提醒，多个页面同时编辑时会拒绝覆盖过期版本。

管理修改存放在 `data/admin-overrides.json`，在原始来源与自动匹配之后应用；删除只隐藏入口并移除相关连线，不删除百科原文。每次保存前的管理文件存入 `data/admin-backups/`，必要时可恢复该文件后执行 `node scripts/build-project.mjs .`。本地服务仅监听127.0.0.1，保存接口限制同源JSON请求；没有公网登录系统，直接打开HTML文件不支持管理保存。

回归测试：`node scripts/test-admin-browser.cjs`（需Playwright及本机Chrome，测试在临时副本完成，不修改正式任务）。

## 当前覆盖（2026-09-26）

| 项目 | 当前结果 |
| --- | --- |
| 米游社母目录 | 1070个唯一词条，1070份详情已保存 |
| 展示入口 | 1070个；每个米游社词条独立成卡，27个系列作为标签保留 |
| 版本归位 | 1069个有版本，1个未知 |
| 跨节点关系 | 581条：43条章幕、7条叙事、474条来源前置、57条系列/章节关系 |
| 接入关系的入口 | 691个；另379个缺少跨节点顺序依据 |
| 实录链接 | 652/1070个入口有推荐实录，223个定位分P；418个未匹配，详见 [实录覆盖清单](data/task-recording-coverage.md) |
| 已核对官方更新日期 | 6个版本；任务实际开放日期仍未逐项核实 |
| 开服历史等级证据 | 0条；当前百科等级不参与历史排序 |

**框架与已保存目录的索引完整，游戏任务全集及全部剧情顺序尚未核完。** 379个未接入关系的入口不等于379个漏收任务。已确认的缺口见 [当前状态](data/project-status.md)，逐条关系审计见 `data/task-source-relation-audit.json`。

此前五项暂行版本已用BWIKI正文核对：戴因斯雷布报幕1.3、若还有另一个家3.6、人生的波峰与波谷4.1、生日快乐4.2、食梦者的忧郁5.4。《磬弦奏华夜》其一3.4和《飞漆溅彩》5.8仍依据已保存的同活动条目补正，保留推定性质。“其他版本”仅剩《至冬宫的来信》；它引用的第七章第三幕《白夜似梦初醒》未在本次母目录中找到，不能凭视频上传时间补定版本。

## 展示与顺序

- 首页采用星夜蓝、暖金与羊皮纸色的冒险档案风格；星轨山峦为项目内原创SVG，不请求外部图片或字体。右上角可切换晨光主题，偏好保存在当前浏览器。装饰不覆盖连线区域，减少动态效果偏好也作用于图导航。
- 左侧为版本轴；前序在上、后续在下，同行不限数量，所有明确前置均画线。先按剧情关系确定层次，再用日期、版本辅助分布。同层仅表示现有资料未要求彼此先后，不证明剧情同时发生。
- 金、紫、蓝、绿从左到右分组；第一列留给金色，紫、蓝、绿最早从第二、三、四列开始。同色多个节点向右扩展，后续颜色顺延。
- 魔神金色，角色传说、邀约与部族纪闻紫色，世界任务蓝色，活动及其他绿色。这是本项目的视觉约定，未宣称已核实所有官方UI颜色。
- 魔神任务之间的连线、章幕和叙事关系用金色实线，其他来源前置用青色实线。选中任务高亮相关连线；筛选隐藏节点后，原有前置仍约束布局。左侧版本号每版显示一次，仅在左栏用横线分界，完成数量按整版汇总。
- 每条关系分配独立出入口和走线通道，密集处自动增加行列间距，不让不同关系共用线段。交叉处用背景留白区分，选中关系绘制在最上层；交叉不表示任务汇合。
- 《第一章 第四幕·报幕 戴因斯雷布》置于《迫近的客星》与《我们终将重逢》之间，展示为金色；来源的世界任务标签仍保存在数据中。序章使用数值章序，位于第一章之前。
- 详情展示系列标签、独立词条标题、可用简介、实录链接、B站/YouTube搜索及前序任务。每个米游社词条独立保留进度；词条内部的子任务流程可展开检索。审计备注和触发条件不显示。
- 森林书的四章直接列出，第二章内列出愿为一炊之梦、吉祥具书、水天供书、正法炬书。后续引用保留具体前置原文，例如兰纳迦的回忆所需第四章、静态风景所需兰那罗的世界；系列入口的连线只约束先后，不表示必须完成整个系列。
- 可以搜索角色、任务、系列名和子任务，例如“沙海迷踪”会定位到“黄金梦乡”系列下的独立卡片。角色各幕独立保留，不预设只能有两幕。
- 缩放支持1%步进；“全图”会按当前视口自动计算最小适配比例，窗口改变时也会重新校准。每日委托系列按米游社前置/后续证据逐条加入，暂不依据相似名称猜测。
- 卡片可勾选“已看过 / 已完成”，支持进度筛选。稳定节点ID保存在 `localStorage` 的 `teyvat-archive:task-progress:v1`；刷新保留，重置筛选不清空。存储不可用时会提示，并保留本页内操作；不同设备不自动同步。

自动提取前置仅接入范围明确的完整任务引用。多子任务详情、可选条件、归并边界不明、来源冲突或环路不会自动变成整任务强制依赖。导入器依据米游社 `template_layout` 关联模块，避免把后续子任务的条件误归给起始任务。已知多前置如《我们终将重逢》同时连接雷泽任务与戴因报幕。

当前百科中的冒险等阶只作来源观测；历史等阶必须另存适用版本和原文证据才能在早期版本内辅助布局，不能覆盖剧情关系。公告发布时间、百科修改时间、视频上传时间均不冒充任务实装日期。

## 代码与数据

| 位置 | 职责 |
| --- | --- |
| `index.html`、`task-tree.js`、`task-tree.css` | 页面结构、交互状态和布局样式，不内嵌任务清单 |
| `ui/theme.css` | 配色、字体和通用控件 |
| `ui/task-view.js` | 卡片、精简详情和统计的纯渲染函数，共享文本转义 |
| `ui/journey-sky.svg` | 原创星轨、山峦与建筑剪影背景，无外部依赖 |
| `task-graph-layout.js` | 独立坐标、分层和连线路径计算 |
| `scripts/build-miyoushe-catalog.mjs` | 原始目录和详情的规范化导入 |
| `scripts/lib/source-relations.mjs` | 保守提取明确前置，输出采纳/跳过原因 |
| `scripts/lib/series-contents.mjs` | 归并系列的可展开目录、子任务搜索及带来源证据的章节归属 |
| `scripts/build-task-tree.mjs` | 归并、纠错、证据校验及任务树生成 |
| `scripts/build-recording-index.mjs` | 视频元数据分类与任务/分P匹配 |
| `scripts/lib/recording-matching.mjs` | 简繁体转换、任务名称与分P匹配、实录/解析/攻略区分 |
| `scripts/build-recording-coverage.mjs` | 逐任务覆盖、搜索失败、候选未确认及缺口报告 |
| `scripts/build-project.mjs` | 一次完成离线目录、任务树和实录索引构建 |
| `scripts/add-task.mjs`、`scripts/lib/custom-tasks.mjs` | 录入、校验、试构建及合并用户任务 |
| `data/custom-tasks.json` | 手动任务，独立于百科来源，后续重建保留 |
| `data/sources/` | 原始来源、公开URL、保存时间和SHA-256 |
| `data/miyoushe-task-catalog.json` | 规范化母目录与详情字段 |
| `data/task-tree-rules.json` | 系列归并、角色检索名和冲突备注 |
| `data/task-entry-corrections.json` | 展示分类、版本和简介补正及证据 |
| `data/task-chronology-rules.json` | 手工核对的跨章、前置与历史等级证据 |
| `data/task-series-flows.json` | 系列内部的局部流程及来源冲突 |
| `data/release-calendar.json` | 有官方正文证据的版本更新日期 |
| `data/task-tree-videos.json` | 人工维护的候选及固定实录链接 |
| `data/task-recording-index.json` | 自动生成的实录匹配及排除记录 |
| `data/task-recording-coverage.json`、`.md` | 每个入口的推荐链接、检索进度、未匹配原因 |
| `data/task-source-relation-audit.json`、`data/chronology-audit.json` | 生成的前置审计及顺序覆盖 |
| `data/task-tree.json` | 含完整证据的任务树，约6.5MB |
| `data/task-tree-data.js` | 仅供展示的浏览器数据，约1MB |

原始目录与审计证据不打包进页面。`data/story-nodes.json`、`data/story-relations.json`、`data/story-archive.js` 是历史数据，不再作为首页覆盖判据。旧页面虽已移除，目录构建仍用 `story-nodes.json` 做历史映射，因此保留这些数据及其校验脚本。

## 重建与验证

需要 Node.js 18 或更新版本。首次先运行 `npm ci` 安装锁定版本的简繁体转换依赖。之后可使用已保存来源离线重建：

```bash
node scripts/build-project.mjs .
node scripts/test-task-tree.mjs .
node scripts/test-recording-matching.mjs
node scripts/test-source-relations.mjs
node scripts/test-task-graph.cjs
node scripts/test-task-progress.cjs
node scripts/test-add-task.mjs
```

构建先生成不含自动实录的任务树，再匹配视频，最后合并实录和覆盖报告，避免旧索引中的节点ID阻断重建。测试检查来源哈希和详情ID、词条恰好归入一次、版本补正、图无环与不重叠、颜色排序、多前置、可选条件不误连、存储降级、实录证据、误匹配及精简详情。

真实浏览器测试需要Playwright及本机Chrome（路径见脚本）：

```bash
node scripts/test-task-tree-browser.cjs
```

当前已通过桌面/手机布局与交互验证，包括具体分P和搜索并存、多前置导航、完成记录刷新保留、筛选、缩放和存储不可用；桌面与手机截图已检查。此前自动审批503不再阻断本次公开来源获取和浏览器检查。

## 更新来源与新增任务

**手动录入已经可以直接使用脚本。** 无需先修改米游社目录：

```bash
node scripts/add-task.mjs --name "新任务完整名称" --type 蓝色 --version 5.8 --dry-run
```

可加 `--previous`、`--next`、`--video`，支持多次填写和完整名称/节点ID引用。也可用 `--file` 传入JSON对象或任务数组。去掉 `--dry-run` 后正式保存并自动重建；刷新页面生效。详情、分P写法、更新方式见 [录入说明](docs/task-entry.md)，完整字段见 [JSON模板](examples/task.json)。模板没有被导入正式目录。

手动任务、关系、视频均标明用户提供，不伪装成百科或已核验视频证据；保留搜索能力和现有完成记录。下方流程用于刷新百科来源本身。

同步当前目录的缺失详情和补充证据（需要联网）：

```bash
node scripts/sync-task-details.mjs . --all
# 或只取指定词条
node scripts/sync-task-details.mjs . --ids 677,1551
node scripts/sync-task-evidence.mjs .
node scripts/build-project.mjs .
```

详情同步保留成功缓存，三个并发、单请求30秒超时；失败单独报告。`task-detail-sync-report.json` 的 `requested` 表示本次请求规模，`coverage` 表示整个母目录的已保存详情覆盖。它不会发现新目录词条，也不会强制刷新成功缓存。

证据同步保留成功缓存和明确访问错误，避免反复请求拒绝访问的页面；存在历史失败时退出码仍为1。目前BWIKI《飞漆溅彩》《至冬宫的来信》返回HTTP 567；B站合集列表接口曾返回-352，现使用成功的视频详情所附公开合集目录。B站搜索接口返回412后使用可正常读取的公开搜索网页，YouTube搜索出现429后停止。没有把访问失败算作“没有视频”，也未绕过访问限制。

实录检索、缓存、候选筛选和后续增量维护见 [实录维护说明](docs/task-recordings.md)。逐任务的推荐实录和未匹配原因见 [覆盖清单](data/task-recording-coverage.md)，无需从旧审计文件推算。

新增任务的维护顺序：

1. 保存新的母目录及详情响应。目录公开URL和文件名见 `data/sources/miyoushe/manifest.json`；带分页参数与不带分页参数的目录ID集合须一致。可把目录及所需详情放入临时目录，再运行 `node scripts/build-miyoushe-catalog.mjs . /临时目录` 导入。保留原目录中的所有已有词条。
2. 默认以 `mys-来源ID` 产生稳定入口；属于已有长篇系列时更新归并规则。保留已有节点ID，以免改变完成记录。
3. 新版本、分类补正写入 `task-entry-corrections.json`；明确前置写入 `task-chronology-rules.json` 并附已保存原文。没有证据的版本/关系保持未知，不猜测目录顺序。
4. 新实录先保存元数据，再人工固定或重新运行匹配器；执行离线构建和相关测试。

因此可以把以后提供的新任务插入系统；只需提供任务名及尽可能明确的米游社/BWIKI链接。任务的上线版本和前置证据决定位置，缺少视频也会保留搜索入口。

固定实录写入 `task-tree-videos.json` 的 `pinned`，字段包括 `nodeId`、`platform`、`title`、`url`、`classification: "story-recording"`、`verifiedMatch: true`、已保存元数据的 `evidenceRef` 和人工核对依据 `reviewBasis`。分P另加 `part: {page: 正整数, title: "分P标题"}`。人工固定优先于自动推荐；自动索引每个入口只推荐一条，替代结果保存在 `matches` 中。

## 来源边界

米游社网页版为[观测枢·图鉴·任务](https://baike.mihoyo.com/ys/obc/channel/map/189/43)，用户分享的[677号任务](https://baike.mihoyo.com/ys/obc/content/677/detail)在此目录中。尚未证明手机“任务手册”和图鉴的全集相同。观测枢含社区作者与编辑，不把全部内容等同官方开发者声明。隐藏任务属性仍逐项待核；类型标签可重叠，数量不能相加。

仅查看视频元数据，未播放、观看或下载视频。匹配中的 `verifiedMatch` 只表示元数据与任务相符，不证明无剪辑、全步骤或录制完整。纯剧情实录可能省略战斗和跑图。分P链接是任务入口，后续内容可能分在相邻P；整个BV的上传时间不能当作每一P的上传时间。用户此前打开的“星回”深度解析视频 `BV15mi3B2EgQ` 已排除；解析、考据、混剪、高光和预告不作为实录入口。YouTube已保存少量搜索元数据，但此次优选链接均来自B站；搜索限流后未继续请求。

`data/miyoushe-source-audit.json`、`data/video-source-audit.json`、`data/completeness-gap-audit.json` 等保留此前阶段的历史审计，不是当前首页的实时统计。旧时间线曾缺少的凯亚、五郎邀约已存在于新任务树。当前状态以 `data/project-status.md` 和本次生成的任务树、关系审计、实录索引为准。BWIKI活动目录自身也存在缺漏，不能宣称游戏任务全集已全部收齐。
