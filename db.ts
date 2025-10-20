import Dexie, { type Table } from 'dexie';
import type { Project } from './types';

export class AppDatabase extends Dexie {
  projects!: Table<Project>; 

  constructor() {
    super('presentai-database');
    this.version(1).stores({
      projects: '++id, title, createdAt' // Primary key and indexed props
    });
  }
}

export const db = new AppDatabase();