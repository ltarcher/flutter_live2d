# Keep Live2D SDK classes to prevent R8 from removing them
-keep class com.live2d.sdk.cubism.core.** { *; }
-keep class com.live2d.sdk.cubism.framework.** { *; }

# Preserve line number information for debugging stack traces
-keepattributes SourceFile,LineNumberTable

# Prevent renaming of source file attribute
-renamesourcefileattribute SourceFile

# Keep all native method names and classes needed for JNI
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep classes that are accessed via reflection
-keep class com.live2d.** { *; }

# Keep the specific classes mentioned in the error logs
-keep class com.live2d.sdk.cubism.core.CubismCanvasInfo
-keep class com.live2d.sdk.cubism.core.CubismCoreVersion
-keep class com.live2d.sdk.cubism.core.CubismDrawableView
-keep class com.live2d.sdk.cubism.core.CubismDrawables
-keep class com.live2d.sdk.cubism.core.CubismMoc
-keep class com.live2d.sdk.cubism.core.CubismModel
-keep class com.live2d.sdk.cubism.core.CubismParameterView
-keep class com.live2d.sdk.cubism.core.CubismPartView
-keep class com.live2d.sdk.cubism.core.ICubismLogger
-keep class com.live2d.sdk.cubism.core.Live2DCubismCore