---
title: 里德堡量子计算单比特门：逐篇实现细节
date: 2026-10-23
category: research
section: experiment
tags: [里德堡, 单比特门, 量子计算]
summary: 从 2015 年 Cs 阵列微波门到 2023 年 99.97% 拉曼门，10 篇代表性工作逐篇拆解平台、编码、光路与误差机理。
---
> 📄 这是**文字版**，方便检索与订阅。带图表和完整排版的报告见专题页：[《单比特门》](../labs/2026-10-23-rydberg-single-qubit-gates.html)。

## 0 · 怎么读这份文档

先记住一个容易混淆的点：**里德堡量子计算机里的“单比特门”，绝大多数不是在里德堡态上做的**，而是在编码 qubit 的两个长寿命基态上做；里德堡态只负责两比特相互作用。所以每篇的“单比特门实现”讲的都是三件事：

1. **编码**：哪两个态构成 qubit（超精细、核自旋，还是基态–里德堡态）。
2. **驱动**：用什么场让这两个态做 Rabi 旋转（微波/RF、拉曼，还是直接 Rydberg 脉冲）。
3. **寻址**：怎么只动目标原子而不碰邻居（全局驱动 + 光移选点、聚焦拉曼束、交叉光束相位）。

文中数字默认是**论文实测值**；凡是我按公式换算的，会写“（换算）”；凡是作者自己的预测，会写“（作者估计）”。

## 1 · Saffman 组 2015：49 点 Cs 阵列上的微波门

T. Xia, M. Lichtman, K. Maller, A. W. Carr, M. J. Piotrowicz, L. Isenhower, M. Saffman（University of Wisconsin–Madison）· PRL 114, 100503 (2015) · [arXiv:1501.02041](https://arxiv.org/abs/1501.02041) · DOI 10.1103/PhysRevLett.114.100503

Cs-133 · 2D 49 点 · 微波 9.19 GHz · Stark 束选点 · RB 0.9983

### 平台

- 780 nm 红失谐光阱，7×7 = 49 点，点间距 3.8 μm，阱深约 400 μK。
- 原子从 2D 冷却区推到玻璃腔，3D MOT 装载；偏振梯度冷却到 5–10 μK；再用约 5 ms 的 852 nm 近共振光触发光助碰撞，保证每点最多一个原子。平均装载 60%，一次实验平均约 29 个点有原子。
- 成像：MOT 荧光，20 ms 积分；用独立成分分析滤波，单点像素 0.62 μm。

### 编码、态制备与读出

- 编码在 Cs 钟态：$\lvert 0\rangle = \lvert 6\mathrm{S}_{1/2},\,F=3,\,m_F=0\rangle$，$\lvert 1\rangle = \lvert 6\mathrm{S}_{1/2},\,F=4,\,m_F=0\rangle$；劈裂 9.19 GHz。
- 态制备：894 nm π 偏振光把原子泵到 $F=4$（$6\mathrm{S}_{1/2}\,F=4 \to 6\mathrm{P}_{1/2}\,F=4$），852 nm π 偏振重泵把 $F=3$ 也推过去；量子化轴由 0.15 mT 偏置场定义，垂直于阵列平面。
- 态敏读出：先用 852 nm 把 $F=4$ 原子推走（$F=4 \to 6\mathrm{P}_{3/2}\,F'=5$），再对剩下 $F=3$ 原子做荧光成像。测 $\lvert 0\rangle$ 概率直接看“还剩几个原子”；测 $\lvert 1\rangle$ 概率则先加一个 π 微波脉冲再推。

### 单比特门怎么实现的

1. **全局旋转**：真空腔外的微波喇叭，9.19 GHz，共振驱动 $\lvert 0\rangle \leftrightarrow \lvert 1\rangle$。实测 Rabi 频率 $\Omega = 2\pi \times 4.74\,\mathrm{kHz}$。Rx 用固定幅度、变长度的脉冲；Ry 靠移相 90°；Rz 由 Rx/Ry 组合而成。
2. **Clifford 集合**：用完整的 24 个单比特 Clifford 门 C1，由 $\{I, R_j(\pm\pi/2), R_j(\pi)\}$ 生成。为了实现方便，所有 −π/2 旋转都写成 +3π/2，导致每个 Clifford 平均脉冲面积达 $7\pi/4$；一个 Clifford 平均耗时约 185 μs。
3. **单点寻址**：把微波频率故意失谐 $\delta = 2\pi \times 33\,\mathrm{kHz}$，全局微波对所有人都远离共振（旋转被压制 $\Omega^2/\delta^2$）；再用一束紧聚焦 459 nm 光（腰斑 3.2 × 2.7 μm）对 $6\mathrm{S}_{1/2}\,F=4 \to 7\mathrm{P}_{1/2}\,F=4$ 红失谐 20 GHz，在目标点产生差动 Stark 移，把该点的 $\lvert 0\rangle$、$\lvert 1\rangle$ 相对移回共振。Stark 束 $\sigma^+$ 偏振、垂直阵列平面，用一对正交 AOD 扫描，切换时间 < 0.5 μs。
4. **为什么取 $\delta/\Omega = \sqrt{15}$**：非目标原子受到的非共振脉冲面积接近 4π 的整数倍，残留翻转误差取局部极小。他们从两能级旋转的保真度积分（对 Bloch 球平均）数值验证：$\delta/\Omega \approx \sqrt{15}$ 时 $R_x(\pi)$ 的串扰误差最小；实测用 $33/8.5 = 3.88$。

### 标定与随机基准测试（RB）

- 全局 RB：7 组随机 Clifford 序列，长度 $\ell = 1,\ldots,100$；每点 50 次测量。按 $P_0 = \tfrac{1}{2} + \tfrac{1}{2}(1-d_{\mathrm{if}})(1-d)^{\ell}$ 拟合，用 $F^2 = 1 - \tfrac{d}{2}$ 报保真度。
- 单点 RB：10 组序列，长度 {1, 8, 15, 22, 29, 36, 43, 50}；在 47 个点上逐个拟合。
- 串扰：目标点之外的点制备在 $\lvert 1\rangle$，测每个 Clifford 后的背景翻转概率。

### 关键参数

|  |  |
| --- | --- |
| 原子 / 阵列 | Cs-133；7×7，3.8 μm；阱深 ~400 μK |
| 编码 | $F=3,\,m_F=0$ / $F=4,\,m_F=0$；9.19 GHz |
| 驱动 | 微波喇叭，$\Omega = 2\pi \times 4.74\,\mathrm{kHz}$（全局） |
| 寻址 | 459 nm Stark 束 + 微波失谐 $\delta=33\,\mathrm{kHz}$（$\sqrt{15}\,\Omega$） |
| Clifford 时间 | ≈ 185 μs（平均脉冲面积 $7\pi/4$） |
| 全局保真度 | $F^2$ = 0.9983(14)；最好点 0.9999(3)，最差点 0.9939 |
| 单点保真度 | 0.9923(7)；串扰误差 0.002(9)（近邻 0.014(20)） |
| 相干 | $T_1 = 0.59\,\mathrm{s}$；$T_2^* = 14\,\mathrm{ms}$（中位数 7 ms）；原子寿命 17 s |

### 误差与结论

他们用密度矩阵模拟了失谐（最多 100 Hz，对应阵列内差动 Stark 移）和 200 ns 的脉冲长度抖动（0.2% 微波功率漂移），发现这两项加起来仍比实测误差小几倍。把 $T_2^*$ 的衰减因子代进去，取 $\langle t\rangle=185\,\mu\mathrm{s}$、$T_2^* = 2.7\,\mathrm{ms}$，正好复现实测的 0.9983，所以结论是：**限制主要来自有限的 $T_2^*$（磁噪声 + 有限温度运动效应）和脉冲长度/失谐误差**，不是微波源本身。

> 这篇的意义：第一次在 49 个可单独寻址的原子上把“全局门 + Stark 选点门”都做了 RB 标定，给出了后来被反复引用的 $\delta/\Omega = \sqrt{15}$ 串扰最优点。局限是单点门比全局门差 4.5 倍，原因是 Stark 束强度/指向抖动。

## 2 · Weiss 组 2016：三维 Cs 光晶格里的“靶向相位门”

Yang Wang, Aishwarya Kumar, Tsung-Yao Wu, David S. Weiss（Penn State）· Science 352, 1562 (2016) · [arXiv:1601.03639](https://arxiv.org/abs/1601.03639) · DOI 10.1126/science.aaf2581

Cs-133 · 5×5×5 3D · 靶向相位 · 微波 + 880 nm · RB 0.9962

### 平台

- Cs 原子装在 5 μm 间距的立方光晶格，5×5×5 = 125 个点；冷却到约 70% 基态占据。
- 平均只有约 40% 的点有原子；因此一篇里“48 个目标点”实际每次约 20 个原子参与。
- 晶格光自发散射是主要退相干源，但 $T_2' = 7\,\mathrm{s}$，远长于 80 μs 的微波脉冲。

### 编码与读出

- 编码：$\lvert 1\rangle = \lvert 6\mathrm{S}_{1/2},\,F=3,\,m_F=0\rangle$，$\lvert 0\rangle = \lvert 6\mathrm{S}_{1/2},\,F=4,\,m_F=0\rangle$。
- 读出：清掉 $\lvert 4,0\rangle$ 原子，对剩下的 $\lvert 3,0\rangle$ 成像。

### 单比特门怎么实现的（重点在“不直接翻转”）

1. **寻址光**：两束圆偏振 880.250 nm 光交叉，腰斑约 2.7 μm、瑞利长度 26 μm；交点处对 $m_F \ne 0$ 的态产生约 2 倍于单束路径的 ac Stark 移。用 MEMS 反射镜把光束指向下一个目标只要 < 5 μs。
2. **门的四段结构**：全局 $\lvert 0\rangle \leftrightarrow \lvert 1\rangle$ 的 80 μs 共振 π 脉冲（黑）、120 μs 的非共振“寻址”微波脉冲（紫），配合寻址光强线性升降。总有效寻址光时间 252 μs。自旋回波把非目标原子在前两段得到的相位在后两段精确抵消；目标原子因为“交叉点 → 单束路径 → 旁观者”的身份变化，净相位不为零。
3. **相位公式**：目标原子净相位 $\varphi \approx \frac{\Omega^2 T}{\delta-kf} - \frac{\Omega^2 T}{\delta-f} + \frac{\Omega^2 T}{\delta} - \frac{\Omega^2 T}{\delta-f}$，其中 $\delta$ 是相对旁观者共振的微波失谐，$f$ 是单束光造成的 ac Stark 移，$k$ 是交叉点/单束的移比。
4. **工作点 $\delta=74.9\,\mathrm{kHz}$**：这里相位对 δ 的变化是二阶的，而 δ 又正比于寻址光强，所以门对光强是**二阶**不敏感、对光束指向是**四阶**不敏感。2% 光强变化 → 8 mrad 相位 → 约 $1\times 10^{-4}$ 门误差。
5. **任意旋转**：这套只直接给 $R_z(\theta)$；再用全局 $R_x(\pm\pi/2)$ 夹住它，$R_y(\theta) = R_x(\pi/2)\,R_z(\theta)\,R_x(-\pi/2)$，非目标原子因为两个全局脉冲相消而不受影响。

### 标定与 RB

- 先在 48 个随机目标点上做单个 $R_z(\pi/2)$，用干涉条纹验证 0.94 的 $F^2$；再对 24 个目标做完整 RB。
- RB 的“计算门”从 $\{R_x(\pm\pi/2), R_y(\pm\pi/2)\}$ 随机取，“泡利门”从 $\{R_x(\pm\pi), R_y(\pm\pi), R_z(\pm\pi), I\}$ 随机取；每点平均约 100 次实现。
- 同时测旁观者、单束路径原子、目标原子的误差，用来分离串扰与自发散射。

### 关键参数

|  |  |
| --- | --- |
| 原子 / 阵列 | Cs-133；5×5×5 光晶格，5 μm |
| 编码 | $\lvert F=3,0\rangle / \lvert F=4,0\rangle$ |
| 寻址光 | 880.250 nm 交叉光束，腰斑 2.7 μm，MEMS 切换 < 5 μs |
| 微波 | 80 μs 共振 π；120 μs 非共振寻址；工作点 $\delta=74.9\,\mathrm{kHz}$ |
| RB 保真度 | 0.9962(16)；串扰保真度 0.9979(2) |
| 单门误差 | 目标 $38(16)\times 10^{-4}$；旁观者 $17(2)\times 10^{-4}$；单束路径 $46(9)\times 10^{-4}$ |
| 误差分解（目标） | 寻址光自发散射 $16\times 10^{-4}$；非共振微波 $5.4\times 10^{-4}$；其余主要为全局微波不稳定 |

### 结论与局限

这是三维几何里最实用的单点寻址方案：光只提供差分 Stark 移，不要求精确强度，因此适合深阵列。局限是门时间被微波（80 μs 级）和四段序列拖长，且误差主要来自微波功率稳定度，而不是光。

## 3 · 武汉物数所 2018：魔强度光阱把微波门误差压到 3×10⁻⁵

Cheng Sheng, Xiaodong He, Ruijun Guo, Kunpeng Wang, Peng Xu, Zongyuan Xiong, Min Liu, Jin Wang, Mingsheng Zhan（中科院武汉物数所）· PRL 121, 240501 (2018) · [arXiv:1712.06306](https://arxiv.org/abs/1712.06306) · DOI 10.1103/PhysRevLett.121.240501

Rb-87 · 单原子 · 微波 6.834 GHz · 魔强度阱 · $3.0(7)\times 10^{-5}$

### 平台

- 单颗 ⁸⁷Rb 原子装在紧聚焦线偏振光阱里，波长约 830 nm；原子从 MOT 装载。
- 关键装置是一块液晶延迟器：30 ms 内把线偏振阱光变成圆偏振，从而切换到“魔强度”工作点。
- 偏置磁场 3.2 G（魔强度点需要）；主动磁场稳定把短期噪声从 4 mG 压到 sub-mG。

### 编码、态制备与读出

- 编码：$\lvert 0\rangle = \lvert 5\mathrm{S}_{1/2},\,F=1,\,m_F=0\rangle$，$\lvert 1\rangle = \lvert 5\mathrm{S}_{1/2},\,F=2,\,m_F=0\rangle$。
- 态制备：795 nm π 偏振（D1，$F=1 \to F'=1$）+ 780 nm π 偏振重泵（D2，$F=2 \to F'=2$），把原子泵到 $\lvert 0\rangle$。
- 读出：这里主要靠荧光/推出来判态；论文重点是门，不是单发读出。

### 单比特门怎么实现的

1. **微波链**：商用 6.834 GHz 铷频综（Spectra Dynamics RB-1），相位分辨率 0.09°、频率稳定度 1 μHz；经 TTL 控制的 PIN 开关（SP123DHS-80）切成近矩形脉冲，放大后送到腔外喇叭（驻波比 1.15）。PIN 开关和放大器温度稳定在 0.05 mK，以被动稳幅。
2. **Rabi 频率**：1 W 输入下优化到约 12 kHz；脉冲时长 $t_{\pi/2}=20.78\,\mu\mathrm{s}$。
3. **标定**：先用微波 Ramsey（故意失谐 15 Hz，扫描到 120 ms）把共振频率定到 0.2 Hz 以内；再用 100 个相同脉冲串扫脉宽，把 π/2 脉冲的时长标定到 0.01 μs。
4. **门集合**：24 个 Clifford，同样把 −π/2 写成 3π/2；Rz 由 Rx/Ry 组合。
5. **为什么能到 $10^{-5}$**：魔强度阱让两个钟态的差动光移在特定阱深下相消（依赖超极化率项），把 $T_2^*$ 从毫秒级推到秒级；再叠加主动磁场稳定，回波相干 1.72 s。

### 标定与 RB

- 5 组随机 Clifford 序列，长度截断在 {1, 200, 400, 600, 800, 1000, 1300}，每点 50 次。
- 拟合 $F = \tfrac{1}{2} + \tfrac{1}{2}(1-d_{\mathrm{if}})(1-2\varepsilon_g)^{\ell}$，得 $\varepsilon_g = 3.0(7)\times 10^{-5}$，$d_{\mathrm{if}} = 0.03$。
- 整个 RB 过程中不定期重标共振频率和脉宽——说明魔强度阱的稳定性足够好。

### 误差分解

|  |  |
| --- | --- |
| 频率漂移 | 12 小时内峰峰 5 Hz、rms 1 Hz → 预测 $2.5\times 10^{-8}$（可忽略） |
| 脉冲面积抖动 | 3 小时累积 rms 0.15% → $7.4\times 10^{-6}$ |
| 退相干 | 主导项；定义短时标相干 $T_{\mathrm{RB}} = 1.30\,T_{2\mathrm{s}}$；Clifford 平均 75.73 μs（含 3 μs 空档） |

### 结论与局限

第一次把中性原子单比特门做到 $10^{-4}$ 容错阈值以下（$3\times 10^{-5}$），证明“魔强度阱 + 磁场稳定”这条路可行。局限是：单原子、全局门，没有阵列寻址；魔强度点要求几个高斯的磁场，对磁场噪声天然敏感。

## 4 · Harvard 2018：Rydberg 编码 qubit 与激光相位噪声

Harry Levine, Alexander Keesling, Ahmed Omran, Hannes Bernien, Sylvain Schwartz, Alexander S. Zibrov, Manuel Endres, Markus Greiner, Vladan Vuletić, Mikhail D. Lukin（Harvard / MIT）· PRL 121, 123603 (2018) · [arXiv:1806.04682](https://arxiv.org/abs/1806.04682) · DOI 10.1103/PhysRevLett.121.123603

Rb-87 · Rydberg 编码 70S · 420 + 1013 nm · 809 nm 相位门 · Bell 0.97

### 平台

- 一维光镊阵列，原子逐个装配到可编程位置；本文重点是相干性，不是规模。
- Rydberg 激发期间**关掉光镊**：脉冲 3–8 μs，之后恢复光阱。基态原子被重新捕获，留在 Rydberg 态的原子被光镊的反束缚推走——这就是他们的态探测机制。
- 探测保真度：Rydberg 态 $f_r = 0.96(1)$；基态 0.955–0.990（取决于关阱时长）。

### 编码

- $\lvert g\rangle = \lvert 5\mathrm{S}_{1/2},\,F=2,\,m_F=-2\rangle$，$\lvert r\rangle = \lvert 70\mathrm{S},\,J=1/2,\,m_J=-1/2\rangle$；1.5 G 磁场下光泵制备。
- 这是“Rydberg qubit”：单比特门就是基态↔Rydberg 的 π 脉冲，所以相干时间直接受 Rydberg 寿命和激光噪声限制。

### 单比特门的光路与核心改进

1. **双光子激发**：420 nm 对 $\lvert g\rangle \to \lvert 6\mathrm{P}_{3/2},\,F=3,\,m_F=-3\rangle$ 蓝失谐 Δ；1013 nm 把 $\lvert e\rangle$ 接到 $\lvert r\rangle$。两束偏振分别驱动 $\sigma^-$ 和 $\sigma^+$，保证只耦合一个中间子能级和一个 Rydberg 态。
2. **光路**：两台 MogLabs 外腔二极管激光器，PDH 锁到超低膨胀（ULE）参考腔，线宽 < 1 kHz；对射聚焦到原子，腰斑 20 μm（420）/30 μm（1013），以压低多普勒。
3. **关键：把参考腔当光谱滤波器**。锁定的激光在 ~1 MHz 处仍有相位噪声（锁环路带宽外的噪声甚至会被放大）。腔透射是 $\mathrm{FWHM} \approx 500\,\mathrm{kHz}$ 的洛伦兹（细度 ~3000），把 1 MHz 处噪声压 ≥ 4 倍；再用透射光注入锁定 420 nm 与 1013 nm 二极管，放大到 5 mW / 50 mW（1013 再经锥形放大器）。
4. **参数**：单光子 Rabi $\Omega_B \approx 2\pi \times 60\,\mathrm{MHz}$、$\Omega_R \approx 2\pi \times 40\,\mathrm{MHz}$；中间态失谐 $\Delta \approx 2\pi \times 600\,\mathrm{MHz}$；双光子 Rabi $\Omega \approx 2\pi \times 2\,\mathrm{MHz}$。功率稳定 < 1%，AOM 开关 ~20 ns。
5. **单原子相位门**（不是翻转门）：一束独立聚焦的 809 nm 光给基态 $\lvert g\rangle$ 一个 5 MHz 的光移，控制脉冲长度即得到 $\varphi=\delta t$ 的相位；整个序列嵌在自旋回波里抵消多普勒。束斑对邻近原子的串扰 < 2%。这个 Z 门被用来测 Bell 态的 off-diagonal 元素。

### 结果

|  |  |
| --- | --- |
| Rabi 相干 | 27(4) μs（此前 ≤ 7 μs） |
| Rydberg 寿命 | $T_1 = 51(6)\,\mu\mathrm{s}$（$n=70$ 的辐射寿命 146 μs，被 1013 nm 散射 ~80 μs 缩短） |
| Ramsey | $T_2^* = 4.5(1)\,\mu\mathrm{s}$，由 10 μK 下 43.5 kHz 的多普勒分布解释 |
| 回波 | $T_2 = 32(6)\,\mu\mathrm{s}$；纯退相位 $T_\varphi = 47(13)\,\mu\mathrm{s}$（残余激光相位噪声） |
| 两原子 | 5.7 μm，$U/\hbar = 2\pi \times 30\,\mathrm{MHz} \gg \Omega$；$\sqrt{2}\,\Omega = 2.83\,\mathrm{MHz}$；Bell 原始 0.91(2)，探测校正后 0.97(3) |
| 两原子回波 | $\lvert W\rangle$ 寿命 36(2) μs；$T_{\varphi}^{W} \gt 100\,\mu\mathrm{s}$（$\lvert gr\rangle/\lvert rg\rangle$ 构成无退相干子空间） |

### 结论与局限

这篇的贡献不是“门保真度数字”，而是**把限制 Rydberg 相干性的激光相位噪声机理讲清楚并压下去**：用腔滤波 + 注入锁定，让 Rabi 相干从 7 μs 提到 27 μs。局限是 Rydberg 编码的 qubit 寿命只有几十 μs、探测保真度只有 0.96 左右；作者自己指出下一步要靠边带冷却、更高细度腔滤波、场电离或把 Rydberg 态映射回基态来改进。

## 5 · Caltech 2020：Sr 的单光子 Rydberg 激发与自电离探测

Ivaylo S. Madjarov*, Jacob P. Covey*, Adam L. Shaw, Joonhee Choi, Anant Kale, Alexandre Cooper, Hannes Pichler, Vladimir Schkolnik, Jason R. Williams, Manuel Endres（Caltech / JPL）· Nat. Phys. 16, 857 (2020) · [arXiv:2001.04455](https://arxiv.org/abs/2001.04455) · DOI 10.1038/s41567-020-0903-z

Sr-88 · 单光子 316.6 nm · 自电离探测 · π 脉冲 0.9951 · Bell ≥0.991

### 平台

- 一维 43 个光镊，间距 3.6 μm；镊光 813.4 nm（对钟态 magic），基态阱深 $U_0 \approx k_{\mathrm{B}}\times 450\,\mu\mathrm{K}$，径向频率 78 kHz。
- 窄线冷却到 $T \approx 2.5\,\mu\mathrm{K}$、平均声子数 $\bar{n} \approx 0.3$；这是碱金属难以达到的低熵。

### 编码、态制备与读出

- 他们把长寿命钟态当“新的基态”：$\lvert g\rangle = 5\mathrm{s}5\mathrm{p}\,{}^3\mathrm{P}_0$，$\lvert r\rangle = 5\mathrm{s}61\mathrm{s}\,{}^3\mathrm{S}_1,\ m_J=0$。这是一对“钟态–Rydberg”qubit。
- 态制备：698 nm 窄线把 ¹S₀ 相干转移到 ³P₀（710 G 下 $\Omega_C \approx 2\pi \times 3.5\,\mathrm{kHz}$，π 脉冲保真度 0.986），再补非相干泵浦，总保真度 0.997(1)。
- 读出：**自电离**。用 5s→5p 的芯态跃迁（5p₃/₂61s₁/₂）把 Rydberg 电子自电离，原子变“暗”；随后对 ³P₀ 原子做高保真成像。自电离 1/e 时间 35 ns；Rydberg 探测保真度上界 0.9996，实测下界 0.9963(9)。

### 单比特门怎么实现的

1. **单光子激发**：316.6 nm 直接 $\lvert g\rangle \leftrightarrow \lvert r\rangle$，束腰 18 μm，30 mW 就能给 $\Omega_R \approx 2\pi \times (6\text{–}7)\,\mathrm{MHz}$（优化后可达 13 MHz）。π 脉冲只有 70 ns。
2. **为什么可以单光子**：³P₀ 是亚稳态，寿命长，可以直接从它激发到 ³S₁ 系列，不需要经中间态，因此**完全没有中间态散射**——这是 Sr/Yb 相对 Rb/Cs 的结构性优势。
3. **激发时关阱**：Rydberg 态在 813.4 nm 是反束缚的（幅度约等于基态束缚），所以先在浅阱里激发、再恢复阱深读出。
4. **也做了开阱版本**：阱深 $U/h \approx 0.94\,\mathrm{MHz}$ 时仍能保持高保真，说明标准光镊阵列可以不清空阱就做 Rydberg 门。

### 结果

|  |  |
| --- | --- |
| 单原子 π | 0.9951(9)；SPAM 校正 0.9967(9) |
| 单原子 2π | 0.9951(9)；校正 0.998(1) |
| 长时相干 | 约 42 个 Rabi 周期（$\tau_C \approx 7\,\mu\mathrm{s}$）；阻塞下约 60 个周期 |
| 两原子 | 3.6 μm，$V_B \approx 2\pi \times 130\,\mathrm{MHz}$（$n=61$）；$\sqrt{2}\,\Omega = 8.5\,\mathrm{MHz}$；Bell ≥0.980(3)，校正 ≥0.991(4) |
| 开阱版本 | Bell ≥0.975(3)，校正 ≥0.987(4) |

### 结论与局限

这是第一次在碱土金属里做出 Rydberg 阻塞纠缠，且当时的中性原子两原子纠缠保真度纪录（0.991）。单光子 + 自电离探测使保真度和探测都优于碱金属双光子方案。局限：这里测的是“基态–Rydberg”门的保真度，不是长寿命基态编码的单比特门；Rydberg 态寿命 ~80 μs 仍是限制，且要关阱或浅阱操作。

## 6 · Princeton 2022：¹⁷¹Yb 核自旋，RF 驱动的慢而稳的门

Shuo Ma*, Alex P. Burgers*, Genyue Liu, Jack Wilson, Bichen Zhang, Jeff D. Thompson（Princeton）· PRX 12, 021028 (2022) · [arXiv:2112.06799](https://arxiv.org/abs/2112.06799) · DOI 10.1103/PhysRevX.12.021028

Yb-171 · 核自旋 · RF 161.7 Hz · RB 99.959% · $T_2^*$ 1.24 s

### 平台

- 30 点光镊阵列，镊光 $486.78\,\mathrm{nm}$——他们新找的 ¹⁷¹Yb magic 波长（对 ${}^1\mathrm{S}_0\text{–}{}^3\mathrm{P}_1,\ \lvert m_{F'}\rvert=1/2$ 的差分光移仅 0.0001(6) U₀）。
- 每阱 5 mW，556 nm 窄线成像 25 ms，单原子成像+存活综合保真度 98.8(3)%，温度 7.4 μK。

### 编码、态制备与读出

- 编码：¹S₀ 的核自旋子能级，$\lvert 0\rangle = \lvert m_F=-1/2\rangle$，$\lvert 1\rangle = \lvert m_F=+1/2\rangle$。¹S₀ 没有超精细耦合，所以对差分光移和拉曼散射天然免疫。
- 初始化：$\sigma^+$ 光泵，走 $\lvert 0\rangle \to {}^3\mathrm{P}_1,\ F'=3/2,\ m_{F'}=1/2$；4.11 G 把 $m_{F'}=3/2$ 移开 5.7 MHz（31Γ），使 $\lvert 1\rangle$ 成为暗态。
- 读出：先把 $\lvert 1\rangle$ 通过 Rydberg 态“吹走”——用 ${}^3\mathrm{S}_1\,6\mathrm{s}75\mathrm{s},\ F'=3/2,\ m_{F'}=3/2$，经 ³P₁ 双光子激发（556 + 308 nm，$\Delta_r = 20\,\mathrm{MHz}$，$\Omega_r = 0.31\,\mathrm{MHz}$），再用 369 nm 的 Yb⁺ 芯态跃迁自电离；剩余 $\lvert 0\rangle$ 原子成像。Zeeman 劈裂 $7.8\,\mathrm{MHz} \gg \Omega_r$ 保证只激发 $\lvert 1\rangle$。
- 重复 3 轮吹除：$\lvert 0\rangle$ 存活 94.5(3)%，$\lvert 1\rangle$ 残留 0.2(2)%，平均初始化+读出保真度 97.2(4)%。

### 单比特门怎么实现的

1. **RF 线圈**：核自旋在 4.11 G 下 Larmor 频率 $\omega_L \approx 2\pi \times 3.09\,\mathrm{kHz}$（750 Hz/G）；用射频线圈直接驱动，$\Omega_{\mathrm{RF}} = 2\pi \times 161.7(5)\,\mathrm{Hz}$。
2. **为什么这么慢**：他们故意让 $\Omega_{\mathrm{RF}} \ll \omega_L$，避免同向/反向旋转项在 $\Omega \approx \omega_L$ 时把演化搞复杂；代价是 $t_{\pi/2}\approx1.5\,\mathrm{ms}$（换算）。更大的静磁场或加一个 $\sigma^+$ 线圈就能提速。
3. **Z 旋转**：直接改 RF 相位；RB 用 pyGSTi 生成的 Clifford 序列。
4. **门误差**：随机 Clifford 深度到 400，每个 Clifford 约 4 ms；理想输出在 $\lvert 0\rangle/\lvert 1\rangle$ 各半。拟合得 $F_{1\mathrm{Q}} = 99.975(1)\%$（输出 $\lvert 1\rangle$）与 $99.927(3)\%$（输出 $\lvert 0\rangle$），平均 $99.959(6)\%$，SPAM 2.5(6)%。两者差异与原子损失一致。

### 相干与两比特（背景）

|  |  |
| --- | --- |
| $T_2^*$ | 逐点平均 1.24(5) s；阵列平均 1.00(4) s（磁场梯度 ~2 mHz/μm） |
| 回波 $T_2$ | 5(1) s |
| $T_1$ | 20(2) s（校正损失后）；原子损失时间 9 s |
| 差分光移 | $\eta = 9.8\times 10^{-8}$（线偏振下理论为 0） |
| 两比特 | CZ：$\Omega_r=0.763\,\mathrm{MHz}$，$\Delta_Z/\Omega_r=10.6$，$\Delta/\Omega_r=0.377$，$\xi=3.902$，$\tau\Omega_r=4.293$；3 μm 间距；Bell 83(2)% |

### 结论与局限

把核自旋 qubit 的相干优势（秒级）和 Rydberg 门结合起来的第一套“通用门”。局限：全部门是全局的，没有逐点寻址；两比特门只有 83%，受限于中间态/里德堡态自发辐射（约 3%）与激光噪声。作者指出局域化不难：单比特可用简并拉曼，两比特可用 369 nm 光移局部控制。

## 7 · JILA 2022：¹⁷¹Yb 单束拉曼，170 ns 的快速门

Alec Jenkins*, Joanna W. Lis*, Aruku Senoo, William F. McGrew, Adam M. Kaufman（JILA / NIST / CU Boulder）· PRX 12, 021027 (2022) · [arXiv:2112.06732](https://arxiv.org/abs/2112.06732) · DOI 10.1103/PhysRevX.12.021027

Yb-171 · 10×10 · 单束拉曼 · $t_{\pi/2} = 170\,\mathrm{ns}$ · RB $5.2\times 10^{-3}$

### 平台

- 532 nm 光镊，10×10 = 100 点（6 mW/阱，17.1 MHz 深）；用 556 nm 窄线“蓝失谐增强装载”把装载率做到 92.73(8)%，单阱最高 96.0(1.4)%——这是碱土金属里第一次实现这类方案。
- 成像用 399 nm 宽线 + 556 nm 冷却光，120 ms，误判约 0.3%，成像损失 2.51%。
- 用核自旋做三维拉曼边带冷却，$\bar{n}_r = 0.14(3)$、$\bar{n}_z = 0.13(4)$，接近运动基态。

### 编码、态制备与读出

- 编码：$\lvert 0\rangle = \lvert m_F=+1/2\rangle$，$\lvert 1\rangle = \lvert m_F=-1/2\rangle$；制备保真度 0.996(1)。
- 读出：频率移动的 556 nm 光把 $\lvert 0\rangle$ 加热出阱（blow-away），用存活与否判自旋；blow-away 5 ms，综合误判约 $6\times 10^{-3}$。

### 单比特门怎么实现的（两种驱动区间）

1. **弱驱动区间（$\Omega_X \lt \Delta_N$）**：两束同向传播光，一束 π 偏振、一束垂直于量子化轴（$\sigma^+/\sigma^-$）。扫描两束频差会看到两条拉曼共振（分别经 ³P₁ 的 $F'=3/2,\ m_{F'}=\pm 1/2$）。固定在其中一条上，可看到 kHz 量级的 Rabi 振荡。
2. **强驱动区间（$\Omega_X \gg \Delta_N$）——本文主方案**：**只用一束 X 光**，它同时含沿量子化轴和垂直于轴的分量，因此一束光就驱动两条拉曼通道；再加一束 Z 光劈裂核自旋并驱动 Z 轴旋转。
3. **参数**：$\Delta_X/(2\pi) \approx -180\,\mathrm{MHz}$，$\Delta_Z/(2\pi) = -164\,\mathrm{MHz}$，激发态劈裂 $\Delta_e/(2\pi) \approx 2\,\mathrm{MHz}$；X Rabi $1.77\,\mathrm{MHz}$，Z Rabi $0.77\,\mathrm{MHz}$；小磁场把核自旋劈裂 1.25 kHz。$t_{\pi/2} = 170\,\mathrm{ns}$。
4. **RB**：Clifford 由 X(π/2) 和 Z(π/2) 编译；每个深度 40 组随机序列，深度到 ~100；拟合得每 Clifford 误差 $5.2(5)\times 10^{-3}$。

### 相干与误差判断

|  |  |
| --- | --- |
| $T_2^*$ | 3.7(4) s |
| 回波 $T_2$ | 7.9(4) s |
| 自旋弛豫 | 数十秒；加几个高斯磁场可到 100 s 量级 |
| 门时间 / 相干 | 170 ns vs 秒级，差 6–7 个量级 |

作者用估计的散射率做模拟（图中红线），认为当前 $5\times 10^{-3}$ 主要来自拉曼光散射和光强噪声；基于 $T_2^*$ 与散射预算，他们**估计**可以做到 $10^{-4}$（作者估计，非实测）。

### 结论与局限

这篇证明了核自旋 qubit 也能“快”：单束拉曼 + 170 ns 的 π/2 脉冲，配合秒级相干，是 Rb 微波方案之外另一条速度路线。局限是当前误差仍停留在 $10^{-3}$，需要更好的光强稳定和更远的拉曼失谐；另外全部门是全局的。

## 8 · Atom Computing 2022：⁸⁷Sr 核自旋与 AOD 逐点拉曼

Katrina Barnes 等（Atom Computing, Berkeley）· Nat. Commun. 13, 2779 (2022) · [arXiv:2108.04790](https://arxiv.org/abs/2108.04790) · DOI 10.1038/s41467-022-29977-z

Sr-87 · $I=9/2$ · 逐点拉曼 · $T_2^*=21\,\mathrm{s}$ · $t_{\pi/2} = 223\,\mu\mathrm{s}$

### 平台

- SLM 生成 10×11 = 110 个光镊（间距 4 μm），可重排成 7×3 = 21 个满占据 qubit；同一装置能装 14×14 里 100 多个原子。
- 461 nm 荧光成像；成像时用 ³P₁ 窄线冷却，保持原子不丢。

### 编码、态制备与读出

- 编码：⁸⁷Sr 基态 ¹S₀ 核自旋 $\lvert \downarrow\rangle = \lvert F=9/2,\,m_F=-9/2\rangle$，$\lvert \uparrow\rangle = \lvert m_F=-7/2\rangle$，11 G 磁场。
- 读出：把要“隐藏”的态相干转移到 ³P₀ 钟态（698 nm shelving），再成像剩下的态。shelving 态在强阱光下因三重态内拉曼散射寿命降到 ~1 s，但足够单次读出。
- 隔离：$I=9/2$ 的相邻态 $m_F=-5/2$ 在弱场下与 qubit 跃迁简并，会产生泄漏；他们加一束近共振于 $\lvert L\rangle \to {}^3\mathrm{P}_1,\ F=7/2,\ m_F=-7/2$ 的强光，把这个泄漏跃迁移开，散射率压到 ~1 Hz。

### 单比特门怎么实现的

1. **两束拉曼**：经 ³P₁, $F=7/2$ 中间态耦合核自旋；两束同源，各自过一对正交 AOD（vAOD/hAOD），用 AOD 的 RF 幅度/相位做逐点幅度与相位控制。
2. **EOM 侧带**：每束一个 EOM，用一阶侧带驱动双光子过程，同时提供快速脉冲整形和中间态失谐调节。
3. **并行方式**：同一列（或行）的原子可同时驱动（最多 7 个），不同列串行，三组脉冲覆盖 21 个 qubit；这样每个 qubit 的门是独立的。
4. **参数**：Rabi 1.16 kHz，$t_{\pi/2} = 223\,\mu\mathrm{s}$。慢的原因正是上面那束隔离光：它的强度/偏振纯度限制了可用的拉曼失谐，从而限制 Rabi。
5. **相位**：用“人为失谐”（advance phase）在 Ramsey 中读出相位；每点可编程。

### 相干

|  |  |
| --- | --- |
| $T_1$ | > 5 s（10 s 内无明显弛豫；受真空寿命 ~60 s 限制） |
| $T_2^*$ | 21(7) s（阵列平均） |
| 回波 $T_2$ | 42(6) s |
| 门长 / 相干 | 相干比门长 $10^{5}$ 倍以上 |

### 结论与局限

第一次展示“可逐点寻址的核自旋寄存器”，相干时间接近分钟级。局限：门很慢（223 μs），且并行受行/列限制；读出靠 shelving，寿命受阱光限制。它代表“相干优先”的路线，与 JILA 的“速度优先”形成对照。

## 9 · Harvard 2023：99.97% 拉曼门与 99.5% CZ 的同一套系统

Simon J. Evered*, Dolev Bluvstein*, Marcin Kalinowski* 等，Mikhail D. Lukin（Harvard / MIT / QuEra）· Nature 622, 268 (2023) · [arXiv:2304.05420](https://arxiv.org/abs/2304.05420) · DOI 10.1038/s41586-023-06481-y

Rb-87 · 256 原子平台 · 拉曼 1 MHz · BB1 脉冲 · $\delta_{\mathrm{Raman}}$ 180 GHz

### 平台

- SLM 生成 850 nm 光镊，810 nm AOD 镊子做重排；先用 780 nm D2 的偏振梯度冷却，再用 795 nm D1 的 Λ 增强灰糖蜜冷却，径向平均声子数 $\bar n \approx 1\text{–}2$，温度约 10 μK，阱深约 1 mK。
- 重排后可做缺陷-free 阵列；本文门在 20 原子（一行）到 60 原子（两行）上并行。

### 编码、态制备与读出（方法部分的关键改动）

- 编码：$\lvert 0\rangle = \lvert F=1,\,m_F=0\rangle$，$\lvert 1\rangle = \lvert F=2,\,m_F=0\rangle$。
- 态制备改成三步：先用 $\sigma^+$ 780 nm 把原子泵到伸展态 $\lvert F=2,\,m_F=+2\rangle$（只散射几个光子，避免老方案 40–70 个泵浦周期带来的加热）；把磁场转 90°，让拉曼光有垂直于量子化轴的分量；再用两个拉曼 π 脉冲（Knill 复合脉冲 + 高斯包络）依次转到 $\lvert F=1,\,m_F=+1\rangle$ 和 $\lvert F=2,\,m_F=0\rangle$；最后把磁场转回。泵浦保真度约 99.7–99.8%。
- 读出：D2 上 $F=2 \to F'=3$ 强光把 $\lvert 1\rangle$ 推走，对 $\lvert 0\rangle$ 成像；推走+成像综合保真度约 99.83%；电路前后背景损失约 0.25% / 0.1%。

### 单比特门怎么实现的

1. **拉曼系统**：用他们此前的“色散光学”方案（Levine 等，PRA 105, 032618, 2022）：对激光做**相位调制**，再经啁啾布拉格光栅（CBG）的色散转为**幅度调制**，被动稳定、高效率、可承受高功率——替代传统的声光调制产生 6.8 GHz 边带。
2. **参数**：全局拉曼 Rabi 频率 1 MHz；拉曼失谐 180 GHz（远失谐以压低散射）。
3. **脉冲**：用 BB1 复合脉冲做鲁棒旋转（对脉冲面积误差不敏感）；Z 旋转直接由控制软件改相位。
4. **保真度**：对 Haar 随机单比特旋转采样，测得 **99.97%**；作者说这与 180 GHz 失谐下的拉曼散射极限一致，因此进一步失谐还能提高。
5. **与两比特的关系**：同一套系统里两比特用 420/1013 nm 双光子到 $n=53$，$\Delta/(2\pi) = 7.8\,\mathrm{GHz}$，$\Omega/(2\pi) = 4.6\,\mathrm{MHz}$；单比特门和 CZ 共用全局光，只是波长与脉冲不同。

### Rydberg 激发与 CZ（对照用）

|  |  |
| --- | --- |
| Rydberg 态 | 53S₁/₂；420 nm $\sigma^+$ + 1013 nm $\sigma^-$ |
| 单光子 Rabi | $\Omega_{420} = 2\pi \times 237\,\mathrm{MHz}$；$\Omega_{1013} = 2\pi \times 303\,\mathrm{MHz}$ |
| 双光子 | $\Delta/(2\pi) = 7.8\,\mathrm{GHz}$（60 原子数据用 6.3 GHz）；$\Omega/(2\pi) = 4.6\,\mathrm{MHz}$ |
| 光斑 | SLM 整形为平顶：10×10 μm（20 原子）/ 20×10 μm（60 原子） |
| 相互作用 | 间距 2 μm，$V/(2\pi) \approx 450\,\mathrm{MHz}$；$\mathrm{NA}=0.65$ |
| CZ 保真度 | 99.52(4)%（Bell 衰减）；99.54(2)%（全局 RB）；60 原子 99.48(2)% |

### 单比特门相关的误差讨论

两比特门的主要误差是 Rydberg 衰减、耦合到另一个 $m_J$、中间态散射，以及 ground–Rydberg $T_2^* = 3\,\mu\mathrm{s}$（激光光强涨落 + 有限温度）。单比特门本身的 99.97% 已经低于两比特门误差一个量级，所以整套系统的瓶颈明确是两比特门，而不是单比特门。作者对 99.9% CZ 的路径是**估计**：失谐再远 2 倍、里德堡寿命 3 倍、$T_2^*$ 2 倍，或 Rabi 提高 3 倍。

### 结论与位置

这是目前公开的、在真实多原子系统上单比特门保真度最高的之一（>99.97%），且与 99.5% 的 CZ 共用一套光路，直接支撑了后续 280 物理比特的逻辑处理器（Bluvstein 等，Nature 2024）。它的“实现细节”价值在于：**把拉曼驱动做成被动稳定的色散系统、用 BB1 压脉冲误差、把失谐推到 180 GHz 压散射**——这三点是 99.97% 的直接来源。

## 10 · 横向对比

| 工作 | 编码 | 驱动 | 门时间 | 单比特保真度 | 寻址方式 |
| --- | --- | --- | --- | --- | --- |
| Saffman 2015 | Cs 超精细 | 微波 | Clifford ~185 μs | 0.9983（全局）/ 0.9923（单点） | 459 nm Stark 束 + $\delta = \sqrt{15}\,\Omega$ |
| Weiss 2016 | Cs 超精细 | 微波 + 880 nm | ~250 μs 序列 | 0.9962 | 交叉光束靶向相位 |
| 武汉 2018 | Rb 超精细 | 微波（魔强度阱） | Clifford 75.7 μs | 误差 $3.0\times 10^{-5}$ | 全局 |
| Harvard 2018 | Rb 基态–Rydberg | 420+1013 nm | $t_{\pi} \sim 250\,\mathrm{ns}$（$\Omega=2\,\mathrm{MHz}$） | 相位门对比度受探测限制 | 809 nm 单点光移 |
| Caltech 2020 | Sr 钟态–Rydberg | 316.6 nm 单光子 | $t_{\pi} = 70\,\mathrm{ns}$ | 0.9951 / 校正 0.9967 | 全局 |
| Princeton 2022 | Yb 核自旋 | RF | $t_{\pi/2} \approx 1.5\,\mathrm{ms}$（换算） | 0.99959 | 全局 |
| JILA 2022 | Yb 核自旋 | 单束拉曼 | $t_{\pi/2} = 170\,\mathrm{ns}$ | 误差 $5.2\times 10^{-3}$ | 全局（可扩展） |
| Atom Computing 2022 | Sr-87 核自旋 | 双束拉曼 + AOD | $t_{\pi/2} = 223\,\mu\mathrm{s}$ | 未报 RB；$T_2^* = 21\,\mathrm{s}$ | 逐点（行/列并行） |
| Harvard 2023 | Rb 超精细 | 色散系统拉曼 | $\Omega=1\,\mathrm{MHz}$ | 0.9997 | 全局（可扩展） |

两条主线很清楚：**碱金属超精细 + 拉曼**走“速度与保真度”，已经把单比特门做到 $10^{-4}$ 以下；**碱土/镱核自旋**走“相干时间”，天然没有差分光移，但驱动慢、且两比特门还弱。微波路线则是“稳但慢”，靠魔强度阱也能进 $10^{-5}$。

## 11 · 误差机理小结

| 误差源 | 物理图像 | 典型量级 | 对策与代表工作 |
| --- | --- | --- | --- |
| 差动光移（DLS） | 阱光对两个超精细态的光移不同，且随光强/位置变化 | $\eta \sim 10^{-3}$；阵列内失谐可达 100 Hz；$T_2^*$ 1–14 ms | 魔强度阱（武汉 2018）、魔波长、回波 |
| 微波 Rabi 慢 | 超精细劈裂在 GHz，微波 Rabi 只有 kHz | Clifford 75–185 μs | 拉曼提速（JILA 170 ns；Harvard 1 MHz） |
| 拉曼/中间态散射 | 经激发态虚耦合，有限失谐下真实布居 | 碱金属 $T_1\sim 0.5\text{–}1\,\mathrm{s}$；Rb 双光子散射 ~80 μs | 增大失谐（Harvard 180 GHz）、暗态、单光子（Sr） |
| 激光相位噪声 | ~1 MHz 处的高频噪声直接变成 Rydberg 失谐 | Rabi 相干 7 → 27 μs | 参考腔滤波 + 注入锁定（Harvard 2018） |
| 多普勒 | 有限温度下每颗原子随机失谐 | 10 μK → 43.5 kHz | 回波、拉曼边带冷却（JILA $\bar n \approx 0.14$） |
| 寻址串扰 | 聚焦光斑溢出到邻居 | 单点 0.992 vs 全局 0.998；串扰 0.2%–5% | $\delta/\Omega=\sqrt{15}$（Saffman）、靶向相位（Weiss）、AOD 闭环 |
| 核自旋特有 | 无超精细耦合 → $\mathrm{DLS}\approx 0$；限制变成磁场与光泄漏 | $T_2^*$ 秒级；$T_1$ 数十秒 | 磁场稳定、挡光、magic 波长（Yb $486.78\,\mathrm{nm}$） |

> 一句话总结：**单比特门本身已经不是里德堡平台的瓶颈**。Rb 拉曼已经到 99.97%（Harvard 2023）、微波 + 魔强度阱到 $3\times 10^{-5}$（武汉 2018）、Yb 核自旋 RB 到 99.959%（Princeton 2022）。真正卡住整机的是两比特门（Harvard CZ 99.5%，Yb CZ 83%）、原子损失、并行寻址串扰与校准开销。

## 12 · 补充与延伸

### 两篇值得配套读的

- **Levine 等，PRA 105, 032618 (2022)**：Harvard 拉曼驱动系统的专门论文——相位调制 + 啁啾布拉格光栅（CBG）转成幅度调制，被动稳定、高效率、支持高功率。这是 Harvard 2023 单比特门 99.97% 的硬件基础。[arXiv:2110.14645](https://arxiv.org/abs/2110.14645) · DOI 10.1103/PhysRevA.105.032618
- **Bluvstein 等，Nature 2024**：在同一平台上用 280 个物理比特做逻辑处理器，单比特门沿用本文方案。[arXiv:2312.03982](https://arxiv.org/abs/2312.03982) · DOI 10.1038/s41586-023-06927-3

### 综述

- M. Saffman，*Quantum computing with atomic qubits and Rydberg interactions: progress and challenges*，J. Phys. B 49, 202001 (2016) · DOI 10.1088/0953-4075/49/20/202001
- M. Morgado, S. Whitlock，*Quantum simulation and computing with Rydberg-interacting qubits*，AVS Quantum Sci. 3, 023501 (2021) · DOI 10.1116/5.0036562

### 说明

本文所有数字来自对应论文的 arXiv 全文；标注“换算”的是我按 $t_{\pi/2}=\frac{1}{4f_R}$ 之类关系推的（$f_R$ 为以 Hz 计的拉比频率），“作者估计”处是论文自己的预测。若你要某一篇的补充材料级细节（例如 Saffman 的 24 个 Clifford 脉冲表、Harvard 的 BB1 相位表、Yb 的 Z 门时序），可以再单独展开。
