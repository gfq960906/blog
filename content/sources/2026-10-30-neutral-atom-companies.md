# 全球原子体系量子计算公司图谱 v2（2026-10-30）

> **v2 范围修正**：v1 只收了「光镊中性原子」的初创公司，漏了两类东西——①**大厂宣布的原子路线**（如 Google）②**同属原子体系的另外两种比特载体**（光晶格、中性原子核自旋）。本版按「凡原子体系路线都收」重做。
> 调研日：2026-10-30｜通道：本机真实浏览器（Bing）+ 逐一回官网核实｜本版因 Bing 限流中止部分检索，未完成项见第九节。

## 收录与排除口径

**收录**（四种细分标签）：

| 标签 | 含义 |
|---|---|
| **A1** | 光镊中的中性原子，**里德堡门**做量子计算/模拟 |
| **A2** | **光晶格**中的中性原子 |
| **A3** | 中性原子体系里的**核自旋**比特 |
| **A4** | 大厂：宣布原子路线 / 合作开发 / 提供原子 QPU 云接入 |
| **B** | 中性原子或里德堡体系，但做**传感 / 时钟 / 射频**，不做计算整机 |

**排除**（明确无原子路线者，第八节列名单与理由）：纯超导、离子阱、光子、硅自旋、NV 色心。

**证据标记**：`[官网]` 官网原文｜`[名录]` 第三方名录｜`[媒体]` 新闻报道。A 类必须有 `[官网]` 支撑。

---

## 一、A4：科技巨头（3 家，全部官网证实）

| 巨头 | 项目形态 | 官网自述原文 `[官网]` | 出处 |
|---|---|---|---|
| **Google Quantum AI** | **超导 + 中性原子双线**。超导为主线（Willow 系），2026 年 3 月宣布新增中性原子路线 | 「Google Quantum AI is **expanding our quantum computing research to include neutral atom quantum computing**, which uses individual atoms as qubits, alongside superconducting.」「Neutral atoms, meanwhile, have **scaled to arrays with about ten thousand qubits**」 | [blog.google](https://blog.google/innovation-and-ai/technology/research/neutral-atom-quantum-computers/)，2026-03-24，Hartmut Neven 署名 |
| **Microsoft** | 与 **Atom Computing** 合作，用中性原子做**逻辑比特商用机** | 「creating and entangling **24 logical qubits made from neutral atoms**—they have also demonstrated the ability to detect and correct errors, and perform computation, on 28 logical qubits」「available to order today」 | [Azure Quantum Blog](https://azure.microsoft.com/en-us/blog/quantum/2024/11/19/microsoft-and-atom-computing-offer-a-commercial-quantum-machine-with-the-largest-number-of-entangled-logical-qubits-on-record/)，2024-11-19 |
| **Amazon（AWS）** | 不自研原子硬件，但 **Braket 提供里德堡原子 QPU 云接入**（QuEra） | 「基于里德堡原子的量子计算机利用排列在一维、二维或三维阵列中的中性原子之间的**远程范德华相互作用**……Amazon Braket 提供对来自 QuEra Computing 的基于里德堡原子的量子计算机的访问」 | [aws.amazon.com/braket](https://aws.amazon.com/braket/) |

> 三家的性质不同：Google 是**自研路线扩张**，Microsoft 是**合作造机 + 自有纠错栈**，Amazon 是**渠道/云接入**。做竞争分析时不该混为一谈。

---

## 二、A1：光镊 + 里德堡门（15 家）

### 中国（6 家，官网已证实）

| 公司 | 城市 | 官网 | 官网自述关键句 `[官网]` | 补充 `[名录]/[媒体]` |
|---|---|---|---|---|
| **中科酷原** | 武汉 | [cascoldatom.com](https://cascoldatom.com/) | 「量子计算『汉原1号』斩获国内首个商业订单与首个出海订单」；含量子精密测量、量子测控、量子计算云平台 | 中科院系，2017 起 |
| **两仪万象** Atom to Infinity | 北京 | [qosmos.cn](https://qosmos.cn/) | 「原子量子计算领航者」；自研原子量子计算机整机、量子测控系统、量子软件与云平台 | 清华团队，2024 注册；1999 起冷原子研究，2019 建实验室；4 个专利族 |
| **原子矩阵** MatriQ | 杭州 | [matriqcomputing.com](https://www.matriqcomputing.com/) | 「专注于中性原子量子计算全栈解决方案」「以原子为矩阵」；整机 + 模块 + 云平台 + 软件栈 | 2025-06 成立；2,310 无缺陷原子阵列；首年 4 轮融资近 10 亿元 |
| **不筹量子** Buchou | 上海 | [buchouatom.com](https://www.buchouatom.com/) | 「用中性原子 定义可交付的量子算力」；物理层全栈自研；纠错层基于 **Rb-Cs 混合路线**；目标万比特工程机 | 复旦**李晓鹏**（Li Xiaopeng）课题组孵化，2025 成立；2025-12 天使轮数千万（中科创星领投） |
| **原子芯光** | 上海 | [atomqubic.com](https://atomqubic.com/) | 「中性原子QPU+光量子QLink，迈向百万量子比特」；**Kimble-1**：1,000+ 比特，双比特门保真度 >99.5%；Kimble-2 目标 10,000+（2027） | 团队自述来自 Caltech、NYU |
| **中器无量** | 上海 | [zqwl-quantum.com](https://zqwl-quantum.com/) | 「清河一号：算力中心级 中性原子量子计算机」；首创标准机柜工程化设计，国产化率 >90%，万比特量级 | 2025 成立，归国学者创立，依托中科院；据称上海光机所 spin-off |

### 美国（3 家）

| 公司 | 城市 | 官网 | 官网自述关键句 `[官网]` | 备注 `[名录]` |
|---|---|---|---|---|
| **QuEra Computing** | Boston | [quera.com](https://www.quera.com/) | 中性原子路线，整机 + 云接入；Aquila / Libra / Gemini-Class | 2028 容错承诺；Aquila 已上 AWS Braket |
| **Oratomic** | Pasadena | [oratomic.com](https://www.oratomic.com/) | 「Building the world's first fault-tolerant quantum computers…**using only light and atoms**」 | 2026 成立，Caltech/Harvard 系；累计 **$775M**；14 人；目标一万比特 |
| **Logiqal** | — | [logiqal.com](https://www.logiqal.com/) | 「building the first scaled quantum computer…**modular architecture**, based on a novel qubit and control technology developed at leading academic labs」 | 团队含 **Jeff Thompson**（Princeton）；亚稳态 Yb-171、擦除错误、模块互联 |

### 欧洲 / 中东 / 日本（6 家）

| 公司 | 国别 | 官网 | 官网自述关键句 `[官网]` | 备注 `[名录]` |
|---|---|---|---|---|
| **Pasqal** | 法国 Palaiseau | [pasqal.com](https://www.pasqal.com/) | 「run calculations on a QPU powered by neutral atoms」；Pulser / Pulser Studio / QoolQit | 已 Nasdaq 上市（2026-09）；含 €3.9M QPU 服务收入 |
| **Q-Factor** | 以色列 Tel Aviv | [q-factor.com](https://q-factor.com/) | 「**Neutral Atom** Quantum Computing」「The Race to 1M Qubits」 | 2026 成立，Weizmann/Technion 系；种子轮 $24M+ |
| **AtomQL** | 斯洛文尼亚 Ljubljana | [atomql.com](https://atomql.com/) | 「designing cold neutral atoms QCs with a completely new and **patented approach to preparing qubit arrays**」 | EU InvestEU 支持；目标数千→数万比特 |
| **Eniquantic** | 意大利 Roma | [eni.com/eniquantic](https://www.eni.com/eniquantic/index.html) | 「the **first Italian quantum computing company** by Eni」「full-stack…based on **optically trapped neutral atoms**」 | **Eni × ITQuanta** 合资；镱原子，数字+模拟双模 |
| **Yaqumo** | 日本 东京 | [yaqumo.com](https://yaqumo.com/en/) | 「develop quantum computers that are truly practical and usable」；重点是**提高时钟速率** | 京都大学高桥研究室 + 分子科学研究所大森研究室 |
| **Pasqal Arabia** | 沙特 Riyadh | [pasqal.com 新闻稿](https://www.pasqal.com/newsroom/pasqal-and-eleven-ventures-establish-commercial-joint-venture-to-scale-quantum-and-ai-computing-across-saudi-arabia-and-the-broader-mena-region/) | Pasqal 与 Eleven Ventures 的**商业合资公司** | 2026-08-24 宣布，配合沙特国事访问 |

---

## 三、A2：光晶格（1 家）

| 公司 | 国别 | 官网 | 官网自述原文 `[官网]` | 说明 |
|---|---|---|---|---|
| **planqc** | 德国 Munich | [planqc.eu](https://planqc.eu/) | 「Highly excited **Rydberg** states allow fast and reliable two-qubit gates」「Trapped in **optical lattices**」 | 马克斯·普朗克量子光学所系；MAQCS 已交付 LRZ 超算中心 |

> **光晶格路线的商业化极稀薄**：商业主体目前只有 planqc 与中国的**纳开量子**两家。其余都在实验室——如清华大学「光晶格-光镊混合镱原子平台」（[清华交叉信息院讲座](https://iiis.tsinghua.edu.cn/info/1044/4949.htm)）、中科大/上海光机所的光晶格量子模拟。

### 补充：超冷原子 / 光晶格方向的中国公司

| 公司 | 城市 | 官网 | 官网自述原文 `[官网]` | 说明 |
|---|---|---|---|---|
| **纳开量子**（纳开启元（北京）量子科技有限公司） | 北京 海淀 | [nkquantum.com](https://www.nkquantum.com/) | 「专注攻坚**中性原子量子系统底层架构**」「以**超冷原子**精准操控 打造行业领先的量子计算机」；产品线含冷原子/超冷原子实验系统、量子传感系统、关键子系统、高精度模块化控制电路 | 官网动态大量引用**北京大学周小计、姚和朋团队**的超冷原子量子模拟器成果（维度交叉普适相图，2026-05）；中学/科研院所客户为主 |

---

## 四、A3：中性原子核自旋（1 家）

| 公司 | 国别 | 官网 | 官网自述原文 `[官网]` | 说明 |
|---|---|---|---|---|
| **Atom Computing** | 美国 Berkeley | [atom-computing.com](https://atom-computing.com/) | 「optically-trapped neutral atoms to create arrays of **nuclear-spin** qubits」；AC1000，1,200+ 物理比特，all-to-all 连通，mid-circuit 测量 | **不是里德堡门路线**，但确属原子体系；微软商用机即建在其硬件上；入 DARPA QBI 最终阶段 |

---

## 五、A 类候选：官网未获取（2 家，不计入正式 A 类）

| 公司 | 城市 | 成立 | 依据 | 缺口 |
|---|---|---|---|---|
| **太一量生** Taiyi Quantum | 上海 | 2026-01-16 | `[名录]` 镱原子中性原子路线，$56M+；`[媒体]` 2026-07 报道 Pre-A 3 亿元；工商显示 3 次融资累计约 10.3 亿元 | **官网拿不到**：工商页给的 taiyi-tech.com 实为中医脉诊仪公司（错误信息）；Bing 8 条结果无自有域名 |
| **向量奇点** Xiangliang Qidian | 北京 | 2026-06 | `[媒体]` 北京量子院孵化；天使轮超亿元（IDG 领投）；Rb + Yb 双平台；创始人李相良（清华 → ETH，师从 Tilman Esslinger） | **官网未找到**：两次检索仅返回投中网/腾讯新闻 |
| **FlipFlop拓原** | 北京 | 2026-07-02 | `[媒体]` 专注中性原子量子计算；清华系；创始人**乔木**（29 岁，*Nature* 一作）；天使轮数亿元，中金资本、永兴材料参投 | **官网未找到**：检索仅返回量子位/知乎/腾讯转载 |
| **乾原量子**（合肥乾原量子科技有限公司） | 合肥 | 2026-09 | `[媒体]`「首创**中性原子 QPU + QAVEXUS 互联**技术路线」；超亿元天使轮，**12 家机构**联合投资，安徽省/合肥市/高新区三级国资平台参与 | **官网未找到**：仅见合肥高新区通稿与企查查 |

---

## 六、B 类：中性原子 / 里德堡，但做传感·时钟·射频（5 家）

| 公司 | 国别 | 说明 | 证据 |
|---|---|---|---|
| **Rydberg Technologies** | 美国 Ann Arbor | 官网自述：「Our founding technology platform uses the quantum properties of **Rydberg atoms** … to receive electromagnetic signals over a frequency range from **DC to THz**」；自称做出「**world's first atomic RF sensor**」 | `[官网]` [rydbergtechnologies.com](https://www.rydbergtechnologies.com/) |
| **Aquark Technologies** | 英国 Southampton | 英国国家量子技术计划 spinout；便携量子传感器（导航、授时、重力）；2024-09 €5M 种子轮（NATO 创新基金领投） | `[名录]` |
| **AOSense** | 美国 Fremont | 2004 年斯坦福 spinout；冷原子干涉仪、加速度计、陀螺仪、原子钟 | `[名录]` |
| **Infleqtion 传感线** | 美国 | Tiqker 光钟、Quantum Spectrum **里德堡 RF 接收** | `[官网]` |
| **天之衡量子**（原清远市天之衡量子科技，现天之衡量子科技（广州）有限公司） | 中国 广州/清远 | 「专注于**原子无线电**、原子**太赫兹**频谱分析与成像、精密光电测控与集成」，官网「里德堡」出现 10 次；产品含**中国首台套量子微波测量系统**（2022-02 发布）、**原子太赫兹相机**、超稳光学谐振腔、OFT | `[官网]` [tzhtec.com.cn](http://www.tzhtec.com.cn/) |

> **华南师范大学的例子值得单说**：按你指的方向查下来，华师确实孵化了一家**中性原子（里德堡）**公司——**天之衡量子**，孵化于「华南师范大学（清远）科技创新研究院」，该院孵化团队名单里明确写着「**基于热原子的微波传感技术产业化团队**」。技术源头是华师**冷原子团队**（2024-12 在 *Science Advances* 发里德堡原子微波电场计、逼近标准量子极限）。**但路线是里德堡传感，不是量子计算整机**，所以归 B 类。
> 另注：华师系还有一家更大的 **国腾量子**（见 C 类），但那是**光量子计算**路线，不要混。

> **仍有未收录的传感类**：Vector Atomic、Exail/Muquans、Atomionics、Nomad Atomics（此前清单已列，属传感非计算，本版未逐一回官网核实）。**这一整类都是"里德堡/中性原子相关但不做计算"，不并入 A 类。**

---

## 七、C 类：非本路线 / 外围 / 非公司实体

| 实体 | 国别 | 名录分类 | 实际身份 |
|---|---|---|---|
| **SDT** | 韩国 Seoul | 超导 | 2017 成立；超导路线，牵头韩国首台全栈量子计算机 |
| **Fujitsu** | 日本 川崎 | 超导 256 比特 | 与 RIKEN 共营 256 比特超导；另有 Digital Annealer |
| **Oxide Corporation** | 日本 北斗 | Neutral Atom | **不是量子计算公司**：晶体 + 激光器；302nm 紫外激光用于把镱原子激发到里德堡态 |
| **Groovenauts** | 日本 福冈 | Quantum Cloud | 云与 AI 公司，与分子科学研究所做冷原子量子计算云平台 |
| **qSIM Chiang Mai** | 泰国 清迈 | Quantum Simulation | 清迈大学**实验室** |
| **M-Squared Lasers** | 英国 | — | 激光器厂商（上游） |
| **CINECA** | 意大利 | — | 国家超算中心 |
| **Korea Quantum Flagship** | 韩国 | — | 国家项目 |
| **国腾量子**（广东国腾量子科技有限公司） | 中国 广州 | 光子 | 华南师大系（技术起源于该校量子电子学研究所，刘颂豪院士领衔，2017-08 成立）。官网自述「专注**光量子计算**与量子通信两大主战略」「定位于**光量子计算整机**」；2026-08 在穗发布「光纵横（QPS）」光量子计算机。[nqctek.com](https://www.nqctek.com/) — **不是中性原子路线** |

**名录还混入纯学术机构**：Caltech、Harvard、NIST、分子科学研究所（IMS）、KACST。

> ⚠️ **名录自称「34 companies」，其中至少 8 项不是公司**。该数字不可直接引用。

---

## 八、明确排除（做过核对，结论：无原子体系路线）

| 公司 | 主线 | 为什么排除 |
|---|---|---|
| **IBM** | 超导（Heron/Condor 系） | 公开路线全为超导，无中性原子/光晶格/核自旋计划 |
| **Intel** | 硅自旋 | 固态自旋，非原子体系 |
| **IonQ / Quantinuum(Honeywell) / AQT** | 离子阱 | 带电离子，非**中性**原子 |
| **PsiQuantum / Xanadu / PsiQuantum 类** | 光子 | 非原子体系 |
| **Rigetti / IQM / 本源量子(Origin) / 国盾** | 超导 | 同上 |
| **NEC / NTT / Toshiba / Hitachi** | 超导 / 光子 / 离子 | 未见原子路线布局 |

> 这一节是为了让你知道我**核过并排除**了，不是漏掉。若某家有「宣布原子路线」的新闻我未捕捉到，请告诉我，我单独补。

---

## 九、本轮补扫结果（限额已放宽至 100/域名/小时）

**已补完**：
1. **Rydberg Technologies** —— 官网已证实，归 B 类（Rydberg RF 接收，DC–THz）。
2. **中文侧三家新公司全部挖到**，且都确认是中性原子路线：
   - **纳开量子**（纳开启元（北京）量子科技有限公司）——官网证实，超冷原子方向（A2 类）
   - **FlipFlop拓原** —— 2026-07 成立，清华系，创始人乔木（*Nature* 一作），天使轮数亿元（A 类候选，官网未获取）
   - **乾原量子**（合肥）—— 2026-09 成立，「中性原子 QPU + QAVEXUS 互联」，超亿元天使轮，12 家机构含安徽省市区三级国资（A 类候选，官网未获取）
3. **光晶格商业主体**放宽到 A2 类后新增纳开量子，商业玩家从 1 家变 2 家。

**仍未完成**：
1. **Amazon 是否自研原子硬件**——目前只证实 Braket 的云接入形态。
2. **中国大厂**（华为 / 百度 / 阿里 / 腾讯）是否有原子路线投入——华为一句检索未见原子路线（结果均为原子矩阵/乾原/太一等他家新闻），但**未逐家核官网声明，不作结论**。
3. **`34 家` 名录的完整枚举**——34 项已全部提取，因分页渲染仍需确认无遗漏页。

> 经验记录：Bing 对这台机器的 IP 会持续降结果量（一度返回 0 条），此时换百度能恢复中文覆盖；限额本身已不是瓶颈。

---

## 十、与 v1 的差异

| 项目 | v1 | v2 |
|---|---|---|
| 科技巨头 | **完全缺失** | Google、Microsoft、Amazon（均官网证实） |
| 比特载体 | 只有光镊，光晶格/核自旋当边缘标注 | 拆成 A1 光镊 / A2 光晶格 / A3 核自旋 三个正式类别 |
| 中国公司 | 8 家 | **11 家**（+ 纳开量子、FlipFlop拓原、乾原量子） |
| 明确排除清单 | 无 | 有（IBM/Intel/IonQ 等，附理由） |
| 未完成项 | 笼统写「有界枚举」 | 逐条列出 + 原因，补扫后再更新 |

**核心补正**：Google 的中性原子路线是 v1 最严重的遗漏——它是**超导巨头正式宣布双线**，这类「大厂转向/扩张」信号比初创名单更有情报价值。

---

*调研与核验：2026-10-30｜通道：本机 Chrome (CDP 9333) + Bing*
