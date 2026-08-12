import assert from "node:assert/strict";
import test from "node:test";
import {
  runS3CleanupBatch,
  type S3CleanupTask,
  type S3CleanupTaskRepository,
} from "./s3-cleanup.worker.js";

test("S3 삭제 실패 작업을 남기고 다음 실행에서 정리한다", async () => {
  const tasks: S3CleanupTask[] = [
    {
      cleanupId: 1n,
      objectKey: "audio-guides/rain.mp3",
      attempts: 0,
      lockToken: "token",
    },
  ];
  const failures: string[] = [];
  const repository: S3CleanupTaskRepository = {
    async claimPending() {
      return [...tasks];
    },
    async complete(cleanupId, lockToken) {
      const index = tasks.findIndex(
        (task) => task.cleanupId === cleanupId && task.lockToken === lockToken,
      );
      if (index >= 0) tasks.splice(index, 1);
    },
    async recordFailure(cleanupId, lockToken, error) {
      const task = tasks.find(
        (candidate) =>
          candidate.cleanupId === cleanupId && candidate.lockToken === lockToken,
      );
      if (task) task.attempts += 1;
      failures.push(error);
    },
  };

  let shouldFail = true;
  const removeObject = async () => {
    if (shouldFail) throw new Error("temporary s3 error");
  };

  await runS3CleanupBatch(repository, removeObject);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0]?.attempts, 1);
  assert.deepEqual(failures, ["temporary s3 error"]);

  shouldFail = false;
  await runS3CleanupBatch(repository, removeObject);
  assert.equal(tasks.length, 0);
});
