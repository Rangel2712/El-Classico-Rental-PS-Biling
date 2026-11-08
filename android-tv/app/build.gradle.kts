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
        versionCode = 3
        versionName = "1.2.0"
    }
    // Kunci tanda tangan tetap (disimpan di repo) agar APK versi baru bisa langsung
    // dipasang menimpa versi lama tanpa uninstall.
    signingConfigs {
        create("elclassico") {
            storeFile = file("elclassico.jks")
            storePassword = "elclassico123"
            keyAlias = "elclassico"
            keyPassword = "elclassico123"
        }
    }
    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("elclassico")
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
