---
title: "从教材定态微扰到瑞利–薛定谔微扰论"
date: 2026-11-21
category: research
tags: ["量子力学", "微扰论", "多体物理"]
summary: "从非简并基态出发，用预解算符和中间归一化推导逐阶递推，将教材的二阶求和式与多体文献中的算符写法逐项对照。"
---

## 瑞利–薛定谔微扰与教材公式的关系

**教材中的定态非简并微扰论是瑞利–薛定谔微扰论（Rayleigh–Schrödinger perturbation theory, RSPT）的非简并情形。** 下面用预解算符和中间归一化推导同一组公式，并把二阶波函数的显式求和写法逐项化为算符写法。

这一方法源于瑞利对经典振动问题的研究。薛定谔在 1926 年将微扰方法用于波动力学。多体物理和量子化学文献常用 RSPT 这一名称，以区别于布里渊–维格纳微扰论（BWPT）等其他展开方法。

## 预解算符与中间归一化

考虑哈密顿量 $H=H_0+\lambda V$，其中 $\lambda$ 为实参数，$V$ 为厄米微扰。设 $H_0\lvert n\rangle=E_n\lvert n\rangle$ 的本征态构成正交归一完备基，并假定待微扰的基态 $\lvert 0\rangle$ 是孤立的非简并本征态。

### 投影算符与预解算符 $R$

定义基态投影算符 $P$ 与激发态子空间投影算符 $Q$：

$$
P \equiv \lvert 0\rangle\langle 0\rvert, \qquad Q \equiv 1 - P = \sum_{n\neq 0}\lvert n\rangle\langle n\rvert.
$$

它们满足 $P^2=P$、$Q^2=Q$、$PQ=QP=0$，且与 $H_0$ 对易。**约化预解算符** $R$ 在 $Q$ 子空间取 $H_0-E_0$ 的逆，在基态上的作用定义为零。

$$
\boxed{R \equiv \frac{Q}{H_0 - E_0} = \sum_{n\neq 0}\frac{\lvert n\rangle\langle n\rvert}{E_n - E_0}.}
$$

这里取能量分母 $E_n-E_0>0$，所以 $R$ 在激发态子空间正定，在全空间半正定。换成教材常用的 $E_0-E_n$ 时，每个分母会带来一个负号。

<span id="eq-sign"></span>

$$
\begin{aligned}
E_0-E_n &= -(E_n-E_0), \\
(E_0-E_n)(E_0-E_m) &= (E_n-E_0)(E_m-E_0), \\
(E_0-E_n)^2 &= (E_n-E_0)^2.
\end{aligned}
\tag{1}
$$

预解算符 $R$ 具有四条最常用的基本性质：

**1. 湮灭未扰基态。** 由 $Q\lvert 0\rangle=0$ 得到 $R\lvert 0\rangle = 0$ 和 $\langle 0\rvert R = 0$。

**2. 激发态空间上的逆运算。** 有 $R(H_0 - E_0) = (H_0 - E_0)R = Q$。特别地，若 $\lvert \phi\rangle$ 与 $\lvert 0\rangle$ 正交，则 $R(H_0 - E_0)\lvert \phi\rangle = \lvert \phi\rangle$。

**3. 幂次公式。** 由 $\langle n\vert m\rangle=\delta_{nm}$ 可以计算 $R^2$。

<span id="eq-r-square"></span>

$$
\begin{aligned}
R^2 &= \left(\sum_{n\neq 0}\frac{\lvert n\rangle\langle n\rvert}{E_n - E_0}\right)\left(\sum_{m\neq 0}\frac{\lvert m\rangle\langle m\rvert}{E_m - E_0}\right) \\
&= \sum_{n\neq 0}\sum_{m\neq 0}\frac{\lvert n\rangle\delta_{nm}\langle m\rvert}{(E_n - E_0)(E_m - E_0)} \\
&= \sum_{n\neq 0}\frac{\lvert n\rangle\langle n\rvert}{(E_n - E_0)^2},
\end{aligned}
\tag{2}
$$

一般地，$R^k = \sum_{n\neq 0}\frac{\lvert n\rangle\langle n\rvert}{(E_n - E_0)^k}$。

**4. 厄米性。** 有 $R^\dagger = R$。

### 中间归一化与教材直接归一化的等价性

按小参数 $\lambda$ 展开精确能量与未归一化波函数 $\lvert \widetilde{\Psi}\rangle$：

<span id="eq-series"></span>

$$
\begin{aligned}
E &= E_0 + \lambda E^{(1)} + \lambda^2 E^{(2)} + \lambda^3 E^{(3)} + \cdots, \\
\lvert \widetilde{\Psi}\rangle &= \lvert 0\rangle + \lambda\lvert \psi_1\rangle + \lambda^2\lvert \psi_2\rangle + \lambda^3\lvert \psi_3\rangle + \cdots.
\end{aligned}
\tag{3}
$$

**中间归一化条件**规定精确态在未扰基态上的投影恒为 $1$：

$$
\langle 0\vert \widetilde{\Psi}\rangle = 1 \iff \langle 0\vert \psi_k\rangle = 0 \quad (k = 1, 2, 3, \dots).
$$

也就是说，所有高阶修正 $\lvert \psi_k\rangle$ 都纯粹落在激发态子空间 $Q$ 内（$Q\lvert \psi_k\rangle=\lvert \psi_k\rangle$）。

若要回到本科教材中满足 $\langle \Psi\vert \Psi\rangle=1$ 的**直接归一化波函数** $\lvert \Psi\rangle$，只需在最后除以模长 $\sqrt{\langle \widetilde{\Psi}\vert \widetilde{\Psi}\rangle}$。利用 $\langle 0\vert \psi_k\rangle=0$，展开至二阶：

$$
\begin{aligned}
\lvert \Psi\rangle
&= \frac{\lvert \widetilde{\Psi}\rangle}{\sqrt{\langle \widetilde{\Psi}\vert \widetilde{\Psi}\rangle}} \\
&= \frac{\lvert 0\rangle + \lambda\lvert \psi_1\rangle + \lambda^2\lvert \psi_2\rangle + O(\lambda^3)}
{\sqrt{1 + \lambda^2\langle \psi_1\vert \psi_1\rangle + O(\lambda^3)}} \\
&= \lvert 0\rangle + \lambda\lvert \psi_1\rangle\\
&\quad + \lambda^2\left(\lvert \psi_2\rangle - \frac{1}{2}\langle \psi_1\vert \psi_1\rangle\lvert 0\rangle\right) + O(\lambda^3).
\end{aligned}
$$

最后一步使用了 $(1+x)^{-1/2}=1-x/2+O(x^2)$。又因为 $\langle \psi_1\vert \psi_1\rangle = \langle 0\lvert VR^2V\rvert 0\rangle = \sum_{n\neq 0}\frac{\lvert\langle n\lvert V\rvert 0\rangle\rvert^2}{(E_0 - E_n)^2}$，括号中的 $-\frac{1}{2}\langle \psi_1\vert \psi_1\rangle\lvert 0\rangle$ 正是教材里二阶归一化波函数沿未扰基态方向的修正。

## 从薛定谔方程推导逐阶递推式

将[能量和波函数的展开式（式 3）](#eq-series)代入定态薛定谔方程 $(H_0+\lambda V)\lvert \widetilde{\Psi}\rangle=E\lvert \widetilde{\Psi}\rangle$，收集 $\lambda^k$（$k\ge 1$）的项。这里记 $\lvert \psi_0\rangle\equiv\lvert 0\rangle$。

$$
\begin{aligned}
&H_0\lvert \psi_k\rangle + V\lvert \psi_{k-1}\rangle\\
&\quad = E_0\lvert \psi_k\rangle + \sum_{j=1}^{k-1} E^{(j)}\lvert \psi_{k-j}\rangle + E^{(k)}\lvert 0\rangle.
\end{aligned}
$$

移项整理成标准形式：

<span id="eq-order-k"></span>

$$
\begin{aligned}
&(H_0 - E_0)\lvert \psi_k\rangle + V\lvert \psi_{k-1}\rangle\\
&\quad = \sum_{j=1}^{k-1} E^{(j)}\lvert \psi_{k-j}\rangle + E^{(k)}\lvert 0\rangle.
\end{aligned}
\tag{4}
$$

在[第 $k$ 阶方程（式 4）](#eq-order-k)的两边分别左乘基态左矢和预解算符，就得到能量与波函数的递推式。

**求能量 $E^{(k)}$——两边左乘 $\langle 0\rvert$**：利用 $\langle 0\rvert(H_0 - E_0)=0$ 以及中间归一化 $\langle 0\vert \psi_{k-j}\rangle=0$（$1\le j\le k-1$），右边仅剩 $E^{(k)}$，立刻得到

<span id="eq-energy"></span>

$$
\boxed{E^{(k)} = \langle 0\lvert V\rvert \psi_{k-1}\rangle.}
\tag{5}
$$

**求波函数 $\lvert \psi_k\rangle$——两边左乘预解算符 $R$**：利用 $R(H_0 - E_0)\lvert \psi_k\rangle = Q\lvert \psi_k\rangle = \lvert \psi_k\rangle$ 以及 $R\lvert 0\rangle=0$，立刻得到

<span id="eq-state"></span>

$$
\boxed{\lvert \psi_k\rangle = -RV\lvert \psi_{k-1}\rangle + \sum_{j=1}^{k-1} E^{(j)} R\lvert \psi_{k-j}\rangle.}
\tag{6}
$$

将 $k=1,2,3$ 代入[能量递推式（式 5）](#eq-energy)与[波函数递推式（式 6）](#eq-state)，得到前三阶表达式。

**第 1 阶**

$$
\begin{aligned}
E^{(1)} &= \langle 0\lvert V\rvert 0\rangle, \\
\lvert \psi_1\rangle &= -RV\lvert 0\rangle.
\end{aligned}
$$

**第 2 阶**

$$
\begin{aligned}
E^{(2)} &= \langle 0\lvert V\rvert \psi_1\rangle = -\langle 0\lvert VRV\rvert 0\rangle, \\
\lvert \psi_2\rangle &= -RV\lvert \psi_1\rangle + E^{(1)}R\lvert \psi_1\rangle \\
&= RVRV\lvert 0\rangle - E^{(1)}R^2V\lvert 0\rangle.
\end{aligned}
$$

**第 3 阶**

$$
\begin{aligned}
E^{(3)} &= \langle 0\lvert V\rvert \psi_2\rangle \\
&= \langle 0\lvert VRVRV\rvert 0\rangle - E^{(1)}\langle 0\lvert VR^2V\rvert 0\rangle, \\
\lvert \psi_3\rangle &= -RV\lvert \psi_2\rangle + E^{(1)}R\lvert \psi_2\rangle + E^{(2)}R\lvert \psi_1\rangle.
\end{aligned}
$$

**一阶能量修正为零的特例**

以互不耦合的自旋单态二聚体为未扰基态，把二聚体之间的海森堡交换作为微扰时，$E^{(1)}=\langle 0\lvert V\rvert 0\rangle=0$。此时前三阶波函数化为
$$
\begin{aligned}
\lvert \psi_1\rangle &= -RV\lvert 0\rangle, \\
\lvert \psi_2\rangle &= -RV\lvert \psi_1\rangle = +RVRV\lvert 0\rangle, \\
\lvert \psi_3\rangle &= -RV\lvert \psi_2\rangle + E^{(2)}R\lvert \psi_1\rangle.
\end{aligned}
$$

## 将教材的二阶求和式写成预解算符形式

下面逐项变形。矩阵元是复数，可以移到右矢的任意一侧。两个能量分母同时换号时，整体符号保持不变，见[式 1](#eq-sign)。

教材中的二阶波函数（不含直接归一化 $\lvert 0\rangle$ 项）为：

$$
\begin{aligned}
\lvert \psi_2\rangle &= \sum_{n\neq 0}\sum_{m\neq 0}\frac{\langle n\lvert V\rvert m\rangle\langle m\lvert V\rvert 0\rangle}{(E_0 - E_n)(E_0 - E_m)}\lvert n\rangle \\
&\quad - \sum_{n\neq 0}\frac{\langle 0\lvert V\rvert 0\rangle\langle n\lvert V\rvert 0\rangle}{(E_0 - E_n)^2}\lvert n\rangle.
\end{aligned}
$$

### 1. 化简第一项

把右矢 $\lvert n\rangle$ 挪到最左端，并用 $(E_0 - E_n)(E_0 - E_m) = (E_n - E_0)(E_m - E_0)$ 消去分母负号：

$$
\begin{aligned}
&\sum_{n\neq 0}\sum_{m\neq 0}\frac{\langle n\lvert V\rvert m\rangle\langle m\lvert V\rvert 0\rangle}{(E_0 - E_n)(E_0 - E_m)}\lvert n\rangle\\
&= \sum_{n\neq 0}\sum_{m\neq 0}\frac{\lvert n\rangle\langle n\lvert V\rvert m\rangle\langle m\lvert V\rvert 0\rangle}{(E_n - E_0)(E_m - E_0)} \\
&= \left(\sum_{n\neq 0}\frac{\lvert n\rangle\langle n\rvert}{E_n - E_0}\right) V
\left(\sum_{m\neq 0}\frac{\lvert m\rangle\langle m\rvert}{E_m - E_0}\right) V\lvert 0\rangle\\
&= RVRV\lvert 0\rangle.
\end{aligned}
$$

### 2. 化简第二项

注意 $\langle 0\lvert V\rvert 0\rangle=E^{(1)}$ 是常数，可提到求和号外；把 $\lvert n\rangle$ 挪到 $\langle n\lvert V\rvert 0\rangle$ 左侧，并利用 $(E_0 - E_n)^2=(E_n - E_0)^2$ 与式 [预解算符平方（式 2）](#eq-r-square)：

$$
\begin{aligned}
&-\sum_{n\neq 0}\frac{\langle 0\lvert V\rvert 0\rangle\langle n\lvert V\rvert 0\rangle}{(E_0 - E_n)^2}\lvert n\rangle \\
&= -E^{(1)}\left(\sum_{n\neq 0}\frac{\lvert n\rangle\langle n\rvert}{(E_n - E_0)^2}\right)V\lvert 0\rangle \\
&= -E^{(1)}R^2V\lvert 0\rangle.
\end{aligned}
$$

### 3. 代入一阶波函数

由于 $RV\lvert 0\rangle=-\lvert \psi_1\rangle$，直接代入上面两项末尾的 $RV\lvert 0\rangle$：

$$
\begin{aligned}
\lvert \psi_2\rangle &= RV\big(RV\lvert 0\rangle\big) - E^{(1)}R\big(RV\lvert 0\rangle\big) \\
&= RV(-\lvert \psi_1\rangle) - E^{(1)}R(-\lvert \psi_1\rangle) \\
&= -RV\lvert \psi_1\rangle + E^{(1)}R\lvert \psi_1\rangle.
\end{aligned}
$$

[公式速查表](#formula-comparison)汇总了一至三阶的常用公式，记 $V_{nm}=\langle n\lvert V\rvert m\rangle$。表中的波函数修正采用中间归一化。

<span id="formula-comparison"></span>

**教材显式求和与预解算符写法对照**

| 物理量 | 量子力学教材显式求和写法 | 预解算符 $R$ 紧凑写法 |
| --- | --- | --- |
| 一阶能量 $E^{(1)}$ | $\langle 0\lvert V\rvert 0\rangle$ | $\langle 0\lvert V\rvert 0\rangle$ |
| 一阶波函数 $\lvert \psi_1\rangle$ | $\displaystyle\sum_{n\neq 0}\frac{\langle n\lvert V\rvert 0\rangle}{E_0 - E_n}\lvert n\rangle$ | $-RV\lvert 0\rangle$ |
| 二阶能量 $E^{(2)}$ | $\displaystyle\sum_{n\neq 0}\frac{\lvert\langle n\lvert V\rvert 0\rangle\rvert^2}{E_0 - E_n}$ | $-\langle 0\lvert VRV\rvert 0\rangle$ |
| 二阶波函数 $\lvert \psi_2\rangle$ | $\displaystyle\sum_{n,m\neq 0}\frac{V_{nm}V_{m0}}{(E_0-E_n)(E_0-E_m)}\lvert n\rangle-\sum_{n\neq 0}\frac{V_{00}V_{n0}}{(E_0-E_n)^2}\lvert n\rangle$ | $RVRV\lvert 0\rangle-E^{(1)}R^2V\lvert 0\rangle$ |
| 三阶能量 $E^{(3)}$ | $\displaystyle\sum_{n,m\neq 0}\frac{V_{0n}V_{nm}V_{m0}}{(E_0-E_n)(E_0-E_m)}-V_{00}\sum_{n\neq 0}\frac{\lvert V_{n0}\rvert^2}{(E_0-E_n)^2}$ | $\langle 0\lvert VRVRV\rvert 0\rangle-E^{(1)}\langle 0\lvert VR^2V\rvert 0\rangle$ |

## 多体系统中的实际优势与 BWPT 对比

### 算符期望值计算与非连通体相激发的自然抵消

采用中间归一化后，$\hat{O}$ 的精确基态期望值可以写成分子与范数平方的比值。

$$
\begin{aligned}
\langle\hat{O}\rangle
&= \frac{\langle \widetilde{\Psi}\lvert \hat{O}\rvert \widetilde{\Psi}\rangle}{\langle \widetilde{\Psi}\vert \widetilde{\Psi}\rangle}\\
&= \frac{M_0+\lambda M_1+\lambda^2 M_2+O(\lambda^3)}
{1 + \lambda^2\langle \psi_1\vert \psi_1\rangle + O(\lambda^3)}.
\end{aligned}
$$

取 $\hat{O}$ 为厄米算符，分子的各阶系数可用复共轭项 $\text{c.c.}$ 简写。

$$
\begin{aligned}
M_0 &= \langle 0\lvert \hat{O}\rvert 0\rangle,\\
M_1 &= \langle 0\lvert \hat{O}\rvert \psi_1\rangle+\text{c.c.},\\
M_2 &= \langle 0\lvert \hat{O}\rvert \psi_2\rangle+\text{c.c.}\\
&\quad +\langle \psi_1\lvert \hat{O}\rvert \psi_1\rangle.
\end{aligned}
$$

在多体晶格模型中，若某些虚激发与观测区域分离，且它们的贡献能与观测区域的矩阵元因子化，这些非连通贡献就会在分子和分母中逐阶抵消。例如，若二阶体相贡献在两处都给出因子 $1+\lambda^2\sum_{b\in\text{bulk}}\lvert c_b\rvert^2$（$c_b$ 为相应虚激发的一阶振幅），保留到二阶时这个因子就会约去。对于子区域无序算符 $\hat{U}_M(\theta)$，需根据具体模型和算符的空间支撑判断哪些贡献满足这一条件。

### 与布里渊–维格纳微扰论对比

布里渊–维格纳微扰论（Brillouin–Wigner perturbation theory, BWPT）把未知的精确能量 $E$ 留在分母里。以下逆算符在 $Q$ 子空间上取逆。将方程形式迭代，得到

$$
\begin{aligned}
\lvert \widetilde{\Psi}\rangle &= \lvert 0\rangle + \frac{Q}{E - H_0}\lambda V\lvert \widetilde{\Psi}\rangle \\
&= \lvert 0\rangle + \sum_{k=1}^\infty \left(\frac{Q}{E - H_0}\lambda V\right)^k\lvert 0\rangle, \\
E &= E_0 + \lambda\langle 0\lvert V\rvert \widetilde{\Psi}\rangle.
\end{aligned}
$$

BWPT 的递推式把能量修正隐含在 $E-E_n$ 中。常规 BWPT 在有限阶截断时一般不保证广延性，例如独立子系统的能量修正未必能直接相加。[RSPT 与 BWPT 对照表](#method-comparison)汇总了两种写法的差异。

<span id="method-comparison"></span>

**瑞利–薛定谔与布里渊–维格纳微扰论对照**

| 对比维度 | 瑞利–薛定谔微扰论（RSPT） | 布里渊–维格纳微扰论（BWPT） |
| --- | --- | --- |
| 能量分母 | 已知未扰能量 $E_n - E_0$ | 未知精确能量 $E - E_n$（需自洽求解） |
| 高阶表达式 | 出现 $E^{(1)}, E^{(2)}$ 等扣除项 | 通过含 $E$ 的分母自洽求解 |
| $\lambda$ 的幂级数 | 显式按 $\lambda^k$ 严格展开 | 分母隐含 $\lambda$，非显式幂级数 |
| 多体广延性 | 逐阶保持独立子系统能量的可加性 | 常规有限阶截断一般不保证广延性 |
| 典型适用场景 | 凝聚态多体晶格、量子化学、场论微扰 | 少体问题、近简并有效哈密顿量构造 |

## 参考资料

- Barton Zwiebach，《Quantum Physics III》第 1 章，定态微扰论及一、二阶修正。[MIT 课程讲义](https://ocw.mit.edu/courses/8-06-quantum-physics-iii-spring-2016/d7ef4fca98220af90a64670c57eaf046_MIT8_06S16_chap1.pdf)
- Erwin Schrödinger，〈Quantisierung als Eigenwertproblem (Dritte Mitteilung)〉，1926。[原始论文](https://doi.org/10.1002/andp.19263851302)
- Kevin Carter-Fenk 与 Martin Head-Gordon，常规 BWPT 的广延性限制及二阶改进，2023。[原始论文](https://pmc.ncbi.nlm.nih.gov/articles/PMC10284609/)
