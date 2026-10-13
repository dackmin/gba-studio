use std::{fs, path::PathBuf, sync::Mutex};

use serde_json::{json, Value};

/// `config.json` in the app data directory. Stateless on purpose: the Node
/// sidecar reads and writes the same file, so nothing is cached here.
pub struct Storage {
    path: PathBuf,
    lock: Mutex<()>,
}

impl Storage {
    pub fn new(dir: PathBuf) -> std::io::Result<Self> {
        fs::create_dir_all(&dir)?;

        Ok(Self {
            path: dir.join("config.json"),
            lock: Mutex::new(()),
        })
    }

    fn load(&self) -> Value {
        fs::read_to_string(&self.path)
            .ok()
            .and_then(|content| serde_json::from_str::<Value>(&content).ok())
            .filter(Value::is_object)
            .unwrap_or_else(|| json!({}))
    }

    fn store(&self, config: &Value) -> Result<(), String> {
        let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;

        fs::write(&self.path, content + "\n").map_err(|e| e.to_string())
    }

    pub fn read(&self) -> Value {
        let _guard = self.lock.lock().unwrap();

        self.load()
    }

    pub fn replace(&self, config: Value) -> Result<(), String> {
        let _guard = self.lock.lock().unwrap();

        self.store(&config)
    }

    fn update(&self, change: impl FnOnce(&mut Value)) -> Result<(), String> {
        let _guard = self.lock.lock().unwrap();
        let mut config = self.load();
        change(&mut config);

        self.store(&config)
    }

    pub fn recent_projects(&self) -> Value {
        self.read()
            .get("recentProjects")
            .cloned()
            .unwrap_or_else(|| json!([]))
    }

    pub fn remove_recent_project(&self, project_path: &str) -> Result<(), String> {
        self.update(|config| {
            let kept: Vec<Value> = config["recentProjects"]
                .as_array()
                .map(|projects| {
                    projects
                        .iter()
                        .filter(|p| p["path"].as_str() != Some(project_path))
                        .cloned()
                        .collect()
                })
                .unwrap_or_default();

            config["recentProjects"] = Value::Array(kept);
        })
    }

    pub fn clear_recent_projects(&self) -> Result<(), String> {
        self.update(|config| config["recentProjects"] = json!([]))
    }

    pub fn set_clipboard(&self, data: Value) -> Result<(), String> {
        self.update(|config| config["clipboard"] = data)
    }

    pub fn clipboard(&self) -> Value {
        self.read().get("clipboard").cloned().unwrap_or(Value::Null)
    }
}
