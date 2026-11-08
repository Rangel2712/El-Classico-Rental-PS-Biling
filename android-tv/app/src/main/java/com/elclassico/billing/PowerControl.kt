package com.elclassico.billing

import android.accessibilityservice.AccessibilityService
import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.view.accessibility.AccessibilityEvent

/** Admin perangkat: dipakai untuk mematikan layar TV (masuk standby) lewat lockNow(). */
class AdminReceiver : DeviceAdminReceiver()

/** Alternatif untuk TV yang tidak punya menu Admin Perangkat (Android 9+). */
class PowerAccessibility : AccessibilityService() {
    companion object { @Volatile var instance: PowerAccessibility? = null }

    override fun onServiceConnected() { instance = this }
    override fun onAccessibilityEvent(event: AccessibilityEvent?) { }
    override fun onInterrupt() { }
    override fun onUnbind(intent: Intent?): Boolean { instance = null; return super.onUnbind(intent) }

    fun sleep(): Boolean =
        if (Build.VERSION.SDK_INT >= 28) performGlobalAction(GLOBAL_ACTION_LOCK_SCREEN) else false
}

object PowerControl {
    fun admin(c: Context) = ComponentName(c, AdminReceiver::class.java)

    fun adminActive(c: Context): Boolean = try {
        (c.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager).isAdminActive(admin(c))
    } catch (_: Exception) { false }

    fun accessibilityActive(): Boolean = Build.VERSION.SDK_INT >= 28 && PowerAccessibility.instance != null

    fun canPowerOff(c: Context): Boolean = adminActive(c) || accessibilityActive()

    /** Mematikan layar TV (standby). Mengembalikan nama metode yang berhasil, atau null. */
    fun powerOff(c: Context): String? {
        if (adminActive(c)) {
            try {
                (c.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager).lockNow()
                return "admin"
            } catch (_: Exception) { }
        }
        try {
            if (PowerAccessibility.instance?.sleep() == true) return "accessibility"
        } catch (_: Exception) { }
        return null
    }

    fun requestAdminIntent(c: Context): Intent =
        Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN)
            .putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, admin(c))
            .putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Izinkan El Classico Billing mematikan layar TV dari panel kasir.")
}
