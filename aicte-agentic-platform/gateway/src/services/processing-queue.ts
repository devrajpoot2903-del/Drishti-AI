import { Queue } from "bullmq";
import { redis } from "./redis.service";

export const processingQueue = new Queue("drishti-processing", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

export async function queueApplication(applicationId: string) {
  return processingQueue.add(
    "process-application",
    { applicationId },
    {
      jobId: `process-${applicationId}-${Date.now()}`,
    }
  );
}
