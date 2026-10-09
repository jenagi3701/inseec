// Minimal i18n layer. French is the default market language.
// To add English: create en.ts with the same keys and switch `dict` based on a
// user setting (e.g. state.locale). Page-level copy is still inline French in
// this prototype; move it here progressively as screens stabilise.
import { fr } from './fr';

export type Key = keyof typeof fr;
const dict: Record<Key, string> = fr;

export const t = (key: Key) => dict[key];
