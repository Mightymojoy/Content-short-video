# 短视频内容数据看板系统 — 技术选型与架构设计

> 版本: v1.1 | 日期: 2026-04-20  
> 项目路径: `D:\内容短视频-数据看板系统`

---

## 一、需求摘要

为直播电商团队的短视频投放运营构建一套 **数据监控看板系统**，覆盖 3 个店铺品牌：

| 品牌 | 标识 |
|------|------|
| 摩登新贵女 | modeng |
| 轻熟质享客 | qingshu |
| 云端商务家 | yunduan |

系统包含以下功能模块：

| 模块 | 功能 | 数据来源 |
|------|------|----------|
| 周度目标追踪（整体） | 短视频 GMV 占比/GMV 目标 vs 实际 | 手动定目标 + Excel 数据源 |
| 周度目标追踪（源头） | 内部/外部/ITO/AIGC 的制作量/GMV/占比/有效视频数 | 手动定目标 + Excel 数据源 |
| 季度跑量监控 | 单条 GMV ≥5万/≥1万的视频数量 | 自动计算（上传后第5天） |
| 视频形式监控 | 原生/KOL/直播切片/复刻/明星的ROI等指标 | 自动计算 |

**关键约束**：
- 数据源暂时手动上传 Excel，后续可能对接 API
- 需要随时随地访问（多端 Web）
- 交付形态：Excel 模板 + 看板页面结合
- 使用人数：1-3 人运营人员
- **统计维度：以周 (Week) 为主**
- **需要一次性导入历史数据**（1,585 条短视频 + 415 条直播记录）
- 3 个店铺品牌维度贯穿所有模块

---

## 二、技术选型

### 选型原则
- **轻量可部署**：不需要 K8s、Docker 等重型基础设施
- **低维护成本**：运营人员可自行管理，不需要专职运维
- **数据安全可控**：数据存在自己服务器/本地，不上云平台
- **渐进式演进**：从简单开始，预留 API 对接空间

### 推荐方案：Node.js + SQLite + ECharts

| 层级 | 技术选型 | 理由 |
|------|----------|------|
| **运行时** | Node.js 20 LTS | 运营团队无需安装复杂环境，npm 生态成熟 |
| **后端框架** | Express.js | 轻量、成熟、社区资源丰富，适合中小型应用 |
| **数据库** | SQLite (better-sqlite3) | 零配置、单文件、无需数据库服务，适合 1-3 人使用场景 |
| **文件上传** | multer + xlsx (SheetJS) | 解析上传的 Excel，提取数据写入 SQLite |
| **前端框架** | 原生 HTML + ECharts + Tailwind CSS | 无需构建步骤，直接浏览器打开，ECharts 图表交互性强 |
| **导出 Excel** | ExcelJS | 服务端生成 Excel 模板下载，支持样式和公式 |
| **部署** | PM2 进程管理 | 一行命令启动，自动重启，适合单机部署 |

### 为什么不用 Laravel/Python/其他方案？

| 方案 | 放弃理由 |
|------|----------|
| Laravel + MySQL | 对 1-3 人看板系统过重，需要 PHP + Nginx + MySQL 三件套 |
| Python Flask | 可行，但运营人员更熟悉 Node.js 生态，且 npm 包管理更便捷 |
| 纯前端 (无后端) | 无法持久化数据、无法跨设备同步、无法做 Excel 导出 |
| Google Sheets / 飞书多维表格 | 灵活性不足，无法做复杂计算和自定义图表 |
| 帆软/观远等 BI 工具 | 商业授权费用高，定制化受限 |

---

## 三、系统架构

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────┐
│                    用户终端                          │
│         (PC 浏览器 / 手机浏览器 / 平板)               │
└─────────────┬───────────────────────┬───────────────┘
              │  HTTPS                │ HTTPS
              ▼                       ▼
┌─────────────────────────────────────────────────────┐
│                  Nginx 反向代理                      │
│              (可选, 生产环境推荐)                     │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│              Node.js 后端服务 (Express)               │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ 上传模块  │  │ 查询模块  │  │   导出模块        │  │
│  │ multer   │  │ REST API │  │  ExcelJS         │  │
│  │ + xlsx   │  │          │  │  生成模板/报表    │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │             │                 │              │
│  ┌────▼─────────────▼─────────────────▼──────────┐  │
│  │            业务逻辑层 (Service)                 │  │
│  │  · 目标进度计算  · 有效视频识别  · 跑量统计    │  │
│  │  · 占比计算      · 视频分类     · 时间窗口     │  │
│  │  · 周维度聚合    · 品牌维度聚合                 │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │                              │
│  ┌────────────────────▼───────────────────────────┐  │
│  │            数据访问层 (Repository)               │  │
│  │         better-sqlite3                         │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │                              │
│  ┌────────────────────▼───────────────────────────┐  │
│  │           SQLite 数据库 (data.db)               │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 3.2 项目目录结构

```
D:\内容短视频-数据看板系统\
├── package.json                 # 项目配置与依赖
├── server.js                    # 入口文件
├── config.js                    # 配置项（端口、路径等）
├── .env                         # 环境变量（端口、密钥等）
│
├── db/
│   ├── init.js                  # 数据库初始化脚本（建表）
│   ├── seed.js                  # 历史数据导入脚本
│   └── data.db                  # SQLite 数据库文件
│
├── src/
│   ├── routes/                  # 路由层
│   │   ├── index.js             # 路由注册
│   │   ├── upload.js            # 文件上传路由
│   │   ├── dashboard.js         # 看板数据查询路由
│   │   ├── target.js            # 目标管理路由
│   │   └── export.js            # Excel 导出路由
│   │
│   ├── services/                # 业务逻辑层
│   │   ├── video.service.js     # 短视频数据处理
│   │   ├── target.service.js    # 目标计算
│   │   ├── effective.service.js # 有效视频识别
│   │   ├── runner.service.js    # 跑量视频统计
│   │   ├── format.service.js    # 视频形式分析
│   │   └── export.service.js    # Excel 导出生成
│   │
│   ├── repository/              # 数据访问层
│   │   ├── video.repo.js        # 视频数据 CRUD
│   │   ├── target.repo.js       # 目标数据 CRUD
│   │   ├── livestream.repo.js   # 直播间数据 CRUD
│   │   └── dashboard.repo.js    # 看板聚合查询
│   │
│   ├── utils/
│   │   ├── excel.parser.js      # Excel 解析工具
│   │   ├── date.helper.js       # 日期处理工具（含周计算）
│   │   └── calc.helper.js       # 通用计算工具
│   │
│   └── middleware/
│       ├── upload.middleware.js  # 文件上传中间件
│       └── error.middleware.js   # 错误处理中间件
│
├── public/                      # 前端静态文件
│   ├── index.html               # 看板主页
│   ├── css/
│   │   └── style.css            # 自定义样式 (Tailwind 补充)
│   ├── js/
│   │   ├── app.js               # 主应用逻辑
│   │   ├── charts.js            # ECharts 图表封装
│   │   ├── upload.js            # 上传交互逻辑
│   │   └── api.js               # API 请求封装
│   └── assets/
│       └── favicon.ico
│
├── templates/                   # Excel 模板文件
│   ├── upload_template.xlsx     # 数据上传模板
│   └── export_template.xlsx     # 报表导出模板
│
├── uploads/                     # 上传文件存储目录（自动创建）
│
└── docs/
    └── architecture.md          # 本文档
```

---

## 四、数据模型设计

### 4.1 E-R 关系

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   videos     │     │  livestream  │     │   targets    │
│  短视频数据  │     │  直播间数据  │     │  周度目标    │
│              │     │              │     │              │
│ brand ───────┼─────┼─ brand ──────┼─────┼─ brand       │
│ week  ───────┼─────┼─ week  ──────┼─────┼─ week        │
└──────────────┘     └──────────────┘     └──────────────┘

品牌维度: 摩登新贵女 / 轻熟质享客 / 云端商务家
时间维度: 周 (Week, YYYY-Www 格式，如 2026-W15)
```

### 4.2 时间维度说明（周 vs 月）

系统以 **周 (Week)** 为主统计周期，同时保留月度聚合能力：

```
周编号规则: ISO 8601 周编号
  格式: YYYY-Www (如 2026-W15)
  起始: 每周一为周起始日
  对应: 一周 = 7天，一年约 52 周

视频归属周: 按「素材创建时间」所在的 ISO 周归属
直播间归属周: 按「直播日期」所在的 ISO 周归属

月度聚合: 将 4-5 周的数据按月汇总
季度聚合: 将 12-13 周的数据按季度汇总
```

### 4.3 核心表结构

#### videos — 短视频数据表

> 对应 Excel「新-短视频-数据源」Sheet，核心字段映射

| 字段 | 类型 | 说明 | Excel 来源列 |
|------|------|------|-------------|
| id | INTEGER PK | 自增主键 | - |
| brand | TEXT | 品牌标识 | 按数据来源 Sheet 或手动指定 |
| video_name | TEXT | 素材名称 | 素材名称 |
| video_id | TEXT | 素材ID | 素材ID |
| upload_date | DATE | 素材创建时间 | 素材创建时间 |
| upload_time | DATETIME | 上传素材时间 | 上传素材时间 |
| source_raw | TEXT | 素材来源原始值 | 素材来源 |
| source | TEXT | 制作源头（从剪辑部门映射） | 剪辑部门 |
| video_format | TEXT | 视频形式（从类型映射） | 类型 |
| tag | TEXT | 标签 | 标签 |
| impressions | INTEGER | 整体展现次数 | 整体展现次数 |
| ctr | REAL | 整体点击率 | 整体点击率 |
| cvr | REAL | 整体转化率 | 整体转化率 |
| cost | REAL | 整体消耗 | 整体消耗 |
| roi | REAL | 整体支付ROI | 整体支付ROI |
| gmv | REAL | 整体成交金额 | 整体成交金额 |
| actual_payment | REAL | 用户实际支付金额 | 用户实际支付金额 |
| days_online | INTEGER | 上线天数 | 上线天数 |
| data_week | TEXT | 数据所属周 (YYYY-Www) | 按 素材创建时间 计算 |
| data_month | TEXT | 数据所属月份 (YYYY-MM) | 按 素材创建时间 计算 |
| upload_week | TEXT | 上传所属周 (YYYY-Www) | 按 上传素材时间 计算 |
| upload_month | TEXT | 上传所属月份 (YYYY-MM) | 按 上传素材时间 计算 |
| created_at | DATETIME | 记录创建时间 | - |
| updated_at | DATETIME | 记录更新时间 | - |

**索引**: (brand, data_week), (brand, upload_week), (source), (video_format)

#### livestream — 直播间数据表

> 对应 Excel「直播-数据源」Sheet（或品牌子 Sheet）

| 字段 | 类型 | 说明 | Excel 来源列 |
|------|------|------|-------------|
| id | INTEGER PK | 自增主键 | - |
| brand | TEXT | 品牌标识 | Sheet名提取 (摩登新贵女/轻熟质享客/云端商务家) |
| live_date | DATE | 直播日期 | 日期 |
| start_time | DATETIME | 直播开始时间 | 直播开始时间 |
| end_time | DATETIME | 直播结束时间 | 直播结束时间 |
| duration_min | INTEGER | 直播时长(分钟) | 直播时长(分钟) |
| live_gmv | REAL | 直播间成交金额 | 直播间成交金额 |
| live_payment | REAL | 直播间用户支付金额 | 直播间用户支付金额 |
| refund_amount | REAL | 直播间退款金额 | 直播间退款金额 |
| net_gmv | REAL | 净成交金额 | 净成交金额 |
| ad_cost | REAL | 直播间投放消耗 | 直播间投放消耗 |
| data_week | TEXT | 所属周 (YYYY-Www) | 日期 计算 |
| data_month | TEXT | 所属月份 (YYYY-MM) | 日期 计算 |
| created_at | DATETIME | 记录创建时间 | - |

**索引**: (brand, data_week), (brand, data_month)

#### targets — 周度目标表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| brand | TEXT | 品牌标识 |
| week | TEXT | 周编号 (YYYY-Www) |
| dimension | TEXT | 维度：overall / internal / external |
| target_video_count | INTEGER | 目标制作数量 |
| target_gmv_ratio_all | REAL | 目标GMV占比(占所有短视频GMV) |
| target_gmv_ratio_new | REAL | 目标GMV占比(当周新短视频GMV占比) |
| target_avg_gmv | REAL | 目标单条平均GMV |
| actual_video_count | INTEGER | 实际制作数量（手动填写） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

**索引**: (brand, week), (brand, week, dimension)

#### quarter_runners — 季度跑量视频表（计算结果）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| quarter | TEXT | 季度 (2026-Q1) |
| brand | TEXT | 品牌（摩登新贵女/轻熟质享客/云端商务家） |
| source | TEXT | 源头：internal(含ITO) / external |
| count_g50k | INTEGER | 单条GMV≥5万数量 |
| count_g10k | INTEGER | 单条GMV≥1万数量 |
| calculated_at | DATETIME | 计算时间 |

**索引**: (quarter, brand)

#### format_stats — 视频形式统计表（计算结果）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| brand | TEXT | 品牌标识 |
| week | TEXT | 周编号 (YYYY-Www) |
| video_format | TEXT | 视频形式 |
| total_gmv | REAL | 整体成交 GMV |
| total_impressions | INTEGER | 整体展现次数 |
| total_cost | REAL | 整体消耗 |
| avg_roi | REAL | 整体支付 ROI |
| avg_ctr | REAL | 整体点击率 |
| avg_cvr | REAL | 整体转化率 |
| calculated_at | DATETIME | 计算时间 |

**索引**: (brand, week), (brand, video_format)

---

## 五、核心业务逻辑

### 5.1 Excel 上传 → 数据入库

系统支持导入两种 Excel 数据源（格式与现有报表一致）：

```
用户上传 Excel
    │
    ├─ 短视频数据源（对应 "新-短视频-数据源" Sheet，102列）
    │   → 核心字段映射：
    │     素材名称 → video_name
    │     素材创建时间 → upload_date (用于计算上传周和上线天数)
    │     素材来源 → source_raw (本地上传/抖音号主页素材/AIGC动态创意)
    │     整体展现次数 → impressions
    │     整体点击率 → ctr
    │     整体转化率 → cvr
    │     整体消耗 → cost
    │     整体支付ROI → roi
    │     整体成交金额 → gmv
    │     用户实际支付金额 → actual_payment
    │     剪辑部门 → source (直接分类！)
    │     类型 → video_format (直接分类！)
    │     上传素材时间 → upload_time (辅助字段)
    │   → 品牌识别：按 Sheet 名或上传时手动选择品牌
    │   → 剪辑部门字段直接提供 source 分类
    │   → 类型字段直接提供 format 分类
    │   → 自动计算 ISO 周编号
    │   → 触发重新计算：有效视频数、跑量统计、形式统计
    │
    └─ 直播间数据源（对应 "直播-数据源" Sheet 或品牌子 Sheet）
        → 核心字段映射：
        │     直播开始时间 / 直播结束时间 → 计算直播日期
        │     直播间成交金额 → live_gmv
        │     直播间用户支付金额 → live_payment
        │     日期 → live_date
        → 品牌识别：Sheet名提取 (摩登新贵女/轻熟质享客/云端商务家)
        → 按周汇总直播间 GMV
        → 写入 livestream 表
```

### 5.2 历史数据导入

```
一次性导入流程:
1. 将现有「内容短视频-数据报表.xlsx」放入 uploads/ 目录
2. 运行 seed.js 脚本:
   node db/seed.js "D:\内容短视频-数据看板系统\uploads\内容短视频-数据报表.xlsx"
3. 脚本自动处理:
   - 解析「新-短视频-数据源」Sheet → videos 表 (1,585 条)
   - 解析品牌子 Sheet (直播间-数据源-摩登新贵女 等) → livestream 表 (415 条)
   - 为每条记录计算 ISO 周编号
   - 识别品牌归属
   - 生成统计快照 (format_stats)
4. 导入完成后输出统计报告
```

### 5.3 分类规则（基于实际数据源已确认 ✅）

**制作源头 (source)**：直接使用「新-短视频-数据源」中的 **"剪辑部门"** 字段

| 剪辑部门值 | 系统分类 | 说明 |
|-----------|---------|------|
| 内部 (358条) | 内部 | 内部制作团队 |
| ITO (39条) | ITO（统计时合并到"内部"） | ITO官方，命名方式不同 |
| 外部 (1068条) | 外部 | 外部合作 |
| AIGC (16条) | AIGC | AI生成内容 |
| 其他 (103条) | 其他 | 待分类 |

**视频形式 (format)**：使用「新-短视频-数据源」中的 **"类型"** 字段

| 类型值 | 数量 | 需求映射 |
|--------|------|---------|
| KOL | 507 | → KOL |
| 主播 | 281 | → 直播切片 |
| 自制 | 76 | → 原生 |
| 混剪 | 59 | → 原生 |
| 种草 | 17 | → 原生 |
| 原生 | 13 | → 原生 |
| 直播切片 | 7 | → 直播切片 |
| 复刻 | 4 | → 复刻 |
| 明星 | - | → 明星 |
| 其余 | - | → 原生（默认） |

> ✅ **已确认**：Excel 数据源已包含「剪辑部门」和「类型」字段，无需通过视频名称解析，可直接使用。

### 5.4 有效视频识别规则

```javascript
// 有效视频 = 满足以下两个条件
// 1. 单条 GMV >= 1000
// 2. 上传日期距今 >= 5 天
function isEffectiveVideo(video, referenceDate) {
  const daysSinceUpload = daysBetween(video.upload_date, referenceDate);
  return video.gmv >= 1000 && daysSinceUpload >= 5;
}
```

### 5.5 周度目标进度计算

```javascript
// 整体维度 (某品牌某周)
const weeklyProgress = {
  targetGmvRatio: target.target_gmv_ratio_all,        // 目标占比
  actualGmvRatio: weekVideoGmv / weekLivestreamGmv,    // 实际占比
  targetGmv: weekLivestreamGmv * target.target_gmv_ratio_all,
  actualGmv: weekVideoGmv,                              // 当周所有在跑短视频 GMV
  newVideoGmvRatio: weekNewVideoGmv / weekVideoGmv,    // 当周新视频贡献率
};

// 源头维度 (以"内部"为例，ITO 计入内部)
const internalProgress = {
  targetVideoCount: target.target_video_count,
  actualVideoCount: videoCount,      // source IN ('内部', 'ITO')
  targetGmvRatio: target.target_gmv_ratio_all,
  actualGmvRatio: internalGmv / allVideoGmv,
  effectiveCount: countEffective(videos, 'internal'),
  avgGmv: internalGmv / videoCount,
};

// 月度聚合: 月GMV = SUM(周GMV)，月目标 = 取目标表中最后一次设置的周目标值
// 季度聚合: 季GMV = SUM(12-13周GMV)
```

### 5.6 季度跑量统计

```javascript
// 上传后第5天统计：取每条视频上传后第5天的 GMV 快照
// 当前数据源「新-短视频-数据源」只有累计 GMV（整体成交金额），无每日快照
// Phase 1 方案：使用当前累计 GMV 作为近似值
// Phase 2 方案：对接 API 后获取每日快照，实现精确的"第5天GMV"统计

const quarterStats = {
  brand: "摩登新贵女",  // 或 "轻熟质享客" / "云端商务家"
  quarter: "2026-Q2",
  internal: {
    countG50k: videos.filter(v => v.source in ('内部','ITO') && v.gmv >= 50000).length,
    countG10k: videos.filter(v => v.source in ('内部','ITO') && v.gmv >= 10000).length,
  },
  external: { ... }
};
```

> ⚠️ **已知限制**：Phase 1 用累计 GMV 近似"第5天GMV"，存在偏差。Phase 2 对接 API 后优化。

---

## 六、前端页面设计

### 6.1 页面结构（单页应用）

```
┌───────────────────────────────────────────────────┐
│  顶部导航栏                                        │
│  [Logo] 短视频数据看板                               │
│  [品牌▼] [周选择▼ 2026-W15] [导出Excel]             │
├───────────────────────────────────────────────────┤
│  Tab 切换                                          │
│  [周度总览] [源头分析] [季度跑量] [形式监控]           │
├───────────────────────────────────────────────────┤
│                                                    │
│  内容区域（根据 Tab 切换）                            │
│                                                    │
│  ┌─ 周度总览 ─────────────────────────────┐        │
│  │  目标 vs 实际 卡片组                    │        │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐         │        │
│  │  │GMV │ │占比│ │新视│ │完成│         │        │
│  │  │目标│ │达成│ │频贡│ │率  │         │        │
│  │  └────┘ └────┘ └────┘ └────┘         │        │
│  │                                       │        │
│  │  周趋势折线图：近4周 GMV / 占比变化     │        │
│  │  📈 ─────── ─────── ─────── ───────   │        │
│  │     W12      W13      W14      W15    │        │
│  └───────────────────────────────────────┘        │
│                                                    │
│  ┌─ 源头分析 ─────────────────────────────┐        │
│  │  表格：内部 / 外部 / ITO / AIGC        │        │
│  │  列：目标制作数 | 实际制作数 | GMV      │        │
│  │     | 占比(总) | 占比(新) | 单条GMV    │        │
│  │     | 有效视频数                        │        │
│  └───────────────────────────────────────┘        │
│                                                    │
│  ┌─ 季度跑量 ─────────────────────────────┐        │
│  │  柱状图：按季度/品牌/源头              │        │
│  │  Y轴: 视频数量                         │        │
│  │  分组: ≥5万 / ≥1万                     │        │
│  └───────────────────────────────────────┘        │
│                                                    │
│  ┌─ 形式监控 ─────────────────────────────┐        │
│  │  雷达图/表格：5种视频形式               │        │
│  │  指标：GMV | 展现 | 消耗 | ROI        │        │
│  │       | 点击率 | 转化率                 │        │
│  └───────────────────────────────────────┘        │
│                                                    │
├───────────────────────────────────────────────────┤
│  底部工具栏                                        │
│  [上传数据] [下载模板] [目标设置] [导入历史数据]     │
└───────────────────────────────────────────────────┘
```

### 6.2 技术实现

- **ECharts**：折线图（周趋势）、柱状图（跑量统计）、雷达图（形式对比）
- **Tailwind CSS**：布局与样式，响应式适配手机/平板
- **原生 JS**：Tab 切换、上传交互、品牌/周选择器联动，无需框架构建步骤

---

## 七、API 设计

### 7.1 数据上传

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload/video` | 上传短视频 Excel 数据 |
| POST | `/api/upload/livestream` | 上传直播间数据 |
| POST | `/api/upload/seed` | 一键导入历史数据（完整 Excel） |
| GET | `/api/template/video` | 下载短视频数据上传模板 |
| GET | `/api/template/target` | 下载目标设置模板 |

### 7.2 看板查询

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dashboard/overview?brand=modeng&week=2026-W15` | 周度总览数据 |
| GET | `/api/dashboard/source?brand=modeng&week=2026-W15` | 源头维度分析 |
| GET | `/api/dashboard/runner?brand=modeng&quarter=2026-Q2` | 季度跑量统计 |
| GET | `/api/dashboard/format?brand=modeng&week=2026-W15` | 视频形式监控 |
| GET | `/api/dashboard/trend?brand=modeng&weeks=4` | 近 N 周趋势数据 |
| GET | `/api/dashboard/brands` | 获取品牌列表 |

### 7.3 目标管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/target?brand=modeng&week=2026-W15` | 获取周度目标 |
| PUT | `/api/target` | 更新/创建周度目标 |

### 7.4 导出

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/export/report?brand=modeng&week=2026-W15` | 导出周度报表 Excel |
| GET | `/api/export/runner?brand=modeng&quarter=2026-Q2` | 导出季度跑量 Excel |

---

## 八、部署方案

### 8.1 开发环境

```bash
# 1. 进入项目目录
cd D:\内容短视频-数据看板系统

# 2. 安装依赖
npm install

# 3. 初始化数据库
node db/init.js

# 4. 导入历史数据
node db/seed.js "D:\内容短视频-数据看板系统\uploads\内容短视频-数据报表.xlsx"

# 5. 启动开发服务
node server.js
# 访问 http://localhost:3000
```

### 8.2 生产部署（内网服务器/云服务器）

```bash
# 1. 安装 PM2
npm install -g pm2

# 2. 启动服务
pm2 start server.js --name "video-dashboard"

# 3. 设置开机自启
pm2 startup
pm2 save
```

### 8.3 后续演进路径

```
当前 (Phase 1)          Phase 2                 Phase 3
─────────────────────────────────────────────────────────
手动上传 Excel    →    对接巨量千川 API    →    自动化调度
SQLite            →    PostgreSQL          →    读写分离
单机部署          →    内网多用户          →    云部署+HTTPS
周维度看板        →    自定义维度配置      →    预警通知
累计GMV近似       →    每日GMV快照精确统计  →    跑量预测
```

---

## 九、所有事项已确认 ✅

| # | 事项 | 状态 | 说明 |
|---|------|------|------|
| 1 | 视频命名规范 | ✅ 已解决 | 数据源有「剪辑部门」和「类型」字段 |
| 2 | Excel 列名映射 | ✅ 已解决 | 已梳理 102 列 + 56 列完整映射 |
| 3 | "上传后第5天"数据源 | ✅ 已决策 | Phase 1 用累计 GMV 近似，Phase 2 API 补齐 |
| 4 | 品牌列表 | ✅ 已确认 | 摩登新贵女、轻熟质享客、云端商务家 |
| 5 | 历史数据导入 | ✅ 已确认 | 首次部署时一键导入全部历史数据 |
| 6 | 统计维度 | ✅ 已确认 | 以周 (Week) 为主维度 |

---

## 十、工作量估算

| 模块 | 工作量 | 说明 |
|------|--------|------|
| 项目搭建 + 数据库设计 | 0.5 天 | 目录结构、依赖安装、建表 |
| 历史数据导入脚本 | 0.5 天 | Excel 解析 + 1,585 条视频 + 415 条直播 |
| Excel 上传 + 解析入库 | 1 天 | 上传接口、品牌识别、周编号计算 |
| 目标管理模块 | 0.5 天 | 周维度 CRUD + 手动填写 |
| 周度总览看板 | 1 天 | 整体维度 + 源头维度 + 周趋势图 |
| 季度跑量看板 | 0.5 天 | 柱状图 + 多品牌维度 |
| 视频形式看板 | 0.5 天 | 雷达图/表格 |
| Excel 导出 | 0.5 天 | 模板生成 + 样式 |
| 联调测试 | 0.5 天 | 端到端测试 + 修复 |
| **合计** | **~5.5 天** |  |

---

*文档结束。所有事项已确认，可进入开发阶段。*
