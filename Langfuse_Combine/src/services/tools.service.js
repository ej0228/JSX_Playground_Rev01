// src/services/tools.service.js
import { trpcGet, trpcPost } from "./trpc";

export const ToolsAPI = {
    list(projectId) {
        return trpcGet("llmTools.getAll", { projectId });
    },
    create(projectId, { name, description, parameters }) {
        return trpcPost("llmTools.create", { projectId, name, description, parameters });
    },
    update(projectId, { id, name, description, parameters }) {
        return trpcPost("llmTools.update", { id, projectId, name, description, parameters });
    },
    delete(projectId, id) {
        return trpcPost("llmTools.delete", { id, projectId });
    },
};
