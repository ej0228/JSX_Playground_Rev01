import { trpcGet, trpcPost } from "./trpc";

export const SchemasAPI = {
    list(projectId) {
        return trpcGet("llmSchemas.getAll", { projectId });
    },
    create(projectId, { name, description, schema }) {
        return trpcPost("llmSchemas.create", { projectId, name, description, schema });
    },
    update(projectId, { id, name, description, schema }) {
        return trpcPost("llmSchemas.update", { id, projectId, name, description, schema });
    },
    delete(projectId, id) {
        return trpcPost("llmSchemas.delete", { id, projectId });
    },
};
