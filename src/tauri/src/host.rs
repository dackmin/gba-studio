use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::{
    DialogExt, FilePath, MessageDialogButtons, MessageDialogKind, MessageDialogResult,
};

pub type Filters = Vec<(String, Vec<String>)>;

fn to_path(file: Option<FilePath>) -> Option<String> {
    file.and_then(|file| file.into_path().ok())
        .map(|path| path.to_string_lossy().into_owned())
}

// The plugin's blocking dialogs must not run on the main thread or an async worker.
async fn blocking<T: Send + 'static>(
    work: impl FnOnce() -> T + Send + 'static,
) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(work)
        .await
        .map_err(|e| e.to_string())
}

pub async fn open_directory(app: &AppHandle) -> Result<Option<String>, String> {
    let app = app.clone();

    blocking(move || to_path(app.dialog().file().blocking_pick_folder())).await
}

pub async fn open_file(app: &AppHandle, filters: Filters) -> Result<Option<String>, String> {
    let app = app.clone();

    blocking(move || {
        let mut dialog = app.dialog().file();

        for (name, extensions) in &filters {
            let extensions: Vec<&str> = extensions.iter().map(String::as_str).collect();
            dialog = dialog.add_filter(name, &extensions);
        }

        to_path(dialog.blocking_pick_file())
    })
    .await
}

// A native picker cannot offer files and folders at once, so only `.gbasproj` files are selectable.
pub async fn open_project(app: &AppHandle) -> Result<Option<String>, String> {
    open_file(
        app,
        vec![("GBA Studio Project".into(), vec!["gbasproj".into()])],
    )
    .await
}

pub async fn confirm_unsaved_changes(
    app: &AppHandle,
    window_label: &str,
) -> Result<&'static str, String> {
    const SAVE: &str = "Save";
    const DISCARD: &str = "Don't Save";
    const CANCEL: &str = "Cancel";

    let app = app.clone();
    let label = window_label.to_string();

    let result = blocking(move || {
        let mut dialog = app
            .dialog()
            .message("Your changes will be lost if you don't save them.")
            .title("Do you want to save the changes you made to this project?")
            .kind(MessageDialogKind::Warning)
            .buttons(MessageDialogButtons::YesNoCancelCustom(
                SAVE.into(),
                DISCARD.into(),
                CANCEL.into(),
            ));

        if let Some(window) = app.get_webview_window(&label) {
            dialog = dialog.parent(&window);
        }

        dialog.blocking_show_with_result()
    })
    .await?;

    Ok(match result {
        MessageDialogResult::Custom(choice) if choice == SAVE => "save",
        MessageDialogResult::Custom(choice) if choice == DISCARD => "discard",
        MessageDialogResult::Yes => "save",
        MessageDialogResult::No => "discard",
        _ => "cancel",
    })
}

pub async fn show_error(app: &AppHandle, title: &str, message: &str) -> Result<(), String> {
    let app = app.clone();
    let (title, message) = (title.to_string(), message.to_string());

    blocking(move || {
        app.dialog()
            .message(message)
            .title(title)
            .kind(MessageDialogKind::Error)
            .blocking_show();
    })
    .await
}

pub fn show_item_in_folder(path: &str) -> Result<(), String> {
    tauri_plugin_opener::reveal_item_in_dir(path).map_err(|e| e.to_string())
}
