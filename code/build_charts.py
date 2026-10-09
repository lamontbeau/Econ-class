# -*- coding: utf-8 -*-
"""三联事件研究图：A 真实平行 / B 预期效应 / C 差异趋势
统一基准期 t=-4，使三类病灶各自可见。配色对齐说课课件。"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

plt.rcParams['font.sans-serif'] = ['Noto Sans CJK JP']
plt.rcParams['axes.unicode_minus'] = False

NAVY, AMBER, RED = '#1E2761', '#B46A00', '#990011'
GRAY, LINE, TEAL = '#5E6A82', '#D3DDEC', '#1C7293'

T = np.array([-4, -3, -2, -1, 0, 1, 2, 3])

# A 组：事前平坦、CI 窄、事后明确跳升 —— 真实满足
A_B = np.array([0.00, -0.02, 0.03, 0.01, 0.31, 0.44, 0.49, 0.53])
A_SE = np.array([0.00, 0.05, 0.05, 0.05, 0.07, 0.08, 0.08, 0.09])

# B 组：t=-1 已显著抬升 —— 预期效应
B_B = np.array([0.00, 0.04, 0.11, 0.24, 0.42, 0.51, 0.55, 0.58])
B_SE = np.array([0.00, 0.05, 0.06, 0.06, 0.07, 0.08, 0.08, 0.09])

# C 组：事前逐个不显著，但连成上升线；事后斜率与事前一致 —— 差异趋势
C_B = np.array([0.00, 0.07, 0.15, 0.22, 0.30, 0.38, 0.44, 0.51])
C_SE = np.array([0.00, 0.09, 0.10, 0.12, 0.13, 0.14, 0.15, 0.16])

CASES = [
    ('A 组', A_B, A_SE, '可信', TEAL,
     '事前系数紧贴零线且置信区间窄\n事后出现明确跳升'),
    ('B 组', B_B, B_SE, '不可信 · 预期效应', RED,
     't = −1 已显著抬升\n政策在实施前已被预期'),
    ('C 组', C_B, C_SE, '不可信 · 差异趋势', RED,
     '事前系数逐个不显著，但连成上升直线\n事后斜率与事前完全一致'),
]


def panel(ax, name, b, se, verdict, vc, note, mark_pre_trend=False,
          mark_idx=None):
    ci = 1.96 * se
    pre, post = T < 0, T >= 0
    ax.axhline(0, color=GRAY, lw=0.9, zorder=1)
    ax.axvline(-0.5, color=AMBER, lw=1.3, ls='--', zorder=1)

    if mark_pre_trend:
        k = np.polyfit(T[pre], b[pre], 1)
        xs = np.linspace(-4.3, 3.3, 50)
        ax.plot(xs, np.polyval(k, xs), color=RED, lw=1.15, ls=(0, (5, 3)),
                alpha=.75, zorder=2)
        ax.annotate('事前趋势外推线\n事后各点几乎全部落在线上',
                    xy=(2.15, np.polyval(k, 2.15)), xytext=(-3.75, 0.60),
                    fontsize=8.6, color=RED, va='top', linespacing=1.5,
                    arrowprops=dict(arrowstyle='->', color=RED, lw=.95,
                                    shrinkA=2, shrinkB=3,
                                    connectionstyle='arc3,rad=-.22'))

    for m, col, ms in ((pre, NAVY, 5.6), (post, NAVY, 5.6)):
        ax.errorbar(T[m], b[m], yerr=ci[m], fmt='o', ms=ms, mfc='white',
                    mec=col, mew=1.5, ecolor=col, elinewidth=1.15,
                    capsize=3.4, capthick=1.15, zorder=4)
    ax.plot(T[0], b[0], 'o', ms=6.2, mfc=LINE, mec=GRAY, mew=1.4, zorder=5)

    if mark_idx is not None:
        ax.errorbar(T[mark_idx], b[mark_idx], yerr=ci[mark_idx], fmt='o',
                    ms=7.2, mfc=RED, mec=RED, mew=1.5, ecolor=RED,
                    elinewidth=1.7, capsize=4, capthick=1.7, zorder=6)
        ax.annotate('t = −1 的置信区间已不含 0',
                    xy=(T[mark_idx], b[mark_idx] + ci[mark_idx]),
                    xytext=(-3.85, 0.72), fontsize=8.6, color=RED, ha='left',
                    va='top',
                    arrowprops=dict(arrowstyle='->', color=RED, lw=.95,
                                    shrinkA=2, shrinkB=4,
                                    connectionstyle='arc3,rad=.2'))

    ax.set_title(name, fontsize=13.5, fontweight='bold', color=NAVY, pad=24)
    ax.text(.5, 1.017, verdict, transform=ax.transAxes, ha='center',
            fontsize=9.8, fontweight='bold', color=vc)
    ax.text(.028, .034, note, transform=ax.transAxes, fontsize=8.5,
            color=GRAY, va='bottom', linespacing=1.55)
    ax.set_xlabel('相对政策时点  t', fontsize=9.8, color=GRAY, labelpad=5)
    ax.set_xticks(T)
    ax.set_xticklabels([f'−{abs(v)}' if v < 0 else str(v) for v in T])
    ax.set_xlim(-4.55, 3.55)
    ax.set_ylim(-0.42, 0.88)
    ax.tick_params(labelsize=9, colors=GRAY, length=3)
    for sp in ('top', 'right'):
        ax.spines[sp].set_visible(False)
    for sp in ('left', 'bottom'):
        ax.spines[sp].set_color(LINE)
    ax.grid(axis='y', color=LINE, lw=.7, alpha=.75)
    ax.set_axisbelow(True)


def build(fname, cases, figsize=(13.6, 4.5), sup=True):
    fig, axes = plt.subplots(1, len(cases), figsize=figsize)
    if len(cases) == 1:
        axes = [axes]
    for ax, (name, b, se, verdict, vc, note) in zip(axes, cases):
        panel(ax, name, b, se, verdict, vc, note,
              mark_pre_trend=name == 'C 组',
              mark_idx=3 if name == 'B 组' else None)
    axes[0].set_ylabel('估计系数（95% 置信区间）', fontsize=9.8, color=GRAY,
                       labelpad=7)
    if sup:
        fig.text(.5, .022,
                 '三组均以 t = −4 为基准期（空心灰点）；竖虚线为政策实施时点。'
                 '三张图由 AI 依教师设定的缺陷类型生成，学生在不知真值的前提下双盲研判。',
                 ha='center', fontsize=8.7, color=GRAY)
        fig.subplots_adjust(left=.062, right=.988, top=.825, bottom=.20,
                            wspace=.20)
    else:
        fig.subplots_adjust(left=.155, right=.97, top=.815, bottom=.145)
    fig.savefig(fname, dpi=220, facecolor='white')
    plt.close(fig)
    print('saved:', fname)


build('/sessions/focused-youthful-hawking/mnt/outputs/fig_event3.png', CASES)
for i, c in enumerate(CASES):
    build(f'/sessions/focused-youthful-hawking/mnt/outputs/fig_case{"ABC"[i]}.png',
          [c], figsize=(5.0, 4.5), sup=False)
