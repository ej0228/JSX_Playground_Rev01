// src/Pages/Tracing/CreateTrace.jsx
import { langfuse } from '../../lib/langfuse';

/**
 * Langfuse 문서를 기반으로 새로운 Trace와 그에 속한 Observation들을 생성하는 함수
 * @param {function} callback - Trace 생성 후 실행될 콜백 함수 (예: 목록 새로고침)
 */
export const createTrace = async (callback) => {
  try {
    const trace = langfuse.trace({
      name: "chat-app-session-test5",
      userId: "user_0822",
      sessionId: "session-l",
      metadata: { user: "user@wini-tech.com", from: "createTrace function" },
      tags: ["development", "new-trace"],
      input: "hello",
      output: "hi what can i help you",
    });

    // --- Observation 생성 로직 추가 ---

    // 1. Event 생성
    trace.event({
      name: "get-user-profile",
      metadata: {
        attempt: 2,
        httpRoute: "/api/retrieve-person",
      },
      input: {
        userId: "user__935d7d1d-8625-4ef4-8651-544613e7bd22",
      },
      output: {
        firstName: "Maxine",
        lastName: "Simons",
        email: "maxine.simons@langfuse.com",
      },
    });

    // 2. Span 생성
    const span = trace.span({
      name: "embedding-retrieval",
      input: {
        userInput: "How does Langfuse work?",
      },
    });
    // Span은 작업이 끝나면 end()를 호출하여 종료합니다.
    span.end();

    // 3. Generation 생성
    const generation = trace.generation({
      name: "chat-completion",
      model: "gpt-3.5-turbo",
      modelParameters: {
        temperature: 0.9,
        maxTokens: 2000,
      },
      input: [{ role: "user", content: "Hello" }],
    });

    // Generation 종료 시점에 output을 기록합니다.
    generation.end({
      output: "안녕하세요!",
    });

    // ------------------------------------

    // 데이터를 즉시 서버로 전송합니다.
    await langfuse.flush();

    alert(`새로운 Trace 생성 요청이 전송되었습니다. ID: ${trace.id}`);
    
    // 생성된 Trace의 ID를 반환합니다.
    return trace.id;

  } catch (error) {
    console.error("Trace 생성 중 오류 발생:", error);
    alert("Trace 생성에 실패했습니다. 콘솔을 확인해주세요.");
    return null;
  }
};

/**
 * Langfuse 문서를 기반으로 기존 Trace를 업데이트하는 함수
 * @param {object} trace - 업데이트할 Langfuse Trace 객체
 * @param {function} callback - Trace 업데이트 후 실행될 콜백 함수
 */
export const updateTrace = async (trace, callback) => {
  if (!trace || !trace.id) {
    alert("업데이트할 유효한 Trace 객체가 전달되지 않았습니다.");
    return;
  }
  try {
    trace.update({
      metadata: {
        tag: "long-running-test-updated",
        updatedAt: new Date().toISOString()
      },
    });
    
    // 업데이트된 내용도 즉시 전송합니다.
    await langfuse.flush();

    alert(`Trace가 업데이트되었습니다. ID: ${trace.id}`);

    // 업데이트된 내용도 지연 후 콜백을 실행합니다.
    await flushAndReloadWithDelay(callback);

  } catch (error) {
    console.error("Trace 업데이트 중 오류 발생:", error);
    alert("Trace 업데이트에 실패했습니다. 콘솔을 확인해주세요.");
  }
};
