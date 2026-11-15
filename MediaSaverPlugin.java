package com.sandeep.sp01;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

/** Copies an exported video from the app cache into the phone Gallery (Movies/SP01). */
@CapacitorPlugin(
    name = "MediaSaver",
    permissions = { @Permission(alias = "storage", strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }) }
)
public class MediaSaverPlugin extends Plugin {

    @PluginMethod
    public void saveVideo(PluginCall call) {
        if (Build.VERSION.SDK_INT < 29 && getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "storageCallback");
            return;
        }
        doSave(call);
    }

    @PermissionCallback
    private void storageCallback(PluginCall call) {
        if (getPermissionState("storage") == PermissionState.GRANTED) doSave(call);
        else call.reject("Storage permission denied");
    }

    private void doSave(PluginCall call) {
        String path = call.getString("path");
        String name = call.getString("name", "SP01_" + System.currentTimeMillis() + ".mp4");
        if (path == null) { call.reject("path missing"); return; }
        if (path.startsWith("file://")) path = Uri.parse(path).getPath();
        final File src = new File(path);
        final String fname = name;
        getBridge().execute(() -> {
            try {
                Uri out;
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentResolver cr = getContext().getContentResolver();
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Video.Media.DISPLAY_NAME, fname);
                    v.put(MediaStore.Video.Media.MIME_TYPE, "video/mp4");
                    v.put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES + "/SP01");
                    v.put(MediaStore.Video.Media.IS_PENDING, 1);
                    out = cr.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, v);
                    if (out == null) throw new Exception("insert failed");
                    try (InputStream in = new FileInputStream(src); OutputStream os = cr.openOutputStream(out)) { copy(in, os); }
                    v.clear(); v.put(MediaStore.Video.Media.IS_PENDING, 0); cr.update(out, v, null, null);
                } else {
                    File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES), "SP01");
                    if (!dir.exists()) dir.mkdirs();
                    File dst = new File(dir, fname);
                    try (InputStream in = new FileInputStream(src); OutputStream os = new FileOutputStream(dst)) { copy(in, os); }
                    MediaScannerConnection.scanFile(getContext(), new String[] { dst.getAbsolutePath() }, new String[] { "video/mp4" }, null);
                    out = Uri.fromFile(dst);
                }
                src.delete();
                JSObject r = new JSObject();
                r.put("uri", out.toString());
                call.resolve(r);
            } catch (Exception e) {
                call.reject("Save failed: " + e.getMessage());
            }
        });
    }

    private static void copy(InputStream in, OutputStream os) throws Exception {
        byte[] buf = new byte[1 << 16];
        int n;
        while ((n = in.read(buf)) > 0) os.write(buf, 0, n);
    }
}
