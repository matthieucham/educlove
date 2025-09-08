import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import type { FileWithPath } from 'react-dropzone';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type AppFile = File & {
  preview: string;
  id: string;
};

const SortableItem = ({ file, removeFile }: { file: AppFile; removeFile: (fileId: string) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative">
      <img src={file.preview} alt={file.name} className="w-24 h-24 object-cover rounded-lg shadow-md" />
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeFile(file.id);
        }}
        className="absolute top-[-5px] right-[-5px] bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
      >
        X
      </button>
    </div>
  );
};

const ImageUploader: React.FC = () => {
  const [files, setFiles] = useState<AppFile[]>([]);

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    const newFiles = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file),
      id: `${file.name}-${file.lastModified}-${file.size}`,
    }));
    setFiles(prevFiles => [...prevFiles, ...newFiles].slice(0, 8));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 8,
  });

  const removeFile = (fileId: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${isDragActive ? 'border-purple-600 bg-purple-100' : 'border-gray-300'}`}
      >
        <input {...getInputProps()} />
        <p>Glissez-déposez des photos ici, ou cliquez pour sélectionner des fichiers (max 8).</p>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={files.map(f => f.id)}
          strategy={rectSortingStrategy}
        >
          <div className="mt-4 grid grid-cols-4 gap-4">
            {files.map(file => (
              <SortableItem key={file.id} file={file} removeFile={removeFile} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default ImageUploader;
