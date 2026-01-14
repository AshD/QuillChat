export type ChatCompletionModel = {
  id: string;
};

type ModelResponse = {
  data?: ChatCompletionModel[];
};

export const listChatCompletionModels = async (baseUrl: string, apiKey?: string) => {
  if (!baseUrl) {
    return [];
  }

  const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/v1/models`, {
    method: 'GET',
    headers: {
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const message = errorBody || response.statusText || 'Failed to fetch models.';
    throw new Error(message);
  }

  const payload = (await response.json()) as ModelResponse;
  if (!Array.isArray(payload.data)) {
    return [];
  }

  return payload.data
    .map((model) => model?.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);
};
