import 'dart:async';
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_live2d/flutter_live2d.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  String _platformVersion = 'Unknown';
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    initPlatformState();
  }

  // Platform messages are asynchronous, so we initialize in an async method.
  Future<void> initPlatformState() async {
    String platformVersion;
    // Platform messages may fail, so we use a try/catch PlatformException.
    // We also handle the message potentially returning null.
    try {
      platformVersion = (await FlutterLive2d.getPlatformVersion()) ?? 'Unknown platform version';
    } on PlatformException {
      platformVersion = 'Failed to get platform version.';
    }

    // If the widget was removed from the tree while the asynchronous platform
    // message was in flight, we want to discard the reply rather than calling
    // setState to update our non-existent appearance.
    if (!mounted) return;

    setState(() {
      _platformVersion = platformVersion;
    });

    // 初始化Live2D
    await _initLive2D();
  }

  Future<void> _initLive2D() async {
    try {
      await FlutterLive2d.initLive2d();
      await Future.delayed(Duration(milliseconds: 500));
      await FlutterLive2d.loadModel("assets/live2d/Haru/Haru.model3.json");
      
      if (mounted) {
        setState(() {
          _isInitialized = true;
        });
      }
    } catch (e) {
      print("初始化失败: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          title: const Text('Plugin example app'),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Running on: $_platformVersion\n'),
              SizedBox(height: 20),
              Text('Live2D Demo (Web and Mobile)'),
              SizedBox(height: 20),
              if (!kIsWeb && (Platform.isAndroid || Platform.isIOS))
                // 移动端使用原生视图
                Container(
                  width: MediaQuery.of(context).size.width,
                  height: MediaQuery.of(context).size.height * 0.6,
                  color: Colors.grey[200],
                  child: AndroidView(
                    viewType: 'live2d_view',
                    creationParams: <String, dynamic>{},
                    creationParamsCodec: const StandardMessageCodec(),
                  ),
                )
              else
                // Web端或其他平台显示替代内容
                Container(
                  width: MediaQuery.of(context).size.width,
                  height: MediaQuery.of(context).size.height * 0.6,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (_isInitialized)
                        Text(
                          'Live2D Model Loaded Successfully!',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.green),
                        )
                      else
                        Text(
                          'Loading Live2D Model...',
                          style: TextStyle(fontSize: 16, color: Colors.orange),
                        ),
                      SizedBox(height: 20),
                      Text(
                        'The Live2D model should appear in the canvas above.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                      ),
                      SizedBox(height: 10),
                      Text(
                        'Use the buttons below to control the model.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
              SizedBox(height: 20),
              Wrap(
                spacing: 10,
                children: [
                  ElevatedButton(
                    onPressed: () => FlutterLive2d.startMotion("idle", 0),
                    child: Text('待机动作'),
                  ),
                  ElevatedButton(
                    onPressed: () => FlutterLive2d.setExpression("smile"),
                    child: Text('微笑表情'),
                  ),
                  ElevatedButton(
                    onPressed: () => FlutterLive2d.setScale(1.5),
                    child: Text('放大'),
                  ),
                  ElevatedButton(
                    onPressed: () => FlutterLive2d.setScale(1.0),
                    child: Text('还原'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}