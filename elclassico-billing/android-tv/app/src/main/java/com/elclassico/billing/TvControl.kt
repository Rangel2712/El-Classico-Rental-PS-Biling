package com.elclassico.billing

import android.annotation.SuppressLint
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.media.ToneGenerator
import android.media.tv.TvContract
import android.media.tv.TvInputInfo
import android.media.tv.TvInputManager
import android.net.wifi.WifiManager
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import java.net.NetworkInterface

/** Fungsi kontrol perangkat TV: volume, input HDMI, pengaturan, layar. */
object TvControl {

    data class Input(val id: String, val label: String)

    private fun audio(c: Context) = c.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    fun volume(c: Context): Int = audio(c).getStreamVolume(AudioManager.STREAM_MUSIC)
    fun maxVolume(c: Context): Int = audio(c).getStreamMaxVolume(AudioManager.STREAM_MUSIC)

    fun setVolume(c: Context, v: Int) {
        val am = audio(c)
        val target = v.coerceIn(0, am.getStreamMaxVolume(AudioManager.STREAM_MUSIC))
        am.setStreamVolume(AudioManager.STREAM_MUSIC, target, AudioManager.FLAG_SHOW_UI)
    }

    fun volumeStep(c: Context, up: Boolean) {
        audio(c).adjustStreamVolume(
            AudioManager.STREAM_MUSIC,
            if (up) AudioManager.ADJUST_RAISE else AudioManager.ADJUST_LOWER,
            AudioManager.FLAG_SHOW_UI
        )
    }

    @Suppress("DEPRECATION")
    fun toggleMute(c: Context) {
        val am = audio(c)
        if (Build.VERSION.SDK_INT >= 23) {
            am.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_TOGGLE_MUTE, AudioManager.FLAG_SHOW_UI)
        } else {
            am.setStreamMute(AudioManager.STREAM_MUSIC, am.getStreamVolume(AudioManager.STREAM_MUSIC) > 0)
        }
    }

    fun beep() {
        try {
            val tg = ToneGenerator(AudioManager.STREAM_MUSIC, 90)
            tg.startTone(ToneGenerator.TONE_PROP_BEEP2, 600)
            android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({ tg.release() }, 1000)
        } catch (_: Exception) { }
    }

    /** Daftar input HDMI/passthrough yang tersedia di TV. */
    fun inputs(c: Context): List<Input> {
        val out = ArrayList<Input>()
        try {
            val tim = c.getSystemService(Context.TV_INPUT_SERVICE) as? TvInputManager ?: return out
            for (info in tim.tvInputList) {
                if (info.isPassthroughInput || info.type == TvInputInfo.TYPE_HDMI) {
                    val label = try { info.loadLabel(c).toString() } catch (_: Exception) { info.id }
                    out.add(Input(info.id, label))
                }
            }
        } catch (_: Throwable) { }
        return out
    }

    /** Pindah ke input HDMI tempat PlayStation terpasang. */
    fun openHdmi(c: Context, inputId: String): Boolean {
        if (inputId.isEmpty()) return false
        val uri = TvContract.buildChannelUriForPassthroughInput(inputId)
        val attempts = listOf(
            Intent(Intent.ACTION_VIEW, uri),
            Intent(Intent.ACTION_VIEW, uri).setComponent(ComponentName("com.google.android.tv", "com.android.tv.MainActivity")),
            Intent(Intent.ACTION_VIEW, uri).setComponent(ComponentName("com.android.tv", "com.android.tv.MainActivity")),
            Intent(Intent.ACTION_VIEW, uri).setPackage("com.mediatek.wwtv.tvcenter"),
            Intent(Intent.ACTION_VIEW, uri).setPackage("com.tcl.tv"),
            Intent(Intent.ACTION_VIEW, uri).setPackage("com.xiaomi.mitv.tvplayer")
        )
        for (i in attempts) {
            try {
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                c.startActivity(i)
                return true
            } catch (_: Exception) { }
        }
        return false
    }

    fun openSettings(c: Context, action: String = Settings.ACTION_SETTINGS) {
        try {
            c.startActivity(Intent(action).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        } catch (_: Exception) {
            try { c.startActivity(Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (_: Exception) { }
        }
    }

    fun openHome(c: Context) {
        try {
            val i = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            c.startActivity(i)
        } catch (_: Exception) { }
    }

    @Suppress("DEPRECATION")
    @SuppressLint("WakelockTimeout")
    fun wakeScreen(c: Context) {
        try {
            val pm = c.getSystemService(Context.POWER_SERVICE) as PowerManager
            val wl = pm.newWakeLock(
                PowerManager.FULL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
                "elclassico:wake"
            )
            wl.acquire(5000)
        } catch (_: Exception) { }
    }

    @Suppress("DEPRECATION")
    fun isScreenOn(c: Context): Boolean = try {
        val pm = c.getSystemService(Context.POWER_SERVICE) as PowerManager
        if (Build.VERSION.SDK_INT >= 20) pm.isInteractive else pm.isScreenOn
    } catch (_: Exception) { true }

    @Suppress("DEPRECATION")
    fun ip(c: Context): String {
        try {
            val wm = c.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            val ip = wm.connectionInfo?.ipAddress ?: 0
            if (ip != 0) return "${ip and 0xff}.${ip shr 8 and 0xff}.${ip shr 16 and 0xff}.${ip shr 24 and 0xff}"
        } catch (_: Exception) { }
        try {
            for (ni in NetworkInterface.getNetworkInterfaces()) {
                for (a in ni.inetAddresses) {
                    val h = a.hostAddress ?: continue
                    if (!a.isLoopbackAddress && h.indexOf(':') < 0) return h
                }
            }
        } catch (_: Exception) { }
        return ""
    }

    /** MAC untuk Wake-on-LAN (Android baru bisa membatasi; isi manual di server bila kosong). */
    fun mac(): String {
        try {
            val prefer = listOf("eth0", "wlan0")
            val all = NetworkInterface.getNetworkInterfaces().toList()
            for (name in prefer) {
                val ni = all.firstOrNull { it.name == name } ?: continue
                val hw = ni.hardwareAddress ?: continue
                if (hw.size == 6) return hw.joinToString(":") { String.format("%02X", it) }
            }
        } catch (_: Exception) { }
        return ""
    }

    fun canOverlay(c: Context): Boolean =
        Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(c)
}
