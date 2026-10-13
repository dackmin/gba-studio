use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
    sync::Mutex,
};

use percent_encoding::percent_decode_str;
use tauri::{
    http::{header, Request, Response, StatusCode, Uri},
    Manager, Runtime, UriSchemeContext, UriSchemeResponder,
};

/// Directory a window's `project://` URLs resolve against, keyed by window label.
#[derive(Default)]
pub struct ProjectRoots(Mutex<HashMap<String, PathBuf>>);

impl ProjectRoots {
    #[allow(dead_code)]
    pub fn set(&self, label: &str, root: PathBuf) {
        self.0.lock().unwrap().insert(label.to_string(), root);
    }

    #[allow(dead_code)]
    pub fn remove(&self, label: &str) {
        self.0.lock().unwrap().remove(label);
    }

    fn get(&self, label: &str) -> Option<PathBuf> {
        self.0.lock().unwrap().get(label).cloned()
    }
}

/// Directory that contains `public/`, served by `resources://`.
pub struct ResourcesDir(pub PathBuf);

pub fn project<R: Runtime>(
    ctx: UriSchemeContext<'_, R>,
    request: Request<Vec<u8>>,
    responder: UriSchemeResponder,
) {
    let app = ctx.app_handle().clone();
    let label = ctx.webview_label().to_string();

    tauri::async_runtime::spawn_blocking(move || {
        let root = app.state::<ProjectRoots>().get(&label);
        responder.respond(serve(root.as_deref(), request.uri()));
    });
}

pub fn resources<R: Runtime>(
    ctx: UriSchemeContext<'_, R>,
    request: Request<Vec<u8>>,
    responder: UriSchemeResponder,
) {
    let app = ctx.app_handle().clone();

    tauri::async_runtime::spawn_blocking(move || {
        let root = app.state::<ResourcesDir>().0.clone();
        responder.respond(serve(Some(&root), request.uri()));
    });
}

/// Windows and Android serve custom schemes as `http://<scheme>.localhost/<path>`,
/// macOS and Linux as `<scheme>://<host>/<path>`. Electron-style URLs such as
/// `resources://public/x` put the first path segment in the host.
fn request_path(uri: &Uri) -> String {
    let path = percent_decode_str(uri.path()).decode_utf8_lossy().into_owned();

    match uri.host() {
        Some(host) if host != "localhost" && !host.ends_with(".localhost") => {
            format!("{host}{path}")
        }
        _ => path,
    }
}

/// Resolves `relative` inside `root`, refusing anything that escapes it.
fn resolve(root: &Path, relative: &str) -> Option<PathBuf> {
    let root = root.canonicalize().ok()?;
    let file = root
        .join(relative.trim_start_matches('/'))
        .canonicalize()
        .ok()?;

    file.starts_with(&root).then_some(file)
}

fn serve(root: Option<&Path>, uri: &Uri) -> Response<Vec<u8>> {
    let file = root.and_then(|root| resolve(root, &request_path(uri)));

    match file.and_then(|file| fs::read(&file).ok().map(|body| (file, body))) {
        Some((file, body)) => reply(
            StatusCode::OK,
            mime_guess::from_path(&file).first_or_octet_stream().essence_str(),
            body,
        ),
        None => reply(StatusCode::NOT_FOUND, "text/plain", Vec::new()),
    }
}

// The page is cross-origin isolated (COEP require-corp), so subresources must opt in.
fn reply(status: StatusCode, mime: &str, body: Vec<u8>) -> Response<Vec<u8>> {
    Response::builder()
        .status(status)
        .header(header::CONTENT_TYPE, mime)
        .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
        .header("Cross-Origin-Resource-Policy", "cross-origin")
        .body(body)
        .expect("static response parts are valid")
}
