---
name: vue-config
description: 在 Vue 页面和组件开发中，组织可调配置、props、computed 与 CSS 变量，避免把业务参数和内部样式细节混在一起。适用于 Vue 2、Vue 2.7、Vue 3、H5、小游戏和业务组件开发。
---

# Vue 组件可调参数配置规范

## 1. 适用场景

当开发 Vue 页面或公共组件时，如果组件包含需要调试、验收、AB 调整、不同页面差异化配置的参数，应遵守本规则。

本规则适用于：

- Vue 2 / Vue 2.7
- Vue 3
- H5 页面
- 小游戏、活动页、工具页、业务表单页
- 公共组件和业务页面组合开发

目标是让 AI 写出的 Vue 代码更方便人类在代码里 review，也更方便在 Vue Devtools 里调试。

---

## 2. 总原则

除了颜色、固定文案、图标资源这类确实稳定、不需要业务调试的静态配置，可以写在组件内部，其余需要调试或可能变化的参数不要直接写死在子组件 props 里。

但也不要把所有细节都 props 化。props 应该表达“组件对外开放的能力”，而不是暴露组件内部每一个 CSS 细节。

优先抽到父组件配置对象里的参数：

- 组件整体尺寸、整体缩放比例
- 组件外部可感知的宽高
- 组件整体密度或尺寸档位，例如 `sizeScale`、`size`、`density`
- 业务开关状态，例如是否展示分数、是否自动跳转
- 业务展示文案，例如标题、提示文案、按钮文案
- 业务数量和规则，例如题目数量、每关数量、计分规则
- 业务阈值，例如最大次数、最短时间、正确率阈值
- 需要在 Vue Devtools 中临时调试的动画时长或交互阈值

不建议抽成 props 的参数：

- 子组件内部某个局部元素的 padding、margin、border-radius
- 某个小图标和文字之间的细碎 gap
- 纯装饰颜色、阴影、边框、背景
- hover / active 的视觉细节
- 只服务当前组件内部实现的临时常量
- 不希望业务页面感知的内部排版细节

判断标准：

- 如果父组件或产品验收会直接关心它，可以做成 prop。
- 如果它只是子组件内部为了实现视觉而存在，应留在子组件 CSS、class 或 CSS 变量里。
- 如果参数会让子组件 props 列表膨胀到难以理解，应优先合并成少量语义化 prop，例如 `sizeScale`，不要拆成十几个尺寸 prop。

不推荐：

```vue
<GameHudHeader
  title="句子拼拼乐"
  :size-scale="1.35"
  :mascot-size="180"
  :bubble-padding-y="24"
  :bubble-padding-x="28"
  :stat-card-gap="26"
  :title-line-height="1.28"
  :show-score="true"
  group-suffix="个句子"
/>
```

推荐：

```vue
<GameHudHeader
  :title="hudConfig.title"
  :size-scale="hudConfig.sizeScale"
  :show-score="hudConfig.showScore"
  :group-suffix="hudConfig.groupSuffix"
/>
```

如果确实需要更多调节，优先使用语义化 prop 或档位，不要暴露一堆 CSS 细节：

```vue
<GameHudHeader
  :title="hudConfig.title"
  :size-scale="hudConfig.sizeScale"
  :density="hudConfig.density"
/>
```

---

## 3. Vue 2 / Vue 2.7 写法

Vue 2 页面优先使用 `data()` 返回配置对象，方便 Vue Devtools 直接查看和临时修改。

推荐：

```ts
export default defineComponent({
  data() {
    return {
      hudConfig: {
        title: '句子拼拼乐',
        sizeScale: 1.35,
        mascotSize: 180,
        showScore: true,
        tipLabel: '小雨点提示：',
        groupSuffix: '个句子',
      },
    };
  },
});
```

如果页面已经使用 Vue 2.7 `setup()`，仍可把“可调配置”放在 Options API 的 `data()` 中，把依赖游戏状态的值放在 `computed` 中合成。

推荐：

```ts
export default defineComponent({
  data() {
    return {
      hudConfig: {
        title: '句子拼拼乐',
        sizeScale: 1.35,
        mascotSize: 180,
      },
    };
  },
  computed: {
    resolvedHudConfig() {
      return {
        ...this.hudConfig,
        tipText: this.tipText,
        level: this.currentLevel,
        score: this.totalScore,
      };
    },
  },
  setup() {
    // 游戏状态、交互逻辑、生命周期仍可放在 setup 中。
  },
});
```

模板中统一读取合成后的配置：

```vue
<GameHudHeader
  :title="resolvedHudConfig.title"
  :tip-text="resolvedHudConfig.tipText"
  :level="resolvedHudConfig.level"
  :score="resolvedHudConfig.score"
  :size-scale="resolvedHudConfig.sizeScale"
/>
```

---

## 4. Vue 3 写法

Vue 3 页面使用 `reactive` 或 `ref` 定义配置对象。

推荐：

```ts
const hudConfig = reactive({
  title: '句子拼拼乐',
  sizeScale: 1.35,
  mascotSize: 180,
  showScore: true,
});
```

如果配置依赖运行状态，用 `computed` 合成：

```ts
const resolvedHudConfig = computed(() => ({
  ...hudConfig,
  tipText: tipText.value,
  level: currentLevel.value,
  score: totalScore.value,
}));
```

---

## 5. 分组规则

不要把很多零散变量散在 `data`、`setup` 或组件顶层。

按模块分组：

- `hudConfig`：顶部信息栏、标题、进度、分数、提示区
- `layoutConfig`：页面布局、区域高度、间距、缩放
- `gameConfig`：玩法规则、题目数量、判定阈值、计分规则
- `animationConfig`：动画时长、缓动、延迟
- `modalConfig`：弹窗文案、自动跳转、按钮文案
- `audioConfig`：音效开关、音量、资源配置

示例：

```ts
data() {
  return {
    hudConfig: {
      sizeScale: 1.35,
      showScore: true,
    },
    gameConfig: {
      sentencesPerLevel: 3,
      scorePerSentence: 10,
    },
    animationConfig: {
      chipFlyDuration: 0.38,
      wrongShakeDuration: 0.42,
    },
  };
}
```

---

## 6. 子组件规则

子组件仍然通过 props 接收配置，不要直接修改 props。

推荐：

```ts
props: {
  sizeScale: {
    type: Number,
    default: 1,
  },
}
```

子组件内部如果需要派生值，应使用 `computed`：

```ts
const headerStyle = computed(() => ({
  zoom: props.sizeScale || 1,
}));
```

不要在子组件里直接写死业务页面专属数值。

---

## 7. 动态值规则

如果某个值依赖屏幕尺寸、路由参数、用户状态、游戏状态、接口数据，不要硬编码到配置对象里。

应使用 `computed` 或函数生成：

```ts
computed: {
  resolvedHudConfig() {
    return {
      ...this.hudConfig,
      groupCount: this.totalCount,
      matchedCount: this.matchedCount,
    };
  },
}
```

---

## 8. CSS 变量和 class 的使用边界

如果只是纯 CSS 视觉样式，并且不参与 JS 逻辑，优先使用 CSS 变量或 class。

适合 CSS 变量 / class：

- 颜色
- 背景
- 边框
- 阴影
- hover / active 视觉状态
- 纯样式主题
- 不需要 Vue Devtools 调的设计 token

适合 props + 父级配置对象：

- 组件整体缩放
- 组件整体宽高
- 组件尺寸档位或密度
- 是否展示某块内容
- 展示文案
- 数量、阈值、规则
- 动画时长
- 需要 Vue Devtools 调试的参数

组件内部可以继续用 CSS 变量承接 props，但业务页面不应该依赖“搜索某个 CSS 变量”才能知道如何配置组件。

---

## 9. Devtools 调试约定

为了方便 Vue Devtools 调试：

1. 可调配置必须集中在父组件的配置对象中。
2. 配置对象命名要表达模块含义，例如 `hudConfig`。
3. 调试时优先选择页面级父组件，而不是公共子组件。
4. 子组件 props 只作为接收端，不作为主要调试入口。

示例：

```text
Vue Devtools
  MiniGamesSentencePuzzle
    data
      hudConfig
        sizeScale
        mascotSize
        showScore
```

---

## 10. AI 生成代码要求

AI 在生成或修改 Vue 组件时，应主动检查：

- 是否把可调参数直接写死在模板 props 中；
- 是否把多个可调参数散落在 `data` 或 `setup` 中；
- 是否应该抽成 `hudConfig`、`layoutConfig`、`gameConfig` 等对象；
- 是否把过多内部样式细节暴露成 props；
- 是否可以用一个语义化 prop 代替多个细碎尺寸 prop；
- 是否把依赖状态的值错误地写成静态配置；
- 是否把纯 CSS 视觉样式过度 JS props 化；
- 是否保持现有功能和默认视觉不变。

修改已有代码时，应优先做结构调整，不要顺手改视觉。
