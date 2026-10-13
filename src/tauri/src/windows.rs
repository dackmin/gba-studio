use std::{
    collections::{hash_map::DefaultHasher, HashMap, HashSet},
    hash::{Hash, Hasher},
    path::Path,
    sync::{
        atomic::{AtomicBool, Ordering},
        Mutex,
    },
};

use percent_encoding::{utf8_percent_encode, NON_ALPHANUMERIC};
use tauri::{
    AppHandle, Emitter, ExitRequestApi, Manager, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder, Window, WindowEvent,
};

use crate::{
    menus,
    protocol::{ProjectRoots, ResourcesDir},
};

pub const SELECTION: &str = "selection";

#[derive(Default)]
pub struct Windows {
    // project path -> window label
    opened: Mutex<HashMap<String, String>>,
    // Windows allowed to close without asking again about unsaved changes
    confirmed: Mutex<HashSet<String>>,
    fullscreen: Mutex<HashMap<String, bool>>,
    // Set while a quit is in progress so the app exits once every window has closed
    quitting: AtomicBool,
}

impl Windows {
    pub fn is_quitting(&self) -> bool {
        self.quitting.load(Ordering::SeqCst)
    }

    pub fn set_quitting(&self, value: bool) {
        self.quitting.store(value, Ordering::SeqCst);
    }
}

pub fn is_project_label(label: &str) -> bool {
    label.starts_with("project-")
}

fn project_label(project_path: &str) -> String {
    let mut hasher = DefaultHasher::new();
    project_path.hash(&mut hasher);

    format!("project-{:x}", hasher.finish())
}

fn app_url(query: &[(&str, &str)]) -> WebviewUrl {
    let query = query
        .iter()
        .map(|(key, value)| format!("{key}={}", utf8_percent_encode(value, NON_ALPHANUMERIC)))
        .collect::<Vec<_>>()
        .join("&");

    WebviewUrl::App(format!("index.html?{query}").into())
}

fn reveal(window: &WebviewWindow) {
    if window.is_minimized().unwrap_or(false) {
        let _ = window.unminimize();
    }

    let _ = window.set_focus();
}

pub fn create_selection_window(
    app: &AppHandle,
    action: Option<&str>,
) -> tauri::Result<WebviewWindow> {
    if let Some(window) = app.get_webview_window(SELECTION) {
        reveal(&window);

        if let Some(action) = action {
            let _ = app.emit_to(SELECTION, action, ());
        }

        return Ok(window);
    }

    let builder = WebviewWindowBuilder::new(
        app,
        SELECTION,
        app_url(&[("action", action.unwrap_or(""))]),
    )
    .title("GBA Studio")
    .inner_size(720.0, 480.0)
    .resizable(false)
    .maximizable(false);

    #[cfg(target_os = "macos")]
    let builder = builder
        .decorations(false)
        .minimizable(false)
        .transparent(true)
        .effects(
            tauri::window::EffectsBuilder::new()
                .effect(tauri::window::Effect::UnderWindowBackground)
                .state(tauri::window::EffectState::Active)
                .radius(26.0)
                .build(),
        );

    #[cfg(target_os = "linux")]
    let builder = builder.decorations(false);

    builder.build()
}

pub fn create_project_window(
    app: &AppHandle,
    project_path: &str,
) -> tauri::Result<WebviewWindow> {
    let windows = app.state::<Windows>();
    let existing = windows.opened.lock().unwrap().get(project_path).cloned();

    if let Some(window) = existing.and_then(|label| app.get_webview_window(&label)) {
        reveal(&window);

        return Ok(window);
    }

    let label = project_label(project_path);
    let project_base = Path::new(project_path)
        .parent()
        .map(|dir| dir.to_string_lossy().into_owned())
        .unwrap_or_default();
    let resources = app
        .state::<ResourcesDir>()
        .0
        .to_string_lossy()
        .into_owned();

    app.state::<ProjectRoots>()
        .set(&label, Path::new(&project_base).to_path_buf());
    windows
        .opened
        .lock()
        .unwrap()
        .insert(project_path.to_string(), label.clone());

    let builder = WebviewWindowBuilder::new(
        app,
        &label,
        app_url(&[
            ("projectPath", project_path),
            ("projectBase", &project_base),
            ("resourcesPath", &resources),
            ("isFullscreen", "false"),
            ("isDev", if cfg!(debug_assertions) { "true" } else { "false" }),
        ]),
    )
    .title("GBA Studio")
    .inner_size(800.0, 600.0)
    .maximized(true);

    #[cfg(target_os = "macos")]
    let builder = builder
        .title_bar_style(tauri::TitleBarStyle::Overlay)
        .hidden_title(true)
        .traffic_light_position(tauri::LogicalPosition::new(24.0, 24.0))
        .transparent(true)
        .effects(
            tauri::window::EffectsBuilder::new()
                .effect(tauri::window::Effect::UnderWindowBackground)
                .state(tauri::window::EffectState::Active)
                .build(),
        );

    let window = builder.build();

    if window.is_err() {
        forget_project_window(app, &label);
    }

    window
}

/// Opens the editor for a project, then closes the window that asked for it.
pub fn open_project(
    app: &AppHandle,
    caller: Option<&str>,
    project_path: &str,
) -> Result<(), String> {
    let caller = caller.and_then(|label| app.get_webview_window(label));

    if let Some(caller) = &caller {
        let _ = caller.hide();
    }

    if let Err(error) = create_project_window(app, project_path) {
        if let Some(caller) = &caller {
            let _ = caller.show();
        }

        return Err(error.to_string());
    }

    if let Some(caller) = caller {
        let _ = caller.close();
    }

    Ok(())
}

fn forget_project_window(app: &AppHandle, label: &str) {
    let windows = app.state::<Windows>();

    windows.opened.lock().unwrap().retain(|_, l| l != label);
    windows.confirmed.lock().unwrap().remove(label);
    windows.fullscreen.lock().unwrap().remove(label);
    app.state::<ProjectRoots>().remove(label);
}

/// Closes a window without asking again about unsaved changes.
pub fn allow_close(app: &AppHandle, label: &str) {
    app.state::<Windows>()
        .confirmed
        .lock()
        .unwrap()
        .insert(label.to_string());

    if let Some(window) = app.get_webview_window(label) {
        let _ = window.close();
    }
}

/// Closes every window, letting each editor ask about unsaved changes first.
pub fn request_quit(app: &AppHandle) {
    app.state::<Windows>().set_quitting(true);

    let open = app.webview_windows();

    if open.is_empty() {
        app.exit(0);

        return;
    }

    for window in open.values() {
        let _ = window.close();
    }
}

pub fn on_window_event(window: &Window, event: &WindowEvent) {
    let app = window.app_handle();
    let label = window.label();
    let windows = app.state::<Windows>();

    match event {
        WindowEvent::CloseRequested { api, .. } if is_project_label(label) => {
            // The renderer decides whether to save, discard or cancel first
            if !windows.confirmed.lock().unwrap().contains(label) {
                api.prevent_close();
                let _ = app.emit_to(label, "request-close", ());
            }
        }
        WindowEvent::Destroyed => {
            forget_project_window(app, label);

            let others = app.webview_windows().keys().any(|other| other != label);

            if windows.is_quitting() && !others {
                app.exit(0);
            }
        }
        WindowEvent::Focused(true) => menus::apply(app, label),
        WindowEvent::Resized(_) if is_project_label(label) => {
            let fullscreen = window.is_fullscreen().unwrap_or(false);
            let previous = windows
                .fullscreen
                .lock()
                .unwrap()
                .insert(label.to_string(), fullscreen)
                .unwrap_or(false);

            if previous != fullscreen {
                let _ = app.emit_to(label, "fullscreen-updated", fullscreen);
            }
        }
        _ => {}
    }
}

pub fn on_exit_requested(app: &AppHandle, api: &ExitRequestApi, code: Option<i32>) {
    // An explicit `app.exit()` has already been through our quit flow
    if code.is_some() {
        return;
    }

    if app.webview_windows().is_empty() {
        // Last window closed: macOS apps stay alive until explicitly quit
        if cfg!(target_os = "macos") && !app.state::<Windows>().is_quitting() {
            api.prevent_exit();
        }
    } else {
        // System-level quit (Dock, Cmd+Q) while windows are open
        api.prevent_exit();
        request_quit(app);
    }
}
