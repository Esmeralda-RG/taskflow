import { Paperclip, Send } from 'lucide-react';
import PropTypes from 'prop-types';

function TaskActivityPanel({
    comments,
    commentsLoading,
    commentData,
    commentFiles,
    commentSaving,
    commentError,
    setCommentData,
    setCommentFiles,
    handleCommentSubmit,
    formatCommentDate,
    getAttachmentUrl,
    COMMENT_INTERACTIONS,
    getInteractionMeta
}) {
    return (
        <aside className="flex flex-col bg-gray-50 lg:max-h-[calc(100vh-12rem)] min-h-[600px] rounded-r-3xl border-l border-gray-200">
            <div className="border-b border-gray-200 p-5 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900">
                    Actividad
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                    Comentarios, interacción y carga de archivos
                </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5 min-h-0">
                {commentsLoading && (
                    <div className="text-center py-6 text-gray-400 text-sm">
                        Cargando comentarios...
                    </div>
                )}

                {!commentsLoading && comments.length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-sm">
                        No hay comentarios
                    </div>
                )}

                {!commentsLoading &&
                    comments.map((comment) => {
                        const interaction = getInteractionMeta(
                            comment.interaction
                        );

                        return (
                            <div
                                key={comment.id}
                                className="rounded-2xl border border-gray-100 bg-white p-4"
                            >
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {comment.user?.name ||
                                                comment.user?.email ||
                                                'Usuario'}
                                        </p>

                                        <p className="text-xs text-gray-400">
                                            {formatCommentDate(
                                                comment.createdAt
                                            )}
                                        </p>
                                    </div>

                                    <span
                                        className={`inline-flex w-fit px-3 py-1 rounded-full text-xs font-medium ${interaction.className}`}
                                    >
                                        {interaction.label}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                    {comment.content}
                                </p>

                                {comment.attachments?.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {comment.attachments.map(
                                            (attachment) => (
                                                <a
                                                    key={attachment.id}
                                                    href={getAttachmentUrl(
                                                        attachment.fileUrl
                                                    )}
                                                    download={
                                                        attachment.fileName
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block truncate rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-[#5B5CF0] hover:bg-white"
                                                >
                                                    {attachment.fileName}
                                                </a>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
            </div>

            <form
                onSubmit={handleCommentSubmit}
                className="border-t border-gray-200 bg-white p-5 flex-shrink-0 space-y-4 rounded-br-3xl"
            >
                <div>
                    <p className="block text-sm font-medium text-gray-700 mb-2">
                        Interacción
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {COMMENT_INTERACTIONS.map((interaction) => (
                            <button
    key={interaction.value}
    type="button"
    onClick={() =>
        setCommentData({
            ...commentData,
            interaction: interaction.value
        })
    }
    title={interaction.label}
    className={`w-10 h-10 flex items-center justify-center rounded-xl ${interaction.className} ${
        commentData.interaction === interaction.value
            ? 'ring-2 ring-[#5B5CF0]'
            : ''
    }`}
>
    {interaction.icon}
</button>
                        ))}
                    </div>
                </div>

                <textarea
                    value={commentData.content}
                    onChange={(e) =>
                        setCommentData({
                            ...commentData,
                            content: e.target.value
                        })
                    }
                    className="w-full min-h-[80px] max-h-[120px] px-4 py-3 rounded-xl bg-gray-100 border border-transparent resize-none focus:outline-none focus:ring-2 focus:ring-[#5B5CF0] text-sm text-gray-800"
                    placeholder="Escribe un comentario..."
                    required
                />

                <input
                    id="comment-files"
                    type="file"
                    multiple
                    accept=".pdf,.docx,.doc,.txt,.xlsx,.xls,.png,.jpg,.jpeg"
                    onChange={(e) =>
                        setCommentFiles(
                            Array.from(e.target.files || [])
                        )
                    }
                    className="hidden"
                />

                {commentFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 max-h-[60px] overflow-y-auto py-1">
                        {commentFiles.map((file) => (
                            <span
                                key={`${file.name}-${file.size}`}
                                className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-xs font-medium truncate max-w-[180px]"
                            >
                                {file.name}
                            </span>
                        ))}
                    </div>
                )}

                {commentError && (
                    <div className="text-red-500 text-sm">
                        {commentError}
                    </div>
                )}

                <div className="flex items-center justify-between pt-1">
                    <label
                        htmlFor="comment-files"
                        className="flex items-center justify-center w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 cursor-pointer text-gray-600 transition-colors"
                    >
                        <Paperclip size={18} />
                    </label>

                    <button
                        type="submit"
                        disabled={commentSaving}
                        className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#5B5CF0] hover:bg-[#4A4BDB] text-white disabled:opacity-50 transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </aside>
    );
}

TaskActivityPanel.propTypes = {
    comments: PropTypes.array.isRequired,
    commentsLoading: PropTypes.bool.isRequired,
    commentData: PropTypes.object.isRequired,
    commentFiles: PropTypes.array.isRequired,
    commentSaving: PropTypes.bool.isRequired,
    commentError: PropTypes.string,
    setCommentData: PropTypes.func.isRequired,
    setCommentFiles: PropTypes.func.isRequired,
    handleCommentSubmit: PropTypes.func.isRequired,
    formatCommentDate: PropTypes.func.isRequired,
    getAttachmentUrl: PropTypes.func.isRequired,
    COMMENT_INTERACTIONS: PropTypes.array.isRequired,
    getInteractionMeta: PropTypes.func.isRequired
};

export default TaskActivityPanel;