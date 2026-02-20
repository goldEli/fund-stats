# 基金统计分析网站 - 技术规格说明书

## 1. 项目概述

- **项目名称**: 基金统计分析网站
- **项目类型**: 前后端分离的Web应用
- **核心功能**: 基金数据管理、第三方数据获取、多维度统计分析、可视化展示
- **目标用户**: 基金投资者、理财顾问

## 2. 技术架构

### 2.1 技术栈

| 层级 | 技术选型 |
|------|----------|
| 前端 | React 18 + TypeScript + Vite |
| 后端 | Node.js + Express + TypeScript |
| 数据存储 | JSON文件本地存储 |
| HTTP客户端 | Axios |
| 可视化 | ECharts |
| 样式 | CSS Modules |

### 2.2 项目目录结构

```
fund-stats/
├── client/                 # 前端项目
│   ├── src/
│   │   ├── components/    # 公共组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API服务
│   │   ├── types/         # TypeScript类型
│   │   ├── utils/         # 工具函数
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── server/                 # 后端项目
│   ├── src/
│   │   ├── controllers/  # 控制器
│   │   ├── routes/       # 路由
│   │   ├── services/     # 业务逻辑
│   │   ├── types/        # 类型定义
│   │   ├── utils/        # 工具函数
│   │   └── index.ts      # 入口文件
│   ├── data/              # JSON数据存储
│   │   └── funds.json
│   └── package.json
└── README.md
```

## 3. 数据结构设计

### 3.1 基金数据模型

```typescript
interface Fund {
  code: string;           // 基金代码 (主键)
  name: string;           // 基金名称
  type: string;           // 基金类型 (股票型/债券型/混合型/指数型/货币型)
  netValue: number;       // 最新净值
  accumulatedNetValue: number; // 累计净值
  establishDate: string;  // 成立日期 (YYYY-MM-DD)
  manager: string;        // 基金经理
  scale: number;          // 基金规模 (亿元)
  lastUpdate: string;     // 最后更新时间 (ISO时间戳)
  
  // 业绩数据
  dailyGrowth: number;    // 日增长率 (%)
  weeklyGrowth: number;   // 周增长率 (%)
  monthlyGrowth: number;  // 月增长率 (%)
  yearlyGrowth: number;   // 年增长率 (%)
  
  // 统计与分析
  rank: number;           // 同类排名
  totalInType: number;    // 同类基金总数
  rating: 'excellent' | 'average' | 'weak';  // 评级
}
```

### 3.2 数据存储文件

- `server/data/funds.json` - 基金数据存储文件
- 结构: `{ funds: Fund[], lastSync: string }`

## 4. API接口设计

### 4.1 基金列表管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/funds | 获取所有基金列表 |
| GET | /api/funds/:code | 获取单个基金详情 |
| POST | /api/funds | 添加新基金 |
| PUT | /api/funds/:code | 更新基金信息 |
| DELETE | /api/funds/:code | 删除基金 |
| POST | /api/funds/sync/:code | 同步基金数据 |

### 4.2 统计分析

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/stats/ranking | 获取基金排名列表 |
| GET | /api/stats/rating | 获取基金评级统计 |
| GET | /api/stats/type-distribution | 获取基金类型分布 |

## 5. 功能模块详细设计

### 5.1 基金列表管理模块

**功能列表:**
- 基金列表展示（分页、排序）
- 按代码/名称搜索
- 添加基金（输入代码自动获取数据）
- 编辑基金信息
- 删除基金
- 批量操作

**数据验证规则:**
- 基金代码: 6位数字
- 基金名称: 2-50个字符
- 基金类型: 枚举值

### 5.2 数据获取模块

**第三方接口:**
- 使用东方财富网天天基金接口 (无需API Key)
- 接口: `http://fund.eastmoney.com/pingzhongdata/{code}.js`

**定时任务:**
- 每小时自动更新所有基金数据
- 支持手动触发更新

**重试策略:**
- 失败后重试3次，间隔5秒
- 记录错误日志

### 5.3 统计分析模块

**排名功能:**
- 按基金类型分类排名
- 支持日/周/月/年多时间周期
- 显示排名/总数（如：15/200）

**评级功能:**
- 优秀: 前20%
- 一般: 前20%-50%
- 弱: 后50%

**可视化图表:**
- 基金类型分布饼图
- 业绩对比柱状图
- 评级分布饼图
- 增长率趋势图

## 6. 前端页面设计

### 6.1 页面结构

1. **首页/仪表盘** - 统计概览、图表展示
2. **基金列表** - 基金列表管理
3. **基金详情** - 单个基金详细信息
4. **数据分析** - 统计分析图表

### 6.2 UI设计

**配色方案:**
- 主色: #2563EB (蓝色)
- 背景: #F8FAFC
- 卡片: #FFFFFF
- 文字: #1E293B
- 优秀: #10B981 (绿色)
- 一般: #F59E0B (橙色)
- 弱: #EF4444 (红色)

**响应式断点:**
- 移动端: < 640px
- 平板: 640px - 1024px
- 桌面: > 1024px

## 7. 错误处理与日志

### 7.1 错误处理

- 前端: 统一错误提示组件
- 后端: 统一错误响应格式 `{ success: false, error: string }`

### 7.2 日志记录

- 请求日志: 请求方法、路径、参数
- 错误日志: 错误信息、堆栈
- 数据同步日志: 同步时间、结果

## 8. 验收标准

### 8.1 功能验收

- [ ] 可以添加基金（输入代码自动获取数据）
- [ ] 可以查看基金列表
- [ ] 可以搜索基金
- [ ] 可以编辑基金信息
- [ ] 可以删除基金
- [ ] 可以手动触发数据同步
- [ ] 显示基金排名
- [
- [ ] ] 显示基金评级 显示可视化图表

### 8.2 性能验收

- 页面加载时间 ≤ 3秒
- API响应时间 ≤ 1秒

### 8.3 质量验收

- 无明显Bug
- 响应式布局正常
- 错误提示友好
