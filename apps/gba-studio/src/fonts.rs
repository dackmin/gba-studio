use egui::{
  Context, FontData, FontFamily,
  epaint::text::{FontInsert, FontPriority, InsertFontFamily},
};
use fontdb::{Database, Family, Query};

// Mirrors the Radix Themes stack; the trailing Linux names stand in for `system-ui`.
// `.SF NS` is the file-level name behind `-apple-system` on macOS.
const CANDIDATES: &[&str] = &[
  ".SF NS",
  "Segoe UI",
  "Roboto",
  "Helvetica Neue",
  "Open Sans",
  "Cantarell",
  "Noto Sans",
  "DejaVu Sans",
];

fn load_system_font() -> Option<(String, FontData)> {
  let mut db = Database::new();
  db.load_system_fonts();

  let families: Vec<Family> = CANDIDATES
    .iter()
    .map(|name| Family::Name(name))
    .chain([Family::SansSerif])
    .collect();

  // Query takes the first family that exists, so try them one at a time.
  let id = families.iter().find_map(|family| {
    db.query(&Query {
      families: std::slice::from_ref(family),
      ..Default::default()
    })
  })?;

  let name = db.face(id)?.families.first()?.0.clone();
  let data = db.with_face_data(id, |data, index| FontData {
    index,
    ..FontData::from_owned(data.to_vec())
  })?;

  Some((name, data))
}

/// Puts the OS UI font first; the bundled egui fonts stay as glyph fallbacks.
pub fn install_system_font(ctx: &Context) {
  let Some((name, data)) = load_system_font() else {
    return;
  };

  ctx.add_font(FontInsert::new(
    &name,
    data,
    vec![InsertFontFamily {
      family: FontFamily::Proportional,
      priority: FontPriority::Highest,
    }],
  ));
}
