package com.elclassico.billing

import android.content.Context
import android.content.SharedPreferences
import android.os.Handler
import android.os.Looper

/** Penyimpanan pengaturan aplikasi TV. */
object Prefs {
    private fun sp(c: Context): SharedPreferences = c.getSharedPreferences("elclassico", Context.MODE_PRIVATE)

    fun host(c: Context): String = sp(c).getString("host", "") ?: ""
    fun port(c: Context): Int = sp(c).getInt("port", 8080)
    fun unit(c: Context): String = sp(c).getString("unit", "tv1") ?: "tv1"
    fun hdmiInput(c: Context): String = sp(c).getString("hdmi", "") ?: ""
    fun hdmiLabel(c: Context): String = sp(c).getString("hdmiLabel", "") ?: ""
    fun pin(c: Context): String = sp(c).getString("pin", "1234") ?: "1234"
    fun autoStart(c: Context): Boolean = sp(c).getBoolean("autoStart", true)
    fun configured(c: Context): Boolean = sp(c).getBoolean("configured", false)

    fun save(
        c: Context, host: String, port: Int, unit: String, hdmi: String, hdmiLabel: String,
        pin: String, autoStart: Boolean
    ) {
        sp(c).edit()
            .putString("host", host.trim())
            .putInt("port", port)
            .putString("unit", unit.trim().ifEmpty { "tv1" })
            .putString("hdmi", hdmi)
            .putString("hdmiLabel", hdmiLabel)
            .putString("pin", pin.ifEmpty { "1234" })
            .putBoolean("autoStart", autoStart)
            .putBoolean("configured", true)
            .apply()
    }

    fun setServer(c: Context, host: String, port: Int) {
        sp(c).edit().putString("host", host).putInt("port", port).apply()
    }
}

/**
 * Bus sederhana antara BillingService dan WebView (layar kunci & overlay).
 * Semua callback dijalankan di main thread.
 */
object Bus {
    interface Listener {
        fun onServerMessage(raw: String, isCmd: Boolean)
        fun onConnection(connected: Boolean)
        fun onMode(mode: String)
    }

    private val main = Handler(Looper.getMainLooper())
    private val listeners = LinkedHashSet<Listener>()

    @Volatile var lastState: String? = null
    @Volatile var connected: Boolean = false
    @Volatile var mode: String = "lock" // "lock" atau "play"

    fun add(l: Listener) = main.post { listeners.add(l) }
    fun remove(l: Listener) = main.post { listeners.remove(l) }

    fun state(raw: String) {
        lastState = raw
        main.post { listeners.toList().forEach { it.onServerMessage(raw, false) } }
    }

    fun cmd(raw: String) = main.post { listeners.toList().forEach { it.onServerMessage(raw, true) } }

    fun conn(on: Boolean) {
        connected = on
        main.post { listeners.toList().forEach { it.onConnection(on) } }
    }

    fun setMode(m: String) {
        mode = m
        main.post { listeners.toList().forEach { it.onMode(m) } }
    }
}
