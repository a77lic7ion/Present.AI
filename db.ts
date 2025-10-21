import Dexie, { type Table } from 'dexie';
import type { Project } from './types';

// FIX: Refactored from a class-based approach to a direct Dexie instance.
// This resolves a TypeScript error where the 'version' method was not found on the subclass instance
// within the constructor. This is a common and robust pattern for using Dexie.
export const db = new Dexie('presentai-database') as Dexie & {
  projects: Table<Project>;
};

db.version(1).stores({
  projects: '++id, title, createdAt' // Primary key and indexed props
});
