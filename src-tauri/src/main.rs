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

#[tauri::command]
fn update_tray_weather(app: tauri::AppHandle, temp_str: String, condition: String) -> Result<(), String> {
    use tauri::Manager;
    if let Some(tray) = app.tray_by_id("main-tray") {
        let _ = tray.set_tooltip(Some(format!("{} - {}", temp_str, condition)));
    }
    Ok(())
}

fn main() {
    #[cfg(target_os = "linux")]
    apply_linux_fixups();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![update_tray_weather])
        .setup(|app| {
            use tauri::{
                menu::{Menu, MenuItem, PredefinedMenuItem},
                tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
                Manager,
            };

            let temp_item = MenuItem::with_id(app, "temp", "Weather: Loading...", true, None::<&str>)?;
            let refresh_item = MenuItem::with_id(app, "refresh", "Refresh", true, None::<&str>)?;
            let open_item = MenuItem::with_id(app, "open", "Open App", true, None::<&str>)?;
            let settings_item = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let sep = PredefinedMenuItem::separator(app)?;

            let menu = Menu::with_items(
                app,
                &[&temp_item, &sep, &refresh_item, &open_item, &settings_item, &sep, &quit_item],
            )?;

            let _tray = TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .menu_on_left_click(false)
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "refresh" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.eval("window.__TRAY_REFRESH && window.__TRAY_REFRESH()");
                            }
                        }
                        "open" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "settings" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = window.eval("window.__TRAY_SETTINGS && window.__TRAY_SETTINGS()");
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.eval("window.__TRAY_TOGGLE_POPUP && window.__TRAY_TOGGLE_POPUP()");
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Weather application");
}
