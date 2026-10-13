mod host;
mod ipc;
mod menus;
mod protocol;
mod storage;
mod windows;

use std::path::PathBuf;

use tauri::{AppHandle, Manager, RunEvent};

/// Directory that contains `public/` (templates, vendors, fonts).
fn resources_dir(app: &AppHandle) -> PathBuf {
    if let Some(dir) = std::env::var_os("GBAS_RESOURCES") {
        return PathBuf::from(dir);
    }

    if cfg!(debug_assertions) {
        // Dev reads `public/` in place from the repo root (src/tauri -> src -> root)
        return PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .ancestors()
            .nth(2)
            .expect("crate is not nested in the repository")
            .to_path_buf();
    }

    app.path()
        .resource_dir()
        .expect("failed to resolve the resource directory")
}

fn project_arg() -> Option<String> {
    std::env::args()
        .skip(1)
        .find(|arg| arg.ends_with(".gbasproj"))
}

pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(protocol::ProjectRoots::default())
        .manage(windows::Windows::default())
        .register_asynchronous_uri_scheme_protocol("project", protocol::project)
        .register_asynchronous_uri_scheme_protocol("resources", protocol::resources)
        .on_window_event(windows::on_window_event)
        .invoke_handler(tauri::generate_handler![ipc::ipc_invoke])
        .setup(|app| {
            let handle = app.handle();

            app.manage(protocol::ResourcesDir(resources_dir(handle)));
            app.manage(storage::Storage::new(app.path().app_data_dir()?)?);
            app.manage(menus::create(handle)?);
            app.on_menu_event(menus::on_event);

            match project_arg() {
                Some(project_path) => {
                    let window = windows::create_project_window(handle, &project_path)?;
                    menus::apply(handle, window.label());
                }
                None => {
                    windows::create_selection_window(handle, None)?;
                    menus::apply(handle, windows::SELECTION);
                }
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building GBA Studio");

    app.run(|app, event| match event {
        RunEvent::ExitRequested { api, code, .. } => {
            windows::on_exit_requested(app, &api, code);
        }
        #[cfg(target_os = "macos")]
        RunEvent::Reopen {
            has_visible_windows: false,
            ..
        } => {
            let _ = windows::create_selection_window(app, None);
        }
        #[cfg(target_os = "macos")]
        RunEvent::Opened { urls } => {
            for path in urls.iter().filter_map(|url| url.to_file_path().ok()) {
                let _ = windows::create_project_window(app, &path.to_string_lossy());
            }
        }
        _ => {}
    });
}
