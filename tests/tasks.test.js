const test = require('node:test');
const assert = require('node:assert/strict');
const { moveIncomplete } = require('../task-core');

const source = '2026-10-27';
const target = '2026-10-28';
const task = (values = {}) => ({
  id: 'forensic', title: 'Forensic 스터디 총괄', note: '스터디 준비', date: source,
  categoryId: 'secure', priority: 'high', deadline: '2026-10-27T09:00:00Z',
  done: false, placement: 'bottom', order: 2, createdAt: 10, updatedAt: 20,
  subtasks: [
    { id: 'sample', title: '2차 스터디 과제 표본 만들기', done: false },
    { id: 'practice', title: '4차 실습 문제 만들기', done: true },
    { id: 'feedback', title: '박건님 2차 과제 피드백', done: false },
  ],
  ...values,
});
const options = { createId: () => 'moved-forensic', now: 30 };

test('bulk move leaves completed subtasks today and moves only unfinished subtasks tomorrow', () => {
  const original = task();
  const snapshot = structuredClone(original);
  const { tasks, movedCount } = moveIncomplete([original], source, target, options);
  assert.equal(movedCount, 1);
  assert.equal(tasks.length, 2);
  const [retained, moved] = tasks;
  assert.deepEqual(retained, { ...snapshot, subtasks: [snapshot.subtasks[1]], updatedAt: 30 });
  assert.deepEqual(moved, {
    ...snapshot, id: 'moved-forensic', date: target,
    subtasks: [snapshot.subtasks[0], snapshot.subtasks[2]], createdAt: 30, updatedAt: 30,
  });
  assert.equal(retained.done, false); // Keep the parent checkbox as shown in the example.
  assert.equal(retained.subtasks.filter((sub) => sub.done).length, 1);
  assert.equal(moved.subtasks.filter((sub) => sub.done).length, 0);
  assert.deepEqual(original, snapshot);
  assert.deepEqual(JSON.parse(JSON.stringify(tasks)), tasks);
});

test('moving again preserves completed history without duplicate cards or subtasks', () => {
  const first = moveIncomplete([task()], source, target, options);
  assert.deepEqual(moveIncomplete(first.tasks, source, target, options), { tasks: first.tasks, movedCount: 0 });
  const next = moveIncomplete(first.tasks, target, '2026-10-29', options);
  assert.equal(next.movedCount, 1);
  assert.equal(next.tasks.length, 2);
  assert.equal(next.tasks[0].date, source);
  assert.equal(next.tasks[1].id, 'moved-forensic');
  assert.equal(next.tasks[1].date, '2026-10-29');
  assert.equal(new Set(next.tasks.flatMap((item) => item.subtasks.map((sub) => sub.id))).size, 3);
});

test('tasks with no completed subtasks move intact using their original identity', () => {
  for (const subtasks of [[], [{ id: 'only', title: '남은 일', done: false }]]) {
    const original = task({ subtasks });
    assert.deepEqual(moveIncomplete([original], source, target, options), {
      tasks: [{ ...original, date: target, updatedAt: 30 }], movedCount: 1,
    });
  }
});

test('completed tasks, completed-only subtasks, other dates, routines and linked plans stay put', () => {
  const excluded = [
    task({ id: 'done', done: true }),
    task({ id: 'completed-subs', subtasks: [{ id: 'done-sub', done: true }] }),
    task({ id: 'other-date', date: target }),
    task({ id: 'routine', routineId: 'routine' }),
    task({ id: 'plan', planId: 'plan' }),
    task({ id: 'routine-sub', subtasks: [{ id: 'routine-sub', done: false, routineId: 'routine' }] }),
  ];
  const snapshot = structuredClone(excluded);
  const result = moveIncomplete([...excluded, task()], source, target, options);
  assert.deepEqual(result.tasks.slice(0, excluded.length), snapshot);
  assert.equal(result.movedCount, 1);
  assert.deepEqual(excluded, snapshot);
});

test('selecting the source date does not split, change timestamps or report moved tasks', () => {
  const tasks = [task()];
  const result = moveIncomplete(tasks, source, source, { createId: () => { throw new Error('Should not create a card'); }, now: 30 });
  assert.equal(result.tasks, tasks);
  assert.equal(result.movedCount, 0);
  assert.equal(tasks[0].updatedAt, 20);
});
