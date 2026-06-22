// Prevents an extra console window on Windows; harmless on Linux.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

/// Apply Linux/Wayland compatibility workarounds for WebKitGTK.
///
/// These must be set BEFORE the webview is initialized, which is why they
/// live at the very top of `main()` rather than in a Tauri setup hook.
///
/// Background: WebKitGTK 2.42+ defaults to a DMABUF renderer that causes
/// black windows, flickering, and crashes on many Wayland compositors
/// (GNOME 45+, KDE 6+, Sway, Hyprland) and especially on NVIDIA. Disabling
/// it falls back to a software/EGL path that is stable everywhere.
///
/// Users can opt out by setting `WEATHER_APP_NO_FIXUPS=1` before launch,
/// or by pre-setting any of the variables themselves (we never overwrite).
#[cfg(target_os = "linux")]
fn apply_linux_fixups() {
    if std::env::var_os("WEATHER_APP_NO_FIXUPS").is_some() {
        return;
    }

    // Helper: only set if the user hasn't already chosen a value.
    fn set_if_unset(key: &str, value: &str) {
        if std::env::var_os(key).is_none() {
            // SAFETY: single-threaded at this point (before Tauri starts).
            unsafe { std::env::set_var(key, value); }
        }
    }

    // Primary fix: disable the DMABUF renderer that breaks most Wayland setups.
    set_if_unset("WEBKIT_DISABLE_DMABUF_RENDERER", "1");

    // Secondary fix: disable compositing mode for older WebKitGTK that
    // still ships on Ubuntu 22.04 / Debian stable.
    set_if_unset("WEBKIT_DISABLE_COMPOSITING_MODE", "1");

    // NVIDIA + Wayland: avoid GSYNC-driven frame pacing glitches.
    set_if_unset("__GL_GSYNC_ALLOWED", "0");

    // If we are on Wayland but GDK can't find a display server, fall back to
    // X11 via XWayland rather than crashing. We do NOT force a backend
    // otherwise — let GDK auto-detect.
    if std::env::var_os("WAYLAND_DISPLAY").is_none()
        && std::env::var_os("DISPLAY").is_some()
        && std::env::var_os("GDK_BACKEND").is_none()
    {
        unsafe { std::env::set_var("GDK_BACKEND", "x11"); }
    }
}

fn main() {
    #[cfg(target_os = "linux")]
    apply_linux_fixups();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running Weather application");
}
