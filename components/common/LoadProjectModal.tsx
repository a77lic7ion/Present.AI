
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { usePresentationStore } from '../../store/presentationStore';
import type { Project } from '../../types';
import { FolderOpenIcon } from '../icons';

interface LoadProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoadProjectModal: React.FC<LoadProjectModalProps> = ({ isOpen, onClose }) => {
  const projects = useLiveQuery(() => db.projects.orderBy('createdAt').reverse().toArray());
  const loadProject = usePresentationStore(s => s.loadProject);

  if (!isOpen) return null;

  const handleLoadProject = (project: Project & { id: number }) => {
    loadProject(project);
    onClose();
  };
  
  const handleDeleteProject = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      await db.projects.delete(id);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[var(--dark-void)] border border-[#333] rounded-lg shadow-xl p-8 w-full max-w-2xl m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Load Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl">&times;</button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {projects && projects.length > 0 ? (
            <ul className="space-y-3">
              {projects.map(project => project && project.id && (
                <li key={project.id} className="bg-[var(--input-bg)] p-4 rounded-lg flex justify-between items-center group">
                  <div>
                    <p className="font-semibold text-lg text-white">{project.title}</p>
                    <p className="text-sm text-gray-400">
                      Created on: {new Date(project.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLoadProject(project as Project & { id: number })}
                      className="px-4 py-2 text-sm rounded-md bg-[var(--orange-primary)] text-black font-bold hover:bg-[var(--orange-secondary)] transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id!)}
                      className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-10">
              <FolderOpenIcon className="mx-auto h-12 w-12 text-gray-600" />
              <p className="mt-4 text-gray-400">No saved projects found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadProjectModal;
