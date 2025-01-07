export const getAudioChunkerWorkletUrl = (): string => {
  const workletCode = `
    class AudioChunker extends AudioWorkletProcessor {
      constructor() {
        super();
        this.bufferSize = 1536; // Match Python's chunk size
        this.buffer = new Float32Array(this.bufferSize);
        this.bufferIndex = 0;
      }

      process(inputs, outputs, parameters) {
        const input = inputs[0][0];
        if (!input) return true;

        for (let i = 0; i < input.length; i++) {
          this.buffer[this.bufferIndex++] = input[i];

          if (this.bufferIndex >= this.bufferSize) {
            // Convert to 16-bit integers to match Python's paInt16
            const int16Array = new Int16Array(this.bufferSize);
            for (let j = 0; j < this.bufferSize; j++) {
              int16Array[j] = Math.max(-32768, Math.min(32767, this.buffer[j] * 32768));
            }

            this.port.postMessage(int16Array.buffer);
            this.bufferIndex = 0;
          }
        }
        return true;
      }
    }

    registerProcessor("audio-chunker", AudioChunker);
  `;

  const blob = new Blob([workletCode], { type: "application/javascript" });
  return URL.createObjectURL(blob);
};
