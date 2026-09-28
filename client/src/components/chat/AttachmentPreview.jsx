import React from 'react';
import { X, FileText, Image as ImageIcon } from 'lucide-react';
import { formatBytes } from '../../utils/helpers';

export function AttachmentPreview({ attachments = [], onRemove }) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-3 pt-2 pb-1 border-b border-gray-100 dark:border-surface-dark-border">
      {attachments.map((file, idx) => {
        const isImage = file.mimeType?.startsWith('image/');

        return (
          <div
            key={idx}
            className="group relative flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-gray-100 dark:bg-surface-dark-card border border-gray-200 dark:border-surface-dark-border text-xs text-gray-700 dark:text-gray-200 animate-fade-in max-w-[220px]"
          >
            {isImage && file.base64Data ? (
              <img
                src={`data:${file.mimeType};base64,${file.base64Data}`}
                alt={file.fileName || 'Attachment preview'}
                className="w-7 h-7 object-cover rounded-lg border border-gray-300 dark:border-gray-700"
              />
            ) : isImage ? (
              <ImageIcon className="w-4 h-4 text-brand-500 shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
            )}

            <div className="overflow-hidden min-w-0 pr-1">
              <p className="truncate font-medium text-[11px] leading-tight">
                {file.fileName || 'Attachment'}
              </p>
              {file.size && (
                <span className="text-[10px] text-gray-400">
                  {formatBytes(file.size)}
                </span>
              )}
            </div>

            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-surface-dark-hover text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors shrink-0"
                aria-label={`Remove ${file.fileName || 'attachment'}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AttachmentPreview;
