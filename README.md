# mpMath — 微信公众号公式编辑插件



### 当前状态（2026-02）

- 当前分支版本在新版微信公众号图文编辑器中已可用（可打开公式面板、插入公式、二次编辑）。
- 已针对 Chrome Manifest V3 和微信编辑器结构变更做兼容修复。
- 若升级后异常，建议先在 `chrome://extensions/` 刷新插件并强制刷新编辑器页面。

### 近期优化项

- 修复 Manifest V3 配置问题（`background.service_worker` 字段与旧 API 兼容问题）。
- 重构注入与初始化流程，避免页面异步加载导致按钮不出现或快捷键失效。
- 修复高频 DOM 监听导致页面卡顿的问题（观察器节流与自动断开）。
- 适配新版微信公众号非 `ueditor iframe` 编辑结构，支持主文档 `contenteditable` 插入。
- 修复“点击插入无反应/插入空白”问题，改为插入可保存的 `svg` 结构。
- 清理无效消息通道，移除 `Could not establish connection` 的扩展报错噪音。

---
以下文档或有延时。查看最新文档：[troyni.com/mpmath](https://troyni.com/mpmath)。
想要在微信公众号的编辑器里输入公式吗？来试试我们的 Chrome 插件吧～

相信不少人有在微信公众号上输入数学公式的需求，而微信至今没有推出官方的公式编辑器。有人被迫去选择一些新的工作流程，比如我在文章《[一道从初中做到大学的数学题](https://mp.weixin.qq.com/s/uCdL9gJUbIs0X5WCXiskgA)》中采用了 TeX -> PDF -> SVG 的制作流程，这对普通用户来说都有一定的门槛。有人妥协，选择用截图来插入公式，或是干脆用文字字符来拼凑公式，而等等这些都有一定的问题。在这样的情况下，我们选择自己写一个插件来满足公众号输入公式的需求。

完全开源。  
能力有限，许多问题尚未解决，许多功能尚未实现。如果大家能提供帮助的话，我们将感激不尽！

### 特性

- 使用 MathJax 渲染 SVG 格式的 LaTeX 公式
- 嵌入微信公众号原生编辑器
- 公式显示清晰、可调字号、支持字体颜色改变、支持 Dark Mode
- 完整的快捷键支持
- 适配通过 [Markdown Nice](https://mdnice.com) 插入的公式

### 下载与安装

#### 方式

- Github：[mpMath](https://github.com/ciaochaos/mpMath)
- 直接下载：[mpMath v0.2.1](https://github.com/ciaochaos/mpMath/releases/download/v0.2.1/mpMath.crx)
- Chrome 应用商店：[mpMath](https://chrome.google.com/webstore/detail/mpmath/nodhgmlcnikgcdfnllmiodlimcdglchh)

#### 安装步骤：

1. 下载 CRX 文件
2. 在 Chrome 中点击右上角 ︙ -> 更多工具 ->  扩展程序  
   或打开 [chrome://extensions/](chrome://extensions/) 
3. 打开右上角开发者模式
4. 将 CRX 文件拖入 Chrome 窗口
5. 单击「添加扩展程序」，安装完成

### 使用

打开微信公众平台图文编辑界面，若 `公式` 已经出现在页面顶部 `音频` 的右侧，则说明插件成功运行。

![](https://troyni.com/assets/building-mpmath/1fa9214e84c1455ee3278fb11b1e391a_MD5.jpg)

点击 `公式` 即可新建公式并插入。点击已经插入的公式即可二次编辑。

> 如果你不太熟悉 LaTeX 语法，可以参考语雀的[数学公式举例](https://www.yuque.com/yuque/help/brzicb)、Apple 的[示例方程](https://support.apple.com/zh-cn/HT202501#sample)，或是这一份 [MathJax 基本教程和快速参考](https://math.meta.stackexchange.com/questions/5020/mathjax-basic-tutorial-and-quick-reference)（英文）。

> 如果你正在寻找基于 TeX 编写的数学题，推荐一个网站：[橘子数学](https://www.mathcrowd.cn/)。

> 如果你偏好非所见即所得的写作方式，试试这个：[Markdown Nice](https://mdnice.com)，同样对数学公式有着很好的支持。

强烈推荐使用以下快捷键，提高输入效率。

#### 快捷键

| 操作         | 快捷键                                                       |
| ------------ | ------------------------------------------------------------ |
| 新建公式     | <kbd>control</kbd> + <kbd>/</kbd><br /><kbd>command</kbd> + <kbd>/</kbd> |
| 退出公式编辑 | <kbd>esc</kbd>                                               |
| 插入公式     | <kbd>shift</kbd> + <kbd>enter</kbd>                          |

#### 可能遇到的问题

- 输入行内公式的显式样式
  - 公式前添加 `\displaystyle`
- 公式右侧的空格会与公式捆绑在一起
  - 可以在空格右侧使用 <kbd>shift</kbd> + <kbd>←</kbd> 选中空格并删除
- 公式不能被高亮选中、拖动
  - 可同时选中公式左右侧的字符进行复制等操作

### 反馈

- 本页评论区
- 邮箱：1272777550@qq.com
- 微信：nhciao
- 微信公众号：Isle of Chaos

### 开发计划

- 公式输入提示
- 如 Typora 等的无模态弹窗公式输入
- 一键转换 LaTeX 公式

### 许可

[The MIT License](https://opensource.org/licenses/MIT)

### 作者

- ciaochaos - CUC
- CPunisher - BUAA
