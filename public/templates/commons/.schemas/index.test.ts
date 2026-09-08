import { describe, it, expect } from 'vitest';
import Ajv from 'ajv';

import background from './background.json' with { type: 'json' };
import condition from './condition.json' with { type: 'json' };
import event from './event.json' with { type: 'json' };
import music from './music.json' with { type: 'json' };
import scene from './scene.json' with { type: 'json' };
import script from './script.json' with { type: 'json' };
import sound from './sound.json' with { type: 'json' };
import sprite from './sprite.json' with { type: 'json' };
import variable from './variable.json' with { type: 'json' };

describe('JSON Schemas', () => {
  it('should validate all schemas & refs', () => {
    // Constructor should explode if any schema is not valid)
    const validator = new Ajv({
      schemas: [
        background,
        condition,
        event,
        music,
        scene,
        script,
        sound,
        sprite,
        variable,
      ],
    });

    expect(validator.errors).toBeNull();
  });
});
