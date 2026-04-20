# Content-short-video / 短视频数据看板系统

> 短视频投放运营数据监控看板，覆盖 3 个品牌，支持周度总览、源头分析、季度跑量、形式监控与 Excel 导出。

**🔗 在线 Demo**: [https://mightymojoy.github.io/Content-short-video/demo.html](https://mightymojoy.github.io/Content-short-video/demo.html)

---

## 功能模块

| 模块 | 功能 | 数据来源 |
|------|------|----------|
| 📊 周度总览 | 短视频 GMV 占比、目标达成率、新视频贡献率 | 手动定目标 + Excel 数据源 |
| 🔍 源头分析 | 内部/外部/ITO/AIGC 制作量、GMV、占比 | Excel「剪辑部门」字段自动分类 |
| 🏆 季度跑量 | 单条 GMV ≥5万 / ≥1万 的视频数量统计 | 自动计算 |
| 📈 形式监控 | 原生/KOL/直播切片/复刻/明星 ROI 等指标 | Excel「类型」字段自动分类 |
| 📥 Excel 导出 | 周度报表 + 季度跑量报表一键导出 | ExcelJS 生成带样式报表 |
| 🎯 目标设置 | 周维度目标管理（整体/内部/外部） | 手动输入 |

## 技术栈

| 层级 | 技术 |
|------|------|
| 运行时 | Node.js 20+ |
| 后端 | Express.js |
| 数据库 | SQLite (sql.js WebAssembly) |
| 前端 | 原生 HTML + Tailwind CSS + ECharts |
| Excel 解析 | SheetJS (xlsx) |
| Excel 导出 | ExcelJS |
| 文件上传 | multer |

## 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/Mightymojoy/Content-short-video.git
cd Content-short-video

# 2. 安装依赖
npm install

# 3. 初始化数据库
npm run init

# 4. 导入历史数据（如有 Excel 文件）
npm run seed

# 5. 启动服务
npm start
# 访问 http://localhost:3001
```

## 项目结构

```
├── server.js                    # 入口文件
├── config.js                    # 配置（端口、品牌、映射规则）
├── public/
│   ├── index.html               # 看板主页（需后端）
│   └── demo.html                # 静态 Demo 页面（GitHub Pages）
├── src/
│   ├── routes/                  # API 路由
│   ├── services/                # 业务逻辑
│   ├── repository/              # 数据访问层
│   ├── middleware/               # 中间件
│   └── utils/                   # 工具函数
├── db/
│   ├── init.js                  # 建表脚本
│   └── seed.js                  # 数据导入脚本
└── docs/
    └── architecture.md          # 架构设计文档
```

## 覆盖品牌

| 品牌 | 标识 |
|------|------|
| 摩登新贵女 | modeng |
| 轻熟质享客 | qingshu |
| 云端商务家 | yunduan |

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dashboard/overview` | 周度总览 |
| GET | `/api/dashboard/source` | 源头分析 |
| GET | `/api/dashboard/runner` | 季度跑量 |
| GET | `/api/dashboard/format` | 形式监控 |
| GET | `/api/dashboard/trend` | 周趋势 |
| POST | `/api/upload/video` | 上传短视频 Excel |
| POST | `/api/upload/livestream` | 上传直播间数据 |
| GET | `/api/export/report` | 导出周度报表 |
| GET | `/api/export/runner` | 导出跑量报表 |

## License

MIT
