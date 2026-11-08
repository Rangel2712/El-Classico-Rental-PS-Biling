plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.elclassico.billing"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.elclassico.billing"
        minSdk = 21
        targetSdk = 33
        versionCode = 1
        versionName = "1.0.0"
    }
    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
            // Ditandatangani dengan debug key agar langsung bisa dipasang (sideload)
            signingConfig = signingConfigs.getByName("debug")
        }
    }
    buildFeatures { buildConfig = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    lint { abortOnError = false; checkReleaseBuilds = false }
}

// Salin tampilan TV terbaru dari folder server agar APK & browser selalu sama
val copyTvAssets by tasks.registering(Copy::class) {
    from("../../server/public") { include("tv.html", "tv.css", "tv.js") }
    into("src/main/assets/tv")
}
tasks.named("preBuild") { dependsOn(copyTvAssets) }

dependencies {
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
}
