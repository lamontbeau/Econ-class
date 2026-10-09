# 《计量经济学与AI运用》课程站

人工智能赋能教学改革创新大赛·智能体网站

## 目录结构

```
site/                     原始版（含教师姓名与学校信息）
├── index.html            课程概况
├── agent.html            教学智能体：四节点、知识库、提示词、教师端回路
├── demo.html             交互式课例：基准期探索器 + 课前诊断自测
├── resources.html        数字资源与AI工具清单（对应附件5）
├── assets/style.css      样式（深蓝+琥珀配色，与说课课件一致）
├── assets/app.js         交互逻辑（纯前端，不回传数据）
├── fig/                  事件研究图（由 code/build_charts.py 生成）
└── code/build_charts.py  作图脚本，供复现

site_anon/                匿名版（由 make_anon.py 自动生成，勿手改）
```

## 部署到 GitHub Pages

三条命令，约五分钟。需要先注册 GitHub 账号。

```bash
# 1. 在 GitHub 网页端新建仓库，命名 Econ-class，设为 Public

# 2. 本地推送
cd site
git init
git add .
git commit -m "课程站初版"
git branch -M main
git remote add origin https://github.com/lamontbeau/Econ-class.git
git push -u origin main
```

3. 打开仓库页面 → Settings → Pages → Source 选 `Deploy from a branch`
   → Branch 选 `main` / `(root)` → Save。等约一分钟。

站点地址：`https://lamontbeau.github.io/Econ-class/`

**匿名版单独建一个仓库**（`Econ-class-anon`），把 `site_anon/`
的内容按同样步骤推送到
`https://github.com/lamontbeau/Econ-class-anon.git`，
得到第二个网址 `https://lamontbeau.github.io/Econ-class-anon/`。
提交材料时两个网址都填。

### 不想用 GitHub 的替代方案

- **校内服务器**：把 `site/` 整个目录拷到任意支持静态托管的路径即可，无需配置。
- **本地演示**：直接双击 `index.html` 在浏览器打开，全部功能可用（含交互图）。
  评审现场无网络时用这个方式。
- **Gitee Pages**：国内访问更快，步骤与 GitHub 基本一致，需实名认证。

## 为什么不用 R Shiny 或 Python 后端

Shiny 和 Flask 都需要一个持续运行的服务器进程。GitHub Pages 只分发静态文件，
不执行后端代码。若走 shinyapps.io 免费版，休眠后首次访问需等待唤醒，
且免费额度有限——评审期间打不开的风险不可接受。

因此交互部分改用浏览器端 JavaScript 实现：基准期探索器的重新中心化、
标准误近似、斜率拟合与显著性判断全部在访问者本地完成。
代价是不能跑真实回归，收益是零成本、零维护、断网可用、打开即响应。
本课例需要演示的是**基准期如何改变结论**这一逻辑，
用解析式近似完全够用，且脚本公开可核验。

## 生成匿名版

```bash
python3 make_anon.py
```

脚本从 `site/` 复制一份到 `site_anon/`，替换教师姓名、学校与学院名称，
并做残留检查。**改动内容后需重新运行**，否则两版会不一致。

## 交互演示的参数说明

三组案例系数取自课堂发放材料，标准误按 `σ√|k−k₀|` 近似重算。
`σ` 经过校准，使 k₀=−4 时三组的显著性形态与课堂静态图完全一致：

| 案例 | σ | k₀=−4 时的形态 | 真值 |
|---|---|---|---|
| A 组 | 0.037 | 事前全不显著，斜率 0.008 | 真实满足平行趋势 |
| B 组 | 0.040 | 仅 t=−1 显著，斜率 0.079 | 预期效应型伪平行 |
| C 组 | 0.068 | 事前全不显著，斜率 0.074 | 差异趋势型伪平行 |

C 组是本课例的核心靶子：**在全部四个基准期下，事前系数没有一个显著**，
按"不显著即通过"的判法永远过关；但事前斜率恒为 0.074，与事后斜率相同，
基准期移到 −1 后事后效应从 0.30 塌到 0.08。能识破它的只有斜率，不是显著性。

## 待补齐

上线后需在 `resources.html` 中填入：智能体分享链接与二维码、
平台配置页与知识库挂载页截图、本站与代码仓库的实际网址。
另需与教务留存记录复核站内引用的各项教学成效数据。
