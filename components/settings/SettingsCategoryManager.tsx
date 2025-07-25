import * as React from 'react';
import { SettingsCategory } from '../../types';

interface SettingsCategoryManagerProps<T extends SettingsCategory> {
  categoryName: string;
  items: T[];
  createItem: (name: string) => Promise<T>;
  updateItem: (id: string, name: string) => Promise<T>;
  deleteItem: (id: string) => Promise<void>;
  onDataChange: () => void;
}

export const SettingsCategoryManager = <T extends SettingsCategory,>({
  categoryName,
  items,
  createItem,
  updateItem,
  deleteItem,
  onDataChange,
}: SettingsCategoryManagerProps<T>) => {
  const [isEditing, setIsEditing] = React.useState<T | null>(null);
  const [name, setName] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || isSubmitting) return;

      setIsSubmitting(true);
      setError(null);

      try {
        if (isEditing) {
          await updateItem(isEditing.id, name);
        } else {
          await createItem(name);
        }
        setName('');
        setIsEditing(null);
        onDataChange();
      } catch (err) {
        setError(
          `Failed to save ${categoryName.toLowerCase()}. Name might already exist.`
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, isSubmitting, isEditing, updateItem, createItem, onDataChange, categoryName]
  );

  const handleEdit = React.useCallback((item: T) => {
    setIsEditing(item);
    setName(item.name);
  }, []);

  const handleCancelEdit = React.useCallback(() => {
    setIsEditing(null);
    setName('');
    setError(null);
  }, []);

  const handleDelete = React.useCallback(
    async (id: string) => {
      if (
        window.confirm(
          `Are you sure you want to delete this ${categoryName.toLowerCase()}? This action cannot be undone.`
        )
      ) {
        try {
          await deleteItem(id);
          onDataChange();
        } catch (err) {
          setError(
            `Failed to delete ${categoryName.toLowerCase()}. It may be in use.`
          );
        }
      }
    },
    [deleteItem, onDataChange, categoryName]
  );

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-6 flex items-end space-x-3">
        <div className="flex-grow">
          <label
            htmlFor="category-name"
            className="block text-sm font-medium text-slate-300"
          >
            {isEditing ? `Editing ${categoryName}` : `New ${categoryName} Name`}
          </label>
          <input
            id="category-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            placeholder={`Enter a ${categoryName.toLowerCase()} name`}
            required
          />
        </div>
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-emerald-500 disabled:bg-slate-500"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add'}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="inline-flex justify-center py-2 px-4 border border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="flow-root">
        <ul role="list" className="divide-y divide-slate-700">
          {items.map((item) => (
            <li
              key={item.id}
              className="py-3 sm:py-4 flex items-center justify-between"
            >
              <p className="text-sm font-medium text-slate-200 truncate">
                {item.name}
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => handleEdit(item)}
                  className="text-blue-400 hover:text-blue-300 font-medium text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-500 hover:text-red-400 font-medium text-sm"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};