use std::path::Path;

use serde_json::{json, Value};
use tauri::{AppHandle, Manager, WebviewWindow};

use crate::{host, protocol::ResourcesDir, storage::Storage, windows};

fn arg_str(args: &[Value], index: usize) -> &str {
    args.get(index).and_then(Value::as_str).unwrap_or("")
}

fn opt_str<'a>(opts: Option<&'a Value>, key: &str) -> &'a str {
    opts.and_then(|opts| opts.get(key))
        .and_then(Value::as_str)
        .unwrap_or("")
}

// Mirrors Node's `path.join` closely enough for picker results.
fn join(parts: &[&str]) -> String {
    let mut joined = parts
        .iter()
        .filter(|part| !part.is_empty())
        .copied()
        .collect::<Vec<_>>()
        .join("/");

    while joined.contains("//") {
        joined = joined.replace("//", "/");
    }

    joined
}

fn filters(opts: Option<&Value>) -> host::Filters {
    opts.and_then(|opts| opts.get("filters"))
        .and_then(Value::as_array)
        .map(|filters| {
            filters
                .iter()
                .map(|filter| {
                    let extensions = filter["extensions"]
                        .as_array()
                        .map(|list| {
                            list.iter()
                                .filter_map(Value::as_str)
                                .map(String::from)
                                .collect()
                        })
                        .unwrap_or_default();

                    (filter["name"].as_str().unwrap_or("").to_string(), extensions)
                })
                .collect()
        })
        .unwrap_or_default()
}

/// Single entry point for every renderer call. Channels without a native
/// implementation yet will fall back to the Node sidecar.
#[tauri::command]
pub async fn ipc_invoke(
    window: WebviewWindow,
    app: AppHandle,
    channel: String,
    args: Vec<Value>,
) -> Result<Value, String> {
    let label = window.label().to_string();
    let storage = app.state::<Storage>();

    match channel.as_str() {
        "get-resources-path" => Ok(json!(app
            .state::<ResourcesDir>()
            .0
            .to_string_lossy()
            .to_string())),
        "get-rom-path" => {
            let stem = Path::new(arg_str(&args, 0))
                .file_stem()
                .map(|stem| stem.to_string_lossy().into_owned())
                .unwrap_or_default();

            Ok(json!(format!("out/{stem}.gba")))
        }

        "get-recent-projects" => Ok(storage.recent_projects()),
        "clear-recent-projects" => storage.clear_recent_projects().map(|_| Value::Null),
        "remove-recent-project" => storage
            .remove_recent_project(arg_str(&args, 0))
            .map(|_| Value::Null),
        "get-editor-config" => Ok(storage.read()),
        "set-editor-config" => storage
            .replace(args.into_iter().next().unwrap_or_else(|| json!({})))
            .map(|_| Value::Null),
        "register-clipboard" => storage
            .set_clipboard(args.into_iter().next().unwrap_or(Value::Null))
            .map(|_| Value::Null),
        "get-clipboard" => Ok(storage.clipboard()),

        "browse-directory" => {
            let opts = args.first();
            let directory = host::open_directory(&app).await?;

            Ok(json!(directory
                .map(|dir| join(&[opt_str(opts, "prefix"), &dir, opt_str(opts, "suffix")]))
                .unwrap_or_default()))
        }
        "browse-file" => {
            let opts = args.first();
            let file = host::open_file(&app, filters(opts)).await?;

            Ok(json!(file
                .map(|file| join(&[opt_str(opts, "prefix"), &file]))
                .unwrap_or_default()))
        }
        "browse-project" => {
            if let Some(project_path) = host::open_project(&app).await? {
                windows::open_project(&app, Some(&label), &project_path)?;
            }

            Ok(Value::Null)
        }
        "load-recent-project" => {
            let project_path = arg_str(&args, 0);

            if Path::new(project_path).exists() {
                windows::open_project(&app, Some(&label), project_path)?;
            } else {
                host::show_error(
                    &app,
                    "Project Not Found",
                    &format!("The project at \"{project_path}\" could not be found."),
                )
                .await?;
            }

            Ok(Value::Null)
        }
        "open-parent-folder" => {
            let project_path = arg_str(&args, 0);
            let file_path = arg_str(&args, 1);

            let target = match file_path.strip_prefix("project://") {
                Some(relative) => Path::new(project_path)
                    .parent()
                    .unwrap_or_else(|| Path::new(""))
                    .join(relative)
                    .to_string_lossy()
                    .into_owned(),
                None => file_path.to_string(),
            };

            host::show_item_in_folder(&target).map(|_| Value::Null)
        }

        "show-unsaved-changes-dialog" => host::confirm_unsaved_changes(&app, &label)
            .await
            .map(|choice| json!(choice)),
        "confirm-close" => {
            windows::allow_close(&app, &label);

            Ok(Value::Null)
        }
        "cancel-close" => {
            app.state::<windows::Windows>().set_quitting(false);

            Ok(Value::Null)
        }

        _ => Err(format!("channel `{channel}` is not implemented yet")),
    }
}
