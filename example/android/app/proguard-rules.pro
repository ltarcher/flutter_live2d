# Keep the FlutterLive2dPlugin class to prevent R8/ProGuard from removing it
-keep class com.plugin.flutter_live2d.FlutterLive2dPlugin { *; }

# Additional rules to prevent warnings as suggested by the build output
-dontwarn com.plugin.flutter_live2d.FlutterLive2dPlugin