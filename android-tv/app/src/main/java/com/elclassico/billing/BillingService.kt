package com.elclassico.billing

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.graphics.PixelFormat
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetSocketAddress
import java.util.concurrent.TimeUnit

/**
 * Service utama di TV:
 *  - koneksi WebSocket ke server billing (auto-reconnect + auto-discovery)
 *  - mengunci layar / membuka HDMI sesuai status sewa
 *  - overlay timer & hitung mundur di atas tampilan PlayStation
 *  - menjalankan perintah kasir (volume, pengaturan, dll)
 */
class BillingService : Service() {

    private val main = Handler(Looper.getMainLooper())
    private val http = OkHttpClient.Builder()
        .pingInterval(15, TimeUnit.SECONDS)
        .connectTimeout(5, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .build()
    private var ws: WebSocket? = null
    private var wsGen = 0
    private var stopped = false
    private var overlay: WebView? = null
    private var overlayWm: WindowManager? = null
    private var overlayKind = ""      // "window" (izin overlay) | "accessibility"
    private var overlayReady = false
    // Data untuk notifikasi cadangan bila overlay tidak tersedia
    private var stStatus = "idle"
    private var stTimer = false
    private var stRemaining = 0L
    private var stRecv = 0L
    private var stUnitName = ""
    private val toastShown = HashSet<Int>()
    private var lastMode: String? = null
    private var lastStatus: String = "none"
    private var discoveryThread: Thread? = null
    /** Jeda penegakan layar kunci (mis. saat kasir membuka menu Pengaturan). */
    @Volatile var enforceAfter = 0L

    companion object {
        const val CHANNEL = "billing"
        const val ACTION_RECONNECT = "com.elclassico.billing.RECONNECT"
        const val ACTION_WAKE = "com.elclassico.billing.WAKE"
        @Volatile var instance: BillingService? = null

        /** Jangan tarik layar kunci selama teknisi berada di menu Pengaturan TV. */
        fun pauseLock(ms: Long) {
            instance?.enforceAfter = System.currentTimeMillis() + ms
        }
        const val DISCOVERY_PORT = 41234

        fun start(c: Context, reconnect: Boolean = false) {
            val i = Intent(c, BillingService::class.java)
            if (reconnect) i.action = ACTION_RECONNECT
            if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(i) else c.startService(i)
        }
    }

    // ---------------------------------------------------------------- lifecycle
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        instance = this
        startForeground(1, buildNotification("Menghubungkan ke server…"))
        val f = IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_ON)
            addAction(Intent.ACTION_SCREEN_OFF)
            addAction(Intent.ACTION_USER_PRESENT)
            addAction(Intent.ACTION_DREAMING_STOPPED)
        }
        registerReceiver(screenReceiver, f)
        main.postDelayed(statusLoop, 30_000)
        main.postDelayed(toastTick, 1000)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_RECONNECT || ws == null) {
            reconnectNow()
        }
        if (intent?.action == ACTION_WAKE) onTvWake()
        ensureOverlay()
        return START_STICKY
    }

    override fun onDestroy() {
        stopped = true
        instance = null
        try { unregisterReceiver(screenReceiver) } catch (_: Exception) { }
        ws?.close(1000, "bye")
        removeOverlay()
        main.removeCallbacksAndMessages(null)
        super.onDestroy()
    }

    // ---------------------------------------------------------------- notifikasi
    @Suppress("DEPRECATION")
    private fun buildNotification(text: String): Notification {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= 26) {
            nm.createNotificationChannel(NotificationChannel(CHANNEL, "Billing", NotificationManager.IMPORTANCE_LOW))
        }
        val pi = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0)
        )
        val b = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, CHANNEL) else Notification.Builder(this)
        return b.setContentTitle("El Classico Billing")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentIntent(pi)
            .setOngoing(true)
            .build()
    }

    private fun notify(text: String) {
        try {
            (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).notify(1, buildNotification(text))
        } catch (_: Exception) { }
    }

    // ---------------------------------------------------------------- koneksi
    private fun reconnectNow() {
        wsGen++
        ws?.cancel()
        ws = null
        connect()
    }

    private fun connect() {
        if (stopped) return
        val host = Prefs.host(this)
        if (host.isEmpty()) {
            startDiscovery()
            return
        }
        val gen = wsGen
        val url = "ws://$host:${Prefs.port(this)}/ws?role=tv&kind=native&unit=" +
                java.net.URLEncoder.encode(Prefs.unit(this), "UTF-8")
        val req = Request.Builder().url(url).build()
        ws = http.newWebSocket(req, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                if (gen != wsGen) return
                Bus.conn(true)
                notify("Terhubung ke $host · ${Prefs.unit(this@BillingService)}")
                sendHello(webSocket)
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                if (gen != wsGen) return
                handleMessage(text)
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                if (gen != wsGen) return
                lost()
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                if (gen != wsGen) return
                lost()
            }
        })
    }

    private fun lost() {
        Bus.conn(false)
        notify("Terputus — mencoba lagi…")
        val gen = wsGen
        main.postDelayed({
            if (gen == wsGen && !stopped) {
                // Setelah beberapa kali gagal, coba cari server lagi (IP server mungkin berubah)
                failCount++
                if (failCount >= 5) { failCount = 0; startDiscovery(keepCurrent = true) }
                connect()
            }
        }, 3000)
    }
    private var failCount = 0

    private fun sendHello(w: WebSocket) {
        failCount = 0
        val info = deviceInfo()
        w.send(JSONObject().put("t", "hello").put("info", info).toString())
    }

    private fun deviceInfo(): JSONObject = JSONObject()
        .put("kind", "native")
        .put("model", "${Build.MANUFACTURER} ${Build.MODEL}")
        .put("android", Build.VERSION.RELEASE)
        .put("appVersion", BuildConfig.VERSION_NAME)
        .put("ip", TvControl.ip(this))
        .put("mac", TvControl.mac())
        .put("volume", TvControl.volume(this))
        .put("maxVolume", TvControl.maxVolume(this))
        .put("screenOn", TvControl.isScreenOn(this))
        .put("overlay", TvControl.canOverlay(this))
        .put("overlayMode", if (overlay != null) overlayKind else "toast")
        .put("accessibility", PowerAccessibility.instance != null)
        .put("hdmi", Prefs.hdmiLabel(this))
        .put("hdmiId", Prefs.hdmiInput(this))
        .put("inputs", org.json.JSONArray().apply {
            TvControl.inputs(this@BillingService).forEach { put(JSONObject().put("id", it.id).put("label", it.label)) }
        })
        .put("openOnWake", Prefs.openOnWake(this))
        .put("canPowerOff", PowerControl.canPowerOff(this))

    private fun sendStatus() {
        ws?.send(JSONObject().put("t", "status").put("info", deviceInfo()).toString())
    }

    private fun ack(text: String, level: String = "info") {
        ws?.send(JSONObject().put("t", "ack").put("text", text).put("level", level).toString())
    }

    private val statusLoop = object : Runnable {
        override fun run() {
            sendStatus()
            main.postDelayed(this, 30_000)
        }
    }

    // ---------------------------------------------------------------- discovery UDP
    private fun startDiscovery(keepCurrent: Boolean = false) {
        if (discoveryThread?.isAlive == true) return
        if (!keepCurrent) notify("Mencari server billing di jaringan…")
        discoveryThread = Thread {
            var lock: WifiManager.MulticastLock? = null
            var sock: DatagramSocket? = null
            try {
                val wm = applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
                lock = wm.createMulticastLock("elclassico").apply { setReferenceCounted(false); acquire() }
                sock = DatagramSocket(null as java.net.SocketAddress?).apply {
                    reuseAddress = true
                    broadcast = true
                    soTimeout = 15000
                    bind(InetSocketAddress(DISCOVERY_PORT))
                }
                val buf = ByteArray(512)
                val deadline = System.currentTimeMillis() + (if (keepCurrent) 12_000 else 600_000)
                while (!stopped && System.currentTimeMillis() < deadline) {
                    val p = DatagramPacket(buf, buf.size)
                    try { sock.receive(p) } catch (_: java.net.SocketTimeoutException) { continue }
                    val msg = String(p.data, 0, p.length)
                    if (msg.startsWith("ELCLASSICO|")) {
                        val parts = msg.split("|")
                        val port = parts.getOrNull(1)?.toIntOrNull() ?: 8080
                        val host = p.address.hostAddress ?: continue
                        if (host != Prefs.host(this) || port != Prefs.port(this)) {
                            Prefs.setServer(this, host, port)
                            main.post { reconnectNow() }
                        } else if (Prefs.host(this).isEmpty()) {
                            main.post { reconnectNow() }
                        }
                        break
                    }
                }
            } catch (_: Exception) {
            } finally {
                try { sock?.close() } catch (_: Exception) { }
                try { lock?.release() } catch (_: Exception) { }
            }
            if (Prefs.host(this).isEmpty() && !stopped) main.postDelayed({ startDiscovery() }, 3000)
        }.apply { isDaemon = true; start() }
    }

    // ---------------------------------------------------------------- pesan server
    private fun handleMessage(text: String) {
        val m = try { JSONObject(text) } catch (_: Exception) { return }
        when (m.optString("t")) {
            "state" -> {
                Bus.state(text)
                main.post { applyState(m) }
            }
            "cmd" -> main.post { handleCmd(m, text) }
        }
    }

    private fun applyState(m: JSONObject) {
        val s = m.optJSONObject("session")
        val cfg = m.optJSONObject("config") ?: JSONObject()
        val status = s?.optString("status") ?: "idle"
        val lockOnPause = cfg.optBoolean("lockOnPause", true)
        val autoHdmi = cfg.optBoolean("autoHdmi", true)
        val wantPlay = status == "playing" || (status == "paused" && !lockOnPause)
        val mode = if (wantPlay) "play" else "lock"
        pushOverlay(m.toString(), false)
        stUnitName = m.optJSONObject("unit")?.optString("name") ?: ""
        stTimer = s?.optString("mode") == "timer"
        stRemaining = s?.optLong("remainingMs", 0L) ?: 0L
        stRecv = System.currentTimeMillis()
        if (status == "playing" && stStatus != "playing") {
            toastShown.clear()
            val mins = (stRemaining / 60000).toInt()
            if (overlay == null) toast(if (stTimer) "🎮 Selamat bermain! Sisa waktu $mins menit" else "🎮 Selamat bermain! (Main bebas)")
        }
        stStatus = status

        if (mode != lastMode) {
            lastMode = mode
            Bus.setMode(mode)
            if (mode == "play") {
                unblack()
                TvControl.wakeScreen(this)
                val opened = autoHdmi && TvControl.openHdmi(this, Prefs.hdmiInput(this))
                if (!opened) Bus.setMode("play-nohdmi")
            } else {
                showLock()
            }
        }
        else if (mode == "lock" && System.currentTimeMillis() > enforceAfter &&
            !MainActivity.visible && !SetupActivity.visible && TvControl.isScreenOn(this)) {
            // Pelanggan keluar dari layar kunci tanpa sewa aktif → kunci kembali
            showLock()
        }
        if (status == "playing" && lastStatus != "playing") TvControl.wakeScreen(this)
        lastStatus = status
    }

    private fun showLock() {
        TvControl.wakeScreen(this)
        try {
            startActivity(
                Intent(this, MainActivity::class.java).addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or Intent.FLAG_ACTIVITY_SINGLE_TOP
                )
            )
        } catch (_: Exception) { }
    }

    private fun handleCmd(m: JSONObject, raw: String) {
        val cmd = m.optString("cmd")
        try {
            when (cmd) {
                "volume" -> TvControl.setVolume(this, m.optInt("value", TvControl.volume(this)))
                "volumeUp" -> TvControl.volumeStep(this, true)
                "volumeDown" -> TvControl.volumeStep(this, false)
                "mute" -> TvControl.toggleMute(this)
                "settings" -> { enforceAfter = System.currentTimeMillis() + 10 * 60_000; TvControl.openSettings(this) }
                "wifiSettings" -> { enforceAfter = System.currentTimeMillis() + 10 * 60_000; TvControl.openSettings(this, Settings.ACTION_WIFI_SETTINGS) }
                "home" -> { enforceAfter = System.currentTimeMillis() + 10 * 60_000; TvControl.openHome(this) }
                "hdmi" -> if (!TvControl.openHdmi(this, Prefs.hdmiInput(this))) ack("Input HDMI belum diatur di aplikasi TV", "warning")
                "lock" -> { enforceAfter = 0; showLock() }
                "unlock" -> { lastMode = null; Bus.lastState?.let { applyState(JSONObject(it)) } }
                "wake", "power" -> { unblack(); TvControl.wakeScreen(this); onTvWake() }
                "powerOff" -> powerOff()
                "beep" -> TvControl.beep()
                "reload" -> { overlay?.reload(); Bus.setMode("reload"); reconnectNow() }
                "setup" -> {
                    enforceAfter = System.currentTimeMillis() + 10 * 60_000
                    TvControl.wakeScreen(this)
                    startActivity(Intent(this, SetupActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                    ack("Menu teknisi dibuka di TV", "success")
                }
                "setHdmi" -> {
                    val id = m.optString("value")
                    val label = TvControl.inputs(this).firstOrNull { it.id == id }?.label ?: ""
                    Prefs.setHdmi(this, id, label)
                    ack(if (id.isEmpty()) "Pindah HDMI otomatis dimatikan" else "Input PS diatur ke $label", "success")
                    if (id.isNotEmpty() && lastMode?.startsWith("play") == true) TvControl.openHdmi(this, id)
                    main.postDelayed({ sendStatus() }, 300)
                }
                "setOpenOnWake" -> {
                    Prefs.setOpenOnWake(this, m.optBoolean("value", true))
                    ack("Buka otomatis saat TV menyala: " + (if (Prefs.openOnWake(this)) "aktif" else "nonaktif"), "success")
                    main.postDelayed({ sendStatus() }, 300)
                }
            }
        } catch (e: Exception) {
            ack("Gagal menjalankan $cmd: ${e.message}", "warning")
        }
        // Toast/pesan: tampilkan di layar yang sedang terlihat
        if (cmd == "toast" || cmd == "message" || cmd == "beep" || cmd == "warning") {
            if (lastMode == "play" && overlay != null) pushOverlay(raw, true)
            else if (lastMode == "play" && (cmd == "toast" || cmd == "message")) toast(m.optString("text"))
            else Bus.cmd(raw)
        }
        if (cmd.startsWith("volume") || cmd == "mute") main.postDelayed({ sendStatus() }, 400)
    }

    // ---------------------------------------------------------------- matikan TV
    private fun powerOff() {
        val method = PowerControl.powerOff(this)
        if (method != null) {
            ack("TV dimatikan (standby)", "success")
        } else {
            // Tanpa izin sistem: tampilkan layar hitam & redupkan sampai ada sewa / perintah hidupkan
            if (lastMode != "play") showLock()
            Bus.cmd(JSONObject().put("t", "cmd").put("cmd", "blackout").toString())
            ack("Izin Matikan TV belum aktif — layar dihitamkan saja", "warning")
        }
        main.postDelayed({ sendStatus() }, 1500)
    }

    private fun unblack() {
        Bus.cmd(JSONObject().put("t", "cmd").put("cmd", "unblack").toString())
    }

    // ---------------------------------------------------------------- overlay
    fun overlayMode(): String = if (overlay != null) overlayKind else "toast"

    /** Dipanggil saat izin overlay / aksesibilitas berubah. */
    fun overlayChanged() {
        main.post {
            try {
                removeOverlay()
                ensureOverlay()
            } catch (_: Throwable) { }
            main.postDelayed({ try { sendStatus() } catch (_: Throwable) { } }, 800)
        }
    }

    /**
     * Timer di atas tampilan PlayStation. Dua jalur:
     *  1. Izin "Tampil di atas aplikasi lain" (TYPE_APPLICATION_OVERLAY)
     *  2. Layanan Aksesibilitas El Classico (TYPE_ACCESSIBILITY_OVERLAY) — untuk TV yang
     *     menyembunyikan menu izin overlay. Tidak membutuhkan izin overlay sama sekali.
     */
    @Suppress("DEPRECATION")
    @SuppressLint("SetJavaScriptEnabled")
    private fun ensureOverlay() {
        if (overlay != null) return
        val acc = PowerAccessibility.instance
        val ctx: Context
        val type: Int
        val kind: String
        if (TvControl.canOverlay(this)) {
            ctx = this
            type = if (Build.VERSION.SDK_INT >= 26) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else WindowManager.LayoutParams.TYPE_PHONE
            kind = "window"
        } else if (acc != null && Build.VERSION.SDK_INT >= 22) {
            ctx = acc
            type = WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY
            kind = "accessibility"
        } else return
        try {
            val wm = ctx.getSystemService(Context.WINDOW_SERVICE) as WindowManager
            val lp = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                        WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
                PixelFormat.TRANSLUCENT
            )
            lp.gravity = Gravity.TOP or Gravity.START
            val wv = WebView(ctx)
            wv.setBackgroundColor(Color.TRANSPARENT)
            wv.isFocusable = false
            wv.settings.javaScriptEnabled = true
            wv.settings.domStorageEnabled = true
            wv.settings.mediaPlaybackRequiresUserGesture = false
            wv.settings.allowFileAccess = true
            wv.webChromeClient = WebChromeClient()
            wv.webViewClient = WebViewClient()
            wv.addJavascriptInterface(OverlayBridge(), "ElNative")
            wv.loadUrl("file:///android_asset/tv/tv.html?mode=overlay&unit=" + Prefs.unit(this))
            wm.addView(wv, lp)
            overlay = wv
            overlayWm = wm
            overlayKind = kind
            overlayReady = false
        } catch (_: Throwable) {
            overlay = null
            overlayWm = null
        }
    }

    private fun removeOverlay() {
        val v = overlay ?: return
        try { overlayWm?.removeView(v) } catch (_: Exception) { }
        try { v.destroy() } catch (_: Exception) { }
        overlay = null
        overlayWm = null
        overlayKind = ""
        overlayReady = false
    }

    private fun pushOverlay(raw: String, isCmd: Boolean) {
        ensureOverlay()
        val v = overlay ?: return
        if (!overlayReady && !isCmd) return
        v.evaluateJavascript("window.ec&&ec.push(" + JSONObject.quote(raw) + ")", null)
    }

    // ---------------------------------------------------------------- notifikasi cadangan
    private fun toast(text: String) {
        if (text.isEmpty()) return
        try { android.widget.Toast.makeText(applicationContext, text, android.widget.Toast.LENGTH_LONG).show() } catch (_: Exception) { }
    }

    /** Bila timer overlay tidak bisa tampil: peringatan sisa waktu lewat notifikasi sistem. */
    private val toastTick = object : Runnable {
        override fun run() {
            if (overlay == null && stStatus == "playing" && stTimer) {
                val rem = stRemaining - (System.currentTimeMillis() - stRecv)
                val sec = (rem / 1000).toInt()
                for (t in intArrayOf(600, 300, 120, 60, 30, 10)) {
                    if (sec in 1..t && !toastShown.contains(t)) {
                        toastShown.add(t)
                        // tandai juga ambang yang lebih besar agar tidak muncul beruntun
                        intArrayOf(600, 300, 120, 60, 30, 10).filter { it > t }.forEach { toastShown.add(it) }
                        val txt = if (t >= 60) "${t / 60} menit" else "$t detik"
                        toast("⏱ $stUnitName — sisa waktu $txt" + (if (t <= 60) ". Hubungi kasir untuk tambah waktu!" else ""))
                        if (t <= 60) TvControl.beep()
                        break
                    }
                }
            }
            main.postDelayed(this, 1000)
        }
    }

    inner class OverlayBridge {
        @JavascriptInterface fun getUnit(): String = Prefs.unit(this@BillingService)
        @JavascriptInterface fun getOverlayMode(): String = overlayKind
        @JavascriptInterface fun ready(mode: String) {
            main.post {
                overlayReady = true
                Bus.lastState?.let { pushOverlay(it, false) }
                overlay?.evaluateJavascript("window.ec&&ec.conn(" + Bus.connected + ")", null)
            }
        }
    }

    // ---------------------------------------------------------------- layar
    private val screenReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            when (intent.action) {
                Intent.ACTION_SCREEN_ON, Intent.ACTION_USER_PRESENT, Intent.ACTION_DREAMING_STOPPED -> {
                    onTvWake()
                    if (ws == null) reconnectNow()
                    main.postDelayed({ sendStatus() }, 1000)
                }
                Intent.ACTION_SCREEN_OFF -> {
                    enforceAfter = 0 // grace menu Pengaturan berakhir saat TV dimatikan
                    main.removeCallbacks(wakeRunner)
                    main.postDelayed({ sendStatus() }, 500)
                }
            }
        }
    }

    // ---------------------------------------------------------------- TV dinyalakan
    /**
     * Saat TV dinyalakan, launcher bawaan TV sering muncul beberapa detik kemudian dan menutupi
     * aplikasi. Karena itu El Classico dibuka berulang kali selama ±20 detik pertama.
     * Jika ada sewa aktif, TV langsung dibawa ke input HDMI PlayStation.
     */
    private var wakeStep = 0
    private val wakeDelays = longArrayOf(300, 1500, 3500, 6000, 10000, 15000, 20000)
    private val wakeRunner = object : Runnable {
        override fun run() {
            if (!Prefs.openOnWake(this@BillingService) || stopped) return
            if (TvControl.isScreenOn(this@BillingService) && !SetupActivity.visible) {
                if (lastMode == "play" || lastMode == "play-nohdmi") {
                    // Sesi berjalan: cukup sekali pindahkan ke HDMI
                    if (wakeStep == 1) TvControl.openHdmi(this@BillingService, Prefs.hdmiInput(this@BillingService))
                } else if (!MainActivity.visible && System.currentTimeMillis() > enforceAfter) {
                    showLock()
                }
            }
            wakeStep++
            if (wakeStep < wakeDelays.size) main.postDelayed(this, wakeDelays[wakeStep] - wakeDelays[wakeStep - 1])
        }
    }

    private fun onTvWake() {
        if (!Prefs.openOnWake(this)) return
        enforceAfter = 0
        main.removeCallbacks(wakeRunner)
        wakeStep = 0
        main.postDelayed(wakeRunner, wakeDelays[0])
    }
}
