// In order to *not* need this ignore, consider extracting the "web" version
// of your plugin as a separate package, instead of inlining it in the same
// package as the core of your plugin.
// ignore: avoid_web_libraries_in_flutter

import 'dart:async';
import 'dart:html' as html;
import 'dart:js' as js;
import 'package:flutter_web_plugins/flutter_web_plugins.dart';

import 'flutter_live2d_platform_interface.dart';

/// A web implementation of the FlutterLive2dPlatform of the FlutterLive2d plugin.
class FlutterLive2dWeb extends FlutterLive2dPlatform {
  /// Constructs a FlutterLive2dWeb
  FlutterLive2dWeb() : super();

  static void registerWith(Registrar registrar) {
    FlutterLive2dPlatform.instance = FlutterLive2dWeb();
  }

  /// Returns a [String] containing the version of the platform.
  @override
  Future<String?> getPlatformVersion() async {
    // 返回浏览器用户代理字符串作为平台版本信息
    final userAgent = html.window.navigator.userAgent;
    return 'Web: $userAgent';
  }

  @override
  Future<void> initLive2d() async {
    // Web平台的初始化逻辑
    try {
      // 调用JavaScript中的initLive2D函数
      final completer = Completer<void>();
      final promise = js.context.callMethod('initLive2D');
      
      final success = js.JsFunction.withThis((js.JsObject self, [var result]) {
        if (!completer.isCompleted) {
          completer.complete();
        }
      });
      
      final error = js.JsFunction.withThis((js.JsObject self, [var errorMsg]) {
        if (!completer.isCompleted) {
          completer.completeError(errorMsg ?? 'Unknown error');
        }
      });
      
      promise.callMethod('then', [success]);
      promise.callMethod('catch', [error]);
      
      await completer.future;
      print('Live2D initialized on Web platform');
    } catch (e) {
      print('Error initializing Live2D on Web platform: $e');
      rethrow;
    }
  }

  @override
  Future<void> loadModel(String modelPath) async {
    // Web平台的加载模型逻辑
    try {
        // 调用JavaScript中的loadModel函数
        js.context.callMethod('loadModel', [modelPath]);
        // 设置触摸事件监听器
        js.context.callMethod('setupTouchEventListeners');
        print('Loading model on Web platform: $modelPath');
    } catch (e) {
        print('Error loading model on Web platform: $e');
        rethrow;
    }
  }

  @override
  Future<void> setScale(double scale) async {
    // Web平台的设置缩放逻辑
    try {
      js.context.callMethod('setScale', [scale]);
      print('Setting scale on Web platform: $scale');
    } catch (e) {
      print('Error setting scale on Web platform: $e');
      rethrow;
    }
  }

  @override
  Future<void> setPosition(double x, double y) async {
    // Web平台的设置位置逻辑
    try {
      js.context.callMethod('setPosition', [x, y]);
      print('Setting position on Web platform: x=$x, y=$y');
    } catch (e) {
      print('Error setting position on Web platform: $e');
      rethrow;
    }
  }

  @override
  Future<void> startMotion(String group, int index) async {
    // Web平台的启动动作逻辑
    try {
      js.context.callMethod('startMotion', [group, index]);
      print('Starting motion on Web platform: group=$group, index=$index');
    } catch (e) {
      print('Error starting motion on Web platform: $e');
      rethrow;
    }
  }

  @override
  Future<void> setExpression(String expression) async {
    // Web平台的设置表情逻辑
    try {
      js.context.callMethod('setExpression', [expression]);
      print('Setting expression on Web platform: $expression');
    } catch (e) {
      print('Error setting expression on Web platform: $e');
      rethrow;
    }
  }
}