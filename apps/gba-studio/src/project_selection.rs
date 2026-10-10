use std::path::{Path, PathBuf};

use eframe::egui_wgpu::RenderState;
use egui::{
  Align, Align2, Button, CentralPanel, Context, CornerRadius, FontId, Frame, Id, Layout, Margin,
  Modal, Panel, RichText, ScrollArea, Sense, TextEdit, Ui, vec2,
};
use egui_glass::{Glass, GlassButton};
use gbas_core::{
  project::{self, ProjectTemplate, PROJECT_EXTENSION},
  storage::{RecentProject, Storage},
};

use crate::glass;

const DEFAULT_PROJECT_NAME: &str = "my-awesome-game";
const ROW_HEIGHT: f32 = 48.0;

struct NewProjectForm {
  template: ProjectTemplate,
  name: String,
  location: String,
  error: Option<String>,
}

impl Default for NewProjectForm {
  fn default() -> Self {
    Self {
      template: ProjectTemplate::Sample2d,
      name: String::new(),
      location: String::new(),
      error: None,
    }
  }
}

enum RowAction {
  Select,
  Open,
  Remove,
}

pub struct ProjectSelection {
  storage: Storage,
  selected: Option<PathBuf>,
  new_project: Option<NewProjectForm>,
  error: Option<(String, String)>,
  render_state: RenderState,
  backdrop_dark: Option<bool>,
}

impl ProjectSelection {
  pub fn new(storage: Storage, render_state: RenderState) -> Self {
    let selected = storage.recent_projects.first().map(|p| p.path.clone());

    Self {
      storage,
      selected,
      new_project: None,
      error: None,
      render_state,
      backdrop_dark: None,
    }
  }

  /// Returns the path of the project to open, once the user picked or created one.
  pub fn ui(&mut self, ui: &mut Ui) -> Option<PathBuf> {
    let mut to_open = None;
    let dark = ui.visuals().dark_mode;

    self.sync_backdrop(ui.ctx(), dark);
    egui_glass::show_backdrop(ui, ui.max_rect());

    Panel::right("recent_projects")
      .exact_size(300.0)
      .resizable(false)
      .frame(Frame::NONE)
      .show(ui, |ui| {
        Frame::new().inner_margin(Margin::same(8)).show(ui, |ui| {
          Glass::new(glass::panel_style(dark))
            .inner_margin(Margin::same(8))
            .show(ui, |ui| {
              ui.set_min_size(ui.available_size());
              self.recent_projects_ui(ui, &mut to_open);
            });
        });
      });

    CentralPanel::default_margins()
      .frame(Frame::NONE)
      .show(ui, |ui| self.home_ui(ui, dark, &mut to_open));

    self.new_project_modal(ui, dark, &mut to_open);
    self.error_modal(ui, dark);

    to_open.and_then(|path| self.open(&path))
  }

  // The glass only samples this image, so it must follow the light/dark theme.
  fn sync_backdrop(&mut self, ctx: &Context, dark: bool) {
    if self.backdrop_dark != Some(dark) {
      let _ = egui_glass::set_backdrop(ctx, &self.render_state, &glass::backdrop_image(dark));
      self.backdrop_dark = Some(dark);
    }
  }

  fn home_ui(&mut self, ui: &mut Ui, dark: bool, to_open: &mut Option<PathBuf>) {
    ui.vertical_centered(|ui| {
      ui.add_space(48.0);
      ui.add(
        egui::Image::new(egui::include_image!("../../../public/icon.svg"))
          .fit_to_exact_size(vec2(100.0, 100.0))
          .corner_radius(16),
      );
      ui.add_space(12.0);
      ui.heading("GBA Studio");
      ui.label(format!("v{}", env!("CARGO_PKG_VERSION")));
      ui.add_space(48.0);

      if GlassButton::new("Create a new project")
        .style(glass::button_style(dark))
        .min_size(vec2(220.0, 36.0))
        .show(ui)
        .clicked()
      {
        self.new_project = Some(NewProjectForm::default());
      }

      ui.add_space(4.0);
      if GlassButton::new("Open an existing project")
        .style(glass::button_style(dark))
        .min_size(vec2(220.0, 36.0))
        .show(ui)
        .clicked()
      {
        let picked = rfd::FileDialog::new()
          .add_filter("GBA Studio project", &[PROJECT_EXTENSION])
          .pick_file();

        if picked.is_some() {
          *to_open = picked;
        }
      }

      ui.add_space(8.0);
      if ui.small_button("Clear recent projects").clicked() {
        let result = self.storage.clear_recent_projects();
        self.report_io(result);
        self.selected = None;
      }
    });
  }

  fn recent_projects_ui(&mut self, ui: &mut Ui, to_open: &mut Option<PathBuf>) {
    if self.storage.recent_projects.is_empty() {
      ui.centered_and_justified(|ui| ui.label("No recent projects"));
      return;
    }

    let mut action = None;

    ScrollArea::vertical().auto_shrink(false).show(ui, |ui| {
      for project in &self.storage.recent_projects {
        let selected = self.selected.as_deref() == Some(project.path.as_path());
        let response = project_row(ui, project, selected);

        if response.double_clicked() {
          action = Some((project.path.clone(), RowAction::Open));
        } else if response.clicked() || response.secondary_clicked() {
          action = Some((project.path.clone(), RowAction::Select));
        }

        response.context_menu(|ui| {
          if ui.button("Open").clicked() {
            action = Some((project.path.clone(), RowAction::Open));
            ui.close();
          }
          if ui.button("Remove from recent projects").clicked() {
            action = Some((project.path.clone(), RowAction::Remove));
            ui.close();
          }
        });
      }
    });

    match action {
      Some((path, RowAction::Select)) => self.selected = Some(path),
      Some((path, RowAction::Open)) => *to_open = Some(path),
      Some((path, RowAction::Remove)) => {
        if self.selected.as_deref() == Some(path.as_path()) {
          self.selected = None;
        }
        let result = self.storage.remove_recent_project(&path);
        self.report_io(result);
      }
      None => {}
    }
  }

  fn new_project_modal(&mut self, ui: &mut Ui, dark: bool, to_open: &mut Option<PathBuf>) {
    let Some(form) = self.new_project.as_mut() else {
      return;
    };

    let mut create = false;
    let mut cancel = false;

    let response = Modal::new(Id::new("new_project"))
      .frame(Frame::NONE)
      .show(ui.ctx(), |ui| {
        Glass::new(glass::panel_style(dark))
          .inner_margin(Margin::same(20))
          .show(ui, |ui| {
            ui.set_width(360.0);
            ui.vertical_centered(|ui| ui.heading("Create a new project"));
            ui.add_space(8.0);

            ui.horizontal(|ui| {
              ui.selectable_value(&mut form.template, ProjectTemplate::Sample2d, "Sample 2D Project");
              ui.selectable_value(&mut form.template, ProjectTemplate::Blank, "Blank Project");
            });

            ui.add_space(8.0);
            ui.label(RichText::new("Project Name").small());
            ui.add(
              TextEdit::singleline(&mut form.name)
                .hint_text("My Awesome Game")
                .desired_width(f32::INFINITY),
            );

            ui.add_space(8.0);
            ui.label(RichText::new("Project Location").small());
            ui.horizontal(|ui| {
              let browse_width = 70.0;
              ui.add(
                TextEdit::singleline(&mut form.location)
                  .hint_text("/path/to/my-awesome-game")
                  .desired_width(ui.available_width() - browse_width - ui.spacing().item_spacing.x),
              );

              if ui.add_sized([browse_width, 0.0], Button::new("Browse")).clicked() {
                if let Some(dir) = rfd::FileDialog::new().pick_folder() {
                  let slug = project::slugify(&form.name);
                  let suffix = if slug.is_empty() { DEFAULT_PROJECT_NAME } else { &slug };
                  form.location = dir.join(suffix).to_string_lossy().into_owned();
                }
              }
            });

            if let Some(error) = &form.error {
              ui.add_space(8.0);
              ui.colored_label(ui.visuals().error_fg_color, error);
            }

            ui.add_space(12.0);
            ui.with_layout(Layout::right_to_left(Align::Center), |ui| {
              let can_submit = !form.name.trim().is_empty() && !form.location.trim().is_empty();

              if ui.add_enabled(can_submit, Button::new("Create")).clicked() {
                create = true;
              }
              if ui.button("Cancel").clicked() {
                cancel = true;
              }
            });
          });
      });

    if create {
      let location = PathBuf::from(form.location.trim());

      match project::create_project(form.template, form.name.trim(), &location) {
        Ok((path, project)) => {
          let result = self.storage.add_recent_project(&project.name, &path);
          self.new_project = None;
          self.report_io(result);
          *to_open = Some(path);
        }
        Err(e) => form.error = Some(format!("Could not create the project: {e}")),
      }
    } else if cancel || response.should_close() {
      self.new_project = None;
    }
  }

  fn error_modal(&mut self, ui: &mut Ui, dark: bool) {
    let Some((title, message)) = &self.error else {
      return;
    };

    let mut dismiss = false;

    let response = Modal::new(Id::new("error"))
      .frame(Frame::NONE)
      .show(ui.ctx(), |ui| {
        Glass::new(glass::panel_style(dark))
          .inner_margin(Margin::same(20))
          .show(ui, |ui| {
            ui.set_max_width(360.0);
            ui.heading(title);
            ui.add_space(8.0);
            ui.label(message);
            ui.add_space(12.0);
            ui.with_layout(Layout::right_to_left(Align::Center), |ui| {
              dismiss = ui.button("OK").clicked();
            });
          });
      });

    if dismiss || response.should_close() {
      self.error = None;
    }
  }

  fn open(&mut self, path: &Path) -> Option<PathBuf> {
    let Some(file) = project::find_project_file(path) else {
      self.error = Some((
        "Project Not Found".to_owned(),
        format!("The project at \"{}\" could not be found.", path.display()),
      ));
      return None;
    };

    match project::read_project(&file) {
      Ok(project) => {
        let result = self.storage.add_recent_project(&project.name, &file);
        self.report_io(result);
        Some(file)
      }
      Err(e) => {
        self.error = Some((
          "Invalid Project".to_owned(),
          format!("The project at \"{}\" could not be read: {e}", file.display()),
        ));
        None
      }
    }
  }

  fn report_io(&mut self, result: std::io::Result<()>) {
    if let Err(e) = result {
      self.error = Some(("Could not save settings".to_owned(), e.to_string()));
    }
  }
}

fn project_row(ui: &mut Ui, project: &RecentProject, selected: bool) -> egui::Response {
  let (rect, response) = ui.allocate_exact_size(vec2(ui.available_width(), ROW_HEIGHT), Sense::click());

  if ui.is_rect_visible(rect) {
    let visuals = ui.visuals();
    let (fill, text_color) = if selected {
      (Some(visuals.selection.bg_fill), visuals.selection.stroke.color)
    } else if response.hovered() {
      (Some(visuals.widgets.hovered.bg_fill), visuals.text_color())
    } else {
      (None, visuals.text_color())
    };
    let weak_color = if selected { text_color } else { visuals.weak_text_color() };

    if let Some(fill) = fill {
      ui.painter().rect_filled(rect, CornerRadius::same(8), fill);
    }

    let painter = ui.painter().with_clip_rect(rect.shrink2(vec2(10.0, 0.0)));
    painter.text(
      rect.left_top() + vec2(10.0, 8.0),
      Align2::LEFT_TOP,
      &project.name,
      FontId::proportional(14.0),
      text_color,
    );
    painter.text(
      rect.left_top() + vec2(10.0, 28.0),
      Align2::LEFT_TOP,
      project.path.to_string_lossy(),
      FontId::proportional(11.0),
      weak_color,
    );
  }

  response
}
