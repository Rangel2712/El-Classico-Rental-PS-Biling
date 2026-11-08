package com.elclassico.billing

import android.annotation.SuppressLint
import android.app.Activity
import android.app.AlertDialog
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.InputType
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import android.widget.Toast
import org.json.JSONObject

/**
 * Layar kunci El Classico (fullscreen). Tampil saat unit kosong, dijeda, atau waktu habis.
 * Menu teknisi: tekan tombol OK/Enter 7× cepat, atau tahan tombol MENU → masukkan PIN.
 */
class MainActivity : Activity(), Bus.Listener {

    companion object { @Volatile var visible = false }

    private lateinit var web: WebView
    private var pageReady = false
    private val main = Handler(Looper.getMainLooper())
    private var okPresses = 0
    private var okFirst = 0L

    @Suppress("DEPRECATION")
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                    WindowManager.LayoutParams.FLAG_FULLSCREEN or
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
        )
        if (Build.VERSION.SDK_INT >= 27) { setShowWhenLocked(true); setTurnScreenOn(true) }

        web = WebView(this)
        web.setBackgroundColor(Color.parseColor("#050912"))
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.settings.mediaPlaybackRequiresUserGesture = false
        web.settings.allowFileAccess = true
        web.isFocusable = false
        web.webChromeClient = WebChromeClient()
        web.webViewClient = WebViewClient()
        web.addJavascriptInterface(Bridge(), "ElNative")
        setContentView(web)
        loadPage()

        BillingService.start(this)
        Bus.add(this)

        if (!Prefs.configured(this)) {
            main.postDelayed({ startActivity(android.content.Intent(this, SetupActivity::class.java)) }, 600)
        } else if (!TvControl.canOverlay(this)) {
            Toast.makeText(this, "Izin overlay belum aktif — timer tidak tampil di atas PS. Buka menu teknisi.", Toast.LENGTH_LONG).show()
        }
    }

    private fun loadPage() {
        pageReady = false
        web.loadUrl("file:///android_asset/tv/tv.html?mode=lock&unit=" + Prefs.unit(this))
    }

    override fun onResume() {
        super.onResume()
        visible = true
        hideSystemUi()
        if (Bus.mode == "play" || Bus.mode == "play-nohdmi") {
            // Sesi sedang berjalan: jangan menutupi PS
            main.postDelayed({ if (Bus.mode.startsWith("play")) moveTaskToBack(true) }, 300)
        }
    }

    override fun onPause() {
        super.onPause()
        visible = false
    }

    override fun onDestroy() {
        Bus.remove(this)
        web.destroy()
        super.onDestroy()
    }

    @Suppress("DEPRECATION")
    private fun hideSystemUi() {
        window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION)
    }

    // ---------------------------------------------------------------- Bus
    override fun onServerMessage(raw: String, isCmd: Boolean) {
        if (!pageReady && !isCmd) return
        web.evaluateJavascript("window.ec&&ec.push(" + JSONObject.quote(raw) + ")", null)
    }

    override fun onConnection(connected: Boolean) {
        if (pageReady) web.evaluateJavascript("window.ec&&ec.conn($connected)", null)
    }

    override fun onMode(mode: String) {
        when (mode) {
            "play-nohdmi" -> if (visible) moveTaskToBack(true)
            "reload" -> loadPage()
        }
    }

    inner class Bridge {
        @JavascriptInterface fun getUnit(): String = Prefs.unit(this@MainActivity)
        @JavascriptInterface fun ready(mode: String) {
            main.post {
                pageReady = true
                Bus.lastState?.let { onServerMessage(it, false) }
                onConnection(Bus.connected)
            }
        }
        @JavascriptInterface fun openSetup() { main.post { askPin() } }
    }

    // ---------------------------------------------------------------- tombol remote
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() { /* dikunci */ }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        val code = event.keyCode
        if (event.action == KeyEvent.ACTION_DOWN) {
            if (code == KeyEvent.KEYCODE_DPAD_CENTER || code == KeyEvent.KEYCODE_ENTER || code == KeyEvent.KEYCODE_NUMPAD_ENTER) {
                val now = System.currentTimeMillis()
                if (now - okFirst > 4000) { okFirst = now; okPresses = 0 }
                okPresses++
                if (okPresses >= 7) { okPresses = 0; askPin() }
                return true
            }
            if (code == KeyEvent.KEYCODE_MENU && event.repeatCount >= 3) { askPin(); return true }
            if (code == KeyEvent.KEYCODE_BACK) return true
        }
        // Volume tetap boleh dipakai pelanggan
        if (code == KeyEvent.KEYCODE_VOLUME_UP || code == KeyEvent.KEYCODE_VOLUME_DOWN || code == KeyEvent.KEYCODE_VOLUME_MUTE) {
            return super.dispatchKeyEvent(event)
        }
        return true
    }

    private var pinOpen = false
    private fun askPin() {
        if (pinOpen) return
        pinOpen = true
        val input = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
            hint = "PIN teknisi"
        }
        AlertDialog.Builder(this)
            .setTitle("Menu Teknisi El Classico")
            .setMessage("Masukkan PIN untuk membuka pengaturan TV")
            .setView(input)
            .setPositiveButton("Buka") { _, _ ->
                if (input.text.toString() == Prefs.pin(this)) {
                    startActivity(android.content.Intent(this, SetupActivity::class.java))
                } else Toast.makeText(this, "PIN salah", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Batal", null)
            .setOnDismissListener { pinOpen = false }
            .show()
    }
}
