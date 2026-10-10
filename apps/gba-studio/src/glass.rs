use egui::{Color32, ColorImage};
use egui_glass::GlassStyle;

const BACKDROP_SIZE: usize = 256;

// Orbs give the lens something to refract; a plain gradient looks flat.
const ORBS: [(f32, f32, f32); 3] = [(0.25, 0.40, 0.30), (0.78, 0.58, 0.35), (0.55, 0.25, 0.20)];

fn lerp(a: [u8; 3], b: [u8; 3], t: f32) -> [f32; 3] {
  [0, 1, 2].map(|i| a[i] as f32 + (b[i] as f32 - a[i] as f32) * t)
}

/// The static image the glass samples; egui_glass cannot see the desktop behind the window.
pub fn backdrop_image(dark: bool) -> ColorImage {
  let (stops, orb): ([[u8; 3]; 3], [f32; 3]) = if dark {
    ([[26, 11, 46], [88, 36, 150], [29, 59, 143]], [255.0, 140.0, 220.0])
  } else {
    ([[233, 220, 255], [201, 182, 255], [191, 224, 255]], [255.0, 255.0, 255.0])
  };

  let mut image = ColorImage::filled([BACKDROP_SIZE, BACKDROP_SIZE], Color32::BLACK);
  let max = (BACKDROP_SIZE - 1) as f32;

  for y in 0..BACKDROP_SIZE {
    for x in 0..BACKDROP_SIZE {
      let (fx, fy) = (x as f32 / max, y as f32 / max);
      let t = (fx + fy) / 2.0;
      let mut rgb = if t < 0.5 {
        lerp(stops[0], stops[1], t * 2.0)
      } else {
        lerp(stops[1], stops[2], (t - 0.5) * 2.0)
      };

      for (cx, cy, radius) in ORBS {
        let glow = (1.0 - ((fx - cx).hypot(fy - cy) / radius)).clamp(0.0, 1.0);
        let amount = glow * glow * 0.55;
        for i in 0..3 {
          rgb[i] += (orb[i] - rgb[i]) * amount;
        }
      }

      image[(x, y)] = Color32::from_rgb(rgb[0] as u8, rgb[1] as u8, rgb[2] as u8);
    }
  }

  image
}

pub fn panel_style(dark: bool) -> GlassStyle {
  GlassStyle {
    corner_radius: 20.0,
    ..if dark { GlassStyle::panel_dark() } else { GlassStyle::panel() }
  }
}

pub fn button_style(dark: bool) -> GlassStyle {
  if dark { GlassStyle::dark() } else { GlassStyle::regular() }
}
