# Flutter Live2D Web 平台实现指南

## 概述

本文档介绍了如何完善 flutter_live2d 插件的 Web 平台演示。当前实现是一个基础框架，展示了如何为 Web 平台添加支持，但需要进一步开发才能实现完整的 Live2D 功能。

## 当前实现状态

目前的 Web 实现包括：
1. 基础的平台接口实现
2. Web 特定的入口点注册
3. 占位符形式的 Live2D Core JS 文件
4. 示例应用程序中区分移动端和 Web 端的 UI

## 完善 Web 平台演示的步骤

### 1. 集成真正的 Live2D Web SDK

#### 步骤 1: 获取 Live2D Web SDK
1. 从 Live2D 官网下载 Cubism SDK for Web
2. 解压 SDK 包并找到 Core 和 Framework 文件

#### 步骤 2: 集成 Core 库
1. 将 `Core/live2dcubismcore.min.js` 复制到 `example/web/` 目录
2. 更新 `example/web/index.html` 中的脚本引用

#### 步骤 3: 集成 Framework
1. 将 Framework 编译为单个 JS 文件，或将源文件直接引入项目
2. 在 `example/web/index.html` 中添加对 Framework 的引用

### 2. 实现完整的 Web 平台功能

#### 更新 flutter_live2d_web.dart

需要替换当前的占位符实现，添加真实的 Web 功能：

```dart
// 真实实现应该类似这样：
@override
Future<void> loadModel(String modelPath) async {
  // 调用 JavaScript 中的 Live2D 功能加载模型
  js.context.callMethod('loadLive2DModel', [modelPath]);
}
```

#### 实现 JavaScript Bridge

在 Web 端实现与 Dart 代码的桥接：

1. 创建 `example/web/live2d_bridge.js` 文件
2. 实现模型加载、动作播放、表情切换等功能
3. 提供 JavaScript API 供 Dart 通过 `dart:js` 调用

### 3. 创建 WebGL 渲染容器

#### 更新 index.html
```html
<!-- 添加用于渲染 Live2D 模型的 Canvas -->
<canvas id="live2d-canvas" width="800" height="600" style="border: 1px solid #ccc;"></canvas>
```

#### 实现 Canvas 渲染逻辑
在 JavaScript 中实现：
1. 初始化 WebGL 上下文
2. 设置投影矩阵
3. 实现渲染循环
4. 处理模型交互

### 4. 完善示例应用

#### 更新 main.dart
当前示例应用已经区分了移动端和 Web 端，但 Web 端只是一个占位符。需要：

1. 添加真实的 Web UI 控件
2. 实现与 Web 平台功能的交互
3. 添加错误处理和加载状态提示

### 5. 构建和测试

#### 本地测试
```bash
cd flutter_live2d/example
flutter run -d chrome
```

#### 生产构建
```bash
flutter build web
```

## 详细实现指南

### Live2D Web SDK 集成

参考 Cubism SDK for Web 的官方示例，主要组件包括：

1. **Core 库** - 提供底层模型处理功能
2. **Framework** - 提供高级功能如动画、物理、交互等
3. **渲染器** - 处理 WebGL 渲染

### 关键功能实现

#### 1. 模型加载
```javascript
// JavaScript 实现示例
function loadModel(modelPath) {
  // 1. 获取模型文件 (.model3.json)
  // 2. 解析模型设置
  // 3. 加载纹理和 moc 文件
  // 4. 创建 CubismModel 实例
}
```

#### 2. 动作播放
```javascript
function startMotion(group, index) {
  // 1. 根据组名和索引查找动作文件
  // 2. 加载并解析 .motion3.json 文件
  // 3. 使用 CubismMotion 播放动作
}
```

#### 3. 表情切换
```javascript
function setExpression(expressionId) {
  // 1. 查找对应的表情文件
  // 2. 加载并解析 .exp3.json 文件
  // 3. 使用 CubismExpressionMotion 应用表情
}
```

#### 4. 渲染循环
```javascript
function renderLoop() {
  // 1. 清除画布
  // 2. 更新模型参数
  // 3. 调用渲染器绘制模型
  // 4. 请求下一帧
  requestAnimationFrame(renderLoop);
}
```

## 注意事项

1. **跨域问题**：Web 平台需要注意模型资源的加载策略
2. **性能优化**：WebGL 渲染需要考虑性能优化
3. **浏览器兼容性**：确保在主流浏览器上正常工作
4. **响应式设计**：Canvas 大小应适应不同屏幕尺寸

## 参考资源

1. [Live2D Cubism SDK for Web 官方文档](https://docs.live2d.com/cubism-sdk-manual/top/)
2. [Web SDK 示例代码](file:///e%3A/develop/AI/xiaozhi-android/flutter_live2d/sdk/CubismSdkForWeb-5-r.4/Samples/TypeScript/Demo/)
3. [Core API 参考](file:///e%3A/develop/AI/xiaozhi-android/flutter_live2d/sdk/CubismSdkForWeb-5-r.4/Core/live2dcubismcore.d.ts)

通过以上步骤，您可以将 flutter_live2d 插件的 Web 平台演示完善为具有完整功能的实现。