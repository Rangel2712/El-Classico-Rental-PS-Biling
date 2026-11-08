package com.elclassico.billing

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Menjalankan billing otomatis saat TV dinyalakan / aplikasi diperbarui. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (!Prefs.autoStart(context) && !Prefs.openOnWake(context)) return
        try {
            val i = Intent(context, BillingService::class.java).setAction(BillingService.ACTION_WAKE)
            if (android.os.Build.VERSION.SDK_INT >= 26) context.startForegroundService(i) else context.startService(i)
        } catch (_: Exception) { }
        try {
            context.startActivity(
                Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
            )
        } catch (_: Exception) { }
    }
}
