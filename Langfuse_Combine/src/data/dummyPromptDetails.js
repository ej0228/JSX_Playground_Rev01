/**
 * @typedef {Object} PromptContent
 * @property {string} system
 * @property {string} user
 * @property {string[]=} variables
 */

/**
 * @typedef {Object} ConfigContent
 * @property {number} temperature
 * @property {number} max_tokens
 * @property {number} top_p
 * @property {number} frequency_penalty
 * @property {number} presence_penalty
 */

/** @typedef {{ python: string, jsTs: string }} UseContent */

/**
 * @typedef {Object} Version
 * @property {number} id
 * @property {string} label
 * @property {'latest'|'production'|null} status
 * @property {string} details
 * @property {string} author
 * @property {PromptContent} prompt
 * @property {ConfigContent} config
 * @property {UseContent} useprompts
 */

/**
 * @typedef {Object} PromptDetailData
 * @property {string} id
 * @property {string} name
 * @property {Version[]} versions
 */

// --- 프롬프트별 상세 더미 데이터 ---
export const dummyPromptDetails = [
  {
    id: "qa-answer-no-context-chat",
    name: "qa-answer-no-context-chat",
    versions: [
      {
        id: 5,
        label: "test",
        status: "latest",
        details: "7/17/2025, 8:57:50 PM",
        author: "Marc Klingen",
        prompt: {
          system: `You are a very enthusiastic Langfuse representative who loves to help people! Langfuse is an open source observability tool for developers of applications that use Large Language Models (LLMs).

Answer with "Sorry, I don't know how to help with that." if the question is not related to Langfuse or if you are unable to answer it based on the context.`,
          user: `{{question}}

The following variables are available:`,
          variables: ["question"],
        },
        config: {
          temperature: 1,
          max_tokens: 256,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        },
        useprompts: {
          python: "python Example",
          jsTs: "jsTs Example",
        },
      },
      {
        id: 4,
        label: "production",
        status: "production",
        details: "chore: fix typo\n3/1/2025, 7:17:20 AM",
        author: "Marcus Mayerhofer",
        prompt: {
          system: `This is the PRODUCTION version for qa-answer-no-context-chat.`,
          user: `Answer based on: {{question}}`,
          variables: ["question"],
        },
        config: {
          temperature: 0.8,
          max_tokens: 512,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        },
        useprompts: {
          python: "python Example",
          jsTs: "jsTs Example",
        },
      },
    ],
  },
  {
    id: "qa-answer-with-context-chat",
    name: "qa-answer-with-context-chat",
    versions: [
      {
        id: 2,
        label: "Initial version",
        status: "latest",
        details: "8/1/2025, 10:00:00 AM",
        author: "Alex Johnson",
        prompt: {
          system: `You are an expert Q&A system. Use the provided context to answer the user's question.`,
          user: `Context: {{context}}\n\nQuestion: {{question}}`,
          variables: ["context", "question"],
        },
        config: {
          temperature: 0.5,
          max_tokens: 500,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        },
        useprompts: {
          python: "python Example",
          jsTs: "jsTs Example",
        },
      },
      {
        id: 1,
        label: "Draft",
        status: null,
        details: "7/30/2025, 2:30:00 PM",
        author: "Alex Johnson",
        prompt: {
          system: "Answer questions based on context.",
          user: `{{context}}\n\n{{question}}`,
          variables: ["context", "question"],
        },
        config: {
          temperature: 0.7,
          max_tokens: 400,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        },
        useprompts: {
          python: "python Example",
          jsTs: "jsTs Example",
        },
      },
    ],
  },
  // 다른 프롬프트들에 대한 상세 데이터도 여기에 추가할 수 있습니다.
];
