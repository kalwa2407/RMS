# Capacitor / WebView bridge — must not be obfuscated
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep line numbers for crash reports
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# AndroidX / AppCompat
-keep class androidx.** { *; }
-dontwarn androidx.**

# Firebase Authentication plugin -- suppress missing Facebook SDK classes (not used)
-dontwarn com.facebook.**
-keep class io.capawesome.capacitorjs.plugins.firebase.authentication.** { *; }

# Firebase SDK
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Google Sign-In
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**
