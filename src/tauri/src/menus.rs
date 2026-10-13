use tauri::{
    menu::{Menu, MenuBuilder, MenuEvent, MenuItem, MenuItemBuilder, SubmenuBuilder},
    AppHandle, Emitter, Manager, WebviewWindow, Wry,
};
use tauri_plugin_opener::OpenerExt;

use crate::windows;

pub struct Menus {
    selection: Menu<Wry>,
    editor: Menu<Wry>,
}

pub fn create(app: &AppHandle) -> tauri::Result<Menus> {
    Ok(Menus {
        selection: build(app, false)?,
        editor: build(app, true)?,
    })
}

/// Swaps the application menu to match the focused window.
pub fn apply(app: &AppHandle, label: &str) {
    let menus = app.state::<Menus>();
    let menu = if windows::is_project_label(label) {
        &menus.editor
    } else {
        &menus.selection
    };

    let _ = app.set_menu(menu.clone());
}

fn item(
    app: &AppHandle,
    id: &str,
    label: &str,
    accelerator: Option<&str>,
) -> tauri::Result<MenuItem<Wry>> {
    let mut builder = MenuItemBuilder::with_id(id, label);

    if let Some(accelerator) = accelerator {
        builder = builder.accelerator(accelerator);
    }

    builder.build(app)
}

fn build(app: &AppHandle, editor: bool) -> tauri::Result<Menu<Wry>> {
    let mac = cfg!(target_os = "macos");
    let mut menu = MenuBuilder::new(app);

    if mac {
        let quit = item(app, "quit", "Quit GBA Studio", Some("CmdOrCtrl+Q"))?;
        let app_menu = SubmenuBuilder::new(app, "GBA Studio")
            .about(None)
            .separator()
            .services()
            .separator()
            .hide()
            .hide_others()
            .show_all()
            .separator()
            .item(&quit)
            .build()?;

        menu = menu.item(&app_menu);
    }

    let new_project = item(app, "new-project", "New Project", Some("CmdOrCtrl+N"))?;
    let open_project = item(app, "open-project", "Open Project", Some("CmdOrCtrl+Shift+O"))?;
    let mut file = SubmenuBuilder::new(app, "File")
        .item(&new_project)
        .item(&open_project);

    if editor {
        let save = item(app, "save", "Save", Some("CmdOrCtrl+S"))?;
        let close = item(app, "close", "Close", Some("CmdOrCtrl+W"))?;
        let import = SubmenuBuilder::new(app, "Import...")
            .text("import-sprite", "Sprite")
            .text("import-background", "Background")
            .text("import-sound", "Sound")
            .text("import-music", "Music")
            .build()?;

        file = file
            .separator()
            .item(&save)
            .item(&close)
            .separator()
            .item(&import);
    }

    file = file.separator();

    if !mac {
        file = file.item(&item(app, "quit", "Quit", Some("CmdOrCtrl+Q"))?);
    } else if !editor {
        file = file.close_window();
    }

    let undo = item(app, "undo", "Undo", Some("CmdOrCtrl+Z"))?;
    let redo = item(app, "redo", "Redo", Some("CmdOrCtrl+Shift+Z"))?;
    let cut = item(app, "cut", "Cut", Some("CmdOrCtrl+X"))?;
    let copy = item(app, "copy", "Copy", Some("CmdOrCtrl+C"))?;
    let paste = item(app, "paste", "Paste", Some("CmdOrCtrl+V"))?;
    let edit = SubmenuBuilder::new(app, "Edit")
        .item(&undo)
        .item(&redo)
        .separator()
        .item(&cut)
        .item(&copy)
        .item(&paste)
        .select_all()
        .build()?;

    menu = menu.item(&file.build()?).item(&edit);

    if editor {
        let build_project = item(app, "build-project", "Build Project", Some("CmdOrCtrl+Enter"))?;
        let clean = item(app, "clean-build-folder", "Clean Build Folder", None)?;
        let rebuild = item(
            app,
            "rebuild-project",
            "Clean And Rebuild Project",
            Some("CmdOrCtrl+Shift+Enter"),
        )?;
        let build_menu = SubmenuBuilder::new(app, "Build")
            .item(&build_project)
            .item(&clean)
            .item(&rebuild)
            .build()?;

        menu = menu.item(&build_menu);
    }

    let mut view = SubmenuBuilder::new(app, "View");

    if cfg!(debug_assertions) {
        let reload = item(app, "reload", "Reload", None)?;
        let devtools = item(app, "toggle-devtools", "Toggle Developer Tools", None)?;

        view = view.item(&reload).item(&devtools).separator();
    }

    let view = view.fullscreen().build()?;

    let mut window_menu = SubmenuBuilder::new(app, "Window").minimize();

    if !mac {
        window_menu = window_menu.close_window();
    }

    let window_menu = window_menu.build()?;
    let learn_more = item(app, "learn-more", "Learn More", None)?;
    let help = SubmenuBuilder::new(app, "Help").item(&learn_more).build()?;

    menu.item(&view).item(&window_menu).item(&help).build()
}

fn focused_window(app: &AppHandle) -> Option<WebviewWindow> {
    app.webview_windows()
        .into_values()
        .find(|window| window.is_focused().unwrap_or(false))
}

// Cut, copy, paste and undo are custom items so the renderer gets its own
// events; editable fields still need the browser's native behaviour.
fn edit_editable_field(window: &WebviewWindow, action: &str) {
    const EDITABLE: &str = "const e=document.activeElement;\
        const editable=e&&(e.isContentEditable||/^(INPUT|TEXTAREA)$/.test(e.tagName));";

    let script = if action == "paste" {
        format!(
            "(async()=>{{{EDITABLE}if(editable){{try{{\
            document.execCommand('insertText',false,await navigator.clipboard.readText())\
            }}catch{{}}}}}})()"
        )
    } else {
        format!("(()=>{{{EDITABLE}if(editable){{document.execCommand('{action}')}}}})()")
    };

    let _ = window.eval(script);
}

pub fn on_event(app: &AppHandle, event: MenuEvent) {
    let id = event.id().as_ref();
    let focused = focused_window(app);

    match id {
        "quit" => windows::request_quit(app),
        "new-project" => {
            let _ = windows::create_selection_window(app, Some("new-project"));
        }
        "open-project" => match &focused {
            Some(window) if windows::is_project_label(window.label()) => {
                let _ = windows::create_selection_window(app, None);
            }
            Some(window) => {
                let _ = app.emit_to(window.label(), "browse-project", ());
            }
            None => {}
        },
        "close" => {
            if let Some(window) = &focused {
                let _ = window.close();
            }
        }
        "undo" | "redo" | "cut" | "copy" | "paste" => {
            if let Some(window) = &focused {
                edit_editable_field(window, id);
                let _ = app.emit_to(window.label(), id, ());
            }
        }
        "save" | "import-sprite" | "import-background" | "import-sound" | "import-music"
        | "build-project" | "clean-build-folder" | "rebuild-project" => {
            if let Some(window) = &focused {
                let _ = app.emit_to(window.label(), id, ());
            }
        }
        "reload" => {
            if let Some(window) = &focused {
                let _ = window.eval("location.reload()");
            }
        }
        "toggle-devtools" => {
            #[cfg(debug_assertions)]
            if let Some(window) = &focused {
                if window.is_devtools_open() {
                    window.close_devtools();
                } else {
                    window.open_devtools();
                }
            }
        }
        "learn-more" => {
            let _ = app
                .opener()
                .open_url("https://github.com/dackmin/gba-studio", None::<&str>);
        }
        _ => {}
    }
}
