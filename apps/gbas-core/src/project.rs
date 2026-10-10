use std::{
  fs, io,
  path::{Path, PathBuf},
};

use include_dir::{include_dir, Dir};
use serde::{Deserialize, Serialize};

static BLANK_TEMPLATE: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../public/templates/blank");
static SAMPLE_2D_TEMPLATE: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../public/templates/2d-sample");

pub const PROJECT_EXTENSION: &str = "gbasproj";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProjectTemplate {
  Sample2d,
  Blank,
}

impl ProjectTemplate {
  fn dir(self) -> &'static Dir<'static> {
    match self {
      Self::Sample2d => &SAMPLE_2D_TEMPLATE,
      Self::Blank => &BLANK_TEMPLATE,
    }
  }
}

/// Only the fields needed to bootstrap a project; the editor owns the rest.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameProject {
  pub name: String,
  #[serde(default)]
  pub scenes: Vec<serde_json::Value>,
  #[serde(default)]
  pub rom_name: String,
  #[serde(default)]
  pub rom_code: String,
}

pub fn slugify(name: &str) -> String {
  slug::slugify(name)
}

/// Creates the project directory from a template and returns the `.gbasproj` path.
pub fn create_project(
  template: ProjectTemplate,
  name: &str,
  dir: &Path,
) -> io::Result<(PathBuf, GameProject)> {
  fs::create_dir_all(dir)?;
  template.dir().extract(dir)?;

  let project = GameProject {
    name: name.to_owned(),
    scenes: Vec::new(),
    rom_name: "MY AWESOME GAME".to_owned(),
    rom_code: "MAG".to_owned(),
  };

  let project_path = dir.join(format!("{}.{PROJECT_EXTENSION}", slugify(name)));
  let mut content = serde_json::to_string_pretty(&project).map_err(io::Error::other)?;
  content.push('\n');
  fs::write(&project_path, content)?;

  Ok((project_path, project))
}

pub fn read_project(path: &Path) -> io::Result<GameProject> {
  serde_json::from_str(&fs::read_to_string(path)?).map_err(io::Error::other)
}

/// Accepts either a `.gbasproj` file or a directory containing one.
pub fn find_project_file(path: &Path) -> Option<PathBuf> {
  if path.is_dir() {
    return fs::read_dir(path)
      .ok()?
      .flatten()
      .map(|entry| entry.path())
      .find(|p| p.extension().is_some_and(|ext| ext == PROJECT_EXTENSION));
  }

  (path.is_file() && path.extension().is_some_and(|ext| ext == PROJECT_EXTENSION))
    .then(|| path.to_owned())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn creates_project_from_template() {
    let dir = std::env::temp_dir().join(format!("gbas-core-project-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);

    let (path, project) = create_project(ProjectTemplate::Blank, "My Game", &dir).unwrap();

    assert_eq!(path, dir.join("my-game.gbasproj"));
    assert_eq!(project.name, "My Game");
    assert_eq!(read_project(&path).unwrap().rom_code, "MAG");
    assert_eq!(find_project_file(&dir), Some(path));
    assert!(dir.join(".gitignore").exists());

    fs::remove_dir_all(&dir).unwrap();
  }
}
