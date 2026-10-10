use egui::*;

fn createProjectSelectionWindow() {
  egui::Window::new("Project Selection").show(&ctx, |ui| {
    ui.label("Select a project to open:");
  });
}

fn main() {
  createProjectSelectionWindow();
}
