mod fonts;
mod glass;
mod project_selection;

use std::path::PathBuf;

use eframe::egui;
use gbas_core::storage::Storage;
use project_selection::ProjectSelection;

struct App {
  selection: ProjectSelection,
  opened_project: Option<PathBuf>,
}

impl eframe::App for App {
  fn ui(&mut self, ui: &mut egui::Ui, _frame: &mut eframe::Frame) {
    let Some(path) = &self.opened_project else {
      self.opened_project = self.selection.ui(ui);
      return;
    };

    let mut back = false;

    egui::CentralPanel::default_margins().show(ui, |ui| {
      ui.vertical_centered(|ui| {
        ui.add_space(160.0);
        ui.heading("Editor not implemented yet");
        ui.label(path.display().to_string());
        ui.add_space(12.0);
        back = ui.button("Back").clicked();
      });
    });

    if back {
      self.opened_project = None;
    }
  }
}

fn main() -> eframe::Result {
  let options = eframe::NativeOptions {
    // egui_glass only supports the wgpu renderer.
    renderer: eframe::Renderer::Wgpu,
    viewport: egui::ViewportBuilder::default()
      .with_title("GBA Studio")
      .with_inner_size([720.0, 480.0])
      .with_resizable(false)
      .with_maximize_button(false),
    ..Default::default()
  };

  eframe::run_native(
    "GBA Studio",
    options,
    Box::new(|cc| {
      egui_extras::install_image_loaders(&cc.egui_ctx);
      fonts::install_system_font(&cc.egui_ctx);

      let render_state = cc
        .wgpu_render_state
        .clone()
        .expect("eframe must use the wgpu renderer");
      // 1 matches the default (no MSAA) sample count.
      egui_glass::init(&render_state, 1);

      Ok(Box::new(App {
        selection: ProjectSelection::new(Storage::load(), render_state),
        opened_project: None,
      }))
    }),
  )
}
