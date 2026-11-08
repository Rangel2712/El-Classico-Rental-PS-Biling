package com.elclassico.billing

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetSocketAddress

/** Layar pengaturan teknisi: server, ID unit, input HDMI, izin, PIN. Dioperasikan dengan remote (D-pad). */
class SetupActivity : Activity() {

    companion object { @Volatile var visible = false }

    private val gold = Color.parseColor("#F5C518")
    private lateinit var host: EditText
    private lateinit var port: EditText
    private lateinit var unit: EditText
    private lateinit var pin: EditText
    private lateinit var auto: CheckBox
    private lateinit var wakeOpen: CheckBox
    private lateinit var hdmi: Spinner
    private lateinit var status: TextView
    private var inputs: List<TvControl.Input> = emptyList()

    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val scroll = ScrollView(this).apply { setBackgroundColor(Color.parseColor("#070B14")) }
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(48), dp(28), dp(48), dp(28))
        }
        scroll.addView(root)
        setContentView(scroll)

        root.addView(TextView(this).apply {
            text = "⚙️  Pengaturan TV — El Classico Rental PS Billing"
            textSize = 22f; setTextColor(gold); typeface = Typeface.DEFAULT_BOLD
        })
        root.addView(TextView(this).apply {
            text = "Model: ${Build.MANUFACTURER} ${Build.MODEL} · Android ${Build.VERSION.RELEASE} · IP TV: ${TvControl.ip(this@SetupActivity)} · App v${BuildConfig.VERSION_NAME}"
            textSize = 13f; setTextColor(Color.parseColor("#8A97B0")); setPadding(0, dp(6), 0, dp(14))
        })

        val cols = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        root.addView(cols)
        val left = column(); val right = column()
        cols.addView(left, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply { rightMargin = dp(24) })
        cols.addView(right, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))

        // ---- Kiri: server & unit
        left.addView(section("1. Server Billing"))
        host = field(left, "IP server (Macbook / Laptop Windows)", Prefs.host(this), InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_URI)
        port = field(left, "Port", Prefs.port(this).toString(), InputType.TYPE_CLASS_NUMBER)
        left.addView(button("🔍  Cari Server Otomatis") { discover() })
        left.addView(section("2. Identitas Unit"))
        unit = field(left, "ID unit (harus sama dengan di panel kasir, mis. tv1)", Prefs.unit(this), InputType.TYPE_CLASS_TEXT)
        pin = field(left, "PIN menu teknisi TV", Prefs.pin(this), InputType.TYPE_CLASS_NUMBER)
        auto = CheckBox(this).apply {
            text = "Jalankan otomatis saat TV menyala"; isChecked = Prefs.autoStart(this@SetupActivity)
            setTextColor(Color.WHITE); textSize = 15f; setPadding(dp(8), dp(8), 0, dp(8))
        }
        left.addView(auto)
        wakeOpen = CheckBox(this).apply {
            text = "Buka El Classico otomatis setiap TV dinyalakan"; isChecked = Prefs.openOnWake(this@SetupActivity)
            setTextColor(Color.WHITE); textSize = 15f; setPadding(dp(8), dp(8), 0, dp(8))
        }
        left.addView(wakeOpen)
        left.addView(hint("Agar paling andal: aktifkan juga izin overlay dan jadikan El Classico launcher utama."))

        // ---- Kanan: HDMI & izin
        right.addView(section("3. Input PlayStation"))
        inputs = TvControl.inputs(this)
        val labels = mutableListOf("— Tidak pindah otomatis —")
        labels.addAll(inputs.map { it.label })
        hdmi = Spinner(this).apply {
            adapter = object : ArrayAdapter<String>(this@SetupActivity, android.R.layout.simple_spinner_item, labels) {
                override fun getView(p: Int, v: View?, g: ViewGroup): View =
                    (super.getView(p, v, g) as TextView).apply { setTextColor(Color.WHITE); textSize = 16f }
            }.apply { setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item) }
            background = box("#141E33")
            setPadding(dp(12), dp(10), dp(12), dp(10))
            isFocusable = true
            val idx = inputs.indexOfFirst { it.id == Prefs.hdmiInput(this@SetupActivity) }
            setSelection(if (idx >= 0) idx + 1 else 0)
            onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
                override fun onItemSelected(p: AdapterView<*>?, v: View?, pos: Int, id: Long) {}
                override fun onNothingSelected(p: AdapterView<*>?) {}
            }
        }
        right.addView(hdmi, lp())
        right.addView(hint(if (inputs.isEmpty()) "Tidak ada input HDMI terdeteksi lewat sistem TV. Timer tetap berjalan; pindahkan input secara manual dengan remote."
            else "Pilih HDMI tempat PS tersambung. Saat sewa dimulai TV otomatis pindah ke input ini."))
        right.addView(button("▶  Tes Pindah ke HDMI") {
            val i = selectedInput()
            if (i == null || !TvControl.openHdmi(this, i.id)) toast("Gagal membuka input — coba input lain")
        })

        right.addView(section("4. Izin & Sistem"))
        right.addView(hint("Timer di pojok layar saat bermain butuh SALAH SATU izin di bawah. Jika menu overlay tidak ada di TV ini, pakai Aksesibilitas."))
        right.addView(button("♿  Aktifkan Aksesibilitas El Classico (timer + matikan TV)") { openAccessibility() })
        right.addView(button("🪟  Izin Tampil di Atas Aplikasi (overlay)") { requestOverlay() })
        right.addView(button("⏻  Izin Matikan TV (Admin Perangkat)") { requestAdmin() })
        right.addView(button("🧪  Tes Matikan TV (nyalakan lagi dengan remote)") {
            if (PowerControl.powerOff(this) == null) toast("Belum ada izin Matikan TV yang aktif")
        })
        right.addView(button("🏠  Jadikan Launcher Utama (opsional)") {
            try { startActivity(Intent(Settings.ACTION_HOME_SETTINGS)) } catch (_: Exception) { TvControl.openHome(this) }
        })
        right.addView(button("🛠️  Buka Pengaturan Android TV") { TvControl.openSettings(this) })
        status = hint("")
        right.addView(status)

        // ---- Simpan
        val save = button("💾  SIMPAN & SAMBUNGKAN") { save() }
        save.background = box("#F5C518"); save.setTextColor(Color.parseColor("#1B1400"))
        root.addView(save, lp().apply { topMargin = dp(18) })
        root.addView(button("Tutup tanpa menyimpan") { finish() })
        host.requestFocus()
        refreshStatus()
    }

    override fun onResume() { super.onResume(); visible = true; refreshStatus() }
    override fun onPause() { super.onPause(); visible = false }

    private fun refreshStatus() {
        if (!::status.isInitialized) return
        val ov = TvControl.canOverlay(this)
        val acc = PowerAccessibility.instance != null
        status.text = "Timer di atas game: " + (if (ov) "✅ izin overlay aktif" else if (acc) "✅ lewat aksesibilitas" else "❌ belum — hanya notifikasi singkat. Aktifkan Aksesibilitas!") +
                "\nMatikan TV: " + (if (PowerControl.adminActive(this)) "✅ admin perangkat aktif"
                    else if (PowerControl.accessibilityActive()) "✅ aksesibilitas aktif"
                    else "❌ belum — hanya bisa menghitamkan layar") +
                "\nServer: " + (if (Bus.connected) "✅ terhubung" else "⏳ belum terhubung")
    }

    private fun selectedInput(): TvControl.Input? {
        val pos = hdmi.selectedItemPosition
        return if (pos <= 0) null else inputs.getOrNull(pos - 1)
    }

    private fun save() {
        val p = port.text.toString().toIntOrNull() ?: 8080
        val i = selectedInput()
        Prefs.save(this, host.text.toString(), p, unit.text.toString(), i?.id ?: "", i?.label ?: "", pin.text.toString(), auto.isChecked)
        Prefs.setOpenOnWake(this, wakeOpen.isChecked)
        BillingService.start(this, reconnect = true)
        toast("Tersimpan. Menyambungkan ke ${host.text}:${p} sebagai ${unit.text}")
        // Muat ulang layar kunci agar memakai ID unit baru
        Bus.setMode("reload")
        finish()
    }

    private fun openAccessibility() {
        toast("Pilih \"El Classico Billing\" lalu aktifkan (On). Tekan BACK untuk kembali.")
        try { startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) } catch (_: Exception) {
            status.text = "Menu aksesibilitas tidak bisa dibuka otomatis.\nBuka manual: Pengaturan TV › Preferensi Perangkat › Aksesibilitas › El Classico Billing › Aktifkan.\n" +
                    "Atau lewat komputer (ADB):\nadb shell settings put secure enabled_accessibility_services $packageName/.PowerAccessibility\nadb shell settings put secure accessibility_enabled 1"
        }
    }

    private fun requestOverlay() {
        if (Build.VERSION.SDK_INT < 23) { toast("Sudah diizinkan"); return }
        try {
            startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName")))
        } catch (_: ActivityNotFoundException) {
            try { startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION)) } catch (_: Exception) {
                status.text = "TV ini tidak punya menu izin overlay — pakai tombol Aksesibilitas di atas.\nAtau lewat komputer (ADB):\nadb shell appops set $packageName SYSTEM_ALERT_WINDOW allow"
            }
        }
    }

    private fun requestAdmin() {
        if (PowerControl.adminActive(this)) { toast("Izin admin perangkat sudah aktif"); return }
        try {
            startActivity(PowerControl.requestAdminIntent(this))
        } catch (_: Exception) {
            status.text = "TV ini tidak punya menu Admin Perangkat.\nPakai tombol Aksesibilitas, atau aktifkan lewat komputer (ADB):\n" +
                    "adb shell dpm set-active-admin $packageName/.AdminReceiver"
        }
    }

    private fun discover() {
        toast("Mencari server… (maks. 10 detik)")
        Thread {
            var found: Pair<String, Int>? = null
            var lock: WifiManager.MulticastLock? = null
            try {
                val wm = applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
                lock = wm.createMulticastLock("ec-setup").apply { setReferenceCounted(false); acquire() }
                DatagramSocket(null as java.net.SocketAddress?).use { s ->
                    s.reuseAddress = true; s.broadcast = true; s.soTimeout = 10_000
                    s.bind(InetSocketAddress(BillingService.DISCOVERY_PORT))
                    val buf = ByteArray(512)
                    val p = DatagramPacket(buf, buf.size)
                    s.receive(p)
                    val msg = String(p.data, 0, p.length)
                    if (msg.startsWith("ELCLASSICO|")) found = Pair(p.address.hostAddress ?: "", msg.split("|").getOrNull(1)?.toIntOrNull() ?: 8080)
                }
            } catch (_: Exception) {
            } finally { try { lock?.release() } catch (_: Exception) { } }
            runOnUiThread {
                val f = found
                if (f != null && f.first.isNotEmpty()) {
                    host.setText(f.first); port.setText(f.second.toString()); toast("Server ditemukan: ${f.first}:${f.second}")
                } else toast("Server tidak ditemukan. Pastikan server menyala & satu WiFi, lalu isi IP manual.")
            }
        }.start()
    }

    // ---------------------------------------------------------------- UI helper
    private fun column() = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
    private fun lp() = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { bottomMargin = dp(8) }
    private fun box(color: String) = GradientDrawable().apply { setColor(Color.parseColor(color)); cornerRadius = dp(10).toFloat(); setStroke(dp(1), Color.parseColor("#2A3A5C")) }
    private fun focusBox(color: String): android.graphics.drawable.StateListDrawable {
        val s = android.graphics.drawable.StateListDrawable()
        s.addState(intArrayOf(android.R.attr.state_focused), GradientDrawable().apply { setColor(Color.parseColor(color)); cornerRadius = dp(10).toFloat(); setStroke(dp(3), gold) })
        s.addState(intArrayOf(), box(color))
        return s
    }
    private fun section(t: String) = TextView(this).apply {
        text = t; textSize = 17f; setTextColor(Color.WHITE); typeface = Typeface.DEFAULT_BOLD; setPadding(0, dp(16), 0, dp(8))
    }
    private fun hint(t: String) = TextView(this).apply { text = t; textSize = 13f; setTextColor(Color.parseColor("#8A97B0")); setPadding(0, dp(4), 0, dp(8)) }
    private fun field(parent: LinearLayout, label: String, value: String, type: Int): EditText {
        parent.addView(TextView(this).apply { text = label; textSize = 13f; setTextColor(Color.parseColor("#8A97B0")) })
        val e = EditText(this).apply {
            setText(value); inputType = type; setTextColor(Color.WHITE); textSize = 17f; setSingleLine()
            background = focusBox("#0A1120"); setPadding(dp(14), dp(10), dp(14), dp(10))
        }
        parent.addView(e, lp())
        return e
    }
    private fun button(t: String, onClick: () -> Unit) = Button(this).apply {
        text = t; isAllCaps = false; textSize = 15f; setTextColor(Color.WHITE); gravity = Gravity.CENTER
        background = focusBox("#141E33"); setPadding(dp(16), dp(10), dp(16), dp(10))
        setOnClickListener { onClick() }
        layoutParams = lp()
    }
    private fun toast(t: String) = Toast.makeText(this, t, Toast.LENGTH_LONG).show()
}
