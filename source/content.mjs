import en from '../content/en.json' with { type: 'json' };
import tr from '../content/tr.json' with { type: 'json' };
import profile from '../content/profile.json' with { type: 'json' };
import topics from './models.json' with { type: 'json' };

export const { name, email, profiles, programmingLanguages } = profile;
export const copy = { en, tr };
export { topics };
