import { langfuse } from 'lib/langfuse'

export const getProjects = async () => {
    const response = await langfuse.api.projectsGet();
    return response.data;
};

export const getApiKeys = async (projectId) => {
    const response = await langfuse.api.projectsGetApiKeys(projectId);
    return response.apiKeys;
};

export const createApiKey = async (projectId, note = null) => {
    return langfuse.api.projectsCreateApiKey(projectId, { note });
}

export const deleteApiKey = async (projectId, publicKey) => {
    await langfuse.api.projectsDeleteApiKey(projectId, publicKey);
}