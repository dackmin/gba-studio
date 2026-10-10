use std::{
  fs, io,
  path::{Path, PathBuf},
};

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

const MAX_RECENT_PROJECTS: usize = 10;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RecentProject {
  pub name: String,
  pub path: PathBuf,
}

/// Mirrors the Electron `config.json` so existing user data keeps working.
#[derive(Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Storage {
  #[serde(default)]
  pub recent_projects: Vec<RecentProject>,
  // Keys owned by the editor (buildConfiguration, clipboard...) must survive a save.
  #[serde(flatten)]
  extra: Map<String, Value>,
  #[serde(skip)]
  config_path: PathBuf,
}

impl Storage {
  pub fn default_config_path() -> PathBuf {
    dirs::config_dir()
      .unwrap_or_else(|| PathBuf::from("."))
      .join("GBA Studio")
      .join("config.json")
  }

  pub fn load() -> Self {
    Self::load_from(Self::default_config_path())
  }

  pub fn load_from(config_path: PathBuf) -> Self {
    let mut storage = fs::read_to_string(&config_path)
      .ok()
      .and_then(|content| serde_json::from_str::<Storage>(&content).ok())
      .unwrap_or_default();

    storage.config_path = config_path;
    storage
  }

  pub fn save(&self) -> io::Result<()> {
    if let Some(dir) = self.config_path.parent() {
      fs::create_dir_all(dir)?;
    }

    let mut content = serde_json::to_string_pretty(self).map_err(io::Error::other)?;
    content.push('\n');

    fs::write(&self.config_path, content)
  }

  pub fn add_recent_project(&mut self, name: &str, path: &Path) -> io::Result<()> {
    self.recent_projects.retain(|p| p.path != path);
    self.recent_projects.insert(
      0,
      RecentProject {
        name: name.to_owned(),
        path: path.to_owned(),
      },
    );
    self.recent_projects.truncate(MAX_RECENT_PROJECTS);

    self.save()
  }

  pub fn remove_recent_project(&mut self, path: &Path) -> io::Result<()> {
    self.recent_projects.retain(|p| p.path != path);

    self.save()
  }

  pub fn clear_recent_projects(&mut self) -> io::Result<()> {
    self.recent_projects.clear();

    self.save()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn temp_config(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("gbas-core-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    dir.join("config.json")
  }

  #[test]
  fn keeps_unknown_keys_and_caps_recent_projects() {
    let path = temp_config("storage");
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    fs::write(&path, r#"{"buildConfiguration":"release","recentProjects":[]}"#).unwrap();

    let mut storage = Storage::load_from(path.clone());
    for i in 0..12 {
      storage
        .add_recent_project(&format!("p{i}"), Path::new(&format!("/p{i}.gbasproj")))
        .unwrap();
    }
    storage
      .add_recent_project("p11 again", Path::new("/p11.gbasproj"))
      .unwrap();

    let reloaded = Storage::load_from(path.clone());
    assert_eq!(reloaded.recent_projects.len(), MAX_RECENT_PROJECTS);
    assert_eq!(reloaded.recent_projects[0].name, "p11 again");
    assert!(fs::read_to_string(&path).unwrap().contains("buildConfiguration"));

    fs::remove_dir_all(path.parent().unwrap()).unwrap();
  }
}
