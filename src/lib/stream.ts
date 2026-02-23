export function createSSEStream(
  generateStream: () => Promise<AsyncIterable<{ text?: string }>>
): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = await generateStream();
        let fullContent = "";

        for await (const chunk of stream) {
          const text = chunk.text ?? "";
          fullContent += text;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "chunk", content: text })}\n\n`
            )
          );
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done", fullContent })}\n\n`
          )
        );
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: String(error) })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });
}
